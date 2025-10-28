# Workflow Update Guide - 2025-10-29

## 🎯 目的
更新 n8n workflow 以修復日期解析問題，支援：
1. ✅ 逗號分隔的多個日期/日期範圍（如 "10/23，27-31"）
2. ✅ 正確的日期遞增邏輯（修復無限迴圈bug）

## 📋 需要更新的內容

### 問題分析
根據測試結果：
- ❌ 測試 2 失敗：`"10/23，27-31 @RD-Jean 特休"` 無法解析
- ✅ 測試 1 成功：`"10/23-11/1 @QA-Lisa 特休"` 正確解析 7 筆記錄
- ✅ 測試 3 成功：`"10/27-31 @RD-Jean 特休"` 正確解析 5 筆記錄

### Root Cause
當前 workflow 的 `extractLeaveDates` 函數：
1. 無法處理逗號分隔的多個日期段
2. 日期遞增邏輯錯誤：`currentDate.setDate(currentDate.setDate(currentDate.getDate() + 1))` 導致只解析一筆

## 🔧 更新步驟

### 方法 1: 使用 Web UI 手動更新（推薦）

1. **登入 n8n**
   ```
   https://n8n-production-9f9c.zeabur.app/
   ```

2. **找到 workflow**
   - 名稱：`出勤統計分析-簡化版-Final`
   - ID: `D8ICeF3oN4pVSqzf`

3. **編輯「解析出缺勤資料」節點**
   - 點擊該節點
   - 找到 `extractLeaveDates` 函數

4. **替換完整程式碼**
   - 使用 `/tmp/PARSE_CODE_FIXED.js` 中的程式碼
   - 或複製下面的關鍵修改

### 方法 2: 使用修復檔案

已準備好的修復檔案：
- `/tmp/PARSE_CODE_FIXED.js` - 完整修復版本
- `/tmp/workflow_updated.json` - 更新後的 workflow JSON

## 📝 關鍵程式碼修改

### 修改 1: 新增逗號分隔處理

在 `extractLeaveDates` 函數開頭加入：

```javascript
function extractLeaveDates(messageText, messageTimestamp) {
  const currentYear = new Date().getFullYear();
  const results = [];

  // ✅ 新增: 先處理逗號分隔的多個日期段
  // 例如: "10/23，27-31" 或 "10/23, 10/27-31"
  const commaParts = messageText.split(/[,，、]/);

  if (commaParts.length > 1) {
    // 有逗號分隔，分別處理每個部分
    for (const part of commaParts) {
      const partResults = extractSingleDateRange(part.trim(), messageTimestamp, currentYear);
      results.push(...partResults);
    }

    if (results.length > 0) {
      return results;
    }
  }

  // 沒有逗號或逗號處理失敗，使用原本的邏輯
  return extractSingleDateRange(messageText, messageTimestamp, currentYear);
}
```

### 修改 2: 新增輔助函數

```javascript
// ✅ 新增: 提取單一日期或日期範圍的輔助函數
function extractSingleDateRange(messageText, messageTimestamp, currentYear) {
  const results = [];

  // 檢查日期範圍格式
  const rangePatterns = [
    /(\d{1,2})\/(\d{1,2})\s*[~～\-]\s*(\d{1,2})\/(\d{1,2})/,
    /(\d{1,2})\/(\d{1,2})\s*[~～\-]\s*(\d{1,2})(?!\/)/,
  ];

  for (const pattern of rangePatterns) {
    const match = messageText.match(pattern);
    if (match) {
      // ... (日期範圍處理邏輯)

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          results.push({
            date: currentDate.toLocaleDateString('zh-TW', {
              timeZone: taipeiTimeZone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }),
            status: null
          });
        }
        // ✅ 修復: 正確的日期遞增
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return results;
    }
  }

  // ... (其他日期格式處理)
  return results;
}
```

### 修改 3: 修復日期遞增 Bug

**錯誤版本：**
```javascript
currentDate.setDate(currentDate.setDate(currentDate.getDate() + 1));
```

**正確版本：**
```javascript
currentDate.setDate(currentDate.getDate() + 1);
```

## ✅ 驗證

更新後測試以下案例：

1. **QA-Lisa 的請假**
   - 輸入：`"10/23-11/1 @QA-Lisa 特休"`
   - 預期：解析 7 筆記錄（10/23, 10/24, 10/27, 10/28, 10/29, 10/30, 10/31）

2. **RD-Jean 的請假（逗號分隔）**
   - 輸入：`"10/23，27-31 @RD-Jean 特休"`
   - 預期：解析 6 筆記錄（10/23 + 10/27-31）

3. **今日報表檢查**
   - 確認 10/29 的報表包含所有進行中的請假記錄
   - 包括 QA-Lisa 和 RD-Jean

## 📊 預期效果

修復後，今日（10/29）請假報表應該顯示：
- QA-Lisa (特休) - 因為 10/23-11/1 包含 10/29
- RD-Jean (特休) - 因為 27-31 包含 10/29
- 其他所有在 10/29 有請假的同仁

## 🔍 檢查清單

- [ ] 確認 workflow 已更新
- [ ] 測試逗號分隔格式 "10/23，27-31"
- [ ] 測試日期範圍格式 "10/23-11/1"
- [ ] 確認 10/29 報表包含所有進行中的請假
- [ ] 查看 console log 輸出的「自動識別的使用者數」

## 📎 相關檔案

- `/tmp/PARSE_CODE_FIXED.js` - 完整修復程式碼
- `/tmp/test_date_parsing_fixed.js` - 測試檔案
- `/tmp/workflow_updated.json` - 更新後的 workflow JSON

## ⚠️ 注意事項

1. 更新前建議先備份 workflow
2. 更新後務必執行測試驗證
3. 確認所有憑證設定正確
4. 檢查 Slack 訊息是否正確更新

---

**最後更新：** 2025-10-29
**Workflow ID:** D8ICeF3oN4pVSqzf
**狀態：** 等待手動更新
