/**
 * 把一张图片做成 README 顶部的预览图：裁圆角，加上和 macOS 窗口截图一样的阴影，
 * 输出到 .github/preview.webp。换预览图时用它：
 *
 *   npm run readme-preview -- 新图.png
 *
 * 阴影不是「一块黑底加模糊」近似出来的，那种做法四边是对称的。它照着真实 macOS 窗口截图
 * 逐像素量出来的曲线生成（见下面的 CURVES）：下方最强、拖得最远，左右居中，
 * 上方很弱；颜色是纯黑，但紧贴窗口处下方也只有约三分之一不透明度。
 * 每个像素按它到窗口边缘的距离和方向查这三条曲线，角落按角度在两者之间取混合。
 *
 * 图片内容固定 1280 宽，README 里按 752 显示，正好是两倍，所以曲线里的 Retina 像素
 * 可以直接用。四周的留白和阴影都画在透明背景上，深色、浅色模式下都正常。
 */
import sharp from "sharp";
import path from "node:path";

const WIDTH = 1280;
// 窗口圆角，约 10 个显示像素
const RADIUS = 20;
const QUALITY = 88;
const OUTPUT = ".github/preview.webp";

// 截图四周的留白（Retina 像素，即 0.5 个显示像素）
const MARGIN = { top: 76, bottom: 148, left: 112, right: 112 };
// 阴影曲线：0~255 的不透明度，下标 k 对应离窗口边缘 k+1 个像素。
// 逐像素量自两张真实的 macOS 窗口截图：rxhanson/Rectangle 和 coteditor/CotEditor 的 README 首图。
// 两张图来自不同项目、窗口大小也不同，曲线逐像素一致
const CURVES = {
  // 上方
  up: [
    24, 24, 17, 16, 16, 15, 15, 14, 14, 14, 12, 12, 12, 10, 10, 10, 10, 8, 9, 8,
    8, 7, 8, 7, 6, 6, 6, 6, 6, 5, 5, 4, 4, 4, 4, 4, 4, 3, 4, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 1, 2, 2, 2, 0, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
  ],
  // 左右
  side: [
    55, 55, 48, 48, 46, 46, 44, 44, 42, 42, 40, 40, 38, 38, 36, 36, 35, 34, 32,
    32, 31, 30, 29, 28, 28, 27, 26, 25, 24, 24, 22, 22, 21, 21, 20, 19, 18, 18,
    16, 16, 16, 15, 14, 14, 14, 13, 12, 12, 12, 10, 10, 10, 9, 9, 8, 8, 8, 8, 7,
    7, 6, 6, 6, 6, 5, 6, 4, 4, 4, 4, 3, 4, 3, 3, 4, 3, 2, 3, 2, 2, 2, 2, 2, 2,
    1, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0,
  ],
  // 下方
  down: [
    86, 86, 81, 81, 80, 80, 78, 78, 76, 76, 76, 74, 73, 73, 72, 71, 70, 69, 68,
    68, 66, 66, 64, 64, 62, 62, 60, 60, 58, 58, 56, 56, 55, 54, 52, 52, 50, 50,
    48, 48, 46, 46, 44, 44, 42, 42, 40, 39, 39, 38, 36, 36, 35, 34, 32, 32, 30,
    30, 29, 29, 27, 27, 26, 25, 24, 24, 22, 23, 21, 20, 20, 18, 18, 18, 17, 16,
    16, 15, 14, 14, 14, 13, 12, 12, 11, 11, 10, 10, 10, 9, 8, 9, 8, 8, 6, 7, 6,
    6, 6, 6, 5, 5, 5, 4, 4, 4, 4, 4, 3, 4, 3, 3, 3, 2, 2, 3, 2, 2, 2, 2, 2, 2,
    1, 2, 1, 1, 0, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0,
  ],
};

/** 曲线下标 k 对应「离窗口边缘 k+1 个像素」的位置；距离不是整数时线性插值 */
const shade = (curve, distance) => {
  const at = k => curve[Math.min(Math.max(k, 1), curve.length) - 1];
  const i = Math.floor(distance);
  const t = distance - i;
  return at(i) * (1 - t) + at(i + 1) * t;
};

const args = process.argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  console.warn("用法：npm run readme-preview -- <原图路径>");
  process.exit(args.length ? 0 : 1);
}

const input = path.resolve(args[0]);
const output = path.resolve(OUTPUT);
const show = file => path.relative(process.cwd(), file);

try {
  const image = await sharp(input).resize({ width: WIDTH }).toBuffer({
    resolveWithObject: true,
  });
  const w = image.info.width;
  const h = image.info.height;
  // 窗口矩形（像素坐标，右、下边不含）放在画布的 (left, top) 处
  const L = MARGIN.left;
  const X0 = L;
  const X1 = L + w;
  const Y0 = MARGIN.top;
  const Y1 = MARGIN.top + h;
  const canvasW = w + L + MARGIN.right;
  const canvasH = h + MARGIN.top + MARGIN.bottom;

  // 阴影层：纯黑，只有透明度在变
  const shadow = Buffer.alloc(canvasW * canvasH * 4);
  for (let y = 0; y < canvasH; y++) {
    for (let x = 0; x < canvasW; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      // 到圆角矩形的距离：先对内缩 RADIUS 的矩形算，再把半径加回来
      const qx = Math.max(X0 + RADIUS - px, px - (X1 - RADIUS), 0);
      const qTop = Math.max(Y0 + RADIUS - py, 0);
      const qBottom = Math.max(py - (Y1 - RADIUS), 0);
      const qy = qTop + qBottom;
      const q = Math.hypot(qx, qy);
      if (q === 0) continue;
      const distance = q - RADIUS;
      if (distance < 1) continue;
      // 离上下边近就按上下边的曲线，离左右边近就按左右边的曲线，按方向比例混合
      const alpha =
        shade(CURVES.side, distance) * (qx / q) +
        shade(qTop > 0 ? CURVES.up : CURVES.down, distance) * (qy / q);
      shadow[(y * canvasW + x) * 4 + 3] = Math.round(
        Math.min(Math.max(alpha, 0), 255)
      );
    }
  }
  const mask = Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/></svg>`
  );
  const rounded = await sharp(image.data)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const result = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: shadow,
        raw: { width: canvasW, height: canvasH, channels: 4 },
      },
      { input: rounded, left: L, top: MARGIN.top },
    ])
    .webp({ quality: QUALITY })
    .toFile(output);
  console.warn(
    `to-preview: ${show(input)} → ${show(output)} (${result.width}x${result.height}, 图片内容 ${w}x${h}, ${(result.size / 1024).toFixed(0)}KB)`
  );
} catch (error) {
  console.error(`to-preview: 生成失败 (${error.message})`);
  process.exit(1);
}
