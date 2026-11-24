/**
 * 生成分页器要显示的页码序列：数字是页码，"ellipsis" 是省略号。
 *
 * 页数不多时全部列出；多了以后两种排法各自省略中间的页码：
 * - full（桌面）：保留首页、末页和当前页前后各一页
 * - compact（手机）：只保留当前页前后各一页，不带首页和末页，给窄屏省地方
 */
export type PageItem = number | "ellipsis";

const withEllipsis = (pages: number[]): PageItem[] => {
  const items: PageItem[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push("ellipsis");
    items.push(p);
  });
  return items;
};

const around = (current: number, total: number) =>
  Array.from(new Set([current - 1, current, current + 1]))
    .filter(p => p >= 1 && p <= total)
    .sort((a, b) => a - b);

export function getPageItems(
  current: number,
  total: number,
  variant: "full" | "compact"
): PageItem[] {
  const all = Array.from({ length: total }, (_, i) => i + 1);

  if (variant === "full") {
    // 最多 7 个页码按钮，再多才省略
    if (total <= 7) return all;
    // 去重：当前页紧挨首页或末页时会与首尾重复
    return withEllipsis(
      [...new Set([1, ...around(current, total), total])].sort((a, b) => a - b)
    );
  }

  // 手机上一行放得下 5 个页码按钮，再多才省略
  if (total <= 5) return all;

  const mid = around(current, total);
  const items: PageItem[] = [];
  if (mid[0] > 1) items.push("ellipsis");
  items.push(...mid);
  if (mid[mid.length - 1] < total) items.push("ellipsis");
  return items;
}
