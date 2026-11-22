import { defineHastPlugin, type HastContent } from "satteri";
import type { ElementContent } from "hast";

/**
 * 折叠块自动分组：正文里连续相邻（中间无其他块级元素）的手写
 * <details> 折叠块 ≥ 2 个时，包进 div.accordion-group，由 CSS 渲染成
 * "单一圆角卡片 + 分隔线"的手风琴组（千问/Mintlify AccordionGroup 同构）。
 *
 * markdown 手写的 HTML 块在 hast 里是 raw 节点（<details> 开始块、
 * markdown 内容元素、</details> 结束块），故在 raw 层做状态机分组。
 * 单个 details 保持独立卡片形态不变；折叠 callout（element 形态）
 * 不参与分组。
 */
export const satteriAccordion = () => {
  const processed = new WeakSet();

  return defineHastPlugin({
    name: "satteri-accordion",
    raw(node, ctx) {
      if (!/details/i.test(node.value)) return;
      const parent = ctx.parent(node);
      if (!parent || processed.has(parent)) return;
      processed.add(parent);

      const children = parent.children as HastContent[];
      const runs: HastContent[][] = [];
      let buffer: HastContent[] = [];
      let unitCount = 0;
      let inDetails = false;

      const flush = () => {
        if (unitCount >= 2) runs.push(buffer);
        buffer = [];
        unitCount = 0;
      };

      for (const child of children) {
        // 空白文本节点不打断连续性
        if (child.type === "text" && !child.value?.trim()) continue;
        const value = child.type === "raw" ? child.value : "";
        if (/^\s*<details[\s>]/i.test(value)) {
          if (inDetails) flush(); // 未闭合异常保护
          inDetails = true;
          buffer.push(child);
          continue;
        }
        if (inDetails) {
          buffer.push(child);
          if (/^\s*<\/details>/i.test(value)) {
            inDetails = false;
            unitCount++;
          }
          continue;
        }
        // 其他块级内容打断连续段
        flush();
      }
      flush();

      // 一次性重写 children：连续段整段替换为组容器（内容克隆进容器），
      // 避免逐节点增删的索引漂移与引用残留
      const wrapped = new Set<HastContent>();
      for (const run of runs) run.forEach(n => wrapped.add(n));

      const next: HastContent[] = [];
      let i = 0;
      while (i < children.length) {
        const child = children[i];
        const run = runs.find(r => r[0] === child);
        if (!run) {
          if (!wrapped.has(child)) next.push(child);
          i++;
          continue;
        }
        next.push({
          type: "element",
          tagName: "div",
          properties: { className: ["accordion-group"] },
          children: run.map(node => structuredClone(node)) as ElementContent[],
        });
        i += run.length;
      }
      ctx.setField(parent, "children", next);
    },
  });
};
