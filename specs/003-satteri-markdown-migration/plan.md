# Implementation Plan: Markdown 管线迁移至 Sätteri

**Branch**: `003-satteri-markdown-migration` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-satteri-markdown-migration/spec.md`

**Note**: 本计划由 `/speckit.plan` 生成。研究结论见 [research.md](./research.md)，
数据模型见 [data-model.md](./data-model.md)，契约见 [contracts/markdown-pipeline-contract.md](./contracts/markdown-pipeline-contract.md)，
验证指南见 [quickstart.md](./quickstart.md)。

## Summary

将站点 Markdown 渲染管线从 unified（显式依赖的 `@astrojs/markdown-remark` + 6 个 unified 生态
插件 + 3 个本地 unified 插件）整体切换为 Astro 7.4 起默认的 Sätteri 处理器（`@astrojs/markdown-satteri`）。
上下标与 GFM 由 satteri 内建 features 覆盖（已实测），callouts 采用现成包 `satteri-callouts`，
`==mark==` 采用 `@mirrordown/sat-mark`（受阻则自写扫描插件），正文内嵌 TOC 随迁移移除
（全站仅 1 个测试文件使用），mermaid 块、代码行号、图片尺寸三个本地插件按 satteri visitor
接口机械重写。验收以"迁移前渲染基线对比 + 三道门禁 + 产物完整性"三重证据闭环。

## Technical Context

**Language/Version**: TypeScript（strict）+ Astro 7.4.13；Node 24.21.0（npm 11.19）

**Primary Dependencies**:
- 新增显式依赖：`@astrojs/markdown-satteri`（当前仅作 astro 传递依赖存在，MUST 显式声明——
  本次迁移的起因即是不依赖传递依赖的教训）
- 新增：`satteri-callouts`（npm 现成）、`@mirrordown/sat-mark`（JSR；安装受阻则自写，
  见 research R3）
- 保留：`sharp`（图片尺寸读取）、`@shikijs/transformers`（代码高亮装饰）
- 移除：`@astrojs/markdown-remark`、`remark-toc`、`remark-collapse`、`remark-supersub`、
  `remark-gfm`、`remark-mark-highlight`、`rehype-callouts`（共 7 个）

**Storage**: 无变化——内容文件与集合结构不动（唯一例外：`test-markdown-enhanced.md` 的
TOC 标记更新）

**Testing**: 渲染回归对比（迁移前基线 vs 迁移后产物，6 个基线页 × 8 个场景）+ 宪法三道门禁
（lint → format:check → build）。无单元测试框架，插件正确性以最小 node 脚本直接调用
satteri 编译 API 自测（见 quickstart V3）

**Target Platform**: GitHub Pages 纯静态产物（无服务端运行时，无变化）

**Project Type**: 静态内容站点的构建管线迁移（非新功能）

**Performance Goals**: 完整构建耗时不劣于迁移前基线（记录对比，不设硬提速指标——站点 32 页）

**Constraints**:
- 宪法 II：完成前完整通过 lint → format:check → build，任一失败必须修复后重新完整验证
- 宪法 III：双语等价——zh/en 内容均走新管线，回归基线必须同时覆盖两种语言的页面
- 宪法 IV：不引入新字体/客户端脚本；`MermaidRenderer` 等客户端组件的字节与行为不变
- 宪法 V：全程不执行 `git commit` / `git push`
- 重写插件 MUST 保留 `MermaidRenderer.astro` 依赖的 DOM 契约（见 contracts C4）
- smartPunctuation 不依赖任何一方默认值，显式配置并以渲染对比验收（research R7）

**Scale/Scope**: 基线页 6 个（3 个 blog 特性页 + 1 个书籍 markdown 测试页 + zh/en 2 个 MDX 页）；
重写插件 3 个 + 新增 mark 插件 1 个；配置改造 1 处；依赖变更 9 项；内容文件改动 1 个

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 判定 | 说明 |
|------|------|------|
| I. 静态优先，内容即源码 | ✓ 通过 | 管线在构建期执行，产物仍为纯静态 HTML；内容文件零改写（TOC 测试文件除外，属内容自更新） |
| II. 质量门禁不可绕过 | ✓ 通过 | 计划内含完整三道门禁 + 渲染回归双保险；依赖变更与配置改动均受门禁覆盖 |
| III. 国际化等价性 | ✓ 通过 | 新管线对 zh/en 内容一视同仁；基线含 `en/mdx-test.mdx`；路由与 i18n 配置零改动 |
| IV. 字体与首屏性能纪律 | ✓ 通过 | 不引入字体；客户端脚本零新增；mermaid 客户端渲染契约原样保留 |
| V. 提交与推送必须由人工授权 | ✓ 通过 | 全程仅工作区改动，无任何 Git 写操作 |

**无 violations，Complexity Tracking 留空。**

**张力说明**：satteri 在 Astro 中 `smartPunctuation` 默认开启，与 unified 管线现状（Astro 默认
同为开启，但实现为 retext-smartypants vs satteri 内建）存在实现差异。处理方式不是绕过而是
**显式配置 + 渲染对比验收**（research R7），符合原则 II 的"以证据关闭"精神。

## Project Structure

### Documentation (this feature)

```text
specs/003-satteri-markdown-migration/
├── plan.md                              # 本文件
├── spec.md                              # 功能规格（/speckit.specify 产出）
├── research.md                          # Phase 0：R1–R8 研究结论
├── data-model.md                        # Phase 1：4 个实体与核对点恒等式
├── contracts/
│   └── markdown-pipeline-contract.md    # C1–C4 渲染/插件/配置/客户端契约
├── checklists/
│   └── requirements.md                  # 规格质量清单（已通过）
├── quickstart.md                        # Phase 1：V0–V9 验证指南
└── tasks.md                             # Phase 2 产出（/speckit.tasks，非本命令）
```

### Source Code (repository root)

```text
astro-template/
├── astro.config.ts                  # 【修改】markdown.processor 切换为 satteri() 工厂，
│                                    #   features 显式配置，插件清单更新
├── src/utils/
│   ├── rehypeImageDimensions.ts     # 【重写→替换】satteriImageDimensions.ts
│   ├── rehypeMermaidBlock.ts        # 【重写→替换】satteriMermaidBlock.ts（含行号插件
│   │                                #   satteriCodeLines，保持一文件两插件的原布局）
│   └── satteriMark.ts               # 【新增】==mark== 扫描插件（仅当 R3 决策为自写）
├── src/components/
│   └── MermaidRenderer.astro        # 【不动】其 DOM 契约由重写插件保证（contracts C4）
├── src/data/blog/
│   └── test-markdown-enhanced.md    # 【修改】移除 "Table of contents" 标记段落
├── _migration_baseline/             # 【新增·临时】迁移前基线快照（gitignored，验证后可删）
└── package.json / package-lock.json # 【修改】依赖变更（宪法：lock 与依赖同步）
```

**Structure Decision**: 插件重写采用"原路径替换 + satteri 前缀命名"（`src/utils/` 下），
不新建目录——三个插件的引用面只有 `astro.config.ts` 一处，重命名成本为零且语义清晰。
基线快照放 `_migration_baseline/`（加入 `.gitignore`，验证完成后删除目录），
避免污染交付物——沿用 001 特性"临时工作产物与交付物分离"的先例。

## 实施阶段划分（供 /speckit.tasks 展开）

### Stage A：基线采集（阻塞一切，切换前必须完成）

1. `npm run build` 采集迁移前完整产物，提取 6 个基线页的关键 HTML 片段
   （8 场景涉及的元素：sup/sub/mark/del/表格/任务列表/脚注/callouts/mermaid 骨架/
   `--code-lines`/img 尺寸属性）存入 `_migration_baseline/`。
2. 记录构建耗时、产物页数、pagefind 索引统计（语言/页面/词数）。
3. 记录 `en/mdx-test.mdx` 与 `mdx-test.mdx` 的渲染输出。

**门禁**：基线齐备后方可进入 Stage B。基线缺失 = 回归验收失效。

### Stage B：插件重写（可并行）

1. `satteriMermaidBlock.ts`：hast visitor，mermaid 代码块 → `div.mermaid-block`
   （骨架 + 原 pre + hash key + `--mermaid-lines`），契约见 C4。
2. 同文件 `satteriCodeLines`：`pre[dataLanguage]` → `--code-lines:N` CSS 变量。
3. `satteriImageDimensions.ts`：img 三源尺寸注入 + `img-fade` class；sharp 异步读取
   的可行性以最小实验确认（research R6）。
4. mark 插件：按 R3 决策（JSR 包或自写），代码上下文保护为硬验收（C1.4）。
5. 每插件用 node 脚本直调 satteri 编译 API 自测（quickstart V3）。

**门禁**：4 个插件自测全过后方可进入 Stage C。

### Stage C：配置切换与依赖变更

1. `astro.config.ts`：`processor: satteri({ features: { gfm, superscript: true,
   subscript: true, smartPunctuation: true }, mdastPlugins, hastPlugins })`，
   移除 unified import 与 remark/rehype 插件数组。
2. 依赖变更：`npm install @astrojs/markdown-satteri satteri-callouts`（+R3 项），
   `npm uninstall` 7 个 unified 包；lock 同步。
3. 更新 `test-markdown-enhanced.md`（TOC 标记移除）。

### Stage D：回归验证

1. 逐页对比基线（6 页 × 8 场景 + smartPunctuation 字符集对比）。
2. 三道门禁完整执行。
3. 产物统计与耗时对比基线。

**门禁**：任一场景回归即回到 Stage B 修复，禁止"先合并后修"。

### Stage E：收尾

1. 全仓库残留引用清查（7 个包名 + `unified` 关键字）。
2. `_migration_baseline/` 保留至维护者确认后删除（删除动作由实施者执行，属工作产物清理）。
3. 更新 `.gitignore`（`_migration_baseline/` 条目）。

## Phase 0 → Phase 1 完成情况

| 阶段 | 产出 | 状态 |
|------|------|------|
| Phase 0 | `research.md`（R1–R8，无遗留 NEEDS CLARIFICATION） | ✓ 完成 |
| Phase 1 | `data-model.md`（4 实体 + 核对点恒等式） | ✓ 完成 |
| Phase 1 | `contracts/markdown-pipeline-contract.md`（C1–C4） | ✓ 完成 |
| Phase 1 | `quickstart.md`（V0–V9） | ✓ 完成 |

## Constitution Check（Phase 1 复检）

| 原则 | 复检结果 |
|------|----------|
| I. 静态优先 | ✓ 全部变换在构建期，产物纯静态 |
| II. 质量门禁 | ✓ Stage D 双保险（回归对比 + 三道门禁）；smartPunctuation 以显式配置关闭歧义 |
| III. i18n 等价性 | ✓ 基线含 en MDX；V8 专设 MDX 双语验证 |
| IV. 字体与性能纪律 | ✓ 零字体/脚本引入；C4 锁定客户端 DOM 契约 |
| V. Git 人工授权 | ✓ 计划全程无 Git 写操作 |

**结论**：无 violations。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 关键假设 | | |
| satteri 插件 visitor 不支持异步（sharp 读取） | 图片尺寸注入退化 | R6 最小实验先行；退化路径：尺寸三源中 query/path 为同步解析，本地文件读取改为构建前预生成清单或接受该子项降级并记录 |
| sat-mark 在 npm 工程不可装 | mark 特性缺位 | R3 备选：自写扫描插件（约 40 行，可完全掌控代码上下文保护） |
| satteri-callouts 输出 DOM 与 rehype-callouts 不一致 | 样式断裂 | V5 基线对比；不一致时以 CSS 适配层对齐（不动内容） |
| 扫描式 mark 误伤代码内容 | 代码块出现意外 `<mark>` | C1.4 硬验收 + V4 专项用例（inline code 与 fenced code 内的 `==`/`^`/`~`） |
| shiki transformers 在 satteri 高亮管线失效 | 代码装饰丢失 | R8：SatteriMarkdownProcessorOptions 继承 AstroMarkdownOptions，shikiConfig 原位透传；V3 场景 6 覆盖 diff/标注/文件名 |
| smartPunctuation 两实现字符差异 | 正文标点悄然变化 | R7：对比字符集（引号/撇号/双连字符/省略号）进基线；差异超出时以配置收敛 |

## 依赖与前置

- 当前工作区已通过三道门禁（astro 7.4.13 + unified 管线，2026-11-21 验证）——基线有效。
- Node 24.21.0 / npm 11.19（满足全部 engines）。
- 网络可达 npm registry（安装 satteri-callouts 等）与 JSR（若走 sat-mark 路线）。

## 明确不做的事

1. 不做全站逐页 HTML diff（基线 6 页为准，spec Assumptions 已声明）。
2. 不改动 i18n 路由、内容集合 schema、任何组件的客户端逻辑（contracts C4 只保证不破坏）。
3. 不引入新的测试框架或构建工具。
4. 不执行 `git commit` / `git push`（宪法 V）。
5. 不优化/重构与迁移无关的代码——插件重写以"行为等价"为唯一目标。
