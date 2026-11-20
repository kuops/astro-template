# 快速验证指南：博客主题调研与 Astro 适配

**用途**：验证本次调研产出是否满足 `spec.md` 的成功标准。**不含实现代码**——本功能交付物是
调研报告，验证以"能否核对"为准，不以"能否运行"为准。

**前提**：`gh` 已认证（`gh auth status` 为已登录）；具备网络访问 GitHub 与各演示站。

---

## V0. 前置检查（1 分钟）

```bash
cd /root/astro-paper-template

# 1. 确认交付物存在
ls -1 specs/001-blog-framework-research/

# 2. 确认未改动应用代码（对应 SC-011）
git status --short | grep -vE '^\?\? (specs/|\.specify/)|^ D (AGENTS\.md|docs/superpowers/|\.vscode/)' \
  && echo "❌ 存在越界改动" || echo "✓ 仅 specs/ 与 .specify/ 变更"
```

**预期**：`research-report.md`、`candidates.csv`、`queries.md` 存在；
第二条命令输出 `✓`。

```bash
# 3. 确认未产出任何图像（对应 SC-012）
find specs/001-blog-framework-research -type f \( -name '*.png' -o -name '*.jpg' \
  -o -name '*.webp' -o -name '*.gif' \) | wc -l
```

**预期**：`0`。

---

## V1. 查询可复现性（对应 SC-010）

从 `queries.md` 中任取 3 条查询式，逐条执行并对比命中数：

```bash
# 示例：取 queries.md 中的第一条 topic 查询
gh api -X GET search/repositories \
  -f q='topic:astro-theme archived:false pushed:>2025-11-17 stars:0..1' \
  -f per_page=1 --jq '.total_count'
```

**预期**：返回值与 `queries.md` 记录的 `total_count_reported` 一致（星标数随时间漂移时
应有小幅偏差，偏差本身需被报告记录为时效性限制）。

**失败判据**：若某查询式返回 422（含 `Only the first 1000` 或逻辑运算符错误），
说明该查询式需细化，报告覆盖率不可信。

---

## V2. 分桶闭合校验（对应 SC-003，最关键）

验证报告声称的"覆盖率"是否真的闭合。

```bash
topic='astro-theme'
buckets=('0..1' '2..2' '3..5' '6..10' '11..50' '51..100' '101..500' '501..1000' '>=1001')
sum=0
for b in "${buckets[@]}"; do
  c=$(gh api -X GET search/repositories \
    -f q="topic:$topic archived:false pushed:>2025-11-17 stars:$b" \
    -f per_page=1 --jq '.total_count')
  echo "  stars:$b => $c"
  sum=$((sum + c))
done
unfiltered=$(gh api -X GET search/repositories \
  -f q="topic:$topic archived:false pushed:>2025-11-17" \
  -f per_page=1 --jq '.total_count')
echo "分桶合计=$sum 无条件=$unfiltered"
[ "$sum" -eq "$unfiltered" ] && echo "✓ 闭合" || echo "❌ 不闭合，覆盖率不可信"
```

**预期**：`✓ 闭合`，且两数相等。

**说明**：这条校验是整个调研可信度的基石。若不等，报告中的"全部纳入"即为未验证。

---

## V3. 1000 条上限的真实性（对应 research.md R1）

确认分桶不是多余设计，而是必需。

```bash
# REST 第 11 页应失败
gh api -X GET search/repositories -f q='topic:hugo-theme' \
  -f per_page=100 -f page=11 --jq '.items|length'
```

**预期**：报错 `Only the first 1000 search results are available (422)`。

```bash
# GraphQL 静默截断：取回条数 < repositoryCount
gh api graphql -f query='
{ search(query: "topic:hugo-theme", type: REPOSITORY, first: 100) {
    repositoryCount } }' --jq '.data.search.repositoryCount'
```

**预期**：`1707`，即大于 1000。这证明"分页取完"不等于"覆盖全部"。

---

## V4. 四路召回必要性（对应 research.md R3、R9）

确认仅用 topic 会漏掉高星标主题。

```bash
# 该仓库 topics 为空，纯 topic 查询无法命中
gh api repos/LyraVoid/Shirone --jq '{stars: .stargazers_count, topics: .topics}'
```

**预期**：`{"stars": 452, "topics": []}`。

**推论验证**：在 `candidates.csv` 中搜索 `LyraVoid/Shirone`——**应能被找到**。
若报告未包含它，说明种子清单召回路径未真正执行。

```bash
grep -c 'LyraVoid/Shirone' specs/001-blog-framework-research/candidates.csv
```

**预期**：`>= 1`。

**同时验证 keyword 与 recent 两路**（缺任一即说明对应召回未执行）：

```bash
grep -c 'incluud/accessible-astro-starter' specs/001-blog-framework-research/candidates.csv
grep -c '0xdres/astro-devosfera' specs/001-blog-framework-research/candidates.csv
```

**预期**：两者均 `>= 1`。前者证明 keyword 路径跑了，后者证明 recent 路径跑了。

---

## V4b. 近 12 个月新增比例（对应 SC-004）

```bash
# created_at 为第 4 列；统计 2025-11-17 之后创建的比例
awk -F',' 'NR>1 {
  total++
  if ($4 > "2025-11-17") recent++
} END {
  printf "候选总数=%d 近12月新增=%d 比例=%.1f%%\n", total, recent, recent*100/total
  if (recent/total < 0.25) print "❌ 低于 25% 阈值"
}' specs/001-blog-framework-research/candidates.csv
```

**预期**：比例 ≥ 25%，无 `❌`。

**失败含义**：若比例不足，通常是 `recent` 召回路径（T015）未执行，
而非纳入条件过严。**不得**通过放宽条件凑数。

---

## V4c. 最近发版时间正确性（对应 FR-008）

```bash
# latest_release_at 为第 6 列；确认不是用 pushed_at（第 5 列）冒充
awk -F',' 'NR>1 && $6 != "" && $6 == $5 { print "❌ 发版时间等于提交时间: " $1 }' \
  specs/001-blog-framework-research/candidates.csv | head
echo "无发行版候选数: $(awk -F',' 'NR>1 && $6 == "" { n++ } END { print n+0 }' \
  specs/001-blog-framework-research/candidates.csv)"
```

**预期**：无 `❌` 输出；无发行版候选数应在报告中有对应说明。

---

## V5. 能力判定覆盖率（对应 SC-005）

```bash
# 校验列数与能力列非空（30 列，能力列位于第 19–26 列）
awk -F',' 'NR>1 {
  if (NF != 30) print "❌ 列数错误(" NF "): " $1
  for (i=19; i<=26; i++) if ($i == "") print "❌ 能力列空缺(" i "): " $1
}' specs/001-blog-framework-research/candidates.csv | head
echo "候选数: $(( $(wc -l < specs/001-blog-framework-research/candidates.csv) - 1 ))"
```

**预期**：无 `❌` 输出；候选数 ≥ 12。

**人工抽检**：随机取 3 个候选，核对其八项能力是否都有
`carry_over` / `adapt` / `rebuild` / `conflict` 之一，且无空缺。

---

## V6. 视觉证据可复核性（对应 SC-006 与 FR-011）

这是最容易造假的一处，必须实际打开验证。

```bash
# 从报告中任取一个 demo_observable 断言与对应 URL
grep -oE 'https://[^ )]+' specs/001-blog-framework-research/research-report.md | head -5
```

对每个 URL：

1. 在浏览器打开，确认站点可访问。
2. 核对报告中描述的特征（如"标题字号约为正文的 2.5 倍"）是否肉眼可验证。
3. 若报告声称"截图显示"，**即为不合格**：

```bash
grep -nE '截图(显示|可见|中)' specs/001-blog-framework-research/research-report.md \
  && echo "❌ 出现截图断言" || echo "✓ 无截图断言"
```

**预期**：`✓ 无截图断言`。

---

## V7. 风格分档完整性（对应 SC-007）

```bash
# 从 CSV 统计各风格档的候选数（style_bucket 为第 8 列）
awk -F',' 'NR>1 { print $8 }' specs/001-blog-framework-research/candidates.csv \
  | sort | uniq -c | sort -rn
```

**预期**：档数 ≥ 4，且每档计数 ≥ 1。

**人工核对**：确认存在 `other` 档或说明其为空的原因——用于证明没有因风格偏好预筛淘汰。

---

## V8. 来源可追溯（对应 SC-006）

抽查 10 条关键结论：

```bash
# 统计报告中带证据索引的结论数
grep -c 'claim_id' specs/001-blog-framework-research/research-report.md
```

**预期**：≥ 10。

**人工核对**：
1. 任意取 10 条结论，逐条点开其 `url`。
2. 记录无法访问的条数。
3. 无法访问数应为 `0`；若 > 0，需确认是否已作为"时效性限制"标注。

---

## V9. 交付边界（对应 SC-011）

```bash
# 应用代码零改动
git status --short src/ package.json package-lock.json astro.config.ts \
  astro-paper.config.ts .github/ tsconfig.json
```

**预期**：无输出。

```bash
# 未安装/移除依赖
git diff --stat package.json package-lock.json
```

**预期**：无输出。

---

## V10. 移植路线可验收性（对应 SC-008，仅当有顾问性推荐）

对报告推荐的每个主题核对：

```bash
# 统计每个推荐主题的移植阶段数
grep -cE '^### S[0-9]' specs/001-blog-framework-research/research-report.md
```

**预期**：每个推荐主题 ≥ 3 个阶段。

**人工核对**：每个阶段是否都写了：
- 产出物（`deliverable`）
- 验证方式（`validation`）
- 回退方式（`rollback`），且回退指向"现有站点仍可发布"的节点

---

## V11. 时效性标注（对应 FR-020）

```bash
grep -nE '2026-11-17|时效|截止' specs/001-blog-framework-research/research-report.md | head
```

**预期**：存在明确的调研截止日期段落，并指出哪些结论在截止日期后可能失效
（至少覆盖：星标数、`pushed_at`、框架大版本）。

---

## 判定汇总表

| 检查项 | 对应 SC | 通过判据 |
|--------|---------|----------|
| V0 前置 | SC-011, SC-012 | 交付物齐全、无图像、无越界改动 |
| V1 查询复现 | SC-010 | 3 条查询可执行且计数一致 |
| V2 分桶闭合 | SC-003 | `Σ桶 == 无条件` |
| V3 上限真实性 | SC-003 | REST 422 / GraphQL 计数 >1000 |
| V4 四路召回 | SC-002, SC-003 | Shirone、accessible-astro-starter、astro-devosfera 均在 CSV 中 |
| V4b 新增比例 | SC-004 | 近 12 月新增 ≥ 25% |
| V4c 发版时间 | FR-008 | 无 `latest_release_at == pushed_at` 冒充 |
| V5 能力覆盖 | SC-005 | 无缺列、候选数 ≥ 12 |
| V6 视觉可复核 | SC-006 | 无截图断言、URL 可开 |
| V7 风格分档 | SC-007 | 档数 ≥ 4 且每档 ≥1 |
| V8 来源可追溯 | SC-006 | 抽样缺失数 0 |
| V9 交付边界 | SC-011 | 应用代码零改动 |
| V10 移植路线 | SC-008 | 每推荐主题 ≥3 阶段且有回退 |
| V11 时效性 | FR-020 | 截止日期与失效提示存在 |

**全部通过即视为调研可信；V2、V4b 与 V6 为不可妥协项。**

---

## 常见失败与处理

| 现象 | 原因 | 处理 |
|------|------|------|
| V2 不闭合 | 某桶 >1000 被截断 | 细分该桶（叠加 `created:` 二级键）重查 |
| V4 找不到 Shirone | 只跑了 topic 路径 | 补跑种子清单召回（T014） |
| V4 找不到 astro-devosfera | recent 路径未执行 | 补跑时间窗召回（T015） |
| V4b 比例不足 25% | recent 召回失效 | 补跑 T015，**勿放宽纳入条件凑数** |
| V4c 发版时间异常 | 用 `pushed_at` 冒充 `latest_release_at` | 回退重取 `latestRelease` |
| V6 出现截图断言 | 违反 FR-011 | 改为"演示站可观察 + URL"，或删除该结论 |
| V5 能力列缺失 | 判定证据不足被跳过 | 补标"证据不足"而非留空 |
| V1 查询 422 | 使用了仅限定符的查询 | 加关键词或细化桶 |
| 候选数 < 12 | 纳入条件过严或召回不足 | 先查召回覆盖，勿先放宽条件 |