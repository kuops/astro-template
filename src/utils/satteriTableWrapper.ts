import { defineHastPlugin } from "satteri";

/**
 * 宽表格包裹（上游 v7.0 #668 的 Sätteri 形态等价实现）：
 * 把每个表格包进可聚焦、横向滚动的 `div.table-wrapper`，小屏上表格在正文内
 * 横向滚动而不是撑破版面；`tabindex="0"` 保证键盘用户也能滚动（契约 C02）。
 */
export const satteriTableWrapper = defineHastPlugin({
  name: "satteri-table-wrapper",
  element: {
    filter: ["table"],
    visit(node, ctx) {
      const element = node as unknown as Parameters<typeof ctx.replaceNode>[0];
      ctx.replaceNode(element, {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrapper"], tabIndex: 0 },
        children: [element],
      } as never);
    },
  },
});
