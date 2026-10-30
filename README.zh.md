# dsh-branch-worktree

[English](README.md) | 简体中文

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web UI 插件，在新会话界面增加**分支选择 + 自动创建 Git worktree**。

选项目、选模式之后，再多选一个分支（或直接输入新分支名），DSH 会为它建一份独立检出，会话直接在那个目录里开始——你当前工作区里改到一半的文件完全不受影响。

![新会话行：工作区、分支、模式](docs/screenshot-row.png)

![分支下拉：选分支、新建分支、worktree 开关](docs/screenshot-panel.png)

## 为什么需要它

新会话界面本来可以选**工作区**和**Agent 模式**，但会话永远从工作区目录、以「当前检出的那个分支」开始。于是并行开多个 Agent 任务，就得反复切分支、stash 改动，或者每次开新会话前手动建 worktree。

这个插件补上这一格：

| 控件 | 来源 |
|---|---|
| 工作区 / 项目 | DSH 内置 |
| Agent 模式（如创造模式） | DSH 内置 |
| **分支，或新分支 + 基于哪个分支** | **本插件** |
| **自动创建 worktree** | **本插件** |

## 功能

- **位置在「项目」和「创造模式」之间** — 新会话行从左到右就是：项目 → 分支 → 模式，正好是决定「在哪、做什么、怎么做」的顺序。
- **点开是下拉面板**，不弹模态框，不打断输入区。
- **可选已有分支，也可直接输入新分支名** — 新分支从你指定的 base 分支拉出（默认取仓库自身的默认分支）；分支已存在时则复用，不会重复创建。
- **两种模式可切换：**
  - **自动创建 worktree**（默认）— 在 `<仓库>/.worktrees/<分支>` 下 `git worktree add`，把该目录注册成 DSH 工作区并在其中开会话。当前检出完全不动，未提交的改动原样保留。
  - **原地切换** — 在当前检出里 `git checkout` 该分支。工作区有未提交改动时会直接拒绝，绝不会覆盖你的改动。
- **已在别处检出的分支只显示不提供选择** — 在选择器里标记为「已在别处检出」并置灰，因为 Git 不允许同一分支被检出两次。
- **worktree 池不污染 `git status`** — 首次运行会把 `.worktrees/` 追加进 `.git/info/exclude`。
- **未发送的草稿会带过去** — 已经输入的提示词会跟着进入新会话。
- **不是 Git 仓库时 chip 直接不显示**，而不是弹一个什么也做不了的对话框。

生成的目录结构：

```
my-repo/
├── .git/
├── .worktrees/
│   ├── feature-login/      ← 分支 feature/login
│   └── fix-crash/          ← 分支 fix/crash
└── ... 你的主检出，保持原样
```

## 安装

需要 DSH `>= 0.2.0`，以及 `PATH` 里有 `git`。

### 方式一：Web 界面（推荐）

1. 侧边栏 → **插件** → **添加插件** → **安装第三方插件**（支持 npm 包、Git 仓库和本地目录）。
2. 填入 Git 仓库地址：

   ```
   https://github.com/elfgzp/dsh-branch-worktree
   ```

3. 确认安装后，在「已安装插件」里打开 **分支与 Worktree** 开关；如果界面没有立刻生效，重启 DSH。

### 方式二：让 Agent 帮你装

在开启了插件管理工具的 DSH 会话里（创造模式默认开启），直接说：

> 从 https://github.com/elfgzp/dsh-branch-worktree 安装这个插件并启用

Agent 会调用 `plugin_manager` 的 `install_bundle`，自动写入依赖、把 bundle 追加到 `dsh.profile.bundles` 并激活。

### 方式三：本地开发

```bash
git clone https://github.com/elfgzp/dsh-branch-worktree
cd dsh-branch-worktree
```

然后用 **插件 → 添加插件 → 安装第三方插件** 选择这个本地目录的绝对路径。profile 会把它记成 `link:` 依赖，之后改代码只需重启（浏览器半区只需刷新页面）。

> 不要手改 profile 的 `package.json` 或 `cordis.patch.yml`。这两个文件归插件管理器所有，直接改会让 bundle 列表和实际状态脱节。

## 使用

1. 点 **新建会话**。
2. 照常选工作区，然后点中间的**分支 chip**。
3. 在下拉里选一个已有分支，或者在「新建分支」里输入名字——此时会多出「基于」选择器。
4. 保留 **创建 worktree** 开关（默认开），或关掉它改为原地切换。
5. 点 **从这里开始**（或在输入框里按 Enter）。

会话在生成的目录里打开，侧边栏会以分支名出现一个新工作区分组。

### 勾选 worktree 之后到底做了什么

这是最容易被误解的一步：**勾选 worktree 不等于一定新建分支**。实际规则是：

| 你输入的分支名 | 执行的动作 |
|---|---|
| **不存在** | `git worktree add -b <分支> <路径> <base>` — **新建分支**并检出到新 worktree |
| **已存在** | `git worktree add <路径> <分支>` — **复用已有分支**，不新建 |
| **已在别的 worktree 检出** | 直接报错，因为 Git 不允许同一分支被检出两次 |

所以：起个新名字就是开新分支，选个已有分支就是复用；绝不会悄悄给你造一个同名分支。下拉面板里也会实时提示当前会走哪条路径。

### 磁盘上发生了什么

在 `/work/my-repo` 里对分支 `feature/login` 走 worktree 模式：

```bash
# 1. 建池目录并加入排除
mkdir -p /work/my-repo/.worktrees
echo '.worktrees/' >> /work/my-repo/.git/info/exclude

# 2. 新分支从指定 base 拉出，或复用已有分支
git worktree add -b feature/login /work/my-repo/.worktrees/feature-login <base>

# 3. DSH 把 /work/my-repo/.worktrees/feature-login 注册成工作区
```

本插件不会删除任何东西。要回收一个 worktree：

```bash
git worktree remove .worktrees/feature-login
git branch -d feature/login
```

## 可能遇到的报错

| 提示 | 含义 |
|---|---|
| 这个工作区不在 Git 仓库内。 | 所选工作区没有 `.git`；正常情况下提前探知的话 chip 不会显示。 |
| 分支名只能包含字母、数字和 `. _ / -`。 | 输入的分支名不是合法 Git ref。 |
| 该分支已经在另一个 worktree 中检出。 | Git 不允许同一分支检出两次。换一个分支，或新建分支。 |
| 同名的 worktree 目录已存在。 | `.worktrees/<分支>` 位置有残留目录挡着，用 `git worktree prune` 或手动清掉。 |
| 当前工作区有未提交改动。 | 你在工作区不干净时关掉了 worktree 开关。重新打开开关，或先提交/stash。 |
| Git 拒绝了这个操作。 | 其它 Git 失败，具体 Git 报错会显示在对话框里。 |

## 实现原理

```
┌──────────────────────── 浏览器（client.js）────────────────────────┐
│  conversation.hero.options 槽的占位组件                            │
│    button  ──► Modal：分支选择 / 新建分支 / worktree 开关           │
│                        │                                            │
│                        │  POST /branch-worktree/create               │
└────────────────────────┼────────────────────────────────────────────┘
                         ▼
┌──────────────────────── Host（index.js）───────────────────────────┐
│  connection.requestRejection()  ← 信任栅栏，先于一切                │
│  /branch-worktree/inspect  → 仓库、分支、现有 worktree、脏状态       │
│  /branch-worktree/create   → git worktree add | git checkout        │
│                            → workspaceRegistry.create(path)         │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼   浏览器侧调用 uiWorkspace.startSession(id)
                  会话以 header.cwd = 新检出目录 创建
```

两个关键点：

- **会话必须在 worktree 里「创建」，而不是「移动」进去。** DSH 会话的 `header.cwd` 是冻结的创建元信息：系统提示里的 cwd、shell 工具的默认工作目录、沙箱的 `workspaceRoot` 全都由它派生。所以插件把 worktree 注册成工作区、在其中新开一个空白会话，而不是去改已有会话。
- **所有 Git 操作都在 Host 侧，且只通过 `execFile` 传字面量 argv**，分支名不经过 shell 拼接。每条路由第一步都先过连接信任栅栏，别的源的页面无法驱动你机器上的 Git。

## 注册位置

| 半区 | 位置 |
|---|---|
| Host | `webServer` exact 路由 `/branch-worktree/inspect`、`/branch-worktree/create` |
| Client | `conversation.hero.options`（list 槽），id `branch-worktree`，order `-10` |

关于「插到项目和模式中间」：DSH 在新会话行里**没有**提供这两个 chip 之间的插槽——`conversation.hero.workspace` 和 `conversation.hero.agentPreset` 都是 `display: contents` 的包装层，而唯一给额外控件用的 `conversation.hero.options` 是整行右对齐的。插件因此注入一小段受限 CSS：把该容器设为 `display: contents`，用 `order` 把本插件排在两个内置 chip 之间。选择器用 `:has()` 限定在**仅新会话行**，不影响会话视图，也没有挪动其它插件的节点；如果将来 DSH 在该位置提供了正式插槽，这段 CSS 会自动失去意义。

只依赖内置的 `@deepseek-ai/dsh-client-ui-conversation`，用到的都是公开服务：`webServer`、`connection`、`workspaceRegistry`、`slots`、`locale`、`uiWorkspace`。

## 兼容性

| DSH | 状态 |
|---|---|
| `0.2.1-rc.3` | 已实测 |
| `>= 0.2.0` | 预期可用 |

插件内置 `en` 和 `zh` 两套文案，跟随 DSH 的语言设置。

## 卸载

**插件** → **分支与 Worktree** → **移除**。插件创建的 worktree 和分支会留在磁盘上，按上面 `git worktree remove` 的命令清理即可。

## 同类插件调研

动手前先找过现成的。目前存在的这些：

| 仓库 | Star | 为什么不够用 |
|---|---|---|
| [frederico-kluser/dsh-worktree-jump](https://github.com/frederico-kluser/dsh-worktree-jump) | 2 | 只做 worktree 跳转，没有会话创建时的分支选择 |
| [Letter2025/dsh-task-worktree](https://github.com/Letter2025/dsh-task-worktree) | 2 | 只做任务隔离，没有和项目/模式整合的控件 |
| [YS-BW/dsh-plugins](https://github.com/YS-BW/dsh-plugins) | 1 | 杂项插件集合 |
| [zhang-guo-wen/dsh-worktree](https://github.com/zhang-guo-wen/dsh-worktree) | 0 | 功能不完整 |
| [epik7th/dsh-task-worktree](https://github.com/epik7th/dsh-task-worktree) | 0 | 功能不完整 |
| [d0nj/dsh-plugins](https://github.com/d0nj/dsh-plugins) | 0 | 杂项插件集合 |

没有一个把「项目 + Agent 模式 + 分支 + 自动 worktree」组合进新会话行，所以这个插件只做这件事。

另外，DSH 本身已有一个非 GUI 的 worktree 能力——`@deepseek-ai/dsh-experimental-worktree` 及其 `create_worktree` 模型工具——但它在所有出厂 profile 里都是默认关闭的，且由模型驱动而非新会话流程的一部分。本插件与它互补，不冲突。

## 许可证

MIT
