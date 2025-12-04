#!/bin/bash
#
# Gemini Daily Report 分析腳本
#
# 功能：從 Tableau 抓取報表圖片，透過 Claude 分析後發送到 Slack #ops-test
#
# 使用方式：
#   ./analyze_report.sh
#
# 需求：
#   - Python 3
#   - requests 套件 (pip install requests)
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "🚀 Gemini Daily Report 分析"
echo "========================================"
echo ""

# 執行 Python 分析腳本
python3 "${SCRIPT_DIR}/analyze_report.py"

exit $?
