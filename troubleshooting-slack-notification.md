# Slack 通知未發送問題排查指南

## 問題描述
工作流執行後，Slack 未收到通知訊息。

## 可能原因與解決方案

### 1. ⚠️ `shouldNotify` 值為 `false`（最常見）

**問題**：如果當前油價與上次紀錄的價格**完全相同**，`hasAnyChange` 會是 `false`，導致 `Should Notify?` IF 節點判斷為 false，不會發送通知。

**檢查方式**：
1. 在 N8N 中點擊 `Format Notification` 節點
2. 查看輸出的 JSON 資料
3. 確認以下欄位：
   ```json
   {
     "hasAnyChange": false,  // ← 如果是 false，代表價格沒變動
     "shouldNotify": false,   // ← 因此不會發送通知
     "priceChanges": {
       "92無鉛": 0.0,
       "95無鉛": 0.0,
       "98無鉛": 0.0,
       "超級柴油": 0.0
     }
   }
   ```

**解決方案**：

#### 選項 A：移除價格變動過濾（總是通知）
如果你希望**無論價格是否變動都發送通知**，請刪除 `Should Notify?` IF 節點，直接連接：

```
Save to Google Sheets → Send Success Notification
```

修改後的連接：
```json
"Save to Google Sheets": {
  "main": [
    [
      {
        "node": "Send Success Notification",
        "type": "main",
        "index": 0
      }
    ]
  ]
}
```

#### 選項 B：保留過濾，但測試時手動修改價格
在 Google Sheets 中手動修改上次的價格數據，讓工作流檢測到變動。

---

### 2. 🔍 Google Sheets 資料問題

**問題**：`Get Previous Prices` 節點無法讀取到歷史資料，導致比對邏輯錯誤。

**檢查方式**：
1. 點擊 `Get Previous Prices` 節點查看輸出
2. 確認是否有資料回傳
3. 查看 Console log（如果有啟用）

**解決方案**：
- 確認 Google Sheets 中 `rawdata` 工作表至少有一筆歷史資料
- 確認欄位名稱完全一致：`Date`, `92無鉛汽油`, `95無鉛汽油`, `98無鉛汽油`, `超級柴油`

---

### 3. 🚫 Slack 認證或權限問題

**問題**：Slack API 憑證無效或沒有發送訊息的權限。

**檢查方式**：
1. 在 N8N 中點擊 `Send Success Notification` 節點
2. 查看是否有錯誤訊息
3. 檢查 Slack App 權限

**解決方案**：
1. 確認 Slack OAuth Token 有效
2. 確認 Slack App 有以下權限：
   - `chat:write`
   - `chat:write.public`
   - `users:read`
3. 重新授權 Slack 認證（如需要）

---

### 4. 🔗 節點連接錯誤

**問題**：工作流的節點連接可能不正確。

**正確的連接順序應該是**：

#### 成功路徑（無錯誤）
```
每週日14:00
  ↓
HTTP Request
  ↓
Check API Success
  ↓
Has Error? (FALSE 分支)
  ↓
XML to JSON
  ↓
Get Previous Prices
  ↓
Format Notification
  ↓
Save to Google Sheets
  ↓
Should Notify? (TRUE 分支) ← 這裡可能被過濾掉
  ↓
Send Success Notification
```

**檢查方式**：
在你提供的 JSON 中，確認 `connections` 部分如下：

```json
"Should Notify?": {
  "main": [
    [
      {
        "node": "Send Success Notification",  // ✅ TRUE 時發送
        "type": "main",
        "index": 0
      }
    ]
    // 注意：第二個陣列（FALSE 分支）是空的，這是正常的
  ]
}
```

---

### 5. 🧪 測試模式執行問題

**問題**：某些節點在測試模式下的行為可能與生產環境不同。

**解決方案**：
- 使用「Execute Workflow」完整執行，而非單獨測試節點
- 確認所有前置節點都有正確執行

---

## 快速診斷步驟

### Step 1: 檢查執行歷史
1. 在 N8N 執行歷史中查看工作流
2. 檢查哪個節點是**最後執行的節點**
3. 如果最後執行的是 `Should Notify?` 而非 `Send Success Notification`，代表被過濾了

### Step 2: 查看 `Format Notification` 輸出
點擊節點，查看 JSON 輸出：
```json
{
  "notification": "...",
  "hasAnyChange": ???,      // ← 關鍵欄位
  "shouldNotify": ???,      // ← 關鍵欄位
  "priceChanges": {
    "92無鉛": ???,
    "95無鉛": ???,
    "98無鉛": ???,
    "超級柴油": ???
  }
}
```

### Step 3: 臨時移除過濾測試
暫時修改 `Format Notification` 節點，強制 `shouldNotify` 為 `true`：

```javascript
return [{
  json: {
    notification,
    sheetData,
    products,
    priceChanges,
    hasError: false,
    hasAnyChange,
    shouldNotify: true  // ← 強制改為 true 進行測試
  }
}];
```

執行後如果收到通知，確認問題就是價格沒變動。

---

## 最佳實踐建議

### 方案 1️⃣：完全移除價格變動過濾
**適用場景**：希望每次執行都收到通知（無論價格是否變動）

**修改**：
- 刪除 `Should Notify?` IF 節點
- 直接連接 `Save to Google Sheets` → `Send Success Notification`

### 方案 2️⃣：保留過濾，增加日誌通知
**適用場景**：只想在價格變動時收到通知，但希望知道工作流有正常執行

**修改**：
在 `Should Notify?` 的 FALSE 分支（index: 1）增加一個簡化通知：

```json
"Should Notify?": {
  "main": [
    [
      {
        "node": "Send Success Notification",
        "type": "main",
        "index": 0
      }
    ],
    [
      {
        "node": "Send No Change Log",  // 新增節點
        "type": "main",
        "index": 0
      }
    ]
  ]
}
```

新增 `Send No Change Log` Slack 節點：
```
訊息內容：
✅ 中油油價檢查完成
📅 檢查時間: [時間]
ℹ️ 價格無變動，未發送詳細通知
```

### 方案 3️⃣：使用更靈活的通知條件
**適用場景**：想要更精細的控制，例如只在變動超過 0.5 元時通知

**修改** `Format Notification` 節點：

```javascript
// 設定通知閾值（元）
const NOTIFY_THRESHOLD = 0.5;

// 計算是否有「顯著」變動
const hasSignificantChange = Object.values(priceChanges).some(
  change => Math.abs(change) >= NOTIFY_THRESHOLD
);

return [{
  json: {
    notification,
    sheetData,
    products,
    priceChanges,
    hasError: false,
    hasAnyChange,
    shouldNotify: hasSignificantChange  // ← 使用閾值判斷
  }
}];
```

---

## 除錯 Checklist

- [ ] 確認 `Format Notification` 輸出的 `shouldNotify` 為 `true`
- [ ] 確認 `Should Notify?` IF 節點有連接到 `Send Success Notification`
- [ ] 確認 Slack 認證有效且有權限
- [ ] 確認 Google Sheets 有歷史資料
- [ ] 確認工作流完整執行到最後一個節點
- [ ] 嘗試手動執行整個工作流（而非單一節點）
- [ ] 檢查 Slack App 是否被邀請到目標頻道/對話

---

## 檔案位置

- **修正版工作流**：`cpc-oil-price-fixed.js`
- **本故障排除指南**：`troubleshooting-slack-notification.md`

---

## 需要更多協助？

如果以上方法都無法解決問題，請提供：
1. `Format Notification` 節點的完整 JSON 輸出
2. N8N 執行歷史的截圖
3. 最後執行到哪個節點
4. Slack 節點是否有錯誤訊息
