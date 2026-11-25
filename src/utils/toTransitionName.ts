import { slugifyStr } from "./slugify";

/**
 * 把任意字符串转成合法的过渡名（view-transition-name 只能是 CSS 标识符）。
 *
 * prefix 用来区分元素的种类。带过渡名的有两类元素：文章标题（用文章 id）和标签胶囊
 * （用标签 slug），而文章 id 和标签 slug 都是路径，完全可能同名（比如都叫 hello）。
 * 不加前缀就会撞名，浏览器会把两个不相干的元素当成同一个做位移动画：曾经出现从归档页
 * 切到标签页时，一篇文章的标题飞上去缩成了同名的标签胶囊。
 */
export const toTransitionName = (str: string, prefix = "post"): string => {
  const base = slugifyStr(str.replaceAll(".", "-"));
  let result = base
    .replace(
      /[^\x00-\x7F]/gu,
      c => "u" + (c.codePointAt(0) ?? 0).toString(16).padStart(6, "0")
    )
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (/^\d/.test(result)) result = "p-" + result;
  return result ? `${prefix}-${result}` : prefix;
};
