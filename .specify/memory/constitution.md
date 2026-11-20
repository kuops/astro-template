<!--
Sync Impact Report
==================
Version change: (未批准) → 1.0.0（首次批准）
Modified principles: 不适用（模板占位符全部替换为项目原则）
Added sections:
  - Core Principles（I–V，共 5 条，替换模板占位符）
  - 技术约束（Technical Constraints）
  - 开发工作流与质量门禁（Development Workflow & Quality Gates）
  - Governance（治理）
Removed sections: 无
Deferred TODOs: 无（所有占位符均已填充，无 TODO 项）
Ratification date: 2026-11-17（首次批准；此前文件仅有模板占位符，无可保留的既有条款）
备注: 本次修订将用户要求"禁止 Git 自动提交和推送"固化到原则 V 与开发工作流第 4 条。
-->

# AstroPaper 中文博客与书籍模板 Constitution

## Core Principles

### I. 静态优先，内容即源码

站点 MUST 保持为 Astro 纯静态构建产物；内容读取路径 MUST NOT 依赖常驻后端服务、数据库或
运行时 CMS。可发布内容 MUST 以 Markdown/MDX 文件存放在 `src/data/` 下的 `blog`、`books`、
`pages` 集合中，并 MUST 通过 `src/content.config.ts` 的 schema 校验。schema 变更 MUST 同步更新
受影响的内容文件与工具代码，使 `npm run build` 通过。

理由：GitHub Pages 只托管静态产物，文件系统内容可 diff、可回滚、无外部依赖，且与上游
AstroPaper 的结构保持一致。

### II. 质量门禁不可绕过（NON-NEGOTIABLE）

任何代码改动在宣告完成前 MUST 依次通过 `npm run lint` → `npm run format:check` →
`npm run build`，顺序与 CI 保持一致。任一步失败 MUST 修复后重新完整验证，MUST NOT 以"与本次
改动无关"为由跳过。`format:check` 失败 MUST 先执行 `npm run format` 再复检。为通过门禁而
注释掉检查、放宽 ESLint 规则（例如降级 `no-console: error`）或跳过构建步骤 MUST NOT 被接受。

理由：部署流水线只执行构建，本地三道门禁是发现类型错误、格式漂移和链接失效的唯一防线。

### III. 国际化等价性（i18n Parity）

默认语言 `zh` 内容 MUST 位于 collection 根目录，其他语言 MUST 位于
`src/data/<collection>/<locale>/` 下，相同相对路径自动配对。列表页与详情页 MUST 优先呈现当前
语言译文；缺失译文时 MUST 生成原文 fallback，标注原文语言并将 canonical 指向原语言 URL。
路由或内容工具变更 MUST 同时验证默认语言 URL、locale 前缀 URL、fallback 链接与 `hreflang`
输出。

理由：译文缺失不应产生 404 或重复内容判定，任何语言入口都必须可用。

### IV. 字体与首屏性能纪律

字体 MUST 通过 Astro Fonts API 自托管，使用 WOFF2 与 `font-display: swap`。完整 CJK Web Font
（如整套 Noto Sans SC）MUST NOT 被引入；中文 MUST 回退到本机 Noto Sans SC、PingFang SC 或
Microsoft YaHei。MUST NOT 在字体加载期间隐藏整页内容，MUST NOT 使用 `optional` 造成刷新前后
字体跳变；已使用的字重与样式对应的可变字体文件 MUST 预加载。交互脚本 MUST 渐进增强：禁用
JavaScript 时正文与导航仍可读、可点。

理由：内容站点首访体验由传输体积和渲染阻塞决定，中文字库全量加载会显著放大构建与传输成本。

### V. 提交与推送必须由人工授权（NON-NEGOTIABLE）

代理与自动化 MUST NOT 自主执行 `git commit`、`git push`、`git tag`、创建 Pull Request 或任何
远端写操作，也 MUST NOT 通过脚本、钩子或工具间接完成上述操作。提交与推送 MUST 均由用户在当
次会话中分别明确指令："提交"不隐含"推送"，"修复问题"不隐含"提交"。未获明确指令时 MUST NOT
创建 commit、改写历史或执行强制推送。只读 Git 操作（`git status`、`git diff`、`git log`、
`git show`）用于核对改动，被允许。

理由：仓库历史与发布节奏由维护者掌握；自动提交会污染历史，自动推送会直接触发线上部署。

## 技术约束（Technical Constraints）

- **运行时**：Astro 7 + TypeScript `strict`；CI 使用 Node 24。
- **包管理**：唯一使用 npm，`package-lock.json` MUST 与依赖变更同步提交；MUST NOT 引入 pnpm 或
  yarn 的 lock 文件。
- **样式**：Tailwind CSS 4，经 `@tailwindcss/vite` 接入；主题变量与字体变量集中在
  `src/styles/global.css`。
- **路径别名**：`@/*` 映射到 `./src/*`（`tsconfig.json`），新增导入 MUST 沿用该别名。
- **配置入口**：站点级配置写入 `astro-paper.config.ts`；构建与插件配置写入 `astro.config.ts`，
  MUST NOT 在组件中硬编码站点标题、语言、时区或 URL。
- **部署**：GitHub Actions 在推送到 `gh-pages` 分支时构建并发布到 GitHub Pages。`site.url` MUST
  配置为真实 Pages 地址；部署到 `<username>.github.io/<repo>` 时 MUST 同时配置 `base`。
- **依赖**：新增运行时依赖 MUST 说明必要性，并评估对客户端产物体积的影响。

## 开发工作流与质量门禁（Development Workflow & Quality Gates）

1. 改动前先阅读 `AGENTS.md`、相关配置与周围代码，遵循既有结构、命名与风格；不确定的文件视为
   用户正在进行的工作，先调查再修改。
2. 改动后按 CI 顺序完整执行 `npm run lint` → `npm run format:check` → `npm run build`，并在
   汇报中给出每一步的真实结果。
3. 提交信息 MUST 采用 `type: short description` 形式，例如 `feat: add reading metadata`
   或 `fix: preserve navigation state`。
4. commit 之后 MUST NOT 推送；推送必须等用户单独明确指令。
5. 除用户明确要求外 MUST NOT 主动添加代码注释。
6. 涉及路由、i18n、build 脚本或内容 schema 的改动，MUST 说明对所有语言入口与既有内容的
   影响；大范围重构 MUST 先说明必要性与回滚方式。

## Governance

本宪章优先于其他实践文档。`AGENTS.md`、README 与模板说明属于运行时指导；与之冲突时以本宪章
为准，并 MUST 同步修正指导文档，避免规则分叉。

**修订程序**：修订 MUST 写入 `.specify/memory/constitution.md`，说明动机、受影响原则与迁移
影响，并经维护者明确批准后生效。修订 MUST 更新 Sync Impact Report，并在合并前移除该临时
注释。

**版本策略**：版本号采用语义化版本。
- MAJOR：删除或重定义原则/治理条款，或新增不兼容约束。
- MINOR：新增原则、新增章节，或实质性扩展指导。
- PATCH：澄清措辞、修正笔误与非语义性调整。

**合规审查**：每次变更在提交说明或 PR 描述中 MUST 声明所遵循或触碰的原则；无法满足某条
原则时 MUST 在审查中给出理由与替代方案。审查者 MUST 拒绝违反原则 II 或原则 V 的变更。

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
