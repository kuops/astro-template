# AstroPaper Template

![AstroPaper](public/astropaper-og.jpg)

一个基于 [AstroPaper](https://github.com/satnaing/astro-paper) 的中文博客与书籍脚手架。

这个仓库保留了 AstroPaper 简洁、响应式、SEO 友好的基础能力，同时补充了更适合中文内容站点的默认配置、书籍内容模型和阅读体验增强。

## 为什么用这个模板（Why This Template）

- 适合做中文博客、教程站、知识库和轻量书籍站点
- 保留 AstroPaper 的整体结构，便于跟进上游更新
- 在不引入重型 CMS 的前提下，补足更适合内容型站点的能力

## 与上游 AstroPaper 的差异（Compared with upstream AstroPaper）

- **可配置中英文站点**：默认语言为 `zh`、默认时区为 `Asia/Shanghai`；默认语言不带 URL 前缀，另一语言使用 `/en/` 或 `/zh/` 前缀。
- **内容目录沿用旧结构**：上游后续把内容目录切换到了 `src/content/`，而这个模板延续了较早版本的 `src/data/` 组织方式，并按 `blog`、`books`、`pages` 分开管理。
- **书籍内容系统**：除了博客，还新增了文件系统驱动的 `books` 集合，支持 `index.md`、`_index.md`、章节分组和书籍目录页。
- **阅读体验补充**：增加了书籍导航、返回按钮、回到顶部、目录体验优化、图片灯箱等能力。
- **首页欢迎卡与天气**：首页分左右两栏，右侧的欢迎卡显示访客的本地时间和天气。天气取访客所在地：填了 `weather.proxy` 时先走 `workers/weather-proxy.js`（中国天气网的数据），不可用时回退 Open-Meteo；没填则直接用 Open-Meteo。定位不到或数据源都不可用时，卡片显示一句提示。
- **进场动画**：每页正文淡入上移，并等首屏字体就绪后再播放，避免看到字体切换。不需要时设 `features.enterAnimation: false`。
- **站点标题打字机**：左上角的站点标题像在终端里敲出来：先出现提示符和光标，再逐字敲出标题。每个会话只敲一次，站内换页不重播；系统开启「减少动态效果」时直接显示完整标题。不需要时设 `features.siteTitleTypewriter: false`。
- **全站背景图**：深色、浅色模式可以各配一张固定背景图，所有页面铺满、滚动时不动，上面盖一层半透明底色保证文字清晰。图片在构建时自动压缩成多尺寸。不需要就不填，页面是纯色。配置在 `site.background`。
- **搜索实现调整**：自研搜索 modal（`PagefindModal.astro`）+ Pagefind 静态索引；支持中英双语言索引合并，未翻译的回退原文也可被搜到并带"原文"徽标。
- **字体与代码展示调整**：增加 Google Sans Code、Noto Sans SC、自定义代码块文件名与高亮 transformer，更适合中英文混排和技术写作。

## 项目结构（Project Structure）

```bash
/
├── astro-paper.config.ts
├── astro.config.ts
├── scripts/
├── workers/
│   └── weather-proxy.js
├── public/
│   └── astropaper-og.jpg
├── src/
│   ├── components/
│   ├── custom/
│   ├── data/
│   │   ├── blog/
│   │   ├── books/
│   │   └── pages/
│   ├── i18n/
│   ├── layouts/
│   ├── pages/
│   │   └── books/
│   ├── styles/
│   ├── types/
│   └── utils/
│       └── books.ts
└── .github/
    ├── dependabot.yml
    └── workflows/
        └── ci.yml
```

与上游相比，最值得关注的是这些路径：

- `astro-paper.config.ts`：模板主配置入口
- `astro.config.ts`：Astro 配置，字体、Markdown 处理器等在这里
- `src/data/blog/`：博客文章内容
- `src/data/books/`：书籍内容与分组目录
- `src/data/pages/`：关于页等单页内容
- `src/pages/books/`：书籍首页、章节页路由
- `src/utils/books.ts`：从文件系统推导书籍结构、侧边栏和章节顺序
- `src/i18n/`：多语言工具与中英文文案（`lang/zh.ts`、`lang/en.ts`）
- `src/custom/`：自定义插入点（`Head.astro`、`BodyEnd.astro`、`PostEnd.astro`），放自己的统计代码、meta 标签、评论等。按设计，模板后续版本不会改动这些文件
- `scripts/`：构建配套脚本，处理 Pagefind 搜索索引
- `workers/weather-proxy.js`：访客本地天气的 Cloudflare Worker 代理，可选部署

## 站点配置（Configuration）

模板的配置集中在 `astro-paper.config.ts`，每个字段都有注释：

| 字段            | 用途                                                                             |
| :-------------- | :------------------------------------------------------------------------------- |
| `site`          | 站点地址、标题、描述、作者、语言、时区、强调色、背景图等                         |
| `i18n.locales`  | 启用的语言，默认语言由 `site.lang` 指定                                          |
| `posts`         | `perPage` 是文章列表页和标签页每页的文章数，`perIndex` 是首页显示的篇数          |
| `features`      | 明暗模式、初始主题、归档页、返回按钮、目录、搜索、进场动画、站点标题打字机等开关 |
| `layout`        | 三档布局宽度（CSS 长度）：阅读栏、浏览栏、导航带                                 |
| `weather.proxy` | 访客本地天气的 Worker 代理地址，留空则走 Open-Meteo                              |
| `socials`       | 页脚的社交链接                                                                   |
| `shareLinks`    | 文章的分享渠道                                                                   |

进场动画默认开启，等首屏字体的上限是 600 毫秒，超时先显示正文。站点标题打字机也默认开启，写 `siteTitleTypewriter: false` 关闭：

```ts
features: {
  // 关闭写成 enterAnimation: false
  enterAnimation: { maxFontWait: 600 },
  siteTitleTypewriter: true,
},
```

换图时先把新图转成 WebP。第二个参数写旧图的文件名，就会直接覆盖，配置不用改；超过 2560 宽的图会自动缩小：

```bash
npm run webp -- 新图.png site-background-light
```

背景图在 `astro-paper.config.ts` 顶部用 `import` 导入，再填到 `site.background` 里。深色、浅色模式各配一张，只配一种时另一种模式保持纯色。图的不透明度（`opacity`）越小图越淡、文字越清楚，默认 0.25；写一个数时两种模式共用，也可以分别写：

```ts
import siteBackgroundDark from "./src/assets/images/site-background-dark.webp";

export default defineAstroPaperConfig({
  site: {
    background: {
      dark: siteBackgroundDark,
      // light: siteBackgroundLight,
      // opacity: 0.25,
      // opacity: { dark: 0.25, light: 0.3 },
    },
  },
});
```

## 快速开始（Quick Start）

```bash
# 使用 Astro 官方脚手架从这个模板初始化
npm create astro@latest -- --template kuops/astro-template

# 安装依赖并启动
npm install
npm run dev
```

默认本地地址为 `http://localhost:4321`。

## 内容约定（Content Conventions）

### 博客文章（Blog Posts）

博客文章放在 `src/data/blog/`，至少需要这些 frontmatter：

```yaml
title: 标题
pubDatetime: 2026-06-08T12:00:00Z
description: 文章摘要
tags:
  - astro
  - blog
```

### 书籍内容（Books）

书籍内容放在 `src/data/books/`，目录结构本身就是数据源：

```bash
src/data/books/
  astro-guide/
    index.md
    basics/
      _index.md
      intro.md
      installation.md
    advanced/
      _index.md
      components.md
```

- 顶层目录代表一本书
- `index.md` 是书籍元数据
- `_index.md` 是分组元数据
- 其余 `.md` 文件是章节
- 书籍首页直接显示第一章的内容，所以第一章同时有两个网址。章节正文里链接其它章节时写绝对路径（如 `/books/astro-guide/basics/installation`），不要用相对路径

### 中英文内容（Localized Content）

`astro-paper.config.ts` 使用 `site.lang` 指定默认语言，并通过 `i18n.locales` 启用语言：

```ts
site: {
  lang: "zh",
},
i18n: {
  locales: ["zh", "en"],
},
```

默认语言内容继续放在原目录，其他语言放在对应语言子目录：

```text
src/data/blog/hello.md
src/data/blog/en/hello.md

src/data/pages/about.md
src/data/pages/en/about.md

src/data/books/astro-guide/index.md
src/data/books/en/astro-guide/index.md
```

相同相对路径会自动视为同一内容的译文。不同语言需要使用不同文件路径时，可在 frontmatter 中设置相同的 `translationKey`。没有译文的内容仍会显示在目标语言列表中，并标记原文语言、链接到原语言页面；不会生成重复的目标语言正文页面。

## 命令（Commands）

所有命令都在项目根目录运行：

| Command                | Action                                                                |
| :--------------------- | :-------------------------------------------------------------------- |
| `npm install`          | 安装依赖                                                              |
| `npm run dev`          | 启动本地开发服务器                                                    |
| `npm run lint`         | 运行 ESLint                                                           |
| `npm run format:check` | 检查 Prettier 格式                                                    |
| `npm run format`       | 自动格式化文件                                                        |
| `npm run build`        | 检查类型、构建站点、生成 Pagefind 搜索索引                            |
| `npm run preview`      | 本地预览构建结果                                                      |
| `npm run sync`         | 生成 Astro 类型定义                                                   |
| `npm run webp`         | 把一张图片转成 WebP 放进 `src/assets/images/`，用法见上方背景图的说明 |

## 部署说明（Deployment Notes）

- 这是纯静态站点：构建命令用 `npm run build`，发布目录是 `dist`
- 部署前请把 `astro-paper.config.ts` 里的 `site.url`、`title`、`description`、`author` 等站点信息改成你自己的
- 如果站点部署在子路径，例如 `<username>.github.io/<repo>`，请在 `astro.config.ts` 里补充 `base: "/<repo>/"`

## 上游项目（Upstream）

- 上游项目：`satnaing/astro-paper`

## 许可证（License）

Licensed under the MIT License, Copyright © 2025-2026

---

Made with appreciation for [Sat Naing](https://satnaing.dev) and the [AstroPaper contributors](https://github.com/satnaing/astro-paper/graphs/contributors).
