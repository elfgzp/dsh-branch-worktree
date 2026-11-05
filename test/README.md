# Tests

Two harnesses, both driving the real plugin code.

## `host.test.mjs`

Mounts the Host routes on a real HTTP server against real Git repositories and
drives them exactly as the browser half does. Covers, among others:

- a `master`-defaulted repository gets `master` as its base branch (the code
  used to hardcode `main`)
- `gitDir` is the **common** `.git`, so the `.worktrees/` exclusion actually
  applies (writing it to `.git/worktrees/<name>/info/exclude` silently does not)
- a workspace that is already inside a linked worktree reports the **main**
  checkout as its repository root and does not nest a second pool
- a dirty `master` can still start a session **without** a worktree
- generated names are random and never derived from the conversation

```sh
node test/host.test.mjs
```

No dependencies beyond Node and Git.

## `client.test.mjs`

Real React 18 + jsdom, loading the shipped `client.js` and mounting its slot
occupants against the real Host routes. Covers:

- the New Session chip surviving a switch to a non-Git workspace and coming back
- the bottom status bar appearing only outside a worktree
- the status bar creating a worktree, switching the Workspace, and prompting the
  model to migrate files and to point teammates/subagents at the new path

```sh
npm install          # react, react-dom, jsdom (dev only)
node test/client.test.mjs
```
