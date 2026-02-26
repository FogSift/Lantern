#!/bin/bash
# broadcast.sh - Generates the daily Lantern transmission template

DATE=$(date +%Y-%m-%d)
FORMATTED_DATE=$(date "+%b %d, %Y")
FILE="transmissions/${DATE}-broadcast.md"

if [ -f "$FILE" ]; then
    echo "[ FogSift ] Transmission for $DATE already exists at $FILE"
    exit 1
fi

cat << INNER_EOF > "$FILE"
# 🏮 Lantern Broadcast ($FORMATTED_DATE)

## 📡 Daily Signal (Local and Tech)
* * ## 🔍 System Critique and Analysis
* **Observation:** * **Friction Point:** ## 🎯 Directives
* [ ] 
INNER_EOF

echo "[ FogSift ] New transmission lit: $FILE"
