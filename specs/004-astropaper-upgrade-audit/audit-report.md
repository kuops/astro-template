# AstroPaper 上游差异审计（v6.1.0 → v7.2.0）

**数据截止日期**：2026-11-21（上游最新版 v7.2.0，发布于 2026-11-15）
**分叉基线**：本站 package.json version `6.1.0`（上游 v6.1.0，2026-06-06）
**特性**：[spec.md](./spec.md) | **原始数据**：`_audit_cache/`（releases.atom + 10335 行全量 diff）

---

## 1. 结论摘要

**上游共发布 3 个版本**（v7.0.0 major / v7.1.0 / v7.2.0），68 个文件变更，无破坏本站
架构的强制升级项——上游 v7 仍停留在 unified 管线，而本站已迁移 Sätteri（特性 003），
双方对 remark-toc/remark-collapse 的废弃方向一致但实现路径分叉。

### 三组决策清单

**✅ 建议立即采用（3 项，全部为 P1 真实缺陷修复，工作量均为 S）**

| 编号 | 内容 | 上游来源 |
|------|------|----------|
| C01 | 上下篇链接方向修正（prev/next 指向反了） | #674 |
| C04 | view-transition-name 改用文章 id（同名文章冲突） | #662 |
| C05 | ld+json 的 `</script>` 提前闭合防护 | v7.1.0（PostLayout） |

**⏸ 暂缓观察（15 项：P2/P3 adopt 13 + tradeoff 2）**

- P2 adopt：C02 表格滚动包裹、C03 skip-link 真焦点、C07 归档页时区分组、
  C19 pagefind 1.6
- P3 adopt：C06 时区健壮性、C10 TOC 配置面（features.toc/hideToc）、C12 custom 插槽、
  C20 eslint-plugin-astro 3.2.1、C21 prettier 3.9、C22 tailwind 4.3.5、
  C23 shiki transformers 4.6、C25 dependabot 分组更新、C26 Actions 版本升级
- tradeoff：C17 satori 0.26→0.63.2 + sharp 升级（含 OG 模板适配，需快照回归）、
  C28 定时发布改"日粒度"语义

**❌ 不采用（10 项）**

- already_have：C08 astro7 空格加固、C09 原生文章旁 TOC、C11 内联 TOC 废弃、
  C13 灯箱缩放增强、C14 TOC 文案、C15 astro7/node、C16 mdx 8
- not_applicable：C18 rehype-callouts（本站 satteri-callouts 替代）、
  C24 copy-pagefind（Windows 兼容，本站无 Windows 场景）、
  C27 pnpm 迁移（宪法锁定 npm）

判定统计：**28 项 = adopt 16 + already_have 7 + not_applicable 3 + tradeoff 2**。
三组之和 = 3 + 15 + 10 = 28，与第 4 章对照项总数闭合。

---

## 2. 上游版本图谱

| 版本 | 日期 | 类型 | 要点 | 来源 |
|------|------|------|------|------|
| v7.0.0 | 2026-10-29 | **major** | Astro v7（7.4.2）；Node ≥22.23.4 硬要求；`compressHTML: 'jsx'` 行内空格剥离（破坏性）；编译器更严格；修复：上下篇方向 #674、表格列对齐 #668、skip-link 焦点 #665、重复 view-transition-name #662；Dependabot 分组 #699 | [release](https://github.com/satnaing/astro-paper/releases/tag/v7.0.0) |
| v7.1.0 | 2026-11-06 | minor | 文章旁原生 TOC（≥2 个 h2/h3、1280px+、移动端浮动按钮；`features.toc` 全局开关 + `hideToc` 篇级开关）；**废弃 remark-toc / remark-collapse**（v8 移除，正文 `## Table of contents` 写法废弃并构建告警）；灯箱滚轮缩放/拖拽/捏合 #666；i18n 新增 TOC 文案；**迁移 pnpm** | [release](https://github.com/satnaing/astro-paper/releases/tag/v7.1.0) |
| v7.2.0 | 2026-11-15 | minor | **`src/custom/` 三插槽**：Head（每页 head 末尾）/ BodyEnd（body 末尾）/ PostEnd（文章末尾，接收 post）；空置零输出；上游承诺永不改动该目录；KaTeX CSS 引入迁至 custom/Head | [release](https://github.com/satnaing/astro-paper/releases/tag/v7.2.0) |

依赖面变化详见第 4 章 C15–C27；文件级明细见 `_audit_cache/upstream.diff`（68 文件）。

---

## 3. 本站自研区基准

以下区域为本站已偏离上游的自研实现（判定 `already_have` 与冲突风险的参照系）：

| # | 区域 | 本站实现位置 |
|---|------|--------------|
| SB1 | i18n 双语体系（zh 默认无前缀 + 缺译回退/canonical） | `src/i18n/`（format/locale 扩展）、`astro.config.ts` i18n 段 |
| SB2 | 书籍章节体系 | `src/layouts/BookLayout.astro`、`src/components/Book*.astro`、`src/utils/books.ts` |
| SB3 | 组件级 TOC | `src/components/TableOfContents.astro`（xl 侧栏）、`MobileToc.astro`（浮动按钮） |
| SB4 | Markdown 管线 = Sätteri | `astro.config.ts`（`satteri()` 工厂 + features 显式配置） |
| SB5 | 管线插件组 | `src/utils/satteriMermaidBlock.ts`（mermaid 骨架 + 行号）、`satteriImageDimensions.ts`、`satteriDegreeSup.ts`、`satteri-callouts`、`@mirrordown/sat-mark` |
| SB6 | OG 图生成 | `src/utils/og-templates/*.js`、`src/pages/og.png.ts`、`src/pages/posts/[...slug]/index.png.ts`、`src/pages/[locale]/posts/[...slug]/index.png.ts` |
| SB7 | 搜索 | Pagefind + `src/components/PagefindModal.astro` |
| SB8 | 灯箱 | PhotoSwipe（`src/components/ImageLightbox.astro`） |
| SB9 | 文章组件群 | `ShareLinks`、`ReadingMetadata`、`ArticleEnhancements`、`BackToTopButton` 等 |
| SB10 | 布局细节 | Header 搜索模态集成、双语页脚、本地化改造 |

---

## 4. 逐项对照判定

判定枚举：`adopt`（需要采用）/ `already_have`（本站已自研等价）/ `not_applicable`
（不适用）/ `tradeoff`（需权衡）。每项含双重证据；触及自研区的标注 ⚠️。

### 4.1 修复集簇（v7.0.0）

**C01 上下篇链接方向** — verdict: **adopt（P1 / S）** ⚠️SB9
- 上游：sortedPosts 为最新在前，旧代码 prev 取 index−1（实为"更新的一篇"），#674 交换了赋值
- 本站：`src/pages/blog/[...slug]/index.astro:42` 存在**相同的前置 bug 模式**
  （prevPost = index−1），UI 标签（`t.post.previousPost`）语义因此错位
- 依据：本地代码检索 + [release v7.0.0](https://github.com/satnaing/astro-paper/releases/tag/v7.0.0)

**C02 宽表格滚动包裹** — verdict: **adopt（P2 / S）**
- 上游：新增 `rehypeTableWrapper.js`（表格包进可聚焦横滚 `div.table-wrapper`，键盘可达）+
  `ResponsiveTable` 增强 + #668 表格列对齐修复
- 本站：无表格包裹实现（`src/styles/typography.css` 仅有 overflow-x-clip），
  宽表格（如 markdown-tips 演示）存在同款溢出问题
- 依据：本地 `grep ResponsiveTable` 无结果 + diff 新文件

**C03 skip-to-content 真焦点** — verdict: **adopt（P2 / S）**
- 上游：Header.astro 新增点击处理器，`preventDefault` 后真实 `focus()` + 滚动到
  `#main-content`（无障碍：键盘用户焦点实际移动）
- 本站：`src/components/Header.astro:61` 仅有裸锚点 `href="#main-content"`，焦点不移
- 依据：本地检索 + diff

**C04 view-transition-name 用文章 id** — verdict: **adopt（P1 / S）** ⚠️SB9
- 上游：`toTransitionName(title)` → `toTransitionName(post.id)`（Card.astro 与文章页 h1），
  消除同名文章的重复 transition-name
- 本站：`src/components/Card.astro:46` 仍为 `toTransitionName(title)`；
  `PostDetails.astro:130` 为 `slugifyStr(title...)`——同款冲突模式
- 依据：本地检索 + #662

**C05 ld+json `</script>` 防护** — verdict: **adopt（P1 / S）**
- 上游：PostLayout 将 `JSON.stringify(structuredData)` 的 `<` 转义为 `\u003c`，
  防止标题含 `</script>` 时提前闭合脚本块
- 本站：`src/layouts/Layout.astro:131` 为裸 `JSON.stringify(structuredData)`——同款隐患
- 依据：本地检索 + diff

**C06 时区健壮性（resolveTimezone）** — verdict: **adopt（P3 / S）**
- 上游：新增 `resolveTimezone.ts`——非法 IANA 时区名降级 UTC + 一次性告警，
  避免整站构建崩溃
- 本站：`Datetime.astro:35` 裸用 `postTimezone || config.site.timezone`；
  当前值（Asia/Shanghai）合法故无实际故障，属健壮性加固
- 依据：本地检索 + diff 新文件

**C07 归档页时区分组** — verdict: **adopt（P2 / S）**
- 上游：归档页年/月分组改用站点时区（dayjs tz），而非构建机本地时区
- 本站：`src/pages/archives/index.astro:35,46` 仍用 `pubDatetime.getFullYear()/getMonth()`
  （构建机时区）——CI 为 UTC、站点时区 Asia/Shanghai，时区边界文章会归错月/年
- 依据：本地检索 + diff

**C08 astro7 行内空格加固** — verdict: **already_have**
- 上游：v7 的 `compressHTML: 'jsx'` 会剥离内联元素间空格，上游在自己页面补 `{" "}`
- 本站：本站已在 astro 7.4.13 上运行；实测 `dist/index.html` 中 `README</a> for`
  的空格**保留完好**（该行为在本版本未复现），`</h1><a` 相邻为块级边界无视觉影响。
  后续若触碰相关文件可顺手加 `{" "}`，非必需

### 4.2 TOC 系统簇（v7.1.0）⚠️SB3 / ⚠️SB4

**C09 原生文章旁 TOC（核心）** — verdict: **already_have（含语义差异，见下）**
- 上游：`PostToc`/`TocList`/`buildTocTree`（h2–h3 嵌套树、≥2 条触发、1280px+ 侧显、
  移动端浮动按钮）
- 本站：`TableOfContents.astro`（xl = 1280px 侧栏，headings 驱动）+ `MobileToc.astro`
  （固定浮动按钮展开）——**核心 UX 等价**
- 语义差异（防表面相似，逐点核对）：
  | 维度 | 上游 | 本站 |
  |------|------|------|
  | 触发阈值 | ≥2 个 h2/h3 才显示 | headings 非空即显示 |
  | 树构建 | buildTocTree（跳级容错） | minDepth 起平铺 |
  | 数据来源 | `render(post).headings` + 自建树 | `render(post).headings`（相同） |
  - 差异属实现细节，不影响维护者体验，故整体判 already_have

**C10 TOC 配置面（features.toc + hideToc）** — verdict: **adopt（P3 / S）** ⚠️SB3
- 上游：`features.toc` 全局开关 + 每篇 `hideToc` frontmatter 字段
- 本站：**两者均无**（`src/content.config.ts` 检索无 hideToc/toc）——如需"某篇关掉 TOC"
  或全局关闭，目前无开关
- 依据：本地检索 + diff（astro-paper.config.ts、content.config.ts）

**C11 内联 TOC 废弃（remark-toc/remark-collapse → rehypeInlineToc）** — verdict:
**already_have**
- 上游：正文 `## Table of contents` 写法废弃（构建告警，v8 移除），以自研
  rehypeInlineToc 过渡
- 本站：特性 003 已移除 remark-toc/remark-collapse 并更新唯一受影响文件——
  **方向一致且更彻底**（本站无过渡实现需求）。上游的 rehype 形态插件在本站
  Sätteri 管线不可直接采用（见第 5 章）

### 4.3 custom 插槽簇（v7.2.0）

**C12 `src/custom/` 三插槽** — verdict: **adopt（P3 / S）**
- 上游：Head / BodyEnd / PostEnd 三组件挂入 Layout 与文章页，空置零输出，
  上游承诺永不改动该目录——升级友好的扩展点
- 本站：无对应机制；当前无分析脚本/评论等注入需求，故为"未来防御性"采纳
- 依据：本地检索无 src/custom + diff 新文件

### 4.4 灯箱与 i18n 簇

**C13 灯箱缩放增强（滚轮/拖拽/捏合）** — verdict: **already_have**
- 上游：为其自研灯箱加滚轮缩放、拖拽平移、捏合（#666）
- 本站：PhotoSwipe（`ImageLightbox.astro`）**原生具备全部三项能力**

**C14 i18n TOC 文案** — verdict: **already_have**
- 上游：`post.tableOfContents`、`a11y.skipTableOfContents`（v8 前可选，en 兜底）
- 本站：组件 TOC 已有 zh/en 标签（`t.pages.toc`），i18n 为超集（SB1）

### 4.5 依赖与工程化簇

**C15 astro v7 + Node ≥22.23.4** — verdict: **already_have（本站领先）**
- 上游：astro ^7.4.8，Node engines ≥22.23.4（v7.0.0 起）
- 本站：astro **7.4.13**（领先），本机 Node 24.21.0 / CI Node 24 满足 engines

**C16 @astrojs/mdx 8** — verdict: **already_have（本站领先）**
- 上游：^8.1.3
- 本站：**8.1.6**（领先）

**C17 satori 0.26 → 0.63.2 + sharp 0.34 → 0.35.5** — verdict: **tradeoff（P2 / M）** ⚠️SB6
- 上游：大跨度升级并在 OG 模板补 `key: null`、`boxSizing` 等新版本适配
- 本站：自研 OG 模板（`src/utils/og-templates/`）在 satori 0.26 工作正常；
  升级需全量 OG 快照回归（首页 + 文章 + 书籍 + 双语），且上游模板适配不能直接
  搬（模板不同）——等本站 OG 出现渲染问题或 satori 出安全通告时再动

**C18 rehype-callouts 2.1 → 2.2** — verdict: **not_applicable**
- 上游：rehype-callouts 升级到 ^2.2.0
- 本站：已用 `satteri-callouts` 替代（003 迁移），版本跟踪对象相应转为 satteri-callouts

**C19 pagefind 1.5.2 → 1.6.0（含 default-ui）** — verdict: **adopt（P2 / S）**
- 上游：pagefind / @pagefind/default-ui 升级到 ^1.6.0
- 本站：1.5.2，为搜索核心（SB7）；minor 升级风险低，升级后验证搜索 UI 与索引

**C20 eslint-plugin-astro 3.1.0 → 3.2.1** — verdict: **adopt（P3 / S）**
- 上游：^3.2.1
- 本站：3.1.0，曾出现 EBADENGINE 下限告警（Node 24.15 事件），升级消除历史包袱

**C21 prettier 3.8.3 → 3.9.10** — verdict: **adopt（P3 / S）**
- 上游：3.9.10
- 本站：3.8.3；注意升级会带来全仓 reformat 噪音，建议与其他改动批量提交

**C22 tailwindcss / @tailwindcss/vite 4.3.0 → 4.3.5** — verdict: **adopt（P3 / S）**
- 上游：^4.3.5
- 本站：4.3.0

**C23 @shikijs/transformers 4.4.3 → 4.6.0** — verdict: **adopt（P3 / S）**
- 上游：^4.6.0
- 本站：4.4.3；升级后核对代码块装饰（diff 底色/行高亮/文件名）不回归

**C24 copy-pagefind.mjs（Windows 兼容）** — verdict: **not_applicable**
- 上游：新增 copy-pagefind.mjs 替代 `cp -r`（cmd.exe 无 cp）
- 本站：构建环境为 Linux（本地 + CI ubuntu），`cp -r` 无障碍；仅当引入 Windows 开发环境时再采纳

**C25 dependabot 分组更新（新增）** — verdict: **adopt（P3 / S）**
- 上游：新增 `.github/dependabot.yml`（npm 周检 minor/patch 分组 + actions 月检）
- 本站：无此文件；是否启用属维护者偏好（周期性 PR 噪音 vs 依赖时效）

**C26 GitHub Actions 版本升级（checkout v4→v7、setup-node v4→v7）** — verdict:
**adopt（P3 / S）**
- 上游：checkout v4→v7、setup-node v4→v7（pnpm 步骤与 npm 无关）
- 本站：ci.yml/deploy.yml 仍在 v4；action 版本号可平移升级，pnpm 步骤不适用

**C27 pnpm 迁移** — verdict: **not_applicable**
- 上游：迁移 pnpm（pnpm-lock.yaml + pnpm-workspace.yaml + CI pnpm 步骤）
- 本站：宪法技术约束"唯一使用 npm，MUST NOT 引入 pnpm 或 yarn 的 lock 文件"

**C28 定时发布改日粒度（postFilter 重写 + scheduledPostMargin 废弃）** — verdict:
**tradeoff（P3 / M）** ⚠️SB1
- 上游：生产环境按"发布日（站点时区日历日）"可见，废弃 15 分钟 margin
- 本站：仍为 margin 语义（`src/utils/postFilter.ts:5`）。语义变化影响"定时发布"
  的精确时刻预期；本站当前无定时发布工作流，改与不改均可——若改需同步归档页/
  Datetime 的时区口径（与 C07 联动）

---

## 5. 冲突与路径分叉专区

### 5.1 Markdown 管线：Sätteri（本站）vs unified（上游 v7）

- **上游现状**：v7 显式依赖 `@astrojs/markdown-remark ^7.3.6`（unified），TOC 废弃过渡
  与表格包裹均为 **rehype 形态插件**（`rehypeInlineToc`、`rehypeTableWrapper`、
  `rehypeHeadingIds`）
- **本站现状**：`satteri()` 工厂 + mdast/hast 插件组（SB4/SB5），无 unified 依赖
- **分叉影响**：上游所有 rehype 形态新插件**不可直接复制采用**——如需等价能力须按
  Sätteri 插件规范重写（参考 003 的 satteriMermaidBlock 经验：纯树变换，机械改写）。
  方向判断：上游在 unified 上持续投入（v8 将移除 remark-toc），短期不会迁 Sätteri；
  本站无需回调，**Sätteri 为 Astro 默认方向，分叉可持续**
- **回合并风险**：每次上游 markdown 配置变更（如本次 astro.config.ts 的 rehypePlugins
  数组变化），同步时 MUST 手动映射为 Sätteri 形态，不可直接拷贝配置

### 5.2 TOC 语义对照（C09/C10 的证据基础）

见 4.2 的逐点表格。结论：核心 UX 本站已覆盖；上游独有的只有**配置面**
（C10，P3）与**触发阈值**细节。若未来采用 C10，建议在本站组件上补
`features.toc` 读取 + blog schema 加 `hideToc`（Sätteri 管线下 headings 数据
来源不变，改动仅涉及组件与 schema）

### 5.3 包管理：pnpm（上游）vs npm（本站）

上游 v7.1.0 迁移 pnpm（pnpm-lock.yaml + pnpm-workspace.yaml + CI pnpm 步骤）。
本站宪法技术约束锁定 npm——**所有上游 pnpm 相关文件一律不采用**；同步上游依赖
版本时以 package.json 的版本范围为准，lock 文件始终用 npm 生成

### 5.4 依赖领先区

astro（本站 7.4.13 > 上游 ^7.4.8）与 @astrojs/mdx（8.1.6 > ^8.1.3）本站领先——
这两项不设 adopt 项；上游后续如发布更高版本，按常规升级流程评估即可

---

## 6. 采用路线建议（P1 / 重点 P2 项）

| 编号 | 实施 | 涉及区域 | 风险 | 验证 |
|------|------|----------|------|------|
| C01 | `src/pages/blog/[...slug]/index.astro` 交换 prev/next 赋值（照 #674 模式） | 文章详情页 | 低；核对 UI 标签语义 | 打开任一文章，"上一篇"应为更早文章 |
| C04 | `Card.astro:46` 与文章 h1 的 transition:name 改用 post.id/slug | 卡片 + 详情页 | 低 | 造两篇同名文章验证过渡不串 |
| C05 | `Layout.astro:131` stringify 后 `.replace(/</g, "\\u003c")` | 全站 ld+json | 极低 | 构造含 `</script>` 标题的文章验证 |
| C02 | 重写 `rehypeTableWrapper` 为 Sätteri hast 插件 + CSS（照 003 插件模式） | 管线插件组 | 中（需插件自测 + 表格页回归） | markdown-tips 宽表格页横滚可用 |
| C07 | 归档页分组改 dayjs tz（照上游写法，含 resolveTimezone 或本站等价） | 归档页 | 低 | 归档年月计数与文章署名日期一致 |
| C17 | satori/sharp 升级单独立项：先升级依赖，再跑 OG 快照对比（首页/文章/书籍/双语） | OG 全链路 | 中高（渲染可能变） | OG 图逐类目肉眼 + 尺寸校验 |

---

## 7. 时效性与复核提示

**数据截止 2026-11-21**（上游 v7.2.0）。此后的上游发布不在本报告范围。复核方式：

| 项目 | 复核方式 |
|------|----------|
| 上游新版本 | `https://github.com/satnaing/astro-paper/releases`（或 releases.atom） |
| 本报告判定时效 | 依赖版本对照（C15–C24）以 2026-11-21 为准，随后续升级自然更新 |
| 本站快照 | 报告基于本会话完成后的站点状态（astro 7.4.13 + Sätteri 管线） |

---

## 8. 证据索引

| 类型 | 来源 |
|------|------|
| 上游版本图谱 | `_audit_cache/releases.atom`；[v7.0.0](https://github.com/satnaing/astro-paper/releases/tag/v7.0.0) · [v7.1.0](https://github.com/satnaing/astro-paper/releases/tag/v7.1.0) · [v7.2.0](https://github.com/satnaing/astro-paper/releases/tag/v7.2.0) |
| 文件级变更 | `_audit_cache/upstream.diff`（v6.1.0...v7.2.0，10335 行 / 68 文件） |
| 逐文件要点 | `_audit_cache/cluster-notes.md`（65 文件要点提取） |
| PR 引用 | #674 上下篇方向 · #668 表格对齐 · #665 skip-link · #662 transition-name · #666 灯箱 · #699 dependabot · #718/#542 TOC · #728 custom 插槽 |
| 本站现状 | 第 3/4 章所引 `src/` 文件路径均为 2026-11-21 实际检索结果 |
