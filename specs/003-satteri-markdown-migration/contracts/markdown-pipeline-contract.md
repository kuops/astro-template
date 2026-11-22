# Contract: Markdown 管线（Sätteri 迁移）

**特性**: [spec.md](../spec.md) | **日期**: 2026-11-21

本契约是迁移的**行为等价基准**：重写插件与配置的输出 MUST 满足 C1；插件接口遵循 C2；
配置形状遵循 C3；客户端组件依赖的 DOM 结构遵循 C4。所有断言以 `_migration_baseline/`
中的迁移前实际产物为最终仲裁。

## C1 渲染输出契约（HTML/DOM 级）

### C1.1 上下标与 GFM

- `^x^` → `<sup>x</sup>`；`~x~` → `<sub>x</sub>`
- `~~x~~` → `<del>x</del>`，与 `~x~` 同文档混排各得其所
- GFM 表格 → `<table>`（thead/tbody 结构与基线一致）；任务列表 →
  `<li class="task-list-item">` + `<input type="checkbox">`；脚注 → GitHub 风格锚点
  （`#user-content-fn-*`）
- 对照基线片段：`_migration_baseline/syntax-gfm.html`

### C1.2 高亮标记

- `==x==` → `<mark>x</mark>`，class/样式与基线视觉等价
- 对照：`_migration_baseline/syntax-mark.html`

### C1.3 callouts

- `> [!NOTE]` 等 → 基线 DOM 结构（元素层级与 class 集合）；`satteri-callouts` 输出若与
  rehype-callouts 不一致，MUST 以 CSS 适配层对齐到基线视觉，MUST NOT 改动内容或组件
- 对照：`_migration_baseline/syntax-callouts.html`

### C1.4 代码上下文保护（硬性，不可豁免）

- inline code（`` `a == b ^ c ~ d` ``）与 fenced code block 内的 `==`、`^`、`~`
  MUST 原样输出为文本，MUST NOT 产生 `<mark>` / `<sup>` / `<sub>`
- 验证用例进 V4，基线：`_migration_baseline/syntax-code-context.html`

### C1.5 代码块

- `pre` 保留 `data-language` 属性（行号与 mermaid 判定依赖）
- 每个含 `data-language` 的 `pre` 带 `style` 含 `--code-lines:N`（N = 内容行数）
- shiki 输出结构与 transformers 装饰（diff 底色、行高亮、文件名标签）与基线一致
- 对照：`_migration_baseline/syntax-codeblock.html`

### C1.6 图片

- 所有内容 `img` 带 `img-fade` class
- 尺寸注入优先级：已有 width/height 跳过 → URL query（`?w=&h=`）→ 路径尾缀
  （`/600/400`）→ 本地文件读取（sharp，候选路径 public/ → src/ → cwd，取 `src` 去除
  query/hash 后解析）；注入结果为 `width` + `height` 属性对
- 对照：`_migration_baseline/syntax-image.html`

### C1.7 smartPunctuation 字符集

- 直引号→弯引号、撇号、`--`→em dash、`...`→省略号的转换结果与基线字符级一致
- 对照：`_migration_baseline/syntax-punct.html`

### C1.8 MDX

- `*.mdx`（zh 与 en）渲染输出与基线一致（组件插值、JSX 表达式行为）

## C2 重写插件接口契约（satteri 风格）

每个插件为 satteri 插件定义对象：`{ name: string, <节点类型>visitor(node, ctx) }`，
ctx 提供 `replaceNode / insertBefore / insertAfter / removeNode / wrap` 等变更 API。

| 插件 | kind | 触发条件 | 变换 |
|------|------|----------|------|
| `satteriCodeLines` | hast | `pre` 且有 `data-language` | style 追加 `--code-lines:N` |
| `satteriMermaidBlock` | hast | `pre[data-language=mermaid]` 或含 `code.language-mermaid` | 替换为 `div.mermaid-block`（C4），原 pre 保留为其子节点 |
| `satteriImageDimensions` | hast | `img` | C1.6 的 class 与尺寸注入 |
| `satteriMark`（条件性，仅 R3 自写路线） | mdast | 文本节点，且不在 code 上下文 | `==..==` 段替换为 mark 节点 |

- 插件 `name` MUST 唯一且以 `satteri` 前缀开头（错误信息可追溯）
- `satteriImageDimensions` 的 sharp 异步可行性由 Stage B 最小实验定夺；不可行时的降级
  MUST 记录于 BuildBaseline.notes 并通知维护者

## C3 配置契约（astro.config.ts）

```ts
import { satteri } from "@astrojs/markdown-satteri";

markdown: {
  processor: satteri({
    features: {
      gfm: true,
      superscript: true,
      subscript: true,
      smartPunctuation: true, // 显式，不依赖默认（research R7）
    },
    mdastPlugins: [/* mark 插件（若为 mdast 实现） */],
    hastPlugins: [/* callouts、mermaid、codeLines、imageDims */],
  }),
  shikiConfig: { /* 原样保留：themes/transformers 等 */ },
}
```

- `processor`、`features`、插件数组外的 markdown 配置（shikiConfig 等）原样保留
- 配置中 MUST NOT 出现 `unified`、`remarkPlugins`、`rehypePlugins` 字样（残留清查项）

## C4 客户端 DOM 契约（MermaidRenderer 兼容面）

`MermaidRenderer.astro` 依赖以下由 `satteriMermaidBlock` 产出的结构，重写 MUST 原样保持：

```html
<div class="mermaid-block" aria-busy="true" data-mermaid-key="<hash>" style="--mermaid-lines:N">
  <div class="mermaid-skeleton" aria-hidden="true">
    <span class="mermaid-spinner"></span>
    <span class="mermaid-shimmer"></span> ×3
  </div>
  <pre data-language="mermaid">…原代码块…</pre>
</div>
```

- `data-mermaid-key` = 源文本（trim 后）djb2 hash 的 base36（与原实现逐位一致）
- 骨架 span 数量与 class 逐字一致；`--mermaid-lines` = 源行数
- 该契约破坏 = 客户端渲染断裂（宪法 IV 红线），V6 验收

## C5 依赖契约

- package.json MUST 含：`@astrojs/markdown-satteri`、`satteri-callouts`（+ mark 方案项）
- package.json MUST NOT 含：`@astrojs/markdown-remark`、`remark-toc`、`remark-collapse`、
  `remark-supersub`、`remark-gfm`、`remark-mark-highlight`、`rehype-callouts`
- `package-lock.json` 与 package.json 同步（宪法：技术约束）
- src/ 下 MUST NOT import 上述 7 个移除包（清查：grep 七包名，命中数 0）
