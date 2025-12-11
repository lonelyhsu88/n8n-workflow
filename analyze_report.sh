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
#   - Python 3 虛擬環境 (.venv)
#   - requests 套件 (.venv/bin/pip install -r requirements.txt)
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "🚀 Gemini Daily Report 分析"
echo "========================================"
echo ""

# 檢查虛擬環境是否存在
if [ ! -d "${SCRIPT_DIR}/.venv" ]; then
    echo "❌ 錯誤：找不到虛擬環境"
    echo ""
    echo "請先執行以下命令設置環境："
    echo "  python3 -m venv .venv"
    echo "  .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# 使用虛擬環境中的 Python
"${SCRIPT_DIR}/.venv/bin/python" "${SCRIPT_DIR}/analyze_report.py"

exit $?
