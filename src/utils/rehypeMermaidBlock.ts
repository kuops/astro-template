import type { Root, Element, ElementContent, Text } from "hast";

function textOf(node: ElementContent): string {
  if (node.type === "text") return (node as Text).value;
  if (node.type === "element")
    return (node as Element).children.map(textOf).join("");
  return "";
}

export function rehypeCodeLines() {
  return (tree: Root) => {
    const walk = (node: Element | Root) => {
      if (!("children" in node)) return;
      node.children = node.children.map(child => {
        if (child.type !== "element") return child;
        if (child.tagName === "pre" && child.properties?.dataLanguage) {
          const lines = textOf(child).replace(/\n$/, "").split("\n").length;
          const style =
            typeof child.properties.style === "string"
              ? child.properties.style
              : "";
          child.properties.style = `${style};--code-lines:${lines};`;
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}

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

export default function rehypeMermaidBlock() {
  return (tree: Root) => {
    const walk = (node: Element | Root) => {
      if (!("children" in node)) return;
      node.children = node.children.map(child => {
        if (
          child.type === "element" &&
          child.tagName === "pre" &&
          (child.properties?.dataLanguage === "mermaid" ||
            child.children.some(
              grand =>
                grand.type === "element" &&
                grand.tagName === "code" &&
                Array.isArray(grand.properties?.className) &&
                (grand.properties.className as string[]).includes(
                  "language-mermaid"
                )
            ))
        ) {
          const source = textOf(child);
          const lines = source.split("\n").length;
          const block: Element = {
            type: "element",
            tagName: "div",
            properties: {
              className: ["mermaid-block"],
              ariaBusy: "true",
              dataMermaidKey: hashSource(source.trim()),
              style: `--mermaid-lines:${lines}`,
            },
            children: [skeleton(), child],
          };
          return block;
        }
        if (child.type === "element") walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
