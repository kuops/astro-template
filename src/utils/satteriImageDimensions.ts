import { defineHastPlugin } from "satteri";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

function getPositiveInteger(value: string | null): number | undefined {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

function getImageDimensions(src: string) {
  try {
    const url = new URL(src, "https://example.invalid");
    const queryWidth = getPositiveInteger(url.searchParams.get("w"));
    const queryHeight = getPositiveInteger(url.searchParams.get("h"));

    if (queryWidth && queryHeight) {
      return { width: queryWidth, height: queryHeight };
    }

    const pathMatch = url.pathname.match(/\/(\d+)\/(\d+)\/?$/);
    const pathWidth = getPositiveInteger(pathMatch?.[1] ?? null);
    const pathHeight = getPositiveInteger(pathMatch?.[2] ?? null);

    return pathWidth && pathHeight
      ? { width: pathWidth, height: pathHeight }
      : undefined;
  } catch {
    return undefined;
  }
}

async function getLocalDimensions(src: string) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return undefined;

  const clean = src.split(/[?#]/)[0];
  const candidates = [
    path.resolve(process.cwd(), "public", clean.replace(/^\//, "")),
    path.resolve(process.cwd(), "src", clean.replace(/^(\.\.\/)+/, "")),
    path.resolve(process.cwd(), clean),
  ];
  for (const file of candidates) {
    try {
      const meta = await sharp(readFileSync(file)).metadata();
      if (meta.width && meta.height) {
        return { width: meta.width, height: meta.height };
      }
    } catch {}
  }
  return undefined;
}

/**
 * 图片尺寸：给内容图片注入 `img-fade` class 与 width/height
 * （尺寸来源优先级见 specs/003-satteri-markdown-migration/contracts C1.6）。
 */
export const satteriImageDimensions = defineHastPlugin({
  name: "satteri-image-dimensions",
  element: {
    filter: ["img"],
    async visit(node, ctx) {
      const properties = (node.properties ?? {}) as Record<string, unknown>;
      const src = typeof properties.src === "string" ? properties.src : "";

      const classes = Array.isArray(properties.className)
        ? [...(properties.className as string[])]
        : typeof properties.className === "string"
          ? properties.className.split(/\s+/).filter(Boolean)
          : [];
      if (!classes.includes("img-fade")) classes.push("img-fade");
      ctx.setProperty(
        node as unknown as Parameters<typeof ctx.setProperty>[0],
        "className",
        classes
      );

      if (!properties.width && !properties.height && src) {
        const dimensions =
          getImageDimensions(src) ?? (await getLocalDimensions(src));
        if (dimensions) {
          ctx.setProperty(
            node as unknown as Parameters<typeof ctx.setProperty>[0],
            "width",
            dimensions.width
          );
          ctx.setProperty(
            node as unknown as Parameters<typeof ctx.setProperty>[0],
            "height",
            dimensions.height
          );
        }
      }
    },
  },
});
