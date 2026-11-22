# Feature Specification: Markdown 管线迁移至 Sätteri（Astro 默认）

**Feature Branch**: `003-satteri-markdown-migration`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "可以 按照这个路线来规划一下吧"（上下文：按已完成的调研路线，将站点
Markdown 渲染管线从 unified（`@astrojs/markdown-remark`）迁移至 Astro 7.4 起默认的 Sätteri
（`@astrojs/markdown-satteri`），移除退役依赖且不损失任何既有 Markdown 特性）

## Clarifications

### Session 2026-11-21

- Q: 迁移到 satteri 后，6 个缺失的 unified 插件怎么办？ → A: 调研已确认：上下标为 satteri 内建
  features；callouts 有现成包 `satteri-callouts`；`==mark==` 有 `@mirrordown/sat-mark`（或自写
  扫描插件）；正文内嵌 TOC（remark-toc）全站仅 1 个测试文件使用，随迁移移除；mermaid/行号/
  图片尺寸 3 个本地插件按 satteri 插件接口机械重写。
- Q: smartPunctuation 在 Astro 的 satteri 默认为开启，与现状是否一致？ → A: 迁移时必须显式配置
  并以迁移前后渲染对比验证，不依赖默认值。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 读者浏览体验零回归 (Priority: P1)

读者打开任何一篇文章或书籍章节，看到的 Markdown 渲染结果与迁移前完全一致：上下标、高亮标记、
表格、任务列表、脚注、删除线、callouts、mermaid 图、代码行号、图片尺寸无一变化或丢失。

**Why this priority**: 渲染回归是本次迁移唯一可能伤害用户的路径。语法特性是站点内容的既有契约，
任何一项退化都是对读者的可见损害。

**Independent Test**: 打开 `src/data/blog/` 下的 Markdown 特性展示页（markdown-tips、
test-markdown-enhanced、test-markdown-rendering）与书籍 `getting-started/markdown-test`，
逐项对照迁移前的渲染基线，全部一致即通过。

**Acceptance Scenarios**:

1. **Given** 正文包含 `H^2^O` 与 `Ca~2+~`，**When** 页面渲染，**Then** 分别输出
   `<sup>` 与 `<sub>`，与迁移前一致。
2. **Given** 正文包含 `==重要==`，**When** 页面渲染，**Then** 输出 `<mark>` 元素且样式与
   迁移前一致。
3. **Given** 正文包含 GFM 表格、任务列表、脚注与 `~~删除线~~`，**When** 渲染，**Then** 各元素
   结构与迁移前一致，且 `~~删除~~` 与 `~下标~` 混排时各得其所（已实测 satteri 行为正确，
   列为回归项）。
4. **Given** 正文包含 `> [!NOTE]` 等 GitHub callouts，**When** 渲染，**Then** callouts 的
   DOM 结构与视觉样式与迁移前一致。
5. **Given** 正文包含 mermaid 代码块，**When** 页面加载，**Then** 先显示骨架占位，随后由
   客户端 Mermaid 渲染为图，行为与迁移前一致。
6. **Given** 正文包含多行代码块，**When** 渲染，**Then** 行号显示与迁移前一致。
7. **Given** 正文包含本地或带尺寸参数的图片，**When** 渲染，**Then** 图片带有 width/height
   属性，页面无布局抖动。
8. **Given** 文章具有多级标题，**When** 在宽屏与移动端浏览，**Then** 侧边栏与移动端 TOC
   显示与迁移前一致（组件层 TOC 不受迁移影响）。

---

### User Story 2 - 维护者依赖栈健康 (Priority: P1)

维护者升级 Astro 后不再依赖已退役的 `@astrojs/markdown-remark` 及其 unified 插件链，项目
Markdown 管线与 Astro 默认管线对齐，后续升级不再因内部包改名而中断构建。

**Why this priority**: 本次迁移的动机即在于此。退役包虽然仍可用，但每次 Astro 升级都可能再次
出现"内部包消失导致构建失败"的事故（本次升级 7.2.4 → 7.4.13 已实际发生一次）。

**Independent Test**: 检查 `package.json` 与 `astro.config.ts`，确认 7 个 unified 生态依赖
全部移除、无任何残留引用，且完整构建通过。

**Acceptance Scenarios**:

1. **Given** 迁移完成，**When** 检查依赖清单，**Then** `@astrojs/markdown-remark`、
   `remark-toc`、`remark-collapse`、`remark-supersub`、`remark-gfm`、
   `remark-mark-highlight`、`rehype-callouts` 均已不在 `package.json` 中。
2. **Given** 迁移完成，**When** 全仓库搜索上述包名，**Then** 除规格文档外无任何代码引用。
3. **Given** Markdown 配置使用 satteri 处理器，**When** 后续升级 Astro 小版本，**Then**
   构建不再因 markdown 内部包改名或移除断裂（对齐官方默认管线）。

---

### User Story 3 - 构建效率与产物完整 (Priority: P2)

维护者执行完整构建，构建耗时不超过迁移前（期望因 Rust 管线获得提速），产物页数、双语索引与
搜索索引与迁移前完全一致。

**Why this priority**: 性能是 satteri 的主要卖点，但站点体量小（32 页），收益为锦上添花；
产物完整性才是硬约束。

**Independent Test**: 迁移前后各执行一次完整构建，记录耗时、产物页数与搜索索引统计，逐项对比。

**Acceptance Scenarios**:

1. **Given** 迁移完成的代码，**When** 依次执行 lint → format:check → build，**Then** 三道
   门禁全部通过。
2. **Given** 完整构建产物，**When** 统计页面数与搜索索引，**Then** 双语言页面与索引条目与
   迁移前一致，无页面丢失。
3. **Given** 迁移前后的构建耗时记录，**When** 对比，**Then** 迁移后不劣化。

---

### Edge Cases

- 行内代码与代码块中的 `==`、`^`、`~` 字符必须原样输出，不得被语法扩展或扫描式插件误解析。
- `~~删除线~~` 与 `~下标~` 在同一文档混排时必须分别渲染为 `<del>` 与 `<sub>`。
- smartPunctuation（弯引号、破折号、省略号转换）行为必须与迁移前一致：Astro 的 satteri
  默认值与 unified 管线默认不同，必须显式配置并以渲染对比验证，不得依赖默认值。
- MDX 内容（`*.mdx`）走新管线渲染，输出与迁移前一致。
- 现有 shiki transformers（diff 标注、高亮标注、文件名、mermaid 隐藏）在新代码高亮管线下
  必须全部生效。
- 唯一使用正文内嵌 TOC（"Table of contents" 标记）的文件 `test-markdown-enhanced.md` 在
  特性移除后不得导致构建错误，内容呈现应合理降级（标记文本保留为普通标题）。
- 无标题文档、无图片文档、纯文本文档在新管线下正常渲染，不因插件缺席报错。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 站点 Markdown 处理器 MUST 切换为 Astro 官方 satteri 处理器工厂，MUST 移除
  `@astrojs/markdown-remark` 直接依赖，配置与代码中 MUST NOT 残留任何 unified 管线引用。
- **FR-002**: 上标 `^x^`、下标 `~x~`、GFM（表格、任务列表、脚注、删除线）MUST 通过 satteri
  内建语法开关启用，输出元素与迁移前一致。
- **FR-003**: `==高亮==` 语法 MUST 继续渲染为 `<mark>` 元素（采用 satteri 生态插件或自写等价
  插件），且 MUST NOT 解析行内代码与代码块内的 `==` 字符。
- **FR-004**: GitHub callouts（`> [!NOTE]` 等）MUST 采用 satteri 生态方案渲染，DOM 结构与
  视觉样式与迁移前一致。
- **FR-005**: mermaid 代码块 MUST 由重写后的 hast 插件转换为骨架占位结构，保留现有客户端
  渲染契约（与 `MermaidRenderer` 组件的接口不变）。
- **FR-006**: 代码块行号能力 MUST 保留：重写后的插件 MUST 维持现有 CSS 变量注入约定，
  行号视觉表现不变。
- **FR-007**: 图片尺寸注入 MUST 保留：URL 查询参数（`?w=&h=`）、路径尾缀（`/600/400`）、
  本地文件读取三种尺寸来源的解析行为与迁移前一致。
- **FR-008**: 正文内嵌 TOC 特性（remark-toc + remark-collapse）MAY 随迁移移除；侧边栏与
  移动端 TOC（组件层）MUST 不受影响；唯一使用该特性的测试文件 MUST 同步更新且构建不报错。
- **FR-009**: smartPunctuation MUST 显式配置，渲染结果 MUST 与迁移前一致（以特性展示页中
  含引号、省略号、破折号的段落为对比样本）。
- **FR-010**: 迁移完成前 MUST 依次通过 lint → format:check → build 三道门禁，且 MUST 执行
  渲染回归核对（US1 的 8 个场景逐项通过）。
- **FR-011**: 构建产物 MUST 完整：页面数、双语搜索索引条目与迁移前一致，无内容丢失。

### Key Entities *(include if feature involves data)*

- **语法特性映射表**：unified 插件 → satteri 方案（内建 feature / 生态包 / 自写插件）的对照
  清单，含每项的验证方式。
- **渲染回归核对清单**：特性展示页与书籍章节 × 8 个验收场景的核对矩阵，作为迁移完成的证据。
- **重写插件件**：mermaid 块转换、代码行号注入、图片尺寸注入、mark 扫描（如自写）四个
  satteri 插件件，接口风格遵循 satteri 插件规范。
- **构建基线记录**：迁移前后的构建耗时、产物页数、索引统计，用于 US3 对比。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 渲染回归核对清单 8 个场景在全部特性展示页与书籍章节上 100% 通过，零视觉回归。
- **SC-002**: 依赖清单移除 7 个 unified 生态包，全仓库代码引用残留为 0。
- **SC-003**: 三道门禁全部通过，构建产物页数与双语索引条目与迁移前完全一致。
- **SC-004**: 完整构建耗时不高于迁移前基线（记录对比数值）。
- **SC-005**: 正文内嵌 TOC 移除后，唯一受影响文件构建无错误且呈现合理降级。

## Assumptions

- `@mirrordown/sat-mark` 若因 JSR 注册表在 npm 工程中安装受阻，则改为自写等价的文本扫描
  插件（调研确认其实现为扫描式，复杂度约 40 行）。
- 正文内嵌 TOC 的移除是接受的范围内决策：全站仅 1 个测试文件使用，侧边栏/移动端组件 TOC 是
  主要形态且不受迁移影响。
- 渲染一致性验收以 4 个 Markdown 特性展示页与书籍章节为基线，不做全站逐页 HTML diff；如
  `/speckit.plan` 认为必要可扩展基线。
- 站点体量小，构建提速为记录项而非硬指标（SC-004 仅要求不劣化）。
- 迁移后 `remark-rehype`、smartypants 等 unified 概念不再出现在站点配置中；宪法原则 II 的
  三道门禁在迁移完成前完整执行。
- 调研结论（satteri Features 开关清单、`~~` 与 `~` 共存行为实测、生态包清单）视为已验证的
  前置事实，本规格不重复论证。
