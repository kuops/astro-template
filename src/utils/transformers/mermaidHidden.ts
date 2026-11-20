import type { ShikiTransformer } from "@shikijs/types";

export function transformerMermaidHidden(): ShikiTransformer {
  return {
    name: "mermaid-hidden-source",
    pre() {
      if (this.options.lang !== "mermaid") return;
      const style = this.pre.properties.style;
      this.pre.properties.style = `${typeof style === "string" ? style : ""};display:none;`;
    },
  };
}
