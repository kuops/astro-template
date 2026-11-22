---

description: "Task list: AstroPaper 上游版本差异审计"
---

# Tasks: AstroPaper 上游版本差异审计

**Input**: Design documents from `/specs/004-astropaper-upgrade-audit/`

**Prerequisites**: [plan.md](./plan.md)（必需）、[spec.md](./spec.md)（用户故事）、
[research.md](./research.md)（上游数据已实测采集）、[data-model.md](./data-model.md)、
[contracts/audit-report-contract.md](./contracts/audit-report-contract.md)、
[quickstart.md](./quickstart.md)

**Tests**: spec 未要求 TDD。本特性的"测试"= quickstart V0–V5 校验，已拆为显式任务
且不可省略。

**Organization**: 按用户故事分组：US1 上游变更图谱 / US2 逐项判定 / US3 决策清单。
US1 是 US2 的输入；US3 依赖 US2；交付物统一为 `audit-report.md` 一个文件。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同章节/无未完成依赖）
- **[Story]**: 所属用户故事
- 所有任务含精确文件路径

## 路径约定

- 交付物：`specs/004-astropaper-upgrade-audit/audit-report.md`（唯一报告文件）
- 原始数据：`_audit_cache/`（releases.atom、upstream.diff，已采集并 gitignored）
- **禁止触碰**：`src/`、`package.json`、任何站点代码与配置（spec FR-009）

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 确认 `_audit_cache/`（releases.atom、upstream.diff）就位且 `.gitignore`
      已含 `_audit_cache/` 条目（规划期已部分完成，本任务仅核验补齐，
      per plan: Structure Decision）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 把 10335 行 diff 提炼为结构化功能簇，固化本站自研区清单——US1/US2 的共同输入

**⚠️ CRITICAL**: 本阶段产出是判定的事实基础；漏簇会导致 SC-001 版本覆盖失败

- [x] T002 逐文件提取 v6.1.0...v7.2.0 diff 的变更要点：读取
      `_audit_cache/upstream.diff`（68 文件），按 plan Stage A 的功能簇归类
      （TOC 系统 / custom 插槽 / 灯箱 / 修复集 / 管线 / 表格 / OG / i18n /
      工程化 / 依赖），每个文件一行要点（新增/修改/删除 + 关键 hunk），写入
      `_audit_cache/cluster-notes.md`
- [x] T003 [P] 固化本站自研区清单：以仓库现状检索确认 research.md R6 的 10 项
      （i18n / 书籍章节 / 组件级 TOC / Sätteri 管线 / 管线插件组 / OG / 搜索 /
      灯箱 / 文章组件群 / 布局细节）的实现文件路径，逐项核对后写入
      `audit-report.md` 第 3 章（data-model.md `SelfBuiltArea.local_files`，
      ≥8 项为 SC-003 前提）

**Checkpoint**: 功能簇笔记与自研区清单就绪——判定的事实地基完成

---

## Phase 3: User Story 1 - 看清上游到底变了什么 (Priority: P1) 🎯 MVP

**Goal**: 报告第 2 章交付三版本完整图谱，抽查 5 条可验证

**Independent Test**: 任取 5 条变更均能在 `_audit_cache/`（release notes 原文 /
diff hunk）中验证（SC-001 / US1 验收 1–2）

- [x] T010 [US1] 撰写 `audit-report.md` 第 2 章"上游版本图谱"：v7.0.0 / v7.1.0 /
      v7.2.0 逐版本成行（tag、日期、类型、变更要点、破坏性变更、来源链接），
      内容以 release notes 原文为准（data-model.md `UpstreamRelease` 全字段，
      破坏性项显式标注 per US1/AC2），页首标注数据截止 2026-11-21（FR-007）
- [x] T011 [US1] 撰写 `audit-report.md` 第 1 章框架与"一页速览表"（版本数 /
      变更簇数 / 判定统计占位），页脚声明本特性仅产出审计报告不改代码（FR-009）

**Checkpoint**: US1 可独立交付——变更图谱可信可复核

---

## Phase 4: User Story 2 - 知道每一项的适用性 (Priority: P1)

**Goal**: 全部功能簇获得四类封闭判定 + 双重证据（报告第 4 章 + 第 5 章分叉专区）

**Independent Test**: 抽 10 条判定，双重证据缺失数为 0；already_have 项均有本站
实现文件（SC-002 / US2 验收 1–3）

- [x] T020 [P] [US2] 修复集簇判定（上下篇方向 #674、表格对齐 #668、
      skip-to-content #665、重复 view-transition-name #662、resolveTimezone、
      resolveDefaultOgImagePath）：逐条核对本站现状（本地代码检索是否已自行
      修复/等价实现），产出对照项 per data-model.md `ChangeVerdict.verdict`
      四类枚举 + 双重证据（`evidence_upstream`/`evidence_local`）
- [x] T021 [P] [US2] TOC 系统簇判定（PostToc/TocList/buildTocTree/
      rehypeInlineToc/features.toc/hideToc）：与本站 TableOfContents.astro +
      MobileToc.astro 逐点语义核对（触发阈值、断点、浮动按钮、配置面、i18n 文案），
      **禁止仅凭名称相似判 already_have**（spec 边缘情况 5）；触及自研区 →
      `conflict_risk` 必填（data-model.md `ChangeVerdict.conflict_risk`）
- [x] T022 [P] [US2] custom 插槽簇判定（src/custom/ 三插槽 + Layout 挂载点）：
      对照本站 Head/文章页的等价扩展现状（分析脚本/验证码类需求是否存在），
      评估 adopt 的优先级与工作量（`effort` S/M/L per data-model.md）
- [x] T023 [P] [US2] 依赖与工程化簇判定（satori 0.63.2 / sharp / pagefind 1.6 /
      eslint-plugin-astro 3.2.1 / prettier 3.9.10 / @shikijs 4.6 / tailwind 4.3.5 /
      copy-pagefind.mjs / dependabot / ci.yml）：按 research.md R5 对照表逐项判定；
      astro/mdx 标注"本站领先"；pnpm 判 not_applicable 并引用宪法 npm 约束
      （契约 C3 措辞纪律）
- [x] T024 [US2] 管线分叉专章：撰写 `audit-report.md` 第 5 章"冲突与路径分叉"——
      Sätteri vs unified 双方现状、上游 rehype 插件不可直接采用的原因、TOC 废弃
      remark-toc 与本站 003 迁移方向一致的确认、本站领先依赖清单
      （per research.md R4 / 契约 C3 路径分叉纪律）
- [x] T025 [US2] 汇总第 4 章"逐项对照判定"：将 T020–T023 的对照项按簇写入
      `audit-report.md` 第 4 章，格式 per contracts C2（编号 C01+、四类判定、
      双重证据、adopt 附加字段）；核对判定完备恒等式（data-model.md 恒等式 1）

**Checkpoint**: US2 可独立交付——每项变更都有可决策的判定

---

## Phase 5: User Story 3 - 拿到可执行的采用路线 (Priority: P2)

**Goal**: 结论章三组决策清单 + adopt 项实施建议

**Independent Test**: 仅读第 1 章即可 10 分钟内完成分组决策（SC-004 / US3 验收 1–2）

- [x] T030 [US3] 撰写 `audit-report.md` 第 6 章"采用路线建议"：每个 P1 adopt 项
      给实施建议（涉及区域 + 风险 + 验证方式，如 satori 升级含 OG 快照对比步骤；
      per FR-005）；tradeoff 项写明权衡点
- [x] T031 [US3] 完成第 1 章"结论摘要"：三组决策清单（立即采用 / 暂缓观察 /
      不采用）+ 判定统计，三组项数之和 = 对照项总数（data-model.md
      `DecisionList` 恒等式 3），各项 id 可回溯第 4 章（SC-004）

**Checkpoint**: US3 完成——报告具备决策闭环

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T040 [P] 撰写 `audit-report.md` 第 7 章"时效性与复核提示"（截止日期 +
      后续上游发布复核方式）与第 8 章"证据索引"（release/PR/diff/本地文件
      全部来源汇总，per FR-007/FR-010）
- [x] T041 执行 quickstart V0–V4 全量校验：V0 版本覆盖零遗漏、V1 抽 10 条
      双重证据、V2 判定枚举合法且无"视情况/TBD"、V3 冲突区覆盖、V4 决策闭环；
      记录通过/失败
- [x] T042 交付边界核验与收尾：`npx prettier --check specs` 通过；
      `git status` 变更仅限 specs/、.specify/、.gitignore（SC-006 / FR-009）；
      全程未执行 `git commit` / `git push`（宪法 V）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: 立即（核验性）
- **Phase 2**: 依赖 Phase 1；**阻塞全部 US**（簇笔记与自研区清单是判定地基）
- **Phase 3 (US1)**: 依赖 Phase 2（簇归类完成后才能成章）
- **Phase 4 (US2)**: 依赖 Phase 2 + Phase 3（第 2 章版本图谱先行）；T020–T023
  四簇可并行，T024/T025 汇总在后
- **Phase 5 (US3)**: 依赖 T025（判定齐全后才有决策清单）
- **Phase 6**: 依赖全部

### 关键链

```text
T002 (簇笔记) ─┬─> T010/T011 (US1 图谱)
T003 (自研区) ─┴─> T020–T023 (四簇并行判定) ─> T024 (分叉专章)
                                                    ─> T025 (第4章汇总)
                                                          ─> T030/T031 (US3)
                                                                ─> T040–T042 (收尾)
```

### Parallel Opportunities

- Phase 2: T003 与 T002 可并行（不同文件）
- Phase 4: T020、T021、T022、T023 四簇完全并行（不同章节区域）
- Phase 6: T040 与 V 校验可并行

---

## Implementation Strategy

### MVP First (仅 User Story 1)

Phase 1–3 完成即可交付"上游变了什么"的可信图谱；判定与决策为增量。

### Incremental Delivery

1. 簇笔记 + 自研区 → 判定地基
2. + US1 → 变更图谱（MVP）
3. + US2 → 逐项判定
4. + US3 → 决策闭环
5. + Polish → 校验与边界核验

---

## Notes

- 报告单文件交付：`audit-report.md`，章节顺序固定（contracts C1，缺一不合格）
- 判定措辞纪律：四类封闭枚举，禁止"视情况/TBD"（契约 C3）
- 事实纪律：每条上游事实必须能在 `_audit_cache/` 或 release 页复核（契约 C4）
- 全程禁止改站点代码与 `git commit`/`git push`
