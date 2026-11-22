# Research: Sätteri 管线迁移

**特性**: [spec.md](./spec.md) | **日期**: 2026-11-21 | **状态**: 全部决策已定，无遗留 NEEDS CLARIFICATION

> 本文档固化 2026-11-21 会话中的实测调研结论。所有标注"实测"的条目均在本地
> Node 24.21.0 + satteri 0.11.7 环境下直接运行验证，可复现。

## R1 处理器工厂与依赖声明方式

**Decision**: 配置使用 `import { satteri } from "@astrojs/markdown-satteri"` 的
`satteri()` 同步工厂构造 `markdown.processor`；`@astrojs/markdown-satteri` MUST 作为
显式依赖写入 package.json。

**Rationale**:

1. `satteri(opts?: SatteriProcessorOptions): MarkdownProcessor`（实测类型签名）正是
   `config.markdown.processor` 期望的处理器接口——`@astrojs/internal-helpers/markdown`
   注释原文："Factory functions like `unified()` / `satteri()` return one of these"。
2. astro 7.4.13 虽将 `@astrojs/markdown-satteri` 作为传递依赖引入，但直接 import 传递
   依赖正是本次升级事故（markdown-remark 改名导致构建失败）的根因，显式声明消除该类风险。

**Alternatives considered**:

- 不配置 processor、吃 astro 默认 satteri：被否——需要传插件与显式 features，必须持有工厂。
- `createSatteriMarkdownProcessor()`：被否——那是独立渲染器（返回 `Promise<MarkdownRenderer>`），
  用于脱离 Astro 配置的场景，不是 `markdown.processor` 的形状。

## R2 语法特性内建覆盖（实测）

**Decision**: 上标、下标、GFM 全部由 satteri 内建 features 启用，替代 remark-supersub 与
remark-gfm；无需任何插件。

**Rationale**（实测记录，2026-11-21，`markdownToHtml(md, { features: { gfm: true,
superscript: true, subscript: true } })`）:

| 输入 | 输出 | 结论 |
|------|------|------|
| `H^2^O 与 x^10^` | `H<sup>2</sup>O 与 x<sup>10</sup>` | 与 remark-supersub 行为一致 |
| `Ca~2+~ 离子` | `Ca<sub>2+</sub> 离子` | 一致 |
| `~~删除~~ 与 ~sub~ 混排` | `<del>删除</del> 与 <sub>sub</sub>` | **关键**：当前 unified 配置需 `remarkGfm({ singleTilde: false })` 才能避免的单波浪线冲突，satteri 天然正确 |
| GFM 表格 / 任务列表 | `<table>` / `<input type="checkbox">` | 一致 |
| 脚注 | GitHub 风格锚点 `<sup><a href="#user-content-fn-1">` | 一致 |
| `==重要文字==` | 原样输出 | 确认无内建（→ R3） |

**Alternatives considered**: 无——内建即最优。

## R3 `==mark==` 高亮方案

**Decision**: 优先尝试 npm 安装 `@mirrordown/sat-mark`（JSR 发布，输出 `<mark>`）；
若 JSR 包在 npm 工程中安装受阻或行为不符，自写扫描插件 `src/utils/satteriMark.ts`
（约 40 行）。

**Rationale**:

1. sat-mark 的实现方式为"文本扫描 `==..==` 并包装 mark 节点"（JSR 文档原文），自写等价物
   复杂度低、完全可控。
2. 自写版的硬要求：`==` 在 inline code 与 fenced code 内 MUST 原样输出（C1.4）——satteri
   visitor 按节点类型分发（text 与 code 是不同节点类型），天然具备区分能力。

**Alternatives considered**:

- 等 satteri 内建：pulldown-cmark 上游已合并 `ENABLE_HIGHLIGHT`（PR #599），satteri 底座
  即其 fork，内建只是时间问题——但不能作为本次依赖，时间表不受本项目控制。

## R4 callouts 方案

**Decision**: 采用 npm 现成包 `satteri-callouts`（1.0.2，"Satteri plugin for processing
and rendering blockquote-based"——即 GitHub alerts 语法）。

**Rationale**: npm search 全生态（20 包）中唯一的 callouts 实现，语法对口
（`> [!NOTE]` blockquote 形式）。

**风险**: 输出 DOM 与 rehype-callouts 可能存在差异（class 命名、结构层级）。验收方式为
V5 基线对比；若不一致，以 CSS 适配层对齐（不改内容、不改组件）。

**Alternatives considered**: 自写——被否，有现成包时先验证现成包。

## R5 正文内嵌 TOC 移除

**Decision**: `remark-toc` 与 `remark-collapse` 直接移除，不寻找 satteri 等价物。

**Rationale**（实测数据）: 全内容库 grep "Table of contents" 仅命中 1 处——
`src/data/blog/test-markdown-enhanced.md`。站点 TOC 的实际形态是组件层
（`TableOfContents.astro` 侧边栏 + `MobileToc.astro`），由渲染结果 `headings` 驱动，
与 markdown 管线无关。跨生态佐证：Hugo（`.TableOfContents`）、Zola（`page.toc`）均在
模板层实现，无任何生态在解析管线内做 TOC 注入。

**Alternatives considered**: 为 1 个测试文件保留整条插件链——成本收益完全不成立。

## R6 三个本地插件的重写可行性

**Decision**: `rehypeMermaidBlock`（114 行，含 rehypeCodeLines）、`rehypeImageDimensions`
（89 行）按 satteri hast 插件接口（`MdastPluginDefinition` / `HastPluginDefinition`：
`{ name, 按节点类型的 visitor }`）机械重写；文件更名 `satteriMermaidBlock.ts` /
`satteriImageDimensions.ts`，保持"一文件两插件"原布局。

**Rationale**:

1. 三个插件的变换逻辑均与 unified 无耦合——就是对 hast 树的遍历改写（实测源码确认）：
   - mermaid：`pre[data-language=mermaid]` → 包裹 `div.mermaid-block`（骨架 + 原 pre +
     djb2 hash key + `--mermaid-lines:N`）
   - 行号：`pre[dataLanguage]` 注入 `--code-lines:N` style
   - 图片：img 三源尺寸（URL query `?w=&h=` → 路径尾缀 `/600/400` → sharp 读本地文件，
     候选路径 public/、src/、cwd）+ `img-fade` class
2. satteri 的 hast AST **复用 hast 类型形状**（其类型文件直接 import `hast` 包类型），
   节点判断逻辑可原样迁移；差异仅在遍历机制（visitor 分发 vs 手写 walk）与变更 API
   （`ctx.replaceNode/insertBefore/insertAfter/wrap`，实测自 `HastVisitorContext` 类型）。
3. **异步待验证项**：sharp 的 `metadata()` 是 Promise。satteri 管线类型
   （`runMdastPluginsOnHandle` 返回 `MdastPipelineResult | Promise<MdastPipelineResult>`）
   表明插件可返回 Promise，但 visitor 方法级异步支持需 Stage B 最小实验确认。
   **降级路径**：query/path 两源为纯同步解析；本地文件源若不可异步，改构建期预生成尺寸
   清单或接受该子项降级并记录于报告。

**Alternatives considered**: 保留 unified 管线——即放弃本次特性，不在研究范围。

## R7 smartPunctuation 对齐

**Decision**: 显式配置 `features.smartPunctuation: true`（与现状一致——Astro 的 unified
默认同样开启，实测 `@astrojs/markdown-remark` 源码默认值取 `markdownConfigDefaults.smartypants`
即 true）；两者实现不同（retext-smartypants vs satteri 内建），差异以基线对比字符集验收：
直引号/撇号、双连字符（em dash）、三连点（省略号）。

**Rationale**: 默认值双重巧合（两边都开）不能作为正确性依据——显式声明 + 字符级对比才是
证据。若对比发现转换差异（如中文全角语境下的引号处理），以配置收敛或在报告中记录取舍。

**Alternatives considered**: 直接关闭 smartPunctuation——会改变现状渲染，违反零回归目标。

## R8 shiki transformers 兼容性

**Decision**: `markdown.shikiConfig` 配置位置不变，Astro 的 satteri 封装
（`createHighlightFn(syntaxHighlight, shikiConfig)`，实测类型）负责接入，5 个 transformers
（mermaidHidden、fileName、metaHighlight、notationHighlight/Word、notationDiff）预期透传。

**Rationale**: `SatteriMarkdownProcessorOptions extends AstroMarkdownOptions`（实测类型），
`syntaxHighlight` / `shikiConfig` 是 AstroMarkdownOptions 的固有字段，Astro 层对两个处理器
统一处理高亮——这正是"处理器无关抽象"（PR #16848）的设计意图。

**风险**: transformers 的执行时机/顺序若与 unified 管线不同，代码装饰（diff 底色、行高亮、
文件名标签）可能变化。V3 场景 6 与基线对比覆盖。

## 生态调研附录（spec 输入的固化）

其他静态站生态对同类功能的解法（佐证本方案方向）：

| 功能 | Hugo（Goldmark） | Jekyll（kramdown） | 本方案 |
|------|------------------|--------------------|--------|
| 上下标 | 官方 `hugo-goldmark-extensions`（Sub/Sup） | 内建 | satteri 内建 features |
| `==mark==` | 官方 extras.Mark | 内建 | sat-mark 或自写（内建在路上：pulldown-cmark #599） |
| TOC | 模板层 `.TableOfContents` | kramdown toc | 组件层（已有，不动） |
| mermaid | render hook + 客户端 | jekyll-mermaid 插件 | 重写 hast 插件 + 客户端（契约不变） |

npm satteri 生态清单（20 包，7 个为平台二进制）：`satteri-callouts`、
`@xingwangzhe/satteri-photoswipe`、`satteri-emoji`、`satteri-imgattr`、
`satteri-external-links` 等；无 toc / superscript / mark（除 JSR 的 sat-mark）/
mermaid / code-lines 包——缺口全部由本方案覆盖。
