# 中油油價監控工作流 - 使用指南

## 📋 概述

這是一個自動監控台灣中油油價的 N8N 工作流，每週日 14:00 自動執行，查詢最新油價並發送 Slack 通知。

## ✨ 功能特色

### 1. **自動查詢油價**
- 每週日 14:00 自動執行
- 從中油官方 API 獲取最新油價資訊
- 支援四種油品：92無鉛、95無鉛、98無鉛、超級柴油

### 2. **價格比較**
- 自動與上次記錄的價格比對
- 計算各油品的價格變動
- 計算汽油平均變動幅度

### 3. **錯誤處理機制** ✅
- API 請求失敗時立即發送警告通知
- 包含詳細的錯誤訊息和時間戳記
- 工作流不會因錯誤而中斷

### 4. **總是發送通知** ✅
- **無論價格是否變動，每次執行都會發送通知**
- 通知內容包含完整的價格資訊和變動幅度
- 即使價格不變，也能確認工作流正常運作

### 5. **資料記錄**
- 自動將每次查詢的油價存入 Google Sheets
- 建立完整的歷史價格資料庫
- 方便後續分析趨勢

---

## 🔄 工作流程

```
每週日14:00 (觸發器)
    ↓
HTTP Request (查詢中油 API)
    ↓
Check API Success (檢查是否成功)
    ↓
Has Error? (錯誤判斷)
    ├─ 有錯誤 → Send Error Notification (發送錯誤警告) ⚠️
    │
    └─ 無錯誤 → XML to JSON (轉換資料格式)
                    ↓
                Get Previous Prices (從 Google Sheets 讀取上次價格)
                    ↓
                Format Notification (格式化通知內容)
                    ↓
                Save to Google Sheets (儲存當前價格)
                    ↓
                Send Notification (發送 Slack 通知) ✅
```

---

## 📦 檔案說明

### 主要檔案
- **cpc-oil-price-final.js** - 最終版本工作流（推薦使用）
  - ✅ 包含錯誤處理
  - ✅ 總是發送通知（無論價格是否變動）
  - ✅ 完整的價格比較功能

### 參考檔案
- **cpc-oil-price.js** - 原始版本
- **cpc-oil-price-improved.js** - 改進版（包含價格過濾）
- **cpc-oil-price-fixed.js** - 除錯版本

### 文檔檔案
- **README-oil-price.md** - 本使用指南
- **cpc-oil-price-improvements.md** - 改進功能詳細說明
- **troubleshooting-slack-notification.md** - 故障排除指南

---

## 🚀 快速開始

### 1. 匯入工作流
1. 開啟 N8N
2. 點擊「Import from File」
3. 選擇 `cpc-oil-price-final.js`
4. 點擊「Import」

### 2. 設定 Credentials

#### Google Sheets API
1. 點擊 `Get Previous Prices` 或 `Save to Google Sheets` 節點
2. 設定 Google API 憑證：`n8n-googlesheet`
3. 確認文件 ID：`1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8`
4. 確認工作表名稱：`rawdata`

#### Slack API
1. 點擊 `Send Notification` 或 `Send Error Notification` 節點
2. 設定 Slack API 憑證：`n8n-ops`
3. 確認通知對象：`lonely.h` (U07F9203EP8)

### 3. 測試執行
1. 點擊工作流上方的「Execute Workflow」
2. 確認每個節點都成功執行（綠色勾勾）
3. 檢查 Slack 是否收到通知

---

## 📊 Google Sheets 資料格式

### 欄位說明
| 欄位名稱 | 說明 | 範例 |
|---------|------|------|
| Date | 更新時間 | 2025/10/27 下午2:00:15 |
| 92無鉛汽油 | 92無鉛汽油價格 | 29.5 |
| 95無鉛汽油 | 95無鉛汽油價格 | 31.0 |
| 98無鉛汽油 | 98無鉛汽油價格 | 33.0 |
| 超級柴油 | 超級柴油價格 | 27.3 |

### 初始化設定
第一次執行前，請確認 Google Sheets 的 `rawdata` 工作表包含以下標題列：

```
Date | 92無鉛汽油 | 95無鉛汽油 | 98無鉛汽油 | 超級柴油
```

---

## 💬 Slack 通知格式

### 成功通知範例
```
中油油價上漲通知
📅 更新時間: 2025/10/27 下午2:00:15
📍 生效時間: 自2025-10-28零時起實施

價格變動
• 汽油平均: +0.5 元
• 柴油: +0.3 元

調整後價格 (元/公升)
• 92無鉛: 29.5 (+0.5)
• 95無鉛: 31.0 (+0.5)
• 98無鉛: 33.0 (+0.5)
• 超級柴油: 27.3 (+0.3)

資料來源: 台灣中油官網
```

### 錯誤通知範例
```
⚠️ 中油油價 API 請求失敗警告

📅 發生時間: 2025/10/27 下午2:00:15
❌ 錯誤訊息: Request timeout

請檢查網路連線或 API 狀態。
```

---

## ⚙️ 進階設定

### 修改執行時間
在 `每週日14:00` 節點中修改 Cron 表達式：

| 時間 | Cron 表達式 | 說明 |
|------|------------|------|
| 每週日 14:00 | `0 14 * * 0` | 預設值 |
| 每週日 10:00 | `0 10 * * 0` | 上午執行 |
| 每天 14:00 | `0 14 * * *` | 每天執行 |
| 每週一、四 14:00 | `0 14 * * 1,4` | 一週兩次 |

### 修改通知對象
在 `Send Notification` 節點中：
- 可選擇發送給使用者 (User)
- 可選擇發送到頻道 (Channel)
- 支援同時發送給多個對象

### 調整 API 超時時間
在 `HTTP Request` 節點的 Options 中：
```json
{
  "timeout": 30000  // 30 秒（預設值）
}
```

---

## 🔧 故障排除

### 問題 1：沒有收到 Slack 通知
**可能原因**：
1. Slack 認證過期或無效
2. Slack App 沒有發送訊息的權限
3. 工作流執行失敗

**解決方法**：
1. 檢查執行歷史，確認工作流有執行到 `Send Notification` 節點
2. 點擊 `Send Notification` 節點查看是否有錯誤訊息
3. 重新授權 Slack API 憑證
4. 確認 Slack App 已被邀請到對話中

### 問題 2：API 請求失敗
**可能原因**：
1. 中油 API 服務暫時無法使用
2. 網路連線問題
3. API URL 已變更

**解決方法**：
1. 檢查是否收到錯誤通知（包含詳細錯誤訊息）
2. 手動測試 API URL：
   ```
   https://vipmbr.cpc.com.tw/cpcstn/listpricewebservice.asmx/getCPCMainProdListPrice_XML
   ```
3. 稍後重新執行工作流

### 問題 3：Google Sheets 寫入失敗
**可能原因**：
1. Google API 憑證過期
2. 權限不足
3. 工作表名稱或文件 ID 錯誤

**解決方法**：
1. 重新授權 Google Sheets API
2. 確認服務帳號有編輯權限
3. 檢查文件 ID 和工作表名稱是否正確

---

## 📈 使用技巧

### 1. 建立價格趨勢圖表
使用 Google Sheets 的內建圖表功能：
1. 選取 `Date` 和各油品價格欄位
2. 插入 → 圖表 → 折線圖
3. 即可視覺化價格變化趨勢

### 2. 設定價格警示
可在 `Format Notification` 節點中新增條件判斷：
```javascript
// 範例：當 95 無鉛超過 35 元時特別提醒
if (products['95無鉛汽油'] > 35) {
  notification += '\\n\\n⚠️ 警示：95無鉛汽油已超過 35 元！';
}
```

### 3. 匯出歷史資料
從 Google Sheets 可輕鬆匯出為：
- CSV 格式（供資料分析使用）
- Excel 格式（供報表製作）
- PDF 格式（供列印存檔）

---

## 🆘 需要協助？

如果遇到問題，請參考：
1. **troubleshooting-slack-notification.md** - Slack 通知問題完整排查指南
2. **cpc-oil-price-improvements.md** - 改進功能技術文檔

或檢查：
- N8N 執行歷史中的詳細錯誤訊息
- 各節點的輸出資料
- Console log（如果有啟用）

---

## 📝 更新日誌

### v2.0 (2025-10-27) - 最終版本
- ✅ 總是發送通知（移除價格變動過濾）
- ✅ 完整的錯誤處理機制
- ✅ API 失敗時發送警告
- ✅ 優化節點連接邏輯

### v1.1 (2025-10-27) - 改進版本
- ✅ 新增 API 錯誤處理
- ✅ 新增價格變動閾值通知
- ✅ 優化價格比較邏輯

### v1.0 - 原始版本
- 基礎油價查詢與通知功能

---

## 📄 授權與聲明

- 油價資料來源：台灣中油公司官方 API
- 本工作流僅供個人使用，請勿用於商業用途
- 使用本工作流產生的任何結果，使用者需自行承擔責任
