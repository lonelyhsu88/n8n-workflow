#!/usr/bin/env python3
"""
Slack Helper - 快速查詢工具
使用方式：
  python slack_helper.py channels                    # 列出所有頻道
  python slack_helper.py search "關鍵字"              # 搜尋訊息
  python slack_helper.py history <channel_name>      # 讀取頻道歷史
  python slack_helper.py thread <channel_name> <ts>  # 讀取討論串
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# 配置 - 從環境變數讀取敏感資訊
SLACK_TOKEN = os.environ.get("SLACK_USER_TOKEN") or os.environ.get("SLACK_TOKEN")
SLACK_API_BASE = "https://slack.com/api"

if not SLACK_TOKEN:
    print("❌ 錯誤: 請設定環境變數 SLACK_USER_TOKEN 或 SLACK_TOKEN")
    print("   export SLACK_USER_TOKEN='xoxp-...'")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {SLACK_TOKEN}",
    "Content-Type": "application/json"
}

# 常用頻道快取（已預載入 ID，避免每次查詢）
COMMON_CHANNELS = {
    "gemini-rd": "C07KEDS4W8N",
    "gemini-專案討論": "C07K81AM9EE",
    "gemini-每日彙報": "C07KLQ81N2X",
    "gemini-build-notification": "C07LY5YAURJ",
    "fa-gemini-技術討論": "C07KFS4SU94",
    "gemini-升級-rel": "C07K84CJF7U",
    "gemini-升級-prod": "C07KWTPR600",
    "gemini-升級-demo": "C07JTHLLJBH",
    "gemini-infra": "C07KT8GV4PL",
    "gemini-外部對接": "C07KD6SN955",
    "溝通-backend-qa": "C07K9DS8FGC",
    "溝通-backend-devops": "C07K6RYEBR9",
    "gemini-frontend-devops": "C07LPPWBDBL",
    "gemini-daily-currency-checker": "C07LY63TEEQ",
    "溝通-pm-devops": "C07MNR6NU3T",
    "zbx-alerts-prd": "C07LG88R9GC",
    "prd-風險控管": "C07K35EACT1",
}


def get_user_name(user_id):
    """取得用戶真實姓名"""
    if user_id == "Unknown":
        return user_id

    try:
        response = requests.get(
            f"{SLACK_API_BASE}/users.info",
            headers=headers,
            params={"user": user_id},
            timeout=5
        )
        if response.json().get("ok"):
            user_info = response.json()["user"]
            return user_info.get("real_name", user_info.get("name", user_id))
    except:
        pass

    return user_id


def list_channels():
    """列出所有頻道"""
    print("🔍 列出所有 Slack 頻道...\n")

    response = requests.get(
        f"{SLACK_API_BASE}/conversations.list",
        headers=headers,
        params={
            "types": "public_channel,private_channel",
            "limit": 1000,
            "exclude_archived": True
        }
    )

    if response.status_code != 200 or not response.json().get("ok"):
        print(f"❌ 取得頻道失敗: {response.json().get('error', 'Unknown')}")
        return

    channels = response.json().get("channels", [])

    # 過濾相關頻道
    keywords = ["gemini", "rd", "需求", "backend", "devops", "frontend"]
    relevant = [ch for ch in channels if any(kw in ch["name"].lower() for kw in keywords)]

    print(f"📊 相關頻道 ({len(relevant)} 個)：\n")

    for ch in sorted(relevant, key=lambda x: x.get("num_members", 0), reverse=True):
        member_status = "✅" if ch.get("is_member", False) else "❌"
        print(f"{member_status} #{ch['name']:<40} (ID: {ch['id']}, {ch.get('num_members', 0)} 成員)")


def search_messages(query, days=30):
    """搜尋訊息（直接讀取頻道歷史）"""
    print(f"🔍 搜尋關鍵字: {query}\n")

    # 預設搜尋 gemini-rd 頻道
    channel_id = COMMON_CHANNELS["gemini-rd"]
    oldest_ts = (datetime.now() - timedelta(days=days)).timestamp()

    all_messages = []
    page = 1
    cursor = None

    while page <= 10:  # 最多 10 頁
        params = {
            "channel": channel_id,
            "limit": 100,
            "oldest": oldest_ts
        }
        if cursor:
            params["cursor"] = cursor

        response = requests.get(
            f"{SLACK_API_BASE}/conversations.history",
            headers=headers,
            params=params
        )

        if not response.json().get("ok"):
            break

        messages = response.json().get("messages", [])
        all_messages.extend(messages)

        if not response.json().get("has_more", False):
            break

        cursor = response.json().get("response_metadata", {}).get("next_cursor")
        if not cursor:
            break

        page += 1

    # 過濾包含關鍵字的訊息
    results = [msg for msg in all_messages if query.lower() in msg.get("text", "").lower()]

    print(f"📊 找到 {len(results)} 則相關訊息\n")
    print("=" * 100)

    for idx, msg in enumerate(sorted(results, key=lambda x: x.get("ts", ""), reverse=True)[:10], 1):
        timestamp = datetime.fromtimestamp(float(msg["ts"])).strftime("%Y-%m-%d %H:%M:%S")
        user_id = msg.get("user", "Unknown")
        text = msg.get("text", "")

        print(f"\n【訊息 {idx}】")
        print(f"時間: {timestamp}")
        print(f"發言人: {get_user_name(user_id)}")
        print(f"內容: {text[:200]}{'...' if len(text) > 200 else ''}")

        if msg.get("reply_count", 0) > 0:
            print(f"💬 {msg['reply_count']} 則回覆")

        print(f"TS: {msg['ts']}")  # 顯示 timestamp 供後續使用
        print("-" * 100)


def get_channel_history(channel_name, days=7, limit=20):
    """讀取頻道歷史訊息"""
    # 先找到頻道 ID
    if channel_name in COMMON_CHANNELS and COMMON_CHANNELS[channel_name]:
        channel_id = COMMON_CHANNELS[channel_name]
    else:
        # 搜尋頻道
        response = requests.get(
            f"{SLACK_API_BASE}/conversations.list",
            headers=headers,
            params={"types": "public_channel,private_channel", "limit": 1000}
        )

        channels = response.json().get("channels", [])
        matching = [ch for ch in channels if channel_name.lower() in ch["name"].lower()]

        if not matching:
            print(f"❌ 找不到頻道: {channel_name}")
            return

        channel_id = matching[0]["id"]
        print(f"✅ 找到頻道: #{matching[0]['name']} (ID: {channel_id})\n")

    # 讀取訊息
    oldest_ts = (datetime.now() - timedelta(days=days)).timestamp()

    response = requests.get(
        f"{SLACK_API_BASE}/conversations.history",
        headers=headers,
        params={
            "channel": channel_id,
            "limit": limit,
            "oldest": oldest_ts
        }
    )

    if not response.json().get("ok"):
        print(f"❌ 讀取失敗: {response.json().get('error', 'Unknown')}")
        return

    messages = response.json().get("messages", [])

    print(f"📊 最近 {days} 天的 {len(messages)} 則訊息\n")
    print("=" * 100)

    for idx, msg in enumerate(messages, 1):
        timestamp = datetime.fromtimestamp(float(msg["ts"])).strftime("%Y-%m-%d %H:%M:%S")
        user_id = msg.get("user", "Unknown")
        text = msg.get("text", "")

        print(f"\n【訊息 {idx}】")
        print(f"時間: {timestamp}")
        print(f"發言人: {get_user_name(user_id)}")
        print(f"內容: {text[:200]}{'...' if len(text) > 200 else ''}")

        if msg.get("reply_count", 0) > 0:
            print(f"💬 {msg['reply_count']} 則回覆")

        print(f"TS: {msg['ts']}")
        print("-" * 100)


def get_thread(channel_name, thread_ts):
    """讀取討論串"""
    # 找到頻道 ID
    if channel_name in COMMON_CHANNELS and COMMON_CHANNELS[channel_name]:
        channel_id = COMMON_CHANNELS[channel_name]
    else:
        response = requests.get(
            f"{SLACK_API_BASE}/conversations.list",
            headers=headers,
            params={"types": "public_channel,private_channel", "limit": 1000}
        )

        channels = response.json().get("channels", [])
        matching = [ch for ch in channels if channel_name.lower() in ch["name"].lower()]

        if not matching:
            print(f"❌ 找不到頻道: {channel_name}")
            return

        channel_id = matching[0]["id"]

    # 讀取討論串
    response = requests.get(
        f"{SLACK_API_BASE}/conversations.replies",
        headers=headers,
        params={
            "channel": channel_id,
            "ts": thread_ts
        }
    )

    if not response.json().get("ok"):
        print(f"❌ 讀取失敗: {response.json().get('error', 'Unknown')}")
        return

    messages = response.json().get("messages", [])

    print(f"📊 討論串包含 {len(messages)} 則訊息\n")
    print("=" * 100)

    for idx, msg in enumerate(messages, 1):
        timestamp = datetime.fromtimestamp(float(msg["ts"])).strftime("%Y-%m-%d %H:%M:%S")
        user_id = msg.get("user", "Unknown")
        text = msg.get("text", "")

        if idx == 1:
            print(f"\n【原始問題】")
        else:
            print(f"\n【回覆 {idx-1}】")

        print(f"時間: {timestamp}")
        print(f"發言人: {get_user_name(user_id)}")
        print(f"\n內容:\n{text}")
        print("-" * 100)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1]

    if command == "channels":
        list_channels()

    elif command == "search":
        if len(sys.argv) < 3:
            print("❌ 請提供搜尋關鍵字")
            return
        query = sys.argv[2]
        days = int(sys.argv[3]) if len(sys.argv) > 3 else 30
        search_messages(query, days)

    elif command == "history":
        if len(sys.argv) < 3:
            print("❌ 請提供頻道名稱")
            return
        channel = sys.argv[2]
        days = int(sys.argv[3]) if len(sys.argv) > 3 else 7
        limit = int(sys.argv[4]) if len(sys.argv) > 4 else 20
        get_channel_history(channel, days, limit)

    elif command == "thread":
        if len(sys.argv) < 4:
            print("❌ 請提供頻道名稱和訊息 timestamp")
            return
        channel = sys.argv[2]
        thread_ts = sys.argv[3]
        get_thread(channel, thread_ts)

    else:
        print(f"❌ 未知指令: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
