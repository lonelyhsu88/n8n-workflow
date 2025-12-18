#!/usr/bin/env python3
"""
發送 Gemini Daily Report 分析到 Slack (使用 chat.postMessage)

使用方式：
    python send_analysis_to_slack.py <channel> <analysis_file>
"""

import requests
import sys
import os
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

SLACK_TOKEN = os.environ.get("SLACK_USER_TOKEN") or os.environ.get("SLACK_TOKEN")
SLACK_API_BASE = "https://slack.com/api"

if not SLACK_TOKEN:
    print("❌ 錯誤: 請設定環境變數 SLACK_USER_TOKEN 或 SLACK_TOKEN")
    sys.exit(1)


def send_message_to_slack(channel, text):
    """使用 chat.postMessage 發送訊息到 Slack"""

    headers = {
        "Authorization": f"Bearer {SLACK_TOKEN}",
        "Content-Type": "application/json"
    }

    data = {
        "channel": channel,
        "text": text,
        "mrkdwn": True
    }

    response = requests.post(
        f"{SLACK_API_BASE}/chat.postMessage",
        headers=headers,
        json=data
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
        print("使用方式: python send_analysis_to_slack.py <channel> <analysis_file>")
        print("範例: python send_analysis_to_slack.py ops-test analysis.txt")
        sys.exit(1)

    channel = sys.argv[1]
    analysis_file = sys.argv[2]

    if not os.path.exists(analysis_file):
        print(f"❌ 找不到分析文件: {analysis_file}")
        sys.exit(1)

    # 讀取分析內容
    print(f"📖 讀取分析文件: {analysis_file}")
    with open(analysis_file, 'r', encoding='utf-8') as f:
        analysis = f.read()

    # 發送到 Slack
    print(f"📤 正在發送分析到 #{channel}...")
    send_message_to_slack(channel, analysis)


if __name__ == "__main__":
    main()
