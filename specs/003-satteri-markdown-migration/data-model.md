# Data Model: Sätteri 管线迁移

**特性**: [spec.md](./spec.md) | **日期**: 2026-11-21

> 本特性无运行时数据存储，实体为**迁移过程的核对与证据结构**，供 tasks 与验收使用。

## 实体

### 1. SyntaxFeatureMapping（语法特性映射项）

一条 unified 能力 → satteri 方案的映射及其验证状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 特性标识（如 `superscript`、`callouts`） |
| unified_source | string | 现方案（插件名 / 内建配置） |
| satteri_solution | enum | `builtin_feature` \| `ecosystem_package` \| `rewritten_plugin` \| `removed` |
| solution_ref | string | features 开关名 / 包名 / 新文件路径 / 移除说明 |
| scenario_refs | string[] | 对应的 US1 验收场景编号 |
| status | enum | `pending` \| `verified` \| `degraded`（降级需附报告说明） |

**固定枚举值（8 条，来自 spec US1 + FR）**：

| id | unified_source | satteri_solution | solution_ref | scenario_refs |
|----|----------------|------------------|--------------|---------------|
| superscript | remark-supersub | builtin_feature | `features.superscript: true` | US1/AC1 |
| subscript | remark-supersub | builtin_feature | `features.subscript: true` | US1/AC1 |
| gfm_set | remark-gfm(+singleTilde:false) | builtin_feature | `features.gfm: true`（混排已实测正确） | US1/AC3 |
| mark | remark-mark-highlight | ecosystem_package 或 rewritten_plugin | `@mirrordown/sat-mark` / `satteriMark.ts` | US1/AC2 |
| callouts | rehype-callouts | ecosystem_package | `satteri-callouts` | US1/AC4 |
| mermaid | rehypeMermaidBlock.ts | rewritten_plugin | `satteriMermaidBlock.ts` | US1/AC5 |
| code_lines | rehypeCodeLines | rewritten_plugin | `satteriMermaidBlock.ts` 内 | US1/AC6 |
| image_dims | rehypeImageDimensions.ts | rewritten_plugin | `satteriImageDimensions.ts` | US1/AC7 |
| inline_toc | remark-toc + remark-collapse | removed | 测试文件同步更新 | US1/AC8（组件层不受影响） |

**验证规则**: `status = verified` 当且仅当 scenario_refs 全部通过基线对比；
`degraded` MUST 附差异说明并经维护者确认。

### 2. RenderRegressionMatrix（渲染回归核对矩阵）

基线页 × 场景的核对点集合。

| 字段 | 类型 | 说明 |
|------|------|------|
| baseline_page | string | 6 个基线页之一（见下） |
| scenario | string | 8 个场景之一（US1/AC1–AC8） |
| baseline_artifact | string | `_migration_baseline/` 下的片段文件引用 |
| result | enum | `pass` \| `fail` \| `n_a`（该页不含此场景） |

**基线页固定清单（6 页）**:

1. `src/data/blog/markdown-tips.md`
2. `src/data/blog/test-markdown-enhanced.md`
3. `src/data/blog/test-markdown-rendering.md`
4. `src/data/books/getting-started/markdown-test.md`
5. `src/data/blog/mdx-test.mdx`
6. `src/data/blog/en/mdx-test.mdx`（宪法 III：英文 MDX 等价覆盖）

**恒等式 1**: `有效核对点数 = Σ(页 × 场景中 result != n_a 的项)`，全部 `pass` 是
SC-001 的判定依据；任一 `fail` 阻塞完成。

### 3. SatteriPluginArtifact（重写插件件）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | `satteriMermaidBlock` / `satteriCodeLines` / `satteriImageDimensions` / `satteriMark`（条件性） |
| file | string | `src/utils/` 下路径 |
| kind | enum | `hast` \| `mdast` |
| input_contract | string | 触发节点条件（引用 contracts C2） |
| output_contract | string | 变换结果（引用 contracts C1/C4） |
| self_test | string | node 自测脚本记录（quickstart V3） |

**验证规则**: 每插件 `self_test` MUST 通过后才能进入配置切换（plan Stage B 门禁）。

### 4. BuildBaseline（构建基线记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| phase | enum | `before` \| `after` |
| duration_s | number | `npm run build` 完整耗时（秒） |
| page_count | number | 产物 HTML 页数 |
| pagefind_langs | number | 索引语言数（预期 2） |
| pagefind_pages | number | 索引页面数 |
| pagefind_words | number | 索引词数 |
| notes | string | 环境与异常说明 |

**当前 before 基线（2026-11-21 实测，astro 7.4.13 + unified 管线）**:
pagefind 阶段 2.066s、2 语言、32 页、**2908 词**（注意：astro 7.2.4 时代为 2903 词，
升 mdx 8 后 +5 词，属已接受的既有差异，非本特性范围）；完整 build 耗时以 Stage A 采集值为准。

**恒等式 2（产物完整性，SC-003）**: `after.page_count == before.page_count` 且
`after.pagefind_langs == before.pagefind_langs` 且 `after.pagefind_pages == before.pagefind_pages`。
词数允差：`|after.pagefind_words - before.pagefind_words| <= 2`（分词边界微差可容忍，
超出即排查）。

**恒等式 3（耗时，SC-004）**: `after.duration_s <= before.duration_s`。

## 状态流转

```text
SyntaxFeatureMapping: pending → verified | degraded（degraded 需维护者确认）
RenderRegressionMatrix: (空) → pass|fail|n_a 逐项填写 → 全 pass 或回退修复
BuildBaseline: before(Stage A 采集) → after(Stage D 采集) → 恒等式判定
```
