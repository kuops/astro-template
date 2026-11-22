import type { ShikiTransformer } from "@shikijs/types";

const HEIGHT_UNIT_RE = /^[0-9.]+(?:px|rem|em|vh|vw|%)$/i;
const HEIGHT_PLAIN_RE = /^[0-9.]+$/;

/**
 * 代码块限高滚动：info string 里写 `scroll`（默认 30rem）或
 * `scroll=400`（自定义 CSS 长度值）。与 transformerFileName 的
 * meta 解析同款通路；高度值经 CSS 变量传入，不覆盖 shiki
 * 写在 pre 内联 style 里的主题变量。
 */
export const transformerCodeScroll = (): ShikiTransformer => ({
  name: "code-scroll",
  pre(node) {
    const raw = this.options.meta?.__raw?.split(" ");
    if (!raw) return;

    let height: string | undefined;
    for (const item of raw) {
      const eq = item.indexOf("=");
      const key = eq === -1 ? item : item.slice(0, eq);
      if (key !== "scroll") continue;
      const value = eq === -1 ? "" : item.slice(eq + 1);
      if (value) {
        // 纯数字视为 px；带单位直接透传；其余非法值整段忽略
        if (HEIGHT_UNIT_RE.test(value)) height = value;
        else if (HEIGHT_PLAIN_RE.test(value)) height = `${value}px`;
        else return;
      } else height = "";
      break;
    }
    if (height === undefined) return;

    this.addClassToHast(node, "code-scroll");
    if (height)
      node.properties.style =
        (node.properties.style || "") + `--code-max-h: ${height};`;
  },
});
