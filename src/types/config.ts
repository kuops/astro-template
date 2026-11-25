import type { ImageMetadata } from "astro";

type Locale = "zh" | "en";

interface SiteConfig {
  url: string;
  title: string;
  description: string;
  author: string;
  /** 站长头像（首页 hero 个人标识用），相对 public 路径或外链 */
  avatar?: string;
  profile?: string;
  ogImage?: string;
  /** 品牌强调色（链接/标题/激活态）。留空用 theme.css 默认；可分明暗覆盖 */
  accent?: string | { light?: string; dark?: string };
  lang?: Locale;
  timezone?: string;
  dir?: "ltr" | "rtl";
  /** 全站固定背景图。不填则页面是纯色 */
  background?: BackgroundConfig;
}

/** 全站固定背景图：所有页面铺满、滚动时不动，上面盖一层半透明底色保证文字清晰。
    图片在 astro-paper.config.ts 顶部用 import 导入后填进来 */
interface BackgroundConfig {
  /** 深色模式用的图 */
  dark?: ImageMetadata;
  /** 浅色模式用的图 */
  light?: ImageMetadata;
  /** 背景图的不透明度（0–1）。越小图越淡、文字越清楚。写一个数时两种模式共用；
      两种模式想用不同的值，写成 { dark: 0.25, light: 0.3 }。默认 0.25 */
  opacity?: number | { dark?: number; light?: number };
}

interface I18nConfig {
  locales?: Locale[];
}

interface PostsConfig {
  perPage?: number;
  perIndex?: number;
  scheduledPostMargin?: number;
}

/** 进场动画的可调项 */
interface EnterAnimationConfig {
  /** 等首屏字体就绪的最长时间（毫秒），超时先显示正文。默认 600 */
  maxFontWait?: number;
}

interface FeaturesConfig {
  lightAndDarkMode?: boolean;
  /** 站点默认主题；留空则跟随用户系统偏好（prefers-color-scheme） */
  initialColorScheme?: "" | "light" | "dark";
  /** 进场动画：正文淡入上移，并等首屏字体就绪后再播，避免看到字体切换。
      false 关闭；传对象为开启，并可调整等待上限 */
  enterAnimation?: boolean | EnterAnimationConfig;
  /** 左上角站点标题的打字机效果：先出现提示符和光标，再逐字敲出标题 */
  siteTitleTypewriter?: boolean;
  dynamicOgImage?: boolean;
  showArchives?: boolean;
  showBackButton?: boolean;
  toc?: boolean;
  editPost?:
    | {
        enabled: true;
        url: string;
      }
    | { enabled: false };
  search?: "pagefind" | false;
}

/** 布局宽度档位（CSS 长度，如 "48rem" / "768px"）。
    阅读栏=长文与首页；浏览栏=列表/卡片网格页；导航带=header/footer 恒定宽度 */
interface LayoutConfig {
  reading?: string;
  browse?: string;
  chrome?: string;
}

interface SocialLink {
  name: string;
  url: string;
  linkTitle?: string;
}

interface ShareLink {
  name: string;
  url: string;
  linkTitle?: string;
}

/** 访客本地天气配置 */
interface WeatherConfig {
  /** Cloudflare Worker 代理地址（部署 workers/weather-proxy.js 后填，如
      https://weather-proxy.xxx.workers.dev）：浏览器带城市名调它，Worker 以合法
      Referer 抓中国天气网官方数据。留空则访客端走 Open-Meteo */
  proxy?: string;
}

interface AstroPaperConfig {
  site: SiteConfig;
  i18n?: I18nConfig;
  posts?: PostsConfig;
  features?: FeaturesConfig;
  layout?: LayoutConfig;
  weather?: WeatherConfig;
  socials?: SocialLink[];
  shareLinks?: ShareLink[];
}

type ResolvedSiteConfig = Required<
  Pick<
    SiteConfig,
    | "url"
    | "title"
    | "description"
    | "author"
    | "lang"
    | "timezone"
    | "dir"
    | "ogImage"
  >
> &
  Pick<SiteConfig, "profile" | "avatar" | "accent" | "background">;

type ResolvedFeaturesConfig = Required<
  Omit<FeaturesConfig, "enterAnimation">
> & {
  enterAnimation: false | Required<EnterAnimationConfig>;
};

export interface ResolvedAstroPaperConfig {
  site: ResolvedSiteConfig;
  i18n: Required<I18nConfig>;
  posts: Required<PostsConfig>;
  features: ResolvedFeaturesConfig;
  layout: Required<LayoutConfig>;
  weather: Required<WeatherConfig>;
  socials: SocialLink[];
  shareLinks: ShareLink[];
}

function defineAstroPaperConfig(config: AstroPaperConfig): AstroPaperConfig {
  return config;
}

export type {
  SiteConfig,
  I18nConfig,
  Locale,
  PostsConfig,
  EnterAnimationConfig,
  FeaturesConfig,
  LayoutConfig,
  BackgroundConfig,
  SocialLink,
  ShareLink,
  AstroPaperConfig,
};

export { defineAstroPaperConfig };
