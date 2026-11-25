// 代码高亮用的浅色主题：基于 Shiki 的 min-light（MIT），只换掉对比度不达标的几个颜色。
//
// min-light 走的是“淡”的路线，有两类颜色在白底上看不清：注释只有 1.8，函数参数的橙色是 2.2；
// 字符串和数字是 4.6，刚过线，但放进被高亮的行里（行底色更深）就不够了。
// 这里保持色相、只把明暗调到白底上 5.2 左右，其余颜色原样保留。
// 注释调得更深一些（白底上 5.9）：代码块里被高亮的行有一层灰底，上面的字会显得更淡，
// 注释本来就是最淡的一种，要保证它在灰底上也看得清。
// 主题名不变（仍是 min-light），代码块上的类名和样式里引用的变量都不受影响。
//
// @shikijs/themes/min-light 的类型声明说自己是 Shiki 的标准格式，运行时导出的却是 VS Code 的格式
// （规则放在 tokenColors 里，而不是 settings 里）。所以这里按运行时的实际结构显式转换成标准格式，
// 类型和数据才对得上。
import minLight from "@shikijs/themes/min-light";

/** 原颜色 → 新颜色（键用大写，匹配时忽略大小写） */
const SWAP: Record<string, string> = {
  "#C2C3C5": "#636468", // 注释
  "#FF9800": "#9D5E00", // 函数参数
  "#22863A": "#207C36", // 字符串
  "#1976D2": "#176DC3", // 数字、常量
};

type Rule = {
  name?: string;
  scope?: string | string[];
  settings: { foreground?: string; fontStyle?: string; background?: string };
};

const raw = minLight as unknown as {
  name: string;
  type: "light" | "dark";
  colors: Record<string, string>;
  tokenColors?: Rule[];
};

export const shikiLightTheme = {
  name: raw.name, // "min-light"
  type: raw.type, // "light"
  // 其中的 editor.background 就是浅色代码块的底色
  colors: raw.colors,
  // VS Code 主题里有只起分组作用、不带 settings 的条目，转换时丢掉
  settings: (raw.tokenColors ?? []).flatMap(rule => {
    if (!rule.settings) return [];
    const foreground = rule.settings.foreground?.toUpperCase();
    const next = foreground ? SWAP[foreground] : undefined;
    return [
      next
        ? { ...rule, settings: { ...rule.settings, foreground: next } }
        : rule,
    ];
  }),
};
