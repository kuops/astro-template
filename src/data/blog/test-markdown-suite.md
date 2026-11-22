---
title: "Markdown 渲染测试全集"
pubDatetime: 2026-11-22T02:00:00Z
description: "Markdown 渲染能力全集测试：Callout、折叠块、代码标签组（含多块 Tab）、增强语法与基础渲染元素。"
tags:
  - 测试
  - markdown
---

本页合并了原先分散的多个渲染测试：Callout、折叠块、代码标签组、增强语法与基础渲染元素。

## Callout 提示框

Callout 是 Obsidian 风格的提示框语法，通过 `rehype-callouts` 插件支持。在 blockquote 的第一行使用 `[!TYPE]` 标记：

> [!NOTE]
> 这是一条注释提示，用于补充说明重要但非关键的信息。

> [!TIP]
> 这是一条小贴士，提供有助于更好使用功能的建议。

> [!WARNING]
> 这是一条警告信息，提醒你注意可能出问题的地方。

> [!CAUTION]
> 这是一条危险警告，提醒你操作可能导致严重后果。

> [!INFO]
> 这是一条信息提示，用于提供额外的上下文信息。

> [!IMPORTANT]
> 这是一条重要提示，强调必须注意的关键信息。

### 嵌套 Markdown

Callout 内部支持正常的 Markdown 语法：

> [!TIP]
> 你可以在 callout 内部使用 **加粗**、_斜体_、`代码` 等格式。
>
> 甚至可以列出要点：
>
> - 第一点
> - 第二点
> - 第三点

### 可折叠 Callout

> [!NOTE]+ 点击展开
> 这是一个可以折叠/展开的 callout，默认展开。
> 标题后面的 `+` 表示默认展开，`-` 表示默认折叠。

> [!WARNING]- 默认折叠的警告
> 这个 callout 默认是折叠状态，点击标题才会展开。
> 适合放一些不常用但重要的参考信息。

### 与普通引用的区别

普通 blockquote 不会触发 callout 渲染：

> 这是一条普通的引用文字，没有 callout 类型标记，所以它只是普通的引用样式。
>
> — 某人

只有以 `[!TYPE]` 开头的 blockquote 才会被渲染为 callout。

## 折叠块（Details）

HTML 原生 `<details>/<summary>` 写法，适合收纳长表格或补充说明：

<details>
<summary>展开查看全部全局参数</summary>

| 参数                  | 类型   | 说明                     |
| --------------------- | ------ | ------------------------ |
| `--output <format>`   | string | 输出格式：`text`、`json` |
| `--timeout <seconds>` | number | 请求超时时间（秒）       |
| `--quiet`             | switch | 隐藏非必要输出           |

</details>

折叠块内部支持完整的 Markdown（表格、列表、代码块），首尾保留空行即可。

## 代码标签组

### 单块写法

`<!--tab:标签-->` 紧跟一个代码块，连续多对会组成一组。紧接着还要写多块组时，给单块组也加上 `<!--tabs-end-->`。

<!--tab:yarn-->

```bash
yarn add astro
```

<!--tab:npm-->

```bash
npm install astro
```

<!--tab:pnpm-->

```bash
pnpm add astro
```

<!--tabs-end-->

### 多块写法（tabs-end）

用 `<!--tab:标签-->` 开始新标签，用 `<!--tabs-end-->` 收尾。每个标签可以包含标题、代码块和段落。

<!--tab:安装 SDK-->

### 安装 SDK

```bash
# 安装最新版本
pip install example-sdk
```

### 验证安装

```python
import example_sdk

print(example_sdk.__version__)
```

<!--tab:使用示例-->

### 初始化客户端

```python
from example_sdk import Client

client = Client(api_key="YOUR_API_KEY")
print(client.hello())
```

段落也可以放进 Tab 里，不止代码块。

<!--tabs-end-->

## 步骤指引（Steps）

`<!--steps-->` 包住一段有序列表，每项以加粗标题开头、空行后接内容，渲染为"编号圆圈 + 连接竖线"的步骤条。步骤体内可嵌套标签组、代码块、列表等任意元素。

<!--steps-->

1. **准备环境**

   确认 [Node.js](https://nodejs.org) 已安装，查看版本：

   ```bash
   node --version
   ```

2. **安装依赖**

   在项目目录中选择任意包管理器：

   <!--tab:npm-->

   ```bash
   npm install
   ```

   <!--tab:pnpm-->

   ```bash
   pnpm install
   ```

   <!--tabs-end-->

3. **启动开发服务器**

   ```bash
   npm run dev
   ```

   - 支持嵌套普通列表
   - 以及 `行内代码` 与**加粗**

<!--steps-end-->

对照：标记外的普通有序列表不受影响。

1. 普通列表项一
2. 普通列表项二

## 代码块限高（scroll）

围栏 info string 加 `scroll` 关键词，超长代码块限高 30rem 内部滚动；`scroll=值` 自定义高度（支持 px / rem / vh 等）。未标记的代码块保持全高。

```json scroll
{
  "name": "example-config",
  "dependencies": {
    "alpha-core": "^2.1.0",
    "beta-router": "^5.4.2",
    "gamma-parser": "^1.9.7",
    "delta-cache": "^3.0.5",
    "epsilon-log": "^2.7.1",
    "zeta-http": "^4.2.0",
    "eta-queue": "^1.3.9",
    "theta-store": "^6.0.2",
    "iota-stream": "^2.2.8",
    "kappa-auth": "^3.5.4",
    "lambda-cron": "^1.1.6",
    "mu-config": "^2.9.3",
    "nu-validate": "^4.4.1",
    "xi-metric": "^1.8.2",
    "omicron-trace": "^3.3.7"
  },
  "scripts": {
    "dev": "example dev --port 3000",
    "build": "example build --target node18",
    "test": "example test --coverage",
    "lint": "example lint --max-warnings 0"
  }
}
```

`scroll=160`：自定义 160px，内容明显超高时同样内部滚动。

```bash scroll=160
echo "第一行"
echo "第二行"
echo "第三行"
echo "第四行"
echo "第五行"
echo "第六行"
echo "第七行"
echo "第八行"
echo "第九行"
echo "第十行"
echo "第十一行"
echo "第十二行"
```

对照：未标记的代码块全高展开，不限高。

```bash
echo "完全展开，不受 scroll 影响"
```

## 增强语法

### GFM 自动链接

裸 URL 自动变为可点击链接：访问 https://github.com 了解更多。

<test@example.com> 尖括号邮箱链接。

### 脚注

这里引用一个单行脚注[^simple]和一个多行脚注[^multi]。

[^simple]: 这是一个简单的单行脚注。

[^multi]:
    这是多行脚注的第一行。
    这是第二行（缩进 4 个空格保持连续）。

> **已知限制：** 同一行出现两个脚注引用 `[^name]` 时，`remark-supersub` 会把两个 `^` 误配对为上标。建议每行只使用一个脚注引用。

### 上标和下标

数学公式：E = mc^2^；化学分子式：H~2~O、CO~2~；序数词：1^st^、2^nd^。

单个 `~` 是下标（H~2~O），双个 `~~` 是删除线（~~已过期~~），两者不冲突。

### 高亮文本

这是 ==重要内容== 请注意。混合使用：**加粗** 和 ==高亮== 和 _斜体_ 和 ~~删除线~~。

### 表格增强

| 语法   | 插件                  | 写法       | 渲染结果          | 类型 |
| ------ | --------------------- | ---------- | ----------------- | ---- |
| 上标   | remark-supersub       | `x^2^`     | x<sup>2</sup>     | 扩展 |
| 下标   | remark-supersub       | `H~2~O`    | H<sub>2</sub>O    | 扩展 |
| 高亮   | remark-mark-highlight | `==text==` | <mark>text</mark> | 扩展 |
| 删除线 | remark-gfm            | `~~text~~` | ~~text~~          | GFM  |

### 行内 HTML

键盘快捷键：<kbd>Ctrl</kbd> + <kbd>C</kbd>；缩写：<abbr title="HyperText Markup Language">HTML</abbr>。

### 转义字符

\*不是斜体\*、\_不是斜体\_、\~不是下标\~、\^不是上标\^、\==不是高亮\==

## 基础渲染

### 标题与文本

**加粗**、_斜体_、**_加粗斜体_**、~~删除线~~，以及带有**嵌套*样式*的**文本。

### 列表

- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

1. 第一步
2. 第二步
   1. 子步骤 A

- [x] 已完成任务
- [ ] 未完成任务

### 引用

> 外层引用
>
> > 内层引用
>
> ```js
> console.log("引用中的代码");
> ```

### 代码块与高亮

```ts file="src/utils/helper.ts"
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
```

```ts {2,4}
const a = 1;
const b = 2; // 这行应该高亮
const c = 3;
const d = 4; // 这行应该高亮
const e = 5;
```

```ts
const added = "new line"; // [!code ++]
const removed = "old line"; // [!code --]
const message = "hello world"; // [!code word:hello]
```

### 表格与图片

| 功能     | 支持状态 | 备注             |
| -------- | -------- | ---------------- |
| 标题     | ✅       | H1-H6            |
| 列表     | ✅       | 有序、无序、任务 |
| 代码高亮 | ✅       | Shiki            |

| 左对齐 |  居中  | 右对齐 |
| :----- | :----: | -----: |
| 内容 A | 内容 B | 内容 C |

![示例图片](https://picsum.photos/seed/test/600/300)

### HTML 混排

<div style="background: var(--purple-hsl); padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <p style="margin: 0;">这是嵌入的 HTML 内容</p>
</div>

---

**测试完成！** 本页覆盖 Markdown 的主要渲染能力。
