#!/usr/bin/env python3
"""
發送 Gemini Daily Report 分析到 Slack

使用方式：
    python send_report_to_slack.py <image_path> <channel>
"""

import requests
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

SLACK_TOKEN = os.environ.get("SLACK_USER_TOKEN") or os.environ.get("SLACK_TOKEN")
SLACK_API_BASE = "https://slack.com/api"

if not SLACK_TOKEN:
    print("❌ 錯誤: 請設定環境變數 SLACK_USER_TOKEN 或 SLACK_TOKEN")
    sys.exit(1)


def analyze_report_image(image_path):
    """分析報表圖片內容"""
    # 基於圖片路徑判斷日期
    filename = os.path.basename(image_path)
    date_str = filename.replace("gemini_report_", "").replace(".png", "")

    # 格式化日期
    try:
        date_obj = datetime.strptime(date_str, "%Y%m%d")
        formatted_date = date_obj.strftime("%Y/%m/%d")
    except:
        formatted_date = date_str

    return formatted_date


def send_to_slack(image_path, channel, analysis_text):
    """發送圖片和分析到 Slack"""

    # 1. 上傳圖片到 Slack
    headers = {"Authorization": f"Bearer {SLACK_TOKEN}"}

    with open(image_path, 'rb') as f:
        files = {'file': f}
        data = {
            'channels': channel,
            'initial_comment': analysis_text,
            'filename': os.path.basename(image_path)
        }

        response = requests.post(
            f"{SLACK_API_BASE}/files.upload",
            headers=headers,
            files=files,
            data=data
        )

    if response.status_code == 200 and response.json().get("ok"):
        print(f"✅ 成功發送到 #{channel}")
        return True
    else:
        error = response.json().get("error", "Unknown error")
        print(f"❌ 發送失敗: {error}")
        print(f"Response: {response.text}")
        return False


def main():
    if len(sys.argv) < 3:
        print("使用方式: python send_report_to_slack.py <image_path> <channel> [analysis_file]")
        print("範例: python send_report_to_slack.py report.png ops-test")
        print("範例: python send_report_to_slack.py report.png ops-test analysis.txt")
        sys.exit(1)

    image_path = sys.argv[1]
    channel = sys.argv[2]
    analysis_file = sys.argv[3] if len(sys.argv) > 3 else None

    if not os.path.exists(image_path):
        print(f"❌ 找不到圖片: {image_path}")
        sys.exit(1)

    # 讀取分析內容（如果提供）
    if analysis_file and os.path.exists(analysis_file):
        print(f"📖 讀取分析文件: {analysis_file}")
        with open(analysis_file, 'r', encoding='utf-8') as f:
            analysis = f.read()
    else:
        # 使用預設分析
        report_date = analyze_report_image(image_path)
        analysis = f"""📊 *Gemini Daily Report - {report_date}*

🔍 *每日數據分析報告已產生*

報表圖片已上傳，請查看詳細數據。

---
_此報告由自動化系統產生_
"""

    # 發送到 Slack
    print(f"📤 正在發送報告到 #{channel}...")
    send_to_slack(image_path, channel, analysis)


if __name__ == "__main__":
    main()
