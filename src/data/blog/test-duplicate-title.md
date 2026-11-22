---
title: "Markdown 渲染功能测试"
pubDatetime: 2026-06-08T12:00:00Z
description: 与 test-markdown-rendering 同名的重复标题测试文章，用于验证同名文章不会产生重复的视图过渡名。
tags:
  - test
  - markdown
hideToc: true
---

这是一篇**故意与 `test-markdown-rendering` 同名**的测试文章（C04 场景）。

修复前，文章卡片与文章页的视图过渡名（view-transition-name）由标题派生——两篇同名文章
会在同一列表页产生重复的过渡名，导致浏览器视图过渡动画错乱。

修复后，过渡名改由文章 id（文件名）派生，天然唯一。验证方法：构建产物中搜索
`view-transition-name`，同名标题的两篇文章应各自拥有不同的过渡名。

## C10 场景：hideToc 篇级开关

本文 frontmatter 设置了 `hideToc: true`，且正文含两个 h2 标题——按默认逻辑本应显示
目录，但篇级开关优先，因此本页**不应出现侧边栏 TOC，也不应出现移动端浮动目录按钮**。

## 又一个 h2（凑足触发阈值）

保证目录触发条件（≥2 个 h2/h3）成立，从而证明 hideToc 的抑制效果是真实的。
