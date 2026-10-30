/**
 * Host half of the branch/worktree New-Session control.
 *
 * Owns the Git reads and the one mutation the browser half needs: create (or
 * reuse) a worktree for a chosen branch and register a Workspace over it, so
 * the ordinary Session-create path starts the conversation inside the
 * checkout. Also supports the toggle-off path, which checks the branch out in
 * the current checkout when that checkout is clean.
 *
 * Every route runs behind the composition's connection trust fence; trust is
 * asked first, wire validation second, Git last.
 *
 * @module dsh-branch-worktree
 */

import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'

/** Cordis plugin name; stable per composition. */
export const name = 'branch-worktree'

/** Hard dependencies of the web composition. */
export const inject = ['webServer', 'connection', 'workspaceRegistry']

/** Route prefix owned by this plugin. */
const PREFIX = '/branch-worktree'

/** Per-Git-command deadline in milliseconds. */
const GIT_TIMEOUT_MS = 30_000

/** Worktree pool directory inside the repository, kept out of git status. */
const WORKTREE_DIRNAME = '.worktrees'

/** Branch names this plugin accepts: a conservative single ref segment path. */
const BRANCH_PATTERN = /^[A-Za-z0-9._\/-]{1,120}$/

/** Environment stripped from every Git child: repository selectors only. */
const GIT_ENV_OVERRIDES = {
  GIT_DIR: undefined,
  GIT_WORK_TREE: undefined,
  GIT_COMMON_DIR: undefined,
  GIT_INDEX_FILE: undefined,
  GIT_CEILING_DIRECTORIES: undefined,
  GIT_PREFIX: undefined,
}

/**
 * Run one Git command with literal argv (never a shell) and a deadline.
 * @param {string} cwd - working directory the command runs in.
 * @param {readonly string[]} args - argv after `git`.
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>} bounded outcome.
 */
function git(cwd, args) {
  return new Promise((resolve) => {
    execFile(
      'git',
      [...args],
      {
        cwd,
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true,
        env: { ...process.env, ...GIT_ENV_OVERRIDES },
      },
      (error, stdout, stderr) => {
        const code = error === null ? 0 : (typeof error.code === 'number' ? error.code : 1)
        resolve({ code, stdout: String(stdout ?? ''), stderr: String(stderr ?? '') })
      },
    )
  })
}

/**
 * Run Git and fail with its own stderr on a non-zero exit.
 * @param {string} cwd - working directory.
 * @param {readonly string[]} args - argv after `git`.
 * @returns {Promise<string>} trimmed stdout.
 */
async function gitOrFail(cwd, args) {
  const result = await git(cwd, args)
  if (result.code !== 0) {
    const detail = result.stderr.trim().split('\n').slice(-3).join(' ')
    throw new Error(detail === '' ? `git ${args[0]} failed` : detail)
  }
  return result.stdout
}

/** Whether a path is an existing directory. */
async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

/** Validate one requested branch name. */
function validateBranch(branch) {
  if (typeof branch !== 'string' || !BRANCH_PATTERN.test(branch)) {
    throw new BranchWorktreeError('invalid-branch', 'branch names accept letters, digits and . _ / - only (1-120 characters)')
  }
  if (branch.startsWith('-') || branch.endsWith('/') || branch.includes('..') || branch.includes('//')) {
    throw new BranchWorktreeError('invalid-branch', 'that branch name is not a valid Git ref')
  }
  return branch
}

/** Convert a branch name into the worktree's directory name. */
function worktreeDirName(branch) {
  return branch.replaceAll('/', '-')
}

/** One structured, client-displayable failure. */
export class BranchWorktreeError extends Error {
  /**
   * @param {string} code - stable machine code the browser half maps to copy.
   * @param {string} message - human-readable reason.
   */
  constructor(code, message) {
    super(message)
    this.name = 'BranchWorktreeError'
    this.code = code
  }
}

/**
 * Read the repository facts the picker needs for one directory.
 * @param {string} cwd - a directory inside the repository.
 * @returns {Promise<object>} status payload.
 */
async function inspectRepository(cwd) {
  if (typeof cwd !== 'string' || !isAbsolute(cwd) || !(await isDirectory(cwd))) {
    throw new BranchWorktreeError('not-a-directory', 'the workspace directory is unavailable')
  }
  const probe = await git(cwd, ['rev-parse', '--show-toplevel'])
  if (probe.code !== 0) {
    return { isRepo: false, cwd }
  }
  const repositoryRoot = probe.stdout.trim()
  const gitDir = (await gitOrFail(repositoryRoot, ['rev-parse', '--absolute-git-dir'])).trim()

  const currentBranch = (await git(repositoryRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout.trim() || 'HEAD'

  // Local branches, newest commit first; the checked-out ones are marked so the
  // picker never offers a branch another checkout already holds.
  const refs = await gitOrFail(repositoryRoot, [
    'for-each-ref',
    '--sort=-committerdate',
    '--format=%(refname:short)',
    'refs/heads',
  ])
  const branches = refs.split('\n').map((line) => line.trim()).filter((line) => line !== '')

  const worktreesOutput = await gitOrFail(repositoryRoot, ['worktree', 'list', '--porcelain'])
  const worktrees = []
  let pending = {}
  for (const line of worktreesOutput.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (pending.path !== undefined) worktrees.push(pending)
      pending = { path: line.slice('worktree '.length).trim(), branch: '', head: '' }
    } else if (line.startsWith('branch ') && pending.path !== undefined) {
      pending.branch = line.slice('branch '.length).trim().replace('refs/heads/', '')
    } else if (line.startsWith('HEAD ') && pending.path !== undefined) {
      pending.head = line.slice('HEAD '.length).trim()
    } else if (line === 'detached' && pending.path !== undefined) {
      pending.branch = '(detached)'
    }
  }
  if (pending.path !== undefined) worktrees.push(pending)

  const checkedOut = new Map()
  for (const entry of worktrees) {
    if (entry.branch !== '' && !entry.branch.startsWith('(')) checkedOut.set(entry.branch, entry.path)
  }

  // The branch a new worktree should start from: the repository's own default
  // when it exists, else whatever is checked out here.
  const symbolic = await git(repositoryRoot, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'])
  const originHead = symbolic.code === 0 ? symbolic.stdout.trim().replace('origin/', '') : ''
  const base = branches.includes(originHead) ? originHead : (branches.includes('main') ? 'main' : currentBranch)

  const status = await git(repositoryRoot, ['status', '--porcelain'])
  const dirty = status.stdout.trim() !== ''

  return {
    isRepo: true,
    cwd,
    repositoryRoot,
    gitDir,
    currentBranch,
    baseBranch: base,
    dirty,
    worktreeRoot: join(repositoryRoot, WORKTREE_DIRNAME),
    branches: branches.map((branch) => ({
      name: branch,
      current: branch === currentBranch,
      checkedOutAt: checkedOut.get(branch) ?? null,
    })),
    worktrees,
  }
}

/** Append the worktree pool to `.git/info/exclude` once, so it never shows as untracked. */
async function excludeWorktreePool(gitDir, entry) {
  const { readFile, writeFile, mkdir } = await import('node:fs/promises')
  const infoDir = join(gitDir, 'info')
  const excludeFile = join(infoDir, 'exclude')
  await mkdir(infoDir, { recursive: true })
  let content = ''
  try {
    content = await readFile(excludeFile, 'utf8')
  } catch {
    content = ''
  }
  const lines = content.split('\n').map((line) => line.trim())
  if (lines.includes(entry)) return
  const marker = '# added by dsh-branch-worktree (auto-created worktrees live here)'
  const next = content === '' || content.endsWith('\n') ? `${content}${marker}\n${entry}\n` : `${content}\n${marker}\n${entry}\n`
  await writeFile(excludeFile, next, 'utf8')
}

/**
 * Create or reuse a worktree for one branch and return its canonical facts.
 * @param {object} status - repository status from {@link inspectRepository}.
 * @param {string} branch - validated target branch.
 * @param {string} baseBranch - branch a newly created target branch starts from.
 * @returns {Promise<object>} the checkout facts.
 */
async function ensureWorktree(status, branch, baseBranch) {
  const existing = status.worktrees.find((entry) => entry.branch === branch)
  if (existing !== undefined) {
    return { path: existing.path, branch, created: false, reusedWorktree: true }
  }

  const heldElsewhere = status.branches.find((entry) => entry.name === branch)?.checkedOutAt
  if (heldElsewhere !== null && heldElsewhere !== undefined) {
    throw new BranchWorktreeError(
      'branch-checked-out',
      `branch "${branch}" is already checked out at ${heldElsewhere}`,
    )
  }

  const { mkdir } = await import('node:fs/promises')
  const root = status.worktreeRoot
  await mkdir(root, { recursive: true })
  await excludeWorktreePool(status.gitDir, `${WORKTREE_DIRNAME}/`)

  const path = join(root, worktreeDirName(branch))
  if (await isDirectory(path)) {
    throw new BranchWorktreeError('path-exists', `the worktree directory already exists: ${path}`)
  }

  const branchExists = status.branches.some((entry) => entry.name === branch)
  const args = branchExists
    ? ['worktree', 'add', path, branch]
    : ['worktree', 'add', '-b', branch, path, validateBranch(baseBranch)]
  const added = await git(status.repositoryRoot, args)
  if (added.code !== 0) {
    throw new BranchWorktreeError('git-failed', added.stderr.trim().split('\n').slice(-3).join(' ') || 'git worktree add failed')
  }
  return { path, branch, created: !branchExists, reusedWorktree: false }
}

/** Check one branch out in the repository's own checkout; requires a clean tree. */
async function checkoutInPlace(status, branch) {
  if (status.dirty) {
    throw new BranchWorktreeError(
      'worktree-dirty',
      'this checkout has uncommitted changes; enable "create worktree" or commit them first',
    )
  }
  if (status.currentBranch === branch) {
    return { path: status.repositoryRoot, branch, created: false, reusedWorktree: false }
  }
  const branchExists = status.branches.some((entry) => entry.name === branch)
  const args = branchExists ? ['checkout', branch] : ['checkout', '-b', branch, validateBranch(status.baseBranch)]
  const switched = await git(status.repositoryRoot, args)
  if (switched.code !== 0) {
    throw new BranchWorktreeError('git-failed', switched.stderr.trim().split('\n').slice(-3).join(' ') || 'git checkout failed')
  }
  return { path: status.repositoryRoot, branch, created: !branchExists, reusedWorktree: false }
}

/** Write one JSON response. */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

/** Read one bounded request body. */
function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('request body is too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', reject)
  })
}

/**
 * Register the plugin's routes on the composition's web server.
 * @param {import('@deepseek-ai/cordis').Context} ctx - host context.
 */
export function apply(ctx) {
  const webServer = ctx.get('webServer')
  const connection = ctx.get('connection')
  const workspaceRegistry = ctx.get('workspaceRegistry')
  if (webServer === undefined || connection === undefined || workspaceRegistry === undefined) {
    throw new Error('branch-worktree: the web composition (webServer, connection, workspaceRegistry) is required')
  }

  /** Reject a request the connection trust fence refuses. */
  const rejected = (req, res) => {
    const rejection = connection.requestRejection({ headers: req.headers })
    if (rejection === undefined) return false
    sendJson(res, rejection, { code: 'unauthorized', message: 'request rejected by the connection trust fence' })
    return true
  }

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: `${PREFIX}/inspect`,
    async handler(req, res) {
      if (rejected(req, res)) return
      if (req.method !== 'GET') {
        sendJson(res, 405, { code: 'bad-request', message: 'GET required' })
        return
      }
      const url = new URL(req.url ?? '/', 'http://dsh.invalid')
      const cwd = url.searchParams.get('cwd') ?? ''
      try {
        sendJson(res, 200, { ok: true, ...(await inspectRepository(cwd)) })
      } catch (error) {
        const known = error instanceof BranchWorktreeError
        sendJson(res, known ? 400 : 500, {
          ok: false,
          isRepo: false,
          code: known ? error.code : 'inspect-failed',
          message: error instanceof Error ? error.message : String(error),
        })
      }
    },
  }), 'branch-worktree: inspect route')

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: `${PREFIX}/create`,
    async handler(req, res) {
      if (rejected(req, res)) return
      if (req.method !== 'POST') {
        sendJson(res, 405, { code: 'bad-request', message: 'POST required' })
        return
      }
      const essence = String(req.headers['content-type'] ?? '').split(';', 1)[0]?.trim().toLowerCase()
      if (essence !== 'application/json') {
        sendJson(res, 415, { code: 'bad-request', message: 'content-type must be application/json' })
        return
      }
      let body
      try {
        body = JSON.parse(await readBody(req))
      } catch {
        sendJson(res, 400, { code: 'bad-request', message: 'request body must be JSON' })
        return
      }
      if (typeof body !== 'object' || body === null) {
        sendJson(res, 400, { code: 'bad-request', message: 'request body must be an object' })
        return
      }
      try {
        const cwd = body.cwd
        const branch = validateBranch(body.branch)
        const useWorktree = body.worktree !== false
        const status = await inspectRepository(cwd)
        if (status.isRepo !== true) {
          throw new BranchWorktreeError('not-a-repo', 'the workspace directory is not inside a Git repository')
        }
        const baseBranch = validateBranch(typeof body.base === 'string' && body.base !== '' ? body.base : status.baseBranch)
        const checkout = useWorktree
          ? await ensureWorktree(status, branch, baseBranch)
          : await checkoutInPlace(status, branch)

        // Register the checkout as a Workspace so the ordinary Session-create
        // path can start the conversation inside it. `create` canonicalizes the
        // directory and returns the existing registration for a repeated
        // request, so asking again never duplicates a sidebar group.
        const workspaceId = (await workspaceRegistry.create(checkout.path, branch)).id

        sendJson(res, 200, {
          ok: true,
          path: checkout.path,
          branch: checkout.branch,
          branchCreated: checkout.created,
          reusedWorktree: checkout.reusedWorktree,
          worktree: useWorktree,
          repositoryRoot: status.repositoryRoot,
          workspaceId,
        })
      } catch (error) {
        const known = error instanceof BranchWorktreeError
        ctx.logger.warn?.(`branch-worktree: ${error instanceof Error ? error.message : String(error)}`)
        sendJson(res, known ? 400 : 500, {
          ok: false,
          code: known ? error.code : 'create-failed',
          message: error instanceof Error ? error.message : String(error),
        })
      }
    },
  }), 'branch-worktree: create route')
}
