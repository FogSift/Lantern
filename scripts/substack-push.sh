#!/bin/bash
# substack-push.sh - Prepares a draft and opens the Substack editor

FILE=$1
if [ -z "$FILE" ]; then
    echo "Usage: ./scripts/substack-push.sh transmissions/your-file.md"
    exit 1
fi

# 1. Copy the content to the Mac clipboard
cat "$FILE" | pbcopy

echo "========================================"
echo "🏮 FOGSIFT SUBSTACK BRIDGE"
echo "========================================"
echo "[ FogSift ] Content from $FILE is now in your clipboard."
echo "[ FogSift ] Opening Substack editor..."

# 2. Open the Substack 'New Post' URL
open "https://fogsift.substack.com/publish/post"

echo "----------------------------------------"
echo "ACTION REQUIRED:"
echo "1. Paste (Cmd+V) into the Substack editor."
echo "2. Hit 'Continue' to publish."
echo "----------------------------------------"
