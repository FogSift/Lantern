#!/bin/bash
# 1. Take whatever Markdown you just copied from our chat
pbpaste > current_briefing.md

# 2. Run your existing Substack bridge
./scripts/substack-push.sh current_briefing.md

# 3. Open Chrome and paste the rendered Rich Text automatically
osascript -e 'tell application "Google Chrome" to activate' \
          -e 'tell application "Google Chrome" to open location "https://substack.com/publish/post/new"' \
          -e 'delay 5' \
          -e 'tell application "System Events" to keystroke "v" using command down'
