#!/bin/bash
DATE=$(date +%Y-%m-%d)
ARCHIVE_FILE="archive/briefing-${DATE}.md"

echo "========================================"
echo "🏮 FOGSIFT DELIVERY: INGEST & PUBLISH"
echo "========================================"
echo "Paste your final FogSift Digest below."
echo "Press Ctrl+D when finished."
echo "----------------------------------------"

# 1. Capture output and save directly to archive
cat > "$ARCHIVE_FILE"

echo -e "\n[ FogSift ] Signal archived to $ARCHIVE_FILE"

# 2. Trigger the Substack Push
./scripts/substack-push.sh "$ARCHIVE_FILE"

# 3. Automate the Paste
echo "[ FogSift ] Commencing automated insertion..."
osascript -e 'tell application "Google Chrome" to activate' \
          -e 'delay 3' \
          -e 'tell application "System Events" to keystroke "v" using command down'

echo "[ FogSift ] Lantern Pipeline Complete."
