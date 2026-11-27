# AstroPaper Template

<p align="center">
  <img src=".github/preview.webp" alt="AstroPaper Template" width="752">
</p>

A bilingual (Chinese/English) blog and documentation starter built on [AstroPaper](https://github.com/satnaing/astro-paper) and [Astro](https://astro.build). Content is plain Markdown. There is no CMS and no database.

English | [简体中文](./README.zh-CN.md)

## Features

- **Bilingual sites.** Chinese and English out of the box. The default language has no URL prefix, and content without a translation falls back to the original.
- **Blogs and books.** Posts, plus file-based books with chapters, groups, a book index and previous/next navigation. Chapters can be written in Markdown or MDX.
- **Markdown for technical writing.** Code tabs, callouts, collapsible blocks, steps, Mermaid diagrams (colors follow the light/dark mode, the look can be set per diagram) and scrollable code blocks. See [`src/data/books/getting-started/markdown-test.md`](./src/data/books/getting-started/markdown-test.md) for the syntax.
- **On-site search** powered by Pagefind, with the indexes of all languages merged.
- **Reading experience.** Table of contents, reading time, image lightbox, enter animation, typewriter site title, an optional site-wide background image, and a home-page card with the visitor's local time and weather.
- **Self-hosted fonts** (Google Sans Code and Noto Sans SC), so no request goes to a third-party font server.
- **SEO built in:** sitemap, RSS, auto-generated OG images and JSON-LD.
- **One config file.** Every setting is in [`astro-template.config.ts`](./astro-template.config.ts), with a comment on each field.

AstroPaper's overall structure is kept, so upstream changes are easy to follow. One difference to know about: content lives in `src/data/`, as in earlier AstroPaper versions, rather than in `src/content/`.

## Quick Start

```bash
npm create astro@latest -- --template kuops/astro-template
```

Node.js 24 is the version used in CI. create-astro installs the dependencies for you.

## Writing Content

### Blog posts

Drop a `.md` or `.mdx` file into `src/data/blog/`:

```yaml
---
title: Hello World
pubDatetime: 2026-06-08
description: A short summary, shown in lists and meta tags.
tags: [astro, blog]
---
```

`title`, `pubDatetime` and `description` are required. The other frontmatter fields are listed in [`src/content.config.ts`](./src/content.config.ts).

### Books

Each top-level folder under `src/data/books/` is a book, and the folder structure is its table of contents:

```text
src/data/books/astro-guide/
  index.md            # book metadata
  basics/
    _index.md         # group metadata
    intro.md          # a chapter
    installation.md
  advanced/
    _index.md
    components.md
```

- `index.md` holds the book's metadata, and a book without groups can skip `_index.md`.
- Link to other chapters with absolute paths such as `/books/astro-guide/basics/installation`, not relative ones.
- A book's landing page shows its first chapter, so that chapter has two URLs.
- Chapters can be `.md` or `.mdx`. An MDX chapter can use variables, expressions and components; the code tabs and steps markers become `<Tab label="…" />`, `<TabsEnd />`, `<Steps />` and `<StepsEnd />`, while every other enhancement keeps its syntax. See [`src/data/books/getting-started/mdx-test.mdx`](./src/data/books/getting-started/mdx-test.mdx).

### Translations

`site.lang` sets the default language, and `i18n.locales` lists the enabled ones. Content in the default language stays where it is. Translations go in a folder named after their locale:

```text
src/data/blog/hello.md
src/data/blog/en/hello.md
```

Files with the same relative path are treated as translations of each other. If the paths differ, give them the same `translationKey` in the frontmatter. Content without a translation still shows up in the other language's lists, marked with its original language.

## Configuration

All settings live in [`astro-template.config.ts`](./astro-template.config.ts):

| Field           | Purpose                                                                                                                  |
| :-------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `site`          | URL, title, description, author, language, timezone, accent color and the optional background image                      |
| `i18n.locales`  | Enabled languages. The default one is `site.lang`                                                                        |
| `posts`         | Posts per list page (`perPage`) and on the home page (`perIndex`)                                                        |
| `features`      | Toggles such as dark mode, initial theme, archives, table of contents, search, enter animation and typewriter title      |
| `layout`        | The three layout widths: reading, browse and chrome                                                                      |
| `weather.proxy` | Optional proxy for the weather card. Leave it empty to use Open-Meteo                                                    |
| `socials`       | Links shown in the footer; an entry with `image` opens that image on click (e.g. a WeChat QR code) instead of navigating |
| `shareLinks`    | Share buttons on posts                                                                                                   |

To replace the background image, convert the new one first. The second argument is the output name, so reusing the current name means the config needs no change:

```bash
npm run webp -- new-image.png site-background-light
```

## Project Structure

| Path                                                   | What it is                                                                                                   |
| :----------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `astro-template.config.ts`                             | Site configuration                                                                                           |
| `astro.config.ts`                                      | Astro configuration: fonts, Markdown pipeline and integrations                                               |
| `src/data/blog/`, `src/data/books/`, `src/data/pages/` | Content                                                                                                      |
| `src/pages/`                                           | Routes                                                                                                       |
| `src/i18n/`                                            | Locale helpers and UI strings (`lang/zh.ts`, `lang/en.ts`)                                                   |
| `src/custom/`                                          | Your own additions: `Head.astro`, `BodyEnd.astro`, `PostEnd.astro`. Template updates leave these files alone |
| `src/utils/books.ts`                                   | Derives book structure, sidebar and chapter order from the file system                                       |
| `scripts/`                                             | Build helpers for the search index and image conversion                                                      |
| `workers/weather-proxy.js`                             | Optional weather proxy, deployed as a Cloudflare Worker                                                      |

## Deployment

`npm run build` type-checks, builds the site and generates the search index. The output in `dist/` is fully static, so publish that directory.

- **Vercel:** import the repository. Astro is detected, so nothing needs configuring, and every push to the production branch deploys.
- **Any other static host** works too, such as Netlify, Cloudflare or GitHub Pages. For a sub-path like `<user>.github.io/<repo>`, set `base: "/<repo>/"` in `astro.config.ts`.
- Before deploying, change `site.url`, `title`, `description` and `author` in `astro-template.config.ts` to your own.

## License

Released under the [MIT License](./LICENSE). Made with appreciation for [Sat Naing](https://satnaing.dev) and the [AstroPaper contributors](https://github.com/satnaing/astro-paper/graphs/contributors).
