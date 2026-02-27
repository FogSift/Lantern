#!/bin/bash
# 1. Grab the instruction logic from your local file
# 2. Add it to the clipboard so you can paste it into Gemini
cat scripts/system_instructions.md | pbcopy
echo "-------------------------------------------------------"
echo "🏮 LANTERN PROMPT COPIED TO CLIPBOARD"
echo "Paste this into Gemini with your news data."
echo "-------------------------------------------------------"
