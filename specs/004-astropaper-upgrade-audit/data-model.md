# Data Model: AstroPaper 上游版本差异审计

**特性**: [spec.md](./spec.md) | **日期**: 2026-11-21

> 本特性无运行时数据，实体为审计报告的结构化信息模型。

## 实体

### 1. UpstreamRelease（上游版本记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| tag | string | 版本号（v7.0.0 / v7.1.0 / v7.2.0） |
| released_at | date | 发布日期 |
| kind | enum | `major` \| `minor` \| `patch` |
| highlights | string[] | 变更要点（release notes 原文提炼） |
| breaking | string[] | 破坏性变更（可为空） |
| source_url | string | release 页链接（必填） |

**固定枚举值（3 条，见 research.md R1）**。校验规则：tag 必须出现在 releases.atom
缓存中；`source_url` 必须可访问。

### 2. ChangeVerdict（变更对照项）——核心实体

一条功能簇 × 本站现状的判定。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 对照项编号（C01、C02…） |
| cluster | string | 功能簇（TOC 系统 / custom 插槽 / 依赖 / 修复 / 工程化 / 管线…） |
| upstream_ref | string | 上游来源（release tag + commit/PR 号或 diff 文件路径） |
| upstream_change | string | 上游做了什么 |
| local_status | string | 本站现状（描述或实现文件路径） |
| verdict | enum | `adopt` \| `already_have` \| `not_applicable` \| `tradeoff` |
| evidence_upstream | string | 上游侧证据（release/commit 链接） |
| evidence_local | string | 本站侧证据（文件路径或现状描述） |
| priority | enum \| null | adopt 项必填：`P1` \| `P2` \| `P3` |
| effort | enum \| null | adopt 项必填：`S` \| `M` \| `L` |
| conflict_risk | string \| null | 触及自研区时必填：分叉说明 |
| insufficient_evidence | boolean | 证据不足标记（true 时该判定仅供参考） |

**校验规则**:

- `verdict` 为封闭枚举，禁止"视情况"类不可决策值（FR-003）
- `adopt` ⟹ `priority` 与 `effort` 非空（FR-005）
- 触及 data-model 实体 3 清单中的自研区 ⟹ `conflict_risk` 非空（FR-006）
- `evidence_upstream`/`evidence_local` 缺一即 MUST 置 `insufficient_evidence = true`
  （FR-004）

### 3. SelfBuiltArea（本站自研区）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | SB1…SB10 |
| name | string | 区域名（如"组件级 TOC"） |
| local_files | string[] | 实现文件路径 |
| upstream_touchpoint | string \| null | 上游在相同区域的变更簇引用 |

**固定清单（≥8 项）**: research.md R6 的 10 项（i18n / 书籍章节 / 组件级 TOC /
Sätteri 管线 / 管线插件组 / OG / 搜索 / 灯箱 / 文章组件群 / 布局细节）。
校验规则：上游功能簇触及任一区域 ⟹ 相关 ChangeVerdict.conflict_risk 非空
（SC-003）。

### 4. DecisionList（决策清单）

结论章的三组列表，每项引用 ChangeVerdict.id。

| 组名 | 收纳规则 |
|------|----------|
| 建议立即采用 | verdict = adopt 且 priority = P1 |
| 暂缓观察 | verdict = adopt 且 priority ∈ {P2, P3}；或 verdict = tradeoff |
| 不采用 | verdict ∈ {already_have, not_applicable} |

校验规则：三组之和 = 全部 ChangeVerdict 数（恒等式 1，SC-004 的可追溯性依据）；
每组各项 id 必须在前文出现过。

## 恒等式

1. **判定完备**: `Σ ChangeVerdict = Σ(adopt) + Σ(already_have) + Σ(not_applicable) + Σ(tradeoff)`，
   且每条上游功能簇至少映射 1 条对照项
2. **版本覆盖**: `Σ UpstreamRelease = 3`（v7.0.0 / v7.1.0 / v7.2.0，与 releases.atom
   逐条比对零遗漏）
3. **决策闭环**: `Σ DecisionList 三组 = Σ ChangeVerdict`

## 状态流转

```text
ChangeVerdict: (待判定) → 判定四类之一（附证据）→ insufficient_evidence 复核消解
DecisionList: Stage D 汇总生成 → quickstart V4 校验闭环
```
