/**
 * 字体声明的外部样式表
 *
 * Astro 的字体 API（astro.config.ts 的 fonts）通过 <Font /> 组件把字体声明写进页面，
 * 而且是内联的：<style> 跟着每个页面走。中文字体是上百个切片、每片一条 @font-face，
 * Noto Sans SC 三个字重的声明有约 270KB，原来每个页面都带一份，预取下一页时也要重下一遍。
 *
 * 这里把这段声明原样输出成一个独立文件（见 src/pages/fonts.css.ts），页面里用 <link> 引入，
 * 浏览器下载一次后一直复用。
 *
 * 数据来自 Astro 的内部模块 virtual:astro:assets/fonts/internal（<Font /> 组件自己也是从这里取）。
 * 升级 Astro 后如果这个模块改了名，这里会直接构建报错：对照 <Font /> 的源码
 * （node_modules/astro/components/Font.astro）更新即可。
 */
import { componentDataByCssVariable } from "virtual:astro:assets/fonts/internal";

/** 放进外部样式表的字体（cssVariable 对应 astro.config.ts 的 fonts） */
const EXTERNAL_FONT_VARIABLES = ["--font-noto-sans-sc"];

const STYLESHEET = "fonts.css";

export function getFontStylesheetCss(): string {
  return groupByUnicodeRange(
    EXTERNAL_FONT_VARIABLES.map(cssVariable => {
      const data = componentDataByCssVariable.get(cssVariable);
      if (!data) {
        throw new Error(
          `找不到字体 "${cssVariable}" 的声明。请确认 astro.config.ts 的 fonts 里配置了它。`
        );
      }
      return data.css;
    }).join("")
  );
}

const FONT_FACE_BLOCK = /@font-face\s*\{[^}]*\}/g;

/**
 * 把 @font-face 按切片分组：unicode-range 相同的几条（同一个切片的各个字重）排在一起。
 *
 * Astro 的输出是「先全部 400、再全部 500、再全部 700」，同一个切片的三条声明相隔约 100KB，
 * 超出 gzip 的窗口，重复的长 unicode-range 压不掉。分组后实测 gzip 从 94KB 降到 36KB。
 * @font-face 之间互相独立，调整顺序不影响字体匹配。
 */
function groupByUnicodeRange(css: string): string {
  const blocks = css.match(FONT_FACE_BLOCK) ?? [];
  if (blocks.length === 0) {
    return css;
  }
  const rangeOf = (block: string) =>
    block.match(/unicode-range\s*:\s*([^;}]*);?/)?.[1]?.trim() ?? "";
  // 切片按首次出现的顺序编号，组内保持原有顺序
  const order = new Map<string, number>();
  for (const block of blocks) {
    const range = rangeOf(block);
    if (!order.has(range)) {
      order.set(range, order.size);
    }
  }
  const grouped = blocks
    .map((block, index) => ({ block, index, group: order.get(rangeOf(block)) }))
    .sort((a, b) => (a.group ?? 0) - (b.group ?? 0) || a.index - b.index)
    .map(({ block }) => block)
    .join("");
  // 其余部分是变量定义（:root{--font-noto-sans-sc:…}），照旧放在最后
  return grouped + css.replace(FONT_FACE_BLOCK, "").trim();
}

/** 短哈希（djb2），只用来生成版本号 */
function hash(input: string): string {
  let value = 5381;
  for (let i = 0; i < input.length; i++) {
    value = (value * 33 + input.charCodeAt(i)) >>> 0;
  }
  return value.toString(36);
}

/** 样式表地址。带内容版本号：声明变了地址才变，浏览器和 CDN 可以放心长缓存 */
export const fontStylesheetHref = `${import.meta.env.BASE_URL.replace(
  /\/+$/,
  ""
)}/${STYLESHEET}?v=${hash(getFontStylesheetCss())}`;
