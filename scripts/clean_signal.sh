#!/bin/bash
# clean_signal.sh - Strips the "Fog" from the raw transmissions

INPUT=$1
OUTPUT="${INPUT}.clean"

echo -n "   [ 🧼 ] Purifying signal... "

# Delete lines containing common news site "junk"
grep -vEi "advertisement|privacy policy|copyright|terms of service|sign in|subscribe|all rights reserved|cookie" "$INPUT" | \
tr -s ' ' | \
head -c 2000 > "$OUTPUT"

echo "Done. (Reduced to $(wc -c < "$OUTPUT") bytes)"
