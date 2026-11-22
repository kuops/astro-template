---
title: "安装"
description: "安装指南"
order: 2
---

## 环境要求

确保你的系统满足以下要求：

- Node.js 18+
- npm 9+

## 安装步骤

运行以下命令完成安装：

<!--tab:npm-->

```bash
npm install
```

<!--tab:pnpm-->

```bash
pnpm install
```

<!--tab:yarn-->

```bash
yarn install
```

## 验证安装

```bash
npm run dev
```

## 多语言标签组

同一个功能在不同语言下的调用方式，也适合用标签组展示：

<!--tab:TypeScript-->

```ts
const response = await fetch("/api/hello", {
  method: "POST",
  body: JSON.stringify({ name: "Astro" }),
});
```

<!--tab:Python-->

```python
import requests

response = requests.post(
    "/api/hello",
    json={"name": "Astro"},
)
```

<!--tab:Curl-->

```bash
curl -X POST /api/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "Astro"}'
```

> [!NOTE]
> 标签组的写法：代码块前一行加 `<!--tab:标签名-->` 注释标记，连续多个成组；
> 中间隔开普通段落则各自独立，单个标记的代码块按普通代码块渲染。
