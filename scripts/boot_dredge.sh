#!/bin/bash
# Failsafe Booter for Firecrawl (The Dredge)

echo ">> PRE-FLIGHT CHECK: Docker Engine..."
if ! docker info > /dev/null 2>&1; then
    echo "!! ERROR: Docker daemon is offline."
    echo ">> Waking up Docker Desktop..."
    open -a Docker
    echo "!! ACTION REQUIRED: Wait for the Docker icon in your Mac menu bar to stop animating, then run this script again."
    exit 1
fi

FIRECRAWL_PATH="/Users/ctavolazzi/Code/firecrawl"

if [ ! -d "$FIRECRAWL_PATH" ]; then
    echo "!! ERROR: Cannot find Firecrawl at $FIRECRAWL_PATH"
    exit 1
fi

echo ">> Docker is alive. Igniting the Dredge..."
cd "$FIRECRAWL_PATH" && docker compose up -d

echo ">> Waiting for API to warm up (Timeout: 90s)..."
TIMEOUT=90
while [[ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/health)" != "200" ]]; do
    if [ $TIMEOUT -le 0 ]; then
        echo "!! ERROR: Firecrawl boot timed out. Check Docker logs."
        exit 1
    fi
    sleep 5
    TIMEOUT=$((TIMEOUT-5))
done

echo "✅ DREDGE IS FULLY ONLINE AND READY."
