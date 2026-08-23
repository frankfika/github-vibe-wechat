---
name: project-launch
description: 自有项目渠道 skill。把用户自己的 GitHub / Vibe Coding 项目做成中英双语、图片为证的全平台发布包：公众号母稿 + X 短帖与长文 + Reddit/Hacker News/知乎/CSDN/Product Hunt/B站/小红书 的一键复制发布页。触发词：「把我的项目发全平台」「我做的项目写一篇」「Vibe Coding 项目发布」「全渠道发布」。以 creator-platform 的子 skill 运行，构建交 content-engine（wechat-silicon-editor）。
---

# Project Launch → Multi-Platform（自有项目 → 全平台发布）

创作者平台的**自有项目渠道**。以制作者身份写作：务实、第一人称、略带观点，目标是把读者引去试用产品。中英双语项目必须每个渠道都出 `-zh`/`-en` 两版（见 `config/creator.yaml` 的 `bilingual` 与项目语言）。

> **共享资源位置**：`config/creator.yaml` 与 `references/`（platforms/editorial-guide）来自 **creator-platform 技能根**（安装后 `~/.agents/skills/creator-platform/`，仓库内为 `github-vibe-wechat/` 根目录）。找不到就用 glob 搜索。

## 每次重新读项目

下笔前检查当前工作树、README、包元数据、remote URL、许可证、live URL、产品文案、最新截图。未提交的 branding/内容变更若内部一致即视为当前。**核验每个公开 URL**；绝不因为旧文章存在就复用旧产品名、旧截图、旧仓库地址或旧功能表述。

先写一句私有定位：

> I built [product] for [specific user/pain], so they can [outcome] without [old workaround].

## 双语契约

- 中英是两个可发布版本，不是混合语言附录。翻译论点、工作流、安全说明、限制与 CTA——不只翻译标题。
- URL、产品名、协议名、数值限制跨版本一致。
- 媒体目录成对：`images/`（中文 UI）+ `images-en/`（英文 UI），都从当前本地或已部署构建截图。部署 URL 还显示旧品牌/旧文案时，**不要**用它作证据，报告不一致并用当前本地构建，直到部署刷新。

## 公众号母稿

- 标题以 `Vibe Coding｜` 开头（`config.wechat.series_title` 可改），不编号（不用 `#01`）。
- 痛点与结果开场，不报技术栈；用具体工作流解释产品；讲信任/安全选择与诚实局限；结尾给 live URL + 仓库 URL + 友好的试用/Star 请求。
- 真实、当前、按阅读顺序的图：产品/仓库封面 → 主工作流 → 安全/设置证据 → 只携带新信息的附加屏。
- 图片 `01_` 命名 + `图 01｜… 图片来源：…` 图注；不生成假 UI 或装饰性 AI 图。

## 逐平台改编（禁止复制粘贴同一段文案）

从母稿提取**事实对等清单**：制作者动机、具体痛点、完整用户工作流、安装/访问方式、产品限制、安全机制、数据生命周期、可选控制、诚实局限、技术栈、live URL、仓库 URL。每个长文平台保留同等事实深度。

- **X/Twitter**：`social/x-post.md/html/png`（≤240 中文字符含 URL，痛点开场、独立 CTA、官方 intent 链接）+ `social/x-article.md/html`（图文长文）。不承诺一次粘贴同时插入图文；两步流程写清楚。
- **Reddit**：第一人称透明帖 + 真实反馈请求；不要求点赞。发布前 preflight：选一个主题直接匹配的子版块、读其规则与自我推广政策、检查 Poster Eligibility、披露制作者身份、正文只出现一次 canonical URL、去掉标签与营销词、不跨社区复制同一草稿、被过滤先联系版主。新号/低 karma 要说明并提供先参与路径。
- **Hacker News**：`Show HN:` 标题 + 直接可运行 URL + 动机 + 端到端流程 + 关键设计选择 + 威胁模型边界 + 技术栈 + 仓库 + 具体讨论问题。不假装 HN 插入本地图片，不要求投票。
- **知乎**：围绕用户问题/制作者判断的中文长文，rich 复制。
- **CSDN**：问题 → 架构 → 加密/安全模型 → 部署 → 用法 → 局限 → 源码；rich + markdown 复制。
- **Product Hunt**：完整发布工作表（名称、标语、网址、仓库、短/长描述、Topics、关键收益、画廊图注、发布文案、第一人称 Maker Comment）。提交前核对当前字段要求。
- **B站**：视频/专栏发布包（标题、封面/截图素材、简介、分段口播提纲、置顶评论、标签）；不伪装成自动上传。
- **小红书**：短标题、图先文后、结尾互动问题、5–8 标签；避免"爆款""永久安全"类不可验证承诺。

中英双语项目：每个平台的 `-zh`/`-en` 页面标题标注语言，复制按钮限定该版本；英文页用英文画廊素材、中文页用中文画廊素材。

## 构建、校验与交付

- 交 `content-engine`：`wechat-silicon-editor` 的 `build_wechat_article.py`（`--strict-editorial`）+ `build_channel_page.py`（各平台）+ `build_x_post.py`（X 组件）。
- 校验 `references/platforms.md` 清单：产品名/live URL/仓库 URL/许可证/截图一致；图片存在、编号、有图注；rich 载荷嵌入图片；file:// 下按钮可用；图片下载用 Blob/object-URL；无平台收到相同文案；双语页面齐全且配图语言匹配；live 站 branding 与仓库一致后再推广 live URL。
- 归档 `config.archive_root/<slug>/`（含 `images/`、`images-en/`、`social/`、`platforms/`）；改标题/改名后更新同一目录，不留冲突副本。
- 交付并提醒：打开 HTML → 复制按钮 → 审阅 → 最终发布由用户执行。
