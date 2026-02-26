#!/bin/bash
# substack-push.sh - THE VERSION THAT WORKS

FILE=$1
LANTERN_DIR=~/Code/Lantern
FOGSIFT_DIR=~/Code/fogsift

if [ -z "$FILE" ]; then
    echo "Usage: ./scripts/substack-push.sh transmissions/your-file.md"
    exit 1
fi

ABS_FILE=$(realpath "$FILE")

# Step A: Render to HTML using your existing marked library
NODE_PATH=$FOGSIFT_DIR/node_modules node $LANTERN_DIR/scripts/render-for-substack.js "$ABS_FILE" > temp.html

# Step B: Convert to Rich Text and copy to clipboard (The working 'textutil' logic)
textutil -convert rtf temp.html -stdout | pbcopy

rm temp.html

echo "========================================"
echo "🏮 FOGSIFT BRIDGE: RESTORED & STABLE"
echo "========================================"
echo "[ FogSift ] Content is in your clipboard as Rich Text."
open "https://fogsift.substack.com/publish/post"
