# 契约：候选评审判定契约

**用途**：定义"如何判定一个主题好不好看、能不能用"的可复核规则，使主观评审转化为可审计的
结构化判断。

**依据**：`spec.md` FR-010/FR-011/FR-012/FR-013/FR-015，`research.md` R8，`data-model.md`
的 `VisualScore` 与 `CapabilityJudgment`。

---

## V1. 来源标注契约（最重要）

### V1.1 三类合法证据来源

| 类型 | 允许的断言 | 必须提供 |
|------|-----------|----------|
| `demo_observable` | 演示站上肉眼可复核的视觉特征 | 演示 URL + 访问日期 |
| `source_token` | 主题源码中可定位的设计令牌 | 文件路径 + 行号 |
| `readme_claim` | 仓库自述的设计主张 | README 锚点 + "未独立验证"标注 |

### V1.2 禁止的断言方式

```text
✗ "截图显示首页采用三栏布局"           # 本次不产出截图
✗ "看起来非常现代"                     # 不可复核
✗ "设计精美，值得参考"                 # 无判断口径
✗ "据我判断性能优秀"                   # 无来源
```

### V1.3 合法断言示例

```text
✓ "演示站（https://chiri.the3ash.com，访问于 2026-11-17）首页标题字号约
   为正文字号的 2.5 倍，形成清晰三级阶梯。"          # demo_observable
✓ "src/styles/global.css:12-24 定义 --font-body 与 --font-display，
   前者用于正文，后者仅用于标题。"                    # source_token
✓ "README 自述 'Material Design 3'，未独立验证。"     # readme_claim
```

**强制要求（V1.3.1）**：任何视觉维度得分若无法归入三类来源之一，该维度必须留空并标注
"不可判定"，**不得** 猜测填分。

---

## V2. 视觉维度评分契约

### V2.1 七维评分口径

| 维度 ID | 5 分判据 | 3 分判据 | 1 分判据 |
|---------|----------|----------|----------|
| `typography` | ≥3 级字号阶梯，且正文行宽落在 60–80 字符 | 有阶梯，行宽随视口漂移 | 全文单一字号 |
| `color_contrast` | 正文/背景对比度 ≥7:1 | ≥4.5:1 且 <7:1 | <4.5:1 或无法确定 |
| `density_whitespace` | 行宽 60–80 字符 **且** 有明确纵向节奏 | 仅一项达标 | 两项均失控 |
| `motion_interaction` | 有动效且实现 `prefers-reduced-motion` | 有动效无降级 | 无动效或动效妨碍阅读 |
| `responsive` | 移动/平板/桌面三档均无横向滚动 | 仅移动端可用 | 存在固定宽度破版 |
| `dark_mode` | 独立配色（非简单反色）且对比达标 | 存在但对比不足 | 缺失 |
| `first_impression` | 首屏即呈现品牌识别 + 内容入口 | 需滚动方见内容 | 首屏空白或纯骨架 |

### V2.2 判定方法

- **对比度**：若主题源码定义了颜色变量，按 WCAG 相对亮度公式计算
  `(L1+0.05)/(L2+0.05)`，写入 `rationale`；若无变量，标"不可判定"。
- **字号阶梯**：从源码中统计 `h1`–`h6` 与 `body` 的 `font-size` 声明，或从演示站观察
  视觉层级，二者取其一并标注来源。
- **行宽**：优先看源码中的 `max-width` / `measure` 定义；否则以演示站可观察到的
  行末位置估算，并标注为估算。
- **暗色模式**：必须判断是"独立配色"还是"反色"。依据源码中是否存在独立的 dark 变量块。

### V2.3 总分使用限制

```text
visual_total = Σ 七维得分（7–35）
```

**约束**：`visual_total` **仅可用于轻度排序**，报告中每个候选举例必须展示分维度得分。
禁止只给总分排名，因为 spec FR-015 要求"分档呈现"，单一总分会把不同风格压成一条轴。

---

## V3. 风格分档契约

### V3.1 分档定义

| `style_bucket` | 判定特征 | 本项目已知样例 |
|----------------|----------|----------------|
| `minimal_typographic` | 装饰极少，排版为主要表现手段 | astro-paper、astro-theme-cactus、astro-micro |
| `material3` | 圆角卡片、色调表面、动态取色 | Firefly、Mizuki、Shirone |
| `anime_illustration` | 插画/角色立绘为首屏主体 | 动漫风主题 |
| `terminal_retro` | 等宽字体、命令行隐喻、单色高对比 | spectre |
| `magazine_editorial` | 多栏排版、大图叙事、杂志式标题 | 杂志编排类 |
| `glassmorphism` | 半透明模糊层、渐变光晕 | 玻璃拟态类 |
| `brutalist` | 粗边框、原色块、非对称 | 粗野主义类 |
| `other` | 无法归入以上任一档 | — |

### V3.2 分档规则

- 每档 **至少 1 个候选**（spec SC-007），若某档为空，报告须说明是"检索未命中"而非"主动排除"。
- 归属冲突时（如同时具备 terminal 与 brutalist 特征），以**首屏主导特征**判定，
  在 `rationale` 中说明取舍。
- **禁止**因风格偏好将候选排除出候选池；`other` 档的存在即为兜底保证（spec FR-015）。

---

## V4. 能力判定契约

### V4.1 判定语义矩阵

| `verdict` | 含义 | 报告措辞 |
|-----------|------|----------|
| `carry_over` | 现有实现可直接复用 | "可直接沿用现有实现" |
| `adapt` | 主题有对应结构，需改配置/样式 | "主题有对应结构，需改造 X" |
| `rebuild` | 主题无对应结构 | "须用现有代码重建" |
| `conflict` | 架构层面不可共存 | "与主题架构冲突：<具体冲突点>" |

### V4.2 原生性标注（防虚报）

| `native_or_addon` | 判定标准 |
|-------------------|----------|
| `native` | 主题自带模板/脚本，无需额外依赖 |
| `config` | 仅需改配置文件即可 |
| `plugin` | 依赖第三方插件或外部脚本（如 Algolia、Giscus、第三方搜索 JS） |
| `self_built` | 需要自行编写代码 |

**强制规则（V4.2.1）**：以下情形必须标 `plugin` 而非 `native`：

- 搜索依赖 Algolia / Pagefind / FlexSearch 等外部库（除非主题已内置并随构建产出索引）。
- 评论依赖 Giscus / Disqus / Utterances。
- 图床或 CDN 依赖外部服务。

**理由**：spec FR-014 明确禁止把社区插件记为框架内置，这是最容易虚报的一处。

### V4.3 八项能力的最低判定证据

| 能力 | 最低证据要求 |
|------|-------------|
| `zh_typography` | 主题是否定义了 CJK 字体栈或 `font-family` 中文回退；若无，`verdict` 至少为 `adapt` |
| `i18n_prefixless` | 是否支持"默认语言无前缀"路由；多数主题默认全前缀，须标 `adapt` 或 `rebuild` |
| `fallback_canonical` | 是否支持缺失译文时的原文回退；无则 `rebuild` |
| `books_chapters` | 是否有目录驱动的多级侧边栏；无则 `rebuild` |
| `static_search` | 搜索索引是否在构建期生成；运行期依赖 API 则标 `plugin` + `conflict` |
| `image_lightbox` | 是否内置灯箱；内置则查其依赖（PhotoSwipe 等）标 `plugin` |
| `dark_mode` | 是否有独立 dark 变量；简单反色标 `adapt` |
| `dynamic_og` | 是否支持构建期生成 OG 图；运行期生成则标 `conflict` |

### V4.4 与本站基线的对照强制项

判定 **必须** 以本项目现状为基线（spec 的 `本站能力项` 实体）。基线事实：

```text
中文优先：zh 为默认语言，内容在 collection 根目录
双语路由：默认语言无前缀，en 使用 /en/ 前缀（prefixDefaultLocale: false）
回退机制：缺失译文生成原文 fallback + canonical 指向原语言
书籍体系：src/utils/books.ts 从目录结构推导侧边栏（index.md/_index.md）
搜索：Pagefind，构建后生成静态索引
灯箱：PhotoSwipe
暗色：class 切换 + CSS 变量
OG：构建期用 satori + resvg-js 生成
```

**约束**：不得脱离此基线判断"支持/不支持"，否则结论无法映射到实际改造量。

---

## V5. 移植估算契约

### V5.1 阶段划分（顺序固定）

| 阶段 | 产出 | 验证 |
|------|------|------|
| `S1-visual-shell` | 字体、配色、间距令牌移植到 `global.css` | 现有页面外观变化但功能不变 |
| `S2-layout-components` | 布局与组件结构适配 | 列表/详情/书籍页均正常渲染 |
| `S3-content-model` | 内容模型对接 | 现有 Markdown 内容无需改写即可渲染 |
| `S4-search-seo` | 搜索与 SEO 重建 | Pagefind 索引生成、canonical/hreflang 正确 |
| `S5-deploy-switch` | 部署切换 | GitHub Pages 构建通过、预览站可访问 |

### V5.2 复用与重写分离（spec FR-018）

每个阶段必须填两列：

| `static_reuse` | `template_rewrite` |
|----------------|---------------------|
| CSS 变量、字体文件、图像资源、静态 HTML 片段 | 模板语法转换、组件 props 接口、路由逻辑、构建插件配置 |

**判据**：能通过复制文件生效的归 `static_reuse`；必须改代码逻辑的归 `template_rewrite`。
**禁止**把模板语法转换计入"复用"——Hugo 的 `{{ }}` 到 Astro 的 `.astro` 是重写。

### V5.3 回退契约

每阶段的 `rollback` 必须满足：

```text
[可验证] 现有站点在该阶段开始前的最后一次构建产物仍可发布
[可执行] 回退动作不依赖已完成阶段 S(n+1)
```

**理由**：spec Story 3 场景 2 要求"明确指出现有站点在哪个节点之前仍可正常发布"。

### V5.4 最小可行路径

必须给出"只移植视觉外壳、不动内容模型"的路径（spec Story 3 场景 4）：

```text
S1-visual-shell 独立成立 → 完成即产生可见收益
S2 起才触及结构 → 可在 S1 后暂停
```

---

## V6. 判定失败的契约响应

| 情形 | 响应 |
|------|------|
| 演示不可达且无源码可查 | 视觉维度全标"不可判定"，候选保留 |
| 许可证缺失或不明确 | 记录 `license_spdx = null`，在报告中单列"许可证不明" |
| 候选与现有 AstroPaper 高度相似 | `similar_to_current = true`，报告须说明移植收益是否抵成本 |
| 能力判定证据不足 | `verdict` 留空并标"证据不足"，不得默认判为 `carry_over` |
| 主题为付费/非开源 | 可入选，标注限制，报告说明是否可用于本站 |

**总原则**：任何不确定都落到"标注"而非"删除"或"猜测"。