# Pencil · 中文写作与多平台排版

pen.dev 风格的写作工作台，专为公众号、X、知乎、小红书、B站、CSDN、Reddit、Hacker News、Product Hunt 设计。给素材 + 你的判断，AI 写母稿，逐平台适配，一键复制 / 下载 HTML+ZIP 离线发布。

> 这是一个**独立 Web App**，不是 skill 包。所有编辑/平台/事实核查规则都收编进 App 的内置模块（`src/lib/editorial.ts`、`src/lib/platforms.ts`）。

## 功能

- **创作指令面板**：素材类型 / 素材 / 角度 / 语气 / 长度 / 标题 / 平台 / CTA / 双语 → 一键生成母稿
- **Tiptap 编辑器**：中文友好的极简工具栏；支持标题、加粗、列表、引用、图片、行内代码；自动保存到浏览器
  - **粘贴 / 拖拽图片** 自动插入并弹图注对话框（契合"图 N｜描述。图片来源：…"格式）
  - **字符 / 词数** 实时显示在工具栏右下
- **Markdown 校验条**：编辑区上方实时显示 h1 数量、图片编号、AI/营销标签词问题，按高/中/低分级
- **公众号实时预览**：石墨风（纯白 / 近黑 / 软灰 / 无装饰），行内样式（公众号会剥离 `<style>`），移动端/桌面切换
- **一键复制公众号正文**：ClipboardItem 写入富文本（HTML + 纯文本双格式），file:// 下 `execCommand` fallback
- **多平台适配**：九平台逐个改写，钩子/长度/证据/CTA 各自重写（X ≤240 字、HN Show HN、PH Maker Comment 等规则内嵌）
- **ZIP 导出**（服务端构建）：包含公众号 HTML（带复制按钮）、母稿 md、图片目录
- **设置**：默认平台、双语、语气、公众号系列/Eyebrow/署名、新闻 Eyebrow
- **文章存档**：localStorage 持久化（本地优先）

## 技术栈

- **Next.js 14**（App Router）+ **TypeScript** + **Tailwind CSS**
- **Tiptap 2**（编辑器 + character-count + image + placeholder）
- **Zustand**（状态 + localStorage）
- **@anthropic-ai/sdk**（AI；服务端调用，默认走 pen.dev 同款的 `https://api.minimaxi.com/anthropic`，模型 `MiniMax-M3`）
- **JSZip**（仅服务端 ZIP 打包，不进客户端 bundle）
- **lucide-react**（图标）

代码组织：
- `src/lib/export-html.ts` — 客户端安全的 HTML / 富文本复制（无 Node-only 依赖）
- `src/lib/export-zip.ts` — 服务端 ZIP 打包（JSZip）
- `src/lib/ai.ts` — 服务端 AI 客户端 + 提示词
- `src/lib/fetch.ts` — 客户端安全的 URL 抓取

## 快速开始

```bash
pnpm install
cp .env.local.example .env.local
# 在 .env.local 填入 ANTHROPIC_API_KEY（MiniMax 的 key）
pnpm dev
# 打开 http://localhost:3000
```

## 环境变量

```bash
ANTHROPIC_API_KEY=...                # 必需：AI 模型的 key
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic   # 默认：pen.dev 同款
ANTHROPIC_MODEL=MiniMax-M3           # 默认
FETCH_TIMEOUT_MS=15000               # 抓取新闻链接的超时
```

未配 `ANTHROPIC_API_KEY` 也能用：编辑器、预览、平台稿、ZIP 导出都正常，只是 AI 生成不可用。

## 使用流程

1. 首页点"从一条新闻开始"或"写一篇观点" → 自动建文章并跳到工作台
2. 左栏填创作指令（素材 + 角度 + 语气 + 长度 + 平台 + CTA）→ 点"生成母稿"
3. 中栏 Tiptap 编辑器微调文稿；可粘贴 / 拖拽图片（自动弹图注）
4. 右栏上半：公众号实时预览 + 复制按钮 + 校验条
5. 右栏下半：切换平台 Tab → 点"适配此平台" → 微调 → 复制
6. 底部"下载 ZIP" 拿到 `article.html`（带复制按钮）+ `article.md` + `images/`

## 目录

```text
.
├── app/                  Next.js App Router
│   ├── page.tsx          首页（文章列表 + 新建）
│   ├── article/[id]/     编辑工作台
│   ├── settings/         设置
│   └── api/              generate / adapt / fetch / export
├── components/           UI 组件（AppShell / Editor / BriefPanel / PreviewPane / PlatformTabs / ui/*）
├── src/lib/              内置内容模块
│   ├── types.ts          类型
│   ├── config.ts         默认配置（用户配置在浏览器 localStorage）
│   ├── store.ts          Zustand store
│   ├── ai.ts             MiniMax-M3 客户端 + 提示词
│   ├── editorial.ts      编辑准则 + 事实核查 + 石墨风 CSS + 校验
│   ├── platforms.ts      九平台规范
│   └── export.ts         HTML 构建 / 富文本复制 / ZIP
├── tailwind.config.ts    设计令牌（石墨色 + 中文字体栈）
└── .env.local.example    环境变量模板
```

## 设计原则（应用自身也遵守 pen.dev 的 better-typography / better-writing）

- 16px 起、1.7 行高、移动端输入框 16px 防止 iOS 缩放
- 中文优先字体栈：`-apple-system / PingFang SC / Hiragino Sans GB / Microsoft YaHei`
- 文末主张句而非空泛总结；按钮动词开头；空白状态指明下一步
- 无蓝色强调、无渐变、无玻璃感、无大圆角装饰

## 路线图

- [ ] 图片上传/拖拽 → 自动嵌入 + 图注
- [ ] 文章导出为 GitHub repo（gh CLI 或 API）
- [ ] 同步设置到云端（账号）
- [ ] AI 改稿（"这段太 AI"→ 局部重写）
- [ ] 实时协作
