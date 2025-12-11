#!/bin/bash
#
# 設置 Gemini Daily Report 自動下載 cron job
#
# 使用方式：
#   ./setup-cronjob.sh
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_TIME="0 9 * * *"  # 每天早上 9:00 執行

# cron job 內容
CRON_JOB="$CRON_TIME cd $SCRIPT_DIR && ./analyze_report.sh >> $SCRIPT_DIR/cronjob.log 2>&1"

echo "=========================================="
echo "🔧 設置 Gemini Daily Report Cron Job"
echo "=========================================="
echo ""
echo "執行時間: 每天 09:00"
echo "腳本路徑: $SCRIPT_DIR/analyze_report.sh"
echo "日誌檔案: $SCRIPT_DIR/cronjob.log"
echo ""

# 檢查是否已存在相同的 cron job
if crontab -l 2>/dev/null | grep -q "analyze_report.sh"; then
    echo "⚠️  已存在 analyze_report.sh 的 cron job"
    echo ""
    echo "目前的 cron jobs:"
    crontab -l | grep "analyze_report.sh"
    echo ""
    read -p "是否要移除舊的並重新設置？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 取消設置"
        exit 0
    fi

    # 移除舊的 cron job
    crontab -l | grep -v "analyze_report.sh" | crontab -
    echo "✅ 已移除舊的 cron job"
fi

# 新增 cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "✅ Cron job 設置完成！"
echo ""
echo "=========================================="
echo "📋 設置資訊"
echo "=========================================="
echo "排程: 每天 09:00"
echo "指令: $CRON_JOB"
echo ""
echo "=========================================="
echo "💡 驗證設置"
echo "=========================================="
echo ""
crontab -l | grep "analyze_report.sh"
echo ""
echo "=========================================="
echo "📝 後續步驟"
echo "=========================================="
echo ""
echo "1. 每天 09:00，腳本會自動："
echo "   ✅ 下載 Tableau 報表圖片"
echo "   ✅ 發送通知到 Slack #ops-test"
echo ""
echo "2. 你收到通知後，在 Claude Code 中執行："
echo "   請分析 <圖片路徑> 並發送分析結果到 #ops-test"
echo ""
echo "3. 查看執行日誌："
echo "   tail -f $SCRIPT_DIR/cronjob.log"
echo ""
echo "=========================================="
