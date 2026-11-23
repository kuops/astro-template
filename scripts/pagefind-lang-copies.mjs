/**
 * Pagefind 多语言索引副本：在 `pagefind --site dist` 之后运行。
 *
 * Pagefind 的 mergeIndex 会跳过与主索引"同路径"的索引（worker 侧 basePath
 * 归一化后比较），因此无法用同一 /pagefind/ 路径合并第二种语言。
 * 这里为每种语言复制一份完整索引到 /pagefind/<lang>/，使前端可以用
 * 互不相同的路径 mergeIndex，实现"任一语言 query 命中两种语言内容"。
 */
import { cp, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const site = process.argv[2] ?? "dist";
const pfDir = path.join(site, "pagefind");
const entry = JSON.parse(
  await readFile(path.join(pfDir, "pagefind-entry.json"), "utf8")
);
const langs = Object.keys(entry.languages ?? {});

// 逐条目复制（fs.cp 不允许 dest 位于 src 内部），跳过语言副本目录
const entries = (await readdir(pfDir, { withFileTypes: true })).filter(
  e => !langs.includes(e.name)
);

for (const lang of langs) {
  const dest = path.join(pfDir, lang);
  await mkdir(dest, { recursive: true });
  for (const e of entries) {
    await cp(path.join(pfDir, e.name), path.join(dest, e.name), {
      recursive: true,
    });
  }
  console.warn(`pagefind-lang-copies: emitted /pagefind/${lang}/`);
}