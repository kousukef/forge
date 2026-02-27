#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Forge Installer - シンボリックリンク方式（個別要素単位）
# ~/.claude/ 配下にディレクトリ内の個別要素のシンボリックリンクを作成
# ユーザー独自の資産と共存可能。git pull で更新が自動反映される
# ============================================================================

FORGE_DIRS=(commands agents skills rules reference hooks docs)
CLAUDE_HOME="${HOME}/.claude"
BACKUP_BASE="${CLAUDE_HOME}/backups"
FORCE=false

# --- 自己位置特定 ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
FORGE_ROOT="$SCRIPT_DIR"

# --- ヘルパー関数 ---
info()    { printf "\033[34m[INFO]\033[0m %-40s %s\n" "$1" "$2"; }
ok()      { printf "\033[32m[ OK ]\033[0m %-40s %s\n" "$1" "$2"; }
warn()    { printf "\033[33m[WARN]\033[0m %-40s %s\n" "$1" "$2"; }
error()   { printf "\033[31m[FAIL]\033[0m %-40s %s\n" "$1" "$2"; }

confirm() {
  $FORCE && return 0
  read -r -p "$1 [y/N] " response
  [[ "$response" =~ ^[Yy]$ ]]
}

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Forge を ~/.claude/ にシンボリックリンク方式でインストールします。
各ディレクトリ内の個別要素単位でリンクを作成し、ユーザー独自の資産と共存可能です。
git pull で更新が自動反映されます。

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

# --- Forge リポジトリの検証 ---
echo ""
echo "=== Forge Installer ==="
echo ""

if [[ ! -f "${FORGE_ROOT}/CLAUDE.md" ]]; then
  error "CLAUDE.md" "Forge リポジトリが見つかりません: ${FORGE_ROOT}"
  exit 1
fi

for dir in "${FORGE_DIRS[@]}"; do
  if [[ ! -d "${FORGE_ROOT}/${dir}" ]]; then
    error "${dir}/" "ソースディレクトリが見つかりません: ${FORGE_ROOT}/${dir}"
    exit 1
  fi
done

info "Forge root" "${FORGE_ROOT}"
info "Target" "${CLAUDE_HOME}"
echo ""

# --- ~/.claude/ の作成 ---
mkdir -p "${CLAUDE_HOME}"

# --- 旧方式（ディレクトリ丸ごとシンボリックリンク）の検出・移行 ---
migrated=0
for dir in "${FORGE_DIRS[@]}"; do
  dest="${CLAUDE_HOME}/${dir}"
  if [[ -L "$dest" ]]; then
    target="$(readlink "$dest")"
    if [[ "$target" == "${FORGE_ROOT}/"* ]]; then
      warn "${dir}/" "旧方式のディレクトリシンボリックリンクを検出"
      rm "$dest"
      mkdir -p "$dest"
      ok "${dir}/" "通常ディレクトリに変換（個別リンクに移行します）"
      migrated=$((migrated + 1))
    fi
  fi
done

if [[ $migrated -gt 0 ]]; then
  echo ""
  info "移行" "${migrated} 件の旧方式リンクを個別リンク方式に移行します"
  echo ""
fi

# --- 各ディレクトリの個別要素リンク処理 ---
linked=0
skipped=0
backed_up=0
backup_dir=""

for dir in "${FORGE_DIRS[@]}"; do
  src_dir="${FORGE_ROOT}/${dir}"
  dest_dir="${CLAUDE_HOME}/${dir}"

  # ディレクトリが存在しない場合は作成
  mkdir -p "$dest_dir"

  # ソースディレクトリ内の各要素を処理
  for item in "${src_dir}"/*; do
    [[ -e "$item" ]] || continue  # glob が展開されない場合のガード

    item_name="$(basename "$item")"
    dest="${dest_dir}/${item_name}"
    display="${dir}/${item_name}"

    # シンボリックリンク済み
    if [[ -L "$dest" ]]; then
      current_target="$(readlink "$dest")"
      if [[ "$current_target" == "$item" ]]; then
        ok "${display}" "リンク済み（変更なし）"
        skipped=$((skipped + 1))
        continue
      else
        # リンク先が異なる
        info "${display}" "リンク先を更新"
        ln -sfn "$item" "$dest"
        ok "${display}" "リンク更新完了"
        linked=$((linked + 1))
        continue
      fi
    fi

    # 通常ファイルまたはディレクトリが存在
    if [[ -e "$dest" ]]; then
      warn "${display}" "既存の要素が見つかりました"
      if confirm "  ${dest} をバックアップしてリンクを作成しますか?"; then
        if [[ -z "$backup_dir" ]]; then
          backup_dir="${BACKUP_BASE}/forge-$(date +%Y%m%d-%H%M%S)"
          mkdir -p "$backup_dir"
          info "backup" "バックアップ先: ${backup_dir}"
        fi
        mkdir -p "${backup_dir}/${dir}"
        mv "$dest" "${backup_dir}/${dir}/${item_name}"
        ok "${display}" "バックアップ完了"
        ln -sfn "$item" "$dest"
        ok "${display}" "リンク作成完了"
        linked=$((linked + 1))
        backed_up=$((backed_up + 1))
      else
        warn "${display}" "スキップ（既存の要素を保持）"
        skipped=$((skipped + 1))
      fi
      continue
    fi

    # 存在しない → 新規リンク
    ln -sfn "$item" "$dest"
    ok "${display}" "リンク作成完了"
    linked=$((linked + 1))
  done
done

echo ""

# --- settings.json の処理 ---
settings_dest="${CLAUDE_HOME}/settings.json"
if [[ ! -f "$settings_dest" ]]; then
  cp "${FORGE_ROOT}/settings.json" "$settings_dest"
  ok "settings.json" "コピー完了"
else
  warn "settings.json" "既に存在します（上書きしません）"
  info "settings.json" "設定を更新する場合は settings.template.json を参照してください"
fi

echo ""

# --- 検証 ---
echo "--- 検証 ---"
errors=0
for dir in "${FORGE_DIRS[@]}"; do
  src_dir="${FORGE_ROOT}/${dir}"
  dest_dir="${CLAUDE_HOME}/${dir}"

  if [[ ! -d "$dest_dir" ]]; then
    error "${dir}/" "ディレクトリが存在しません"
    errors=$((errors + 1))
    continue
  fi

  for item in "${src_dir}"/*; do
    [[ -e "$item" ]] || continue
    item_name="$(basename "$item")"
    dest="${dest_dir}/${item_name}"
    display="${dir}/${item_name}"

    if [[ -L "$dest" ]]; then
      actual_target="$(readlink "$dest")"
      if [[ "$actual_target" == "$item" ]]; then
        ok "${display}" "-> ${actual_target}"
      else
        error "${display}" "リンク先が不正: ${actual_target}"
        errors=$((errors + 1))
      fi
    else
      error "${display}" "シンボリックリンクではありません"
      errors=$((errors + 1))
    fi
  done
done

echo ""

# --- サマリー ---
echo "=== サマリー ==="
echo "  リンク作成/更新: ${linked}"
echo "  スキップ:        ${skipped}"
echo "  バックアップ:    ${backed_up}"
if [[ $migrated -gt 0 ]]; then
  echo "  旧方式から移行:  ${migrated}"
fi
if [[ -n "$backup_dir" ]]; then
  echo "  バックアップ先:  ${backup_dir}"
fi

if [[ $errors -gt 0 ]]; then
  echo ""
  error "検証" "${errors} 件のエラーがあります"
  exit 1
fi

echo ""
ok "完了" "Forge のインストールが完了しました"
echo ""
