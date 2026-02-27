#!/bin/bash
# 1. Save the input to a temporary markdown file
cat > morning_briefing_temp.md

# 2. Run your existing verified bridge
./scripts/substack-push.sh morning_briefing_temp.md

# 3. Open Substack and automate the paste
# Adjust the delay if your browser takes longer to load the editor
osascript -e 'tell application "Google Chrome" to activate' \
          -e 'tell application "Google Chrome" to open location "https://substack.com/publish/post/new"' \
          -e 'delay 5' \
          -e 'tell application "System Events" to keystroke "v" using command down'

echo "Lantern Pipeline Complete: Content pushed to Substack."
