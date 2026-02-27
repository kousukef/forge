#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Forge Uninstaller
# install.sh で作成したシンボリックリンクを削除（個別要素単位）
# FORGE_ROOT 配下を指すリンクのみ削除し、ユーザー独自の資産には触れない
# ============================================================================

FORGE_DIRS=(commands agents skills rules reference hooks docs)
CLAUDE_HOME="${HOME}/.claude"
BACKUP_BASE="${CLAUDE_HOME}/backups"
FORCE=false

# --- 自己位置特定 ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
FORGE_ROOT="$SCRIPT_DIR"

# --- ヘルパー関数 ---
ok()      { printf "\033[32m[ OK ]\033[0m %-40s %s\n" "$1" "$2"; }
warn()    { printf "\033[33m[WARN]\033[0m %-40s %s\n" "$1" "$2"; }
info()    { printf "\033[34m[INFO]\033[0m %-40s %s\n" "$1" "$2"; }

confirm() {
  $FORCE && return 0
  read -r -p "$1 [y/N] " response
  [[ "$response" =~ ^[Yy]$ ]]
}

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Forge のシンボリックリンクを ~/.claude/ から削除します。
ユーザー独自の資産や Claude Code のランタイムファイルには触れません。

Options:
  -y, --yes    確認プロンプトをスキップ（非対話モード）
  -h, --help   このヘルプを表示
EOF
  exit 0
}

# --- 引数パース ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes) FORCE=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

# --- ~/.claude/ の存在確認 ---
echo ""
echo "=== Forge Uninstaller ==="
echo ""

if [[ ! -d "$CLAUDE_HOME" ]]; then
  info "~/.claude/" "ディレクトリが存在しません。何もしません。"
  exit 0
fi

if ! confirm "Forge のシンボリックリンクを削除しますか?"; then
  echo "中止しました。"
  exit 0
fi

echo ""

# --- 旧方式（ディレクトリ丸ごとシンボリックリンク）の処理 ---
for dir in "${FORGE_DIRS[@]}"; do
  dest="${CLAUDE_HOME}/${dir}"
  if [[ -L "$dest" ]]; then
    target="$(readlink "$dest")"
    if [[ "$target" == "${FORGE_ROOT}/"* ]]; then
      rm "$dest"
      ok "${dir}/" "旧方式シンボリックリンクを削除 (-> ${target})"
    else
      warn "${dir}/" "不明なシンボリックリンク (-> ${target})。スキップ"
    fi
  fi
done

# --- 各ディレクトリ内の個別要素の処理 ---
removed=0
skipped=0

for dir in "${FORGE_DIRS[@]}"; do
  dest_dir="${CLAUDE_HOME}/${dir}"
  [[ -d "$dest_dir" ]] || continue

  for item in "${dest_dir}"/*; do
    [[ -e "$item" || -L "$item" ]] || continue

    item_name="$(basename "$item")"
    display="${dir}/${item_name}"

    if [[ -L "$item" ]]; then
      target="$(readlink "$item")"
      # Forge リポジトリ配下を指すリンクのみ削除
      if [[ "$target" == "${FORGE_ROOT}/"* ]]; then
        rm "$item"
        ok "${display}" "削除 (-> ${target})"
        removed=$((removed + 1))
      else
        info "${display}" "Forge 以外のリンク。スキップ"
        skipped=$((skipped + 1))
      fi
    else
      info "${display}" "ユーザー資産。スキップ"
      skipped=$((skipped + 1))
    fi
  done
done

echo ""

# --- settings.json ---
settings_dest="${CLAUDE_HOME}/settings.json"
if [[ -f "$settings_dest" ]]; then
  warn "settings.json" "自動削除しません。不要な場合は手動で削除してください"
fi

# --- バックアップの案内 ---
if [[ -d "$BACKUP_BASE" ]]; then
  echo ""
  info "バックアップ" "以下にバックアップが残っています:"
  info "" "${BACKUP_BASE}"
  info "" "復元する場合: cp -r ${BACKUP_BASE}/<backup-name>/<dir>/* ${CLAUDE_HOME}/<dir>/"
  info "" "削除する場合: rm -rf ${BACKUP_BASE}"
fi

echo ""

# --- サマリー ---
echo "=== サマリー ==="
echo "  削除:    ${removed}"
echo "  スキップ: ${skipped}"
echo ""
ok "完了" "Forge のアンインストールが完了しました"
echo ""
