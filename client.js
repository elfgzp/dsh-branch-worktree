window.__ModuleLoader__.load({
  id: 'dsh-branch-worktree',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
    const {
      Menu,
      Button,
      Switch,
      IconBranchOutlineRegular,
      IconWorkspaceTreeOutlineRegular,
    } = primitives

    /** Locale namespace owned by this plugin. */
    const NS = 'branch-worktree'

    /** Route prefix owned by the Host half. */
    const PREFIX = '/branch-worktree'

    /** Copy, one dictionary per shipped locale. */
    const DICTS = {
      en: {
        chip: 'Branch',
        badgeWorktree: 'worktree',
        branchLabel: 'Branch',
        newBranchLabel: 'New branch',
        newBranchPlaceholder: 'or type a new branch name',
        baseLabel: 'based on',
        worktreeOn: 'Create worktree',
        worktreeHint: 'A separate checkout under .worktrees/, so your current files stay untouched.',
        inPlaceHint: 'Switch your current checkout instead. Uncommitted changes block the switch.',
        start: 'Start here',
        loading: 'Reading the repository…',
        creating: 'Preparing…',
        currentTag: 'current',
        usedTag: 'in use',
        newBranchHint: 'A new branch is created from the chosen base.',
        reuseHint: 'This branch exists, so it is checked out into the worktree as-is.',
        errorNotRepo: 'This workspace is not inside a Git repository.',
        errorInvalidBranch: 'Branch names accept letters, digits and . _ / - only.',
        errorCheckedOut: 'That branch is already checked out in another worktree.',
        errorPathExists: 'A worktree directory with that name already exists.',
        errorDirty: 'Your current checkout has uncommitted changes; keep the worktree option on, or commit them first.',
        errorGit: 'Git refused the operation.',
        errorUnknown: 'The checkout could not be prepared.',
      },
      zh: {
        chip: '分支',
        badgeWorktree: 'worktree',
        branchLabel: '分支',
        newBranchLabel: '新建分支',
        newBranchPlaceholder: '或输入新分支名',
        baseLabel: '基于',
        worktreeOn: '创建 worktree',
        worktreeHint: '在 .worktrees/ 下新建独立检出，当前文件保持原样。',
        inPlaceHint: '改为切换当前工作区；有未提交改动时会拒绝。',
        start: '从这里开始',
        loading: '正在读取仓库…',
        creating: '正在准备…',
        currentTag: '当前',
        usedTag: '已占用',
        newBranchHint: '将基于所选分支新建一个分支。',
        reuseHint: '该分支已存在，直接检出到 worktree，不新建分支。',
        errorNotRepo: '这个工作区不在 Git 仓库内。',
        errorInvalidBranch: '分支名只能包含字母、数字和 . _ / -。',
        errorCheckedOut: '该分支已经在另一个 worktree 中检出。',
        errorPathExists: '同名的 worktree 目录已存在。',
        errorDirty: '当前工作区有未提交改动；请保留 worktree 开关，或先提交改动。',
        errorGit: 'Git 拒绝了这个操作。',
        errorUnknown: '无法准备检出目录。',
      },
    }

    /** Host error code → dictionary key. */
    const ERROR_KEY = {
      'not-a-repo': 'errorNotRepo',
      'not-a-directory': 'errorNotRepo',
      'invalid-branch': 'errorInvalidBranch',
      'branch-checked-out': 'errorCheckedOut',
      'path-exists': 'errorPathExists',
      'worktree-dirty': 'errorDirty',
      'git-failed': 'errorGit',
    }

    /** Styling that mirrors the shipped workspace and preset chips. */
    const S = {
      chip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        minHeight: 28,
        maxWidth: 200,
        padding: '0 8px',
        border: 'none',
        borderRadius: 16,
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 13,
        lineHeight: '20px',
        fontWeight: 500,
        cursor: 'pointer',
        minWidth: 0,
      },
      /**
       * Worktree mode has to be legible from the row itself, without opening
       * the dropdown: the chip keeps a filled surface and a brand-tinted
       * outline for as long as the worktree switch is on.
       */
      chipWorktree: {
        background: 'var(--dsw-alias-bg-layer-2)',
        boxShadow: 'inset 0 0 0 0.5px var(--dsw-alias-border-l2)',
      },
      chipLabel: {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      /** Small uppercase marker that names the active checkout strategy. */
      badge: {
        flex: 'none',
        padding: '0 5px',
        borderRadius: 6,
        background: 'var(--dsw-alias-brand-primary)',
        color: 'var(--dsw-alias-bg-base)',
        fontSize: 10,
        lineHeight: '15px',
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
      panel: { display: 'grid', gap: 8, minWidth: 288, padding: '10px 12px 12px' },
      field: { display: 'grid', gap: 4, minWidth: 0 },
      fieldLabel: {
        fontSize: 12,
        lineHeight: '18px',
        fontWeight: 500,
        color: 'var(--dsw-alias-label-secondary)',
      },
      input: {
        boxSizing: 'border-box',
        width: '100%',
        height: 30,
        padding: '0 8px',
        border: '0.5px solid var(--dsw-alias-border-l2)',
        borderRadius: 7,
        background: 'var(--dsw-alias-bg-layer-1)',
        fontSize: 13,
        lineHeight: '20px',
        color: 'var(--dsw-alias-label-primary)',
        outline: 'none',
      },
      select: {
        boxSizing: 'border-box',
        width: '100%',
        height: 30,
        padding: '0 8px',
        border: '0.5px solid var(--dsw-alias-border-l2)',
        borderRadius: 7,
        background: 'var(--dsw-alias-bg-layer-1)',
        fontSize: 13,
        lineHeight: '20px',
        color: 'var(--dsw-alias-label-primary)',
      },
      hint: {
        margin: 0,
        fontSize: 11,
        lineHeight: '16px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      error: {
        margin: 0,
        fontSize: 11,
        lineHeight: '16px',
        color: 'var(--dsw-alias-state-error-primary)',
      },
      divider: {
        height: 1,
        background: 'var(--dsw-alias-border-l1)',
        margin: '2px 0',
      },
      footer: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
      toggleRow: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
    }

    /**
     * Re-order the New Session row so this chip sits between the workspace chip
     * and the agent-mode chip.
     *
     * The row exposes no slot between them: `conversation.hero.workspace` and
     * `conversation.hero.agentPreset` are `display: contents` wrappers, and the
     * only documented home for an extra control is `conversation.hero.options`,
     * which is right-aligned at the end of the row. Making that group
     * transparent and ordering its occupant between the two shipped chips puts
     * the control where the workflow reads naturally, without moving another
     * plugin's nodes or relying on their classes.
     *
     * Scoped by `:has()` to the New Session row only, so conversation views are
     * untouched; if a future DSH adds a real slot in that position, this block
     * simply stops mattering.
     */
    const ORDER_CSS = `
[class*="heroWorkspaceRow"]:has(> [data-slot="conversation.hero.workspace"]) > [class*="heroOptions"] {
  display: contents;
}
[class*="heroWorkspaceRow"]:has(> [data-slot="conversation.hero.workspace"]) > [class*="heroOptions"] > * {
  order: 2;
}
[class*="heroWorkspaceRow"]:has(> [data-slot="conversation.hero.workspace"]) > [data-slot="conversation.hero.agentPreset"] > * {
  order: 3;
}
`

    /** Inject the layout stylesheet once per document. */
    function ensureOrderCss() {
      if (typeof document === 'undefined') return
      const id = 'dsh-branch-worktree-order'
      const existing = document.getElementById(id)
      if (existing !== null) {
        if (existing.textContent !== ORDER_CSS) existing.textContent = ORDER_CSS
        return
      }
      const style = document.createElement('style')
      style.id = id
      style.dataset.plugin = 'dsh-branch-worktree'
      style.textContent = ORDER_CSS
      document.head.appendChild(style)
    }

    /** Resolve the browser's Host base with the null-origin fallback. */
    function hostBase() {
      const origin = globalThis.location && globalThis.location.origin
      return origin !== undefined && origin !== 'null' ? origin : 'http://dsh.internal'
    }

    /** Build one structured failure from a Host response. */
    function httpError(status, code, message) {
      const error = new Error(message || `HTTP ${status}`)
      error.code = code
      error.status = status
      return error
    }

    /** Read the repository facts for one directory. */
    async function inspect(cwd) {
      const url = new URL(`${PREFIX}/inspect`, hostBase())
      url.searchParams.set('cwd', cwd)
      const response = await fetch(url, { headers: { accept: 'application/json' } })
      const payload = await response.json().catch(() => undefined)
      if (payload === undefined) throw httpError(response.status, 'inspect-failed', '')
      if (!response.ok || payload.ok !== true) throw httpError(response.status, payload.code, payload.message)
      return payload
    }

    /** Create or reuse the checkout for one branch. */
    async function prepare(cwd, branch, worktree, base) {
      const response = await fetch(new URL(`${PREFIX}/create`, hostBase()), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cwd, branch, worktree, base }),
      })
      const payload = await response.json().catch(() => undefined)
      if (payload === undefined) throw httpError(response.status, 'create-failed', '')
      if (!response.ok || payload.ok !== true) throw httpError(response.status, payload.code, payload.message)
      return payload
    }

    /** One branch option's display text, marking the checked-out ones. */
    function branchText(branch, t) {
      if (branch.current === true) return `${branch.name} · ${t('currentTag')}`
      if (branch.checkedOutAt !== null && branch.checkedOutAt !== undefined) {
        return `${branch.name} · ${t('usedTag')}`
      }
      return branch.name
    }

    /**
     * Build the New Session branch control for one client composition.
     * @param services - late-bound client services resolved per interaction.
     * @returns the hero-options occupant component.
     */
    function createControl(services) {
      /**
       * A chip between the workspace and agent-mode chips: pick a branch, decide
       * whether to create a worktree, and start the conversation there.
       * @param props - hero-options slot props (selector hooks plus `t`).
       * @returns the chip and its dropdown panel.
       */
      return function BranchWorktree(props) {
        const { t, sessionId, useSessions, useWorkspaces, useInput } = props
        const cwd = useSessions((state) => (sessionId === undefined ? undefined : state.byId[sessionId]?.cwd))
        const workspaces = useWorkspaces((state) => state)
        const draft = useInput((state) => state.draft)

        const [open, setOpen] = React.useState(false)
        const [status, setStatus] = React.useState({ phase: 'idle' })
        const [branch, setBranch] = React.useState('')
        const [newBranch, setNewBranch] = React.useState('')
        const [base, setBase] = React.useState('')
        const [worktree, setWorktree] = React.useState(true)
        const [creating, setCreating] = React.useState(false)
        const [failure, setFailure] = React.useState(null)

        /** Workspace that currently holds this Session, when listed. */
        const currentWorkspaceId = React.useMemo(() => {
          if (sessionId === undefined || workspaces.phase !== 'ready') return undefined
          for (const item of workspaces.items) {
            if (item.sessionIds.includes(sessionId)) return item.workspaceId
          }
          return undefined
        }, [sessionId, workspaces])

        /** Read the repository whenever the Session's directory changes. */
        React.useEffect(() => {
          let alive = true
          if (cwd === undefined || cwd === '') {
            setStatus({ phase: 'idle' })
            return undefined
          }
          setStatus({ phase: 'loading' })
          // A different directory is a different repository: drop the choices
          // carried over from the previous one.
          setBranch('')
          setNewBranch('')
          setBase('')
          inspect(cwd).then((payload) => {
            if (!alive) return
            setStatus({ phase: 'ready', repo: payload })
            setBranch(payload.currentBranch)
            setBase(payload.baseBranch)
          }, (error) => {
            if (!alive) return
            setStatus({ phase: 'unavailable' })
            setFailure(error.code ?? 'inspect-failed')
          })
          return () => { alive = false }
        }, [cwd])

        const repo = status.phase === 'ready' ? status.repo : undefined
        const shown = repo === undefined ? undefined : (branch !== '' ? branch : repo.currentBranch)
        const chipTitle = shown === undefined ? t('chip') : `${t('chip')}: ${shown}`
        const typed = newBranch.trim()
        const target = typed !== '' ? typed : branch
        const targetExists = repo !== undefined && repo.branches.some((item) => item.name === target)

        const submit = async () => {
          if (repo === undefined || creating || target === '') return
          setCreating(true)
          setFailure(null)
          try {
            const result = await prepare(cwd, target, worktree, base === '' ? repo.baseBranch : base)
            const uiWorkspace = services.uiWorkspace()
            if (uiWorkspace === undefined) throw httpError(0, 'create-failed', 'workspace service unavailable')
            const prompt = typeof draft === 'string' ? draft : ''
            const options = prompt === '' ? undefined : { prompt, clearPreviousDraft: true }
            setOpen(false)
            if (result.workspaceId !== undefined && result.workspaceId !== currentWorkspaceId) {
              uiWorkspace.startSession(result.workspaceId, options)
            } else if (currentWorkspaceId !== undefined) {
              uiWorkspace.startSession(currentWorkspaceId, options)
            } else {
              throw httpError(0, 'create-failed', 'workspace unavailable')
            }
          } catch (error) {
            setFailure(error.code ?? 'create-failed')
          } finally {
            setCreating(false)
          }
        }

        const failureText = failure === null ? null : t(ERROR_KEY[failure] ?? 'errorUnknown')

        const panel = [
          h('div', { key: 'branch', style: S.field }, [
            h('label', { key: 'label', style: S.fieldLabel, htmlFor: 'bw-branch' }, t('branchLabel')),
            h('select', {
              key: 'select',
              id: 'bw-branch',
              style: S.select,
              value: branch,
              disabled: creating || repo === undefined,
              onChange: (event) => {
                setBranch(event.target.value)
                setNewBranch('')
              },
            }, repo === undefined
              ? [h('option', { key: 'loading' }, t('loading'))]
              : repo.branches.map((item) => h('option', {
                key: item.name,
                value: item.name,
                disabled: item.current !== true && item.checkedOutAt !== null && item.checkedOutAt !== undefined,
              }, branchText(item, t)))),
          ]),
          h('div', { key: 'new', style: S.field }, [
            h('label', { key: 'label', style: S.fieldLabel, htmlFor: 'bw-new' }, t('newBranchLabel')),
            h('input', {
              key: 'input',
              id: 'bw-new',
              type: 'text',
              style: S.input,
              placeholder: t('newBranchPlaceholder'),
              value: newBranch,
              disabled: creating || repo === undefined,
              onChange: (event) => { setNewBranch(event.target.value) },
              onKeyDown: (event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                void submit()
              },
            }),
          ]),
          typed !== '' && repo !== undefined ? h('div', { key: 'base', style: S.field }, [
            h('label', { key: 'label', style: S.fieldLabel, htmlFor: 'bw-base' }, t('baseLabel')),
            h('select', {
              key: 'select',
              id: 'bw-base',
              style: S.select,
              value: base,
              disabled: creating,
              onChange: (event) => { setBase(event.target.value) },
            }, repo.branches.map((item) => h('option', { key: item.name, value: item.name }, item.name))),
          ]) : null,
          repo === undefined ? null : h('p', { key: 'state', style: S.hint },
            typed !== '' ? t('newBranchHint') : targetExists ? t('reuseHint') : ''),
          h('div', { key: 'divider', style: S.divider }),
          h('div', { key: 'worktree' }, [
            h('div', { key: 'row', style: S.toggleRow }, h(Switch, {
              checked: worktree,
              disabled: creating,
              label: t('worktreeOn'),
              onChange: setWorktree,
            })),
            h('p', { key: 'hint', style: S.hint }, worktree ? t('worktreeHint') : t('inPlaceHint')),
          ]),
          failureText === null ? null : h('p', { key: 'error', style: S.error, role: 'alert' }, failureText),
          h('div', { key: 'footer', style: S.footer }, [
            h(Button, {
              key: 'start',
              variant: 'primary',
              disabled: creating || repo === undefined || target === '',
              onClick: () => { void submit() },
            }, creating ? t('creating') : t('start')),
          ]),
        ]

        // The chip states the checkout strategy it will use. Worktree mode gets
        // a filled surface, a tree icon and a `worktree` badge, so the mode is
        // readable from the row without opening the dropdown.
        const anchor = h('button', {
          type: 'button',
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-label': chipTitle,
          title: chipTitle,
          'data-worktree': worktree ? 'on' : 'off',
          disabled: status.phase === 'loading',
          onClick: () => { setFailure(null); setOpen((value) => !value) },
          style: worktree ? { ...S.chip, ...S.chipWorktree } : S.chip,
          onMouseEnter: (event) => { event.currentTarget.style.background = 'var(--dsw-alias-bg-layer-2)' },
          onMouseLeave: (event) => {
            event.currentTarget.style.background = worktree ? 'var(--dsw-alias-bg-layer-2)' : 'transparent'
          },
        }, [
          h(worktree ? IconWorkspaceTreeOutlineRegular : IconBranchOutlineRegular, { key: 'icon', size: 16 }),
          h('span', { key: 'label', style: S.chipLabel }, shown ?? t('chip')),
          worktree ? h('span', { key: 'badge', style: S.badge }, t('badgeWorktree')) : null,
        ])

        // A workspace outside a Git repository has no branches: render nothing
        // rather than a dropdown that can only explain why it cannot work.
        if (status.phase === 'idle' || status.phase === 'unavailable') return null

        return h(Menu, {
          open,
          onClose: () => { if (!creating) setOpen(false) },
          items: [],
          align: 'end',
          side: 'bottom',
          portal: true,
          autoFocus: false,
          anchor,
          children: h('div', { style: S.panel }, panel),
        })
      }
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        ensureOrderCss()
        const Control = createControl({ uiWorkspace: () => ctx.get('uiWorkspace') })
        ctx.effect(() => ctx.locale.register(NS, 'en', DICTS.en), 'branch-worktree: dictionary (en)')
        ctx.effect(() => ctx.locale.register(NS, 'zh', DICTS.zh), 'branch-worktree: dictionary (zh)')
        ctx.effect(() => () => {
          if (typeof document === 'undefined') return
          document.getElementById('dsh-branch-worktree-order')?.remove()
        }, 'branch-worktree: layout stylesheet')
        ctx.slots.inject('conversation.hero.options', () => ctx.slots.register({
          name: 'conversation.hero.options',
          id: 'branch-worktree',
          order: -10,
          locale: NS,
        }, Control))
      },
    }
  },
})
