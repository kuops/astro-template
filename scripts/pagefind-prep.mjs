/**
 * Pagefind 预处理：在 `astro build` 之后、`pagefind --site dist` 之前运行。
 *
 * 给脚注区的 sr-only 伪标题（remark-gfm 自动生成的
 * `<h2 class="sr-only" id="footnote-label">Footnotes</h2>`）标记
 * data-pagefind-ignore。这个标题视觉不可见（sr-only 仅服务于屏幕阅读器），
 * 若不排除，Pagefind 会按标题分段把它当作搜索子条目（「# Footnotes」）
 * 展示并挤占子条目名额。只忽略标题本身：脚注内容仍被索引，并入其前
 * 最近的真标题段。
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TARGET = /<h2 class="sr-only" id="footnote-label">/;
const REPLACEMENT = '<h2 class="sr-only" id="footnote-label" data-pagefind-ignore>';

let count = 0;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(p);
    } else if (entry.name.endsWith(".html")) {
      const html = await readFile(p, "utf8");
      if (TARGET.test(html)) {
        await writeFile(p, html.replace(TARGET, REPLACEMENT));
        count++;
      }
    }
  }
}

await walk(process.argv[2] ?? "dist");
console.warn(`pagefind-prep: excluded footnote-label headings on ${count} page(s)`);
