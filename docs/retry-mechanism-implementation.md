# Tableau 重試機制實施文檔

## 📋 實施摘要

**實施日期**: 2025-12-13
**實施方案**: 方案 A - 檢查 View Metadata
**失敗處理**: 選項 A - 只發送告警，不上傳舊資料

---

## 🎯 新增節點清單

| # | 節點名稱 | 類型 | 位置 | 功能 |
|---|---------|------|------|------|
| 1 | Get View Metadata | HTTP Request | [448, 32] | 獲取 Tableau view 的 metadata |
| 2 | Check Data Date | Code | [672, 32] | 檢查數據日期是否為今天 |
| 3 | Is Today's Data? | IF | [896, 32] | 判斷是否為今天的數據 |
| 4 | Can Retry? | IF | [896, 256] | 判斷是否還能重試 |
| 5 | Increment Retry Counter | Code | [1120, 192] | 增加重試計數器 |
| 6 | Wait 5 Minutes | Wait | [1344, 192] | 等待 5 分鐘 |
| 7 | Send Alert | Slack | [1120, 320] | 發送失敗告警到 Slack |

---

## 🔄 新的流程架構

### 完整流程圖

```
每日早上08:50 (Trigger)
    ↓
Get Date Time
    ↓
Format Date
    ↓
Tableau Login
    ↓
Data Sources Config (初始化 retryCount=0, maxRetries=3)
    ↓
Process Data Sources (循環處理每個數據源)
    ↓
┌─────────────────────────────────────────────────────────┐
│                    重試循環區域                          │
│                                                         │
│  Get View Metadata (獲取 view 的 updatedAt)            │
│         ↓                                               │
│  Check Data Date (比較 viewDate vs today)              │
│         ↓                                               │
│  Is Today's Data? ──────────┐                          │
│         │                    │                          │
│        YES                  NO                          │
│         │                    │                          │
│         ↓                    ↓                          │
│  Get Tableau Image    Can Retry?                       │
│         ↓                    │                          │
│  Upload to Slack        YES  │  NO                     │
│         ↓                │   │   │                      │
│  Wait for 3s             │   │   ↓                     │
│         │                │   │  Send Alert             │
│         │                ↓   │   │                      │
│         │         Increment  │   │                      │
│         │         Retry      │   │                      │
│         │         Counter    │   │                      │
│         │                ↓   │   │                      │
│         │         Wait 5 Min │   │                      │
│         │                │   │   │                      │
│         │                └───┘   │                      │
│         │                    │   │                      │
│         │      (回到 Get View Metadata)                │
│         │                        │                      │
│         └────────────────────────┴──> Process Data     │
│                                      Sources (下一個)   │
└─────────────────────────────────────────────────────────┘
```

### 流程說明

#### 階段 1: 數據檢查
1. **Get View Metadata**: 發送 API 請求獲取 view 的 metadata
   - API: `GET /sites/{siteId}/views/{viewId}`
   - 獲取 `view.updatedAt` 或 `view.workbook.updatedAt`

2. **Check Data Date**: 比較數據日期
   - 將 `updatedAt` 轉換為台北時區日期
   - 與今天的日期比較
   - 設定 `isToday` 標記

#### 階段 2: 條件分支
3. **Is Today's Data?**: 判斷數據是否為今天
   - **YES** → 繼續下載圖片並上傳
   - **NO** → 檢查是否還能重試

#### 階段 3A: 數據已更新（成功路徑）
4. **Get Tableau Image**: 下載報表圖片
5. **Upload to Slack**: 上傳到 Slack channel
6. **Wait for 3s**: 等待 3 秒後處理下一個數據源

#### 階段 3B: 數據未更新（重試路徑）
4. **Can Retry?**: 檢查 `retryCount < maxRetries`
   - **YES** → 進入重試循環
     5. **Increment Retry Counter**: `retryCount++`
     6. **Wait 5 Minutes**: 等待 5 分鐘
     7. 回到 **Get View Metadata** 重新檢查
   - **NO** → 發送告警
     5. **Send Alert**: 發送 Slack 告警訊息
     6. 繼續處理下一個數據源

---

## 📊 數據流結構

### 初始數據（Data Sources Config 輸出）

```json
{
  "id": "top100_player_tableau",
  "name": "Top100 player",
  "viewId": "73f522ea-19fd-4e62-bafb-c0abe8755ec8",
  "tableauWorkbook": "Top100-player.png",
  "slackChannel": "C09RUT91SPL",
  "tableauToken": "auth_token_here",
  "siteId": "1b4032aa-745d-491e-93a6-847c7d77e26e",
  "baseUrl": "https://prod-apnortheast-a.online.tableau.com/api/3.4",
  "displayDate": "2025-12-13",
  "retryCount": 0,
  "maxRetries": 3
}
```

### 檢查後數據（Check Data Date 輸出）

```json
{
  // ... 原有欄位 ...
  "viewMetadata": {
    "id": "73f522ea-...",
    "name": "Top100 player",
    "updatedAt": "2025-12-13T08:55:00Z"
  },
  "viewUpdatedAt": "2025-12-13T08:55:00Z",
  "viewDate": "2025-12-13",
  "today": "2025-12-13",
  "isToday": true,
  "canRetry": true,
  "checkTime": "2025-12-13T08:51:00Z",
  "message": "✅ 數據已更新到今天 (2025-12-13)"
}
```

### 重試後數據（Increment Retry Counter 輸出）

```json
{
  // ... 原有欄位 ...
  "retryCount": 1,
  "lastRetryTime": "2025-12-13T08:56:00Z"
}
```

---

## ⏰ 執行時間軸範例

### 場景 1: 數據已更新（最佳情況）

```
08:50:00 - Workflow 觸發
08:50:01 - 取得日期時間
08:50:02 - Tableau 登入
08:50:03 - 設定數據源
08:50:04 - 開始批次處理
08:50:05 - 獲取 view metadata
08:50:06 - 檢查日期 → ✅ 是今天
08:50:07 - 下載 Top100 player 圖片 (30s)
08:50:37 - 上傳到 Slack
08:50:38 - 等待 3 秒
08:50:41 - 下載 Top5 player_game 圖片 (30s)
08:51:11 - 上傳到 Slack
08:51:12 - 等待 3 秒
08:51:15 - 完成 ✅

總執行時間: 約 75 秒
額外開銷: +3 秒（檢查 metadata）
```

### 場景 2: 數據延遲（需要重試）

```
08:50:00 - Workflow 觸發
08:50:05 - 獲取 view metadata
08:50:06 - 檢查日期 → ⚠️ 是昨天 (2025-12-12)
08:50:07 - 重試次數 0/3 → 可以重試
08:50:08 - retryCount: 0 → 1
08:50:09 - 等待 5 分鐘...

08:55:09 - 重新獲取 view metadata
08:55:10 - 檢查日期 → ⚠️ 還是昨天
08:55:11 - 重試次數 1/3 → 可以重試
08:55:12 - retryCount: 1 → 2
08:55:13 - 等待 5 分鐘...

09:00:13 - 重新獲取 view metadata
09:00:14 - 檢查日期 → ⚠️ 還是昨天
09:00:15 - 重試次數 2/3 → 可以重試
09:00:16 - retryCount: 2 → 3
09:00:17 - 等待 5 分鐘...

09:05:17 - 重新獲取 view metadata
09:05:18 - 檢查日期 → ✅ 是今天了！
09:05:19 - 下載圖片並上傳 (約 35 秒)
09:05:54 - 完成 ✅

總執行時間: 約 15 分 54 秒
重試次數: 3 次
```

### 場景 3: 數據未更新（失敗）

```
08:50:00 - Workflow 觸發
08:50:05 - 檢查日期 → ⚠️ 是昨天
08:50:09 - 等待 5 分鐘...

08:55:09 - 檢查日期 → ⚠️ 還是昨天
08:55:13 - 等待 5 分鐘...

09:00:13 - 檢查日期 → ⚠️ 還是昨天
09:00:17 - 等待 5 分鐘...

09:05:17 - 檢查日期 → ❌ 還是昨天
09:05:18 - 重試次數 3/3 → 無法重試
09:05:19 - 發送 Slack 告警訊息 ⚠️
09:05:20 - 跳過此數據源，處理下一個

總執行時間: 約 15 分 20 秒
結果: 失敗，未上傳報表
```

---

## 🚨 告警訊息範例

當達到最大重試次數時，會發送以下 Slack 訊息：

```
⚠️ **Tableau 數據更新延遲警告**

📊 報表: Top100 player
📅 預期日期: 2025-12-13
📅 實際日期: 2025-12-12
🔄 重試次數: 3/3
⏰ 檢查時間: 2025-12-13T09:05:18.000Z

❌ 已達最大重試次數，數據仍未更新到今天。

💡 建議動作:
1. 檢查 Tableau 數據來源是否正常運作
2. 確認數據更新排程是否正常執行
3. 手動檢查 view: 73f522ea-19fd-4e62-bafb-c0abe8755ec8

🔗 Tableau URL: https://prod-apnortheast-a.online.tableau.com
```

---

## 🔧 關鍵修改點

### 1. Data Sources Config 節點

**修改前**:
```javascript
// 使用未定義的變數 sortedDataSources, formattedDate, dateStr, now, tableauToken
const results = sortedDataSources.map(...)
```

**修改後**:
```javascript
// 在節點內部重新取得所有需要的變數
const now = new Date();
const dateStr = now.toLocaleDateString('zh-TW', ...)...;
const formattedDate = dateStr.replace(/-/g, '');

// 從上一個節點提取 tableauToken
const tableauAuth = $input.first().json;
let tableauToken = tableauAuth.credentials.token || ...;

// 直接使用 dataSources 而非 sortedDataSources
const results = dataSources.map((source, index) => ({
  json: {
    ...source,
    retryCount: 0,      // 新增
    maxRetries: 3       // 新增
  }
}));
```

### 2. 連線關係變更

**修改前**:
```
Process Data Sources → Get Tableau Image
```

**修改後**:
```
Process Data Sources → Get View Metadata → Check Data Date → Is Today's Data?
  ├─ YES → Get Tableau Image → Upload to Slack → Wait 3s → Process Data Sources
  └─ NO → Can Retry?
            ├─ YES → Increment Retry → Wait 5min → Get View Metadata (循環)
            └─ NO → Send Alert → Process Data Sources (下一個)
```

### 3. 新增 Settings

```json
{
  "settings": {
    "executionOrder": "v1",
    "callerPolicy": "workflowsFromSameOwner",
    "executionTimeout": 3600,      // 新增: 1 小時 timeout
    "timezone": "Asia/Taipei"      // 新增: 時區設定
  }
}
```

---

## 🧪 測試計劃

### 單元測試

#### 1. Check Data Date 節點
- [ ] 測試：view.updatedAt 為今天 → `isToday = true`
- [ ] 測試：view.updatedAt 為昨天 → `isToday = false`
- [ ] 測試：view.updatedAt 不存在，使用 workbook.updatedAt
- [ ] 測試：所有日期欄位都不存在 → `viewDate = null`

#### 2. Is Today's Data? 節點
- [ ] 測試：`isToday = true` → 走 output 0 (YES)
- [ ] 測試：`isToday = false` → 走 output 1 (NO)

#### 3. Can Retry? 節點
- [ ] 測試：`retryCount = 0` → 走 output 0 (YES)
- [ ] 測試：`retryCount = 2` → 走 output 0 (YES)
- [ ] 測試：`retryCount = 3` → 走 output 1 (NO)

#### 4. Increment Retry Counter 節點
- [ ] 測試：`retryCount: 0 → 1`
- [ ] 測試：`retryCount: 2 → 3`
- [ ] 測試：設定 `lastRetryTime`

### 整合測試

#### 場景 1: 數據已更新（第一次就成功）
```
輸入: viewDate = today
預期:
  - Check Data Date → isToday = true
  - 直接下載圖片並上傳
  - 不進入重試循環
  - 總時間: ~75 秒
```

#### 場景 2: 數據延遲（需要 2 次重試）
```
輸入:
  - 第 1 次: viewDate = yesterday
  - 第 2 次: viewDate = yesterday
  - 第 3 次: viewDate = today
預期:
  - 重試 2 次（等待 10 分鐘）
  - 第 3 次檢查成功，下載並上傳
  - retryCount 記錄: 0 → 1 → 2
  - 總時間: ~11 分鐘
```

#### 場景 3: 數據未更新（達到最大重試）
```
輸入:
  - 所有檢查都是: viewDate = yesterday
預期:
  - 重試 3 次（等待 15 分鐘）
  - 發送 Slack 告警
  - 不上傳報表
  - 繼續處理下一個數據源
  - 總時間: ~15 分 20 秒
```

#### 場景 4: 多個數據源混合情況
```
輸入:
  - 數據源 1: 第一次就成功
  - 數據源 2: 需要 2 次重試
預期:
  - 數據源 1: ~75 秒完成
  - 數據源 2: ~11 分鐘完成
  - 總時間: ~12 分 15 秒
  - 兩個報表都成功上傳
```

### 錯誤處理測試

#### 1. Tableau API 錯誤
- [ ] Get View Metadata 返回 404 → 如何處理？
- [ ] Get View Metadata 返回 401 (token 過期) → 如何處理？
- [ ] Get View Metadata 超時 → 如何處理？

#### 2. 數據異常
- [ ] view.updatedAt 格式錯誤 → 如何處理？
- [ ] view.updatedAt 為 null → 如何處理？

#### 3. 循環異常
- [ ] Wait 5 Minutes 失敗 → 如何處理？
- [ ] Increment Retry Counter 失敗 → 如何處理？

---

## 📝 部署步驟

### 準備階段

1. **備份原始 workflow**
```bash
curl -s "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74" \
  -H "X-N8N-API-KEY: ..." \
  > backup-workflow-$(date +%Y%m%d-%H%M%S).json
```

2. **驗證新 workflow JSON**
```bash
# 檢查 JSON 格式
jq '.' top100-player-tableau-report-with-retry.json

# 檢查節點數量
jq '.nodes | length' top100-player-tableau-report-with-retry.json
# 預期: 16 個節點

# 檢查連線數量
jq '.connections | to_entries | length' top100-player-tableau-report-with-retry.json
# 預期: 14 個連線
```

### 部署階段

3. **更新 workflow**
```bash
curl -X PUT "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74" \
  -H "X-N8N-API-KEY: ..." \
  -H "Content-Type: application/json" \
  -d @top100-player-tableau-report-with-retry.json
```

4. **驗證部署**
```bash
# 獲取更新後的 workflow
curl -s "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74" \
  -H "X-N8N-API-KEY: ..." \
  | jq '.nodes | length'
# 預期: 16
```

### 測試階段

5. **手動觸發測試**
```bash
# 在 n8n UI 中手動執行 workflow
# 或使用 API 觸發:
curl -X POST "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74/execute" \
  -H "X-N8N-API-KEY: ..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

6. **監控執行**
```bash
# 檢查最近的執行記錄
curl -s "https://n8n.elstech.com.tw/api/v1/executions?workflowId=nCw8y2bLSMj4CD74&limit=1" \
  -H "X-N8N-API-KEY: ..." \
  | jq '.'
```

### 啟用階段

7. **啟用 workflow**（測試通過後）
```bash
curl -X PATCH "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74" \
  -H "X-N8N-API-KEY: ..." \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

8. **確認啟用狀態**
```bash
curl -s "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74" \
  -H "X-N8N-API-KEY: ..." \
  | jq '.active'
# 預期: true
```

---

## 🔍 監控與維護

### 日常監控

**每日檢查項目**:
- [ ] Workflow 是否成功執行
- [ ] 兩個報表是否都上傳到 Slack
- [ ] 是否有收到告警訊息
- [ ] 執行時間是否異常

**監控指令**:
```bash
# 檢查今天的執行記錄
curl -s "https://n8n.elstech.com.tw/api/v1/executions?workflowId=nCw8y2bLSMj4CD74&limit=10" \
  -H "X-N8N-API-KEY: ..." \
  | jq '.data[] | {id, startedAt, finished, status}'
```

### 關鍵指標

| 指標 | 正常值 | 警告值 | 嚴重值 |
|------|--------|--------|--------|
| 執行時間 | < 2 分鐘 | 2-10 分鐘 | > 15 分鐘 |
| 重試次數 | 0 次 | 1-2 次 | 3 次 |
| 成功率 | 100% | 80-99% | < 80% |
| 告警頻率 | 0 次/週 | 1-2 次/週 | > 3 次/週 |

### 故障排除

**問題 1: 一直重試但數據還是昨天的**
```
原因:
  - Tableau 數據來源未更新
  - 數據更新排程失敗
  - 時區設定錯誤

解決:
  1. 登入 Tableau 手動檢查 view
  2. 檢查數據來源的更新時間
  3. 驗證 Check Data Date 節點的時區邏輯
```

**問題 2: 告警訊息未發送**
```
原因:
  - Slack OAuth token 過期
  - Channel ID 錯誤
  - Bot 沒有權限

解決:
  1. 重新授權 Slack OAuth2
  2. 確認 Channel ID 正確
  3. 檢查 bot 權限
```

**問題 3: Wait 5 Minutes 沒有觸發**
```
原因:
  - Wait 節點配置錯誤
  - Webhook ID 衝突
  - n8n 服務重啟

解決:
  1. 檢查 Wait 節點參數
  2. 確認 webhookId 唯一
  3. 檢查 n8n 服務狀態
```

---

## 📊 效能影響分析

### 最佳情況（數據已更新）

| 項目 | 原流程 | 新流程 | 差異 |
|------|--------|--------|------|
| API 請求 | 3 次 | 5 次 | +2 次 |
| 執行時間 | ~72 秒 | ~75 秒 | +3 秒 |
| 網路流量 | ~2 MB | ~2.1 MB | +0.1 MB |

**結論**: 幾乎無影響，可接受

### 最差情況（3 次重試）

| 項目 | 原流程 | 新流程 | 差異 |
|------|--------|--------|------|
| API 請求 | 3 次 | 11 次 | +8 次 |
| 執行時間 | ~72 秒 | ~16 分鐘 | +15 分鐘 |
| 網路流量 | ~2 MB | ~2.4 MB | +0.4 MB |

**結論**: 顯著延遲，但避免了錯誤資料

### 失敗情況（無法取得今天數據）

| 項目 | 原流程 | 新流程 | 差異 |
|------|--------|--------|------|
| 結果 | 上傳昨天資料 ❌ | 不上傳 + 告警 ✅ | 避免錯誤 |
| 用戶體驗 | 誤以為是今天的 | 明確知道有問題 | 提升透明度 |

---

## 🎯 後續優化建議

### 短期優化（1-2 週）

1. **調整重試參數**
   - 根據實際執行情況，調整重試間隔（3 分鐘 vs 5 分鐘）
   - 調整最大重試次數（2 次 vs 3 次 vs 5 次）

2. **增強告警**
   - 在第 1 次重試時就發送「提示訊息」
   - 在最終失敗時 @mention 相關人員

3. **記錄統計**
   - 記錄每日的重試次數
   - 分析數據更新的時間模式

### 中期優化（1-2 月）

1. **智能重試**
   - 根據歷史數據，預測數據更新時間
   - 動態調整重試間隔（早期 3 分鐘，後期 10 分鐘）

2. **多重檢查**
   - 同時檢查 view metadata 和數據內容
   - 雙重驗證確保準確性

3. **降級策略**
   - 如果今天數據真的無法取得
   - 可選擇上傳昨天資料但明確標註

### 長期優化（3-6 月）

1. **主動監控**
   - 建立獨立的 Tableau 數據監控系統
   - 在數據未更新時主動通知相關團隊

2. **數據來源改進**
   - 優化 Tableau 數據更新流程
   - 確保 08:50 前數據必定更新完成

3. **自動化決策**
   - 使用 AI 判斷是否應該上傳
   - 根據數據變化幅度決定處理方式

---

## 📚 相關資源

### API 文檔
- [Tableau REST API - Query View](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_workbooks_and_views.htm#query_view)
- [n8n IF Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.if/)
- [n8n Wait Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/)

### 內部文檔
- [Tableau 報表自動化工作流程分析](./workflow-analysis-top100-player-report.md)
- [重試機制設計文檔](./tableau-retry-mechanism-design.md)

---

**文檔版本**: 1.0
**最後更新**: 2025-12-13
**作者**: Claude Code
