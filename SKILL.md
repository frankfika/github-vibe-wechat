---
name: creator-platform
description: AI 原生的多平台创作者平台入口 skill。把任意素材（指定新闻/事件、GitHub 项目、观点话题、已有文案）按用户的创作指令，自动编排成一套多平台可发布的公众号/X/知乎/小红书/B站/CSDN/Reddit/Hacker News/Product Hunt 内容包（AI-native creator platform，文章编辑与排版，多平台发布）。触发词：「帮我写篇文章」「按这条新闻写」「根据这个新闻生成」「把我这个项目发全平台」「做一篇公众号+小红书」「创作指令」「多平台发布」「creator-platform」。根据素材类型自动路由到 skills/ 下的子 skill。
---

# AI-Native Creator Platform（AI 原生创作者平台）

这是创作者平台的**入口路由 skill**。它不做具体写作，而是判断素材类型、加载对应的子 skill、统一走渲染引擎，把"素材 + 你的指令"变成"一套可直接复制的多平台发布包"。

## 路由：素材类型 → 子 skill

| 你给的素材 | 走哪个子 skill | 产出 |
|---|---|---|
| **指定新闻 / 事件 / 资讯**（URL、文本、截图、PDF、链接）+ 你的创作指令 | `$news-to-content` | 事实核查 → 母稿（公众号长文）→ 各平台改编 → 发布页 |
| **你自己的 GitHub / Vibe Coding 项目** | `$project-launch` | 中英双语全平台发布包（公众号+X长文+全平台） |
| **别人的开源 / 第三方项目**（推荐、评测、介绍） | `$project-recommend` | 中立推荐包（身份边界规则） |
| **观点 / 话题 / 随笔**（无外部素材，只要主题和指令） | `$topic-essay` | 观点长文 + 各平台改编 |
| **已有文案，只排版不发散** | `$content-engine`（或直接 `wechat-silicon-editor`） | 保真排版 + 一键复制 HTML/ZIP |

无法确定素材类型时，先问用户一句素材是什么、要发到哪些平台，再路由。

## 平台（全部由渲染引擎自动产出）

公众号（WeChat Official Account）为母稿平台；按需产出 **X/Twitter（短帖+长文+配图）、Reddit、Hacker News、知乎、CSDN、Product Hunt、B站、小红书** 的 Markdown/HTML 发布页，每页带分字段一键复制、配图复制/下载、官方发布入口链接。中英双语项目产出 `-zh`/`-en` 双版本（见 `config/creator.yaml` 的 `bilingual`）。

## 统一工作流（每个子 skill 都遵守）

1. **读配置**：先读 `config/creator.yaml`（本机用户自配置；不存在则用默认值）——系列名、默认平台、语种、作者签名、存档路径、引擎路径。
2. **接素材 + 创作指令**：按 `references/brief.md` 的指令卡收集：素材、角度/立场、语气、长度、标题方向、平台清单、配图、行动号召。指令缺失时按各子 skill 的默认口径补齐，重要分歧问用户。
3. **事实层**（新闻类必做）：核查来源、区分"事实/来源声称/我的推断"，禁止编造引语与数字（详见 `skills/news-to-content/references/fact-check.md`）。
4. **母稿**：先写公众号母稿（编辑准则见 `references/editorial-guide.md`）。
5. **改编**：逐平台改写钩子、长度、证据与 CTA，禁止跨平台复制同一段文案（适配表见 `references/platforms.md`）。
6. **构建**：交给 `$content-engine` 用 `wechat-silicon-editor` 脚本构建 HTML/ZIP/发布页，跑严格编辑校验。
7. **交付**：Markdown 源稿、HTML 预览、图片目录、ZIP、各平台发布页；存档到 `config/creator.yaml` 的 `archive_root`（默认 `articles/<slug>/`）；提醒用户打开 HTML 用复制按钮，人工审阅后再在各平台发布。

## 用户自配置

- **`config/creator.yaml`**：平台级默认（默认平台清单、双语开关、系列标题、作者签名、存档位置、引擎路径）。
- **子 skill 内部**：每个 skill 的 `SKILL.md` 自带口径（如 `project-launch` 的 `Vibe Coding｜` 系列、`project-recommend` 的身份边界），用户可改。
- **安装/升级**：`scripts/install.sh` 把 `skills/` 幂等安装到 `~/.agents/skills`（DSH）与 `~/.codex/skills`（Codex）；渲染引擎缺失时 `$content-engine` 的 `ensure_engine.py` 自动从 GitHub 克隆 `frankfika/wechat-silicon-editor`。

## 渲染引擎依赖

所有子 skill 的构建阶段依赖 **`wechat-silicon-editor`**（公众号 + 全平台排版引擎，GitHub: `frankfika/wechat-silicon-editor`）。路径优先级：`config/creator.yaml` 的 `engine_root` → `~/.codex/skills/wechat-silicon-editor`。引擎缺失时由 `$content-engine` 负责安装（见 `skills/content-engine/SKILL.md`），不要自行重写引擎逻辑。
