import type { APIRoute } from "astro";
import { getFontStylesheetCss } from "@/utils/fontStylesheet";

/**
 * 字体声明的外部样式表，构建后是 dist/fonts.css。
 * 页面里的引用地址见 src/utils/fontStylesheet.ts。
 */
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(getFontStylesheetCss(), {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
