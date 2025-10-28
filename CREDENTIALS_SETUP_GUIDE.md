# 🔐 憑證設定指南 - 出勤統計分析 Workflow

**參考 Workflow**: CPC Oil Price (已成功配置)
**目標 Workflow**: 出勤統計分析-優化版 (ID: 9omWYJLV7jqv18lN)

---

## 📋 憑證需求總覽

### 已存在的憑證 (可直接使用)

從 CPC Oil Price workflow 中，我們發現以下憑證已經設定好：

| 憑證名稱 | 憑證 ID | 類型 | 用途 | 狀態 |
|---------|---------|------|------|------|
| **n8n-googlesheet** | `u1JNoGs9f7NtuqBD` | Google Sheets OAuth2 | 讀寫 Google Sheets | ✅ 可用 |
| **n8n-ops** | `UfdPURfRn78d2HjH` | Slack OAuth2 | 發送 Slack 訊息 | ✅ 可用 |

✅ **好消息**: 您的出勤統計 workflow 可以直接使用這些已存在的憑證！

---

## 🎯 快速設定步驟

### 方式 1: 透過 n8n Web UI 手動設定 (推薦)

1. **開啟 Workflow**:
   ```
   https://n88.zeabur.app/workflow/9omWYJLV7jqv18lN
   ```

2. **設定 Slack 憑證** (2 個節點):

   #### 節點 1: 「取得頻道資訊」
   ```
   1. 點擊節點
   2. 找到 "Credential" 欄位
   3. 在下拉選單中選擇: n8n-ops
   4. Save
   ```

   #### 節點 2: 「lonely.h」
   ```
   1. 點擊節點
   2. 找到 "Credential" 欄位
   3. 在下拉選單中選擇: n8n-ops
   4. Save
   ```

3. **設定 Google Sheets 憑證** (4 個節點):

   #### 節點 3: 「清空今日請假」
   ```
   1. 點擊節點
   2. 找到 "Credential" 欄位
   3. 在下拉選單中選擇: n8n-googlesheet
   4. Save
   ```

   #### 節點 4: 「更新今日請假」
   ```
   1. 點擊節點
   2. 在下拉選單中選擇: n8n-googlesheet
   3. Save
   ```

   #### 節點 5: 「清空2025年排行榜」
   ```
   1. 點擊節點
   2. 在下拉選單中選擇: n8n-googlesheet
   3. Save
   ```

   #### 節點 6: 「更新2025年排行榜」
   ```
   1. 點擊節點
   2. 在下拉選單中選擇: n8n-googlesheet
   3. Save
   ```

4. **儲存 Workflow**:
   ```
   點擊右上角的 "Save" 按鈕
   ```

5. **測試執行**:
   ```
   點擊 "Execute Workflow" 按鈕
   確認所有節點都成功執行（變成綠色）
   ```

---

### 方式 2: 透過 API 設定 (進階)

如果您想透過 API 批量設定憑證，可以參考以下腳本：

```bash
#!/bin/bash

N8N_URL="https://n88.zeabur.app"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyN2Y5OTM1NS0wN2NhLTRlYjAtYjE0YS02MmMzMmMxZjcwZjkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNjQyODI3fQ.xtWzkRPvttvk724E2skRXzcX-gGBR3aDO54VyO9aQCE"
WORKFLOW_ID="9omWYJLV7jqv18lN"

# 憑證 ID
SLACK_CRED_ID="UfdPURfRn78d2HjH"
GOOGLE_CRED_ID="u1JNoGs9f7NtuqBD"

echo "正在更新 workflow 憑證..."

# 注意: n8n API 目前不支援直接更新單個節點的憑證
# 需要透過 Web UI 手動設定，或重新匯入整個 workflow
echo "⚠️  請使用 Web UI 手動設定憑證（方式 1）"
```

---

## 📊 節點與憑證對照表

### Slack 節點 (2 個)

| 節點名稱 | 節點 ID | 憑證類型 | 使用憑證 | 參數 |
|---------|---------|----------|----------|------|
| 取得頻道資訊 | - | Slack OAuth2 | **n8n-ops** | Channel: C05FXLH7BCJ |
| lonely.h | - | Slack OAuth2 | **n8n-ops** | User: U07F9203EP8 |

### Google Sheets 節點 (4 個)

| 節點名稱 | 節點 ID | 憑證類型 | 使用憑證 | 參數 |
|---------|---------|----------|----------|------|
| 清空今日請假 | - | Google Sheets OAuth2 | **n8n-googlesheet** | Document: 176_Vy1vjv-... |
| 更新今日請假 | - | Google Sheets OAuth2 | **n8n-googlesheet** | Document: 176_Vy1vjv-... |
| 清空2025年排行榜 | - | Google Sheets OAuth2 | **n8n-googlesheet** | Document: 176_Vy1vjv-... |
| 更新2025年排行榜 | - | Google Sheets OAuth2 | **n8n-googlesheet** | Document: 176_Vy1vjv-... |

---

## 🔍 憑證詳細資訊

### n8n-ops (Slack OAuth2)

**憑證 ID**: `UfdPURfRn78d2HjH`
**類型**: Slack OAuth2 API
**用途**:
- 讀取 Slack 頻道訊息
- 發送 Slack 通知給使用者

**已驗證的功能** (來自 CPC Oil Price workflow):
- ✅ 發送訊息到使用者 (Send Message to User)
- ✅ 存取公開頻道

**權限** (推測):
```
✅ channels:history    - 讀取頻道歷史訊息
✅ channels:read       - 讀取頻道資訊
✅ chat:write          - 發送訊息
✅ users:read          - 讀取使用者資訊
```

**Bot Token 格式**: `xoxb-xxxxxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx`

---

### n8n-googlesheet (Google Sheets OAuth2)

**憑證 ID**: `u1JNoGs9f7NtuqBD`
**類型**: Google Sheets OAuth2 API
**用途**:
- 讀取 Google Sheets 資料
- 寫入 Google Sheets 資料
- 清空 Google Sheets 範圍
- 新增 Google Sheets 資料

**已驗證的功能** (來自 CPC Oil Price workflow):
- ✅ 讀取工作表資料 (Read operation)
- ✅ 新增資料到工作表 (Append operation)

**權限**:
```
✅ https://www.googleapis.com/auth/spreadsheets    - 完整的試算表存取權
✅ https://www.googleapis.com/auth/drive.readonly  - 讀取 Drive 檔案
```

**目標 Google Sheets**:
```
Document ID: 176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw
URL: https://docs.google.com/spreadsheets/d/176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw/edit
```

**工作表**:
- 今日請假
- 2025排行榜

---

## ✅ 驗證憑證設定

### 檢查清單

完成憑證設定後，請逐項確認：

#### Slack 憑證驗證
- [ ] 「取得頻道資訊」節點顯示綠色勾勾
- [ ] 「lonely.h」節點顯示綠色勾勾
- [ ] 沒有 "Credential is not set" 錯誤
- [ ] 測試執行時可以讀取 Slack 訊息
- [ ] 測試執行時可以發送 Slack 通知

#### Google Sheets 憑證驗證
- [ ] 「清空今日請假」節點顯示綠色勾勾
- [ ] 「更新今日請假」節點顯示綠色勾勾
- [ ] 「清空2025年排行榜」節點顯示綠色勾勾
- [ ] 「更新2025年排行榜」節點顯示綠色勾勾
- [ ] 沒有 "Credential is not set" 錯誤
- [ ] 測試執行時可以讀取 Google Sheets
- [ ] 測試執行時可以寫入 Google Sheets

---

## 🐛 常見問題排除

### 問題 1: 找不到憑證選項

**症狀**:
```
Credential 下拉選單中沒有 "n8n-ops" 或 "n8n-googlesheet"
```

**可能原因**:
- 憑證類型不匹配
- 憑證已被刪除

**解決方案**:
```
1. 確認節點類型正確:
   - Slack 節點 → 需要 Slack OAuth2 憑證
   - Google Sheets 節點 → 需要 Google Sheets OAuth2 憑證

2. 檢查憑證是否存在:
   前往 n8n Settings → Credentials
   確認 "n8n-ops" 和 "n8n-googlesheet" 都存在
```

---

### 問題 2: Slack 錯誤 "channel_not_found"

**症狀**:
```json
{
  "error": "channel_not_found",
  "message": "Value passed for channel was invalid."
}
```

**原因**: Bot 沒有被加入 #jvd每日出勤回報 頻道

**解決方案**:
```
1. 在 Slack 中開啟 #jvd每日出勤回報 頻道
2. 執行指令: /invite @你的機器人名稱
3. 確認 Bot 成功加入頻道
4. 重新執行 workflow
```

---

### 問題 3: Slack 錯誤 "not_authed"

**症狀**:
```json
{
  "error": "not_authed",
  "message": "No authentication token provided."
}
```

**原因**: Slack 憑證無效或過期

**解決方案**:
```
1. 前往 n8n Settings → Credentials
2. 找到 "n8n-ops" 憑證
3. 點擊 "Edit"
4. 檢查 Access Token 是否正確
5. 如果過期，重新取得 Bot Token:
   - 前往 https://api.slack.com/apps
   - 選擇您的 App
   - OAuth & Permissions → 複製 Bot User OAuth Token
6. 更新憑證並儲存
```

---

### 問題 4: Google Sheets 錯誤 "Permission denied"

**症狀**:
```json
{
  "error": "The caller does not have permission"
}
```

**原因**: Google 帳號沒有 Sheets 的編輯權限

**解決方案**:
```
1. 開啟 Google Sheets:
   https://docs.google.com/spreadsheets/d/176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw

2. 點擊右上角「共用」按鈕

3. 確認 n8n 授權的 Google 帳號已加入

4. 設定權限為「編輯者」

5. 重新執行 workflow
```

---

### 問題 5: 憑證設定後節點仍顯示紅色

**症狀**:
```
節點有紅色錯誤標記，即使憑證已設定
```

**可能原因**:
- 憑證類型不匹配
- 節點參數錯誤
- 網路連線問題

**Debug 步驟**:
```
1. 點擊節點查看詳細錯誤訊息

2. 常見錯誤訊息:
   - "Invalid credentials" → 重新設定憑證
   - "Resource not found" → 檢查 Channel ID / Document ID
   - "Network error" → 檢查網路連線

3. 測試憑證:
   - 在 n8n Settings → Credentials
   - 點擊憑證 → "Test connection"
```

---

## 📖 參考資料

### CPC Oil Price Workflow 配置

**Workflow ID**: `hO1f83rbEq1sfKdz`
**使用的憑證**:
- Slack: n8n-ops (ID: UfdPURfRn78d2HjH)
- Google Sheets: n8n-googlesheet (ID: u1JNoGs9f7NtuqBD)

**配置示例**:

#### Slack 節點
```json
{
  "name": "Send Notification",
  "type": "n8n-nodes-base.slack",
  "credentials": {
    "slackApi": {
      "id": "UfdPURfRn78d2HjH",
      "name": "n8n-ops"
    }
  },
  "parameters": {
    "select": "user",
    "user": {
      "__rl": true,
      "value": "U07F9203EP8",
      "mode": "list",
      "cachedResultName": "lonely.h"
    },
    "text": "={{$node['Format Notification'].json['notification']}}"
  }
}
```

#### Google Sheets 節點
```json
{
  "name": "Save to Google Sheets",
  "type": "n8n-nodes-base.googleSheets",
  "credentials": {
    "googleApi": {
      "id": "u1JNoGs9f7NtuqBD",
      "name": "n8n-googlesheet"
    }
  },
  "parameters": {
    "authentication": "serviceAccount",
    "operation": "append",
    "documentId": {
      "__rl": true,
      "value": "1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8",
      "mode": "list"
    },
    "sheetName": {
      "__rl": true,
      "value": "gid=0",
      "mode": "list"
    }
  }
}
```

---

## 🎯 完成後的下一步

完成所有憑證設定後：

1. **儲存 Workflow**
   ```
   點擊右上角 "Save" 按鈕
   ```

2. **測試執行**
   ```
   點擊 "Execute Workflow" 按鈕
   觀察每個節點的執行狀態
   ```

3. **檢查輸出**
   - ✅ Slack 通知已發送
   - ✅ Google Sheets 已更新
   - ✅ 無錯誤訊息

4. **啟用自動執行**
   ```
   點擊右上角 "Active" 開關
   Workflow 將每小時自動執行
   ```

5. **監控執行狀態**
   ```
   前往: Executions → 查看執行歷史
   確認每小時都有成功執行記錄
   ```

---

## 📞 需要協助？

如果遇到無法解決的問題，請檢查：

1. **n8n 日誌**
   ```
   在 Zeabur Dashboard 查看 n8n 服務日誌
   ```

2. **Workflow 執行記錄**
   ```
   在 n8n Executions 頁面查看詳細錯誤訊息
   ```

3. **參考文檔**
   - SESSION_RECORD_2025-10-28.md (完整配置記錄)
   - DEPLOY_TO_YOUR_N8N.md (部署指南)
   - n8n 官方文檔: https://docs.n8n.io

---

**文件版本**: v1.0
**建立日期**: 2025-10-28
**最後更新**: 2025-10-28
**參考 Workflow**: CPC Oil Price (hO1f83rbEq1sfKdz)
**目標 Workflow**: 出勤統計分析-優化版 (9omWYJLV7jqv18lN)
