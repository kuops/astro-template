---

description: "Task list for 博客主题调研与 Astro 适配"
---

# Tasks: 博客主题调研与 Astro 适配

**Input**: Design documents from `/specs/001-blog-framework-research/`

**Prerequisites**: [plan.md](./plan.md)（必需）、[spec.md](./spec.md)（用户故事）、
[research.md](./research.md)、[data-model.md](./data-model.md)、[contracts/](./contracts/)、
[quickstart.md](./quickstart.md)

**Tests**: 未在 spec.md 中要求 TDD，故不生成传统单元测试任务。但本次产出是**调研数据集**，
其质量完全取决于校验是否执行，因此 quickstart 的 V0–V11 校验被拆成显式任务，
且**不是可选的**——它们是交付物的一部分。

**Organization**: 按用户故事分组，每个故事可独立完成与独立验证。
每条任务标注其落实的 `FR-xxx` / `SC-xxx`，便于反向核对 spec 覆盖。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件/不同字段、无未完成依赖）
- **[Story]**: 所属用户故事（US1/US2/US3）
- 所有任务含精确文件路径

## 路径约定

- 全部产出：`specs/001-blog-framework-research/`
- 检索缓存：`_research_cache/`（gitignored）
- 脚本：`_research_cache/scripts/`
- **禁止触碰**：`src/`、`package.json`、`astro.config.ts`、`astro-paper.config.ts`、
  `.github/workflows/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立可断点续跑的执行环境与缓存隔离

**⚠️ 本阶段不得安装任何 npm 依赖**（FR-025）

- [ ] T001 创建检索缓存目录 `_research_cache/` 与其子目录 `_research_cache/scripts/`，
      确认目录为空（若存在旧数据，先归档为 `_research_cache/archive-<timestamp>/`）
- [ ] T002 在仓库根 `.gitignore` 追加 `_research_cache/` 条目；确认 `git status` 不再显示
      缓存文件。**这是本功能唯一允许的仓库配置改动**，理由见 plan.md 的
      "关于 .gitignore 的例外说明"
- [ ] T003 [P] 校验 GitHub CLI 认证状态与配额，写入
      `_research_cache/scripts/00-env-check.txt`：执行 `gh auth status` 与
      `gh api rate_limit --jq '.resources|{search,graphql,core}'`。
      记录基线（实测参考：`search=30/min`、`graphql=5000/h`、`core=5000/h`）。
      若 `search.remaining` 为 0，等待 reset 后再继续
- [ ] T004 [P] 在 `_research_cache/scripts/01-lib.sh` 写入公共函数：
      `gh_search_count`（取 `total_count`）、`gh_graphql_page`（取节点列表）、
      `append_ndjson`（原子追加）、`rate_limit_wait`（读 `reset` 等待）。
      所有函数内建 **2500ms 最小间隔**，403 时读 `X-RateLimit-Reset` 等待后重试（最多 3 次）
- [ ] T005 [P] 在 `_research_cache/scripts/02-probe.sh` 写入演示可达性探测函数：
      HEAD 失败降级 GET，超时 12s，跟随重定向最多 5 跳，UA 为
      `Mozilla/5.0 (compatible; ThemeResearch/1.0)`，记录最终 URL 与 HTTP 状态码

**Checkpoint**: 缓存目录就绪、限速函数可用、探测函数可用

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立**覆盖率可核算**的唯一证据来源。这是全部用户故事的地基

**⚠️ 关键**：本阶段未通过时，任何"已覆盖全部候选"的声明都是未验证的。
GraphQL 在 1000 条处**静默截断**（`hasNextPage=false` 但 `repositoryCount=1707`），
不校验就会得出错误覆盖率。

- [ ] T006 在 `_research_cache/scripts/03-topics.txt` 定义 topic 清单：至少包含
      `astro-theme`、`astro-blog`、`astro-template`、`hugo-theme`、`blog-theme`、
      `nextjs-blog`（FR-002 要求 Astro/Hugo/Next.js 各至少 1 个）
- [ ] T007 在 `_research_cache/scripts/04-buckets.txt` 定义星标分桶，
      **必须逐字使用**：`0..1`、`2..2`、`3..5`、`6..10`、`11..50`、`51..100`、
      `101..500`、`501..1000`、`>=1001`。依据 research.md R2 实测：该切分下
      `topic:hugo-theme` 分桶合计 696 与无条件 696 完全相等
- [ ] T008 编写 `_research_cache/scripts/05-count.sh`：对每个 topic × 每个桶执行计数查询，
      查询式**必须**含 `archived:false pushed:>2025-11-17 stars:<bucket>`
      （契约 C1.1.1、C1.1.2）；结果追加到 `_research_cache/queries.ndjson`
- [ ] T009 编写 `_research_cache/scripts/06-verify-closure.sh` 执行契约 C3.1 等式 1：
      对每个 topic 比对 `Σ桶计数` 与 `无条件 total_count`，输出到
      `_research_cache/scripts/closure-report.txt`。格式参照 C3.3：
      `topic:astro-theme 分桶合计 222 / 无条件 222 ✓`
- [ ] T010 对 T009 中任一**不闭合**的 topic，细分其超限桶（先用
      `0..0`/`1..1` 切分，必要时叠加 `created:` 时间二级键，见契约 C6），
      重跑 T008–T009 直至全部闭合
- [ ] T011 确认全部 topic 闭合，`closure-report.txt` 中每个 topic 均为 `✓`。
      **门禁**：存在任一 `❌` 时不得进入 Phase 3（FR-005 的"全部纳入"以此为前提）

**Checkpoint**: 覆盖率地基就绪 —— `Σ桶 == 无条件` 已成立并被记录

---

## Phase 3: User Story 1 - 选出值得移植的高颜值主题 (Priority: P1) 🎯 MVP

**Goal**: 交付一份候选池，维护者可在 20 分钟内从演示链接与统一维度中圈定目标主题

**Independent Test**: 把 `candidates.csv` 与报告第 3、4 章单独交给维护者，
若其能在 20 分钟内圈定目标主题且无需额外搜索，即视为通过（SC-001）

### 数据采集（四路召回）

- [ ] T012 [P] [US1] 执行 `topic` 路径召回（FR-002、FR-003）：对 T006 全部 topic ×
      全部分桶执行 GraphQL 分页（`first:100`），字段**必须**包含 `nameWithOwner`、`url`、
      `homepageUrl`、`stargazers`、`createdAt`、`pushedAt`、`topics`、
      `primaryLanguage`、`licenseInfo`、`latestRelease { tagName publishedAt }`，
      结果追加 `_research_cache/hits.ndjson`。
      **必须**对每桶校验 `取回条数 == repositoryCount`（契约 C2.3.1）
- [ ] T013 [P] [US1] 执行 `keyword` 路径召回（FR-002）：查询式至少包含
      `astro blog theme in:description`、`astro blog theme in:name`、
      `hugo theme blog in:name`、`nextjs blog theme in:name`，
      均附 `archived:false pushed:>2025-11-17`。**禁止使用 `in:readme`**
      （research.md R4：命中 36065 条，噪声不可控）
- [ ] T014 [P] [US1] 执行 `seed` 路径召回（FR-002）：解析 `one-aalam/awesome-astro` 与
      `theNewDynamic/awesome-hugo` 的 README，用
      `grep -oE 'github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+'` 抽取仓库标识，
      逐个调 `gh api repos/<owner>/<name>` 取元数据。实测 `awesome-astro`
      单文件可抽出 61 个引用
- [ ] T015 [P] [US1] 执行 `recent` 路径召回（FR-004、SC-004）：按契约 C1.5 的四个时间窗
      `created:>2026-09-01`、`created:2026-06-01..2026-09-01`、
      `created:2026-01-01..2026-06-01`、`created:2025-11-17..2026-01-01`，
      每窗叠加 C1.3 星标桶，均附 `archived:false pushed:>2025-11-17`，
      结果追加 `_research_cache/hits-recent.ndjson`。
      **不可省略**：新项目星标低，在前三路召回的星标排序下会被挤出可见范围
      （实测 `0xdres/astro-devosfera` 189 星、`cxro/astro-whono` 176 星均属此类）
- [ ] T016 [US1] 合并**四路**召回并按 `repo_id` 去重：合并 `source_query_ids`，
      保留所有命中路径证据（data-model.md 的去重规则）。写入
      `_research_cache/hits-merged.ndjson`
- [ ] T017 [US1] **判定性校验**（FR-002）：确认 `LyraVoid/Shirone` 出现在
      `hits-merged.ndjson` 中。该仓库 452 星且 **topics 为空数组**，
      仅跑 topic 路径必然漏掉（research.md R3）。若缺失，说明 T014 未真正执行，
      必须补跑而非继续。同理抽查 `incluud/accessible-astro-starter`（1194 星，
      无 `astro-theme` topic）。再抽查 `0xdres/astro-devosfera`，缺失则说明 T015 未执行

### 纳入判定与排除记录

- [ ] T018 [US1] 按 FR-006、FR-007 执行纳入判定：逐条判定"用途匹配
      （博客/写作/内容站点主题）"、"近 12 个月活跃（`pushed_at > 2025-11-17`）"、
      "非 `archived`"、"有演示线索"。纳入者写 `_research_cache/candidates.ndjson`
- [ ] T019 [US1] 为不满足条件的命中写入 `ExcludedItem`（FR-024）：
      `reason_code` **必须**取 `data-model.md` 枚举之一
      （`not_content_site`/`stale`/`archived`/`no_demo`/`plugin_only`/`duplicate`/
      `out_of_scope`），`reason_detail` 写具体说明，**禁止"其他"兜底**
- [ ] T020 [US1] 校验契约 C3.1 等式 3（FR-024、SC-003）：
      `|distinct Hit| == |Candidate| + |ExcludedItem|`。不成立时必须补齐
      `ExcludedItem`，**禁止静默丢弃**（C3.2）
- [ ] T021 [US1] 校验契约 C3.1.1 新增覆盖（SC-004）：
      计算 `created_within_12m / |Candidate|`，要求 `>= 0.25`。
      不足时说明 `recent` 路径的召回是否失效，**不得**通过放宽纳入条件凑数

### 演示可达性

- [ ] T022 [US1] 为每个 Candidate 解析演示地址（FR-008），优先级**必须**为：
      `homepageUrl` → README 首个非 github.com 的 http(s) 链接 → 标记 `no_demo`
      （契约 C4.1）
- [ ] T023 [US1] 执行探测（调用 T005 的 `02-probe.sh`），结果写
      `_research_cache/probes.ndjson`。可并发 8
- [ ] T024 [US1] 按契约 C4.3 归类 `demo_status`（FR-009），特别注意：
      402/429 必须注明"平台侧限制"（实测 `astrowind.vercel.app` 返回 402）；
      指向 `themefisher.com/products/*` 一类必须标 `product_page_only` 而非 `reachable`
- [ ] T025 [US1] 复核"演示不可达不得删除"约束（FR-009）：`demo_status != reachable`
      的候选**必须**保留并标注，校验候选池总数未因探测失败而减少

### 视觉评估与分档

- [ ] T026 [P] [US1] 为每个候选采集视觉证据（FR-010、FR-011）：从仓库源码提取设计令牌
      （`font-family`、`font-size` 阶梯、间距刻度、配色变量、`prefers-reduced-motion`
      处理），将**文件路径 + 行号级定位**写入 `_research_cache/visual-tokens.ndjson`。
      无法提取者标记 `evidence_type` 为 `demo_observable` 或 `readme_claim`
- [ ] T027 [US1] 按 `contracts/theme-evaluation-contract.md` V2.1 的七维口径打分
      （FR-010）：`typography`、`color_contrast`、`density_whitespace`、
      `motion_interaction`、`responsive`、`dark_mode`、`first_impression`，
      每维 1–5 分，每维**必须**带 `evidence_type` 与 `evidence_locator`。
      对比度须按 WCAG 公式 `(L1+0.05)/(L2+0.05)` 计算并写入 `rationale`；
      无法判定时**必须**标"不可判定"，**禁止猜测填分**（FR-011、V1.3.1）
- [ ] T028 [US1] 按 V3.1 为每个候选判定 `style_bucket`（九档之一，`other` 为兜底）
      （FR-015）。归属冲突时按首屏主导特征判定并在 `rationale` 说明取舍。
      **禁止**因风格偏好排除任何候选
- [ ] T029 [US1] 标记 `similar_to_current`（Edge Cases）：与现有 AstroPaper 高度相似者
      置 true，并在报告说明"移植收益是否抵成本"
- [ ] T030 [US1] 校验"最近发版时间"来源正确性（FR-008）：
      `latest_release_at` **必须**来自 `latestRelease.publishedAt`，
      无发行版者置 null。**禁止**用 `pushed_at` 冒充。
      统计无发行版候选数量并写入报告（这类项目只能按提交活跃度判断维护状态）
- [ ] T031 [US1] 生成 `specs/001-blog-framework-research/candidates.csv`，
      **必须逐字使用 data-model.md 规定的 30 列顺序**：
      `repo_id, repo_url, stargazers, created_at, pushed_at, latest_release_at,
      origin_ecosystem, style_bucket, demo_url, demo_status,
      typography, color_contrast, density_whitespace, motion_interaction, responsive,
      dark_mode, first_impression, visual_total,
      zh_typography, i18n_prefixless, fallback_canonical, books_chapters,
      static_search, image_lightbox, dark_mode_cap, dynamic_og,
      license_spdx, is_recommended, similar_to_current, snapshot_at`
- [ ] T032 [US1] 校验 CSV 完整性（FR-008、SC-002）：
      `awk -F',' 'NR>1 { if (NF != 30) print "❌ 列数错误: " $1;
      for (i=19;i<=26;i++) if ($i=="") print "❌ 能力列空缺: " $1 }'`，
      要求无输出且候选数 ≥ 12
- [ ] T033 [US1] 校验风格分档（SC-007）：档数 ≥ 4 且每档 ≥ 1 候选；
      确认 `other` 档为空时已在报告中说明"检索未命中"而非"主动排除"

### 报告（US1 部分）

- [ ] T034 [US1] 撰写 `specs/001-blog-framework-research/queries.md`（FR-003、SC-010）：
      记录全部查询式、`total_count`、执行时间、以及 `closure-report.txt` 的闭合结论
- [ ] T035 [US1] 撰写 `specs/001-blog-framework-research/research-report.md` 的第 2、3、4 章
      （FR-020、FR-021、FR-024）：检索方法与覆盖核算（含 C3.1 三个等式原文）、
      候选池总览（按 `style_bucket` 分档）、候选详情（每候选元数据 + 七维视觉评分 +
      演示链接）。术语首次出现**必须**附英文原名
- [ ] T036 [US1] 校验报告无截图断言（FR-011、SC-012）：
      `grep -nE '截图(显示|可见|中)' research-report.md` 命中项必须全部处于禁止语境，
      且无任何"从截图可见"式结论
- [ ] T037 [US1] 校验演示链接可复核（SC-006）：从报告抽取 5 个 `demo_observable` 断言，
      逐个 `curl -I` 确认站点可达，核对描述特征与源码/演示一致

**Checkpoint**: US1 可独立交付 —— 维护者仅凭 CSV 与报告第 2–4 章即可完成主题圈定

---

## Phase 4: User Story 2 - 确认主题能承载本站既有能力 (Priority: P1)

**Goal**: 为每个候选给出八项本站能力的移植代价判定

**Independent Test**: 抽取任一候选，核对八项能力均有
`carry_over`/`adapt`/`rebuild`/`conflict` 判定且带依据（SC-005）

- [ ] T038 [US2] 在 `_research_cache/scripts/07-baseline.md` 固化本站基线事实
      （FR-012、V4.4），作为判定唯一参照：`zh` 为默认语言且内容在 collection 根目录、
      `prefixDefaultLocale: false`、缺失译文生成 fallback + canonical、
      `src/utils/books.ts` 由目录推导侧边栏、Pagefind 构建期生成索引、
      PhotoSwipe 灯箱、class 切换暗色、satori+resvg-js 生成 OG
- [ ] T039 [P] [US2] 判定 `zh_typography`（FR-012）：检索候选源码中是否存在 CJK 字体栈
      或中文回退。无则 `verdict` 至少为 `adapt`。依据须指向具体文件
      （如 `src/styles/global.css` 或 `tailwind.config.*`）
- [ ] T040 [P] [US2] 判定 `i18n_prefixless`（FR-012）：多数主题默认全前缀，
      须核对是否支持"默认语言无前缀"；不支持则标 `adapt` 或 `rebuild`
- [ ] T041 [P] [US2] 判定 `fallback_canonical`（FR-012）：是否支持缺失译文时的原文回退与
      canonical 指向原语言；无则 `rebuild`
- [ ] T042 [P] [US2] 判定 `books_chapters`（FR-012）：是否有目录驱动的多级侧边栏；
      无则 `rebuild`
- [ ] T043 [P] [US2] 判定 `static_search`（FR-012）：索引是否构建期生成。
      **若依赖运行期 API 或第三方服务，必须标 `plugin` + `conflict`**（V4.2.1）
- [ ] T044 [P] [US2] 判定 `image_lightbox`（FR-012）：是否内置灯箱；若依赖 PhotoSwipe
      等外部库标 `plugin` 而非 `native`
- [ ] T045 [P] [US2] 判定 `dark_mode`（FR-012）：是否有独立 dark 变量块；
      简单反色标 `adapt`
- [ ] T046 [P] [US2] 判定 `dynamic_og`（FR-012）：是否支持构建期生成 OG 图；
      运行期生成则标 `conflict`
- [ ] T047 [US2] 为每项判定填 `verdict`（FR-013，取
      `carry_over`/`adapt`/`rebuild`/`conflict` 之一）与 `basis`（须指向演示可观察特征
      或源码路径），再填 `native_or_addon`（`native`/`config`/`plugin`/`self_built`）
      与 `effort`（`S`/`M`/`L`）。**强制**（FR-014）：搜索依赖 Algolia/Pagefind/
      FlexSearch、评论依赖 Giscus/Disqus、图床依赖外部服务的，一律标 `plugin`，
      **禁止记为 `native`**
- [ ] T048 [US2] 校验能力覆盖（SC-005）：确认 CSV 第 19–26 列无空缺，候选数 ≥ 12。
      证据不足时填"证据不足"标注，**禁止**默认 `carry_over`（V6 失败响应）
- [ ] T049 [US2] 撰写报告第 4 章的"能力判定"子节（FR-012、FR-013）：
      按能力维度而非候选维度组织，使维护者能横向比较"哪个主题在书籍章节上最省事"
- [ ] T050 [US2] 抽查原生性判定（FR-014）：抽 5 条 `native` 判定，确认确实无需外部依赖；
      任一条实为插件则修正，并记录修正过程

**Checkpoint**: US1 + US2 可同时工作 —— 可视化筛选与能力代价可交叉决策

---

## Phase 5: User Story 3 - 估算移植代价并排出实施顺序 (Priority: P2)

**Goal**: 为顾问性推荐主题给出分阶段移植路线与回退点

**Independent Test**: 仅阅读报告第 6 章即可判断该主题能否在可接受工作量内落地（SC-008）

- [ ] T051 [US3] 依据 US1/US2 结果给出**顾问性**推荐（FR-016）：建议不超过 3 个，
      但**必须**同时保留完整候选池呈现。措辞须为"顾问性建议：X，理由…；
      最终由维护者决定"，**禁止**用"推荐"替代候选池（契约 C5.4）
- [ ] T052 [US3] 对被推荐主题按 V5.1 填写五阶段（FR-017）：`S1-visual-shell`、
      `S2-layout-components`、`S3-content-model`、`S4-search-seo`、`S5-deploy-switch`，
      每阶段含 `deliverable`、`validation`、`rollback`、`relative_effort`
- [ ] T053 [US3] 为每阶段填 `static_reuse` 与 `template_rewrite` 两列（FR-018）：
      能复制文件生效的归复用（CSS 变量、字体、图像、静态 HTML 片段）；
      必须改代码逻辑的归重写（模板语法转换、props 接口、路由逻辑、构建插件）。
      **Hugo `{{ }}` 到 Astro `.astro` 的转换不得计入复用**（V5.2）
- [ ] T054 [US3] 校验回退契约（SC-008、V5.3）：每阶段 `rollback` 必须指向一个
      "现有站点仍可发布"的节点，且回退动作不依赖后续阶段
- [ ] T055 [US3] 明确最小可行路径（Story 3 场景 4）：说明 `S1-visual-shell` 可独立成立、
      完成后即产生可见收益、可在 S1 后暂停
- [ ] T056 [US3] 为所有 `MigrationStage` 置 `starts_after_approval = true`
      并在报告中标注"待维护者选定主题后再启动"（FR-026）。
      **禁止**在本次执行任何移植动作
- [ ] T057 [US3] 撰写报告第 6 章（FR-017），并对照 FR-023 说明移植边界：
      只替换外观与版式，还是同时替换内容模型与路由
- [ ] T058 [US3] 校验移植章节的术语一致性（FR-021）：阶段名、能力名、风格档名
      与 data-model.md 枚举拼写完全一致，首次出现处附英文原名

**Checkpoint**: 全部用户故事完成，报告具备决策闭环

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 满足 spec 中的强制性与时效性要求

- [ ] T059 [P] 撰写报告第 5 章"未纳入清单"（FR-024）：按 `reason_code` 分组，
      每组给出计数与代表样例，使 `|Hit| == |Candidate| + |ExcludedItem|`
      可被读者手算复核
- [ ] T060 [P] 撰写报告第 7 章"时效性与复核提示"（FR-020）：
      标注调研截止日期 `2026-11-17`，明确指出**星标数、`pushed_at`、`latest_release_at`、
      框架大版本**在此日期后可能失效
- [ ] T061 [P] 撰写报告第 8 章"证据索引"（FR-019、SC-006）：为关键结论分配 `claim_id`，
      含 `source_type`、`url`、`accessed_at`（data-model.md 的 Evidence 实体）。
      抽样 10 条确认 `url` 可访问、缺失数为 0
- [ ] T062 [P] 撰写报告第 1 章"结论摘要"（FR-001、SC-009）：**必须**声明
      "Astro 为目标框架，本次不产出框架选型结论"；给出当前 AstroPaper 主题的
      3 项以内视觉短板，或明确说明无需更换。**禁止**在此章使用"截图"类表述
- [ ] T063 [P] 校验报告章节顺序符合契约 C5.3（八章，顺序固定），缺一即不合格
- [ ] T064 校验 FR-022：报告明确说明最终站点仍为纯静态托管 GitHub Pages、
      无服务端运行时；若某主题需服务端能力才能保留视觉效果，须写出取舍
- [ ] T065 执行 `npx prettier --check specs` 并要求通过
      （宪法原则 II 对本功能的适用：无代码改动，故仅校验文档）
- [ ] T066 执行交付边界核验（FR-025、SC-011）：
      `git status --short src/ package.json package-lock.json astro.config.ts
      astro-paper.config.ts .github/ tsconfig.json` 必须为空输出
- [ ] T067 执行无图像核验（FR-009、SC-012）：
      `find specs/001-blog-framework-research -type f \( -name '*.png' -o -name '*.jpg'
      -o -name '*.webp' -o -name '*.gif' \) | wc -l` 必须为 `0`
- [ ] T068 执行 quickstart 全量校验 V0–V11，逐项记录通过/失败；
      **V2（分桶闭合）与 V6（无截图断言）为不可妥协项**，任一失败即视为未完成
- [ ] T069 按契约 C5.1 确认四份产出齐全：`research-report.md`、`candidates.csv`、
      `queries.md`，以及既有的 `research.md`/`data-model.md`/`plan.md`
- [ ] T070 校验全文中文表述质量（FR-021）：无中英混杂的病句、
      技术术语首次出现均附英文原名、无未翻译的英文段落
- [ ] T071 执行 spec 追溯核对：逐条确认 FR-001–FR-026 与 SC-001–SC-012
      均有至少一个任务落实，输出 `_research_cache/scripts/traceability.txt`。
      任一未覆盖项必须在报告或 tasks 中补足
- [ ] T072 最终确认：`git status` 仅含 `specs/`、`.specify/`、`.gitignore` 变更；
      **全程未执行 `git commit` / `git push`**（宪法原则 V）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，可立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1；**阻塞全部用户故事**。
  其中 T009–T011 的闭合校验是硬门禁——不通过则任何覆盖率声明无效
- **Phase 3 (US1)**: 依赖 Phase 2。T012–T015 四路召回，T016–T021 去重与恒等式，
  T022–T025 演示探测，T026–T033 视觉评估与 CSV，T034–T037 报告与校验
- **Phase 4 (US2)**: 依赖 US1 的 `candidates.csv`（T031）与 T038 的基线固化
- **Phase 5 (US3)**: 依赖 US1 的视觉结论与 US2 的能力判定
- **Phase 6 (Polish)**: 依赖全部用户故事

### 关键阻塞关系

```text
T007 (分桶定义)
  └─> T008 (计数)
        └─> T009 (闭合校验)
              └─> T010 (细分超限桶)
                    └─> T011 (门禁：全闭合)
                          └─> T012–T015 (四路召回)
                                └─> T016 (去重)
                                      └─> T017 (三例判定性校验)
                                            └─> T018 (纳入判定)
                                                  └─> T020 (恒等式)
                                                  └─> T021 (SC-004 新增比例)
                                                        └─> T031 (candidates.csv)
                                                              └─> US2 / US3
```

**T017 是"四路召回是否真跑了"的判定性证据**。它一次校验三件事：

| 缺失项 | 指向 |
|--------|------|
| `LyraVoid/Shirone` 缺失 | T014 seed 路径未执行 |
| `incluud/accessible-astro-starter` 缺失 | T013 keyword 路径未执行 |
| `0xdres/astro-devosfera` 缺失 | T015 recent 路径未执行 |

### Parallel Opportunities

- **Phase 1**: T003、T004、T005 可并行
- **Phase 3 召回**: T012、T013、T014、T015 四路可并行
- **Phase 3 视觉采集**: T026 可按仓库分批并行
- **Phase 4 能力判定**: T039–T046 八项能力可完全并行
- **Phase 6 报告章节**: T059–T063 五章可并行撰写

### 不可并行的部分

- T022–T024 探测可并发 8，但**状态归类**（T024）必须在全部探测完成后统一做，
  否则 `product_page_only` 与 `reachable` 的边界会判得不一致
- T027 七维评分必须与 T026 的令牌采集对应，不能先打分后找依据——
  否则会退化成猜测（违反 FR-011）
- T021 必须在 T018 完成后计算，因为它依赖纳入后的 `|Candidate|`

---

## Parallel Example: User Story 1 的四路召回

```bash
# 四路可同时启动（各自写入不同 NDJSON 片段，最后合并）
Task: "T012 topic 路径：6 个 topic × 9 桶，GraphQL first:100"
Task: "T013 keyword 路径：4 组关键词，禁止 in:readme"
Task: "T014 seed 路径：解析 awesome-astro 与 awesome-hugo 的 README"
Task: "T015 recent 路径：4 个 created: 时间窗 × 星标桶"
```

## Parallel Example: User Story 2 的能力判定

```bash
# 八项能力互不依赖，可同时判定
Task: "T039 zh_typography"
Task: "T040 i18n_prefixless"
Task: "T041 fallback_canonical"
Task: "T042 books_chapters"
Task: "T043 static_search"
Task: "T044 image_lightbox"
Task: "T045 dark_mode"
Task: "T046 dynamic_og"
```

---

## Implementation Strategy

### MVP First (仅 User Story 1)

1. 完成 Phase 1: Setup（T001–T005）
2. 完成 Phase 2: Foundational（T006–T011，**关键**——闭合校验不过则停下）
3. 完成 Phase 3: US1（T012–T037）
4. **STOP and VALIDATE**：把 `candidates.csv` 与报告第 2–4 章交给维护者，
   验证是否能在 20 分钟内圈定主题
5. 若维护者已能决策，US2/US3 可作为增量补充

**MVP 的实质**：US1 交付"候选池 + 可视化筛选"，这已是本次调研 80% 的价值。
US2 增加能力代价，US3 增加实施路线。

### Incremental Delivery

1. Setup + Foundational → 覆盖率地基就绪（可验证 `Σ桶 == 无条件`）
2. + US1 → 候选池可评审（MVP）
3. + US2 → 能力代价可交叉比较
4. + US3 → 具备移植决策闭环
5. + Polish → 满足全部验收标准

### 关于工作量的现实提醒

`topic:hugo-theme` 加纳入条件后仍有 **696** 条（research.md R4 实测）。若 US1 的
T026–T029 人工核验量超出可承受范围，**唯一允许的收窄方式是收紧纳入条件**
（例如要求有可访问演示 + 星标 ≥ 某阈值），**不得抽样截断**——FR-005 明确禁止抽样，
且抽样会使 C3.1 等式 3 失效。

---

## Notes

- **[P] 任务** = 不同文件/不同字段，无未完成依赖
- **[Story] 标签** = 映射到 spec.md 的用户故事，便于追溯
- 每条任务标注 `FR-xxx` / `SC-xxx`，T071 会做一次全量追溯核对
- 本次无代码实现，故无"实现后重跑测试"的传统循环；替代它的是
  `quickstart.md` 的 V0–V11 校验
- **全程禁止** `git commit` / `git push`（宪法原则 V）
- **全程禁止** 修改 `src/`、`package.json`、`astro.config.ts`、`astro-paper.config.ts`、
  `.github/workflows/`（FR-025）
- 缓存中间结果可用于失败复盘，`_research_cache/` 已加入 `.gitignore`