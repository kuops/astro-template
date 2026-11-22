# Quickstart: Sätteri 迁移验证指南

**特性**: [spec.md](./spec.md) | **契约**: [contracts/markdown-pipeline-contract.md](./contracts/markdown-pipeline-contract.md)

从零验证本次迁移的完整流程。V0 MUST 在任何代码改动之前执行（基线不可后补）。

## 前置条件

```bash
node -v   # v24.21.0+（满足全部 engines）
npm -v    # 11.x
npm install
```

## V0 基线采集（切换前，仅一次）

```bash
npm run build   # 记录总耗时（time npm run build 更佳）
mkdir -p _migration_baseline
# 提取 6 个基线页产物（路径以 dist 实际输出为准）：
#   zh: markdown-tips、test-markdown-enhanced、test-markdown-rendering、
#       books/getting-started/markdown-test、mdx-test；en: en/mdx-test
cp dist/blog/markdown-tips/index.html _migration_baseline/ 2>/dev/null || true
# （其余 5 页同理；pagefind 统计自 build 输出抄录进 baseline.txt）
echo "words=2908 pages=32 langs=2" > _migration_baseline/pagefind.txt
```

**预期**：`_migration_baseline/` 含 6 页 HTML + pagefind 统计 + 构建耗时。
**失败响应**：基线缺失则回归验收（V3–V8）无效，禁止进入后续阶段。

## V1 依赖契约

```bash
node -e "const p=require('./package.json'); const need=['@astrojs/markdown-satteri','satteri-callouts']; const gone=['@astrojs/markdown-remark','remark-toc','remark-collapse','remark-supersub','remark-gfm','remark-mark-highlight','rehype-callouts']; for(const n of need) if(!p.dependencies[n]) throw new Error('缺失 '+n); for(const n of gone) if(p.dependencies[n]||p.devDependencies?.[n]) throw new Error('未移除 '+n); console.log('V1 ✓')"
```

## V2 配置契约

```bash
grep -cE 'unified|remarkPlugins|rehypePlugins' astro.config.ts   # 预期 0
grep -c 'satteri(' astro.config.ts                               # 预期 ≥1
```

## V3 语法渲染自测（插件级，直调 satteri API）

对每个重写插件，用 node 脚本直接编译样例并断言（示例）：

```bash
node --input-type=module -e "
import { markdownToHtml } from 'satteri';
import { satteriMermaidBlock } from './src/utils/satteriMermaidBlock.ts'; // 按实际导出
const { html } = markdownToHtml('\`\`\`mermaid\ngraph TD; A-->B;\n\`\`\`',
  { hastPlugins: [satteriMermaidBlock] });
if (!html.includes('mermaid-block') || !html.includes('--mermaid-lines:2')) throw new Error(html);
console.log('V3-mermaid ✓');
"
```

同法覆盖：上下标（`<sup>/<sub>`）、mark（`<mark>`）、行号（`--code-lines`）、
图片尺寸（query/path 两源）、callouts（DOM 对照基线）。

## V4 代码上下文保护（C1.4 硬验收）

```bash
node --input-type=module -e "
import { markdownToHtml } from 'satteri';
/* 用全部新插件编译含以下内容的样例，断言原样输出 */
const md = '\`a == b ^ c ~ d\`\n\n\`\`\`txt\nx == y ^ z ~ w\n\`\`\`';
/* ...断言输出中 == ^ ~ 均为纯文本，无 mark/sup/sub 标签... */"
```

**预期**：inline code 与 fenced code 内特殊字符零转换。

## V5 渲染回归对比（页面级）

```bash
npm run build
# 逐页对比基线（关键片段抽取后 diff）：
for f in _migration_baseline/*.html; do
  # 抽取 sup/sub/mark/del/callouts/mermaid-block/--code-lines/img width 的片段并对比
  : # 具体抽取命令由 tasks 阶段脚本化
done
```

**预期**：6 页 × 8 场景全部一致（data-model 恒等式 1）。**失败响应**：定位到插件回 Stage B
修复，禁止合入。

## V6 mermaid 客户端契约

```bash
grep -c 'mermaid-block' dist/blog/<含mermaid页>/index.html       # ≥1
grep -c 'data-mermaid-key' 同页                                   # 与源块数一致
```

浏览器打开该页：骨架占位出现 → mermaid 图渲染 → 骨架消失（C4 完整链路）。

## V7 MDX 双语

浏览器（或 HTML 对比）验证 `mdx-test`（zh）与 `en/mdx-test` 两页与基线一致（C1.8）。

## V8 三道门禁 + 产物完整性

```bash
npm run lint && npm run format:check && time npm run build
```

**预期**：全过；build 输出的 pagefind 统计满足 data-model 恒等式 2（页数/语言/页面数相等，
词数差 ≤2）；耗时满足恒等式 3（不劣于基线）。

## V9 残留清查与收尾

```bash
grep -rnE '@astrojs/markdown-remark|remark-toc|remark-collapse|remark-supersub|remark-mark-highlight|rehype-callouts|remark-gfm' src/ astro.config.ts package.json | grep -v specs/   # 预期空
git status   # 变更面：astro.config.ts、src/utils/*、package.json、package-lock.json、
             # test-markdown-enhanced.md、.gitignore（_migration_baseline/）、specs/
```

**收尾**：维护者确认回归通过后，删除 `_migration_baseline/` 与对应 `.gitignore` 条目。

## V0–V9 与验收标准映射

| 验证 | 对应 | 验证 | 对应 |
|------|------|------|------|
| V0 | SC-001/003/004 前提 | V5 | SC-001 |
| V1/V2 | SC-002、FR-001 | V6/V7 | SC-001、FR-011、宪法 III |
| V3/V4 | FR-002~007、C1.4 | V8 | SC-003/004、FR-010 |
| V9 | SC-002 收口 | — | — |
