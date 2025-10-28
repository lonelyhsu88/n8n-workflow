# 🔧 IF 節點修復說明

**修復時間**: 2025-10-29
**問題**: IF 節點類型驗證錯誤

---

## ❌ 原始錯誤

```
Wrong type: 'true' is a string but was expecting a boolean [condition 0, item 0]
Try either:

Enabling 'Convert types where required'
Converting the second field to a boolean by adding .toBoolean()
```

---

## 🔍 問題分析

### 錯誤原因

IF 節點的條件判斷中：
```javascript
左值: {{ $json.shouldSendNewMessage }}    // JavaScript 回傳 true (布林值)
右值: "true"                              // 字串 "true"
```

n8n 預設使用**嚴格類型檢查** (strict type validation)，不會自動轉換類型，所以:
- 布林值 `true` ≠ 字串 `"true"`
- 導致類型不匹配錯誤

### IF 節點配置

**修復前**:
```json
{
  "options": {
    "typeValidation": "strict"  // ← 嚴格模式
  },
  "conditions": [
    {
      "leftValue": "={{ $json.shouldSendNewMessage }}",
      "rightValue": "true",  // ← 字串
      "operator": {
        "type": "boolean",
        "operation": "equals"
      }
    }
  ]
}
```

---

## ✅ 修復方案

### 方案 1: 啟用 "Convert types where required" ⭐ (已採用)

在 IF 節點的 options 中啟用 `looseTypeValidation`:

```json
{
  "options": {
    "looseTypeValidation": true  // ← 啟用自動類型轉換
  }
}
```

**效果**:
- ✅ 自動將字串 `"true"` 轉換為布林值 `true`
- ✅ 自動將字串 `"false"` 轉換為布林值 `false`
- ✅ 不需要修改其他節點的程式碼

### 方案 2: 修改右值 (備選)

將右值改為布林表達式:

```javascript
// 從:
rightValue: "true"

// 改為:
rightValue: "={{ true }}"
```

**缺點**: 需要手動修改配置，不如方案 1 方便。

### 方案 3: 使用 .toBoolean() (備選)

在左值或右值加上類型轉換:

```javascript
leftValue: "={{ $json.shouldSendNewMessage.toString() }}"
rightValue: "true"
```

**缺點**: 需要修改程式碼，不推薦。

---

## 🎯 已執行的修復

1. **下載原始 workflow**
2. **修改 IF 節點配置**:
   - 新增 `looseTypeValidation: true`
3. **刪除舊 workflow** (ID: `cUwrnugVuhE72Wlr`)
4. **重新匯入修復版** (ID: `y5eExl2SBlHJwzRb`)

---

## 📋 新的 Workflow 資訊

```yaml
名稱: 出勤統計分析-優化完整版-簡化版 (已修復)
Workflow ID: y5eExl2SBlHJwzRb
URL: https://n88.zeabur.app/workflow/y5eExl2SBlHJwzRb
狀態: ⚪ Inactive (待啟用)
```

---

## 🔍 驗證修復

### 檢查 IF 節點配置

1. 開啟 workflow
2. 點擊 "If" 節點
3. 檢查配置:

```
條件 1:
  左值: {{ $json.shouldSendNewMessage }}
  運算符: Boolean → equals
  右值: true

選項:
  ✅ Convert types where required (已啟用)
```

### 測試執行

1. 設定所有憑證
2. 點擊 "Execute Workflow"
3. 確認 IF 節點不再報錯

**預期結果**:
- ✅ 所有節點都是綠色
- ✅ IF 節點正確判斷條件
- ✅ 根據條件決定是否發送 Slack 通知

---

## 🧪 IF 節點工作原理

### 條件 1: 檢查是否需要發送新訊息

```javascript
左值: {{ $json.shouldSendNewMessage }}  // true 或 false
右值: true
運算符: equals
```

**邏輯**: 如果是第一次執行或強制發送，則為 true

### 條件 2: 檢查出勤資料是否改變

```javascript
左值: {{ $json.attendanceHash }}       // 當前資料的 hash
右值: {{ $json.previousHash }}         // 上次執行的 hash
運算符: notEquals
```

**邏輯**: 如果出勤資料有變化，hash 值會不同

### 組合邏輯

```
條件 1 OR 條件 2
```

**意思**: 滿足以下任一條件就發送通知:
- 第一次執行 (shouldSendNewMessage = true)
- 出勤資料有變化 (hash 不同)

---

## 💡 類型轉換規則

啟用 `looseTypeValidation: true` 後，n8n 會自動轉換:

| 原始類型 | 目標類型 | 轉換規則 |
|---------|---------|---------|
| 字串 "true" | 布林值 | `true` |
| 字串 "false" | 布林值 | `false` |
| 字串 "1" | 布林值 | `true` |
| 字串 "0" | 布林值 | `false` |
| 字串 "" | 布林值 | `false` |
| 數字 1 | 布林值 | `true` |
| 數字 0 | 布林值 | `false` |
| null | 布林值 | `false` |
| undefined | 布林值 | `false` |

---

## ❓ 常見問題

### Q1: 為什麼會有這個錯誤？

**A**: 因為 JavaScript 程式碼回傳的是布林值，但 IF 節點的右值設定為字串 `"true"`。在嚴格模式下，n8n 不會自動轉換類型。

### Q2: 啟用 looseTypeValidation 會影響其他判斷嗎？

**A**: 不會。這個設定只影響當前 IF 節點的類型轉換行為，不會影響其他節點。

### Q3: 除了 IF 節點，還有其他節點需要修復嗎？

**A**: 不需要。只有 IF 節點有這個類型檢查問題。

### Q4: 如果還是報錯怎麼辦？

**A**: 請確認:
1. 使用正確的 Workflow ID: `y5eExl2SBlHJwzRb`
2. "處理請假資料" 節點的程式碼正確運行
3. `$json.shouldSendNewMessage` 確實是布林值

---

## 📖 相關文檔

| 問題 | 參考文檔 |
|------|---------|
| 如何設定憑證？ | CREDENTIALS_SETUP_GUIDE.md |
| 如何執行測試？ | EXECUTE_WORKFLOW.md |
| Workflow 完整資訊？ | SIMPLIFIED_VERSION_INFO.md |

---

**文件版本**: v1.0
**建立日期**: 2025-10-29
**Workflow ID**: D8ICeF3oN4pVSqzf (最新)
**修復狀態**: ✅ 已完成

🎉 **IF 節點已修復！可以繼續執行 workflow！**
