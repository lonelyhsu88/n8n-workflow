# Tableau 數據日期檢查與重試機制設計

## 📋 需求說明

### 問題
Tableau 數據在 08:50 觸發時可能尚未更新到當天資料，導致下載到昨天的報表。

### 解決方案
實施重試機制：檢查數據日期，如果是昨天的資料就等待 5 分鐘後重試，最多重試 3 次。

---

## ⏰ 執行時間軸

```
08:50 - Workflow 觸發
08:51 - 檢查日期，發現是昨天 → 等待 5 分鐘
08:56 - 第 1 次重試，仍是昨天 → 等待 5 分鐘
09:01 - 第 2 次重試，仍是昨天 → 等待 5 分鐘
09:06 - 第 3 次重試，取得今天資料 ✅ → 上傳到 Slack

最晚完成時間: 09:06 (延遲 16 分鐘)
```

---

## 🔄 新增節點設計

### 方案 A: 檢查 Tableau View 更新時間（推薦）

**優點**:
- 不需要下載圖片即可檢查
- 節省 API 請求和處理時間
- 可以在下載前就知道數據是否更新

**實施方式**:

#### 1. Get View Metadata (HTTP Request)
```
GET {{baseUrl}}/sites/{{siteId}}/views/{{viewId}}
Headers:
  X-Tableau-Auth: {{tableauToken}}
```

**回應範例**:
```json
{
  "view": {
    "id": "73f522ea-...",
    "name": "Top100 player",
    "updatedAt": "2025-12-13T08:55:00Z",
    "workbook": {
      "updatedAt": "2025-12-13T08:55:00Z"
    }
  }
}
```

#### 2. Check Data Date (Code)
```javascript
const viewData = $input.first().json;
const today = new Date();
const taipeiDate = today.toLocaleDateString('zh-TW', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).replace(/\//g, '-');

// 取得 view 的更新時間（UTC）
const updatedAt = new Date(viewData.view.updatedAt);

// 轉換為台北時區的日期
const viewDate = updatedAt.toLocaleDateString('zh-TW', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).replace(/\//g, '-');

const retryCount = $json.retryCount || 0;
const maxRetries = 3;
const isToday = viewDate === taipeiDate;

return {
  json: {
    ...viewData,
    today: taipeiDate,
    viewDate,
    retryCount,
    maxRetries,
    isToday,
    canRetry: retryCount < maxRetries,
    message: isToday
      ? `✅ 數據已更新到今天 (${taipeiDate})`
      : `⚠️ 數據仍是 ${viewDate}，今天是 ${taipeiDate}`
  }
};
```

#### 3. Is Today's Data? (IF)
```
Condition: {{ $json.isToday }} === true

TRUE branch → 繼續下載圖片
FALSE branch → 檢查重試次數
```

#### 4. Can Retry? (IF)
```
Condition: {{ $json.canRetry }} === true

TRUE branch → Wait 5 Minutes
FALSE branch → Send Alert (最後通知)
```

#### 5. Wait 5 Minutes (Wait)
```
Amount: 5
Unit: minutes
```

#### 6. Increment Retry Counter (Code)
```javascript
const currentData = $input.first().json;
return {
  json: {
    ...currentData,
    retryCount: (currentData.retryCount || 0) + 1
  }
};
```

#### 7. Send Alert (Slack - Message)
```
Channel: C09RUT91SPL (tableau_top100player)
Message:
⚠️ Tableau 數據更新延遲

報表: {{ $json.name }}
預期日期: {{ $json.today }}
實際日期: {{ $json.viewDate }}
重試次數: {{ $json.retryCount }}/{{ $json.maxRetries }}

已達最大重試次數，請手動檢查 Tableau 數據來源。
```

---

### 方案 B: 從數據本身檢查日期

**適用情境**: Tableau view 包含日期欄位（如 report_date）

#### 1. Get Sample Data (HTTP Request)
```
GET {{baseUrl}}/sites/{{siteId}}/views/{{viewId}}/data
Headers:
  X-Tableau-Auth: {{tableauToken}}
Parameters:
  maxRows: 1  // 只取第一筆資料
```

#### 2. Extract Date from Data (Code)
```javascript
const data = $input.first().json;
// 假設數據中有 report_date 欄位
const reportDate = data.data[0].report_date; // 格式如 "2025-12-13"

const today = new Date().toLocaleDateString('zh-TW', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).replace(/\//g, '-');

const isToday = reportDate === today;
const retryCount = $json.retryCount || 0;

return {
  json: {
    reportDate,
    today,
    isToday,
    retryCount,
    canRetry: retryCount < 3
  }
};
```

---

## 🔗 新的流程架構

### 主流程

```
每日早上08:50 (Trigger)
    ↓
Get Date Time (Code)
    ↓
Format Date (Code)
    ↓
Tableau Login (HTTP Request)
    ↓
Data Sources Config (Code)
    ↓
Process Data Sources (SplitInBatches)
    ↓
[新增] Get View Metadata (HTTP Request)
    ↓
[新增] Check Data Date (Code)
    ↓
[新增] Is Today's Data? (IF)
    ├─ YES → Get Tableau Image → Upload to Slack → Wait 3s
    └─ NO → Can Retry? (IF)
              ├─ YES → Increment Retry Counter → Wait 5 Minutes → 回到 Get View Metadata
              └─ NO → Send Alert (通知數據未更新)
```

### 循環邏輯

```
┌─────────────────────────────────────────────┐
│                重試循環                      │
│                                              │
│  Get View Metadata                          │
│         ↓                                    │
│  Check Data Date                            │
│         ↓                                    │
│  Is Today? ──NO→ Can Retry?                │
│     │              │        │                │
│     YES           YES      NO                │
│     │              │        │                │
│     │              ↓        ↓                │
│     │      Increment → Wait 5min → (回到頂部) │
│     │              Counter                   │
│     │                        │                │
│     └────────────────────────┴→ Send Alert  │
│                                              │
└─────────────────────────────────────────────┘
                    ↓
            Get Tableau Image
                    ↓
            Upload to Slack
```

---

## 📊 狀態管理

### 重試計數器

每個數據源獨立維護重試計數：

```javascript
{
  "id": "top100_player_tableau",
  "name": "Top100 player",
  "retryCount": 0,      // 當前重試次數
  "maxRetries": 3,      // 最大重試次數
  "lastCheckTime": "2025-12-13T08:51:00Z",
  "viewDate": "2025-12-12",  // 數據實際日期
  "today": "2025-12-13"      // 預期日期
}
```

### 時間計算

| 重試次數 | 檢查時間 | 累計延遲 |
|---------|---------|---------|
| 0 (初始) | 08:51 | 0 min |
| 1 | 08:56 | 5 min |
| 2 | 09:01 | 10 min |
| 3 | 09:06 | 15 min |
| 失敗 | 09:06 | 16 min |

---

## 🎯 實施步驟

### Phase 1: 新增檢查節點 (不影響現有流程)

1. **新增 Get View Metadata 節點**
   - Type: HTTP Request
   - Method: GET
   - URL: `{{baseUrl}}/sites/{{siteId}}/views/{{viewId}}`
   - Headers: `X-Tableau-Auth: {{tableauToken}}`

2. **新增 Check Data Date 節點**
   - Type: Code
   - 實施日期檢查邏輯

3. **測試**: 手動執行檢查是否能正確判斷日期

### Phase 2: 新增條件分支

4. **新增 Is Today's Data? 節點**
   - Type: IF
   - Condition: `{{ $json.isToday }} === true`

5. **新增 Can Retry? 節點**
   - Type: IF
   - Condition: `{{ $json.canRetry }} === true`

6. **測試**: 驗證條件分支邏輯

### Phase 3: 新增重試循環

7. **新增 Increment Retry Counter 節點**
   - Type: Code
   - 增加 retryCount

8. **新增 Wait 5 Minutes 節點**
   - Type: Wait
   - Amount: 5 minutes

9. **連接循環**: Wait 5 Minutes → Get View Metadata

10. **測試**: 模擬昨天的資料，驗證重試循環

### Phase 4: 新增告警機制

11. **新增 Send Alert 節點**
    - Type: Slack (Message)
    - 發送到 tableau_top100player channel

12. **測試**: 模擬最大重試次數，驗證告警

### Phase 5: 整合到主流程

13. **修改連線**:
    - `Process Data Sources` → `Get View Metadata` (取代原本的 `Get Tableau Image`)
    - `Is Today's Data? (YES)` → `Get Tableau Image`

14. **完整測試**:
    - 場景 1: 數據已更新（第一次就成功）
    - 場景 2: 數據延遲（需要重試）
    - 場景 3: 數據未更新（達到最大重試）

---

## 🔍 關鍵問題

### 需要確認

1. **Tableau View 是否有 updatedAt 欄位？**
   - 如果有，使用方案 A（檢查 view metadata）
   - 如果沒有，使用方案 B（檢查數據本身）

2. **數據來源的更新時間？**
   - 通常什麼時候完成？
   - 是否有保證的 SLA？

3. **重試間隔和次數？**
   - 5 分鐘 × 3 次 = 15 分鐘總延遲
   - 是否需要調整？（例如 3 分鐘 × 5 次）

4. **失敗處理？**
   - 達到最大重試後，是否仍要上傳昨天的資料？
   - 或是完全不上傳，只發送告警？

---

## 🛠️ API 端點參考

### Tableau REST API v3.4

#### Get View Details
```
GET /api/3.4/sites/{site-id}/views/{view-id}
```

**回應**:
```json
{
  "view": {
    "id": "73f522ea-19fd-4e62-bafb-c0abe8755ec8",
    "name": "Top100 player",
    "contentUrl": "Top100Player/sheets/Sheet1",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2025-12-13T08:55:00Z",
    "viewUrlName": "Sheet1",
    "workbook": {
      "id": "abc123",
      "name": "Top100 Player"
    }
  }
}
```

#### Query View Data
```
POST /api/3.4/sites/{site-id}/views/{view-id}/data
```

**回應**: CSV 或 JSON 格式的數據

---

## 📝 待辦事項

### 實施前

- [ ] 確認 Tableau API 是否支援取得 view metadata
- [ ] 確認數據中是否有日期欄位可以檢查
- [ ] 決定使用方案 A 或方案 B
- [ ] 確認重試參數（間隔、次數）
- [ ] 確認失敗處理邏輯

### 實施中

- [ ] 新增 7 個節點
- [ ] 修改現有連線
- [ ] 新增重試計數器邏輯
- [ ] 新增 Slack 告警訊息

### 測試

- [ ] 單元測試：日期檢查邏輯
- [ ] 單元測試：重試計數器
- [ ] 整合測試：完整重試循環
- [ ] 情境測試：數據已更新
- [ ] 情境測試：數據延遲更新
- [ ] 情境測試：數據未更新（失敗）

### 上線

- [ ] 備份原始 workflow
- [ ] 部署新版本
- [ ] 監控第一次執行
- [ ] 確認 Slack 告警正常

---

## 🚨 風險與注意事項

### 風險

1. **API Rate Limit**: 重試可能導致 API 請求增加
2. **執行時間**: 最長可能延遲 16 分鐘
3. **循環錯誤**: 如果邏輯有誤，可能無限循環

### 緩解措施

1. **Rate Limit**:
   - 每次重試間隔 5 分鐘，不會觸發 rate limit
   - Tableau API 通常限制為每小時數千次請求

2. **執行時間**:
   - n8n 預設 workflow timeout 可能需要調整
   - 確認 workflow settings 中的 `executionTimeout`

3. **無限循環**:
   - 使用 `maxRetries` 硬性限制
   - 新增 `totalElapsedTime` 檢查（例如超過 20 分鐘就強制停止）

---

## 📈 效能影響

### 現有流程

```
總執行時間: ~72 秒
- Tableau Login: ~2s
- Get Image (×2): ~60s
- Upload (×2): ~2s
- Wait (×2): ~6s
```

### 新增重試機制後

#### 最佳情況（第一次就成功）
```
總執行時間: ~75 秒
- Get View Metadata: ~1s
- Check Data Date: ~1s
- 原有流程: ~72s
```
**額外開銷**: +3 秒

#### 最差情況（3 次重試）
```
總執行時間: ~16 分鐘
- 重試循環 (×3): ~15 分鐘
- 最終成功執行: ~75 秒
```
**最大延遲**: +15 分鐘

---

## 🔗 相關文件

- [Tableau REST API - Views](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_workbooks_and_views.htm#query_view)
- [n8n IF Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.if/)
- [n8n Wait Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/)

---

## 📧 下一步

請確認以下問題，我將基於你的回答提供具體的實施方案：

1. **檢查方式**: 偏好使用方案 A（view metadata）還是方案 B（data content）？
2. **重試參數**: 5 分鐘 × 3 次是否合適？
3. **失敗處理**: 達到最大重試後，要上傳昨天的資料還是只發送告警？
4. **測試環境**: 是否有 dev 環境可以先測試？

---

**文檔版本**: 1.0
**創建時間**: 2025-12-13
**作者**: Claude Code
