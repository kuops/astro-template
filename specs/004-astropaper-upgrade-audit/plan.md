# Implementation Plan: AstroPaper 上游版本差异审计

**Branch**: `004-astropaper-upgrade-audit` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-astropaper-upgrade-audit/spec.md`

**Note**: 本计划由 `/speckit.plan` 生成。研究结论见 [research.md](./research.md)，
数据模型见 [data-model.md](./data-model.md)，契约见 [contracts/audit-report-contract.md](./contracts/audit-report-contract.md)，
验证指南见 [quickstart.md](./quickstart.md)。

## Summary

对上游 satnaing/astro-paper 自 v6.1.0（本站分叉基线）至 v7.2.0（最新，2026-11-15）
的 3 个版本发布做完整审计，产出对比评估报告：每项上游变更给出四类封闭判定
（adopt / already_have / not_applicable / tradeoff）+ 双重证据 + 优先级与工作量档位，
结论章输出三组决策清单。本计划阶段已实测采集上游全部原始数据（releases atom、
发布说明、v6.1.0...v7.2.0 文件级 diff，68 个变更文件），实施阶段的主体工作是
逐文件深读、逐项判定与报告撰写，不改动任何站点代码。

## Technical Context

**Language/Version**: 中文 Markdown 报告；数据采集用 curl + python3（GitHub
releases.atom / compare .diff，无需 API 认证，无限流问题）

**Primary Dependencies**: 无新增（纯文档特性）；数据源为
`github.com/satnaing/astro-paper`（releases.atom、compare diff、release 页面）

**Storage**: 文件系统；原始数据缓存 `_audit_cache/`（gitignored，临时）

**Testing**: quickstart V0–V5 校验（版本覆盖零遗漏、证据抽查、判定完备性、
决策清单可用性、git 零改动）

**Target Platform**: 本地执行；报告供维护者评审决策

**Project Type**: 文档与资料整理（非代码功能）。站点零改动

**Performance Goals**: 一次性审计，无性能指标

**Constraints**:
- 禁止改动站点代码/依赖/配置（spec FR-009）；`git status` 变更仅限 specs/ 与
  .specify/（宪法原则 II 适用性解释与 001 特性相同：仅对文档执行 prettier）
- 宪法 V：全程无 git 写操作
- 每条上游事实 MUST 有来源（release 页 / commit / diff），禁止版本号推演（FR-010）
- 数据截止 2026-11-21（v7.2.0 为最新）；此后的上游发布不入正文（FR-007）

**Scale/Scope**: 上游 3 个版本（v7.0.0 major / v7.1.0 / v7.2.0）、68 个变更文件、
本站自研区 ≥8 项、预计对照项 25–40 条

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 判定 | 说明 |
|------|------|------|
| I. 静态优先，内容即源码 | ✓ 通过 | 产出为静态文档，无运行时依赖 |
| II. 质量门禁不可绕过 | ✓ 通过（有条件） | 无代码改动；对 specs/ 执行 prettier --check |
| III. 国际化等价性 | ✓ 通过 | 不触碰路由与 i18n 实现；上游 i18n 变更作为审计对象 |
| IV. 字体与首屏性能纪律 | ✓ 通过 | 不引入字体或脚本 |
| V. 提交与推送必须由人工授权 | ✓ 通过 | 全程无 git 写操作 |

**无 violations，Complexity Tracking 留空。**

## Project Structure

### Documentation (this feature)

```text
specs/004-astropaper-upgrade-audit/
├── plan.md                              # 本文件
├── spec.md                              # 功能规格
├── research.md                          # Phase 0：R1–R6 上游实测数据与本站基准
├── data-model.md                        # Phase 1：4 个实体与判定规则
├── contracts/
│   └── audit-report-contract.md         # 报告结构与判定契约
├── checklists/
│   └── requirements.md                  # 规格质量清单（已通过）
├── quickstart.md                        # Phase 1：V0–V5 验证指南
├── audit-report.md                      # 【实施产物】审计报告
└── tasks.md                             # Phase 2 产出（/speckit.tasks）
```

### Source Code (repository root)

```text
astro-template/
├── _audit_cache/                        # 【新增·临时·gitignored】原始数据缓存
│   ├── releases.atom                    # 上游 releases feed（已采集）
│   ├── upstream.diff                    # v6.1.0...v7.2.0 全量 diff（已采集）
│   └── release-notes-v7.{0,1,2}.txt    # 各版本发布说明
└── specs/004-astropaper-upgrade-audit/  # 唯一交付位置
```

**Structure Decision**: 沿用 001 特性"交付物集中 + 原始数据缓存隔离"的结构。
原始采集数据（atom/diff）放 `_audit_cache/` 并加入 .gitignore（唯一允许的仓库
配置改动），保证报告中的每条事实可回溯到缓存原件。

## 实施阶段划分（供 /speckit.tasks 展开）

### Stage A：上游变更采集与结构化（大部分已在规划期完成）

1. 采集 releases.atom、三版本发布说明、v6.1.0...v7.2.0 diff（✅ 已完成，见
   research.md R1–R3）
2. 按 68 个变更文件逐个提取 hunk 要点，归类到功能簇（TOC 系统 / custom 插槽 /
   灯箱 / i18n / 依赖 / 修复 / 工程化）
3. 生成版本记录表（v7.0.0 / v7.1.0 / v7.2.0，含日期、分类、来源链接）

**门禁**：版本覆盖零遗漏（与 releases atom 逐条比对）。

### Stage B：本站自研区清单固化

以仓库现状为准建立 ≥8 项自研区清单（i18n 双语体系、书籍章节、组件级 TOC、
Sätteri 管线、satteri-callouts、mermaid 骨架、代码行号、图片尺寸、==mark==、
OG 生成、Pagefind 搜索模态、PhotoSwipe 灯箱、分享/阅读元数据等），每项附实现
文件路径，作为判定的参照系（data-model 实体 3）。

### Stage C：逐项判定

按契约对每个功能簇 × 本站现状产出对照项：四类封闭判定 + 双重证据 + adopt 项
优先级/工作量/冲突风险。重点冲突区（必须显式标注路径分叉）：

- **Markdown 管线**：上游 v7 仍为 unified（显式 markdown-remark ^7.3.6 + 自研
  rehypeInlineToc/rehypeTableWrapper）；本站已迁移 Sätteri——上游 TOC 相关变更
  （rehypeInlineToc、buildTocTree）在本站管线不可直接采用，需评估语义等价方案
- **TOC**：上游 v7.1.0 内建文章旁 TOC + features.toc 配置 + hideToc；本站已有
  组件级 TableOfContents/MobileToc——判定 already_have 需逐点核对语义差异
  （触发阈值、显示断点、浮动按钮、i18n 文案）
- **pnpm 迁移**：上游转 pnpm；本站宪法锁定 npm——not_applicable（宪法依据）
- **依赖领先区**：本站 astro 7.4.13 > 上游 7.4.8、mdx 8.1.6 > 8.1.3——注明
  "本站领先"，仅评估其余依赖（satori 0.26→0.63.2、sharp、pagefind、eslint-
  plugin-astro、prettier、@shikijs/transformers）是否采用

### Stage D：报告撰写与决策清单

按契约 C1 八章结构撰写 audit-report.md（中文，术语附英文原名），结论章输出
三组决策清单。

**门禁**：执行 quickstart V0–V5 全部校验。

### Stage E：收尾

1. `npx prettier --check specs` 通过
2. `git status` 变更仅限 specs/、.specify/、.gitignore（_audit_cache 条目）
3. 数据截止日期标注复核

## Phase 0 → Phase 1 完成情况

| 阶段 | 产出 | 状态 |
|------|------|------|
| Phase 0 | `research.md`（R1–R6，上游数据已实测采集，无遗留 NEEDS CLARIFICATION） | ✓ 完成 |
| Phase 1 | `data-model.md`（4 实体 + 判定规则） | ✓ 完成 |
| Phase 1 | `contracts/audit-report-contract.md`（报告结构与判定契约） | ✓ 完成 |
| Phase 1 | `quickstart.md`（V0–V5） | ✓ 完成 |

## Constitution Check（Phase 1 复检）

| 原则 | 复检结果 |
|------|----------|
| I. 静态优先 | ✓ 全为静态文档 |
| II. 质量门禁 | ✓ 仅文档变更，prettier 纳入 Stage E |
| III. i18n 等价性 | ✓ 不触碰实现 |
| IV. 字体与性能 | ✓ 不引入 |
| V. Git 人工授权 | ✓ 无写操作 |

**结论**：无 violations。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| GitHub API 限流 | 数据采集中断 | 已改用 atom feed + compare .diff（无限流）；已采集数据落盘 `_audit_cache/` |
| diff 量大（10335 行）逐文件深读耗时 | 判定粗糙 | 按 68 文件 → 功能簇归类，簇内抽深读；每项判定仍需 hunk 级证据 |
| 上游 TOC 与本站 TOC 语义相似易误判 already_have | 漏掉真实差异 | FR-008 边缘情况明确：逐点核对触发阈值/断点/浮动按钮/配置面 |
| satori 0.26→0.63.2 大跨度 | OG 图渲染行为变化 | 判定为 tradeoff，实施建议含 OG 快照对比步骤 |
| 上游后续发布 | 报告时效 | FR-007：截止日期标注 + 复核提示章 |

## 依赖与前置

- 网络可达 github.com（atom/diff 已验证可取）
- 无 npm 依赖变更（不触碰 package.json）

## 明确不做的事

1. 不修改站点代码、依赖、配置（spec FR-009）
2. 不执行任何采用动作——审计报告是决策依据，不是变更清单的执行授权
3. 不做全量 fork 合并（git merge upstream）——与本站架构偏离程度不兼容，
   采用必须逐项手动移植
4. 不执行 `git commit` / `git push`（宪法 V）
