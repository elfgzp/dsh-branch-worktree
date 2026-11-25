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
        autoBranchLabel: 'Auto name',
        autoBranchHint: 'Leave it to the plugin: a fresh branch and worktree name are generated for you.',
        autoPreviewLabel: 'Will create',
        autoOffHint: 'Name the branch yourself below.',
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
        unnamedTag: 'auto',
        errorNotRepo: 'This workspace is not inside a Git repository.',
        errorInvalidBranch: 'Branch names accept letters, digits and . _ / - only.',
        errorCheckedOut: 'That branch is already checked out in another worktree.',
        errorMainCheckout: 'That branch is checked out in your main working copy, so it cannot be isolated into a worktree. Pick or type another branch.',
        errorPathExists: 'A worktree directory with that name already exists.',
        errorDirty: 'Your current checkout has uncommitted changes; keep the worktree option on, or commit them first.',
        errorGit: 'Git refused the operation.',
        errorUnknown: 'The checkout could not be prepared.',
        statusSwitch: 'New worktree',
        statusBusy: 'Creating worktree…',
        statusDone: 'Moved to',
        statusMovedTag: 'agent here',
        statusSidebarHint: 'The agent now works in this directory. The sidebar and the file panel still show the workspace it belongs to, because DSH fixes a session\'s directory when it is created.',
        migratePrompt: 'I moved this work into a new Git worktree at {path}. '
          + 'Carry any uncommitted work over from the previous directory first, and tell the user if something could not be carried. '
          + 'Any teammate or subagent you delegate from here must be pointed at {path}.',
        errorAlreadyWorktree: 'This session is already working inside a worktree.',
        errorSwitchUnavailable: 'A running session has to be open before it can be moved; reopen it and try again.',
        cleanupTitle: 'Worktree cleanup',
        cleanupIntro: 'Worktrees whose branch is already merged into {trunk} and whose checkout is clean can be removed here. Removal deletes the directory and the branch.',
        cleanupEmpty: 'Nothing to clean up right now.',
        cleanupKept: 'Not removable',
        cleanupRemove: 'Remove',
        cleanupBusy: 'Removing…',
        cleanupDone: 'Removed',
        cleanupRefresh: 'Refresh',
        cleanupLoading: 'Reading worktrees…',
        cleanupNotRepo: 'The current workspace is not inside a Git repository.',
        cleanupNoWorkspace: 'Open a workspace first.',
        cleanupReasonMerged: 'merged into the trunk',
        cleanupReasonUnmerged: 'branch is not merged yet',
        cleanupReasonDirty: 'uncommitted changes',
        cleanupReasonDetached: 'detached checkout',
        cleanupReasonMain: 'main checkout',
        cleanupReasonTrunk: 'this is the trunk itself',
        cleanupReasonUnmergedCommits: 'has commits the trunk does not have',
        cleanupReasonUnknown: 'not eligible',
      },
      zh: {
        chip: '分支',
        badgeWorktree: 'worktree',
        branchLabel: '分支',
        autoBranchLabel: '自动命名',
        autoBranchHint: '交给插件生成分支名和 worktree 名，不用自己想。',
        autoPreviewLabel: '将创建',
        autoOffHint: '在下面自己填分支名。',
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
        unnamedTag: '自动',
        errorNotRepo: '这个工作区不在 Git 仓库内。',
        errorInvalidBranch: '分支名只能包含字母、数字和 . _ / -。',
        errorCheckedOut: '该分支已经在另一个 worktree 中检出。',
        errorMainCheckout: '该分支就在主工作区里检出，无法再隔离到 worktree。请换一个分支或新建分支。',
        errorPathExists: '同名的 worktree 目录已存在。',
        errorDirty: '当前工作区有未提交改动；请保留 worktree 开关，或先提交改动。',
        errorGit: 'Git 拒绝了这个操作。',
        errorUnknown: '无法准备检出目录。',
        statusSwitch: '新建 worktree',
        statusBusy: '正在创建 worktree…',
        statusDone: '已切到',
        statusMovedTag: 'agent 在此',
        statusSidebarHint: 'agent 现在在这个目录里工作。侧边栏和文件面板仍显示该会话所属的工作区，因为 DSH 在会话创建时就固定了它的目录。',
        migratePrompt: '我已经把工作切到新的 Git worktree：{path}。'
          + '请先把原来目录里未提交的改动搬过来，有搬不过来的告诉用户。'
          + '之后交给团队成员或子智能体的任务，工作目录都要指向 {path}。',
        errorAlreadyWorktree: '这个会话已经在 worktree 里了。',
        errorSwitchUnavailable: '会话必须处于运行状态才能原地切换目录，请先重新打开它。',
        cleanupTitle: '清理 worktree',
        cleanupIntro: '分支已经合入 {trunk}、且检出目录没有未提交改动时，可以在这里删掉对应的 worktree。删除会同时移除目录和分支。',
        cleanupEmpty: '目前没有需要清理的 worktree。',
        cleanupKept: '不可清理',
        cleanupRemove: '清理',
        cleanupBusy: '正在删除…',
        cleanupDone: '已清理',
        cleanupRefresh: '刷新',
        cleanupLoading: '正在读取 worktree…',
        cleanupNotRepo: '当前工作区不在 Git 仓库内。',
        cleanupNoWorkspace: '请先打开一个工作区。',
        cleanupReasonMerged: '已合入主干',
        cleanupReasonUnmerged: '分支尚未合并',
        cleanupReasonDirty: '有未提交改动',
        cleanupReasonDetached: '游离检出',
        cleanupReasonMain: '主工作区',
        cleanupReasonTrunk: '本身就是主干',
        cleanupReasonUnmergedCommits: '还有主干没有的提交',
        cleanupReasonUnknown: '不满足清理条件',
      },
    }

    /** Host error code → dictionary key. */
    const ERROR_KEY = {
      'not-a-repo': 'errorNotRepo',
      'not-a-directory': 'errorNotRepo',
      'invalid-branch': 'errorInvalidBranch',
      'branch-checked-out': 'errorCheckedOut',
      'branch-is-main-checkout': 'errorMainCheckout',
      'path-exists': 'errorPathExists',
      'worktree-dirty': 'errorDirty',
      'git-failed': 'errorGit',
      'already-worktree': 'errorAlreadyWorktree',
      'switch-unavailable': 'errorSwitchUnavailable',
      'not-found': 'cleanupReasonUnknown',
    }

    /** Host cleanup verdict → dictionary key explaining it. */
    const CLEANUP_REASON_KEY = {
      merged: 'cleanupReasonMerged',
      unmerged: 'cleanupReasonUnmerged',
      dirty: 'cleanupReasonDirty',
      detached: 'cleanupReasonDetached',
      'main-checkout': 'cleanupReasonMain',
      'on-trunk': 'cleanupReasonTrunk',
      'unmerged-commits': 'cleanupReasonUnmergedCommits',
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
      /** The generated name, shown before it is created so auto mode is not a black box. */
      preview: {
        display: 'grid',
        gap: 2,
        marginTop: 2,
        padding: '6px 8px',
        borderRadius: 7,
        background: 'var(--dsw-alias-bg-layer-2)',
        minWidth: 0,
      },
      previewLabel: {
        fontSize: 11,
        lineHeight: '15px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      previewValue: {
        fontFamily: 'var(--dsw-alias-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
        fontSize: 12,
        lineHeight: '17px',
        color: 'var(--dsw-alias-label-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      previewPath: {
        fontSize: 10,
        lineHeight: '14px',
        color: 'var(--dsw-alias-label-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      /** Settings page layout. */
      section: { display: 'grid', gap: 10, padding: '4px 0', minWidth: 0 },
      cleanupList: { display: 'grid', gap: 6, minWidth: 0 },
      cleanupRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        minWidth: 0,
        padding: '6px 8px',
        borderRadius: 7,
        background: 'var(--dsw-alias-bg-layer-2)',
      },
      cleanupMain: { display: 'grid', gap: 2, minWidth: 0, flex: '1 1 auto' },
      cleanupBranch: {
        fontFamily: 'var(--dsw-alias-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
        fontSize: 12,
        lineHeight: '17px',
        color: 'var(--dsw-alias-label-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      cleanupPath: {
        fontSize: 10,
        lineHeight: '14px',
        color: 'var(--dsw-alias-label-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      cleanupWhy: {
        flex: 'none',
        fontSize: 11,
        lineHeight: '16px',
        color: 'var(--dsw-alias-label-secondary)',
      },
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
      // A directory outside a Git repository still answers 200, but with a
      // reduced payload (`isRepo: false`, no branches/worktrees). Treat that
      // as "not a repo" here rather than letting it through as `ready`; the
      // panel maps arrays off that payload, and a missing `branches` would
      // crash the whole slot entry (which never recovers without a reload).
      if (payload.isRepo !== true) throw httpError(response.status, 'not-a-repo', '')
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

    /**
     * Create a worktree for a running session and register it as a Workspace.
     *
     * Renaming a session's directory in place was the obvious design and it does
     * not work: DSH freezes `header.cwd` at session creation, every panel takes
     * its root from that header, and workspace membership requires
     * `cwd === workspace.path`. A workspace whose path IS the new checkout is
     * therefore the only shape where the file tree, the Git view and the
     * changes list actually follow the move.
     */
    async function switchWorkspace(cwd, sessionId, path, branch) {
      const response = await fetch(new URL(`${PREFIX}/switch`, hostBase()), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // `path`/`branch` are supplied when the checkout already exists (the
        // New-Session flow created it seconds earlier); the Host then skips
        // repository inspection instead of building a second worktree.
        body: JSON.stringify({ cwd, sessionId, path, branch }),
      })
      const payload = await response.json().catch(() => undefined)
      if (payload === undefined) throw httpError(response.status, 'switch-failed', '')
      if (!response.ok || payload.ok !== true) throw httpError(response.status, payload.code, payload.message)
      return payload
    }

    /**
     * Ask the Host which branch name the automatic mode would generate now.
     *
     * The name is random on the Host side and deliberately independent of the
     * conversation, so this endpoint takes no seed. It exists purely so the
     * panel can show the name before anything is created.
     */
    async function suggest(cwd) {
      const url = new URL(`${PREFIX}/suggest`, hostBase())
      url.searchParams.set('cwd', cwd)
      const response = await fetch(url, { headers: { accept: 'application/json' } })
      const payload = await response.json().catch(() => undefined)
      if (payload === undefined) throw httpError(response.status, 'suggest-failed', '')
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
        // The whole list is needed, not just this session's cwd: after a start
        // the new conversation has to be found among the sessions that appeared.
        const sessions = useSessions((state) => state)
        const workspaces = useWorkspaces((state) => state)
        const draft = useInput((state) => state.draft)

        // A brand-new Session is rendered before its summary lands in `byId`, so
        // reading only `state.byId[sessionId].cwd` leaves the chip blank on
        // exactly the screen it exists for. Fall back to the directory of the
        // Workspace that holds this Session — that is what it is about to get.
        const sessionCwd = sessionId === undefined ? undefined : sessions.byId?.[sessionId]?.cwd
        const workspaceCwd = React.useMemo(() => {
          if (sessionId === undefined || workspaces.phase !== 'ready') return undefined
          for (const item of workspaces.items) {
            if (Array.isArray(item.sessionIds) && item.sessionIds.includes(sessionId)) return item.path
          }
          return undefined
        }, [sessionId, workspaces])
        const cwd = sessionCwd ?? workspaceCwd

        const [open, setOpen] = React.useState(false)
        const [status, setStatus] = React.useState({ phase: 'idle' })
        const [branch, setBranch] = React.useState('')
        const [newBranch, setNewBranch] = React.useState('')
        const [base, setBase] = React.useState('')
        const [worktree, setWorktree] = React.useState(true)
        // Automatic naming is the default: the worktree switch is on out of the
        // box, and a worktree needs a name the user has not chosen yet. Making
        // them invent one before the feature works is the friction this mode
        // removes; the name is still previewed and still overridable.
        const [autoName, setAutoName] = React.useState(true)
        const [preview, setPreview] = React.useState(null)
        const [creating, setCreating] = React.useState(false)
        const [failure, setFailure] = React.useState(null)
        /**
         * A checkout that still has to be applied to the conversation that was
         * just started. `startSession` does not hand back a usable id, so the
         * effect below also waits for the new session to appear in the store.
         */
        const [pending, setPending] = React.useState(null)

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
        const typed = newBranch.trim()
        // Branch lists come from the Host over HTTP. Guard them so a reduced or
        // stale payload can never take down the whole hero slot.
        const branches = Array.isArray(repo?.branches) ? repo.branches : []

        /**
         * Refresh the name the automatic mode would generate.
         *
         * The name is random and unrelated to the conversation, so this only
         * re-runs when the repository changes (or the switch is turned back
         * on). It is NOT keyed on the draft: a worktree name is a durable Git
         * ref, and binding it to whatever happened to be typed in the box would
         * leak prompt text into branch names and make two unrelated branches
         * collide on the same sentence.
         */
        React.useEffect(() => {
          if (repo === undefined || !autoName) {
            setPreview(null)
            return undefined
          }
          let alive = true
          suggest(repo.cwd).then((payload) => {
            if (alive) setPreview(payload)
          }, () => {
            if (alive) setPreview(null)
          })
          return () => { alive = false }
        }, [repo, autoName])

        /** The branch this submission would use, or '' when none is chosen yet. */
        const target = autoName
          ? (preview === null ? '' : preview.branch)
          : (typed !== '' ? typed : branch)
        const shown = autoName
          ? (preview === null ? undefined : preview.branch)
          : (repo === undefined ? undefined : (branch !== '' ? branch : repo.currentBranch))
        const chipTitle = shown === undefined ? t('chip') : `${t('chip')}: ${shown}`
        const targetExists = repo !== undefined && !autoName && branches.some((item) => item.name === target)

        const submit = async () => {
          if (repo === undefined || creating || (target === '' && !autoName)) return
          setCreating(true)
          setFailure(null)
          try {
            const prompt = typeof draft === 'string' ? draft : ''
            const result = await prepare(
              cwd,
              autoName ? '' : target,
              worktree,
              base === '' ? repo.baseBranch : base,
            )
            const uiWorkspace = services.uiWorkspace()
            if (uiWorkspace === undefined) throw httpError(0, 'create-failed', 'workspace service unavailable')
            if (currentWorkspaceId === undefined) throw httpError(0, 'create-failed', 'workspace unavailable')

            // One workspace, one conversation. The checkout the Host just made
            // is NOT registered as a workspace — registering it is what used to
            // add a second sidebar group on every start. Instead the session is
            // started in the workspace the user already picked, and then moved
            // onto the checkout.
            const options = prompt === '' ? undefined : { prompt, clearPreviousDraft: true }
            const sessionId = uiWorkspace.startSession(currentWorkspaceId, options)
            // Close only after the start has been issued: closing unmounts this
            // panel, and unmounting mid-submit would drop the work below.
            setOpen(false)

            // Apply the directory now, or once the session exists. `startSession`
            // may return nothing, in which case the polling helper waits for the
            // new session id to show up before rebinding it.
            setPending({
              result,
              sessionId: typeof sessionId === 'string' ? sessionId : undefined,
              knownSessionIds: new Set(Object.keys(sessions.byId ?? {})),
            })
          } catch (error) {
            setFailure(error.code ?? 'create-failed')
          } finally {
            setCreating(false)
          }
        }

        // Apply the checkout to the conversation that was just started. This is
        // the whole feature: pick a workspace, type a message, and the agent ends
        // up working inside a worktree while the sidebar keeps one group.
        React.useEffect(() => {
          if (pending === null) return undefined
          let alive = true
          const run = async () => {
            try {
              let id = pending.sessionId
              if (id === undefined) {
                // No id came back: look for the session that appeared after the
                // click. Bounded, because a session that never shows up means
                // something else went wrong and the user should be told.
                const deadline = Date.now() + 10_000
                while (alive && Date.now() < deadline) {
                  const now = Object.keys(sessions.byId ?? {})
                  const fresh = now.find((key) => !pending.knownSessionIds.has(key))
                  if (fresh !== undefined) { id = fresh; break }
                  await new Promise((resolve) => setTimeout(resolve, 100))
                }
              }
              if (!alive) return
              if (id === undefined) throw httpError(0, 'switch-unavailable', 'the new session did not appear')
              await switchWorkspace(
                pending.result.path.startsWith('/') ? dirnameOf(pending.result.path) : cwd,
                id,
                pending.result.path,
                pending.result.branch,
              )
            } catch (error) {
              if (alive) setFailure(error.code ?? 'switch-unavailable')
            } finally {
              if (alive) setPending(null)
            }
          }
          void run()
          return () => { alive = false }
        }, [pending, sessions, cwd])

        const failureText = failure === null ? null : t(ERROR_KEY[failure] ?? 'errorUnknown')

        const panel = [
          h('div', { key: 'auto' }, [
            h('div', { key: 'row', style: S.toggleRow }, h(Switch, {
              checked: autoName,
              disabled: creating || repo === undefined,
              label: t('autoBranchLabel'),
              onChange: (value) => {
                setAutoName(value)
                // Falling back to manual naming keeps a real branch selected,
                // so the switch never leaves the form in an unusable state.
                if (!value && branch === '' && repo !== undefined) setBranch(repo.currentBranch)
              },
            })),
            h('p', { key: 'hint', style: S.hint }, autoName ? t('autoBranchHint') : t('autoOffHint')),
            autoName && preview !== null ? h('div', { key: 'preview', style: S.preview }, [
              h('span', { key: 'label', style: S.previewLabel }, t('autoPreviewLabel')),
              h('code', { key: 'branch', style: S.previewValue }, preview.branch),
              h('span', { key: 'path', style: S.previewPath }, preview.worktreePath),
            ]) : null,
          ]),
          autoName ? null : h('div', { key: 'branch', style: S.field }, [
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
              : branches.map((item) => h('option', {
                key: item.name,
                value: item.name,
                disabled: item.current !== true && item.checkedOutAt !== null && item.checkedOutAt !== undefined,
              }, branchText(item, t)))),
          ]),
          autoName ? null : h('div', { key: 'new', style: S.field }, [
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
          (autoName || typed !== '') && repo !== undefined ? h('div', { key: 'base', style: S.field }, [
            h('label', { key: 'label', style: S.fieldLabel, htmlFor: 'bw-base' }, t('baseLabel')),
            h('select', {
              key: 'select',
              id: 'bw-base',
              style: S.select,
              value: base,
              disabled: creating,
              onChange: (event) => { setBase(event.target.value) },
            }, branches.map((item) => h('option', { key: item.name, value: item.name }, item.name))),
          ]) : null,
          repo === undefined || autoName ? null : h('p', { key: 'state', style: S.hint },
            typed !== '' ? t('newBranchHint') : targetExists ? t('reuseHint') : ''),
          h('div', { key: 'divider', style: S.divider }),
          h('div', { key: 'worktree' }, [
            h('div', { key: 'row', style: S.toggleRow }, h(Switch, {
              checked: worktree,
              disabled: creating,
              label: t('worktreeOn'),
              onChange: (value) => {
                setWorktree(value)
                // In-place mode swaps the checkout onto an existing branch, so
                // it has nothing to auto-name; drop back to manual selection.
                if (!value) setAutoName(false)
              },
            })),
            h('p', { key: 'hint', style: S.hint }, worktree ? t('worktreeHint') : t('inPlaceHint')),
          ]),
          failureText === null ? null : h('p', { key: 'error', style: S.error, role: 'alert' }, failureText),
          h('div', { key: 'footer', style: S.footer }, [
            h(Button, {
              key: 'start',
              variant: 'primary',
              disabled: creating || repo === undefined || (target === '' && !autoName),
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

    /**
     * Read the Session the main panel is currently showing.
     *
     * `shell.bottom` is root-scoped, so its occupant gets no `sessionId` prop
     * (only session-scoped slots are handed one). The workspace domain persists
     * the current main-panel selection under this localStorage key, which is
     * the only root-scope way to name that Session.
     *
     * @returns {string | undefined} the current Session id, when known.
     */
    function currentSessionId() {
      try {
        const raw = globalThis.localStorage?.getItem('dsh.sessions.current')
        if (typeof raw !== 'string' || raw === '') return undefined
        const parsed = JSON.parse(raw)
        return typeof parsed?.sessionId === 'string' && parsed.sessionId !== '' ? parsed.sessionId : undefined
      } catch {
        return undefined
      }
    }

    /**
     * Shorten a long path for the status bar, keeping the tail readable.
     *
     * The tail names the checkout; the leading directories are usually shared
     * with everything else the user works on, so they are what gets dropped.
     *
     * @param {string} path - absolute path.
     * @returns {string} the path, elided in the middle when it is long.
     */
    function shortPath(path) {
      if (typeof path !== 'string') return ''
      const parts = path.split(/[\\/]/).filter((piece) => piece !== '')
      if (parts.length <= 4) return path
      return `…/${parts.slice(-3).join('/')}`
    }

    /** Whether a path is a checkout this plugin created under `.worktrees/`. */
    function isWorktreePath(path) {
      return typeof path === 'string' && /[\\/]\.worktrees[\\/]/.test(path)
    }

    /**
     * The directory that contains a path.
     *
     * Only used to name the repository when the checkout is already known: the
     * Host re-inspects it, so the parent directory is what it needs, not the
     * checkout itself.
     *
     * @param {string} path - absolute path to a file or directory.
     * @returns {string} its parent, or the path itself when nothing precedes it.
     */
    function dirnameOf(path) {
      if (typeof path !== 'string') return ''
      const trimmed = path.replace(/[\\/]+$/, '')
      const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
      return cut <= 0 ? trimmed : trimmed.slice(0, cut)
    }

    /**
     * Build the settings page that cleans up finished worktrees.
     *
     * It lists every linked worktree of the current workspace's repository with
     * the verdict the Host computed, and only offers deletion for the ones whose
     * branch is already in the trunk and whose checkout is clean. The Host
     * re-checks both conditions on removal, so a stale page cannot destroy new
     * work.
     *
     * @param services - late-bound client services resolved per interaction.
     * @returns the `settings.section` occupant component.
     */
    function createCleanupSection(services) {
      return function BranchWorktreeCleanup(props) {
        const { t, useWorkspaces, useSessions } = props
        const workspaces = useWorkspaces((state) => state)
        const sessions = useSessions((state) => state)

        const [scan, setScan] = React.useState({ phase: 'idle' })
        const [busy, setBusy] = React.useState('')
        const [failure, setFailure] = React.useState(null)
        const [done, setDone] = React.useState(null)

        // The settings page is not bound to a Session, so the repository has to
        // come from the selected workspace. That is the workspace the user is
        // looking at, which is the one whose worktrees they mean.
        const cwd = React.useMemo(() => {
          const sessionId = currentSessionId()
          if (sessionId !== undefined && sessions.byId?.[sessionId]?.cwd !== undefined) {
            return sessions.byId[sessionId].cwd
          }
          if (workspaces.phase === 'ready' && workspaces.items.length > 0) return workspaces.items[0].path
          return undefined
        }, [sessions, workspaces])

        const refresh = React.useCallback(async () => {
          if (cwd === undefined) {
            setScan({ phase: 'idle' })
            return
          }
          setScan({ phase: 'loading' })
          try {
            const payload = await scanCleanup(cwd)
            setScan({ phase: 'ready', payload })
          } catch (error) {
            setScan({ phase: 'unavailable', code: error.code ?? 'cleanup-failed' })
          }
        }, [cwd])

        React.useEffect(() => { void refresh() }, [refresh])

        const remove = async (candidate) => {
          if (busy !== '') return
          setBusy(candidate.path)
          setFailure(null)
          setDone(null)
          try {
            await removeCleanup(cwd, candidate.path, true)
            setDone(candidate.branch)
            await refresh()
          } catch (error) {
            setFailure(error.code ?? 'cleanup-failed')
          } finally {
            setBusy('')
          }
        }

        if (cwd === undefined) {
          return h('div', { style: S.section }, h('p', { style: S.hint }, t('cleanupNoWorkspace')))
        }
        if (scan.phase === 'loading' || scan.phase === 'idle') {
          return h('div', { style: S.section }, h('p', { style: S.hint }, t('cleanupLoading')))
        }
        if (scan.phase === 'unavailable') {
          return h('div', { style: S.section }, h('p', { style: S.hint }, t('cleanupNotRepo')))
        }

        const candidates = Array.isArray(scan.payload?.candidates) ? scan.payload.candidates : []
        const removable = candidates.filter((entry) => entry.removable === true)
        const kept = candidates.filter((entry) => entry.removable !== true)

        const row = (entry, index) => h('div', { key: entry.path ?? index, style: S.cleanupRow }, [
          h('div', { key: 'main', style: S.cleanupMain }, [
            h('code', { key: 'branch', style: S.cleanupBranch }, entry.branch === '' ? '—' : entry.branch),
            h('span', { key: 'path', style: S.cleanupPath, title: entry.path }, shortPath(entry.path)),
          ]),
          entry.removable === true
            ? h(Button, {
              key: 'rm',
              variant: 'ghost',
              disabled: busy !== '',
              onClick: () => { void remove(entry) },
            }, busy === entry.path ? t('cleanupBusy') : t('cleanupRemove'))
            : h('span', { key: 'why', style: S.cleanupWhy }, t(CLEANUP_REASON_KEY[entry.reason] ?? 'cleanupReasonUnknown')),
        ])

        const failureText = failure === null ? null : t(ERROR_KEY[failure] ?? 'errorUnknown')

        return h('div', { style: S.section }, [
          h('p', { key: 'intro', style: S.hint }, t('cleanupIntro').replaceAll('{trunk}', String(scan.payload?.trunk ?? 'main'))),
          removable.length === 0
            ? h('p', { key: 'empty', style: S.hint }, t('cleanupEmpty'))
            : h('div', { key: 'list', style: S.cleanupList }, removable.map(row)),
          kept.length === 0 ? null : h('div', { key: 'kept', style: S.cleanupList }, [
            h('p', { key: 'label', style: S.fieldLabel }, t('cleanupKept')),
            ...kept.map(row),
          ]),
          failureText === null ? null : h('p', { key: 'err', style: S.error }, failureText),
          done === null ? null : h('p', { key: 'done', style: S.hint }, `${t('cleanupDone')} ${done}`),
          h('div', { key: 'actions', style: S.footer }, h(Button, {
            key: 'refresh',
            variant: 'ghost',
            disabled: busy !== '',
            onClick: () => { void refresh() },
          }, t('cleanupRefresh'))),
        ])
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
        // No bottom bar. Picking a workspace and typing is the only gesture that
        // should be needed: the checkout is created and applied as part of
        // starting the conversation, so a separate "New worktree" button would
        // just be a second, slower way to do the same thing.
        // Worktree cleanup lives in Settings: it is a repository-wide housekeeping
        // task, not something tied to one conversation.
        const Cleanup = createCleanupSection({})
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'branch-worktree-cleanup',
          order: 50,
          // `label` names the page in the settings navigation; it must be the
          // translated string, and `t` is only available inside the occupant,
          // so the dictionary is read through the locale service directly.
          label: () => ctx.locale.bind(NS)('cleanupTitle'),
          locale: NS,
        }, Cleanup))
      },
    }
  },
})
