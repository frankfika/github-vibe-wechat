#!/usr/bin/env bash
# OmniWriter 一键启动
# 用法:在项目任意位置运行 ./dev.sh(或双击 dev.command)
# 会自动:补依赖 → 补 .env.local → 启动 localhost:3000 → 打开浏览器
set -euo pipefail

# 项目真实位置(即使从某个 worktree 副本执行,也直接使用主项目已装好的依赖)
PROJECT_DIR="/Users/fangchen/Baidu/GitHub/omniwriter"
cd "$PROJECT_DIR"

# 1. 缺依赖就自动安装(仅首次或依赖变更后发生)
if [ ! -d node_modules ]; then
  echo "⏳ 检测到缺少依赖,执行 pnpm install(仅首次需要)…"
  pnpm install
fi

# 2. 缺环境配置就从示例创建(默认 MiniMax 接口;未配 key 也能用,只是 AI 生成不可用)
if [ ! -f .env.local ]; then
  echo "🛠   未找到 .env.local,已从 .env.local.example 创建(可在其中填入 ANTHROPIC_API_KEY)"
  cp .env.local.example .env.local
fi

# 3. 启动:端口已占用说明服务在跑,直接开浏览器;否则先开浏览器再拉起 dev server
if lsof -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ OmniWriter 已经在 localhost:3000 运行,打开浏览器…"
  open http://localhost:3000 || true
  exit 0
fi

echo "🚀 启动 OmniWriter:http://localhost:3000"
open http://localhost:3000 || true
exec pnpm dev