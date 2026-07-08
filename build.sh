#!/usr/bin/env bash
# build.sh – copies shared source files from src/ into each browser directory
#            and packages each browser extension into a versioned ZIP archive.
#
# Usage:
#   ./build.sh           # build all browsers
#   ./build.sh chrome    # build Chrome only
#   ./build.sh firefox   # build Firefox only
#
# The manifests and icons are browser-specific and are NOT touched by this script.
# Only the following files are managed here (they are identical for every browser):
#   content.js, options.js, options.html, options.css

set -euo pipefail

BROWSERS=("chrome" "firefox")

# If a browser argument is provided, build only that one.
if [[ $# -gt 0 ]]; then
  BROWSERS=("$1")
fi

SHARED_FILES=("utils.js" "content.js" "options.js" "options.html" "options.css")
ICON_SIZES=(16 48 128)
SRC_DIR="$(dirname "$0")/src"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SVG_ICON="${ROOT_DIR}/icons/icon.svg"
DIST_DIR="${ROOT_DIR}/dist"

mkdir -p "$DIST_DIR"

# Detect SVG-to-PNG converter
if command -v inkscape &>/dev/null; then
  svg_to_png() { inkscape --export-filename="$2" --export-width="$3" --export-height="$3" "$1" &>/dev/null; }
elif command -v rsvg-convert &>/dev/null; then
  svg_to_png() { rsvg-convert -w "$3" -h "$3" -o "$2" "$1"; }
elif command -v convert &>/dev/null; then
  svg_to_png() { convert -background none -resize "${3}x${3}" "$1" "$2"; }
else
  echo "❌  No SVG converter found (inkscape, rsvg-convert or convert required)."
  exit 1
fi

for browser in "${BROWSERS[@]}"; do
  DEST_DIR="${ROOT_DIR}/${browser}"

  if [[ ! -d "$DEST_DIR" ]]; then
    echo "⚠️  Directory '${browser}/' not found – skipping."
    continue
  fi

  echo "📦  Building ${browser}..."
  for file in "${SHARED_FILES[@]}"; do
    cp "${SRC_DIR}/${file}" "${DEST_DIR}/${file}"
    echo "    ✔  ${file}"
  done

  # Convert icons
  if [[ -f "$SVG_ICON" ]]; then
    mkdir -p "${DEST_DIR}/icons"
    for size in "${ICON_SIZES[@]}"; do
      out="${DEST_DIR}/icons/icon${size}.png"
      svg_to_png "$SVG_ICON" "$out" "$size"
      echo "    ✔  icons/icon${size}.png"
    done
  else
    echo "    ⚠️  ${SVG_ICON} not found – icons skipped."
  fi

  # Package into a versioned ZIP archive
  MANIFEST="${DEST_DIR}/manifest.json"
  if [[ -f "$MANIFEST" ]]; then
    VERSION=$(grep '"version"' "$MANIFEST" | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    ZIP_NAME="${browser}-ado-smartactions-v${VERSION}.zip"
    (cd "$DEST_DIR" && zip -qr "${DIST_DIR}/${ZIP_NAME}" .)
    echo "    📦  dist/${ZIP_NAME}"
  else
    echo "    ⚠️  manifest.json not found in ${browser}/ – ZIP skipped."
  fi
done

echo "✅  Done."

