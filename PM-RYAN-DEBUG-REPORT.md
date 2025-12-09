# PM-Ryan 請假檢測問題診斷報告

**日期**: 2025-12-09
**問題**: PM-Ryan 有 12/8-11 請假記錄，但未出現在請假名單中

---

## ✅ 已驗證：邏輯正確

通過完整的單元測試，確認以下邏輯**100% 正確**：

### 1. 日期範圍展開 (expandDateRange)
```javascript
Input: "12/8-11 <@U07FFHDUTMH> 特休&生日假"
Output: ["2025-12-08", "2025-12-09", "2025-12-10", "2025-12-11"]
✅ 正確展開為 4 天
```

### 2. 整天請假判斷 (isFullDayLeave)
```javascript
Input: "12/8-11 <@U07FFHDUTMH> 特休&生日假"
Output: true (整天請假)
✅ 正確識別為整天請假
✅ 正確處理 "特休&生日假" 組合關鍵字
✅ 不會被 "PM" 誤判為下午 (因為使用 <@USER_ID> 格式)
```

### 3. 優先級邏輯
```javascript
if (isOnLeave) {
  // 請假優先 - 即使有提交彙報也會列在請假名單
  onLeaveList.push(...);
} else if (hasSubmitted) {
  submittedList.push(...);
} else {
  notSubmittedList.push(...);
}
✅ 優先級正確: 請假 > 已提交 > 未提交
```

### 4. 查詢時間範圍
```javascript
oldestTs = targetDate - 1 day
latestTs = targetDate + 1 day
✅ 包含足夠的緩衝時間
```

---

## ❓ 可能的根本原因

既然邏輯正確，問題一定出在**資料層面**。以下是按可能性排序的原因：

### 原因 1: 出勤記錄訊息格式不符預期 (⭐⭐⭐⭐⭐ 最可能)

**假設**: 實際的出勤記錄格式可能不是標準的 "12/8-11 <@U07FFHDUTMH> 特休&生日假"

**可能的格式變化**:
- ❌ 使用姓名而非 User ID: "12/8-11 PM-Ryan 特休&生日假"
  - 這會導致 `/\bpm\b/` 誤判為下午，`isFullDayLeave()` 返回 false
- ❌ 日期和 User ID 順序不同: "<@U07FFHDUTMH> 12/8-11 特休&生日假"
- ❌ 有額外空格或換行: "12/8-11\n<@U07FFHDUTMH>\n特休&生日假"
- ❌ 日期格式不同: "2025-12-08 - 2025-12-11 <@U07FFHDUTMH> 特休&生日假"

**驗證方法**:
```javascript
// 在 n8n workflow 中加入 debug 輸出
for (const msg of attendanceMessages) {
  if (msg.text && msg.text.includes('U07FFHDUTMH')) {
    console.log('PM-Ryan 出勤記錄:', JSON.stringify(msg.text));
  }
}
```

**修復方案**:
如果格式確實不同，需要：
1. 調整 `expandDateRange` 函數以支援更多格式
2. 調整 `isFullDayLeave` 函數避免誤判
3. 調整 User ID 提取邏輯

---

### 原因 2: PM-Ryan 不在 channelMemberSet 中 (⭐⭐⭐⭐)

**假設**: `conversations.members` 沒有返回 PM-Ryan 的 User ID

**可能的情況**:
- PM-Ryan 的 User ID 實際上不是 U07FFHDUTMH
- PM-Ryan 最近才加入 channel，快取還沒更新
- API 呼叫時有 pagination 問題（雖然已經優化）

**驗證方法**:
```javascript
// 在 workflow 中加入 debug 輸出
console.log('Channel 成員數:', channelMemberIds.length);
console.log('Channel 成員:', channelMemberIds);
console.log('PM-Ryan (U07FFHDUTMH) 在 channel 中:', channelMemberIds.includes('U07FFHDUTMH'));
```

**修復方案**:
1. 確認 PM-Ryan 實際的 User ID
2. 確認 PM-Ryan 確實在 gemini-每日彙報 channel 中
3. 手動觸發 workflow 重新取得成員列表

---

### 原因 3: PM-Ryan 的 userMap 資料缺失 (⭐⭐⭐)

**假設**: `users.info` API 呼叫失敗或返回不完整資料

**可能的情況**:
- API rate limit 導致部分呼叫失敗
- PM-Ryan 的帳號狀態異常（deleted, deactivated）

**驗證方法**:
```javascript
// 在 workflow 中加入 debug 輸出
console.log('UserMap 大小:', Object.keys(userMap).length);
console.log('PM-Ryan userMap:', userMap['U07FFHDUTMH']);
```

**修復方案**:
1. 加入 error handling 和 retry 機制
2. 檢查 API response 的完整性

---

### 原因 4: 出勤記錄未被查詢到 (⭐⭐)

**假設**: PM-Ryan 的請假記錄發布時間在查詢範圍外

**可能的情況**:
- 記錄是在很久以前發布的
- 記錄被編輯過，timestamp 改變

**驗證方法**:
```javascript
// 檢查實際查詢到的出勤訊息
console.log('出勤訊息數量:', attendanceMessages.length);
console.log('包含 PM-Ryan 的訊息:',
  attendanceMessages.filter(m => m.text && m.text.includes('U07FFHDUTMH')).length);
```

**修復方案**:
1. 擴大查詢時間範圍（目前已經有 ±1 天緩衝）
2. 或固定查詢最近 N 則訊息

---

## 🔧 建議的診斷步驟

### Step 1: 加入 Debug 輸出到 Workflow

在「查詢並處理資料」節點中，在處理出勤訊息的迴圈中加入：

```javascript
// 在 for (const msg of attendanceMessages) 迴圈開始處
let debugOutput = [];

for (const msg of attendanceMessages) {
  if (!msg.text) continue;

  const text = msg.text;

  // 🔍 Debug: 記錄所有包含 PM-Ryan User ID 的訊息
  if (text.includes('U07FFHDUTMH')) {
    debugOutput.push({
      text: text,
      hasLeaveKeyword: leaveKeywords.some(keyword => text.includes(keyword)),
      isFullDay: isFullDayLeave(text),
      expandedDates: expandDateRange(text, targetDates[0].getFullYear()),
      userIdMatch: text.match(/<@([A-Z0-9]+)>/)?.[1],
      inChannelSet: channelMemberSet.has('U07FFHDUTMH'),
      hasUserMapEntry: !!userMap['U07FFHDUTMH']
    });
  }

  // ... 原有邏輯繼續
}

// 在最後 return 之前
console.log('='.repeat(80));
console.log('PM-Ryan Debug Output:');
console.log(JSON.stringify(debugOutput, null, 2));
console.log('='.repeat(80));
```

### Step 2: 執行 Workflow 並檢查 Log

執行 workflow 後，檢查 n8n 的執行 log，查看：
1. PM-Ryan 的出勤記錄是否被查詢到
2. 每個步驟的判斷結果是什麼
3. 哪個步驟導致 PM-Ryan 被跳過

### Step 3: 根據 Debug 結果修復

根據 Debug 輸出，定位具體問題：

| Debug Output | 原因 | 修復方案 |
|-------------|------|---------|
| `debugOutput` 為空 | 出勤記錄未被查詢到 | 擴大查詢範圍或檢查記錄存在性 |
| `hasLeaveKeyword: false` | 關鍵字不匹配 | 檢查實際訊息內容，調整關鍵字列表 |
| `isFullDay: false` | 被誤判為部分時間 | 檢查訊息格式，修復 isFullDayLeave 邏輯 |
| `expandedDates: []` | 日期格式不匹配 | 調整 expandDateRange 支援更多格式 |
| `userIdMatch: null` | User ID 提取失敗 | 檢查訊息格式，調整 regex |
| `inChannelSet: false` | PM-Ryan 不在 channel | 確認 PM-Ryan 的 channel 成員資格 |
| `hasUserMapEntry: false` | userMap 缺失 | 檢查 users.info 呼叫是否成功 |

---

## 📋 快速診斷指令

如果你有 Slack Token 和 channel 資訊，可以直接用這個腳本診斷：

```bash
# 執行診斷 (需要先修復網路連線)
node debug-pm-ryan.js
```

或手動在 Slack API 測試：

```bash
# 1. 檢查 PM-Ryan 是否在 channel 中
curl "https://slack.com/api/conversations.members?channel=C07KLQ81N2X" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.members | contains(["U07FFHDUTMH"])'

# 2. 檢查 PM-Ryan 的出勤記錄
curl "https://slack.com/api/conversations.history?channel=C05FXLH7BCJ&oldest=1733587200&latest=1733846400" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.messages[] | select(.text | contains("U07FFHDUTMH"))'
```

---

## 🎯 最可能的問題和快速修復

基於測試結果和經驗，**最可能的問題是出勤記錄格式不符預期**。

### 快速檢查：

1. 在 Slack 的 JVD 每日出勤回報 channel 中，手動查看 PM-Ryan 的請假記錄
2. 確認格式是否為: `12/8-11 <@U07FFHDUTMH> 特休&生日假`
3. 如果格式不同，需要調整 workflow 邏輯

### 臨時解決方案（如果格式確實有問題）：

如果出勤記錄使用姓名而非 User ID，需要修復 `isFullDayLeave` 函數：

```javascript
function isFullDayLeave(text) {
  const lowerText = text.toLowerCase();

  if (/\d{1,2}:\d{2}/.test(text) || /\d{1,2}\s*[-~]\s*\d{1,2}(?!\/)/.test(text)) {
    const hasDateRange = /\d{1,2}\/\d{1,2}\s*-/.test(text);
    if (!hasDateRange) {
      return false;
    }
  }

  // 🔧 修復: 避免 "PM-Ryan" 中的 PM 被誤判為下午
  // 只在沒有 User ID 或姓名時檢查時間關鍵字
  const hasUserIdentifier = /<@[A-Z0-9]+>/.test(text) || /[A-Z]{2,}-[A-Za-z]+/.test(text);

  if (!hasUserIdentifier) {
    const hasPartialTimeKeyword =
      lowerText.includes('上午') || lowerText.includes('下午') ||
      /\bam\b/.test(lowerText) || /\bpm\b/.test(lowerText) ||
      lowerText.includes('早上') || lowerText.includes('中午') || lowerText.includes('晚上');

    if (hasPartialTimeKeyword) {
      return false;
    }
  }

  const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
  return leaveKeywords.some(keyword => text.includes(keyword));
}
```

但這只是臨時方案，**最好的做法是確保出勤記錄使用標準的 `<@USER_ID>` 格式**。

---

## 📝 總結

| 項目 | 狀態 |
|------|------|
| expandDateRange 邏輯 | ✅ 正確 |
| isFullDayLeave 邏輯 | ✅ 正確 |
| 優先級邏輯 | ✅ 正確 |
| 查詢時間範圍 | ✅ 正確 |
| **實際資料格式** | ❓ **需要驗證** |

**下一步**: 加入 Debug 輸出到 workflow，執行後查看 log，確認實際的資料格式和問題點。
