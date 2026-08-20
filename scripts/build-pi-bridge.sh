#!/usr/bin/env bash
# ============================================================
# build-pi-bridge.sh
# 编译 piweb-bridge 为单二进制 sidecar，拷入 src-tauri/binaries/ 并签名。
#
# 由 `bun run build:pi-bridge` 调用，并被 tauri.conf.json 的
# beforeBuildCommand 串联进 `tauri build` 流程。
#
# 用法：
#   bash scripts/build-pi-bridge.sh
#
# 环境变量覆盖（跨平台编译时用）：
#   PI_BRIDGE_TARGET   bun --target，如 bun-darwin-arm64
#   PI_BRIDGE_TRIPLE   rust target triple，如 aarch64-apple-darwin
# ============================================================
set -euo pipefail

# slate 仓库根（脚本在 scripts/ 下）
SLATE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRIDGE_DIR="$SLATE_ROOT/piweb-bridge"
BIN_DIR="$SLATE_ROOT/src-tauri/binaries"
ENTITLEMENTS="$SLATE_ROOT/src-tauri/Entitlements.plist"

# ---- target 检测（默认宿主平台）----
TARGET="${PI_BRIDGE_TARGET:-}"
TRIPLE="${PI_BRIDGE_TRIPLE:-}"
if [ -z "$TARGET" ] || [ -z "$TRIPLE" ]; then
  OS=$(uname -s); ARCH=$(uname -m)
  case "$OS-$ARCH" in
    Darwin-arm64)  TARGET=${TARGET:-bun-darwin-arm64};  TRIPLE=${TRIPLE:-aarch64-apple-darwin};;
    Darwin-x86_64) TARGET=${TARGET:-bun-darwin-x64};   TRIPLE=${TRIPLE:-x86_64-apple-darwin};;
    Linux-x86_64)  TARGET=${TARGET:-bun-linux-x64};    TRIPLE=${TRIPLE:-x86_64-unknown-linux-gnu};;
    *)
      echo "[build-pi-bridge] 不支持的宿主: $OS-$ARCH（请显式设置 PI_BRIDGE_TARGET + PI_BRIDGE_TRIPLE）" >&2
      exit 1 ;;
  esac
fi

# windows 产物带 .exe 后缀
case "$TRIPLE" in
  *-pc-windows-*) EXE=".exe" ;;
  *)              EXE="" ;;
esac

echo "[build-pi-bridge] target=$TARGET triple=$TRIPLE"

# ---- 安装依赖（已装则秒过）----
cd "$BRIDGE_DIR"
echo "[build-pi-bridge] bun install (piweb-bridge deps)"
bun install

# ---- 编译为单二进制 ----
# 注意：不要加 --bytecode，与 pi-bridge.ts 顶层 await 不兼容
echo "[build-pi-bridge] bun build --compile"
bun build --compile --minify --sourcemap --target="$TARGET" \
  ./pi-bridge.ts --outfile "pi-bridge$EXE"

# ---- 拷入 sidecar 目录（文件名按 rust triple 命名）----
mkdir -p "$BIN_DIR"
DEST="$BIN_DIR/pi-bridge-$TRIPLE$EXE"
cp "pi-bridge$EXE" "$DEST"
echo "[build-pi-bridge] -> $DEST ($(du -h "$DEST" | cut -f1))"

# ---- macOS ad-hoc 签名 + JIT entitlements ----
# app 开启 hardenedRuntime，bun 用 JavaScriptCore 需 JIT，不签会被内核 kill。
# 同时规避 tauri#11992（在 beforeBuildCommand 阶段预先签好）。
if [[ "$TRIPLE" == *apple* ]]; then
  if [ -f "$ENTITLEMENTS" ]; then
    echo "[build-pi-bridge] codesign (ad-hoc + JIT entitlements)"
    codesign --force --sign - --entitlements "$ENTITLEMENTS" "$DEST"
    # 注意：不要用 `codesign -dv | grep -q`——grep -q 命中后关管道，
    # codesign 收 SIGPIPE(141)，配合 pipefail 会误判失败。改捕获后字串匹配。
    SIG_INFO="$(codesign -dv "$DEST" 2>&1 || true)"
    if [[ "$SIG_INFO" == *"Signature=adhoc"* ]]; then
      echo "[build-pi-bridge] 签名验证通过 (adhoc)"
    else
      echo "[build-pi-bridge] 签名验证失败" >&2
      printf '%s\n' "$SIG_INFO" >&2
      exit 1
    fi
  else
    echo "[build-pi-bridge] 跳过签名：未找到 $ENTITLEMENTS" >&2
  fi
fi

echo "[build-pi-bridge] 完成"
