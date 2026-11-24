interface Window {
  theme?: {
    themeValue: string;
    setPreference?: () => void;
    reflectPreference?: () => void;
    getTheme: () => string;
    setTheme: (val: string) => void;
  };
}

declare module "/pagefind/pagefind.js" {
  interface PagefindSearchResult {
    data: () => Promise<{
      url: string;
      title?: string;
      excerpt?: string;
      meta?: Record<string, string>;
      tags?: string[];
    }>;
  }

  function search(query: string): Promise<{ results: PagefindSearchResult[] }>;
}

// Astro 字体 API 的内部模块：<Font /> 组件从它读取生成的字体声明，
// src/utils/fontStylesheet.ts 也从这里取。Astro 没有为它提供类型声明
declare module "virtual:astro:assets/fonts/internal" {
  export const componentDataByCssVariable: Map<
    string,
    { css: string; preloads: { url: string; type: string }[] }
  >;
}
