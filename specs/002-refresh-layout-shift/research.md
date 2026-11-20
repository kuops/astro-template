# 刷新/加载期布局跳动（CLS）调研

日期：2026-11-20
范围：`books/getting-started/markdown-test` 刷新时"图片区/整页乱动"；主流固定位置方案盘点。

## 1. 本站实测根因（headless Chromium，1280×900，滚到 y=2600 后 reload）

| 元素 | 首帧(t≈71ms) | 加载完成(t≈4.5s) | 结论 |
|---|---|---|---|
| 页面总高 | 10258 | 10776 | **+518px，发生在恢复滚动之后** |
| 3 张 `<img>` | 301/50/50 高 | 完全相同 | width/height 属性 + preflight `height:auto` 已生效，**图片不跳** |
| mermaid 块×4 | 128/194/211/282 | 252/426/199/456 | **骨架按行数估高 ≠ 真实图高，+523px，唯一增长源** |
| 表格/代码块 | 高度不变 | 高度不变 | 仅被 mermaid 增长整体推移 |

机制要点：

- 增长块位于**视口内**（y 2725–3300 ∈ 视口 2600–3500）。CSS scroll anchoring（`overflow-anchor:auto`，实测首帧即 auto）**按规范不补偿视口内变化**，于是用户眼前的内容被直接推走 → "乱动"。
- 图片"闪"是另一回事：远程图（picsum）未到达时只有空白占位框，到达后弹出。占位已固定，**无位移**，但视觉上是 pop-in。
- 现有刷新恢复机制（`history.state.scrollY` + head 撑高 + instant 恢复 + `article:layout-stable` 二次校正，见 `src/layouts/Layout.astro`）本身工作正常（reload 后 scrollY 精确=2600）；问题不在恢复，而在**恢复后布局仍在长高**。

## 2. 主流方案盘点

### A. 加载期占位（防 CLS，web.dev / Core Web Vitals 官方推荐）

1. **`width`/`height` 属性 + `height:auto`**：浏览器在 HTML 解析期即按属性算出默认 aspect-ratio 预留空间（Chrome/Firefox/Safari 均支持）。本站已有 `rehypeImageDimensions`（从 URL 路径/query 提取尺寸）+ preflight，远程 picsum 图已覆盖。来源：web.dev《Optimize CLS》、Jake Archibald《img aspect-ratio》。
2. **CSS `aspect-ratio` 固定比例盒**：响应式场景（`width:100%`）用比例盒预留；`<picture>/<source>` 也可带宽高。同上。
3. **晚到内容（广告/iframe/嵌入/图表）预留 `min-height`/比例盒**：尺寸不可知时按"最可能尺寸/历史数据"预留，宁可留白不塌缩；骨架屏（skeleton）是同一思路的视觉化。本站 mermaid 骨架即此类，但**估高不准**是缺陷。
4. **LQIP/blur-up 占位**（Next.js `placeholder="blur"` + `blurDataURL`、Medium、Gatsby）：极小模糊图垫底，真图到达后淡入。解决 pop-in 观感，不解决位移（位移靠 1/2/3）。
5. **固定尺寸容器内替换**（web.dev）：动态内容在固定盒里换入换出，或 carousel 式过渡。
6. **字体**：`font-display:optional`/`swap` + 匹配 fallback + `size-adjust` 度量覆盖 + preload，防 FOUT 位移。本站已按 AGENTS.md 执行（swap + 双可变字体 preload + 中文系统回退）。

### B. 刷新/回退位置固定（scroll restoration）

1. **浏览器原生恢复**（`history.scrollRestoration:"auto"`）：Chrome/Firefox 会在加载期多次重试恢复，配合 scroll anchoring 补偿**视口外**增长；WHATWG #10597 正在讨论 reload 与 back/forward 的恢复差异。SPA/异步内容站常不够用。
2. **手动像素恢复**：`history.state`/sessionStorage 存 scrollY，首帧 instant 恢复 + 撑高防 clamp + 布局稳定后二次校正。本站现方案，属此类（Turbo 的 `scrollToRestoredPosition` 同思路）。
3. **锚点元素恢复（主流 SPA/文档站做法，"固定位置"的正解）**：存"视口顶部的内容元素 + 元素内偏移"（如某个 heading 的 id + delta），恢复时按**元素当前位置**重算 scrollTop。布局长高/收缩后仍钉在同一内容上，像素漂移免疫。Turbo `scrollToAnchor`、Next.js App Router 实验性 scroll restoration、各文档站 hash/heading 恢复均属此类。
4. **CSS scroll anchoring**（`overflow-anchor`，W3C CSS Scroll Anchoring L1；Chrome/Firefox 早已默认开启，**Safari 27 beta 才跟进**，WWDC26）：自动补偿视口外布局变化；可用 `overflow-anchor:none` 对动态子树 opting-out、指定锚点元素（CSS-Tricks《Pin Scrolling to Bottom》）。对视口内增长无效——本站 mermaid 恰在视口内。
5. **bfcache**：back/forward 整页快照恢复，零跳动（web.dev 推荐保持 bfcache 资格）。

### C. 观感层（不减少位移但消除"闪"）

- 占位底色/骨架（`--muted`）+ 真图 `load` 后短淡入（reduced-motion 降级）；失败保留占位框不塌缩（web.dev：塌缩预留空间与插入内容同样产生 CLS）。

## 3. 结论与本站修复选型

| 问题 | 选型 | 对应主流 |
|---|---|---|
| mermaid 估高不准 → 视口内推内容 | **sessionStorage 缓存实测渲染高度，刷新时骨架按缓存高度预留**（首次访问仍估高，二次起零增长）；渲染后写回缓存 | A3"历史数据预留" + B3 思想 |
| 刷新后布局变化仍漂移 | **锚点元素恢复**：存视口顶元素+offset，`layout-stable` 后按元素重算；与现有像素恢复并存、锚点优先 | B3 |
| 远程图 pop-in 观感 | **muted 占位底 + load 淡入**（宽高预留已有） | A1 + C |
| 无尺寸远程图 | 保留现有 URL 尺寸提取；无解时接受最小高度（不塌缩） | A1/A3 |

不采用：整页门控/隐藏到加载完（AGENTS.md 明确禁止，白屏更糟）；LQIP 远程生成（引入构建期网络依赖，模板场景收益低）。

## 4. 实施与实测（2026-11-20 落地）

### 已实施

| 改动 | 文件 | 机制 |
|---|---|---|
| mermaid 实测高度缓存 | `MermaidRenderer.astro`、`rehypeMermaidBlock.ts` | 渲染后按源码 hash key 写 sessionStorage（pathname 归一化去尾斜杠）；刷新时 head/body 首解析期注入 `<style>` 按 key 预留 min-height，**块一解析即正确高度**；SPA swap 由 rerun 脚本重注入 |
| 代码块首帧占位 | `rehypeMermaidBlock.ts`(rehypeCodeLines)、`global.css` | 构建期写 `--code-lines`，首载 CSS 按行数预留 min-height（外链 typography CSS 到达前 pre 不再 0 高） |
| 复制按钮 wrapper margin 补偿 | `global.css`、`ArticleEnhancements.astro` | 运行时包 div 使 `prose pre` margin 失效 → wrapper 上固定 24px 补偿，包前包后布局一致 |
| 锚点元素恢复 | `Layout.astro` | 存"视口顶元素选择器+同类序号+元素内偏移"，`layout-stable` 后按元素当前位置重算 scrollTop；像素恢复兜底 |
| hash 恢复跟随 | `Layout.astro` | 3s 内每 250ms 跟随重钉，兼容 swap 与 mermaid 异步渲染的时序竞争 |
| 图片占位+淡入 | `rehypeImageDimensions.ts`、`global.css`、`ArticleEnhancements.astro` | 构建期 class `img-fade` + muted 占位底；load/error 后 `is-loaded` 淡入（reduced-motion 降级）；本地无尺寸图用 sharp 兜底提取 |

### 实测（生产构建，headless Chromium）

| 场景 | 修复前 | 修复后 |
|---|---|---|
| 刷新首帧→完成 页面高度增长 | **+627px**（mermaid 估高+代码块 0 高+wrapper margin 丢失） | **≈0**（缓存命中时首帧=完成；残余 ≤~100px 为字体到达时长代码行换行数变化的一次性回流，见下） |
| 视口顶内容钉住 | 漂移 | **精确一致**（锚点恢复） |
| 慢网 120KB/s mermaid 源码可见 | 0（既有防线保持） | 0 |
| 模块阻断 / 无 JS | watchdog/noscript 回退 | 保持 |
| SPA 往返 | 骨架估高跳变 | 缓存高度注入，最终布局一致 |
| 带 hash 刷新 | 目标漂移 | 钉在 scroll-margin 位（~50px） |

### 锚点恢复加固（Playwright 实测复现后修复）

用户复现路径：dev 重启后、图片半露位置刷新 → 视口跳到代码区。Playwright（playwright-core + 本机 chromium）按该路径实测，发现三层根因并修复：

1. **同类序号锚点失效**：mermaid 源码 pre 渲染后变 wrapper，`pre.astro-code` 同类序号整体偏移 → 锚点落错元素。改为**精确结构路径**（`#article > div:nth-child(N) > pre:nth-child(1)`，nth-child 链对兄弟类型变化免疫）。
2. **ClientRouter 重置 history.state**：首载 normalization swap 与路由 state 写入不保留自定义字段 → 锚点字段丢失。锚点同步备份到 **sessionStorage**（`scroll-anchor:<归一化path>`），恢复优先读备份。
3. **冷启动布局未稳时的中间态污染**：scroll 监听把瞬态位置存成锚点。pin 窗口内保存复用原始锚点；followPin 改为**布局稳定 1s 才退出、15s 上限**（覆盖 dev 冷编译）。

实测（图片半露 y≈3697，imgTop≈749）：

| 场景 | 漂移 |
|---|---|
| A 热态刷新 | **0px** |
| B 清 sessionStorage 首访语义 | **0px** |
| C dev 停止→重启后冷刷新 | **0px** |
| C2 重启后二次刷新 | **0px** |

测试脚本：/tmp/opencode/pw-half-image.mjs、pw-dev-restart.mjs。

### 用户滚动让行（"往下滑被拽回"修复）

复现：刷新后立刻往下滑，滑到图片区突然被往上拽。根因：followPin/`layout-stable` 恢复在 pin 窗口内无条件 `scrollTo` 回锚点，与用户滚动抢占。修复：**用户任何滚动意图（wheel/touchmove/keydown/pointerdown，或 scroll 事件偏离程序期望值 >2px）立即终止全部程序化重钉**（followPin、layout-stable 恢复、hash 跟随均让行）。

实测：D 场景刷新后立刻 wheel 下滑 → 滑到 y7098（图片上方 2652px）后 3s 无拽回；A/B/C 无用户交互时钉住仍 0px。脚本 /tmp/opencode/pw-user-scroll.mjs。

### 刷新"上下抖三下"修复（单行引用等长文页）

复现：停在引用区刷新，视口上下抖数次。根因三层：① body 脚本过早移除 head 撑高 min-height，dev/慢网下 CSS 未齐总高不足 → scrollY 被截断下跳、资源到达后又被推回；② 浏览器 scroll anchoring 与程序 pin 双重补偿互抢；③ 字体到达改变换行高度，固定像素 delta 锚点产生 ±3-8px 视觉漂移。修复：撑高保留到 pin 结束且真实高度足够才拆（`releaseScaffold` 条件拆除）；pin 窗口内 `overflow-anchor:none` 独占补偿；锚点改存**比例偏移**（delta/元素高度），恢复时按当前元素高度比例重算，字体换行变化不再漂移。

实测：慢网 120KB/s 无缓存刷新 y 序列单次收敛（2261→2265→2261，±4px 一次性），热态 ±7px 一次性收敛后恒定；A/B/C/D 全 0px 或无拽回；自测 dev 用 `--ignore-lock`+清 agent 环境变量起 4325，测完杀进程组。

### 字体 swap 跳动根治（"第三下抖"）

用户描述"上下上三下后停"对应三个异步事件，前两个（撑高早拆截断、anchoring/pin 互抢）已修；第三下是 **web font 到达改变行宽/行高**。根治：fontTools 实测 Google Sans Code（upm2000、adv1200=0.6em、winA2377/winD930=1.6535em）与 Linux fallback DejaVu Sans Mono（upm2048、adv1233=0.602em、winA1901/winD483=1.164em），生成校准 `@font-face "GSC Fallback"`：`size-adjust:99.67%`（行宽对齐）、`ascent-override:119.25%`/`descent-override:46.66%`/`line-gap-override:0%`（行高对齐），src 为 local() 候选链（DejaVu Sans Mono/Menlo/Consolas/Liberation Mono/Courier New），插入 `--font-app`/`--font-mono` 栈第二位。字体到达前后布局度量一致，swap 零跳动；中文仍走系统字体（AGENTS.md 约束保持）。

终验（4322 preview + 4325 自起 dev，测完清理）：单行引用热态×3/慢网无缓存 y 与 refTop **全程恒定**；A/B/C/C2 0px；D 无拽回；TOC 无 sweep；无 JS 错误；lint/format:check/build 全过。

### dev 分级 CSS 到达的可见跳变（同帧补偿）

生产构建 CSS render-blocking 无此问题；dev 下样式分级到达，250ms 轮询 pin 在 paint 后才修正 → 用户见"跳一下再回来"×N。修复：ResizeObserver(article/body) + head style/link 插入监听 + fonts.ready 触发**同帧补偿**；补偿只修截断（scrollY 低于锚点目标，即总高不足被 clamp），布局增高交给浏览器 scroll anchoring，不追布局变化避免放大漂移。另修竞态：`__origAnchor` 赋值提前到 body 脚本顶部，pin 窗口内 scroll-save 永远复用原始锚点（此前首次 save 时 origAnchor 未赋值，锚点被瞬态位置覆盖成 #bash 导致 374px 漂移，B 场景 2/5 复现）。

终验：B×6 全 0px；dev 冷刷新 60ms 采样可见跳变 0；A/慢网/热态/D/TOC 全过；lint/format:check/build 全过；自测端口清理。

### 中文行盒 strut 跳动（Windows 环境根因）

Linux headless 无法复现用户 Windows 的抖动：中文无 webfont，但行盒 strut 取自栈首字体——swap 前中文行高由 Calibri/YaHei 度量（~1.2-1.3em）决定，swap 后变 GSC 1.6535em，每行中文长高 ~7px，整页累积数百 px → "上下上三下"。修复：`@font-face "GSC Fallback CJK"` 仅含空格（`unicode-range:U+0020`，src local(Space/DejaVu Sans Mono/Menlo/Consolas)），`ascent-override:118.85%`/`descent-override:46.5%` 使中文 strut 行高在 swap 前后恒为 1.6535em；中文字形仍走系统字体。挂入 --font-app/--font-mono 栈第三位。

终验：冷缓存×3 + 热态×2 PerformanceObserver layout-shift **0 条目**、图片视口位置 0 跳变；A/B/C/C2/D/TOC/dev 抖动全过；CI 全过；自测端口清理。

### 刷新机制重构（搜索证实的根因）

用户指出"顶部不抖、滚动后抖"，网上检索证实主流契约（history-scroll-restoration-contracts / engineer-atlas）：**scroll anchoring 默认保持启用，禁用仅限最小实证冲突区间**；旧机制全局 `overflow-anchor:none` 长达 15s + 250ms 轮询 pin（paint 后修正）正是反模式。重构：① 补偿主体交还浏览器原生 anchoring；② pin 窗口（8s）内 30ms 同帧对齐，窗口内禁用原生避免双重补偿互抢，窗口结束/用户滚动即恢复原生；③ `layout-stable` 的 finishRestore 只写回 state 不提前关 pin（此前 224ms 提前退出导致 500ms 处的收敛无人对齐）；④ 锚点元素自身 `overflow-anchor:none`（最小禁用区），固定 delta 恢复。

终验：dev 冷刷新×3 可见跳变 0、残差 ≤1px；A/B 0px；D 无拽回；C/C2 0px；TOC 无 sweep；CI 全过；自测端口清理。

### 已知残余与后续可选

- **字体度量回流**（~100px 上限，仅长代码行换行敏感页）：web font 到达后行宽变化→换行数变。主流解法 `size-adjust/ascent-override` 校准 fallback（web.dev font-best-practices），需逐字体度量校准，列为可选项未实施。
- 首次访问（无缓存）mermaid 仍用行数估高，渲染后有一次预估→实测调整；二次起零增长。

### 排障中发现的框架陷阱（已验证）

1. **rehype-raw 在用户 rehype 插件之后重解析整棵树**：插件新增的包裹节点被丢弃，仅对既有节点的属性修改存活 → 构建期包 wrapper 方案不可行，改 CSS 补偿。
2. Astro `is:inline` 脚本被 hoist 到 `</body>` 后；`data-astro-rerun` 在 swap **前**执行（读到旧文档/旧 pathname）→ 缓存注入放 head 定义 + body 首行调用 + rerun 重注入三保险。
3. Shiki 在 rehype 之后重建 pre 的 style → 内联隐藏必须放 Shiki transformer（既有结论保持）。
4. Astro 内容缓存不随 `astro.config.ts` 失效；dev 进程模块图脏后服务新旧混合产物 → 清 `node_modules/.astro` 重启。

## 5. 来源

- web.dev/articles/optimize-cls（2025-02 更新）、web.dev/articles/cls、web.dev/articles/bfcache
- W3C CSS Scroll Anchoring Module Level 1；WICG/ScrollAnchoring explainer；MDN overflow-anchor
- webkit.org/blog/17967（Safari 27 beta scroll anchoring）、webkit.org/blog/18325
- whatwg/html#10597（reload 恢复行为讨论）
- hotwired/turbo@7bdb1a1、b95162f（restore vs advance、scrollToRestoredPosition/scrollToAnchor）
- nextjs.org Image Component（placeholder/blurDataURL）；vercel/next.js#24004（blurry placeholder RFC）
- CSS-Tricks《Pin Scrolling to Bottom》（overflow-anchor 指定锚点）
- 本站实测脚本：/tmp/opencode/diag-grow.mjs、diag-scroll-state.mjs、cdp-refresh-shift.mjs
