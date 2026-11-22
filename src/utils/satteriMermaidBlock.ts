import { defineHastPlugin } from "satteri";
import type { Element, ElementContent, Text } from "hast";

function textOf(node: ElementContent): string {
  if (node.type === "text") return (node as Text).value;
  if (node.type === "element")
    return (node as Element).children.map(textOf).join("");
  return "";
}

/**
 * 代码块行号：给带语言标记的 `pre` 注入 `--code-lines:N` CSS 变量。
 * 与形状无关：兼容 `pre[data-language]`（高亮后）与 `pre > code.language-*`（高亮前）。
 */
export const satteriCodeLines = defineHastPlugin({
  name: "satteri-code-lines",
  element: {
    filter: ["pre"],
    visit(node, ctx) {
      const properties = (node.properties ?? {}) as Record<string, unknown>;
      const hasLanguage =
        typeof properties.dataLanguage === "string" ||
        (node.children ?? []).some(
          child =>
            child.type === "element" &&
            child.tagName === "code" &&
            Array.isArray(child.properties?.className) &&
            (child.properties.className as unknown[]).some(c =>
              String(c).startsWith("language-")
            )
        );
      if (!hasLanguage) return;

      const lines = textOf(node as unknown as ElementContent)
        .replace(/\n$/, "")
        .split("\n").length;
      const style =
        typeof properties.style === "string" ? properties.style : "";
      ctx.setProperty(
        node as unknown as Parameters<typeof ctx.setProperty>[0],
        "style",
        `${style};--code-lines:${lines};`
      );
    },
  },
});

function skeleton(): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["mermaid-skeleton"], ariaHidden: "true" },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["mermaid-spinner"] },
        children: [],
      },
      {
        type: "element",
        tagName: "span",
        properties: { className: ["mermaid-shimmer"] },
        children: [],
      },
      {
        type: "element",
        tagName: "span",
        properties: { className: ["mermaid-shimmer"] },
        children: [],
      },
      {
        type: "element",
        tagName: "span",
        properties: { className: ["mermaid-shimmer"] },
        children: [],
      },
    ],
  };
}

function hashSource(source: string): string {
  let h = 5381;
  for (let i = 0; i < source.length; i++) {
    h = ((h << 5) + h + source.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function isMermaidBlock(node: Element): boolean {
  const properties = (node.properties ?? {}) as Record<string, unknown>;
  if (properties.dataLanguage === "mermaid") return true;
  return (node.children ?? []).some(
    grand =>
      grand.type === "element" &&
      grand.tagName === "code" &&
      Array.isArray(grand.properties?.className) &&
      (grand.properties.className as unknown[]).includes("language-mermaid")
  );
}

/**
 * Mermaid 块：把 mermaid 代码块包裹为骨架占位结构（客户端渲染契约，
 * 见 specs/003-satteri-markdown-migration/contracts C4）。
 * 与形状无关：兼容高亮前后的两种 pre 形状。
 */
export const satteriMermaidBlock = defineHastPlugin({
  name: "satteri-mermaid-block",
  element: {
    filter: ["pre"],
    visit(node, ctx) {
      const element = node as unknown as Element;
      if (!isMermaidBlock(element)) return;

      const source = textOf(element as unknown as ElementContent);
      const lines = source.split("\n").length;
      // 一次性 replaceNode：skeleton 与原 pre 同为块容器子节点，
      // 避免 wrapNode 后 parent 指针过期导致骨架插错位置
      ctx.replaceNode(
        element as unknown as Parameters<typeof ctx.replaceNode>[0],
        {
          type: "element",
          tagName: "div",
          properties: {
            className: ["mermaid-block"],
            ariaBusy: "true",
            dataMermaidKey: hashSource(source.trim()),
            style: `--mermaid-lines:${lines}`,
          },
          children: [skeleton(), element],
        } as never
      );
    },
  },
});
