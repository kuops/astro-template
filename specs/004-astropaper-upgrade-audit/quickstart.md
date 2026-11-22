# Quickstart: 上游差异审计验证指南

**特性**: [spec.md](./spec.md) | **契约**: [contracts/audit-report-contract.md](./contracts/audit-report-contract.md)

验证 `audit-report.md` 的完整流程。原始数据已缓存于 `_audit_cache/`（采集于
2026-11-21，见 research.md R1）。

## V0 版本覆盖零遗漏（SC-001）

```bash
# atom feed 中的 7.x 版本数 vs 报告第 2 章版本数
grep -o '<title>[^<]*</title>' _audit_cache/releases.atom | grep -oE 'v7\.[0-9.]+'
# 预期: v7.2.0 / v7.1.0 / v7.0.0，报告第 2 章逐一成行且日期一致
```

## V1 证据抽查（SC-002 / FR-010）

从报告第 4 章随机抽 10 条对照项：
- 上游侧来源（release/PR/diff 路径）逐条打开或在 `_audit_cache/upstream.diff`
  中定位，内容与报告描述一致
- 本站侧证据（文件路径）逐条 `grep` 验证存在且与描述相符

**失败响应**：缺失即补采证据或降级为 insufficient_evidence。

## V2 判定完备与枚举合法（FR-003）

```bash
grep -cE 'adopt|already_have|not_applicable|tradeoff' specs/004-astropaper-upgrade-audit/audit-report.md
grep -c '视情况\|待定\|TBD' specs/004-astropaper-upgrade-audit/audit-report.md   # 预期 0
```

- 全部功能簇 ≥1 条对照项；adopt 项均带优先级 + 工作量（data-model 校验规则）

## V3 冲突区标注（SC-003 / FR-006）

- 第 5 章存在且覆盖四大分叉：Markdown 管线（Sätteri vs unified）、TOC 语义对照、
  pnpm（宪法）、依赖领先区（astro/mdx）
- 触及 research.md R6 自研区的对照项均带冲突风险说明

## V4 决策清单闭环（SC-004 / 恒等式 3）

- 第 1 章三组清单（立即采用 / 暂缓观察 / 不采用）齐备
- 三组项数之和 = 第 4 章对照项总数；每组各项 id 可回溯

## V5 交付边界（SC-006 / FR-009）

```bash
npx prettier --check specs
git status --short   # 变更仅限 specs/、.specify/、.gitignore；src/ package.json 零改动
```

## V0–V5 与验收标准映射

| 验证 | 对应 | 验证 | 对应 |
|------|------|------|------|
| V0 | SC-001 | V3 | SC-003 |
| V1 | SC-002 / SC-005 | V4 | SC-004 |
| V2 | FR-003 | V5 | SC-006 / FR-009 |
