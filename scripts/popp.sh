#!/bin/bash
# 1. Start servers
./scripts/startup.sh

# 2. HARDCODED PROMPT - Piped directly to clipboard
printf "Act as the Lantern Research Parser. Take the unstructured news data and return TWO (2) SEPARATE Markdown code blocks. NO prose. NO intro. NO outro.\n\nBLOCK 1: The Bash Command\nReturn exactly: cat << 'PUSH_EOF' > morning_briefing.md\n[Formatted Content]\nPUSH_EOF\n\n./scripts/substack-push.sh morning_briefing.md\n\nBLOCK 2: Substack Metadata\nReturn a code block containing:\nTITLE OPTIONS:\n1. THE COLLISION: [Global] & [Local]\n2. THE STACK: [Tech] & [Sovereignty]\n3. THE PROTOCOL: [Action] & [Threat]\n4. THE ABSTRACT: [Witty Title]\n\nSubtitle: [Signal]\nTags: Chico, Tech, Sovereignty\n\n## CONSTRAINTS\n- NO em dashes.\n- NO grandiose language.\n- NO 'manifesto'.\n- Location: Chico, CA.\n\n## TEMPLATE (BLOCK 1)\n## **THE READOUT**\n**Chico, CA Node | Thursday, Feb 26, 2026**\n**Current Temp: 68°F**\n\n### **THE SIGNAL**\n[Summary]\n\n### **BY THE NUMBERS**\n* [Data]\n\n### **HARDWARE STACK**\n| Tech | Status | Sovereignty/Utility |\n| :--- | :--- | :--- |\n\n### **DEEP SIGNAL ANALYSIS**\n**Mechanics: [Topic 1]**\n[Analysis]\n\n**Local Empowerment: [Topic 2]**\n[Analysis]\n\n### **TACTICAL DIRECTIVES**\n* [ ] [Action]\n\n### **NODE CONDITIONS**\n* **Location: Chico, CA**\n* **Status: Operational**\n\n### **THE FINISHER**\n> [Quote]\n\n## OUTPUT FORMAT\nONLY return the two code blocks. Nothing else." | pbcopy

# 3. Dashboard
clear
echo "======================================================="
echo "🏮 POPP | Chico, CA Node"
echo "======================================================="
echo "🚀 SERVERS: LIVE"
echo "📋 CLIPBOARD: IRONCLAD PROMPT LOADED"
echo "======================================================="
