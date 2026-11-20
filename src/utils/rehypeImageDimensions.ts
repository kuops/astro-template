import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

type ImageNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: ImageNode[];
};

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

export default function rehypeImageDimensions() {
  return async (tree: ImageNode) => {
    async function visit(node: ImageNode) {
      if (node.type === "element" && node.tagName === "img") {
        const properties = node.properties ?? {};
        const src = typeof properties.src === "string" ? properties.src : "";
        const classes = Array.isArray(properties.className)
          ? (properties.className as string[])
          : typeof properties.className === "string"
            ? properties.className.split(/\s+/).filter(Boolean)
            : [];
        if (!classes.includes("img-fade")) classes.push("img-fade");
        properties.className = classes;
        node.properties = properties;

        if (!properties.width && !properties.height && src) {
          const dimensions =
            getImageDimensions(src) ?? (await getLocalDimensions(src));
          if (dimensions) {
            properties.width = dimensions.width;
            properties.height = dimensions.height;
            node.properties = properties;
          }
        }
      }

      for (const child of node.children ?? []) await visit(child);
    }

    await visit(tree);
  };
}
