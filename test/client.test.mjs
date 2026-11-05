// Client-half harness: REAL React 18 + jsdom against the REAL Host routes.
//
// Regression targets, each a bug that actually shipped:
//  1. switching the New Session workspace to a NON-Git directory crashed the
//     hero slot (`repo.branches.map` of undefined) and the chip never came back
//  2. the status bar must appear for a conversation sitting in the main
//     checkout, and disappear once the path is already a worktree
//  3. clicking it must create a worktree, switch the Workspace, and hand the
//     model a prompt naming the new path
import fs from 'node:fs'
import { JSDOM } from 'jsdom'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
const CLIENT = `${REPO}/client.js`
const HOST = `${REPO}/index.js`

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: 'http://127.0.0.1:50549/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.navigator = dom.window.navigator
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Node = dom.window.Node
globalThis.getComputedStyle = dom.window.getComputedStyle
globalThis.localStorage = dom.window.localStorage
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const errors = []
const origError = console.error
console.error = (...a) => { errors.push(a.map(String).join(' ')); origError('[REACT]', ...a) }

// --- real Host routes ---
const mod = await import(HOST)
const routes = new Map()
mod.apply({
  get: (n) => n === 'webServer' ? { register: (r) => { routes.set(r.path, r.handler); return () => {} } }
    : n === 'connection' ? { requestRejection: () => undefined }
    : n === 'workspaceRegistry' ? { create: async (p) => ({ id: `ws-${p.split('/').pop()}` }) } : undefined,
  effect: (f) => f(), logger: { warn() {} },
})
const server = createServer(async (req, res) => {
  const h = routes.get(new URL(req.url, 'http://x').pathname)
  if (!h) { res.writeHead(404); res.end('{}'); return }
  await h(req, res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
globalThis.location = { origin: `http://127.0.0.1:${server.address().port}` }
// Do NOT overwrite globalThis.fetch here: the client reads it from the global
// scope, and a wrapper that calls `fetch(...)` inside would resolve to the
// wrapper itself (infinite recursion, RangeError) instead of the real one.

// --- primitives stand-ins ---
const primitives = {
  Menu: (p) => React.createElement('div', { 'data-menu': '1' }, p.anchor, p.open ? p.children : null),
  Button: (p) => React.createElement('button', { disabled: p.disabled, onClick: p.onClick }, p.children),
  Switch: (p) => React.createElement('input', { type: 'checkbox', checked: p.checked, onChange: (e) => p.onChange(e.target.checked) }),
  IconBranchOutlineRegular: () => React.createElement('span', {}, 'B'),
  IconWorkspaceTreeOutlineRegular: () => React.createElement('span', {}, 'W'),
}

// --- load the real client bundle ---
const registered = {}
dom.window.__ModuleLoader__ = { load(spec) { spec.factory((id) => id === 'react' ? React : primitives) } }
new Function('window', 'document', 'globalThis', fs.readFileSync(CLIENT, 'utf8'))(dom.window, dom.window.document, globalThis)

const started = []
const plugin = {
  get: (n) => n === 'uiWorkspace' ? { startSession: (...a) => started.push(a) } : undefined,
  effect: (fn) => (typeof fn === 'function' ? fn() : undefined),
  locale: { register: () => () => {} },
  slots: { inject: (key, fn) => fn(), register: (opts, C) => { registered[opts.name] = C; return () => {} } },
}
// re-run apply with the stub context
let applied = null
dom.window.__ModuleLoader__ = { load(spec) { spec.factory((id) => id === 'react' ? React : primitives) } }
new Function('window', 'document', 'globalThis', fs.readFileSync(CLIENT, 'utf8'))(dom.window, dom.window.document, globalThis)
plugin.slots.inject = (key, fn) => fn()
// find the returned plugin object
const mod2 = dom.window.__ModuleLoader__
let captured = null
dom.window.__ModuleLoader__ = { load(spec) { captured = spec.factory((id) => id === 'react' ? React : primitives) } }
new Function('window', 'document', 'globalThis', fs.readFileSync(CLIENT, 'utf8'))(dom.window, dom.window.document, globalThis)
captured.apply(plugin)


/** Pull the shipped zh dictionary straight out of client.js. */
function loadDict() {
  const src = fs.readFileSync(CLIENT, 'utf8')
  const start = src.indexOf('zh: {')
  const end = src.indexOf('\n      },', start)
  const body = src.slice(start, end)
  const dict = {}
  const re = /(\w+):\s*('(?:[^'\\]|\\.)*'(?:\s*\+\s*'(?:[^'\\]|\\.)*')*)/g
  let m
  while ((m = re.exec(body)) !== null) {
    const value = m[2].split(/\s*\+\s*/).map((piece) => {
      const inner = piece.trim().replace(/^'/, '').replace(/'$/, '')
      return inner.replace(/\\n/g, '\n').replace(/\\'/g, "'")
    }).join('')
    dict[m[1]] = value
  }
  return dict
}

// --- fixtures ---
const repoDir = await mkdtemp(join(tmpdir(), 'bwc-'))
const git = (...a) => execFileSync('git', a, { cwd: repoDir, encoding: 'utf8' })
git('init', '-q', '-b', 'master')
git('config', 'user.email', 't@e.c'); git('config', 'user.name', 'T')
await writeFile(join(repoDir, 'a.txt'), 'x\n')
git('add', '.'); git('commit', '-q', '-m', 'init')
const plainDir = await mkdtemp(join(tmpdir(), 'bwc-plain-'))
await mkdir(join(plainDir, 'sub'))

const failures = []
const check = (label, cond, detail) => {
  if (cond) console.log(`  PASS  ${label}`)
  else { console.log(`  FAIL  ${label}${detail === undefined ? '' : ` → ${detail}`}`); failures.push(label) }
}
const settle = async (ms = 400) => { await React.act(async () => { await new Promise((r) => setTimeout(r, ms)) }) }

/**
 * Wait for a condition instead of sleeping a fixed amount.
 *
 * `git worktree add` plus a round-trip through the Host occasionally takes
 * longer than any fixed budget, which made this suite flaky — the assertion for
 * "startSession was called" failed purely on timing.
 */
async function waitFor(predicate, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await settle(100)
  }
  return predicate()
}

// --- harness for one slot at a time ---
async function mount(slotName, state) {
  const C = registered[slotName]
  if (C === undefined) throw new Error(`slot ${slotName} was not registered`)
  const useSessions = (sel) => sel({ byId: state.sessions, ids: Object.keys(state.sessions), phase: 'ready' })
  const useWorkspaces = (sel) => sel({ phase: 'ready', items: state.workspaces, archivedSessionIds: [], pinnedSessionIds: [] })
  const useInput = (sel) => sel({ draft: state.draft ?? '' })
  // Use the REAL zh dictionary text, not identity: the assertions below check
  // the prompt's wording, and an identity `t` would only ever return the key.
  const dict = loadDict()
  const t = (k) => (typeof dict[k] === 'string' ? dict[k] : k)
  const el = document.createElement('div')
  document.body.appendChild(el)
  const root = createRoot(el)
  await React.act(async () => {
    root.render(React.createElement(C, { t, sessionId: state.sessionId, useSessions, useWorkspaces, useInput }))
  })
  await settle()
  return { el, root }
}

console.log('\n[1] hero chip — Git repo, non-Git dir, back to Git repo')
localStorage.clear()
{
  const s1 = { sessionId: 's1', sessions: { s1: { cwd: repoDir } }, workspaces: [{ workspaceId: 'w1', path: repoDir, sessionIds: ['s1'] }], draft: 'fix the login crash' }
  const a = await mount('conversation.hero.options', s1)
  check('chip visible in a repo', a.el.querySelector('button[aria-haspopup="menu"]') !== null)
  await React.act(async () => { a.root.unmount() })
}
{
  localStorage.setItem('dsh.sessions.current', JSON.stringify({ sessionId: 's2' }))
  const s2 = { sessionId: 's2', sessions: { s2: { cwd: plainDir } }, workspaces: [{ workspaceId: 'w2', path: plainDir, sessionIds: ['s2'] }] }
  const b = await mount('conversation.hero.options', s2)
  check('no crash on a non-repo payload', !errors.some((e) => e.includes('Cannot read properties of undefined')), errors.slice(-2).join(' | '))
  check('chip hidden outside a repo', b.el.querySelector('button[aria-haspopup="menu"]') === null)
  await React.act(async () => { b.root.unmount() })
}
{
  const s3 = { sessionId: 's3', sessions: { s3: { cwd: repoDir } }, workspaces: [{ workspaceId: 'w1', path: repoDir, sessionIds: ['s3'] }] }
  const c = await mount('conversation.hero.options', s3)
  check('chip comes BACK when switching back to a repo', c.el.querySelector('button[aria-haspopup="menu"]') !== null)
  await React.act(async () => { c.root.unmount() })
}

console.log('\n[2] status bar — hidden when already in a worktree, shown on the main checkout')
{
  localStorage.setItem('dsh.sessions.current', JSON.stringify({ sessionId: 's4' }))
  const wtPath = join(repoDir, '.worktrees', 'wt-some-branch')
  const s4 = { sessions: { s4: { cwd: wtPath } }, workspaces: [{ workspaceId: 'w4', path: wtPath, sessionIds: ['s4'] }] }
  const d = await mount('shell.bottom', s4)
  check('hidden inside .worktrees/', d.el.textContent.trim() === '', d.el.textContent)
  await React.act(async () => { d.root.unmount() })
}
{
  localStorage.setItem('dsh.sessions.current', JSON.stringify({ sessionId: 's5' }))
  const s5 = { sessions: { s5: { cwd: repoDir } }, workspaces: [{ workspaceId: 'w5', path: repoDir, sessionIds: ['s5'] }] }
  const e = await mount('shell.bottom', s5)
  const btn = [...e.el.querySelectorAll('button')].find((b) => (b.textContent || '').includes('worktree'))
  check('shown on the main checkout', btn !== undefined, e.el.textContent)
  // The bar shortens long paths to `…/last/three/segments` so the tail (which
  // identifies the checkout) stays visible; assert on the tail, not the prefix.
  const tail = repoDir.split('/').slice(-3).join('/')
  check('path is displayed (tail readable)', e.el.textContent.includes(tail), e.el.textContent)
  await React.act(async () => { e.root.unmount() })
}

console.log('\n[3] status bar — clicking creates a worktree, switches Workspace, prompts migration')
{
  localStorage.setItem('dsh.sessions.current', JSON.stringify({ sessionId: 's6' }))
  const s6 = { sessions: { s6: { cwd: repoDir } }, workspaces: [{ workspaceId: 'w6', path: repoDir, sessionIds: ['s6'] }] }
  const f = await mount('shell.bottom', s6)
  let btn = [...f.el.querySelectorAll('button')].find((b) => (b.textContent || '').includes('worktree'))
  // The stub Button forwards onClick directly (real primitives do too), so read
  // it off the element React attached rather than synthesising a DOM event.
  if (btn === undefined) throw new Error('switch button not found: ' + f.el.innerHTML.slice(0, 300))
  await React.act(async () => { btn.click() })
  await waitFor(() => started.length > 0)
  if (failures.length !== 0 && f.el.textContent.includes('error')) {
    console.log('      bar text after click:', f.el.textContent)
  }

  const list = git('worktree', 'list', '--porcelain')
  const created = list.split('\n').filter((l) => l.startsWith('worktree ') && l.includes('.worktrees/wt-'))
  check('a worktree was created', created.length === 1, list)
  check('startSession was called', started.length === 1, JSON.stringify(started))
  const [wsId, options] = started[0] ?? []
  check('switched to the new workspace', String(wsId).startsWith('ws-wt-'), String(wsId))
  const prompt = String(options?.prompt ?? '')
  check('migration prompt carries the new path', prompt.includes('.worktrees/wt-'), prompt)
  check('migration prompt mentions teammates/subagents', /teammate|subagent|团队成员|子智能体/i.test(prompt), prompt)
  await React.act(async () => { f.root.unmount() })
}

server.close()
await rm(repoDir, { recursive: true, force: true })
await rm(plainDir, { recursive: true, force: true })
console.log(failures.length === 0 ? '\nALL CHECKS PASSED\n' : `\n${failures.length} FAILED: ${failures.join(', ')}\n`)
process.exit(failures.length === 0 ? 0 : 1)
