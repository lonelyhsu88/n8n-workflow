# 中油油價工作流改進說明

## 改進項目總覽

基於原始 `cpc-oil-price.js` 工作流，新增以下三項改進：

### 1. 錯誤處理機制 ✅
**目的**：當 API 請求失敗時，立即通知管理員

**實作內容**：
- **新增節點**：`Check API Success` - 檢查 HTTP Request 是否成功
- **新增節點**：`Has Error?` (IF 條件節點) - 判斷是否有錯誤
- **新增節點**：`Send Error Notification` - 發送錯誤警告到 Slack

**工作流程**：
```
HTTP Request (continueOnFail: true)
    ↓
Check API Success (檢查是否有錯誤)
    ↓
Has Error? (IF 條件)
    ├─ TRUE  → Send Error Notification (發送警告)
    └─ FALSE → XML to JSON (繼續正常流程)
```

**錯誤通知格式**：
```
⚠️ 中油油價 API 請求失敗警告

📅 發生時間: 2025-10-27 14:00:00
❌ 錯誤訊息: [具體錯誤訊息]

請檢查網路連線或 API 狀態。
```

### 2. 價格變動閾值通知 ✅
**目的**：只要有任何價格變動就發送通知，避免無意義的「不變」通知

**實作內容**：
- **修改節點**：`Format Notification` - 新增價格變動判斷邏輯
- **新增節點**：`Should Notify?` (IF 條件節點) - 過濾是否需要通知

**核心邏輯**（在 Format Notification 節點）：
```javascript
// 計算是否有任何價格變動
const hasAnyChange = Object.values(priceChanges).some(change => Math.abs(change) > 0);

// 輸出資料增加兩個欄位
return [{
  json: {
    notification,
    sheetData,
    products,
    priceChanges,
    hasError: false,
    hasAnyChange,          // 新增：是否有任何變動
    shouldNotify: hasAnyChange  // 新增：是否應該發送通知
  }
}];
```

**過濾邏輯**：
```
Save to Google Sheets
    ↓
Should Notify? (IF 條件：$json.shouldNotify === true)
    ├─ TRUE  → Send Success Notification (有變動，發送通知)
    └─ FALSE → (無變動，不發送通知)
```

### 3. ~~代理伺服器備援機制~~ ❌
**狀態**：已移除（根據需求，目前不需要代理伺服器）

---

## 節點連接流程圖

### 改進後的完整流程

```
每週日14:00 (觸發器)
    ↓
HTTP Request (continueOnFail: true)
    ↓
Check API Success
    ↓
Has Error? (IF)
    ├─ TRUE  → Send Error Notification ❌
    │
    └─ FALSE → XML to JSON
                   ↓
               Get Previous Prices (Google Sheets)
                   ↓
               Format Notification (計算價格變動)
                   ↓
               Save to Google Sheets
                   ↓
               Should Notify? (IF)
                   ├─ TRUE  → Send Success Notification ✅
                   └─ FALSE → (不發送)
```

---

## 關鍵改進細節

### HTTP Request 節點設定
```javascript
{
  "continueOnFail": true,        // 失敗時繼續執行
  "onError": "continueErrorOutput",  // 錯誤時輸出到錯誤分支
  "options": {
    "timeout": 30000  // 30 秒超時
  }
}
```

### Check API Success 節點邏輯
```javascript
const httpResult = $input.all()[0];

if (!httpResult || httpResult.error) {
  // API 請求失敗
  const errorMsg = httpResult?.error?.message || '未知錯誤';

  return {
    json: {
      hasError: true,
      errorMessage: errorMsg,
      timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    }
  };
}

// 成功，繼續執行
return httpResult;
```

---

## 使用指南

### 匯入工作流
1. 在 N8N 中選擇「Import from File」
2. 上傳 `cpc-oil-price-improved.js`
3. 確認所有 Credentials 設定正確：
   - Google Sheets API (`googleApi`)
   - Slack API (`slackApi`)

### 必要設定
- **Google Sheets 文件 ID**: `1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8`
- **Slack 通知對象**: `U07F9203EP8` (lonely.h)
- **執行時間**: 每週日 14:00 (台灣時間)

### 測試建議
1. **測試 API 失敗情境**：
   - 暫時修改 API URL 為錯誤網址
   - 執行工作流，確認收到錯誤通知

2. **測試價格變動通知**：
   - 手動執行工作流
   - 確認只有在價格變動時才收到通知

3. **測試完整流程**：
   - 恢復正確的 API URL
   - 執行工作流，確認所有步驟正常

---

## 改進效益

### 1. 提升可靠性
- **錯誤即時通知**：API 失敗時立即知道，不會漏掉重要資訊
- **失敗不中斷**：即使 HTTP 請求失敗，也能正常處理並通知

### 2. 減少噪音
- **智能通知**：只有價格變動時才發送通知
- **資訊價值**：每次通知都有實際意義

### 3. 易於維護
- **結構清晰**：每個節點職責明確
- **容易擴展**：可輕鬆新增更多條件判斷或通知渠道

---

## 未來可擴展方向

### 1. 價格變動閾值細化
可設定更細緻的通知條件：
```javascript
// 範例：只有變動超過 0.5 元才通知
const significantChange = Object.values(priceChanges).some(
  change => Math.abs(change) >= 0.5
);
```

### 2. 多渠道通知
- Email 通知
- Telegram 通知
- LINE Notify

### 3. 價格分析報表
- 週報：過去 7 天價格趨勢
- 月報：月度價格統計
- 年度對比

### 4. 代理伺服器備援（如未來需要）
可參考以下架構：
```javascript
const proxyServers = [
  '',  // 不使用代理
  'http://proxy1.example.com:8080',
  'http://proxy2.example.com:8080'
];

// 失敗時自動切換下一個代理
```

---

## 檔案說明

- **cpc-oil-price.js**: 原始工作流
- **cpc-oil-price-improved.js**: 改進後的工作流（建議使用）
- **cpc-oil-price-improvements.md**: 本說明文件

---

## 版本歷史

### v1.1 (2025-10-27)
- ✅ 新增 API 錯誤處理機制
- ✅ 新增價格變動閾值通知
- ✅ 優化通知邏輯

### v1.0 (原始版本)
- 基礎油價查詢與通知功能
