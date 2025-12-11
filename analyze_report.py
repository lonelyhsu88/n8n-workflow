#!/usr/bin/env python3
"""
Gemini Daily Report 分析腳本

此腳本會：
1. 從 Tableau 下載最新的 Gemini Daily Report 圖片
2. 儲存圖片到 /tmp/claude/gemini_report_latest.png
3. 提示用戶在 Claude Code 中進行分析

使用方式：
    ./analyze_report.sh

    然後在 Claude Code 中輸入：
    請分析 /tmp/claude/gemini_report_latest.png 並發送到 Slack #ops-test
"""

import requests
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# 載入 .env 檔案中的環境變數
load_dotenv()

# ==================== 配置 ====================

# Tableau API - 從環境變數讀取敏感資訊
TABLEAU_API_URL = os.environ.get("TABLEAU_API_URL", "https://prod-apnortheast-a.online.tableau.com")
TABLEAU_SITE_ID = os.environ.get("TABLEAU_SITE_ID", "1b4032aa-745d-491e-93a6-847c7d77e26e")
TABLEAU_VIEW_ID = os.environ.get("TABLEAU_VIEW_ID", "f76c724f-5625-4b84-aea5-59bc0a63b233")
TABLEAU_PAT_NAME = os.environ.get("TABLEAU_PAT_NAME")
TABLEAU_PAT_SECRET = os.environ.get("TABLEAU_PAT_SECRET")

# 驗證必要的環境變數
if not TABLEAU_PAT_NAME or not TABLEAU_PAT_SECRET:
    print("❌ 錯誤: 請設定環境變數 TABLEAU_PAT_NAME 和 TABLEAU_PAT_SECRET")
    print("   export TABLEAU_PAT_NAME='your-pat-name'")
    print("   export TABLEAU_PAT_SECRET='your-pat-secret'")
    sys.exit(1)

# 圖片儲存目錄 (專案目錄下，已加入 .gitignore)
IMAGE_DIR = "/Users/lonelyhsu/gemini/claude-project/n8n-workflow/gemini-hashbingo-report"


def get_image_path():
    """取得帶有日期的圖片路徑"""
    date_str = datetime.now().strftime("%Y%m%d")
    return f"{IMAGE_DIR}/gemini_report_{date_str}.png"


def ensure_directory():
    """確保目錄存在"""
    os.makedirs(IMAGE_DIR, exist_ok=True)


def tableau_login():
    """登入 Tableau 取得 auth token"""
    print("🔐 登入 Tableau...")

    url = f"{TABLEAU_API_URL}/api/3.4/auth/signin"
    body = f"""<tsRequest>
        <credentials personalAccessTokenName="{TABLEAU_PAT_NAME}"
                     personalAccessTokenSecret="{TABLEAU_PAT_SECRET}">
            <site contentUrl="tableauadmin59b92d016b" />
        </credentials>
    </tsRequest>"""

    headers = {"Content-Type": "application/xml"}
    response = requests.post(url, data=body, headers=headers)

    if response.status_code == 200:
        import xml.etree.ElementTree as ET
        root = ET.fromstring(response.text)
        ns = {'t': 'http://tableau.com/api'}
        credentials = root.find('.//t:credentials', ns)
        if credentials is not None:
            token = credentials.get('token')
            print("   ✅ 登入成功")
            return token

    print(f"   ❌ 登入失敗: {response.status_code}")
    return None


def download_report_image(token):
    """下載報表圖片"""
    print("📥 下載報表圖片...")

    url = f"{TABLEAU_API_URL}/api/3.4/sites/{TABLEAU_SITE_ID}/views/{TABLEAU_VIEW_ID}/image?maxAge=1"
    headers = {"X-Tableau-Auth": token}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        print(f"   ✅ 下載成功 ({len(response.content)} bytes)")
        return response.content

    print(f"   ❌ 下載失敗: {response.status_code}")
    return None


def send_slack_notification(image_path):
    """發送 Slack 通知"""
    slack_token = os.environ.get("SLACK_USER_TOKEN")
    if not slack_token:
        print("⚠️  未設定 SLACK_USER_TOKEN，跳過 Slack 通知")
        return False

    channel_id = "C07KQTH9F1T"  # #ops-test
    date_str = datetime.now().strftime("%Y/%m/%d")

    message = f"""📊 *Gemini Daily Report 已下載完成* ({date_str})

✅ 報表圖片已成功下載
📂 檔案路徑: `{image_path}`

🔔 請 <@U07F9203EP8> 在 Claude Code 中執行分析：
```
請分析 {image_path} 並發送分析結果到 #ops-test
```

---
🤖 _自動化通知 by analyze_report.py_"""

    try:
        url = 'https://slack.com/api/chat.postMessage'
        payload = {
            'channel': channel_id,
            'text': message,
            'mrkdwn': True
        }
        headers = {
            'Authorization': f'Bearer {slack_token}',
            'Content-Type': 'application/json'
        }

        print("📤 發送通知到 Slack #ops-test...")
        response = requests.post(url, json=payload, headers=headers)
        result = response.json()

        if result.get('ok'):
            print("   ✅ Slack 通知已發送")
            return True
        else:
            print(f"   ⚠️  Slack 通知失敗: {result.get('error')}")
            return False
    except Exception as e:
        print(f"   ⚠️  Slack 通知錯誤: {e}")
        return False


def main():
    """主程式"""
    print("=" * 60)
    print("🚀 Gemini Daily Report 圖片下載")
    print("=" * 60)

    today = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"📅 執行時間: {today}")
    print()

    # 確保目錄存在
    ensure_directory()

    # 取得今天的圖片路徑
    image_path = get_image_path()

    # Step 1: 登入 Tableau
    token = tableau_login()
    if not token:
        print("\n❌ 無法登入 Tableau，結束執行")
        sys.exit(1)

    # Step 2: 下載報表圖片
    image_data = download_report_image(token)
    if not image_data:
        print("\n❌ 無法下載報表圖片，結束執行")
        sys.exit(1)

    # Step 3: 儲存圖片
    print()
    with open(image_path, 'wb') as f:
        f.write(image_data)
    print(f"💾 圖片已儲存: {image_path}")

    # Step 4: 發送 Slack 通知
    print()
    send_slack_notification(image_path)

    # Step 5: 完成
    print()
    print("=" * 60)
    print("✅ 圖片下載完成！")
    print("=" * 60)
    print()
    print("💡 已發送通知到 Slack #ops-test")
    print("   等待手動分析...")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
