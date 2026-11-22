import { defineMdastPlugin, type MdastTarget } from "satteri";

const STEPS_START = /^<!--\s*steps\s*-->$/;
const STEPS_END = /^<!--\s*steps-end\s*-->$/;

/**
 * 步骤指引：`<!--steps-->` ... `<!--steps-end-->` 包住一段（或多段）有序列表，
 * 列表输出为 ol.steps，由 CSS 渲染成"编号圆圈 + 连接竖线"的步骤条。
 *
 * 与 code-tabs 一样只做静态装配：插件只挂 className、剔除标记节点，
 * 不重组内容，因此步骤体内可包含代码块、标签组等任意块级元素；
 * 无样式时降级为普通有序列表。
 */
export const satteriSteps = () => {
  const processed = new WeakSet();

  return defineMdastPlugin({
    name: "satteri-steps",
    html(node, ctx) {
      const value = node.value?.trim() ?? "";
      if (!STEPS_START.test(value) && !STEPS_END.test(value)) return;

      const parent = ctx.parent(node);
      if (
        (parent.type !== "root" &&
          parent.type !== "blockquote" &&
          parent.type !== "listItem") ||
        processed.has(parent)
      )
        return;

      processed.add(parent);

      const output: MdastTarget[] = [];
      const wrapped: MdastTarget[] = [];
      let collecting = false;

      for (const child of parent.children) {
        const text = child.type === "html" ? (child.value?.trim() ?? "") : "";
        if (STEPS_START.test(text)) {
          collecting = true;
          continue;
        }
        if (STEPS_END.test(text)) {
          collecting = false;
          continue;
        }
        if (collecting && child.type === "list" && child.ordered === true)
          wrapped.push(child);
        output.push(child);
      }

      for (const list of wrapped)
        ctx.setField(list, "data", { hProperties: { className: "steps" } });
      ctx.setField(parent, "children", output);
    },
  });
};
