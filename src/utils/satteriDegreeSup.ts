import { defineMdastPlugin } from "satteri";

/**
 * 度数符号上标补丁：satteri 内建 superscript 不解析以符号类字符
 * （° U+00B0 / ℃ U+2103）开头的上标内容（pulldown-cmark 字符类限制，
 * 上游 issue #1078/#1022，短期不会修复）。本插件在 mdast 文本层补齐
 * `^°C^` 一类写法的上标渲染，与内建特性无冲突（内建只处理字母/数字
 * 开头的内容，二者范围不相交，不会双重解析）。
 *
 * 安全性：text visitor 只访问 text 节点；行内代码（inlineCode）与代码块
 * （code）的内容不在 text 节点中，天然不受影响。
 */

const DEGREE_SUP = /\^([°℃][^^]*)\^/g;

interface TextNode {
  type: "text";
  value: string;
}

interface DegreeSupNode {
  type: "degreeSup";
  data: { hName: "sup" };
  children: TextNode[];
}

function splitDegreeSup(value: string): Array<TextNode | DegreeSupNode> {
  const out: Array<TextNode | DegreeSupNode> = [];
  let last = 0;
  DEGREE_SUP.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DEGREE_SUP.exec(value)) !== null) {
    if (match.index > last) {
      out.push({ type: "text", value: value.slice(last, match.index) });
    }
    out.push({
      type: "degreeSup",
      data: { hName: "sup" },
      children: [{ type: "text", value: match[1] }],
    });
    last = match.index + match[0].length;
  }
  if (last < value.length) {
    out.push({ type: "text", value: value.slice(last) });
  }
  return out;
}

export const satteriDegreeSup = defineMdastPlugin({
  name: "satteri-degree-sup",
  text(node, ctx) {
    const value = (node as unknown as TextNode).value;
    if (!value.includes("^")) return;
    DEGREE_SUP.lastIndex = 0;
    if (!DEGREE_SUP.test(value)) return;
    ctx.replaceNode(node as never, splitDegreeSup(value) as never);
  },
});
