# OmniWriter · 多平台 AI 创作工作台

> **一个素材 + 你的判断 → AI 写母稿 → 自动适配九个平台 → 一键复制 / 下载发布。**
> 中文写作、多平台排版的一体化工作台，面向创作者：公众号、X、知乎、小红书、B站、CSDN、Reddit、Hacker News、Product Hunt。

OmniWriter 是一套**开放**的创作 Agent：给它素材和你的立场，它按内置编辑准则与事实核查规则生成母稿，再按每个平台的形态、篇幅、钩子、证据要求逐稿改写，让你专注「判断」，把「搬运 / 排版 / 分发」交给 AI。

## 为什么是 OmniWriter

- **一稿多投，不是复制粘贴**：不是把同一篇机械地跨平台发，而是为每个平台重写钩子、长度、证据、CTA（X ≤240 字、HN 用 Show HN 文本帖、PH 用 Maker Comment 字段化…）。
- **AI 只负责执行，判断留给你**：论点、角度、立场由你给；模型遵循内嵌的编辑准则（论点先行、去 AI 味、真实图片作证、生态竞争落具体）。
- **开放**：模型走标准 Anthropic 兼容接口，默认连 MiniMax-M3，`.env.local` 换个 key 就能换成任意模型；数据纯本地，随时导出 HTML / ZIP 带走。

## 功能

- **创作指令面板**：素材类型 / 素材 / 角度 / 语气 / 长度 / 标题方向 / 平台 / CTA / 双语 → 一键生成母稿。
- **Tiptap 编辑器**：中文友好的极简工具栏（标题 / 加粗 / 引用 / 列表 / 代码 / 图片）；粘贴或拖拽图片自动弹图注对话框（契合「图 N｜描述。图片来源：…」）；字数实时显示，自动保存到浏览器。
- **编辑准则校验条**：编辑区上方实时检查 h1 数量、图片编号、AI/营销标签词，按高 / 中 / 低分级。
- **公众号实时预览**：石墨风（纯白 / 近黑 / 软灰 / 无装饰），行内样式（公众号会剥离 `<style>`），移动端 / 桌面切换；一键复制正文（富文本 + 纯文本双格式）。
- **多平台适配**：九平台逐个改写，钩子 / 长度 / 证据 / CTA 各自重写。
- **ZIP 导出**：服务端构建 `article.html`（带复制按钮）+ 母稿 md + 图片目录，离线也可发布。
- **设置**：默认平台、双语、语气、公众号系列标题 / Eyebrow / 署名、新闻 Eyebrow。
- **文章存档**：localStorage 持久化，本地优先，断网可用。

## 快速开始

> 💡 最省事：双击 **`dev.command`**（或终端运行 **`./dev.sh`**）——自动补依赖、启动并打开浏览器。

1. 打开 `http://localhost:3000` → 右上角「设置」→「**AI 模型**」，粘贴你的 **API Key**（默认接 MiniMax 接口，Base URL / 模型可按需改）。密钥只存在你的浏览器本地，改完即生效，无需重启。
2. 回首页**选一个 Agent** → 贴素材 → 标发布地点 → 点「生成母稿」。

> 也可以用 `.env.local` 的 `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL` / `ANTHROPIC_MODEL` 作为**服务端兜底**（老方式，`pnpm dev` 即可）。

未配 key 也能用：编辑器、预览、平台稿、ZIP 导出都正常，只是 AI 生成不可用（界面会引导你在设置里填密钥）。

## 环境变量

> 可选的服务端兜底：日常使用在「设置 → AI 模型」填你的密钥即可，无需配置这里。

```bash
ANTHROPIC_API_KEY=...                # 必需：AI 模型的 key
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic   # 默认：pen.dev 同款接口
ANTHROPIC_MODEL=MiniMax-M3           # 默认
FETCH_TIMEOUT_MS=15000               # 抓取新闻链接的超时
```

## 使用流程

1. 首页是 **Agent 市场**：选一张卡片（极速新闻 / 观点随笔 / 项目首发 / 小红书种草…）→ 自动建文章并进入工作台。
2. 左栏极简表单：贴素材 + 标发布地点（可选「高级」打开语气 / 长度 / 角度 / CTA）→ 一键生成母稿。
3. 中栏 Tiptap 编辑器微调；可粘贴 / 拖拽图片（自动弹图注）。
4. 右栏：公众号实时预览 + 复制正文 + 校验条。
5. 切换平台 Tab → 逐平台适配 → 微调 → 复制文案。
6. 底部「下载 ZIP」拿到 `article.html`（带复制按钮）+ `article.md` + `images/`。

工作台做了响应式：桌面是三栏（指令 / 编辑 / 预览），窄屏自动折叠为「指令 / 编辑 / 预览 / 平台」顶部分 Tab；侧栏可收起给编辑区腾空间。

## 技术栈

- **Next.js 14**（App Router）+ **TypeScript** + **Tailwind CSS**
- **Tiptap 2**（编辑器 + character-count + image + placeholder）
- **Zustand**（状态 + localStorage，含持久化防抖与失败兜底）
- **@anthropic-ai/sdk**（AI，服务端调用，默认 MiniMax-M3）
- **JSZip**（仅服务端 ZIP 打包，不进客户端 bundle）
- **lucide-react**（图标）

## 目录

```text
.
├── app/                  Next.js App Router（首页 / 工作台 / 设置 / api）
├── components/           UI 组件（AppShell / Editor / BriefPanel / PreviewPane / PlatformTabs / ui/*）
├── src/lib/              内置内容模块
│   ├── ai.ts             MiniMax-M3 客户端 + 提示词
│   ├── editorial.ts      编辑准则 + 事实核查 + 石墨风 CSS + 校验
│   ├── platforms.ts      九平台规范
│   ├── export-html.ts    HTML 构建 / 富文本复制（客户端安全）
│   ├── export-zip.ts     ZIP 打包（服务端）
│   ├── store.ts          Zustand store + 持久化
│   └── config.ts         默认配置（用户配置在浏览器 localStorage）
├── tailwind.config.ts    设计令牌（石墨色 + 中文字体栈）
└── .env.local.example    环境变量模板
```

## 设计原则

- 石墨风：纯白 / 近黑 `#1d1d1f` / 软灰 `#f5f5f7`，无蓝色强调、无渐变、无玻璃感、无大圆角装饰。
- 16px 起、约 1.7 行高、中文字体栈（PingFang SC / Hiragino Sans GB / Microsoft YaHei），移动端输入框 16px 防 iOS 缩放。
- 文末主张句而非空泛总结；按钮动词开头；空白状态指明下一步。
- 开放优先：AI 接口可换、数据本地化、一稿多投。

## 路线图

- [ ] 图片上传 / 拖拽 → 自动嵌入 + 图注
- [ ] 文章导出为 GitHub repo（gh CLI 或 API）
- [ ] 同步设置到云端（账号）
- [ ] AI 改稿（「这段太 AI」→ 局部重写）
- [ ] 实时协作