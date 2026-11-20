# Implementation Plan: 博客主题调研与 Astro 适配

**Branch**: `001-blog-framework-research` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-blog-framework-research/spec.md`

**Note**: 本计划由 `/speckit.plan` 生成。研究结论见 [research.md](./research.md)，
数据模型见 [data-model.md](./data-model.md)，契约见 [contracts/](./contracts/)，
验证指南见 [quickstart.md](./quickstart.md)。

## Summary

本次交付一份**决策用主题调研报告**，目标框架已锁定 Astro，主题可跨 Hugo、Next.js 等生态
取材后适配移植。核心挑战不在于"找几个主题"，而在于"不设数量上限"这一要求与 GitHub 搜索
**1000 条硬性结果上限**的冲突。

调研已实测确认：REST 在第 11 页返回 422，GraphQL 在 1000 条处**静默截断**（`hasNextPage`
变 false 但 `repositoryCount` 仍为 1707）。因此本计划的核心技术方案是**星标分桶查询**，
并用"分桶求和 == 无条件计数"作为覆盖率的机器证明。同时已证实仅靠 `topic:` 检索会漏掉
`LyraVoid/Shirone`（452 星，topics 为空）、`incluud/accessible-astro-starter`（1194 星，
无 `astro-theme` topic）等高星标项目，故必须采用 **topic + keyword + seed + recent 四路召回**。

产出为纯文档（Markdown 报告 + CSV 附表 + 查询凭证），不生成任何图像，不改动任何应用代码。

## Technical Context

**Language/Version**: Bash 5.x（编排脚本）+ GitHub CLI 2.x（`gh api`）；报告为中文 Markdown

**Primary Dependencies**: `gh`（已认证，`search` 限流 30/min、`graphql` 5000 pts/h）、
`curl`（演示可达性探测）、`jq`（NDJSON 处理）。**不新增 npm 依赖**

**Storage**: 文件系统。中间结果落 `./_research_cache/*.ndjson` 支持断点续跑；
最终产出落 `specs/001-blog-framework-research/`

**Testing**: 以 `quickstart.md` 的 V0–V11 作为验收测试。关键两项：
V2 分桶闭合校验（`Σ桶 == 无条件`）、V6 视觉证据可复核（禁止截图断言）

**Target Platform**: 本地 Linux 执行；产出供维护者在浏览器中评审

**Project Type**: 文档与资料整理（非代码功能）。仓库现有 Astro 7 站点**不在本次改动范围**

**Performance Goals**: 全流程在 20 分钟内完成（含限流等待）。以约 250 次搜索请求估算，
串行 2.5s 间隔约需 10–11 分钟，加 curl 探测与人工判定留出余量

**Constraints**:

- GitHub 搜索结果硬上限 1000 条（REST 报 422、GraphQL 静默截断）
- 搜索限流 30 次/分钟，超限 403 且需等待 `reset`
- 禁止生成图像（spec FR-009）、禁止改动应用代码（spec FR-025）
- 视觉判断必须可复核，禁止声称来自未生成的截图（spec FR-011）
- 星标数与 `pushed_at` 为 2026-11-17 快照

**Scale/Scope**: 纳入候选预计 300–500 条（`topic:hugo-theme` 单 topic 有效 696 条；
叠加用途匹配与演示可核验后显著收窄）。深度核验需覆盖全部纳入候选，不含抽样

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 判定 | 说明 |
|------|------|------|
| I. 静态优先，内容即源码 | ✓ 通过 | 本功能不引入服务端、数据库或运行时 CMS；产出为静态文档 |
| II. 质量门禁不可绕过 | ✓ 通过（有条件） | 无代码改动，`lint`/`build` 不因本功能失败；但产出文档仍须 Prettier 通过 |
| III. 国际化等价性 | ✓ 通过 | 不触碰路由与 i18n 实现；仅把双语能力作为**评估基线**写入判定契约 |
| IV. 字体与首屏性能纪律 | ✓ 通过 | 不引入字体或脚本；反而将字体策略列为候选评估项（`zh_typography`） |
| V. 提交与推送必须由人工授权 | ✓ 通过 | 本计划全程不执行 `git commit`/`push`/`tag`；仅只读操作 |

**无 violations，Complexity Tracking 留空。**

**需要说明的一处张力**：原则 II 要求"代码改动须过 lint/format/build"。本功能无代码改动，
故仅对产出文档执行 `npx prettier --check specs`。这是对原则 II 的**适用性解释**而非绕过——
若后续有人把调研产出的代码片段落地到 `src/`，则必须回到完整三道门禁。

## Project Structure

### Documentation (this feature)

```text
specs/001-blog-framework-research/
├── plan.md                              # 本文件
├── spec.md                              # 功能规格（已澄清）
├── research.md                          # Phase 0：R1–R8 研究结论
├── data-model.md                        # Phase 1：8 个实体与恒等式
├── quickstart.md                        # Phase 1：V0–V11 验证指南
├── contracts/
│   ├── github-search-contract.md        # C1–C6 检索执行契约
│   └── theme-evaluation-contract.md     # V1–V6 评审判定契约
├── checklists/
│   └── requirements.md                  # 规格质量清单（16/16 通过）
├── research-report.md                   # 【实施产物】主报告
├── candidates.csv                       # 【实施产物】机器可读附表
├── queries.md                           # 【实施产物】查询凭证
└── tasks.md                             # Phase 2 产出（非本命令生成）
```

### Source Code (repository root)

**本功能不产生源码。** 仓库现有结构与本次边界：

```text
astro-paper-template/
├── src/                    # 不修改
├── package.json            # 不修改（不增删依赖）
├── astro.config.ts         # 不修改
├── astro-paper.config.ts   # 不修改
├── .github/workflows/      # 不修改
├── _research_cache/        # 新增（gitignored）：检索中间结果
│   ├── queries.ndjson
│   ├── hits.ndjson
│   ├── probes.ndjson
│   └── state.json
└── specs/001-blog-framework-research/   # 唯一产出位置
```

**Structure Decision**: 采用"文档目录集中产出 + 缓存目录隔离"的结构。理由：

1. 全部交付物收敛在 `specs/001-blog-framework-research/`，便于维护者一次性评审，
   也与 Spec Kit 的既有布局一致（`research-report.md` 与 `plan.md` 同层）。
2. 检索中间结果放 `_research_cache/`，与交付物分离，避免数百条 NDJSON 污染评审目录；
   该目录需加入 `.gitignore`（**这是唯一允许的仓库配置改动，属本次产出的一部分**）。
3. `src/`、构建配置与工作流完全不动，从结构上保证 spec FR-025。

**关于 `.gitignore` 的例外说明**：spec FR-025 禁止改动应用与部署文件。`.gitignore` 不属于
应用代码或部署配置，且不加入则缓存文件会产生数百条未跟踪记录，干扰 `git status` 的
"零改动"核验（SC-011）。此改动将在 tasks.md 中明确列为独立任务。

## 实施阶段划分

### Stage A：基础设施与计数闭包（阻塞后续一切）

对应 `github-search-contract.md` C1、C3。

1. 建立 `_research_cache/`，写入 `.gitignore`。
2. 定义星标分桶 `0..1 | 2..2 | 3..5 | 6..10 | 11..50 | 51..100 | 101..500 | 501..1000 | >=1001`。
3. 对每个 topic 执行"计数阶段"：只取 `total_count`，逐桶求和，与无条件计数比对。
4. 任何不闭合的 topic 必须细分桶后重跑，直至 `Σ桶 == 无条件`。

**门禁**：全部 topic 闭合方可进入 Stage B。这是 SC-003 的唯一证据来源。

### Stage B：四路召回

对应 C1.4、C1.5、research.md R3、R9。

1. **topic 路径**：`astro-theme`、`astro-blog`、`astro-template`、`hugo-theme`、
   `blog-theme`、`nextjs-blog` 等，逐桶分页取仓库。
2. **keyword 路径**：`astro blog theme in:description`、`hugo theme blog in:name`、
   `nextjs blog theme in:name` 等。
3. **seed 路径**：解析 `one-aalam/awesome-astro`（实测可抽出 61 个仓库引用）、
   `theNewDynamic/awesome-hugo` 的 README。
4. **recent 路径**：四个 `created:` 时间窗 × 星标桶，用于覆盖近 12 个月新增的高增长项目
   （FR-004、SC-004）。

**去重**：以 `repo_id` 为键，合并 `source_query_ids`。
**门禁**：`candidates.csv` 中必须能找到三个判定性样本——`LyraVoid/Shirone`（证明 seed 跑过）、
`incluud/accessible-astro-starter`（证明 keyword 跑过）、`0xdres/astro-devosfera`
（证明 recent 跑过）。任一缺失即指向对应召回路径未执行。

### Stage C：纳入判定与演示探测

对应 C4、theme-evaluation-contract.md。

1. 按 spec FR-006 的纳入条件筛选：用途匹配、近 12 个月活跃、非归档、有演示线索。
2. 不满足者写入 `ExcludedItem`，`reason_code` 七选一，附具体说明。
3. 对纳入候选探测演示可达性：`homepageUrl` → README 链接 → `no_demo`；
   超时 12s、UA 标识、记录最终 URL 与状态码。
4. 区分"演示站"与"商品页"（如 `themefisher.com/products/*` 应标 `product_page_only`）。

**门禁**：`|distinct Hit| == |Candidate| + |ExcludedItem|` 成立（C3.1 等式 3）。

### Stage D：深度核验

对应 theme-evaluation-contract.md V2–V4。

对**每个**纳入候选（非抽样）填写：

1. 七维视觉评分，每维必须带 `evidence_type` 与 `evidence_locator`。
2. 八项能力判定，每项标注 `verdict` 与 `native_or_addon`。
3. 风格分档（九档之一，`other` 为兜底）。
4. `similar_to_current` 标记。

**关键纪律**：证据不足时标"不可判定"，**不得**默认判为 `carry_over` 或猜测填分。
**门禁**：无空缺判定；每个视觉维度都有来源标注。

### Stage E：报告撰写与产出

对应 C5、V5。

1. 生成 `queries.md`：全部查询式、命中数、执行时间、闭合校验结果。
2. 生成 `candidates.csv`：`data-model.md` 规定的 27 列扁平视图。
3. 撰写 `research-report.md`：固定八章结构（C5.3）。
4. 对被推荐的顾问性主题补写移植路线（V5.1 五阶段 + 回退契约）。

**门禁**：执行 `quickstart.md` 全部 V0–V11 检查。

### Stage F：收尾校验

1. `npx prettier --check specs` 通过。
2. `git status` 仅含 `specs/`、`.specify/`、`.gitignore` 变更。
3. 无任何图像文件（V0）。
4. 报告中无"截图显示"类断言（V6）。

## Phase 0 → Phase 1 完成情况

| 阶段 | 产出 | 状态 |
|------|------|------|
| Phase 0 | `research.md`（R1–R8，无遗留 NEEDS CLARIFICATION） | ✓ 完成 |
| Phase 1 | `data-model.md`（8 实体 + 2 个计数恒等式） | ✓ 完成 |
| Phase 1 | `contracts/github-search-contract.md`（C1–C6） | ✓ 完成 |
| Phase 1 | `contracts/theme-evaluation-contract.md`（V1–V6） | ✓ 完成 |
| Phase 1 | `quickstart.md`（V0–V11） | ✓ 完成 |

## Constitution Check（Phase 1 复检）

设计完成后重新对照五条原则：

| 原则 | 复检结果 |
|------|----------|
| I. 静态优先 | ✓ 产出全为静态文档，无运行时依赖 |
| II. 质量门禁 | ✓ 仅文档变更；`prettier --check` 纳入 Stage F |
| III. i18n 等价性 | ✓ 双语能力作为评估基线写入 V4.4，未改动实现 |
| IV. 字体与性能纪律 | ✓ 中文排版策略成为评估项，不引入新字体 |
| V. Git 人工授权 | ✓ 全计划无任何写操作 Git 命令 |

**结论**：无 violations。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 关键假设 | | |
| GraphQL 静默截断被忽略 | 报告谎称"全覆盖" | C2.3.1 强制校验 `取回条数 == repositoryCount` |
| 搜索限流打断长流程 | 无法完成 | 2.5s 间隔 + NDJSON 断点续跑 + 403 读 reset 重试 |
| 演示站大面积不可达 | 视觉判断失去依据 | 降级到 `source_token` 证据；候选仍保留并标注 |
| 候选量超出人工核验能力 | Stage D 失控 | 纳入条件已把 hugo-theme 从 1707 收窄到 696；如需进一步收窄，**只能收紧纳入条件，不得抽样** |
| 视觉判断流于主观 | 违反 FR-011 | 七维评分表 + 三类证据来源强制标注 |
| `homepageUrl` 指向商品页 | 误判为演示站 | 显式区分 `product_page_only`（实测 themefisher 系列均为商品页） |

## 依赖与前置

- `gh` 已认证且对 `search` 有配额（实测 `search: 30/min`、`graphql: 5000/h`）。
- 网络可访问 GitHub API 与各演示站。
- 无 npm 依赖变更（不触碰 `package-lock.json`）。

## 明确不做的事

1. 不实现任何主题移植、不创建 Astro 主题脚手架、不替换依赖（spec FR-026）。
2. 不生成截图、缩略图或视觉拼版（spec FR-009）。
3. 不修改 `src/`、`package.json`、`astro.config.ts`、`astro-paper.config.ts`、
   `.github/workflows/`（spec FR-025）。
4. 不执行 `git commit` / `git push`（宪法原则 V）。
5. 不对候选做"是否符合本风格"的预筛淘汰（spec FR-015）。