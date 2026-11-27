# AstroPaper Template

<p align="center">
  <img src=".github/preview.webp" alt="AstroPaper Template" width="752">
</p>

一个基于 [AstroPaper](https://github.com/satnaing/astro-paper) 和 [Astro](https://astro.build) 的中英双语博客与文档站脚手架。内容就是普通的 Markdown 文件，没有 CMS，也没有数据库。

[English](./README.md) | 简体中文

## 特性

- **中英双语**：开箱即用。默认语言不带 URL 前缀，没有译文的内容自动回退到原文。
- **博客与书籍**：文章之外，还支持纯文件组织的书籍，带章节、分组、书籍目录和上一章 / 下一章导航。章节可以用 Markdown 或 MDX 编写。
- **面向技术写作的 Markdown**：代码标签组、提示块、折叠块、步骤指引、Mermaid 图（配色跟随深浅模式，画风可以在图里指定）和可滚动的代码块，语法示例见 [`src/data/books/getting-started/markdown-test.md`](./src/data/books/getting-started/markdown-test.md)。
- **站内搜索**：基于 Pagefind，所有语言的索引合在一起搜。
- **阅读体验**：目录、阅读时长、图片灯箱、进场动画、打字机式的站点标题、可选的全站背景图，以及首页那张显示访客本地时间和天气的欢迎卡。
- **字体自托管**（Google Sans Code 和 Noto Sans SC），不向第三方字体服务器发请求。
- **SEO 齐全**：站点地图、RSS、自动生成 OG 分享图和 JSON-LD 结构化数据。
- **只有一个配置文件**：所有设置都在 [`astro-template.config.ts`](./astro-template.config.ts)，每个字段都有注释。

整体结构沿用 AstroPaper，方便跟进上游更新。有一处不同要知道：内容放在 `src/data/`（AstroPaper 较早版本的做法），而不是 `src/content/`。

## 快速开始

```bash
npm create astro@latest -- --template kuops/astro-template
```

CI 使用的 Node.js 版本是 24。create-astro 会自动安装依赖。

## 写内容

### 博客文章

在 `src/data/blog/` 里放一个 `.md` 或 `.mdx` 文件：

```yaml
---
title: Hello World
pubDatetime: 2026-06-08
description: 一段简短的摘要，显示在列表和 meta 标签里。
tags: [astro, blog]
---
```

`title`、`pubDatetime` 和 `description` 是必填的，其余 frontmatter 字段见 [`src/content.config.ts`](./src/content.config.ts)。

### 书籍

`src/data/books/` 下的每个顶层目录是一本书，目录结构就是它的目录：

```text
src/data/books/astro-guide/
  index.md            # 书籍元数据
  basics/
    _index.md         # 分组元数据
    intro.md          # 一个章节
    installation.md
  advanced/
    _index.md
    components.md
```

- `index.md` 是书籍的元数据；不分组的书可以没有 `_index.md`。
- 链接其它章节时写绝对路径，如 `/books/astro-guide/basics/installation`，不要用相对路径。
- 书籍首页直接显示第一章，所以第一章有两个网址。
- 章节可以是 `.md` 或 `.mdx`。MDX 章节里可以用变量、表达式和组件；标签组和步骤指引的标记改写成 `<Tab label="…" />`、`<TabsEnd />`、`<Steps />`、`<StepsEnd />`，其余增强写法不变，见 [`src/data/books/getting-started/mdx-test.mdx`](./src/data/books/getting-started/mdx-test.mdx)。

### 多语言

`site.lang` 指定默认语言，`i18n.locales` 列出启用的语言。默认语言的内容放在原位置，译文放在以语言代码命名的子目录里：

```text
src/data/blog/hello.md
src/data/blog/en/hello.md
```

相对路径相同的文件会被视为同一内容的译文。路径不同时，在 frontmatter 里给它们设置相同的 `translationKey`。没有译文的内容仍会出现在另一种语言的列表里，并标明原文语言。

## 配置

所有设置都在 [`astro-template.config.ts`](./astro-template.config.ts)：

| 字段            | 用途                                                                        |
| :-------------- | :-------------------------------------------------------------------------- |
| `site`          | 站点地址、标题、描述、作者、语言、时区、强调色，以及可选的背景图            |
| `i18n.locales`  | 启用的语言，默认语言由 `site.lang` 指定                                     |
| `posts`         | 文章列表页每页的篇数（`perPage`）和首页显示的篇数（`perIndex`）             |
| `features`      | 各种开关：深浅模式、初始主题、归档页、目录、搜索、进场动画、打字机标题等    |
| `layout`        | 三档布局宽度：阅读栏、浏览栏、导航带                                        |
| `weather.proxy` | 天气卡的可选代理地址，留空则使用 Open-Meteo                                 |
| `socials`       | 页脚显示的链接；带 `image` 的项点开后显示这张图片（如微信二维码），不再跳转 |
| `shareLinks`    | 文章的分享按钮                                                              |

换背景图时先把新图转成 WebP。第二个参数是输出文件名，沿用原来的名字就不用改配置：

```bash
npm run webp -- new-image.png site-background-light
```

## 项目结构

| 路径                                                   | 是什么                                                                                 |
| :----------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `astro-template.config.ts`                             | 站点配置                                                                               |
| `astro.config.ts`                                      | Astro 配置：字体、Markdown 处理流程和集成                                              |
| `src/data/blog/`, `src/data/books/`, `src/data/pages/` | 内容                                                                                   |
| `src/pages/`                                           | 路由                                                                                   |
| `src/i18n/`                                            | 多语言工具和界面文案（`lang/zh.ts`、`lang/en.ts`）                                     |
| `src/custom/`                                          | 放你自己的东西：`Head.astro`、`BodyEnd.astro`、`PostEnd.astro`。模板更新不会动这些文件 |
| `src/utils/books.ts`                                   | 从文件系统推导书籍结构、侧边栏和章节顺序                                               |
| `scripts/`                                             | 构建配套脚本：搜索索引和图片转换                                                       |
| `workers/weather-proxy.js`                             | 可选的天气代理，部署为 Cloudflare Worker                                               |

## 部署

`npm run build` 会依次做类型检查、构建站点和生成搜索索引，产物在 `dist/`，是纯静态的，发布这个目录即可。

- **Vercel**：导入仓库即可，会自动识别 Astro，不用配置；每次 push 到生产分支都会自动部署。
- **其它静态托管**也都可以，比如 Netlify、Cloudflare 或 GitHub Pages。部署在子路径下时（如 `<user>.github.io/<repo>`），在 `astro.config.ts` 里设置 `base: "/<repo>/"`。
- 部署前把 `astro-template.config.ts` 里的 `site.url`、`title`、`description`、`author` 改成你自己的。

## 许可证

基于 [MIT License](./LICENSE) 发布。感谢 [Sat Naing](https://satnaing.dev) 和 [AstroPaper 的贡献者们](https://github.com/satnaing/astro-paper/graphs/contributors)。
