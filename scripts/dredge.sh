#!/bin/bash
# dredge.sh - Pings local Firecrawl to scrape URLs into markdown

TARGET_URL=$1
DATE=$(date +%Y-%m-%d_%H%M)

if [ -z "$TARGET_URL" ]; then
    echo "Usage: ./scripts/dredge.sh <url>"
    exit 1
fi

CLEAN_NAME=$(echo "$TARGET_URL" | sed -e 's/[^A-Za-z0-9._-]/_/g' | cut -c1-30)
OUTPUT_FILE="transmissions/raw-${DATE}-${CLEAN_NAME}.md"

echo "========================================"
echo "⚓ FOGSIFT DREDGE"
echo "Target: $TARGET_URL"
echo "========================================"
echo "Deploying nets to local Firecrawl..."

# Use Python to safely parse the JSON response payload
curl -s -X POST http://localhost:3002/v1/scrape \
    -H 'Content-Type: application/json' \
    -d "{\"url\": \"$TARGET_URL\"}" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print(data['data']['markdown'])
    else:
        print('ERROR: ' + str(data.get('error', 'Unknown error')))
except Exception as e:
    print('JSON parsing failed:', e)
" > "$OUTPUT_FILE"

echo "[ FogSift ] Signal captured and saved to $OUTPUT_FILE"
