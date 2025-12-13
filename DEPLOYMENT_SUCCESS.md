# ✅ Tableau 重試機制部署成功

**部署時間**: 2025-12-13 21:49
**狀態**: ✅ 成功部署並驗證

---

## 📊 部署摘要

| 項目 | 值 |
|------|-----|
| **Workflow ID** | nCw8y2bLSMj4CD74 |
| **Workflow 名稱** | 線上-Top100/50 Player(08:50)優化-dev |
| **節點數** | 16 (新增 7 個) |
| **連線數** | 16 |
| **執行時間限制** | 3600 秒 (1 小時) |
| **時區** | Asia/Taipei |
| **啟用狀態** | ❌ 未啟用 (需手動啟用) |

---

## ✅ 驗證結果

- ✅ JSON 格式正確
- ✅ 16 個節點全部部署成功
- ✅ 16 個連線全部配置正確
- ✅ 時區設定為 Asia/Taipei
- ✅ 執行時間限制設為 1 小時
- ✅ 7 個新增節點全部存在

---

## 🎯 新增的節點

1. ✅ **Get View Metadata** (HTTP Request)
   - 獲取 Tableau view 的更新時間

2. ✅ **Check Data Date** (Code)
   - 比較數據日期與今天日期

3. ✅ **Is Today's Data?** (IF)
   - 判斷是否為今天的數據

4. ✅ **Can Retry?** (IF)
   - 判斷是否還能重試

5. ✅ **Increment Retry Counter** (Code)
   - 增加重試計數器

6. ✅ **Wait 5 Minutes** (Wait)
   - 等待 5 分鐘後重試

7. ✅ **Send Alert** (Slack)
   - 發送失敗告警訊息

---

## 🔄 新的執行流程

```
08:50 - Workflow 觸發
  ↓
Get View Metadata - 檢查 Tableau view 更新時間
  ↓
Check Data Date - 比較日期
  ↓
Is Today's Data? - 判斷
  ├─ YES → Get Tableau Image → Upload to Slack ✅
  └─ NO → Can Retry?
           ├─ YES (< 3次) → Increment Counter → Wait 5 min → 重新檢查
           └─ NO (>= 3次) → Send Alert ⚠️ → 處理下一個數據源
```

---

## 💾 備份資訊

**備份檔案**: `backups/workflow-backup-deploy.json`
**大小**: 12 KB
**建立時間**: 2025-12-13 21:49

### 如需回滾

```bash
curl -X PUT "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74" \
  -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMDQ5N2U3ZS01N2JmLTQ4ODctYWE2Ny05MTkzZWUzOWUwMWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyODQ4NDcyfQ.tf5PBPLrdnaTmTeSU4k_jFnpS3Q2kh09Rulm3i_J6Ps" \
  -H "Content-Type: application/json" \
  -d @backups/workflow-backup-deploy.json
```

---

## 🚀 下一步行動

### 1. 在 n8n UI 中檢查 Workflow

🔗 **URL**: https://n8n.elstech.com.tw/workflow/nCw8y2bLSMj4CD74

**檢查項目**:
- [ ] 所有節點顯示正常
- [ ] 連線無錯誤標記
- [ ] 節點配置正確

### 2. 手動測試執行

**方法 A**: 在 n8n UI 中點擊 "Execute Workflow" 按鈕

**方法 B**: 使用 API 觸發
```bash
curl -X POST "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74/execute" \
  -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMDQ5N2U3ZS01N2JmLTQ4ODctYWE2Ny05MTkzZWUzOWUwMWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyODQ4NDcyfQ.tf5PBPLrdnaTmTeSU4k_jFnpS3Q2kh09Rulm3i_J6Ps" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**預期結果**:
- ✅ Check Data Date 節點顯示日期比較結果
- ✅ 如果數據是今天的，應該直接下載並上傳
- ✅ 如果數據是昨天的，應該進入重試循環
- ✅ Slack 收到報表圖片或告警訊息

### 3. 啟用 Workflow（測試通過後）

```bash
curl -X PATCH "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74" \
  -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMDQ5N2U3ZS01N2JmLTQ4ODctYWE2Ny05MTkzZWUzOWUwMWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyODQ4NDcyfQ.tf5PBPLrdnaTmTeSU4k_jFnpS3Q2kh09Rulm3i_J6Ps" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

**確認啟用**:
```bash
curl -s "https://n8n.elstech.com.tw/api/v1/workflows/nCw8y2bLSMj4CD74" \
  -H "X-N8N-API-KEY: ..." \
  | jq '.active'
# 應該返回: true
```

### 4. 監控首次排程執行

- **時間**: 明天早上 08:50 (Asia/Taipei)
- **監控事項**:
  - 執行是否正常觸發
  - 數據日期檢查是否正確
  - 是否需要重試
  - Slack 是否收到報表

---

## 📊 效能影響

### 最佳情況（數據已更新）

| 項目 | 原版本 | 新版本 | 差異 |
|------|--------|--------|------|
| 執行時間 | ~72 秒 | ~75 秒 | +3 秒 |
| API 請求 | 3 次 | 5 次 | +2 次 |

**影響**: 幾乎無影響 ✅

### 最差情況（需要 3 次重試）

| 項目 | 原版本 | 新版本 | 差異 |
|------|--------|--------|------|
| 執行時間 | ~72 秒 | ~16 分鐘 | +15 分鐘 |
| API 請求 | 3 次 | 11 次 | +8 次 |

**影響**: 顯著延遲，但確保數據正確性 ✅

---

## 🎯 重試機制運作方式

### 時間軸範例

```
08:50:00 - Workflow 觸發
08:50:05 - 第一次檢查
  └─ 數據是昨天的 → 進入重試

08:55:05 - 第一次重試 (等待 5 分鐘)
  └─ 數據還是昨天的 → 繼續重試

09:00:05 - 第二次重試 (等待 5 分鐘)
  └─ 數據還是昨天的 → 繼續重試

09:05:05 - 第三次重試 (等待 5 分鐘)
  └─ 判斷結果:
      ├─ 數據更新了 → 下載並上傳 ✅
      └─ 數據還是昨天 → 發送告警 ⚠️
```

### 告警訊息範例

當達到最大重試次數且數據仍未更新時，會發送以下訊息到 Slack:

```
⚠️ Tableau 數據更新延遲警告

📊 報表: Top100 player
📅 預期日期: 2025-12-13
📅 實際日期: 2025-12-12
🔄 重試次數: 3/3
⏰ 檢查時間: 2025-12-13T09:05:05.000Z

❌ 已達最大重試次數，數據仍未更新到今天。

💡 建議動作:
1. 檢查 Tableau 數據來源是否正常運作
2. 確認數據更新排程是否正常執行
3. 手動檢查 view: 73f522ea-19fd-4e62-bafb-c0abe8755ec8

🔗 Tableau URL: https://prod-apnortheast-a.online.tableau.com
```

---

## 📚 相關文檔

- [原始 Workflow 分析](docs/workflow-analysis-top100-player-report.md)
- [重試機制設計](docs/tableau-retry-mechanism-design.md)
- [完整實施文檔](docs/retry-mechanism-implementation.md)
- [實施摘要](IMPLEMENTATION_SUMMARY.md)

---

## 🔍 監控與維護

### 每日檢查

```bash
# 檢查最近的執行記錄
curl -s "https://n8n.elstech.com.tw/api/v1/executions?workflowId=nCw8y2bLSMj4CD74&limit=5" \
  -H "X-N8N-API-KEY: ..." \
  | jq '.data[] | {id, startedAt, finished, status}'
```

### 關鍵指標

| 指標 | 正常值 | 警告值 | 嚴重值 |
|------|--------|--------|--------|
| 執行時間 | < 2 分鐘 | 2-10 分鐘 | > 15 分鐘 |
| 重試次數 | 0 次 | 1-2 次 | 3 次 |
| 成功率 | 100% | 80-99% | < 80% |

---

## ✅ 驗證清單

部署完成後的驗證：

- [x] JSON 格式驗證通過
- [x] 16 個節點全部部署
- [x] 16 個連線配置正確
- [x] 時區設定為 Asia/Taipei
- [x] 執行時間限制設為 1 小時
- [x] 備份檔案已創建
- [ ] n8n UI 中手動檢查
- [ ] 手動測試執行
- [ ] 確認 Slack 告警功能
- [ ] 啟用 workflow
- [ ] 監控首次排程執行

---

**部署者**: Claude Code
**版本**: 1.0
**狀態**: ✅ 部署成功，等待測試
