import { defineTemplateConfig } from "./src/types/config";
import siteBackgroundDark from "./src/assets/images/site-background-dark.webp";
import siteBackgroundLight from "./src/assets/images/site-background-light.webp";

export default defineTemplateConfig({
  site: {
    url: "https://astro-template.opshsy.workers.dev/",
    title: "My Blog",
    description: "一个基于 Astro 的个人博客。",
    author: "Blog Author",
    avatar: "/astropaper-og.jpg",
    profile: "https://blog.example.com/",
    lang: "zh",
    timezone: "Asia/Shanghai",
    dir: "ltr",
    // 全站固定背景图（可选）：所有页面铺满、滚动时不动，上面盖一层半透明底色保证文字清晰。
    // 深色、浅色模式可以各配一张，只配一种时另一种模式保持纯色。
    // 在本文件顶部 import 图片，再填到这里；构建时会自动压缩成多尺寸，换图就换 import 的路径
    background: {
      dark: siteBackgroundDark,
      light: siteBackgroundLight,
      // 图的不透明度（0–1），越小越淡。默认 0.25；两种模式想用不同的值就分开写，
      // 比如 opacity: { dark: 0.1, light: 0.25 }
      opacity: { dark: 0.15, light: 0.05 },
      // 构建时压缩背景图的质量（1–100），越低文件越小、图越模糊。默认 80；
      // 两种模式想用不同的值就分开写。浅色这张细节多、又只显示得很淡，压到 60 看不出区别
      quality: { dark: 80, light: 60 },
    },
  },
  i18n: {
    locales: ["zh", "en"],
  },
  posts: {
    perPage: 5,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    toc: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
    // 进场动画：正文淡入上移，等首屏字体就绪后再播。写 false 关闭；
    // maxFontWait 是等字体的上限（毫秒），超时先显示正文
    enterAnimation: {
      maxFontWait: 600,
    },
    // 左上角的站点标题像在终端里敲出来：先出现提示符和光标，再逐字敲出标题。
    // 每个会话只敲一次，站内换页不重播。写 false 关闭，标题就是一个普通链接
    siteTitleTypewriter: true,
  },
  layout: {
    // 布局宽度三档（CSS 长度）：阅读栏 / 浏览栏 / 导航带
    reading: "48rem",
    browse: "64rem",
    chrome: "80rem",
  },
  weather: {
    // 访客本地天气的 Cloudflare Worker 代理（部署 workers/weather-proxy.js 后填入
    // 其地址，如 https://weather-proxy.xxx.workers.dev）。留空：访客端走 Open-Meteo；
    // 填写后国内城市优先走中国天气网官方数据（海外城市仍走 Open-Meteo）
    proxy: "https://weather.kernel.fans",
  },
  socials: [
    { name: "github", url: "https://github.com/satnaing/astro-paper" },
    { name: "x", url: "https://x.com/username" },
    { name: "wechat", url: "#" },
    { name: "mail", url: "mailto:yourmail@gmail.com" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
