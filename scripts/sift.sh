#!/bin/bash
# sift.sh - Processes raw transmissions using local llama.cpp

# Pointing to the new CMake build location
BINARY=~/Code/llama.cpp/build/bin/llama-cli
MODEL=~/Code/llama.cpp/qwen2.5-coder-7b-instruct-q4_k_m.gguf
DATE=$(date +%Y-%m-%d_%H%M)
INPUT_FILE=$(ls -1t transmissions/raw-*.md | head -n 1)
OUTPUT_FILE="archive/briefing-${DATE}.md"

# Fallback for older binary names if needed
if [ ! -f "$BINARY" ]; then BINARY=~/Code/llama.cpp/build/bin/main; fi

echo "========================================"
echo "🏮 FOGSIFT SIFTER"
echo "Processing: $INPUT_FILE"
echo "========================================"

# Run local inference with Qwen 2.5
$BINARY -m "$MODEL" \
  -p "<|im_start|>system\n$(cat system_instructions.md)<|im_end|>\n<|im_start|>user\nSift through this raw data and generate the morning briefing:\n$(cat "$INPUT_FILE")<|im_end|>\n<|im_start|>assistant" \
  -n 2048 --temp 0.2 -ngl 99 > "$OUTPUT_FILE"

echo "[ FogSift ] Signal processed and archived to $OUTPUT_FILE"
./scripts/lantern-ingest.sh "$OUTPUT_FILE"
