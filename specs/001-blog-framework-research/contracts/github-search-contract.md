# 契约：GitHub 检索执行契约

**用途**：定义检索阶段必须遵守的调用契约，使"候选池无上限"在 1000 条结果上限与 30 次/分钟
限流下可执行、可复现、可审计。

**依据**：`research.md` R1（1000 条硬上限）、R2（分桶闭合校验）、R3（四路召回）、
R6（限流）、R9（近期新增召回缺口）。

---

## C1. 查询式契约

### C1.1 查询式构造规则

每条查询式必须由以下片段按固定顺序拼接，避免因顺序不同产生不同结果集：

```text
<keywords?> <topic:... | in:name | in:description> archived:false pushed:>2025-11-17 <stars:bucket?>
```

**规则**：

| 编号 | 规则 | 理由 |
|------|------|------|
| C1.1.1 | `archived:false` 必须出现在所有查询中 | 排除归档项目（`LyraVoid/Mizuki` 1888 星已归档） |
| C1.1.2 | `pushed:>2025-11-17` 必须出现在所有查询中 | 落实 spec FR-007 的 12 个月活跃门槛 |
| C1.1.3 | `in:readme` 禁止使用 | 实测命中 36065 条，噪声不可控（R4） |
| C1.1.4 | 纯限定符组合（无关键词）非法 | GitHub 返回 422：`The search contains only logical operators` |
| C1.1.5 | 星标桶必须互斥且完备 | 保证 `Σ(桶) == 全量`（R2） |

### C1.2 合法查询示例

```text
# topic 路径
topic:astro-theme archived:false pushed:>2025-11-17 stars:0..1
topic:hugo-theme archived:false pushed:>2025-11-17 stars:501..1000

# 关键词路径
astro blog theme in:description archived:false pushed:>2025-11-17
hugo theme blog in:name archived:false pushed:>2025-11-17

# 非法：无关键词，只有限定符
topic:astro-theme OR topic:astro-blog archived:false        # => 422
```

### C1.3 星标分桶定义

固定桶序（细分至每桶 < 1000）：

```text
0..1   2..2   3..5   6..10   11..50   51..100   101..500   501..1000   >=1001
```

**细分触发条件**：任一桶 `total_count > 1000` 时，必须将该桶对半或按实测分布细分后重查，
并记录子桶。

**实测参考**（`topic:hugo-theme`，`archived:false`）：

| 桶 | 计数 |
|----|------|
| `0..1` | 333 |
| `2..2` | 53 |
| `3..5` | 42 |
| `6..10` | 41 |
| `11..50` | 68 |
| `51..100` | 36 |
| `101..500` | 81 |
| `501..1000` | 23 |
| `>=1001` | 19 |
| **合计** | **696** |

### C1.4 四路召回清单

| family | 覆盖目标 | 最少查询组数 |
|--------|----------|--------------|
| `topic` | 明确打 topic 的主题 | 6 个 topic × 9 桶 |
| `keyword` | 未打 topic 但有描述的项目 | 4 组关键词 |
| `seed` | 连关键词都描述不清的项目 | 2 个 awesome 清单 |
| `recent` | 近期新增的高增长项目 | 4 个 `created:` 时间窗 × 星标桶 |

**不可省略任一路径**：

- 缺 `topic`：失去精度，候选池充斥非主题类仓库。
- 缺 `keyword`：漏掉 `incluud/accessible-astro-starter`（1194 星，无 `astro-theme` topic）。
- 缺 `seed`：漏掉 `LyraVoid/Shirone`（452 星，topics 为空）。
- 缺 `recent`：漏掉 `0xdres/astro-devosfera`（189 星，2026-02 创建）等新项目，
  且 SC-004 的"25% 新近"无法达成。

### C1.5 `recent` 路径的时间分桶

`created:` 时间窗（均附 `archived:false pushed:>2025-11-17`）：

```text
created:>2026-09-01
created:2026-06-01..2026-09-01
created:2026-01-01..2026-06-01
created:2025-11-17..2026-01-01
```

**叠加星标桶**：每个时间窗内仍需按 C1.3 的星标桶细分，因为新项目在低星标桶内高度集中。
实测 `topic:astro-theme created:>2026-09-01` 已有 101 条，若不叠加星标约束，
在其他 topic 下会超过 1000 条。

---

## C2. 调用契约

### C2.1 端点选择

| 用途 | 端点 | 限流池 |
|------|------|--------|
| 计数验证 | REST `GET /search/repositories?per_page=1` | `search`：30/min |
| 批量取字段 | GraphQL `search(type: REPOSITORY)` | `graphql`：5000 pts/h |
| 单仓库补全 | REST `GET /repos/{owner}/{repo}` | `core`：5000/h |
| 演示可达性 | `curl` 直连 | 不消耗 GitHub 配额 |

**决定**：列表与详情阶段统一用 GraphQL 单请求取全字段，避免 REST 的 6~8 次额外调用。

### C2.2 请求节奏

```text
最小间隔：2500ms（30/min 限流下的安全值）
重试策略：403 时读取 X-RateLimit-Reset，等待至 reset 后重试，最多 3 次
并发度：搜索类请求串行；curl 探测可并发 8
```

### C2.3 分页契约

| 端点 | 单页上限 | 总上限 | 超限行为 |
|------|----------|--------|----------|
| REST | `per_page=100` | **1000** | 第 11 页返回 422 |
| GraphQL | `first=100` | **1000** | `hasNextPage=false` 静默截断 |

**关键约束（C2.3.1）**：分页结束 **不等于** 结果取完。必须同时检查：

```text
取回条数 == repositoryCount（或 total_count）
```

不等即为截断，必须细化分桶后重查。GraphQL 路径下此检查是唯一防线，因为不报错。

### C2.4 断点续跑

所有中间结果以 NDJSON 追加落盘：

```text
./_research_cache/queries.ndjson     # 每条查询式及其计数
./_research_cache/hits.ndjson        # 每条命中记录，以 repo_id 去重
./_research_cache/probes.ndjson      # 演示可达性探测结果
./_research_cache/state.json         # 已完成的分桶，用于跳过
```

**理由**：250 次量级请求在限流下需 10 分钟以上，中断后必须可续，否则不可执行。

---

## C3. 覆盖闭合校验契约

### C3.1 必需校验

报告必须能回答以下三个等式，任一不成立即视为覆盖率未验证：

```text
(1) Σ(每个分桶 hit_count_effective) == 该 topic 的无条件 total_count
(2) Σ(各 family 去重后命中) >= 任一单 family 命中
(3) |distinct Hit| == |Candidate| + |ExcludedItem|
```

### C3.2 校验失败处理

| 失败项 | 含义 | 处理 |
|--------|------|------|
| (1) 不成立 | 某桶被截断 | 细分该桶后重查，直至成立 |
| (2) 不成立 | 去重逻辑有误 | 检查 `repo_id` 归一化（大小写、尾斜杠） |
| (3) 不成立 | 有命中既未纳入也未记录排除 | 补齐 `ExcludedItem`，禁止静默丢弃 |
| (4) `recent` 路径未执行 | SC-004 无法验证 | 补跑 C1.5 的时间分桶召回 |
| (5) `latest_release_at` 用 `pushed_at` 填充 | FR-008 数据失真 | 回退重取 `latestRelease`，无发行版记 null |

### C3.1.1 新增覆盖校验（对应 SC-004）

报告必须额外给出：

```text
created_within_12m = 候选池中 created_at > 2025-11-17 的数量
ratio = created_within_12m / |Candidate|  (要求 >= 0.25)
```

### C3.3 校验记录格式

报告中必须原文给出：

```text
topic:astro-theme  分桶合计 222 / 无条件 222  ✓
topic:hugo-theme   分桶合计 696 / 无条件 696  ✓
|distinct Hit| = 1180, |Candidate| = 412, |ExcludedItem| = 768  ✓
```

---

## C4. 演示可达性探测契约

### C4.1 地址解析优先级

```text
1. repository.homepageUrl（GraphQL 字段）
2. README 中第一个非 github.com 的 http(s) 链接
3. 标记 no_demo
```

### C4.2 探测规格

```text
方法：HEAD 失败则降级 GET
超时：12 秒
重定向：跟随，最多 5 跳
UA：Mozilla/5.0 (compatible; ThemeResearch/1.0)
记录：最终 URL、HTTP 状态码、耗时
```

### C4.3 状态归类

| HTTP | `demo_status` | 说明 |
|------|---------------|------|
| 200 | `reachable` | 且最终 URL 非购买页 |
| 402 / 429 | `unreachable` | **必须注明平台侧限制**，如 Vercel 402 |
| 404 / 410 | `unreachable` | 站点已下线 |
| 超时 / DNS 失败 | `unreachable` | 记录具体错误 |
| 指向 `themefisher.com/products/*` 等 | `product_page_only` | 非可浏览主题站 |
| 无链接 | `no_demo` | — |

**实测基线**（`topic:astro-theme`，前 30 个候选）：29 个 `reachable`，1 个 `unreachable`
（402 平台限制）。可达率 97%。

---

## C5. 报告产出契约

### C5.1 必需产出文件

```text
specs/001-blog-framework-research/
├── research-report.md     # 主报告，中文
├── candidates.csv         # 机器可读附表
├── queries.md             # 全部查询式与命中数
└── （既有）research.md, data-model.md, plan.md, spec.md
```

### C5.2 禁止产出

| 禁止项 | 依据 |
|--------|------|
| 任何 `.png` / `.jpg` / `.webp` / 缩略图 | spec FR-009 |
| 对 `src/`、`package.json`、`astro*.ts` 的修改 | spec FR-025 |
| 依赖安装或移除 | spec FR-025 |
| `.github/workflows/` 改动 | spec FR-025 |

### C5.3 报告章节契约

顺序固定，缺一即不符合 spec：

```text
1. 结论摘要（顾问性推荐，非决定）
2. 检索方法与覆盖核算（含 C3 三个等式）
3. 候选池总览（按 style_bucket 分档）
4. 候选详情（每候选：元数据 + 七维视觉 + 八项能力）
5. 未纳入清单（按 reason_code 分组）
6. 顾问性推荐与移植路线（仅推荐主题）
7. 时效性与复核提示
8. 证据索引
```

### C5.4 措辞契约

| 禁止 | 替代 |
|------|------|
| "截图显示…" | "演示站可观察：…"（附 URL 与访问日期） |
| "生态较小，故排除" | 具体缺失能力或 `< 阈值` 的可测事实 |
| "推荐使用 X" | "顾问性建议：X，理由…；最终由维护者决定" |
| "性能很好" | 引用具体来源，或删除该断言 |

---

## C6. 失败模式与契约响应

| 失败模式 | 契约响应 |
|----------|----------|
| 搜索限流 403 | 读 `reset` 等待重试；不降级为"部分覆盖" |
| GraphQL 静默截断 | 依 C2.3.1 校验，不等则分桶 |
| 演示站全面不可达 | 仍保留候选，标 `unreachable`；报告说明"视觉判断依据源码" |
| README 无演示链接 | 标 `no_demo`，不臆测 URL |
| 某 topic 桶细分后仍 >1000 | 叠加 `created:` 时间分桶作为二级键 |
| 报告结论与证据冲突 | 以证据为准，修正结论并记录修正 |