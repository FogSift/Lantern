#!/bin/bash
# lighthouse.sh - The FogSift 2-Hour Interval Beacon
INTERVAL=7200
TARGETS=("https://www.chicoer.com/")

echo "========================================"
echo "🌊 FOGSIFT LIGHTHOUSE: BEACON LIT"
echo "========================================"

while true; do
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "\n[$TIMESTAMP] 🏮 Lantern sweeping the horizon..."
    ./scripts/broadcast.sh
    for URL in "${TARGETS[@]}"; do ./scripts/dredge.sh "$URL"; done
    ./scripts/sift.sh
    echo "[$TIMESTAMP] Lighthouse maintaining watch. Sleeping 2 hours..."
    sleep $INTERVAL
done
