#!/usr/bin/env bash
# ============================================================
# AI-Native Creator Platform — 幂等安装/升级/卸载
# 把入口 skill（creator-platform）与子 skills 安装到
#   ~/.agents/skills（DSH 用户技能根）
#   ~/.codex/skills （Codex 技能根）
# 用法:
#   ./scripts/install.sh                 # 安装到两个 home
#   ./scripts/install.sh --codex-only    # 只装 ~/.codex/skills
#   ./scripts/install.sh --dsh-only      # 只装 ~/.agents/skills
#   ./scripts/install.sh --link          # 用符号链接（改仓库即生效，便于迭代）
#   ./scripts/install.sh --engine        # 顺带确保渲染引擎（wechat-silicon-editor）
#   ./scripts/install.sh --uninstall     # 卸载（只删本平台安装的目录）
# ============================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENTRY="creator-platform"
SUB_SKILLS=(news-to-content topic-essay project-launch project-recommend content-engine)
MODE="copy"
DO_ENGINE=0
UNINSTALL=0
HOMES=()

for arg in "$@"; do
  case "$arg" in
    --codex-only) HOMES+=("$HOME/.codex/skills") ;;
    --dsh-only)   HOMES+=("$HOME/.agents/skills") ;;
    --link)       MODE="link" ;;
    --engine)     DO_ENGINE=1 ;;
    --uninstall)  UNINSTALL=1 ;;
    *) echo "未知参数: $arg" >&2; exit 2 ;;
  esac
done

if [ "${#HOMES[@]}" -eq 0 ]; then
  HOMES=("$HOME/.codex/skills" "$HOME/.agents/skills")
fi

install_dir() {
  local src="$1" dst="$2"
  if [ "$MODE" = "link" ]; then
    if [ -e "$dst" ] && [ ! -L "$dst" ]; then
      echo "  ! $dst 已存在且非符号链接，跳过（可先 --uninstall）"
      return
    fi
    ln -sfn "$src" "$dst"
    echo "  link: $dst -> $src"
  else
    rm -rf "$dst"
    mkdir -p "$(dirname "$dst")"
    # 复制时排除 .git 与写工具暂存目录（*.tmpdir）
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --exclude='.git' --exclude='*.tmpdir' "$src/" "$dst/"
      echo "  copy: $dst (excl .git, *.tmpdir)"
      return
    fi
    cp -R "$src" "$dst"
    rm -rf "$dst/.git"
    find "$dst" -name "*.tmpdir" -type d -exec rm -rf {} + 2>/dev/null || true
    echo "  copy: $dst"
  fi
}

uninstall_one() {
  local home="$1" name="$2"
  if [ -e "$home/$name" ] || [ -L "$home/$name" ]; then
    rm -rf "$home/$name"
    echo "  removed: $home/$name"
  fi
}

if [ "$UNINSTALL" -eq 1 ]; then
  for home in "${HOMES[@]}"; do
    echo "卸载 $home:"
    uninstall_one "$home" "$ENTRY"
    for s in "${SUB_SKILLS[@]}"; do uninstall_one "$home" "$s"; done
  done
  echo "完成。"
  exit 0
fi

echo "安装 AI-Native Creator Platform（mode=${MODE}）"
for home in "${HOMES[@]}"; do
  echo "→ $home"
  mkdir -p "$home"
  # 入口 skill：仓库根 = creator-platform（SKILL.md + agents + config + references + scripts）
  install_dir "$REPO_ROOT" "$home/$ENTRY"
  # 子 skills
  for s in "${SUB_SKILLS[@]}"; do
    install_dir "$REPO_ROOT/skills/$s" "$home/$s"
  done
done

if [ "$DO_ENGINE" -eq 1 ]; then
  echo "确保渲染引擎（wechat-silicon-editor）:"
  python3 "$REPO_ROOT/skills/content-engine/scripts/ensure_engine.py"
fi

echo ""
echo "安装完成。当前布局："
echo "  ~/.agents/skills/creator-platform/   （入口：路由 + config + references）"
for s in "${SUB_SKILLS[@]}"; do
  echo "  ~/.agents/skills/$s/                （子 skill：${s}）"
done
echo ""
echo "配置：编辑 ~/.agents/skills/creator-platform/config/creator.yaml 生效。"
echo "升级：仓库内改动后重跑 ./scripts/install.sh（copy 模式会整体刷新）。"
