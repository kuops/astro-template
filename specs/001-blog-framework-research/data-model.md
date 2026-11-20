# Phase 1 数据模型：候选主题调研

**来源**：`spec.md` 的 Key Entities 与 `research.md` 的 R1–R8 结论。

## 概览

本功能不产生运行时数据，产出的是**一份可审计的调研数据集**。数据模型的目的不是描述系统行为，
而是让"候选池无上限、覆盖率可核算、视觉判断可复核"这三项要求变成可机器校验的结构。

```text
检索查询式 (Query)
      │  1..N
      ▼
检索命中 (Hit) ──┬──> 未纳入记录 (ExcludedItem)
                 │      原因分类
                 └──> 候选主题 (Candidate)
                          │  1..N
                          ├──> 视觉评估 (VisualScore)
                          ├──> 能力判定 (CapabilityJudgment)
                          ├──> 证据来源 (Evidence)
                          └──> 移植阶段 (MigrationStage)
```

**计数恒等式**（报告必须满足）：

```text
Σ Query.hit_count_effective == |distinct Hit|
|distinct Hit| == |Candidate| + |ExcludedItem|
```

注：`hit_count_effective` 取分桶闭合校验后的实际可取回数，非 API 报告的 `total_count`
（后者可能大于 1000 而不可取回）。

## 实体定义

### 1. Query — 检索查询式

代表一次实际执行的 GitHub 搜索，用于证明检索可复现（spec FR-003、SC-010）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `query_id` | string | 是 | 形如 `Q-ASTRO-TOPIC-03`，稳定标识 |
| `family` | enum | 是 | `topic` / `keyword` / `seed` / `recent` 四路召回之一（research.md R3、R9） |
| `expression` | string | 是 | 完整可复制的查询式，含全部限定符 |
| `qualifiers` | string[] | 是 | 拆出的限定符，如 `archived:false`、`pushed:>2025-11-17` |
| `api_endpoint` | enum | 是 | `rest` / `graphql` |
| `total_count_reported` | integer | 是 | API 返回的 `total_count` 或 `repositoryCount` |
| `bucket_key` | string / null | 否 | 分桶键，如 `stars:0..1`；非分桶查询为 null |
| `hit_count_effective` | integer | 是 | 实际可取回的条数，受 1000 条上限影响 |
| `truncated` | boolean | 是 | `hit_count_effective < total_count_reported` 时为 true |
| `executed_at` | ISO 8601 | 是 | 执行时间戳 |

**校验规则**：

- `truncated == true` 的查询 **不得** 用于宣称覆盖率；必须细分桶后重查
  （research.md R1、R2）。
- 同一 `family` 下，`bucket_key` 必须构成互斥且完备的区间划分。
- `expression` 必须能原样粘贴到 GitHub 搜索框或 API 中得到相同量级结果。

### 2. Hit — 检索命中

三条召回路径的原始结果，去重前的中间层。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `repo_id` | string | 是 | `owner/name`，全局唯一 |
| `repo_url` | string | 是 | 仓库页面地址，`https://github.com/{repo_id}` |
| `source_query_ids` | string[] | 是 | 命中该仓库的所有查询式；多路径命中则多值 |
| `stargazers` | integer | 是 | 星标数 |
| `created_at` | date | 是 | 仓库创建日期 |
| `pushed_at` | date | 是 | 最近 push 日期 |
| `archived` | boolean | 是 | 是否归档 |
| `topics` | string[] | 是 | 仓库 topics，可为空数组 |
| `homepage_url` | string / null | 否 | 演示地址原始值 |
| `description` | string / null | 否 | 仓库自述 |
| `primary_language` | string / null | 否 | 主要语言 |
| `license_spdx` | string / null | 否 | 许可证 SPDX 标识 |
| `latest_release_tag` | string / null | 否 | 最新发行版 tag；无发行版为 null |
| `latest_release_at` | date / null | 否 | 最新发行版发布时间；无发行版为 null |

**去重规则**：以 `repo_id` 为唯一键。多路径命中时合并 `source_query_ids`，保留各自路径的
命中证据——这正是证明"四路召回互补"的数据基础。

**不可变快照说明**：星标数与 `pushed_at` 是调研时点快照。报告须标注
`snapshot_at`，且 spec 已声明只保证该时点可复核（Assumptions）。

### 3. Candidate — 候选主题

通过纳入条件的命中，进入深度核验（spec FR-008）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `repo_id` | string | 是 | 同 Hit |
| `repo_url` | string | 是 | 仓库页面地址 |
| `origin_ecosystem` | enum | 是 | `astro` / `hugo` / `nextjs` / `eleventy` / `sveltekit` / `zola` / `jekyll` / `other` |
| `stack` | string[] | 是 | 从 topics 与 `primary_language` 推导，如 `["astro","tailwindcss","typescript"]` |
| `license_spdx` | string / null | 否 | 许可证；缺失为 null，报告中单列"许可证不明" |
| `latest_release_tag` | string / null | 否 | 最新发行版 tag |
| `latest_release_at` | date / null | 否 | 最新发行版时间，用于区分"有提交无发版" |
| `demo_url` | string / null | 否 | 归一化后的演示地址 |
| `demo_status` | enum | 是 | `reachable` / `unreachable` / `product_page_only` / `no_demo` |
| `demo_checked_at` | ISO 8601 / null | 否 | 探测时间；`no_demo` 时为 null |
| `demo_http_status` | integer / null | 否 | 探测得到的 HTTP 状态码 |
| `style_bucket` | enum | 是 | 视觉分档，见 spec FR-015 |
| `visual_scores` | VisualScore[] | 是 | 七维评分，见下 |
| `capability_judgments` | CapabilityJudgment[] | 是 | 八项能力判定，见下 |
| `migration_stages` | MigrationStage[] | 否 | 仅对顾问性推荐主题填写 |
| `is_recommended` | boolean | 是 | 是否进入顾问性推荐（spec FR-016） |
| `similar_to_current` | boolean | 是 | 是否与现有 AstroPaper 高度相似（Edge Cases 要求） |

**演示状态判定规则**：

- `reachable`：HTTP 200 且最终 URL 非商品/购买页。
- `unreachable`：超时、DNS 失败、4xx/5xx。**平台侧 402/429 需在报告中单独注明**
  （research.md R5 实测 astrowind 返回 402，属 Vercel 平台限制）。
- `product_page_only`：链接指向模板销售页而非可浏览的主题站。
- `no_demo`：`homepage_url` 缺失且 README 中未提取到候选链接。

**重要约束**：`demo_status != reachable` 的候选 **不得** 因"无法验证视觉"被直接删除，
只能被标注（spec Edge Cases）。删除会使 `|Hit| == |Candidate| + |ExcludedItem|` 失衡。

### 4. VisualScore — 视觉维度评分

对应 spec FR-010 的七个维度。每个维度必须带来源类型（research.md R8）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dimension` | enum | 是 | `typography` / `color_contrast` / `density_whitespace` / `motion_interaction` / `responsive` / `dark_mode` / `first_impression` |
| `score` | integer 1–5 | 是 | 该维度得分 |
| `rationale` | string | 是 | 可复核的判断依据，禁止"好看""现代感" |
| `evidence_type` | enum | 是 | `demo_observable` / `source_token` / `readme_claim` |
| `evidence_locator` | string | 是 | `demo_observable` 填 URL；`source_token` 填文件路径 + 行号；`readme_claim` 填 README 锚点 |

**校验规则**（关键，直接落实 FR-011）：

- `evidence_type == source_token` 时必须给出行号级定位，不能只写文件名。
- `evidence_type == readme_claim` 时报告须同时标注"据仓库自述，未独立验证"。
- 报告正文 **不得** 出现"从截图可见"一类表述；本数据集不包含截图字段，
  这是结构性保证而非人工承诺。

**评分口径**（须写入报告，使读者可自行复算）：

| 维度 | 5 分 | 3 分 | 1 分 |
|------|------|------|------|
| 排版层次 | ≥3 级清晰字号阶梯且行宽受控 | 有阶梯但行宽随视口漂移 | 全文单一字号 |
| 配色对比 | 正文与背景对比度经计算 ≥7:1 | ≥4.5:1 | <4.5:1 |
| 密度留白 | 正文行宽 60–80 字符且有明确纵向节奏 | 其一达标 | 两者均失控 |
| 动效交互 | 有动效且遵循 `prefers-reduced-motion` | 有动效无降级 | 无动效或妨碍阅读 |
| 响应式 | 三档断点均无横向滚动 | 仅移动端适配 | 存在固定宽度破版 |
| 暗色模式 | 独立配色非简单反色且对比达标 | 存在但对比不足 | 缺失 |
| 首屏冲击 | 首屏即呈现品牌识别与内容入口 | 需滚动方见内容 | 首屏为空白或骨架 |

### 5. CapabilityJudgment — 能力判定

对应 spec FR-012 的八项能力。每项必须有判定与依据。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `capability` | enum | 是 | 见下方能力枚举 |
| `verdict` | enum | 是 | `carry_over` / `adapt` / `rebuild` / `conflict` |
| `basis` | string | 是 | 判定依据，须指向演示可观察特征或源码路径 |
| `native_or_addon` | enum | 是 | `native` / `config` / `plugin` / `self_built`（spec FR-014） |
| `effort` | enum | 是 | `S` / `M` / `L` |

**能力枚举**（与 spec FR-012 一一对应）：

| 标识 | 能力 |
|------|------|
| `zh_typography` | 中文优先排版 |
| `i18n_prefixless` | 默认语言无前缀的双语路由 |
| `fallback_canonical` | 缺失译文回退与规范链接 |
| `books_chapters` | 目录驱动的书籍章节与分组 |
| `static_search` | 全站静态搜索 |
| `image_lightbox` | 内容图片灯箱 |
| `dark_mode` | 暗色模式 |
| `dynamic_og` | 动态社交分享图 |

**判定语义**（避免误用）：

- `carry_over`：现有实现可直接复用，主题无需改动。
- `adapt`：主题有对应结构，但需改配置或样式。
- `rebuild`：主题无对应结构，须用现有代码重建。
- `conflict`：主题架构与需求根本冲突，二者不可同时保留。

**关键约束**：`native_or_addon` 不得虚报。若某能力依赖社区插件，必须标 `plugin`
而非 `native`（spec FR-014）。例如多数 Hugo 主题的搜索是第三方 JS 注入，应标 `plugin`。

### 6. MigrationStage — 移植阶段

仅对顾问性推荐主题填写（spec FR-017）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `stage_id` | string | 是 | 形如 `S1-visual-shell` |
| `name` | string | 是 | 阶段名称 |
| `deliverable` | string | 是 | 该阶段可验收的产出 |
| `validation` | string | 是 | 如何验证完成 |
| `rollback` | string | 是 | 回退方式 |
| `relative_effort` | enum | 是 | `S` / `M` / `L`，仅表相对量 |
| `static_reuse` | string[] | 是 | 可直接复用的静态资源（样式、字体、图像） |
| `template_rewrite` | string[] | 是 | 必须重写的模板逻辑（spec FR-018） |
| `starts_after_approval` | boolean | 是 | 恒为 true（spec FR-026） |

**顺序约束**：阶段必须满足"视觉外壳 → 布局与组件 → 内容模型对接 → 搜索与 SEO →
部署切换"的依赖顺序；每阶段的 `rollback` 必须指向一个仍可发布的站点状态
（spec 的 Story 3 场景 2）。

### 7. ExcludedItem — 未纳入记录

兑现"覆盖率可核算"（spec FR-006、FR-024）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `repo_id` | string | 是 | 同 Hit |
| `matched_query_ids` | string[] | 是 | 在哪条查询中被命中 |
| `reason_code` | enum | 是 | `not_content_site` / `stale` / `archived` / `no_demo` / `plugin_only` / `duplicate` / `out_of_scope` |
| `reason_detail` | string | 是 | 具体说明，禁止"其他"这类兜底 |
| `would_reconsider_if` | string / null | 否 | 什么条件下值得重新考虑 |

**原因分类必须互斥且穷尽**：每条排除必须落在且仅落在一个 `reason_code`。

### 8. Evidence — 证据来源

支撑关键结论（spec FR-019）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `claim_id` | string | 是 | 结论标识 |
| `claim_text` | string | 是 | 被支撑的具体结论 |
| `source_type` | enum | 是 | `repo_record` / `official_docs` / `demo_site` / `readme` |
| `url` | string | 是 | 可访问链接 |
| `accessed_at` | ISO 8601 | 是 | 访问日期 |
| `note` | string / null | 否 | 如"该数据为 2026-11-17 快照" |

## 枚举汇总

```text
family:            topic | keyword | seed | recent
api_endpoint:      rest | graphql
origin_ecosystem:  astro | hugo | nextjs | eleventy | sveltekit | zola | jekyll | other
demo_status:       reachable | unreachable | product_page_only | no_demo
style_bucket:      minimal_typographic | material3 | anime_illustration |
                   terminal_retro | magazine_editorial | glassmorphism |
                   brutalist | other
verdict:           carry_over | adapt | rebuild | conflict
native_or_addon:   native | config | plugin | self_built
effort:            S | M | L
reason_code:       not_content_site | stale | archived | no_demo |
                   plugin_only | duplicate | out_of_scope
source_type:       repo_record | official_docs | demo_site | readme
evidence_type:     demo_observable | source_token | readme_claim
```

注：`style_bucket` 含 `other` 兜底，是为保证"不因风格预筛淘汰"（spec FR-015）——
任何无法归入既有档位的风格进入 `other` 而非被排除。

## 状态转换

候选主题的演示状态是**唯一有状态流转的字段**，用于解释"演示不可达"不等于"淘汰"：

```text
Hit
 └─> excluded(no_demo)        # 从未有演示链接
 └─> Candidate(no_demo)       # 曾有演示但未提取到
        └─> Candidate(unreachable)   # 探测失败，保留并标注
        └─> Candidate(reachable)     # 探测成功
```

**约束**：一旦进入 `Candidate`，任何状态都 **不得** 迁出候选池。这是
`|Hit| == |Candidate| + |ExcludedItem|` 恒等式成立的前提。

## 与 CSV 附表的映射

`candidates.csv` 为 `Candidate` × `Hit` 的扁平化视图（spec R7），列定义：

```text
repo_id, repo_url, stargazers, created_at, pushed_at, latest_release_at,
origin_ecosystem, style_bucket, demo_url, demo_status,
typography, color_contrast, density_whitespace, motion_interaction, responsive,
dark_mode, first_impression, visual_total,
zh_typography, i18n_prefixless, fallback_canonical, books_chapters,
static_search, image_lightbox, dark_mode_cap, dynamic_og,
license_spdx, is_recommended, similar_to_current, snapshot_at
```

共 30 列。字段来源与 spec 的对应：

| spec 要求 | CSV 列 |
|-----------|--------|
| 仓库地址（FR-008） | `repo_id` + `repo_url` |
| 星标数（FR-008） | `stargazers` |
| 创建时间（FR-008） | `created_at` |
| 最近提交时间（FR-008） | `pushed_at` |
| 最近发版时间（FR-008） | `latest_release_at` |
| 许可证（FR-008） | `license_spdx` |
| 原始生态与技术栈（FR-008） | `origin_ecosystem`（技术栈详见 `stack`，在报告中呈现） |
| 在线演示地址（FR-008） | `demo_url` + `demo_status` |

**映射约束**：`visual_total` 为七维之和（7–35 分），仅用于排序便利，
不得替代分维度展示——spec FR-015 要求分档而非单一总分排名。