// End-to-end harness for the host half: mounts the routes on a real HTTP
// server against a real Git repository, then drives them exactly as the
// browser half does.
//
// Every section below is a regression for a specific real failure:
//  - names must be random, never derived from chat content
//  - a workspace already inside a linked worktree must not nest a new pool
//  - the exclude file must be written to the COMMON git dir, or the pool shows
//    up in `git status`
//  - a dirty `master` must still be able to start a session without a worktree
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'

const mod = await import('../index.js')

const routes = new Map()
const fakeCtx = {
  get(name) {
    if (name === 'webServer') return { register: (route) => { routes.set(route.path, route.handler); return () => {} } }
    if (name === 'connection') return { requestRejection: () => undefined }
    if (name === 'workspaceRegistry') return { create: async (path, name) => ({ id: `ws-${path.split('/').pop()}`, title: name }) }
    return undefined
  },
  effect(fn) { return fn() },
  logger: { warn() {} },
}

mod.apply(fakeCtx)

const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  const handler = routes.get(path)
  if (!handler) { res.writeHead(404); res.end('{}'); return }
  await handler(req, res)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const base = `http://127.0.0.1:${port}`

const get = async (path) => {
  const response = await fetch(`${base}${path}`)
  return { status: response.status, body: await response.json() }
}
const post = async (path, payload) => {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { status: response.status, body: await response.json() }
}

// Real repository fixture. Deliberately on `master`, not `main`: the base
// branch logic used to hardcode `main` and broke every `master` repository.
const repo = await mkdtemp(join(tmpdir(), 'bw-test-'))
const repoReal = await realpath(repo)
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
git('init', '-q', '-b', 'master')
git('config', 'user.email', 'test@example.com')
git('config', 'user.name', 'Test')
await writeFile(join(repo, 'README.md'), 'hello\n')
git('add', '.')
git('commit', '-q', '-m', 'init')
git('branch', 'feature/login')

// A second, unrelated repository, to prove a dir-name collision cannot happen
// across repositories and that a plain directory is reported as non-repo.
const plain = await mkdtemp(join(tmpdir(), 'bw-plain-'))

const failures = []
const check = (label, condition, detail) => {
  if (condition) { console.log(`  PASS  ${label}`) } else { console.log(`  FAIL  ${label}${detail === undefined ? '' : ` → ${detail}`}`); failures.push(label) }
}

console.log('\n[1] inspect — a repository whose default branch is master')
const inspected = await get(`/branch-worktree/inspect?cwd=${encodeURIComponent(repo)}`)
check('is a repo', inspected.body.isRepo === true)
check('cwd echoed', inspected.body.cwd === repo, String(inspected.body.cwd))
check('current branch is master', inspected.body.currentBranch === 'master', inspected.body.currentBranch)
check('base branch is master, not a missing main', inspected.body.baseBranch === 'master', inspected.body.baseBranch)
check('gitDir points at the common .git, not .git/worktrees/*', inspected.body.gitDir === join(repoReal, '.git'), inspected.body.gitDir)

console.log('\n[2] a plain directory is reported as non-repo, with a reduced payload')
const notRepo = await get(`/branch-worktree/inspect?cwd=${encodeURIComponent(plain)}`)
check('isRepo false', notRepo.body.isRepo === false, JSON.stringify(notRepo.body))
check('no branch list to crash on', notRepo.body.branches === undefined)

console.log('\n[3] suggest — random readable name, never derived from chat content')
const s1 = await get(`/branch-worktree/suggest?cwd=${encodeURIComponent(repo)}`)
check('suggest ok', s1.body.ok === true, JSON.stringify(s1.body))
check('generated name is namespaced', String(s1.body.branch).startsWith('wt/'), s1.body.branch)
check('name shape is <word>-<word>-<tag>', /^wt\/[a-z]+-[a-z]+-[a-z0-9]{4}$/.test(String(s1.body.branch)), s1.body.branch)
check('worktree path under .worktrees', String(s1.body.worktreePath).includes('/.worktrees/'), s1.body.worktreePath)
check('base branch reported correctly', s1.body.baseBranch === 'master', s1.body.baseBranch)

console.log('\n[4] suggest — a chat draft is NOT used, even when passed as a legacy seed')
const s2 = await get(`/branch-worktree/suggest?cwd=${encodeURIComponent(repo)}&seed=${encodeURIComponent('Fix the login crash!')}`)
check('seed ignored (no chat-derived slug)', !String(s2.body.branch).includes('fix-the-login'), s2.body.branch)
const s3 = await get(`/branch-worktree/suggest?cwd=${encodeURIComponent(repo)}`)
check('two calls do not return the same name', s1.body.branch !== s3.body.branch, `${s1.body.branch} vs ${s3.body.branch}`)

console.log('\n[5] create — automatic branch + worktree on a master repository')
const c1 = await post('/branch-worktree/create', { cwd: repo, branch: '', worktree: true })
check('create ok', c1.body.ok === true, JSON.stringify(c1.body))
check('branch auto-named under wt/', String(c1.body.branch).startsWith('wt/'), c1.body.branch)
check('branch created', c1.body.branchCreated === true)
const c1Dir = String(c1.body.branch).replace('wt/', 'wt-')
check('worktree path returned', String(c1.body.path).includes(`/.worktrees/${c1Dir}`), c1.body.path)
check('worktree registered', c1.body.workspaceId === `ws-${c1Dir}`, c1.body.workspaceId)
check('repositoryRoot is the main checkout', c1.body.repositoryRoot === repoReal || c1.body.repositoryRoot === repo, c1.body.repositoryRoot)

const worktreeList = git('worktree', 'list', '--porcelain')
check('git knows the worktree', worktreeList.includes(`.worktrees/${c1Dir}`), worktreeList)
check('git knows the branch', git('branch', '--list', 'wt/*').includes(String(c1.body.branch)))

console.log('\n[6] create again — a fresh name, never a collision')
const c2 = await post('/branch-worktree/create', { cwd: repo, branch: '', worktree: true })
check('second create ok', c2.body.ok === true, JSON.stringify(c2.body))
check('different name', c2.body.branch !== c1.body.branch, `${c1.body.branch} vs ${c2.body.branch}`)
check('second worktree exists', git('worktree', 'list', '--porcelain').includes(String(c2.body.branch).replace('wt/', '.worktrees/wt-')))

console.log('\n[7] the pool never shows up as untracked (exclude lands in the COMMON git dir)')
check('main checkout status clean', git('status', '--porcelain').trim() === '', JSON.stringify(git('status', '--porcelain')))
const excludeCommon = execFileSync('cat', [join(repoReal, '.git', 'info', 'exclude')], { encoding: 'utf8' })
check('common info/exclude lists the pool', excludeCommon.includes('.worktrees/'), excludeCommon)

console.log('\n[8] a workspace already inside a linked worktree must not nest a new pool')
const inside = join(repoReal, '.worktrees', c1Dir)
const fromInside = await get(`/branch-worktree/inspect?cwd=${encodeURIComponent(inside)}`)
check('inspect from inside a worktree ok', fromInside.body.isRepo === true, JSON.stringify(fromInside.body))
check('repositoryRoot is the MAIN checkout, not the worktree', fromInside.body.repositoryRoot === repoReal, fromInside.body.repositoryRoot)
check('gitDir still the common .git', fromInside.body.gitDir === join(repoReal, '.git'), fromInside.body.gitDir)
check('worktreeRoot is not nested', fromInside.body.worktreeRoot === join(repoReal, '.worktrees'), fromInside.body.worktreeRoot)
const cNested = await post('/branch-worktree/create', { cwd: inside, branch: '', worktree: true })
check('create from inside a worktree ok', cNested.body.ok === true, JSON.stringify(cNested.body))
check('new worktree is a sibling, not nested', !String(cNested.body.path).includes(`/.worktrees/${c1Dir}/.worktrees/`), cNested.body.path)

console.log('\n[9] explicit branch still honored (backwards compatible)')
const c3 = await post('/branch-worktree/create', { cwd: repo, branch: 'feature/login', worktree: true, base: 'master' })
check('explicit branch reused', c3.body.ok === true && c3.body.branch === 'feature/login', JSON.stringify(c3.body))
check('not recreated', c3.body.branchCreated === false)

console.log('\n[10] a DIRTY master can still start a session without a worktree')
await writeFile(join(repo, 'README.md'), 'hello\nuncommitted edit\n')
check('tree is dirty', git('status', '--porcelain').trim() !== '')
const c4 = await post('/branch-worktree/create', { cwd: repo, branch: 'master', worktree: false })
check('in-place on the current branch succeeds despite the dirty tree', c4.body.ok === true, JSON.stringify(c4.body))
check('stayed on master', c4.body.branch === 'master', c4.body.branch)
check('the edit is still there', execFileSync('cat', [join(repo, 'README.md')], { encoding: 'utf8' }).includes('uncommitted edit'))

console.log('\n[11] switching branches in place is still refused while dirty (git would too)')
const c5 = await post('/branch-worktree/create', { cwd: repo, branch: 'feature/login', worktree: false })
check('refused', c5.body.ok === false, JSON.stringify(c5.body))
check('specific error code', c5.body.code === 'worktree-dirty', c5.body.code)

console.log('\n[12] main checkout is never handed back as a worktree')
const c6 = await post('/branch-worktree/create', { cwd: repo, branch: 'master', worktree: true, base: 'master' })
check('refused instead of silently reusing the main checkout', c6.body.ok === false, JSON.stringify(c6.body))
check('specific error code', c6.body.code === 'branch-is-main-checkout', c6.body.code)

console.log('\n[13] pool still excluded from git status after all of that')
check('status shows only the edited file', git('status', '--porcelain').trim() === 'M README.md', JSON.stringify(git('status', '--porcelain')))

server.close()
await rm(repo, { recursive: true, force: true })
await rm(plain, { recursive: true, force: true })
console.log(failures.length === 0 ? '\nALL CHECKS PASSED\n' : `\n${failures.length} FAILED: ${failures.join(', ')}\n`)
process.exit(failures.length === 0 ? 0 : 1)
