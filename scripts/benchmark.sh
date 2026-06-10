#!/bin/bash
source scripts/ui_elements.sh
print_banner
echo -e "\033[1;35m🛠 FOGSIFT HARDWARE BENCHMARK\033[0m"
echo "Testing ingestion speeds for 2015 Architecture..."
echo "--------------------------------"

TEST_SIZES=(500 1200 2500)

for SIZE in "${TEST_SIZES[@]}"; do
    echo -n "🚀 Testing $SIZE characters... "
    START_TIME=$(date +%s)
    
    # Silent test request
    RESPONSE=$(curl -s -X POST http://localhost:8080/completion \
      -H "Content-Type: application/json" \
      -d "{\"prompt\": \"$(printf 'a%.0s' $(seq 1 $SIZE))\", \"n_predict\": 1}")
    
    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - START_TIME))
    echo -e "\033[1;32m${ELAPSED}s\033[0m"
done

echo "--------------------------------"
echo "Recommended Signal Strength: Use the size that took < 30s."
