#!/bin/bash
# Wraps the web extension in an Xcode project for Safari on iOS and macOS.
# Requires macOS with Xcode and Safari 15+.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
EXTENSION_DIR="$ROOT_DIR/extension"
OUTPUT_DIR="$ROOT_DIR/ios"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Error: safari-web-extension-converter requires macOS with Xcode."
  echo "Open this repo on a Mac and run this script again."
  exit 1
fi

if ! command -v xcrun &>/dev/null; then
  echo "Error: Xcode command line tools are not installed."
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

xcrun safari-web-extension-converter "$EXTENSION_DIR" \
  --project-location "$OUTPUT_DIR" \
  --app-name "HealthyInstagram" \
  --swift \
  --copy-resources \
  --force

echo ""
echo "Xcode project created at: $OUTPUT_DIR/HealthyInstagram/HealthyInstagram.xcodeproj"
echo ""
echo "Next steps:"
echo "  1. Open the Xcode project"
echo "  2. Select the iOS app target and your iPhone as the run destination"
echo "  3. Build and run on your device"
echo "  4. On iPhone: Settings → Safari → Extensions → enable Healthy Instagram"
