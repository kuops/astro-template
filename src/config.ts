import userConfig from "../astro-paper.config";
import type { ResolvedAstroPaperConfig } from "./types/config";

const DEFAULT_OG_IMAGE = "og.png";
const DEFAULT_ENTER_MAX_FONT_WAIT = 600;
const defaultLocale = userConfig.site.lang ?? "en";
const locales = userConfig.i18n?.locales ?? [defaultLocale];
const enterAnimation = userConfig.features?.enterAnimation;

if (!locales.includes(defaultLocale)) {
  throw new Error(
    `The default locale "${defaultLocale}" must be included in i18n.locales.`
  );
}

const config: ResolvedAstroPaperConfig = {
  site: {
    ...userConfig.site,
    ogImage: userConfig.site.ogImage ?? DEFAULT_OG_IMAGE,
    accent: userConfig.site.accent,
    lang: defaultLocale,
    timezone: userConfig.site.timezone ?? "UTC",
    dir: userConfig.site.dir ?? "ltr",
  },
  i18n: {
    locales,
  },
  posts: {
    perPage: userConfig.posts?.perPage ?? 4,
    perIndex: userConfig.posts?.perIndex ?? 4,
    scheduledPostMargin:
      userConfig.posts?.scheduledPostMargin ?? 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: userConfig.features?.lightAndDarkMode ?? true,
    initialColorScheme: userConfig.features?.initialColorScheme ?? "",
    dynamicOgImage: userConfig.features?.dynamicOgImage ?? true,
    showArchives: userConfig.features?.showArchives ?? true,
    showBackButton: userConfig.features?.showBackButton ?? true,
    toc: userConfig.features?.toc ?? true,
    editPost: userConfig.features?.editPost ?? { enabled: false },
    search: userConfig.features?.search ?? "pagefind",
    enterAnimation:
      enterAnimation === false
        ? false
        : {
            maxFontWait:
              (typeof enterAnimation === "object"
                ? enterAnimation.maxFontWait
                : undefined) ?? DEFAULT_ENTER_MAX_FONT_WAIT,
          },
  },
  layout: {
    reading: userConfig.layout?.reading ?? "48rem",
    browse: userConfig.layout?.browse ?? "64rem",
    chrome: userConfig.layout?.chrome ?? "80rem",
  },
  weather: {
    proxy: userConfig.weather?.proxy ?? "",
  },
  socials: userConfig.socials ?? [],
  shareLinks: userConfig.shareLinks ?? [],
};

export default config;
