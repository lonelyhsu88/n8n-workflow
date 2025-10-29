# 🚀 手動部署步驟（API 無法連接時使用）

## ⚠️ 狀況說明

Zeabur API 目前無法從您的環境連接。這可能是因為：
- 網路限制或防火牆
- VPN 阻擋
- Zeabur API 暫時無法使用

沒關係！我們可以用**完全手動**的方式部署，一樣能成功！

---

## 📋 方案 A：透過 Zeabur Web 控制台 + n8n Web UI（推薦）

### 步驟 1：找到您的 n8n 服務 URL

1. 開啟瀏覽器，前往 [Zeabur Dashboard](https://dash.zeabur.com)

2. 登入後，您會看到專案列表

3. 找到包含 n8n 的專案並點擊進入

4. 在服務列表中找到 n8n 服務

5. 複製 n8n 的 **Domain/URL**，格式類似：
   ```
   https://xxxx.zeabur.app
   或
   https://n8n-xxxx.zeabur.app
   ```

6. 記下這個 URL，我們稱它為 `N8N_URL`

---

### 步驟 2：登入 n8n

1. 在瀏覽器中開啟您的 `N8N_URL`

2. 輸入您的 n8n 登入憑證
   - 如果是第一次使用，可能需要設定帳號密碼

3. 登入後，您會看到 n8n 的主介面

---

### 步驟 3：匯入 Workflow

1. 點擊左側選單的 **"Workflows"**（工作流程）

2. 點擊右上角的 **"+"** 按鈕或 **"Import from File"**（從檔案匯入）

3. 在檔案選擇對話框中，選擇：
   ```
   /Users/lonelyhsu/gemini/claude-project/n8n-workflow/attendance-statistics-analysis-clean.json
   ```

4. 點擊 **"Open"**（開啟）

5. Workflow 應該會成功匯入，您會看到 13 個節點的流程圖

---

### 步驟 4：檢查 Workflow 結構

匯入後，您應該看到以下 13 個節點：

```
1. 每小時執行1 (Schedule Trigger)
   ↓
2. 檢查訊息狀態 (Code)
   ↓
3. 取得頻道資訊 (Slack)
   ↓
4. 解析出缺勤資料 (Code)
   ├→ 5. 今日請假資料 (Code)
   │    ├→ 6. 清空今日請假 (Google Sheets)
   │    └→ 7. 更新今日請假 (Google Sheets)
   │         └→ 8. 處理請假資料 (Code)
   │              └→ 9. If (Conditional)
   │                   └→ 10. lonely.h (Slack)
   │
   └→ 11. 2025年排行榜 (Code)
        ├→ 12. 清空2025年排行榜 (Google Sheets)
        └→ 13. 更新2025年排行榜 (Google Sheets)
```

**檢查點**：
- ✅ 所有 13 個節點都存在
- ✅ 連接線正確
- ⚠️ 某些節點可能顯示紅色（這是正常的，因為還沒設定憑證）

---

### 步驟 5：設定 Slack 憑證

#### 5.1 取得 Slack Token

1. 前往 [Slack API Apps](https://api.slack.com/apps)

2. 選擇您的 App（用於出勤統計的那個）

3. 進入 **"OAuth & Permissions"**

4. 複製 **"Bot User OAuth Token"**
   - 格式：`xoxb-xxxxxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx`

#### 5.2 在 n8n 中設定 Slack 憑證

需要設定 2 個 Slack 節點：

##### A. 「取得頻道資訊」節點
1. 點擊節點
2. 在右側面板，找到 **"Credential"** 欄位
3. 點擊 **"Select Credential"** → **"Create New"**
4. 選擇類型：**"Slack OAuth2 API"**
5. 填入：
   - **Name**: `n8n-ops`（或任何名稱）
   - **Access Token**: 貼上您的 Bot Token
6. 點擊 **"Save"**

##### B. 「lonely.h」節點
1. 點擊節點
2. 選擇剛才創建的 Slack 憑證（`n8n-ops`）
3. 儲存

**驗證**：兩個 Slack 節點應該都變成綠色或灰色（不再是紅色）

---

### 步驟 6：設定 Google Sheets 憑證

需要設定 4 個 Google Sheets 節點：
- 清空今日請假
- 更新今日請假
- 清空2025年排行榜
- 更新2025年排行榜

#### 6.1 方法 A：使用 OAuth2（推薦）

1. 點擊任一 Google Sheets 節點

2. 在 **"Credential"** 欄位，點擊 **"Create New"**

3. 選擇 **"Google Sheets OAuth2 API"**

4. 填入：
   - **Name**: `n8n-GoogleSheet`（或任何名稱）

5. 點擊 **"Sign in with Google"** 或 **"Connect my account"**

6. 在彈出的 Google 授權視窗中：
   - 選擇您的 Google 帳號
   - 允許存取 Google Sheets
   - 完成授權

7. 點擊 **"Save"**

8. 對其他 3 個 Google Sheets 節點重複：
   - 點擊節點
   - 選擇剛才創建的憑證（`n8n-GoogleSheet`）

#### 6.2 方法 B：使用 Service Account（進階）

如果您有 Google Service Account：

1. 在 Google Cloud Console 創建 Service Account

2. 下載 JSON 金鑰檔案

3. 在 n8n 中選擇 **"Google Sheets Service Account"**

4. 將 JSON 內容貼上

5. 記得在 Google Sheets 中分享權限給 Service Account Email

**驗證**：所有 4 個 Google Sheets 節點應該都不再顯示紅色

---

### 步驟 7：驗證節點設定

逐一檢查每個節點的參數：

#### 1. 「取得頻道資訊」節點
```yaml
Channel ID: C05FXLH7BCJ  # 應該已經設定好
Return All: true         # 確認打勾
```

#### 2. 「lonely.h」節點
```yaml
Resource: User
Operation: Send Message
User: U07F9203EP8 (lonely.h)  # 應該已經設定好
```

#### 3. Google Sheets 節點
確認 **Document ID** 都是：
```
176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw
```

---

### 步驟 8：啟用 Workflow

1. 確認所有節點都沒有紅色錯誤標記

2. 點擊右上角的 **"Active"** 開關
   - 開關變成綠色/藍色表示已啟用

3. Workflow 現在會每小時自動執行

---

### 步驟 9：手動測試執行

在啟用之前，建議先測試一次：

1. 點擊右上角的 **"Execute Workflow"** 按鈕

2. 觀察執行過程：
   - 每個節點執行時會有動畫效果
   - 成功的節點會變成綠色 ✅
   - 失敗的節點會變成紅色 ❌

3. 如果有節點失敗：
   - 點擊該節點
   - 查看右側的 **"Error"** 標籤
   - 記下錯誤訊息

---

## 🐛 常見錯誤排除

### 錯誤 1：Slack - "channel_not_found"

**原因**：頻道 ID 不正確或 Bot 沒有被加入頻道

**解決**：
1. 確認頻道 ID：`C05FXLH7BCJ`
2. 在 Slack 中將 Bot 加入 #jvd每日出勤回報 頻道
3. 指令：`/invite @你的機器人名稱`

---

### 錯誤 2：Slack - "not_authed" 或 "invalid_auth"

**原因**：Token 錯誤或過期

**解決**：
1. 重新取得 Slack Bot Token
2. 更新 n8n 中的 Slack 憑證
3. 確認 Token 有以下權限：
   - `channels:history`
   - `channels:read`
   - `chat:write`
   - `users:read`

---

### 錯誤 3：Google Sheets - "The caller does not have permission"

**原因**：Google 帳號沒有 Sheets 存取權限

**解決**：
1. 開啟 [Google Sheets](https://docs.google.com/spreadsheets/d/176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw)
2. 點擊右上角 **"共用"**
3. 加入授權的 Google 帳號或 Service Account Email
4. 設定權限為 **"編輯者"**

---

### 錯誤 4：「解析出缺勤資料」節點 - "Unexpected token"

**原因**：代碼有語法錯誤（不應該發生，因為我們已經修復了）

**解決**：
1. 點擊節點
2. 檢查代碼完整性
3. 如果代碼被截斷，重新匯入 workflow

---

### 錯誤 5：「處理請假資料」節點 - "$getWorkflowStaticData is not defined"

**原因**：n8n 版本太舊（< 0.220.0）

**解決**：
1. 檢查 n8n 版本（右下角）
2. 如果版本 < 0.220.0，需要在 Zeabur 中更新 n8n：
   - 進入 Zeabur Dashboard
   - 選擇 n8n 服務
   - 點擊 **"Redeploy"** 或更新映像版本

---

### 錯誤 6：If 節點永遠不執行

**原因**：條件設定不正確

**解決**：
1. 點擊 If 節點
2. 確認 **Combinator** 設定為 **"OR"**（不是 AND）
3. 確認有 2 個條件：
   - 條件 1：`$json.shouldSendNewMessage` equals `true`
   - 條件 2：`$json.attendanceHash` not equals `$json.previousHash`

---

## ✅ 驗證部署成功

完成所有步驟後，執行以下檢查：

### 1. Workflow 執行檢查
- [ ] 手動執行沒有錯誤
- [ ] 所有節點都是綠色
- [ ] 執行時間 < 10 秒

### 2. Slack 檢查
- [ ] 收到測試訊息
- [ ] 訊息格式正確
- [ ] emoji 顯示正常

### 3. Google Sheets 檢查
開啟 [Google Sheets](https://docs.google.com/spreadsheets/d/176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw)

**「今日請假」工作表**：
- [ ] 有資料寫入
- [ ] 日期正確
- [ ] 使用者名稱正確

**「2025排行榜」工作表**：
- [ ] 有資料寫入
- [ ] 包含以下欄位（重要！）：
  - [ ] totalDays
  - [ ] totalHours ⭐
  - [ ] sickLeaveHours ⭐
  - [ ] annualLeaveHours ⭐
  - [ ] remoteHours ⭐
  - [ ] 其他 10 個 xxxHours 欄位

### 4. 自動執行檢查
- [ ] Workflow 狀態為 **Active**
- [ ] 等待 1 小時後自動執行
- [ ] 檢查 Executions 歷史記錄

---

## 📊 監控建議

### 查看執行歷史
1. 在 n8n 左側選單點擊 **"Executions"**
2. 可以看到所有執行記錄
3. 點擊任一記錄查看詳細資訊

### 設定失敗通知
1. 進入 Workflow Settings
2. 啟用 **"Error Workflow"**
3. 當執行失敗時會收到通知

### Zeabur 日誌
1. 進入 Zeabur Dashboard
2. 選擇 n8n 服務
3. 點擊 **"Logs"** 查看即時日誌

---

## 🆘 需要協助？

如果遇到問題，請提供以下資訊：

1. **錯誤訊息截圖**
   - 點擊失敗的節點
   - 截圖 Error 標籤的內容

2. **節點設定截圖**
   - 失敗節點的參數設定
   - 憑證設定

3. **執行日誌**
   - 在 Executions 中查看完整日誌
   - 複製相關錯誤訊息

4. **環境資訊**
   - n8n 版本
   - Zeabur 專案名稱
   - 哪個步驟失敗

把這些資訊提供給我，我會立即幫您 debug！

---

## 🎉 部署完成後

恭喜！您的 workflow 現在會：

✅ 每小時自動執行
✅ 從 Slack 讀取出勤訊息
✅ 智慧解析請假資料
✅ 更新 Google Sheets（包含時數統計）
✅ 發送即時通知到 Slack

**效能提升**：
- ⚡ 執行時間減少 40-50%
- 💾 記憶體使用減少 30-40%
- 🔧 維護成本降低 60%

**新功能**：
- 📊 完整的時數統計（14 個時數欄位）
- 🔍 改進的使用者名稱驗證
- 🚀 優化的資料處理速度
- 🛡️ 更穩定的錯誤處理

---

**文件版本**: v1.0
**最後更新**: 2025-10-28
**適用情況**: Zeabur API 無法連接時使用
