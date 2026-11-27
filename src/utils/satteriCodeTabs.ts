import {
  defineMdastPlugin,
  type Custom,
  type MdxJsxAttributeNode,
  type MdxJsxFlowElement,
  type MdastTarget,
  type MdastVisitorContext,
} from "satteri";

const TAB_MARK = /^<!--\s*tab:\s*(.*?)\s*-->$/;
const TAB_ELEMENT = /^<Tab\s+label="([^"]*)"\s*\/>$/;
const TABS_END = /^(?:<!--\s*tabs-end\s*-->|<TabsEnd\s*\/>)$/;

type Tab = { label: string; content: MdastTarget[] };

function toJsxElement(node: MdastTarget): MdxJsxFlowElement | undefined {
  return node.type === "mdxJsxFlowElement"
    ? (node as MdxJsxFlowElement)
    : undefined;
}

function getTabLabel(node: MdastTarget): string | undefined {
  const jsx = toJsxElement(node);
  if (jsx) {
    if (jsx.name !== "Tab") return undefined;
    const label = jsx.attributes.find(
      (attr): attr is MdxJsxAttributeNode =>
        attr.type === "mdxJsxAttribute" && attr.name === "label"
    );
    return typeof label?.value === "string" ? label.value.trim() : undefined;
  }
  if (node.type !== "html") return undefined;
  const value = node.value?.trim() ?? "";
  return (TAB_MARK.exec(value) ?? TAB_ELEMENT.exec(value))?.[1].trim();
}

function isTabsEnd(node: MdastTarget): boolean {
  const jsx = toJsxElement(node);
  if (jsx) return jsx.name === "TabsEnd";
  return node.type === "html" && TABS_END.test(node.value?.trim() ?? "");
}

function element(
  hName: string,
  hProperties: Record<string, string | number | boolean>,
  children: MdastTarget[]
): Custom {
  return { type: "codeTabsElement", data: { hName, hProperties }, children };
}

function renderGroup(tabs: Tab[], groupId: string): Custom {
  const buttons = tabs.map(({ label }, index) =>
    element(
      "button",
      {
        className: "code-tabs-tab",
        type: "button",
        role: "tab",
        id: `${groupId}-tab-${index}`,
        ariaControls: `${groupId}-panel-${index}`,
      },
      [{ type: "text", value: label }]
    )
  );
  const panels = tabs.map(({ content }, index) =>
    element(
      "div",
      {
        className: "code-tabs-panel",
        role: "tabpanel",
        id: `${groupId}-panel-${index}`,
        ariaLabelledBy: `${groupId}-tab-${index}`,
      },
      content
    )
  );

  return element("div", { className: "code-tabs" }, [
    element(
      "div",
      { className: "code-tabs-bar", role: "tablist", hidden: true },
      buttons
    ),
    ...panels,
  ]);
}

function assembleTabs(
  children: MdastTarget[],
  createGroup: (tabs: Tab[]) => Custom
): MdastTarget[] {
  const output: MdastTarget[] = [];
  let start = 0;

  for (const [index, node] of children.entries()) {
    if (!isTabsEnd(node)) continue;

    const tabs: Tab[] = [];
    for (const child of children.slice(start, index)) {
      const label = getTabLabel(child);
      if (label) tabs.push({ label, content: [] });
      else if (label === undefined) {
        const tab = tabs.at(-1);
        (tab?.content ?? output).push(child);
      }
    }
    if (tabs.length >= 2 && tabs.every(tab => tab.content.length > 0)) {
      output.push(createGroup(tabs));
    } else {
      for (const tab of tabs) output.push(...tab.content);
    }
    start = index + 1;
  }

  for (let index = start; index < children.length;) {
    const node = children[index];
    if (getTabLabel(node) === undefined) {
      output.push(node);
      index++;
      continue;
    }

    const tabs: Tab[] = [];
    while (index < children.length) {
      const label = getTabLabel(children[index]);
      const code = children[index + 1];
      if (!label || code?.type !== "code") break;
      tabs.push({ label, content: [code] });
      index += 2;
    }

    if (tabs.length >= 2) output.push(createGroup(tabs));
    else if (tabs.length === 1) output.push(...tabs[0].content);
    else index++;
  }

  return output;
}

export const satteriCodeTabs = () => {
  const processed = new WeakSet();
  let groupCount = 0;

  const assemble = (node: MdastTarget, ctx: MdastVisitorContext) => {
    if (getTabLabel(node) === undefined && !isTabsEnd(node)) return;

    const parent = ctx.parent(node);
    if (
      !parent ||
      (parent.type !== "root" &&
        parent.type !== "blockquote" &&
        parent.type !== "listItem") ||
      processed.has(parent)
    )
      return;

    processed.add(parent);
    const children = assembleTabs(parent.children, tabs =>
      renderGroup(tabs, `code-tabs-${++groupCount}`)
    );
    ctx.setField(parent, "children", children);
  };

  return defineMdastPlugin({
    name: "satteri-code-tabs",
    html: assemble,
    mdxJsxFlowElement: assemble,
  });
};
