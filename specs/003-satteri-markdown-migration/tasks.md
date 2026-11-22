---

description: "Task list: Sätteri Markdown 管线迁移"
---

# Tasks: Sätteri Markdown 管线迁移

**Input**: Design documents from `/specs/003-satteri-markdown-migration/`

**Prerequisites**: [plan.md](./plan.md)（必需）、[spec.md](./spec.md)（用户故事）、
[research.md](./research.md)、[data-model.md](./data-model.md)、
[contracts/markdown-pipeline-contract.md](./contracts/markdown-pipeline-contract.md)、
[quickstart.md](./quickstart.md)

**Tests**: spec 未要求 TDD。本特性的"测试"= quickstart V0–V9 校验，已拆为显式任务且
**不是可选的**——基线对比是零回归验收的唯一证据。

**Organization**: 按用户故事分组（US1 渲染零回归 / US2 依赖健康 / US3 构建效率）。
US1 与 US2 可先后独立验收；US3 依赖前两者完成。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件/无未完成依赖）
- **[Story]**: 所属用户故事
- 所有任务含精确文件路径

## 路径约定

- 重写插件：`src/utils/`（satteri 前缀命名，替换原 rehype 前缀文件）
- 基线快照：`_migration_baseline/`（gitignored，验证后删除）
- **禁止触碰**：`src/components/`（DOM 契约由插件保证）、i18n/路由配置、内容集合 schema

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 基线隔离与工作产物目录

- [x] T001 创建 `_migration_baseline/` 目录，并在仓库根 `.gitignore` 追加
      `_migration_baseline/` 条目（本特性唯一允许的仓库配置改动，
      per plan: Structure Decision）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 采集迁移前基线（US1/US3 验收的共同前提）并消除两个技术不确定性

**⚠️ CRITICAL**: T002 基线 MUST 在任何代码改动前执行，基线不可后补；
T003/T004 的结论决定 US1 插件实现路线

- [x] T002 执行 V0 基线采集：`time npm run build` 完整记录耗时；复制 6 个基线页产物
      HTML 到 `_migration_baseline/`（页面清单 per data-model.md
      `RenderRegressionMatrix.baseline_page` 固定 6 页：markdown-tips、
      test-markdown-enhanced、test-markdown-rendering、
      books/getting-started/markdown-test、mdx-test、en/mdx-test）；抄录 pagefind
      统计（语言/页面/词数）与耗时写入 `_migration_baseline/baseline.txt`
      （per quickstart V0）
- [x] T003 [P] sharp 异步最小实验（per research R6）：node 脚本验证 satteri hast
      visitor 内 `await sharp().metadata()` 是否被管线支持；结论（可行/降级方案）
      写入 `_migration_baseline/async-probe.txt`
- [x] T004 [P] mark 插件路线决策（per research R3）：尝试以 npm 安装
      `@mirrordown/sat-mark`（JSR 桥），node 实测 `==x==` → `<mark>` 且代码上下文
      不误伤；安装受阻或行为不符则判定走自写路线；结论写入
      `_migration_baseline/mark-route.txt`
- [x] T005 安装新依赖（per contracts C5）：`npm install @astrojs/markdown-satteri
      satteri-callouts`（+ T004 判定的 mark 包，若走包路线）；确认
      `package-lock.json` 同步（宪法：技术约束）

**Checkpoint**: 基线齐备、两个不确定性已决、新依赖在位

---

## Phase 3: User Story 1 - 读者浏览体验零回归 (Priority: P1) 🎯 MVP

**Goal**: 全部 Markdown 特性在 satteri 管线下渲染与基线一致

**Independent Test**: 6 个基线页 × 8 个验收场景对比全部通过
（data-model.md `RenderRegressionMatrix` 恒等式 1）

### 插件重写（可并行）

- [x] T006 [P] [US1] 创建 `src/utils/satteriMermaidBlock.ts`（一文件两插件，替代
      `src/utils/rehypeMermaidBlock.ts`）：`satteriMermaidBlock`（mermaid 代码块 →
      `div.mermaid-block`，MUST 逐字满足 contracts C4：`data-mermaid-key` 为源文本
      trim 后 djb2 hash 的 base36、骨架 span 结构、`--mermaid-lines:N`）与
      `satteriCodeLines`（`pre[data-language]` 注入 `--code-lines:N`）；
      接口形状 per contracts C2 与 data-model.md
      `SatteriPluginArtifact.input_contract/output_contract`
- [x] T007 [P] [US1] 创建 `src/utils/satteriImageDimensions.ts`（替代
      `src/utils/rehypeImageDimensions.ts`）：img 注入 `img-fade` class 与三源尺寸
      （优先级 per contracts C1.6：已有尺寸跳过 → query → 路径尾缀 → 本地文件
      sharp 读取；sharp 异步按 T003 结论执行，降级时记录于
      data-model.md `BuildBaseline.notes`）
- [x] T008 [P] [US1] mark 插件落地（按 T004 结论）：包路线则集成到配置；自写路线则
      创建 `src/utils/satteriMark.ts`（约 40 行，mdast text visitor）；
      **硬约束** per contracts C1.4：inline code 与 fenced code 内 `==`/`^`/`~`
      MUST 原样输出
- [x] T009 [P] [US1] `satteri-callouts` 集成预检：node 直调实测其输出 DOM，
      与 `_migration_baseline/` 中 callouts 片段对比（contracts C1.3）；不一致时
      制定 CSS 适配层方案（MUST NOT 改动内容或 `src/components/`）

### 集成与验证

- [x] T010 [US1] 插件级自测（per quickstart V3/V4）：对 T006–T008 各跑 node 直调
      satteri API 断言 + 代码上下文保护用例；全过方可进入配置切换
      （plan Stage B 门禁，data-model.md `SatteriPluginArtifact.self_test`）
- [x] T011 [US1] 切换 `astro.config.ts`：`markdown.processor` 改为
      `satteri({ features: { gfm: true, superscript: true, subscript: true,
      smartPunctuation: true }, mdastPlugins: […], hastPlugins: […] })`
      （配置形状逐字 per contracts C3；smartPunctuation 显式 true，不依赖默认，
      per research R7）；`shikiConfig` 及其余配置原样保留；移除 unified import 与
      remarkPlugins/rehypePlugins 数组
- [x] T012 [US1] 更新 `src/data/blog/test-markdown-enhanced.md`：移除
      "Table of contents" 标记段落（FR-008；验收 per SC-005：构建无错误、
      标记处合理降级为普通内容）
- [x] T013 [US1] 渲染回归对比（per quickstart V5/V6/V7）：`npm run build` 后逐页
      对比 `_migration_baseline/` 基线——6 页 × 8 场景（sup/sub、mark、GFM 混排、
      callouts、mermaid 骨架 DOM、行号、img 尺寸、smartPunctuation 字符集）+
      mermaid 客户端契约抽查（C4）+ MDX 双语页（C1.8）；判定 per data-model.md
      `RenderRegressionMatrix` 恒等式 1（全部 pass）；任一 fail 回 T006–T009
      修复后重跑，禁止带伤通过

**Checkpoint**: US1 可独立交付——渲染与基线一致（此时旧依赖尚未卸载，属 US2 范围）

---

## Phase 4: User Story 2 - 维护者依赖栈健康 (Priority: P1)

**Goal**: 移除全部 unified 生态依赖且无残留引用

**Independent Test**: V1/V2 通过（contracts C5：package.json 七包零残留、
配置与 src/ 零引用）且卸载后构建通过

- [x] T014 [US2] 卸载 7 个 unified 包（`npm uninstall @astrojs/markdown-remark
      remark-toc remark-collapse remark-supersub remark-gfm
      remark-mark-highlight rehype-callouts`）；删除旧插件文件
      `src/utils/rehypeMermaidBlock.ts` 与 `src/utils/rehypeImageDimensions.ts`；
      确认 lock 同步
- [x] T015 [US2] 残留引用清查（per quickstart V1/V2）：package.json 无七包
      （contracts C5）、`grep -cE 'unified|remarkPlugins|rehypePlugins'
      astro.config.ts` 为 0、`grep -rn` 七包名于 `src/` 命中数为 0
- [x] T016 [US2] 卸载后复验：`npm run build` 完整通过、产物页数与 T013 一致，
      确认无隐性引用断裂

**Checkpoint**: US2 可独立验收——依赖清单符合 C5、构建绿

---

## Phase 5: User Story 3 - 构建效率与产物完整 (Priority: P2)

**Goal**: 门禁全过、产物完整、耗时不劣化

**Independent Test**: V8 通过（三道门禁 + 产物统计满足基线恒等式）

- [x] T017 [US3] 完整三道门禁（per quickstart V8、宪法原则 II）：
      `npm run lint` → `npm run format:check` → `time npm run build` 依次通过，
      记录各步结果与总耗时
- [x] T018 [US3] 产物与耗时对比（per data-model.md `BuildBaseline` 恒等式 2/3）：
      pagefind 页数/语言/页面数与 before 相等、词数差 ≤ 2、构建耗时 ≤ 基线；
      结果写入 `_migration_baseline/after.txt`；任何恒等式不满足即排查回修

**Checkpoint**: 全部用户故事完成，SC-001–SC-005 证据齐备

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T019 [P] V9 收尾清查：`git status` 变更面核对（仅 astro.config.ts、
      src/utils/ 新旧文件、package.json/lock、test-markdown-enhanced.md、
      .gitignore、specs/）；汇总 data-model.md `SyntaxFeatureMapping.status`
      （全部 verified，或 degraded 附维护者确认）
- [x] T020 迁移报告与基线处置：向维护者汇报 V0–V9 结果与耗时对比；获确认后
      删除 `_migration_baseline/` 目录并移除 `.gitignore` 对应条目
      （per plan Stage E，属工作产物清理）；全程未执行 `git commit`/`git push`
      （宪法原则 V）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1；**T002 阻塞一切**（基线不可后补），
  T003/T004 可并行，T005 依赖 T004 结论
- **Phase 3 (US1)**: 依赖 Phase 2；T006–T009 可并行，T010 依赖 T006–T008，
  T011 依赖 T010 与 T005，T013 依赖 T011+T012
- **Phase 4 (US2)**: 依赖 T013（渲染验证通过后旧包才可卸载）
- **Phase 5 (US3)**: 依赖 Phase 4（终态验证）
- **Phase 6 (Polish)**: 依赖全部

### 关键阻塞链

```text
T002 (基线采集) ──> T003/T004 (并行决策实验) ──> T005 (装新依赖)
      └────────────────────────────────────────> T006–T009 (插件重写, 并行)
                                                      └─> T010 (插件自测)
                                                            └─> T011 (配置切换)
                                                                  └─> T013 (渲染对比)
                                                                        └─> T014 (卸旧) ─> T016
                                                                              └─> T017/T018 ─> T019/T020
```

### Parallel Opportunities

- Phase 2: T003、T004 可并行
- Phase 3: T006、T007、T008、T009 四路插件工作完全并行（不同文件）
- Phase 6: T19 与报告撰写可并行

---

## Implementation Strategy

### MVP First (仅 User Story 1)

1. Phase 1 + Phase 2（基线是生命线）
2. T006–T013 完成 US1：渲染已全面走 satteri 且与基线一致
   ——**此时即达到"零回归迁移"的主体价值**（旧依赖虽在位但已不被引用）
3. US2/US3 作为依赖清理与终态验收的增量

### Incremental Delivery

1. 基线 + 决策实验 → 不确定性消除
2. + US1 → 渲染迁移完成（MVP）
3. + US2 → 依赖栈健康（SC-002）
4. + US3 → 门禁与产物/耗时证据（SC-003/004）
5. + Polish → 证据汇总与清理

---

## Notes

- **全程禁止** `git commit` / `git push`（宪法原则 V）
- **全程禁止** 改动 `src/components/`（客户端 DOM 契约由插件侧保证，contracts C4）、
  i18n/路由、内容 schema
- 任一门禁失败 MUST 修复后重新完整执行三道门禁（宪法原则 II）
- `_migration_baseline/` 在 T020 获维护者确认前保留，是全部回归验收的证据
