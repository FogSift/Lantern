#!/bin/bash
# generate-rca.sh - Instantiates a new Root Cause Analysis document

if [ -z "$1" ]; then
    echo "Usage: ./scripts/generate-rca.sh <subject-name>"
    exit 1
fi

SUBJECT=$1
DATE=$(date +%Y-%m-%d)
FILE="resources/${DATE}-RCA-${SUBJECT}.md"

if [ -f "$FILE" ]; then
    echo "[ FogSift ] RCA for $SUBJECT already exists at $FILE"
    exit 1
fi

cp resources/templates/rca-template.md "$FILE"
sed -i '' "s/\[Subject\]/$SUBJECT/g" "$FILE"

echo "[ FogSift ] New RCA document created: $FILE"
