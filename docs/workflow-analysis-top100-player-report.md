# Tableau Top100/50 Player 報表自動化工作流程分析

## 📋 基本資訊

| 項目 | 內容 |
|------|------|
| **Workflow ID** | `nCw8y2bLSMj4CD74` |
| **名稱** | 線上-Top100/50 Player(08:50)優化-dev |
| **狀態** | ❌ 未啟用 (active: false) |
| **版本** | v31 (versionCounter: 31) |
| **創建時間** | 2025-12-12 07:47:16 |
| **最後更新** | 2025-12-12 15:20:49 |
| **專案** | Devops Devops (23TS46UeV6epbiuy) |
| **URL** | https://n8n.ftgaming.cc/workflow/nCw8y2bLSMj4CD74 |

---

## 🎯 工作流程目的

**自動化下載 Tableau 報表並上傳到 Slack**

每日早上 08:50 自動執行以下任務：
1. 從 Tableau 下載 Top100 player 和 Top5 player_game 報表圖片
2. 上傳到指定的 Slack channels
3. 支援多個數據源和多個目標 channel

---

## ⏰ 觸發器

**Schedule Trigger** - 每日早上 08:50 (Asia/Taipei)

```cron
50 08 * * *
```

**節點**: `每日早上08:50` (scheduleTrigger)

---

## 🔄 工作流程架構

### 主要流程 (10 個節點)

```
每日早上08:50 (Trigger)
    ↓
Get Date Time (Code) - 取得台北時區日期時間
    ↓
Format Date (Code) - 格式化日期
    ↓
Tableau Login (HTTP Request) - 登入 Tableau
    ↓
Data Sources Config (Code) - 設定數據源 (2 個來源)
    ↓
Process Data Sources (SplitInBatches) - 循環處理
    ↓
Get Tableau Image (HTTP Request) - 下載圖片
    ↓
Upload to Slack (Slack) - 上傳到 Slack
    ↓
Wait for 3s (Wait) - 等待 3 秒
    ↓
    └──> 回到 Process Data Sources (循環)
```

---

## 📊 數據源配置

### 版本 1: Data Sources Config (2 個數據源)

發送到 **tableau_top100player** channel (C09RUT91SPL)

| 數據源 | View ID | 檔案名稱 | Order |
|--------|---------|----------|-------|
| Top100 player | 73f522ea-19fd-4e62-bafb-c0abe8755ec8 | Top100-player.png | 2 |
| Top5 player_game | 110c2b5c-107b-46b4-8f92-cb04f8678928 | Top5-player_game.png | 4 |

### 版本 2: Data Sources Config1 (4 個數據源) - 未使用

發送到 **兩個 channels**:
- gemini_top100player (C08CEM8BK45)
- tableau_top100player (C09RUT91SPL)

| 數據源 | Channel | View ID | 檔案名稱 | Order |
|--------|---------|---------|----------|-------|
| Top100 player | gemini_top100player | 73f522ea-19fd-4e62-bafb-c0abe8755ec8 | Top100-player.png | 1 |
| Top100 player | tableau_top100player | 73f522ea-19fd-4e62-bafb-c0abe8755ec8 | Top100-player.png | 2 |
| Top5 player_game | gemini_top100player | 110c2b5c-107b-46b4-8f92-cb04f8678928 | Top5-player_game.png | 3 |
| Top5 player_game | tableau_top100player | 110c2b5c-107b-46b4-8f92-cb04f8678928 | Top5-player_game.png | 4 |

> **注意**: 目前連線使用的是 **Data Sources Config** (2 個數據源)，**Data Sources Config1** (4 個數據源) 未連接到工作流程。

---

## 🔧 節點詳細說明

### 1. Get Date Time (Code Node)

**功能**: 取得台北時區的當前日期與時間

**輸出**:
```json
{
  "current_date": "2025-12-13",
  "current_time": "08:50:00",
  "timestamp": "2025-12-13T00:50:00.000Z",
  "timezone": "Asia/Taipei"
}
```

### 2. Format Date (Code Node)

**功能**: 格式化日期為 API 所需格式

**轉換**:
- `2025-12-13` → `20251213` (移除 `-`)

**輸出**:
```json
{
  "current_date": "2025-12-13",
  "formatted_date": "20251213",
  "display_date": "2025-12-13",
  "api_date": "20251213"
}
```

### 3. Tableau Login (HTTP Request)

**功能**: 使用 Personal Access Token 登入 Tableau

**API Endpoint**:
```
POST https://prod-apnortheast-a.online.tableau.com/api/3.4/auth/signin
```

**認證資訊**:
- PAT Name: `n8n-token-2026`
- PAT Secret: `[REDACTED]`
- Site: `tableauadmin59b92d016b`

**回傳**: Tableau Auth Token (用於後續 API 請求)

### 4. Data Sources Config (Code Node)

**功能**: 設定要處理的數據源清單

**關鍵參數**:
- Tableau Site ID: `1b4032aa-745d-491e-93a6-847c7d77e26e`
- Base URL: `https://prod-apnortheast-a.online.tableau.com/api/3.4`

**處理邏輯**:
1. 定義數據源清單
2. 按 `order` 欄位排序
3. 為每個數據源注入必要的元數據 (token, siteId, date 等)
4. 返回陣列供後續批次處理

### 5. Process Data Sources (SplitInBatches)

**功能**: 循環處理數據源清單

**配置**:
- `reset: false` - 不重置批次狀態
- 每次處理一個數據源
- 處理完成後回到自己 (形成循環)

### 6. Get Tableau Image (HTTP Request)

**功能**: 從 Tableau 下載報表圖片

**API Endpoint**:
```
GET {{baseUrl}}/sites/{{siteId}}/views/{{viewId}}/image?maxAge=1&:refresh=y
```

**Headers**:
- `X-Tableau-Auth`: {{tableauToken}}

**選項**:
- Timeout: 30000ms (30 秒)
- `maxAge=1`: 強制刷新快取
- `:refresh=y`: 確保獲取最新數據

### 7. Upload to Slack (Slack Node)

**功能**: 上傳圖片到指定的 Slack channel

**配置**:
- 認證: OAuth2 (n8n-ops)
- Resource: file
- Channel: 動態 (從數據源配置取得)
- File Name: 動態 (例如: `Top100-player.png`)
- Title: 動態 (例如: `2025-12-13 - Top100 player`)

**Credential ID**: `uB8nqjfDBs738eff` (n8n-ops)

### 8. Wait for 3s (Wait Node)

**功能**: 等待 3 秒後繼續處理下一個數據源

**目的**: 避免對 Tableau API 和 Slack API 發送過於頻繁的請求

---

## 🔗 連線邏輯

### 主要連線流程

```javascript
每日早上08:50 → Get Date Time
Get Date Time → Format Date
Format Date → Tableau Login
Tableau Login → Data Sources Config
Data Sources Config → Process Data Sources

// 循環處理
Process Data Sources → Get Tableau Image (批次輸出)
Get Tableau Image → Upload to Slack
Upload to Slack → Wait for 3s
Wait for 3s → Process Data Sources (回到循環開始)
```

### 循環機制

**SplitInBatches** 節點會：
1. 第一次執行時從第一個輸出 (index 0) 返回 (表示批次結束)
2. 後續執行時從第二個輸出 (index 1) 返回每個數據源
3. 當所有數據源處理完成後，再次從第一個輸出返回

---

## 📊 執行流程範例

### 時間軸 (每日 08:50)

| 時間 | 動作 | 節點 |
|------|------|------|
| 08:50:00 | 觸發工作流程 | 每日早上08:50 |
| 08:50:01 | 取得當前日期時間 | Get Date Time |
| 08:50:02 | 格式化日期 | Format Date |
| 08:50:03 | 登入 Tableau | Tableau Login |
| 08:50:04 | 設定數據源清單 | Data Sources Config |
| 08:50:05 | 開始批次處理 | Process Data Sources |
| 08:50:06 | 下載 Top100 player 圖片 | Get Tableau Image |
| 08:50:36 | 上傳到 Slack (tableau_top100player) | Upload to Slack |
| 08:50:37 | 等待 3 秒 | Wait for 3s |
| 08:50:40 | 下載 Top5 player_game 圖片 | Get Tableau Image |
| 08:51:10 | 上傳到 Slack (tableau_top100player) | Upload to Slack |
| 08:51:11 | 等待 3 秒 | Wait for 3s |
| 08:51:14 | 批次處理完成 | Process Data Sources |

**總執行時間**: 約 1 分 14 秒 (包含兩次 30 秒的圖片下載)

---

## 🎨 視覺化流程圖

```
┌─────────────────┐
│ 每日早上08:50    │  Trigger (Cron: 50 08 * * *)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get Date Time   │  取得台北時區日期時間
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Format Date     │  格式化日期 (2025-12-13 → 20251213)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Tableau Login   │  登入 Tableau (取得 auth token)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Sources    │  設定 2 個數據源
│     Config      │  - Top100 player
└────────┬────────┘  - Top5 player_game
         │
         ▼
┌─────────────────┐
│ Process Data    │◄─┐ 循環處理每個數據源
│    Sources      │  │
└────────┬────────┘  │
         │           │
         ▼           │
┌─────────────────┐  │
│ Get Tableau     │  │ 下載圖片 (30s timeout)
│     Image       │  │
└────────┬────────┘  │
         │           │
         ▼           │
┌─────────────────┐  │
│ Upload to       │  │ 上傳到 Slack channel
│     Slack       │  │
└────────┬────────┘  │
         │           │
         ▼           │
┌─────────────────┐  │
│ Wait for 3s     │──┘ 等待 3 秒後繼續
└─────────────────┘
```

---

## ⚠️ 重要發現

### 1. 未連接的節點

**Data Sources Config1** 節點定義了 4 個數據源（發送到兩個 channels），但 **未連接到工作流程**。

**當前配置** (已使用):
- Data Sources Config: 2 個數據源 → tableau_top100player channel

**替代配置** (未使用):
- Data Sources Config1: 4 個數據源 → gemini_top100player + tableau_top100player channels

**建議**:
- 如果需要發送到兩個 channels，應將 Tableau Login 節點連接到 **Data Sources Config1** 而非 **Data Sources Config**
- 或刪除 **Data Sources Config1** 節點以避免混淆

### 2. 工作流程未啟用

**狀態**: `active: false`

此 workflow 雖然已完整配置，但 **目前未啟用**，不會自動執行。

**啟用方式**:
- 在 n8n UI 中點擊 "Active" 開關
- 或透過 API 更新 `active: true`

### 3. 重複日期計算

在 **Data Sources Config** 和 **Data Sources Config1** 中都有重複計算台北時區日期的程式碼。

**原因**: 確保即使前面節點出錯，數據源配置節點仍能獨立運行。

**建議**: 可以信任前面節點的輸出，移除重複計算以簡化程式碼。

---

## 🔒 安全性考量

### 敏感資訊

此 workflow JSON 包含以下敏感資訊：

1. **Tableau Personal Access Token**
   - PAT Name: `n8n-token-2026`
   - PAT Secret: `[REDACTED]`

2. **Tableau 資源 IDs**
   - Site ID: `1b4032aa-745d-491e-93a6-847c7d77e26e`
   - View IDs: `73f522ea-...`, `110c2b5c-...`

3. **Slack 整合**
   - Credential ID: `uB8nqjfDBs738eff` (n8n-ops OAuth2)
   - Channel IDs: `C09RUT91SPL`, `C08CEM8BK45`

**建議**:
- 不要將包含 credentials 的 JSON 檔案提交到公開的 Git repository
- 使用環境變數或 n8n 的 credential 管理系統
- 定期輪換 Personal Access Tokens

---

## 📈 效能分析

### 執行時間估算

| 階段 | 預估時間 |
|------|----------|
| 取得日期時間 + 格式化 | ~1 秒 |
| Tableau 登入 | ~2 秒 |
| 設定數據源 | <1 秒 |
| 下載第一張圖片 | ~30 秒 |
| 上傳到 Slack | ~1 秒 |
| 等待 | 3 秒 |
| 下載第二張圖片 | ~30 秒 |
| 上傳到 Slack | ~1 秒 |
| 等待 | 3 秒 |
| **總計** | **~72 秒** |

### 瓶頸

1. **Tableau 圖片生成**: 每張圖片最多 30 秒
2. **序列處理**: 無法並行下載圖片

### 最佳化建議

如果需要處理更多數據源，可以考慮：

1. **並行處理**: 使用多個分支同時下載圖片
2. **減少等待時間**: 從 3 秒降低到 1 秒
3. **快取機制**: 如果圖片內容變化不大，可以增加 `maxAge` 參數

---

## 🔧 維護建議

### 日常檢查

- [ ] 檢查 workflow 執行歷史，確認每日正常執行
- [ ] 驗證 Slack 中是否收到報表圖片
- [ ] 監控執行時間是否異常延長

### 定期維護

- [ ] **每季更新**: Tableau Personal Access Token (建議設定到期日)
- [ ] **每月檢查**: Slack OAuth2 token 是否仍有效
- [ ] **版本控制**: 記錄每次修改的原因和變更內容

### 故障排除

**問題**: 圖片下載失敗

**可能原因**:
1. Tableau token 過期
2. View ID 變更
3. 網路連線問題
4. Tableau 服務維護

**解決方案**:
- 檢查 `Get Tableau Image` 節點的錯誤訊息
- 重新生成 Tableau token
- 驗證 View ID 是否仍然有效

**問題**: Slack 上傳失敗

**可能原因**:
1. Slack OAuth token 失效
2. Channel ID 變更
3. Bot 沒有權限上傳檔案到該 channel

**解決方案**:
- 重新授權 Slack OAuth2
- 確認 bot 已加入目標 channel
- 檢查 bot 的檔案上傳權限

---

## 📝 相關文件

- [Tableau REST API 文檔](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api.htm)
- [n8n Slack 節點文檔](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/)
- [n8n SplitInBatches 節點文檔](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches/)

---

## 📧 聯絡資訊

**專案擁有者**: Devops Devops <gemini-devops@jvd.tw>
**最後分析時間**: 2025-12-13
**分析者**: Claude Code

---

## 附錄: Slack Channel 對照表

| Channel ID | Channel Name | 用途 |
|------------|--------------|------|
| C09RUT91SPL | tableau_top100player | Tableau 報表發送目標 |
| C08CEM8BK45 | gemini_top100player | Gemini 團隊報表接收 (未啟用) |

---

## 附錄: Tableau View 對照表

| View Name | View ID | 用途 |
|-----------|---------|------|
| Top100 player | 73f522ea-19fd-4e62-bafb-c0abe8755ec8 | 前 100 名玩家數據報表 |
| Top5 player_game | 110c2b5c-107b-46b4-8f92-cb04f8678928 | 前 5 名玩家遊戲數據報表 |
