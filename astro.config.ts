import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriMark } from "@mirrordown/sat-mark";
import satteriCallouts from "satteri-callouts";
import {
  satteriMermaidBlock,
  satteriCodeLines,
} from "./src/utils/satteriMermaidBlock";
import { satteriImageDimensions } from "./src/utils/satteriImageDimensions";
import { satteriDegreeSup } from "./src/utils/satteriDegreeSup";
import { satteriCodeTabs } from "./src/utils/satteriCodeTabs";
import { satteriSteps } from "./src/utils/satteriSteps";
import { satteriAccordion } from "./src/utils/satteriAccordion";
import { satteriTableWrapper } from "./src/utils/satteriTableWrapper";
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerNotationFocus,
  transformerMetaHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { transformerCodeScroll } from "./src/utils/transformers/codeScroll";
import { transformerMermaidHidden } from "./src/utils/transformers/mermaidHidden";
import { devFontCache } from "./src/utils/devFontCache";
import { shikiLightTheme } from "./src/utils/shikiLightTheme";
import config from "./astro-template.config";

const defaultLocale = config.site.lang ?? "en";
const locales = config.i18n?.locales ?? [defaultLocale];

if (!locales.includes(defaultLocale)) {
  throw new Error(
    `The default locale "${defaultLocale}" must be included in i18n.locales.`
  );
}

export default defineConfig({
  site: config.site.url,
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
  ],
  i18n: {
    locales,
    defaultLocale,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: satteri({
      features: {
        gfm: true,
        superscript: true,
        subscript: true,
        smartPunctuation: true,
      },
      mdastPlugins: [
        satteriMark,
        satteriDegreeSup,
        satteriCodeTabs,
        satteriSteps,
      ],
      hastPlugins: [
        () => satteriCallouts(),
        satteriAccordion,
        satteriImageDimensions,
        satteriMermaidBlock,
        satteriCodeLines,
        satteriTableWrapper,
      ],
    }),
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      // 浅色用项目内调整过的 min-light（见 src/utils/shikiLightTheme.ts），深色用原版
      themes: { light: shikiLightTheme, dark: "one-dark-pro" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerMermaidHidden(),
        transformerFileName({ style: "v2", hideDot: false }),
        transformerMetaHighlight(),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationFocus(),
        transformerNotationErrorLevel(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
        transformerCodeScroll(),
      ],
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  vite: {
    // devFontCache：开发时让浏览器缓存字体文件（Astro 默认每次刷新都重新下载）
    plugins: [tailwindcss(), devFontCache()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      // 注意：这里不要配 fallbacks（如 ["monospace"]）。Astro 生成的校准回退会把通用族
      // （monospace）一起追加进 --font-google-sans-code，排在 global.css 里手写的中文回退
      // 之前——于是所有走该变量的汉字（标题、导航、目录、标签页、书籍目录…）在 Windows 上
      // 全部变成 NSimSun。回退校准由 global.css 里手写的 "GSC Fallback" 负责
      fallbacks: [],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff2"],
      display: "swap",
    },
    {
      // 中文正文主字体：Noto Sans SC（思源黑体，OFL 许可，可合规自托管）。
      // 构建期经 fontsource 本地子集化下载，运行时同源按需切片加载。
      // 它的声明不内联进页面，而是输出成外部样式表，见 src/utils/fontStylesheet.ts
      name: "Noto Sans SC",
      cssVariable: "--font-noto-sans-sc",
      provider: fontProviders.npm(),
      // 注意：这里不要配 fallbacks（如 ["sans-serif"]）。Astro 的自动校准按"平均字符宽度"
      // 算缩放比，而思源黑体按全角字符报告该值，生成的回退会把 Arial 放大到 197%——
      // 字体到达前正文里的英文数字被画成约两倍宽（实测同一段文字 253px → 511px）。
      // 正文回退不校准：汉字宽度在各中文字体里都是 1em，本身不跳版
      fallbacks: [],
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      formats: ["woff2"],
      display: "swap",
    },
  ],
});
