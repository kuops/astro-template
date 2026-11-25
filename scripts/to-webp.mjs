/**
 * 把一张图片转成 WebP，放进 src/assets/images/。换全站背景图时用它：
 *
 *   npm run webp -- 新图.png site-background-light
 *
 * 第一个参数是原图路径；第二个参数可选，是不带扩展名的输出文件名，省略时沿用原文件名。
 * 超过 2560 宽的图会等比缩到 2560（背景图最大只生成到这一档），小图不放大。
 * 质量保持 100（等同无损），不在这里压：访客下载的版本是构建时按
 * site.background.quality 压出来的，压缩只做那一次。
 * 转完在 astro-template.config.ts 里 import 这个文件即可；沿用原文件名时配置不用改。
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const MAX_WIDTH = 2560;
// 质量保持 100（仍然是有损编码，但等同无损）：这里产出的是进仓库的源图，访客下载的
// 那几档是构建时从它压出来的，质量见 astro-template.config.ts 的 site.background.quality。
// 这一步如果先压一次，构建时就是从已经压过的图再压，等于压了两遍。
// 不用完全无损是因为体积会是现在的四倍左右
const QUALITY = 100;
const OUT_DIR = "src/assets/images";

const args = process.argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  console.warn(
    "用法：npm run webp -- <原图路径> [输出文件名（不含扩展名）]"
  );
  process.exit(args.length ? 0 : 1);
}

const input = path.resolve(args[0]);
const name = path.basename(args[1] ?? path.parse(args[0]).name);
const output = path.resolve(OUT_DIR, `${name}.webp`);
const show = file => path.relative(process.cwd(), file);

try {
  await mkdir(path.dirname(output), { recursive: true });
  const image = sharp(input);
  const meta = await image.metadata();
  if (!meta.width) throw new Error("读不出图片尺寸");
  const result = await image
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(output);
  console.warn(
    `to-webp: ${show(input)} (${meta.width}x${meta.height}) → ${show(output)} (${result.width}x${result.height}, ${(result.size / 1024).toFixed(0)}KB)`
  );
} catch (error) {
  console.error(`to-webp: 转换失败 (${error.message})`);
  process.exit(1);
}
