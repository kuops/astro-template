# Contract: 审计报告结构与判定契约

**特性**: [spec.md](../spec.md) | **日期**: 2026-11-21

本契约规定交付物 `audit-report.md` 的结构、每条对照项的必填字段与措辞纪律。
产物 MUST 满足本契约 + spec FR-001–FR-010。

## C1 报告章节结构（顺序固定，缺一不合格）

```text
# AstroPaper 上游差异审计（v6.1.0 → v7.2.0）
## 1. 结论摘要            ← 三组决策清单 + 数据截止日期 + 一页速览表
## 2. 上游版本图谱         ← 三版本记录（日期/类型/要点/破坏性/来源链接）
## 3. 本站自研区基准       ← SelfBuiltArea 清单（含实现文件路径）
## 4. 逐项对照判定         ← ChangeVerdict 全量，按功能簇分组
## 5. 冲突与路径分叉专区   ← Sätteri vs unified、TOC 语义对照、pnpm、依赖领先区
## 6. 采用路线建议         ← adopt 项的实施建议（涉及区域 + 风险 + 验证方式）
## 7. 时效性与复核提示     ← 截止日期 2026-11-21 + 后续上游发布复核方式
## 8. 证据索引             ← 全部来源链接汇总（release/commit/diff/本地文件）
```

## C2 ChangeVerdict 条目格式

第 4 章每条对照项 MUST 含以下字段（表格行或小节均可，字段不可缺）：

- **编号**：C01、C02…（全文可追溯）
- **上游变更**：一句话 + 来源（release tag + PR/commit 号或 diff 文件路径）
- **本站现状**：一句话 + 实现文件路径（或"无对应实现"）
- **判定**：`adopt` / `already_have` / `not_applicable` / `tradeoff` 四选一
- **依据**：双重证据的连接说明（为什么这个判定成立）
- **adopt 附加**：优先级（P1/P2/P3）+ 工作量（S/M/L）+ 冲突风险（触及自研区时）
- **证据不足声明**：无法取全双重证据时显式标注，判定降级为参考

## C3 判定措辞纪律

- 禁止使用"视情况而定"、"建议评估"等不可决策措辞作为判定值（判定只能取四类枚举）
- `already_have` MUST 指出本站等价实现的具体文件；语义不完全等价时 MUST 列出差异点
  （禁止仅凭名称相似判定，spec 边缘情况 5）
- `not_applicable` MUST 附原因；因宪法约束不适用时注明原则编号（如 pnpm → 宪法
  技术约束"唯一使用 npm"）
- 路径分叉（本站重写区 vs 上游重构区）MUST 在第 5 章专节呈现双方现状，不强行套用
  四类判定
- "本站领先"的依赖（astro/mdx）MUST 注明领先版本，不作为 adopt 项

## C4 事实纪律

- 每条上游事实 MUST 有来源：release 页 URL、PR/commit 号、或 `_audit_cache/` 中
  diff 文件路径 + 行号
- 版本号、日期、功能名 MUST 与 release notes 原文一致，MUST NOT 推演
- 本站代码现状 MUST 以仓库实际文件为准（实施时逐项检索验证），MUST NOT 凭会话
  记忆断言
- 报告全中文，术语首次出现附英文原名（如 TOC（Table of Contents））

## C5 交付边界

- 交付物仅 `specs/004-astropaper-upgrade-audit/audit-report.md`（FR-009）
- `_audit_cache/` 加入 .gitignore（唯一允许的仓库配置改动，沿用 003 先例）
- 完成门禁：quickstart V0–V5 全过 + `npx prettier --check specs` + `git status`
  变更仅限 specs/、.specify/、.gitignore
