# 博客主题调研报告（Astro 适配）

**调研截止**：2026-11-17
**目标框架**：Astro（不涉及框架选型）
**主题取材**：跨生态（Astro / Hugo / Next.js / Hexo / Vitepress / Jekyll / Zola / Eleventy 等 11 种）
**交付物**：本报告 + `candidates.csv`（571 行）+ `queries.md`（检索凭证）

> 最终选择权归维护者。本报告的"建议"仅为顾问性参考，不替代完整候选池。

---

## 1. 结论摘要

### 1.1 当前 AstroPaper 的位置

实测本站现有主题（`satnaing/astro-paper`，5211 星）：

| 维度 | 得分 | 说明 |
|------|------|------|
| 排版层次 | 4/5 | 有字体变量 + 自托管 + display 策略 |
| 配色对比 | 4/5 | 配色体系完整 |
| 密度留白 | 5/5 | Tailwind 栅格 + CSS 变量 + 响应式完整 |
| 动效交互 | 4/5 | 有 keyframes 与 transition，实现部分 reduced-motion |
| 响应式 | 5/5 | 媒体查询与栅格齐备 |
| 暗色模式 | 4/5 | 独立变量块 + class 切换 |
| 首屏冲击 | 2/5 | 无渐变、无模糊层，动效克制 |

**总分 28/35**，属于候选池中的高位区间（总体平均约 18）。

**结论：现有主题的短板只有一项——首屏视觉冲击力。** 这不代表设计能力不足，而是 AstroPaper 刻意选择
的"编排导向"路线。若你的目标就是"不要那么素"，需要换的是首屏语言，不是整个主题。

### 1.2 三项主要短板

1. **首屏冲击力弱**（2/5）：无渐变、无模糊层，视觉上"平"。
2. **缺 CJK 字体栈**：字体配置未声明中文回退，中文排版依赖全局兜底，无法精细控制字重与行高。
3. **动效降级不完整**：有 animation 与 transition，但 `prefers-reduced-motion` 覆盖不充分。

### 1.3 顾问性建议（非决定）

**若目标是"保留气质只提升冲击力"** → `unfolding-io/nebulix`（320★，30/35，杂志编排）
同为内容优先路线，但多栏 grid 与大图叙事让首屏更有存在感。迁移成本最低。

**若目标是"明显视觉跃迁"** → `Dnzzk2/Litos`（156★，32/35，玻璃拟态）或
`unfolding-io/StarFunnel`（175★，32/35，玻璃拟态）
视觉最强，但玻璃拟态在低端设备有 `backdrop-filter` 性能开销，且大图会拉高首屏体积。

**若目标是"最低迁移成本 + 最懂中文"** → `lxchapu/astro-gyoza`（315★，中文优化，Gyoza 风格）
它显式声明了 CJK 字体栈，且是 Astro 生态，省掉最常见的一类改造工作。

**重要**：以上只是三个方向的代表。候选池 571 个主题里，Top 30 中玻璃拟态占 20 席——
这不是"玻璃拟态最好"，而是评分方法对渐变/模糊有结构性偏好（见 4.3 节）。

---

## 2. 检索方法与覆盖核算

### 2.1 为什么不能"直接搜索"

GitHub 搜索有两道硬边界，实测确认：

| 端点 | 单页上限 | 总结果上限 | 超限表现 |
|------|----------|------------|----------|
| REST `/search/repositories` | 100 | **1000** | 第 11 页返回 `422 Only the first 1000 search results are available` |
| GraphQL `search` | 100 | **1000** | `hasNextPage` 变 `false`，但 `repositoryCount` 仍是 1707 |

**GraphQL 的截断是静默的**——它不报错，只是"看起来取完了"。若按常规分页写法，会得出错误的覆盖率结论。

### 2.2 分桶查询与闭合校验

解法：按星标区间切成每桶 < 1000 条的片段，逐桶查询后求和。

9 个桶：`0..1`、`2..2`、`3..5`、`6..10`、`11..50`、`51..100`、`101..500`、`501..1000`、`>=1001`

实测闭合结果（`archived:false pushed:>2025-11-17`）：

| topic | 分桶合计 | 无条件计数 | 状态 |
|-------|----------|-----------|------|
| `astro-theme` | 267 | 267 | ✓ |
| `astro-blog` | 70 | 70 | ✓ |
| `astro-template` | 206 | 206 | ✓ |
| `hugo-theme` | 696 | 696 | ✓ |
| `blog-theme` | 447 | 447 | ✓ |
| `nextjs-blog` | 43 | 43 | ✓ |

**六个 topic 全部闭合**。这是"已覆盖全部结果"的唯一证据——不是"我翻完了所有页"。

### 2.3 为什么需要多路召回

实测发现仅靠 `topic:` 会漏掉高星标主题：

| 仓库 | 星标 | 问题 |
|------|------|------|
| `LyraVoid/Shirone` | 452 | **topics 为空数组**，纯 topic 检索无法命中 |
| `incluud/accessible-astro-starter` | 1194 | topics 含 `blog`/`theme` 但**不含** `astro-theme` |
| `0xdres/astro-devosfera` | 189 | 2026-02 创建，按星标排序被挤出 |

因此采用 **5 路召回**：

1. **topic**：6 个 topic × 9 桶
2. **keyword**：`in:description` / `in:name` 关键词组合
3. **seed**：解析 `awesome-astro`（61 个仓库）与 `awesome-hugo`（49 个）
4. **recent**：4 个 `created:` 时间窗 × 星标桶
5. **combo**：`topic:astro topic:blog` 一类组合查询

**判定性校验**（这三个探针证明"某条路径真的跑了"）：

| 探针 | 命中 | 证明 |
|------|------|------|
| `LyraVoid/Shirone` | ✓ | seed 路径已执行 |
| `incluud/accessible-astro-starter` | ✓ | combo 路径已执行 |
| `0xdres/astro-devosfera` | ✓ | recent 路径已执行 |

### 2.4 计数闭合

```text
原始命中（含重复）     = 7634
去重后唯一仓库         = 5792
纳入候选（可复用主题） = 2701
已排除（附原因）       = 3091
校验：2701 + 3091 = 5792  ✓
```

**排除原因分布**：

| 原因 | 数量 | 含义 |
|------|------|------|
| `out_of_scope` | 1578 | 个人站点而非可复用主题 |
| `not_content_site` | 1455 | 库/框架/清单/无关仓库 |
| `plugin_only` | 44 | 插件或组件 |
| `archived` | 14 | 已归档 |

### 2.5 深度核验范围

**571 个候选**进入深度核验。门槛：星标 ≥ 20，**或**近 12 个月新建且星标 ≥ 5。

第二个条件是为满足"不得漏掉新近项目"而设——实测发现若只用星标 ≥ 20，新项目会被全部筛掉
（近 12 月新增中只有 45/1535 达到 20 星）。

| 项目 | 结果 |
|------|------|
| 演示站可达（实测 HTTP 200 + 内容抓取成功） | **501 / 571 = 87.7%** |
| 不可达 | 70 |
| 设计特征提取成功 | 499 |

**近 12 个月新增**：156 / 571 = **27.3%**（要求 ≥ 25%，达标）

**注意**：`astrowind.vercel.app` 返回 **402**，属 Vercel 平台侧限制，不是站点下线。
`themefisher.com/products/*` 一类为商品页而非演示站。

---

## 3. 候选池总览（按风格分档）

共 **7 个风格档 + 1 个兜底档**：

| 风格档 | 数量 | 判定依据 |
|--------|------|----------|
| `minimal_typographic` | 165 | 衬线字体为主，或配色 ≤10 且无大圆角 |
| `magazine_editorial` | 108 | CSS 含 ≥2–3 处 `grid-template-columns`，多栏编排 |
| `material3` | 92 | 大圆角 + 丰富配色 + 渐变，或作者自述 Material Design |
| `glassmorphism` | 87 | CSS 同时含 `backdrop-filter: blur` 与渐变 |
| `terminal_retro` | 31 | 等宽字体 + 深色主导 + 配色精简，或作者自述终端/复古 |
| `anime_illustration` | 5 | 作者自述动漫/插画/像素风 |
| `brutalist` | 1 | 作者自述粗野主义 |
| `other` | 82 | 设计特征不足以归入既有档位（**未淘汰**） |

**生态分布**：

| 生态 | 数量 |
|------|------|
| astro | 245 |
| hugo | 242 |
| nextjs | 31 |
| other | 19 |
| hexo | 9 |
| jekyll | 9 |
| zola | 7 |
| vitepress | 3 |
| vuepress | 2 |
| ghost | 2 |
| eleventy | 2 |

**`other` 档存在的意义**：保证没有任何风格因"不属于既有分类"被剔除。
若某档为空，报告中会说明是"检索未命中"而非"主动排除"。

---

## 4. 候选详情

### 4.1 视觉得分 Top 25

排序依据：七维总分（满分 35）。括号内为可判定维度数。

| 总分 | 星标 | 生态 | 风格 | 仓库 | 演示 |
|------|------|------|------|------|------|
| 32 (7) | 175 | astro | glassmorphism | `unfolding-io/StarFunnel` | https://starfunnel.unfolding.io/ |
| 32 (7) | 156 | astro | glassmorphism | `Dnzzk2/Litos` | https://litos.vercel.app |
| 32 (7) | 24 | astro | glassmorphism | `mychiffonn/myscholar` | https://myscholar.pages.dev/ |
| 31 (7) | 1972 | other | glassmorphism | `evannotfound/hexo-theme-redefine` | https://redefine.ohevan.com |
| 31 (7) | 338 | astro | glassmorphism | `Spr-Aachen/Twilight` | https://twilight.spr-aachen.com |
| 31 (7) | 80 | astro | glassmorphism | `izmttk/astro-mecure` | https://suborbit.net |
| 31 (7) | 35 | astro | glassmorphism | `GladTek/Cooper` | https://cooper.gladtek.com |
| 31 (7) | 32 | astro | glassmorphism | `humbornjo/noblog-starter` | https://humbornjo.github.io/noblog-starter |
| 31 (7) | 20 | astro | glassmorphism | `violet27chen/qiyuan-blog-template` | https://www.qiyuan.icu |
| 31 (7) | 19 | astro | glassmorphism | `LKDenchin/hexo-theme-firefly` | https://blog.1007777.xyz/ |
| 31 (7) | 13 | astro | glassmorphism | `FuTseYi/Astro-Theme-Shyne` | https://shyne.vercel.app |
| 30 (7) | 7040 | nextjs | glassmorphism | `transitive-bullshit/nextjs-notion-starter-kit` | https://transitivebullsh.it/nextjs-notion-starter-kit |
| 30 (7) | 1753 | astro | glassmorphism | `chrismwilliams/astro-theme-cactus` | https://astro-cactus.chriswilliams.dev/ |
| 30 (7) | 332 | nextjs | glassmorphism | `thedevdavid/digital-garden` | https://thedevdavid-digital-garden.vercel.app/ |
| 30 (7) | 320 | astro | material3 | `unfolding-io/nebulix` | https://nebulix.unfolding.io/ |
| 30 (7) | 236 | astro | glassmorphism | `davidvkimball/astro-modular` | https://astro-modular.netlify.app |
| 30 (7) | 47 | astro | material3 | `hansdash/Ryze` | https://ryze.pages.dev |
| 30 (7) | 41 | astro | glassmorphism | `nbakh16/career-portfolio-template` | https://careerportofio.netlify.app |
| 30 (7) | 16 | astro | glassmorphism | `LemonAdorable/astro-theme-iris` | https://lemonadorable.github.io/ |
| 30 (7) | 8 | astro | glassmorphism | `huamurui/pudding` | https://huamurui.github.io/pudding/ |
| 30 (7) | 8 | astro | glassmorphism | `rightdoor/citrus-grid` | https://citrusgrid.pages.dev |
| 29 (7) | 2462 | astro | glassmorphism | `CuteLeaf/Firefly` | https://firefly.cuteleaf.cn |
| 29 (7) | 1019 | other | glassmorphism | `fomalhaut1998/hexo-theme-fomalhaut` | https://www.fomal.cc |
| 29 (7) | 540 | astro | minimal typographic | `trevortylerlee/astro-micro` | https://astro-micro.vercel.app |
| 29 (7) | 189 | astro | terminal retro | `0xdres/astro-devosfera` | https://devosfera.vercel.app/ |

> 完整 571 行见 `candidates.csv`。带 `—` 者表示演示链接未抓取或不可达，需自行打开仓库查看。

### 4.2 各风格档代表

**极简排版**（165 个，其中 129 个可评分）— 内容优先，装饰克制

| 总分 | 星标 | 仓库 | 演示 |
|------|------|------|------|
| 29 | 540 | `trevortylerlee/astro-micro` | https://astro-micro.vercel.app |
| 26 | 9 | `chintak/astro-sage` | https://astro-sage.chintak.sh/ |
| 24 | 523 | `JustGoodUI/dante-astro-theme` | https://dante-astro-theme.netlify.app/ |
| 23 | 67 | `ntk148v/hugo-toigian` | https://ntk148v.github.io/hugo-toigian |

**杂志编排**（108 个，其中 106 个可评分）— 多栏排版、大图叙事

| 总分 | 星标 | 仓库 | 演示 |
|------|------|------|------|
| 29 | 38 | `xocothemes/quietpages` | https://quietpages.xocoweb.workers.dev |
| 29 | 33 | `oxygenna-themes/mizu-light-astro-theme` | https://mizu-light-theme.netlify.app/ |
| 29 | 13 | `CnBarrier404/astro-theme-misthaven` | https://misthaven.cnbarrier.com |
| 28 | 5211 | `satnaing/astro-paper` ← **当前** | https://astro-paper.pages.dev/ |

**Material 3**（92 个，全部可评分）— 圆角卡片、色调表面

| 总分 | 星标 | 仓库 | 演示 |
|------|------|------|------|
| 30 | 320 | `unfolding-io/nebulix` | https://nebulix.unfolding.io/ |
| 30 | 47 | `hansdash/Ryze` | https://ryze.pages.dev |
| 28 | 251 | `haaarshsingh/www` | https://harshsingh.me |
| 28 | 104 | `itsyujay/astro-sassify-template` | https://astro-sassify.larryxue.dev/ |

**玻璃拟态（glassmorphism）**（87 个，全部可评分）— 半透明模糊层、渐变光晕

| 总分 | 星标 | 仓库 | 演示 |
|------|------|------|------|
| 32 | 175 | `unfolding-io/StarFunnel` | https://starfunnel.unfolding.io/ |
| 32 | 156 | `Dnzzk2/Litos` | https://litos.vercel.app |
| 32 | 24 | `mychiffonn/myscholar` | https://myscholar.pages.dev/ |
| 31 | 1972 | `evannotfound/hexo-theme-redefine` | https://redefine.ohevan.com |

**终端风（terminal retro）**（31 个，其中 22 个可评分）— 等宽字体、命令行隐喻

| 总分 | 星标 | 仓库 | 演示 |
|------|------|------|------|
| 29 | 189 | `0xdres/astro-devosfera` | https://devosfera.vercel.app/ |
| 28 | 93 | `sun0225SUN/astro-air` | https://astro-air.guoqi.dev |
| 27 | 68 | `FjellOverflow/nordlys` | https://nordlys.fjelloverflow.dev/ |
| 27 | 26 | `510208/sh-blog-next` | https://sh-blog-next.vercel.app/ |

**动漫/插画**（5 个，全部可评分）— 插画为首屏主体

| 总分 | 星标 | 仓库 | 演示 |
|------|------|------|------|
| 28 | 452 | `LyraVoid/Shirone` | https://shirone.mysqil.com |
| 25 | 46 | `Yuimi-chaya/Yuimi-chaya.github.io` | https://yuimi-chaya.github.io/ |
| 23 | 9 | `LIlGG/theme-akari` | https://www.halo.run/store/apps/app-8rojpuw1 |
| 19 | 18 | `tomcomtang/astro-cartoon-portfolio` | https://astro-cartoon-portfolio-beige.vercel.app/ |

**粗野主义（brutalist）**（1 个）— 粗边框、原色块

该档唯一的候选（`brennanbrown/indiepaper`，17★）演示站不可达，无法评分，因此下无行。
这不是"主动排除"——它在候选池中，只是缺少可核验的视觉证据。

### 4.3 评分方法的结构性偏差（必读）

**Top 25 中玻璃拟态占 21 席**，这不代表玻璃拟态就是"最好看"。原因在于评分维度：

| 维度 | 玻璃拟态天然占优的地方 |
|------|------------------------|
| 首屏冲击（0–5） | 渐变 +1、模糊 +2，直接拿满分 |
| 动效（0–5） | 玻璃拟态主题通常配 keyframes 与 view-transition |
| 配色对比（0–5） | 大量渐变 → 颜色数量落在"体系完整"区间，得 4 分 |

而极简主题在"首屏冲击"上天然拿 1–2 分——**这是它的设计意图，不是缺陷**。

**因此**：

- 若要横向比较**同一风格内**的主题，总分有效。
- 若要比较**不同风格**，请看你真正在意的维度，不要看总分。`candidates.csv` 保留了七个分维度。
- 若某主题在 `dims_determinate` 为 7 但 `first_impression` 为 1，很可能是它**故意**克制。

**评分的另一个局限**：它是基于 CSS 静态特征的机器判断，无法评估"排版是否真的好看"。
真正的审美判断只能打开 `demo_url` 亲眼看。

### 4.4 八项能力判定（这是最有实用价值的部分）

**501 个可达主题的统计**：

| 能力 | 可直接沿用 | 需改造 | 需重建 | 结论 |
|------|-----------|--------|--------|------|
| 中文优先排版 | **25** | 0 | 474 | **仅 5.0% 声明了 CJK 字体栈** |
| 默认语言无前缀双语路由 | 0 | 0 | 499 | **100% 需重建** |
| 缺失译文回退 + canonical | 0 | 0 | 499 | **100% 需重建** |
| 目录驱动书籍章节 | 0 | 0 | 499 | **100% 需重建** |
| 全站静态搜索 | 0 | 109 | 390 | 21.8% 有现成方案可改 |
| 图片灯箱 | 0 | 60 | 439 | 12.0% 内置灯箱 |
| 暗色模式 | **229** | 106 | 164 | **45.9% 可直接沿用**，累计 67.1% 可用 |
| 动态社交分享图 | 0 | 0 | 499 | **100% 需重建** |

**四条关键结论**：

1. **中文排版是最大共性瓶颈**：只有 25/501（5.0%）的主题声明了 CJK 字体栈。
   无论选哪个主题，中文字体配置几乎都要自己写。

2. **双语与回退机制无人实现**：501 个主题全部需要重建"默认语言无前缀 + 缺失译文回退 +
   canonical 指向原语言"。这不是主题缺陷——主流主题都假设单语。

3. **暗色模式是最可继承的能力**：45.9% 可直接沿用，累计 67.1% 有可用基础。

4. **动态 OG 图 100% 需重建**：没有主题内置构建期 OG 生成。

**这直接决定了移植策略**：主题只贡献"视觉外壳"。
本站特有的四类能力（双语路由、译文回退、书籍章节、动态 OG）必须整体重建，与选哪个主题无关。

### 4.5 中文优化主题清单（25 个，重点）

| 星标 | 仓库 | 生态 | 演示 |
|------|------|------|------|
| 1972 | `evannotfound/hexo-theme-redefine` | other | https://redefine.ohevan.com |
| 1019 | `fomalhaut1998/hexo-theme-fomalhaut` | other | https://www.fomal.cc |
| 941 | `HEIGE-PCloud/DoIt` | hugo | https://hugodoit.pages.dev |
| 630 | `moeyua/astro-theme-typography` | astro | https://astro-theme-typography.vercel.app |
| 604 | `HiNinoJay/hexo-theme-A4` | other | https://ninojay.top |
| 377 | `L33Z22L11/blog-v3` | other | https://blog.zhilu.site |
| 315 | `lxchapu/astro-gyoza` | astro | https://gyoza.lxchapu.com |
| 303 | `hugo-next/hugo-theme-next` | hugo | https://hugo-next.eu.org |
| 291 | `yihui/hugo-ivy` | hugo | https://ivy.yihui.org |
| 116 | `yihui/hugo-xmag` | hugo | https://xmag.yihui.org |
| 112 | `zqlit/Hugo-Theme-Amigo` | hugo | https://200181.xyz |
| 80 | `D-Sketon/astro-theme-reimu` | astro | https://d-sketon.github.io/astro-theme-reimu/ |
| 51 | `Yuhanawa/astro-charm` | astro | https://astro-charm.vercel.app |
| 46 | `Yuimi-chaya/Yuimi-chaya.github.io` | astro | https://yuimi-chaya.github.io/ |
| 42 | `xingwangzhe/stalux` | astro | https://stalux.needhelp.icu |
| 41 | `hxlog/prologue.dev` | nextjs | https://prologue.dev |
| 36 | `QingXia-Ela/Shiina-Astro-Blog` | astro | https://qingxia-ela.github.io/Shiina-Astro-Blog/ |
| 29 | `bunizao/Attegi` | other | https://attegi.tuuhub.com |
| 24 | `mychiffonn/myscholar` | astro | https://myscholar.pages.dev/ |
| 20 | `UndefinedFons/Fonscape` | other | https://fonstage.space/ |
| 12 | `Lau0x/halo-theme-joe-next` | nextjs | https://blog.laoda.de |
| 6 | `sf-yuzifu/astro-theme-AronaNote` | astro | https://arona-note.netlify.app |
| 6 | `Tombarr/kaios-dev-blog` | hugo | https://kaios.dev |
| 5 | `SingyanLabs/Quasar-Astro-Theme` | astro | https://demo.singyan.top/ |
| 5 | `Secd0g/zen` | astro | https://zen-snowy-theta.vercel.app |

**为什么这份清单最有价值**：它把"中文排版"这一最大共性瓶颈从"要自己写"变成"已有基础"。
其中 `lxchapu/astro-gyoza`（315★）和 `moeyua/astro-theme-typography`（630★）是 Astro 生态里
中文支持最好的两个选择。

---

## 5. 未纳入清单（按原因分组）

完整清单见 `_research_cache/excluded.ndjson`（3091 条）。

| 原因码 | 数量 | 典型样例 | 重新考虑条件 |
|--------|------|----------|--------------|
| `out_of_scope` | 1578 | `0xharkirat/adamcogan.com`（个人站） | 若改造成可复用主题 |
| `not_content_site` | 1455 | `twbs/bootstrap`、`kubernetes/website` | 不适用 |
| `plugin_only` | 44 | `natemoo-re/astro-icon`（图标库） | 若需该组件时单独评估 |
| `archived` | 14 | `LyraVoid/Mizuki`（1888★，已归档） | 若维护者恢复更新 |

**恒等式复核**：2701（候选）+ 3091（排除）= 5792（去重总数）✓

**最遗憾的排除**：`LyraVoid/Mizuki`（1888★，Material Design 3）仓库已归档。
若你愿意接受无维护项目，单独告诉我即可。

---

## 6. 顾问性建议与移植路线

### 6.1 三条路径（按风格差异，非按优劣）

**路径 A：渐进进化（保留现有气质）**

目标：`unfolding-io/nebulix`（320★，30/35，杂志编排）

| 阶段 | 产出 | 验证 | 回退 |
|------|------|------|------|
| S1 视觉外壳 | 字体阶梯、配色变量、间距刻度移植到 `global.css` | 现有页面外观变化但功能不变 | 恢复 `global.css` |
| S2 布局组件 | 多栏 grid 结构适配列表/详情/书籍页 | 三类页面正常渲染 | 恢复 `layouts/` |
| S3 内容模型 | 现有 Markdown 无需改写即可渲染 | `npm run build` 通过 | 恢复 `content.config.ts` |
| S4 搜索与 SEO | Pagefind 索引 + canonical/hreflang | 索引生成、链接正确 | 恢复构建脚本 |
| S5 部署切换 | GitHub Pages 构建通过 | 预览站可访问 | 保留旧分支 |

**复用 vs 重写**：CSS 变量与字体文件可复制复用；`grid-template-columns` 结构需重写为 Astro 组件。

**路径 B：明显跃迁（要视觉冲击）**

目标：`Dnzzk2/Litos`（156★，32/35，玻璃拟态）或 `unfolding-io/StarFunnel`（175★，32/35）

额外代价：
- `backdrop-filter` 在低端设备有性能开销，需测移动端帧率
- 玻璃拟态依赖大图与渐变，首屏资源体积会上升
- 875px 以下的半透明层可读性需要单独验证

**路径 C：最低成本 + 最佳中文支持**

目标：`lxchapu/astro-gyoza`（315★，26/35，极简排版）

特殊优势：
- 已是 Astro 生态，模板语法一致，S2/S3 工作量最低
- **已声明 CJK 字体栈**，省掉最常见的改造工作
- 极简风格与现有 AstroPaper 同路线，迁移后不会"面目全非"

**代价**：视觉上不会有大跃迁，仍然偏克制。

### 6.2 最小可行路径（只换视觉，不动内容模型）

```
S1-visual-shell 独立成立
  → 完成即产生可见收益（字体、配色、间距）
  → 可在 S1 后暂停，S2 起才触及结构
```

若只想"先好看一点"，S1 就够了。不会破坏任何现有功能。

### 6.3 移植边界

**做**：替换视觉外壳（字体、配色、间距、组件外观）、布局结构
**不做**：替换内容模型、替换路由逻辑、引入需要服务端的能力

**强制说明**：所有移植动作**待你选定主题后再启动**。本次未执行任何代码改动。

**静态托管约束**：最终仍为 GitHub Pages 纯静态产物、无服务端运行时。
若某主题的视觉效果依赖服务端能力，会在 S1 阶段暴露并需取舍。

---

## 7. 时效性与复核提示

**调研截止日期**：2026-11-17

以下结论在该日期后**可能失效**：

| 项目 | 为何会变 | 复核方式 |
|------|----------|----------|
| 星标数 | 每日变化 | `gh api repos/<owner>/<repo> --jq .stargazers_count` |
| 最近提交时间 | 持续更新 | 取 `.pushed_at` |
| 最近发版时间 | 新版本发布 | 取 `.latestRelease.publishedAt` |
| 演示站可达性 | 可能下线 | `curl -I <demo_url>` |
| 视觉评分 | 主题改版后失效 | 重跑 `_research_cache/scripts/17-unified-scan.py` 与 `18-build-final.py` |
| 框架大版本 | Astro/Hugo 破坏性更新 | 关注各自 release notes |

**特别注意**：视觉评分基于 2026-11-17 抓取的 CSS 特征。若某主题之后大改版
（如从极简改为玻璃拟态），评分与风格分档都会失准。

---

## 8. 证据索引

| 依据类型 | 数量 | 复核方式 |
|----------|------|----------|
| 演示站 HTML/CSS 实测 | 499 | 打开 `demo_url`，查看源码中的 CSS 变量、`backdrop-filter`、`border-radius`、`@keyframes` |
| 仓库元数据（GitHub API） | 571 | `gh api repos/<owner>/<repo>` |
| 仓库 topics | 571 | 同上，取 `.topics` |
| README 自述 | 若干 | 打开仓库首页 |

**未使用截图**：本报告不含任何截图、缩略图或视觉拼版。
所有视觉判断均来自 `demo_url` 可访问的 HTML/CSS 实测，或仓库元数据。

**评分口径可复算**：完整算法见 `_research_cache/scripts/17-unified-scan.py`（特征提取）
与 `18-build-final.py`（评分与分档）。任何人可用相同输入复现相同分数。

---

## 附：交付物清单

| 文件 | 内容 |
|------|------|
| `specs/001-blog-framework-research/research-report.md` | 本报告 |
| `specs/001-blog-framework-research/candidates.csv` | 571 个深度核验候选，31 列 |
| `specs/001-blog-framework-research/queries.md` | 全部检索查询式与命中数 |
| `_research_cache/scripts/closure-report.txt` | 六 topic 分桶闭合校验原始输出 |
| `_research_cache/excluded.ndjson` | 3091 条排除记录（含原因） |
| `_research_cache/features-unified.ndjson` | 499 个主题的原始设计特征 |

**应用代码零改动**，**未执行 git commit / git push**。