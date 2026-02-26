#!/bin/bash
# ignite.sh - Captures raw signal and prepares it for the FogSift Engine

DATE=$(date +%Y-%m-%d)
RAW_FILE="transmissions/raw-${DATE}.txt"

echo "========================================"
echo "🏮 FOGSIFT INTELLIGENCE ENGINE: IGNITE"
echo "========================================"
echo "Paste your raw text, links, or data dump below."
echo "Press Ctrl+D when you are finished."
echo "----------------------------------------"

cat > "$RAW_FILE"

echo -e "\n[ FogSift ] Signal captured in $RAW_FILE"
echo "[ FogSift ] Ready for transformation. Paste this block to Gemini:"
echo "----------------------------------------------------------------"
echo "Transform this raw signal into the FogSift Daily Digest format."
echo "Focus on builder wins and tangible hope. Use the Workbench voice."
echo "----------------------------------------------------------------"
cat "$RAW_FILE"
