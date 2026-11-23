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
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerMetaHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { transformerCodeScroll } from "./src/utils/transformers/codeScroll";
import { transformerMermaidHidden } from "./src/utils/transformers/mermaidHidden";
import config from "./astro-paper.config";

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
      themes: { light: "min-light", dark: "one-dark-pro" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerMermaidHidden(),
        transformerFileName({ style: "v2", hideDot: false }),
        transformerMetaHighlight(),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
        transformerCodeScroll(),
      ],
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  vite: {
    plugins: [tailwindcss()],
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
      fallbacks: [],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff2"],
      display: "swap",
    },
    {
      // 中文正文主字体：Noto Sans SC（思源黑体，OFL 许可，可合规自托管）。
      // 构建期经 fontsource 本地子集化下载，运行时同源按需切片加载。
      name: "Noto Sans SC",
      cssVariable: "--font-noto-sans-sc",
      provider: fontProviders.npm(),
      fallbacks: [],
      weights: [400, 500, 700],
      styles: ["normal"],
      formats: ["woff2"],
      display: "swap",
    },
  ],
});
