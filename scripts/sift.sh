#!/bin/bash
# Headless Sifter v0.0.2 (Target Acquisition Edition)

TARGET_URL=$1
PROJECT_ROOT=$(pwd)

if [ -n "$TARGET_URL" ]; then
    # MANUAL TARGET MODE: Trigger Firecrawl Docker
    RAW_FILE="transmissions/raw-targeted-$(date +%Y-%m-%d_%H%M%S).md"
    curl -s -X POST http://localhost:3002/v1/scrape \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$TARGET_URL\", \"formats\": [\"markdown\"]}" | \
        python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('markdown', ''))" > "$RAW_FILE"
else
    # AUTONOMOUS MODE: Grab the latest sweep
    RAW_FILE=$(ls -1t transmissions/raw-*.md 2>/dev/null | head -n 1)
fi

if [ ! -s "$RAW_FILE" ]; then
    echo "!! ERROR: Signal acquisition failed or file is empty."
    exit 1
fi

CLEAN_FILE="${RAW_FILE}.clean"
OUTPUT_FILE="archive/briefing-$(date +%Y-%m-%d_%H%M%S).md"

# Purification
grep -vEi "advertisement|privacy policy|copyright|terms of service|sign in|subscribe|all rights reserved|cookie" "$RAW_FILE" | \
tr -s ' ' | head -c 3000 > "$CLEAN_FILE"

# API Request
curl -s -N -X POST http://localhost:8080/completion \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"### INSTRUCTIONS\nYou are the FogSift Lead Analyst. Sift through this news once. Provide a concise summary and STOP. Do not repeat facts.\n\n### DATA\n$(cat "$CLEAN_FILE" | tr -d '\"' | tr -d '\n')\n\n### BRIEFING\",
    \"stream\": true,
    \"n_predict\": 800,
    \"temperature\": 0.85,
    \"repeat_penalty\": 1.2,
    \"presence_penalty\": 0.1,
    \"stop\": [\"###\", \"DATA\", \"INSTRUCTIONS\"]
  }" | while read -r line; do
    if [[ "$line" == data:* ]]; then
        echo "$line" | sed 's/^data: //' | python3 -c "import sys, json; print(json.loads(sys.stdin.read()).get('content', ''), end='', flush=True)" 2>/dev/null
    fi
done | tee "$OUTPUT_FILE"
