import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://blog.example.com/",
    title: "My Blog",
    description: "一个基于 Astro 的个人博客。",
    author: "Blog Author",
    avatar: "/astropaper-og.jpg",
    profile: "https://blog.example.com/",
    lang: "zh",
    timezone: "Asia/Shanghai",
    dir: "ltr",
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
