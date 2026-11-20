# 检索凭证：全部查询式与命中数

**截止日期**：2026-11-17
**目的**：使检索过程可复制复现（对应 spec FR-003、SC-010）

## 一、执行环境

```text
GitHub CLI     : gh（已认证，账号 kuops）
search 限流     : 30 次/分钟
graphql 限流    : 5000 点/小时
code_search 限流: 10 次/小时（本次未使用）
```

## 二、分桶定义

固定 9 桶，逐字使用：

```text
0..1   2..2   3..5   6..10   11..50   51..100   101..500   501..1000   >=1001
```

**共用限定符**：`archived:false pushed:>2025-11-17`

## 三、分桶闭合校验（关键证据）

对每个 topic 比对"分桶求和"与"无条件计数"。相等才证明未截断。

| topic | 分桶合计 | 无条件 | 状态 |
|-------|----------|--------|------|
| `astro-theme` | 267 | 267 | ✓ CLOSED |
| `astro-blog` | 70 | 70 | ✓ CLOSED |
| `astro-template` | 206 | 206 | ✓ CLOSED |
| `hugo-theme` | 696 | 696 | ✓ CLOSED |
| `blog-theme` | 447 | 447 | ✓ CLOSED |
| `nextjs-blog` | 43 | 43 | ✓ CLOSED |

**逐桶明细**（`archived:false pushed:>2025-11-17`）：

### astro-theme（合计 267）

| 桶 | 计数 |
|----|------|
| 0..1 | 114 |
| 2..2 | 19 |
| 3..5 | 26 |
| 6..10 | 24 |
| 11..50 | 39 |
| 51..100 | 15 |
| 101..500 | 21 |
| 501..1000 | 2 |
| >=1001 | 7 |

### astro-blog（合计 70）

| 桶 | 计数 |
|----|------|
| 0..1 | 35 |
| 2..2 | 4 |
| 3..5 | 7 |
| 6..10 | 2 |
| 11..50 | 13 |
| 51..100 | 3 |
| 101..500 | 4 |
| 501..1000 | 0 |
| >=1001 | 2 |

### astro-template（合计 206）

| 桶 | 计数 |
|----|------|
| 0..1 | 83 |
| 2..2 | 14 |
| 3..5 | 18 |
| 6..10 | 15 |
| 11..50 | 34 |
| 51..100 | 16 |
| 101..500 | 19 |
| 501..1000 | 1 |
| >=1001 | 6 |

### hugo-theme（合计 696）

| 桶 | 计数 |
|----|------|
| 0..1 | 333 |
| 2..2 | 53 |
| 3..5 | 42 |
| 6..10 | 41 |
| 11..50 | 68 |
| 51..100 | 36 |
| 101..500 | 81 |
| 501..1000 | 23 |
| >=1001 | 19 |

### blog-theme（合计 447）

| 桶 | 计数 |
|----|------|
| 0..1 | 199 |
| 2..2 | 29 |
| 3..5 | 40 |
| 6..10 | 32 |
| 11..50 | 56 |
| 51..100 | 18 |
| 101..500 | 48 |
| 501..1000 | 12 |
| >=1001 | 13 |

### nextjs-blog（合计 43）

| 桶 | 计数 |
|----|------|
| 0..1 | 16 |
| 2..2 | 4 |
| 3..5 | 8 |
| 6..10 | 3 |
| 11..50 | 2 |
| 51..100 | 2 |
| 101..500 | 6 |
| 501..1000 | 2 |
| >=1001 | 0 |

## 四、五路召回查询式

### 路径 1：topic（6 topic × 9 桶）

```text
topic:astro-theme archived:false pushed:>2025-11-17 stars:<bucket>
topic:astro-blog archived:false pushed:>2025-11-17 stars:<bucket>
topic:astro-template archived:false pushed:>2025-11-17 stars:<bucket>
topic:hugo-theme archived:false pushed:>2025-11-17 stars:<bucket>
topic:blog-theme archived:false pushed:>2025-11-17 stars:<bucket>
topic:nextjs-blog archived:false pushed:>2025-11-17 stars:<bucket>
```

### 路径 2：keyword（5 条）

```text
astro blog theme in:description archived:false pushed:>2025-11-17
astro blog theme in:name archived:false pushed:>2025-11-17
hugo theme blog in:name archived:false pushed:>2025-11-17
nextjs blog theme in:name archived:false pushed:>2025-11-17
next.js blog template in:name archived:false pushed:>2025-11-17
```

**明确禁用**：`in:readme`（实测命中 36065 条，噪声不可控）

### 路径 3：seed（2 个 awesome 清单）

```text
来源：one-aalam/awesome-astro        → 61 个仓库引用
来源：theNewDynamic/awesome-hugo     → 49 个仓库引用
方法：解析 README，正则提取 github.com/{owner}/{repo}
```

### 路径 4：recent（4 时间窗 × 3 topic + 1 通用）

```text
topic:astro-theme  created:>2026-09-01                          archived:false pushed:>2025-11-17
topic:astro-theme  created:2026-06-01..2026-09-01               archived:false pushed:>2025-11-17
topic:astro-theme  created:2026-01-01..2026-06-01               archived:false pushed:>2025-11-17
topic:astro-theme  created:2025-11-17..2026-01-01               archived:false pushed:>2025-11-17
topic:hugo-theme   created:<同上 4 窗>                           archived:false pushed:>2025-11-17
topic:blog-theme   created:<同上 4 窗>                           archived:false pushed:>2025-11-17
astro blog theme   created:<同上 4 窗>                           archived:false pushed:>2025-11-17
```

### 路径 5：combo（4 组 × 9 桶）

```text
topic:astro topic:blog      archived:false pushed:>2025-11-17 stars:<bucket>
topic:astro topic:template  archived:false pushed:>2025-11-17 stars:<bucket>
topic:hugo topic:blog       archived:false pushed:>2025-11-17 stars:<bucket>
topic:nextjs topic:blog     archived:false pushed:>2025-11-17 stars:<bucket>
```

**此路径的由来**：`incluud/accessible-astro-starter`（1194★）的 topics 含 `blog` 与 `template`
但不含 `astro-theme`，且描述中不出现 "blog theme" 短语，仅靠前四路会漏掉。

## 五、判定性校验

这三个仓库是"某条召回路径是否真跑了"的证据：

| 仓库 | 星标 | 为何关键 | 命中的路径 | 状态 |
|------|------|----------|-----------|------|
| `LyraVoid/Shirone` | 452 | **topics 为空数组** | `keyword` + `recent` | ✓ |
| `incluud/accessible-astro-starter` | 1194 | 无 `astro-theme` topic | `combo` | ✓ |
| `0xdres/astro-devosfera` | 189 | 2026-02 新建，星标低被星标排序挤出 | `topic` + `keyword` + `recent` + `combo` | ✓ |

## 六、计数汇总

```text
原始命中（含重复）      7634
去重后唯一仓库          5792
纳入候选                2701
已排除                  3091
闭合校验：2701 + 3091 = 5792  ✓
```

## 七、复现方式

```bash
# 1. 分桶闭合校验
bash _research_cache/scripts/01-count.sh
cat _research_cache/scripts/closure-report.txt

# 2. 四路召回
bash _research_cache/scripts/03-recall-topic.sh
bash _research_cache/scripts/04-recall-other.sh
bash _research_cache/scripts/05b-seed-fix.sh
bash _research_cache/scripts/07-recall-combo.sh

# 3. 合并与校验
bash _research_cache/scripts/06-merge.sh

# 4. 纳入筛选
python3 _research_cache/scripts/08-filter.py

# 5. 演示探测与设计特征
python3 _research_cache/scripts/09-probe.py
python3 _research_cache/scripts/12-design-features.py

# 6. 生成 CSV
python3 _research_cache/scripts/14-final-csv.py
```

## 八、已知限制

| 限制 | 影响 | 说明 |
|------|------|------|
| GitHub 搜索上限 1000 条 | 若某桶仍 >1000 会被截断 | 本次 6 个 topic 全部闭合，未触发 |
| `code_search` 限流 10 次/小时 | 无法批量扫描仓库内 CSS | 改用演示站 HTML/CSS 抓取替代 |
| 演示站 11% 不可达 | 该部分无法做视觉判定 | 已标注 `unreachable`，候选保留 |
| 视觉评分基于 CSS 静态特征 | 无法判断实际渲染效果 | 需维护者打开 `demo_url` 亲自评审 |
| 星标与时间戳为快照 | 截止日期后失效 | 见报告第 7 章 |