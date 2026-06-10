#!/bin/bash
# Pathfinder: Solidifying the v0.0.1 Bridge

# 1. Get the absolute path of the project
ABS_PATH=$(pwd)

# 2. Update the Sifter to use absolute paths for the Database
sed -i '' "s|PROJECT_ROOT=\$(pwd)|PROJECT_ROOT=$ABS_PATH|g" scripts/sift.sh

# 3. Verify Database Integrity
echo "📂 Current Sovereign Archive Status:"
sqlite3 core/lantern.sqlite "SELECT COUNT(*) || ' briefings found in index.' FROM briefings;"

# 4. Sync the Archive folder
echo "📦 Physical backups found: $(ls archive/*.md | wc -l)"

echo "--------------------------------"
echo "✅ PATHS LOCKED. Ready for Mission Control."
