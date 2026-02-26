#!/bin/bash
# ai-context.sh - Extracts project DNA (structure, layouts, styles) for AI context

TARGET_DIR=${1:-.}
cd "$TARGET_DIR" || { echo "Directory not found"; exit 1; }

echo "========================================"
echo "🏮 FOGSIFT AI CONTEXT EXTRACTOR"
echo "Target: $(pwd)"
echo "========================================"

echo -e "\n[1] DIRECTORY STRUCTURE (Depth 2)"
find . -maxdepth 2 -not -path '*/\.*' -not -path '*/node_modules*' -not -path '*/venv*' -not -path '*/.venv*' | sort

echo -e "\n[2] PACKAGE & DEPENDENCIES"
for file in package.json requirements.txt Gemfile; do
    if [ -f "$file" ]; then
        echo "--- $file ---"
        cat "$file"
    fi
done

echo -e "\n[3] MAIN HTML & LAYOUT FILES"
# Searches for common entry points across different frameworks
for file in index.html _layouts/default.html app/layout.tsx app/page.tsx src/App.jsx src/index.js; do
    if [ -f "$file" ]; then
        echo "--- $file ---"
        cat "$file" | head -n 150 # Caps output to keep terminal clean
    fi
done

echo -e "\n[4] STYLING & CONFIG"
# Searches for common CSS and Tailwind configs
for file in style.css styles.css css/style.css src/index.css app/globals.css tailwind.config.js tailwind.config.ts; do
    if [ -f "$file" ]; then
        echo "--- $file ---"
        cat "$file" | head -n 150
    fi
done

echo -e "\n========================================"
echo "ALL DATA GATHERED. COPY OUTPUT AND PASTE TO AI."
