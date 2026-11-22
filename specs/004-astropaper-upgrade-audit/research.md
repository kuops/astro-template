# Research: AstroPaper 上游版本差异审计

**特性**: [spec.md](./spec.md) | **日期**: 2026-11-21 | **状态**: 上游数据全部实测采集，无遗留 NEEDS CLARIFICATION

> 本文档记录规划期实测采集的上游原始数据与本站基准。采集方式：releases.atom +
> compare `.diff`（GitHub 网端点，无 API 限流），原件缓存于 `_audit_cache/`。

## R1 上游版本图谱（实测）

| 版本 | 发布日期 | 类型 | 与本站基线关系 |
|------|----------|------|----------------|
| v6.1.0 | 2026-06-06 | minor | **本站分叉基线**（package.json version 6.1.0） |
| v7.0.0 | 2026-10-29 | **major** | 审计对象 |
| v7.1.0 | 2026-11-06 | minor | 审计对象 |
| v7.2.0 | 2026-11-15 | minor | **上游最新**，审计对象 |

6.1.0 → 7.2.0 之间**无遗漏版本**（atom feed 与 release 列表双重核对）。
数据截止：2026-11-21。

## R2 各版本变更要点（来源：release notes 原文，已缓存）

### v7.0.0（major，Astro 7 升级 + 修复集）

- Astro v7（7.4.2）；**Node >=22.23.4**（硬要求）
- 破坏性：`compressHTML: 'jsx'` 行内元素空格剥离；编译器更严格（未闭合标签构建失败）
- 修复：上下篇链接方向（#674）、表格列对齐（#668）、skip-to-content 焦点（#665）、
  同名文章重复 view-transition-name（#662）
- 工程化：Dependabot 分组更新（#699）

### v7.1.0（minor，原生 TOC + 灯箱增强）

- **文章旁 TOC**：≥2 个 h2/h3 时 1280px+ 显示、小屏浮动按钮；`features.toc` 配置 +
  每篇 `hideToc`；新组件 PostToc/TocList + `buildTocTree.ts` + `rehypeInlineToc.js`
- **废弃 remark-toc / remark-collapse**（v8 移除；正文 `## Table of contents` 标记
  写法废弃，构建警告）
- 灯箱增强：滚轮缩放、拖拽平移、移动端捏合（#666）
- i18n：`post.tableOfContents`、`a11y.skipTableOfContents` 文案（v8 前可选）
- **工程化迁移 pnpm**（pnpm-lock.yaml + pnpm-workspace.yaml）

### v7.2.0（minor，custom 插槽）

- **`src/custom/` 三插槽**：Head.astro（每页 head 末尾）、BodyEnd.astro（body 末尾）、
  PostEnd.astro（文章末尾，接收 post 参数）——空置时零输出；上游承诺永不改动该目录
- LaTeX 指南的 KaTeX CSS 引入位置迁至 custom/Head.astro

## R3 文件级变更面（实测）

v6.1.0...v7.2.0 diff 共 **10335 行、68 个文件**（全量缓存 `_audit_cache/upstream.diff`）。
按功能簇归类：

| 功能簇 | 文件 | 适配本站初步判断 |
|--------|------|------------------|
| 原生 TOC 系统 | PostToc/TocList 组件、buildTocTree、rehypeInlineToc、astro-paper.config（features.toc）、postFilter | **冲突区**（本站组件级 TOC + Sätteri 管线，见 R4） |
| custom 插槽 | src/custom/{Head,BodyEnd,PostEnd}.astro、Layout.astro、posts/[...slug]/index.astro | adopt 候选（扩展点模式） |
| 灯箱增强 | （上游自身灯箱实现） | 对照本站 PhotoSwipe 评估 |
| 修复集 | Breadcrumb/Card/Datetime/Header/404/search/archives/index.astro、resolveTimezone、resolveDefaultOgImagePath | 逐条核对本站是否已有等价修复 |
| 管线 | astro.config.ts（rehypeHeadingIds/InlineToc/TableWrapper，保留 unified）、remark-collapse.d.ts | **路径分叉区**（本站 Sätteri） |
| 表格 | ResponsiveTable.astro、rehypeTableWrapper.js、typography.css | adopt 候选（表格列对齐修复 #668） |
| OG | og.png.ts、index.png.ts、resolveDefaultOgImagePath.ts | 对照本站 satori 方案 |
| i18n | index.ts（TOC 文案 fallback）、types.ts、lang/en.ts | 本站 i18n 为超集，仅文案对照 |
| 工程化 | pnpm-lock/workspace、dependabot.yml、ci.yml、copy-pagefind.mjs、CONTRIBUTING/README | pnpm 不可采用（宪法 npm）；copy-pagefind 为 Windows 兼容候选 |
| 依赖 | package.json（详见 R5） | 逐项对照本站版本 |

## R4 关键路径分叉（冲突预警，实测确认）

1. **Markdown 管线**：上游 v7 仍为 unified——显式依赖 `@astrojs/markdown-remark
   ^7.3.6`，TOC 用自研 `rehypeInlineToc`（unified rehype 插件）实现。本站已于特性
   003 迁移 **Sätteri**（`satteri()` 工厂 + mdast/hast 插件），并删除了
   remark-toc/remark-collapse——**与上游 v7.1.0 的 TOC 废弃方向一致，但实现路径
   不同**。上游的 rehype 形态插件不可直接采用，需 Sätteri 形态等价实现（如需）。
2. **TOC 语义对照**（防"表面相似"误判）：本站 TableOfContents.astro（xl 断点侧栏）
   + MobileToc.astro（移动端），由渲染 headings 驱动；上游为 ≥2 个 h2/h3 触发、
   1280px 断点、浮动按钮、features.toc 全局开关 + hideToc 篇级开关。**大体等价但
   配置面与触发细节不同**，判定时须逐点核对。
3. **包管理**：上游迁移 pnpm；本站宪法技术约束锁定 npm——`not_applicable`（宪法依据）。

## R5 依赖对照（实测 package.json diff vs 本站当前）

| 依赖 | 上游 7.2.0 | 本站现状 | 相对位置 |
|------|------------|----------|----------|
| astro | ^7.4.8 | 7.4.13 | **本站领先** |
| @astrojs/mdx | ^8.1.3 | 8.1.6 | **本站领先** |
| @astrojs/markdown-remark | ^7.3.6（显式 dependencies） | 已移除（Sätteri） | 路径分叉 |
| satori | **^0.63.2** | 0.26.0 | **上游大幅领先**（大版本跨越，OG 相关） |
| sharp | ^0.35.5 | 0.34.5 | 上游领先 |
| rehype-callouts | ^2.2.0 | 已移除（satteri-callouts 替代） | 路径分叉 |
| pagefind / @pagefind/* | ^1.6.0 | 1.5.2 | 上游领先 |
| eslint-plugin-astro | ^3.2.1 | 3.1.0 | 上游领先（注意：3.1.0 曾报 EBADENGINE） |
| prettier | 3.9.10 | 3.8.3 | 上游领先 |
| @shikijs/transformers | ^4.6.0 | 4.4.3 | 上游领先 |
| tailwindcss / @tailwindcss/vite | ^4.3.5 | 4.3.0 | 上游领先 |
| node engines | >=22.23.4 | 本机 24.21.0 / CI 24 | 本站满足 |

## R6 本站自研区基准（Stage B 输入，来自仓库现状）

1. i18n 双语体系：zh 默认无前缀 + en 前缀 + 缺译回退/canonical（src/i18n/ 超集、astro.config.ts i18n 配置）
2. 书籍章节体系：BookLayout/BookChapterContent/BookSidebar/books.ts 目录推导
3. 组件级 TOC：TableOfContents.astro（xl 侧栏）+ MobileToc.astro
4. Markdown 管线：Sätteri（astro.config.ts satteri() 工厂）
5. 管线插件组：satteri-callouts、satteriMermaidBlock（mermaid 骨架 + 行号）、satteriImageDimensions、satteriDegreeSup（°C 上标）、sat-mark
6. OG 生成：satori + resvg（src/pages 相关 + 组件）
7. 搜索：Pagefind + PagefindModal.astro 模态
8. 灯箱：PhotoSwipe（ImageLightbox.astro）
9. 文章组件群：ShareLinks、ReadingMetadata、ArticleEnhancements、BackToTopButton 等
10. 布局细节：Header 搜索模态集成、页脚、归档等本地化改造

## 结论与剩余不确定性

- 上游 3 版本的变更事实已全部采集并缓存，剩余工作是**深读 diff hunk → 逐项判定 → 撰写报告**
  （Stage B–D），无阻塞性未知。
- 唯一需实施期补充采集的点：个别修复项（如 #674 上下篇方向）需确认本站现状是否已
  自行修复过——以本地代码检索为准，不阻塞。
