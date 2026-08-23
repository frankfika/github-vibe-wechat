---
name: content-engine
description: 渲染引擎封装 skill。负责检测/安装/调用 wechat-silicon-editor（公众号+全平台排版引擎）：构建公众号富文本 HTML/ZIP、各平台一键复制发布页、X 组件；跑严格编辑校验。被 creator-platform 及其子 skills 在构建阶段自动调用；也可直接用于"只排版已有文案"。触发词：「排版」「构建发布页」「帮我排版这篇」「build the publishing pages」。
---

# Content Engine（渲染引擎封装）

构建阶段的唯一执行者。它不决定文案怎么写（那是各渠道 skill 的事），只保证**排版、打包、校验**一致、可复制。

## 1. 引擎检测与安装

1. 解析引擎路径：`config/creator.yaml` 的 `engine_root` → 未配置则用 `~/.codex/skills/wechat-silicon-editor`。
2. 目录存在且含 `scripts/build_wechat_article.py` → 直接使用。
3. 缺失 → 运行 `scripts/ensure_engine.py`（从 GitHub 克隆 `frankfika/wechat-silicon-editor`；支持 `--root` 指定安装位置）。克隆失败时报告确切阻塞点，不自行降级重写引擎。

## 2. 构建命令

### 公众号母稿（富文本 HTML + ZIP）

```bash
python3 scripts/build_wechat_article.py INPUT \
  --output OUTPUT.html \
  --eyebrow "FRANK'S AI NOTES / TOPIC" \
  --package \
  --strict-editorial
```

- INPUT：Markdown 或 HTML 源稿；必须恰好一个 `h1`；本地图片与源稿同目录或相对路径。
- 纯排版已有文案（用户未要求改稿）：可省略 `--strict-editorial`，但单一 h1 与图片规范仍要满足。
- 复制按钮会内嵌文章用到的全部本地图片（rich clipboard）。

### 平台发布页

```bash
python3 scripts/build_channel_page.py platforms/<platform>.md \
  --output platforms/<platform>.html
```

- 每个平台页：分字段复制按钮 + 正文复制 + copy-all 兜底 + 官方编辑器/提交链接；有图处提供图片复制/下载（file:// 下用 Blob/object-URL 下载）。
- 复制模式：`copy_mode: rich`（知乎）、`markdown`（Reddit/CSDN/B站/小红书）、`plain`（HN/Product Hunt/X）。

### X 组件

```bash
python3 scripts/build_x_post.py social/x-post.md \
  --output social/x-post.html \
  --image x-card.png
```

- 文本复制只放可发布正文；配图复制/下载 + 官方 X intent 预填链接；不承诺一次粘贴图文。

## 3. 构建前检查（依赖）

- `python3` + `beautifulsoup4`（缺失时 `pip install beautifulsoup4`）。
- Markdown 输入需要 `pandoc`；HTML 输入不需要。

## 4. 校验（构建后必须跑）

1. `python3 -m py_compile scripts/build_wechat_article.py`（引擎变更后）。
2. 浏览器打开产物检查：首屏、每个标题/引用/图注/图片；无横向溢出、无破图。
3. 点 `复制公众号正文` → 确认变为 `已复制，去公众号粘贴`。
4. 拒绝以下情况：零/多个 `h1`；成稿无图；图片未从 `01_` 连续编号；图缺来源图注；本地图缺失；HTML 无行内 style；rich 载荷嵌入图片数少于文章使用数；出现 `#0071e3` 等组件蓝；工具栏/脚本出现在复制正文内。

## 5. 与渠道 skill 的配合

- `news-to-content` / `project-launch` / `project-recommend` / `topic-essay` 在"构建"阶段调用本 skill。
- 渠道 skill 负责：素材、事实、角度、文案、图片计划。本 skill 负责：HTML/ZIP/发布页/校验/打包。
- 任何文案改动后，渠道 skill 必须要求重建全部产物再交付。
