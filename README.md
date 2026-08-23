# AI-Native Creator Platform（AI 原生创作者平台）

把任意素材（**指定新闻链接 / GitHub 项目 / 观点话题 / 已有文案**）按你的创作指令，自动编排成一套**多平台可发布内容包**的 skill 套件：公众号母稿 + X/Twitter、Reddit、Hacker News、知乎、CSDN、Product Hunt、B站、小红书 的适配稿与一键复制发布页。

> 由 `github-vibe-wechat` 泛化而来：不再只服务 GitHub 项目，而是覆盖你公众号的**全部内容渠道**——新闻链接渠道、自有项目渠道、推荐项目渠道、观点随笔渠道。

## 结构

```text
github-vibe-wechat/                 # 平台根目录（= 入口 skill：creator-platform）
├── SKILL.md                        # 入口路由：素材类型 → 子 skill
├── agents/openai.yaml              # 入口 UI 元数据
├── README.md                       # 本文件
├── config/
│   └── creator.yaml                # ★ 用户自配置中心（默认平台、双语、系列名、作者签名、存档、引擎路径）
├── references/                     # 平台共享参考
│   ├── workflow.md                 # 端到端流程
│   ├── editorial-guide.md          # 编辑准则（去 AI 味、论点主线、图证）
│   ├── platforms.md                # 各平台适配规则与校验清单
│   └── brief.md                    # 创作指令卡模板
├── skills/                         # ★ 模块化子 skills（各自可独立配置、独立安装）
│   ├── news-to-content/            # 【新闻链接渠道】指定新闻/事件 + 指令 → 多平台内容
│   ├── topic-essay/                # 【观点随笔渠道】主题 + 指令 → 观点长文
│   ├── project-launch/             # 【自有项目渠道】你的 GitHub/Vibe Coding 项目 → 中英双语全平台发布
│   ├── project-recommend/          # 【推荐项目渠道】别人的开源项目 → 中立推荐包
│   └── content-engine/             # 渲染引擎封装（调用 wechat-silicon-editor 构建脚本）
├── scripts/
│   └── install.sh                  # 幂等安装/升级/卸载 skills
└── articles/                       # 文章存档（按 slug 归档）
```

## 安装

```bash
# 1. 克隆（若尚未克隆）
git clone https://github.com/frankfika/github-vibe-wechat.git
cd github-vibe-wechat

# 2. 安装 skills（默认同时装到 ~/.agents/skills 与 ~/.codex/skills）
./scripts/install.sh

# 3. 按需：安装渲染引擎（公众号+全平台排版引擎，来自 frankfika/wechat-silicon-editor）
./scripts/install.sh --engine
```

安装后，在 DSH / Codex / Claude 会话里即可自动发现以下 skills：

| skill | 触发场景 |
|---|---|
| `creator-platform` | 入口路由：给素材+指令，自动分诊 |
| `news-to-content` | 新闻链接 / 事件 / 资讯 → 按你的指令写多平台文章 |
| `topic-essay` | 观点、话题、随笔 |
| `project-launch` | 你自己的 GitHub 项目发布 |
| `project-recommend` | 推荐别人的开源项目 |
| `content-engine` | 排版已有文案 / 调用渲染引擎 |

## 配置

只改一个文件即可定制平台默认行为：`config/creator.yaml`（安装后位于 `~/.agents/skills/creator-platform/config/creator.yaml`，改这份生效；仓库内的是默认模板）。可配置项：

- `default_platforms`：默认产出哪些平台
- `bilingual`：是否默认中英双语
- `series_title` / `author_signature`：系列标题前缀、文末签名
- `archive_root`：文章存档目录
- `engine_root`：渲染引擎路径（默认 `~/.codex/skills/wechat-silicon-editor`）
- `voice`：默认文风口径（relaxed / editorial / technical…）

## 使用示例

> 「按这条新闻写一篇公众号文章 + 小红书：https://xxx/yyy —— 角度是'英伟达为什么加注 SSI'，语气 relaxed，标题不要'重磅'，配图用新闻原文截图」

> 「把 InstantFlow 做成全平台发布包，中英双语」

> 「帮我写一篇观点文：AI 时代的文章编辑应该长什么样」

每个子 skill 都支持"素材 + 创作指令"驱动；指令缺项时按各自口径补齐，关键分歧会先问你。

## 依赖

- 渲染引擎：`frankfika/wechat-silicon-editor`（`install.sh --engine` 自动克隆；构建脚本需要 `python3 + beautifulsoup4`，Markdown 输入需要 `pandoc`）
- 无需其他运行时。

## 路线图（可选演进）

- Web 版创作台：同一套 skills 之上包一层 GUI（素材输入 → 指令卡 → 实时预览 → 一键复制）。
- 更多渠道 skill：短剧脚本、播客文案、视频口播稿等。
