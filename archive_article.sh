#!/bin/bash
# LANTERN ROUTING ENGINE v2.1
# Hierarchical organization with Automated Source Manifests

YEAR=$(date +"%Y")
MONTH=$(date +"%m")
DAY=$(date +"%d")
BASE_DIR="Substack_Articles"
STAGING="./temp_assets"

# 1. Title Sanitization
RAW_TITLE="${1:-Untitled_Node_$(date +%H%M)}"
CLEAN_TITLE=$(echo "$RAW_TITLE" | sed -e 's/ /_/g' -e 's/[^A-Za-z0-9_]//g')

# 2. Path Engineering
ROOT="$BASE_DIR/$YEAR/$MONTH/$DAY/$CLEAN_TITLE"
TEXT_PATH="$ROOT/text"
MEDIA_PATH="$ROOT/media"
META_PATH="$ROOT/metadata"

# 3. Infrastructure Build
mkdir -p "$TEXT_PATH" "$MEDIA_PATH" "$META_PATH"

# 4. The Routing Sweep
if [ -f "morning_briefing.md" ]; then
    mv "morning_briefing.md" "$TEXT_PATH/${CLEAN_TITLE}.md"
    echo "[ROUTED] Markdown -> $TEXT_PATH"
else
    echo "[ERROR] No morning_briefing.md detected in root."
fi

if [ -d "$STAGING" ] && [ "$(ls -A $STAGING)" ]; then
    mv "$STAGING"/* "$MEDIA_PATH/"
    echo "[ROUTED] Assets -> $MEDIA_PATH"
else
    mkdir -p "$STAGING"
    echo "[INFO] temp_assets was empty."
fi

# 5. Manifest Generation (Source Tracking)
# Automates the creation of a research audit trail
cat << MANIFEST_EOF > "$META_PATH/README.md"
# SOURCE MANIFEST: $RAW_TITLE
**Node:** Chico, CA
**Date:** $(date +"%Y-%m-%d %H:%M")

## RESEARCH INPUTS
* **Ars Technica:** Physics of Scotch Tape (Supersonic Micro-cracks)
* **Substack:** FogSift Particle Accelerator Deep Signal
* **Academic Refutation:** Analyis of Brooksian Skepticism vs. 2026 Humanoid Deployment

## ARCHIVE MAPPING
* **Text:** $TEXT_PATH
* **Media:** $MEDIA_PATH
* **Metadata:** $META_PATH
MANIFEST_EOF
echo "[GENERATE] Research Manifest -> $META_PATH/README.md"

# 6. Execute Substack Deployment
if [ -f "./scripts/substack-push.sh" ]; then
    ./scripts/substack-push.sh "$TEXT_PATH/${CLEAN_TITLE}.md"
fi

echo "NODE STATE SECURED: $ROOT"
