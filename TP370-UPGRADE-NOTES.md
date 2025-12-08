# TP370 Daily Report Checker - 升級說明

## 📋 升級日期
2025-12-08

## 🎯 升級目的
將每日彙報檢查邏輯從「只檢查前一個工作日」改為「週一檢查多天累積日報」，避免遺漏週末期間的日報檢查。

## 📊 修改前後對比

### ❌ 修改前的行為
```
週一 10:10 執行 → 只檢查上週五 (2025-12-05)
週二 10:10 執行 → 只檢查週一 (2025-12-08)
週三 10:10 執行 → 只檢查週二 (2025-12-09)
週四 10:10 執行 → 只檢查週三 (2025-12-10)
週五 10:10 執行 → 只檢查週四 (2025-12-11)
```

**問題**：週一只檢查上週五，導致週六、週日、週一的日報未被檢查。

### ✅ 修改後的行為
```
週一 10:10 執行 → 檢查 4 天 (上週五 + 週六 + 週日 + 週一)
                  2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08

週二 10:10 執行 → 只檢查前一天 (週一)
                  2025-12-08

週三 10:10 執行 → 只檢查前一天 (週二)
                  2025-12-09

週四 10:10 執行 → 只檢查前一天 (週三)
                  2025-12-10

週五 10:10 執行 → 只檢查前一天 (週四)
                  2025-12-11
```

**優點**：週一會檢查過去 4 天的累積日報，確保沒有遺漏。

## 🔧 技術修改細節

### 1. 日期計算邏輯 (`查詢並處理資料` 節點)

#### 修改前：
```javascript
if (dayOfWeek === 1) {
  // Monday: check Friday (3 days ago)
  targetDate.setDate(taipeiTime.getDate() - 3);
}
```

#### 修改後：
```javascript
const targetDates = [];

if (dayOfWeek === 1) {
  // 週一：檢查上週五、週六、週日、週一（4天）
  for (let i = 3; i >= 0; i--) {
    const date = new Date(taipeiTime);
    date.setDate(taipeiTime.getDate() - i);
    targetDates.push(date);
  }
} else if (dayOfWeek >= 2 && dayOfWeek <= 5) {
  // 週二到週五：只檢查前一天
  const date = new Date(taipeiTime);
  date.setDate(taipeiTime.getDate() - 1);
  targetDates.push(date);
}
```

### 2. 訊息檢查邏輯

#### 修改前：
```javascript
// 檢查訊息是否包含單一目標日期
if (text.includes(targetDateForTitle)) {
  // 記錄提交
}
```

#### 修改後：
```javascript
// 檢查訊息是否包含任一目標日期
for (let i = 0; i < targetDateTitles.length; i++) {
  const dateTitle = targetDateTitles[i];
  const dateStr = targetDateStrs[i];

  if (text.includes(dateTitle)) {
    // 記錄提交（包含日期和時間）
    if (!submittedMap.has(msg.user)) {
      submittedMap.set(msg.user, {
        name: userMap[msg.user]?.name || 'Unknown',
        submissions: []
      });
    }

    const userSubmissions = submittedMap.get(msg.user);
    // 避免重複記錄同一個日期
    if (!userSubmissions.submissions.some(s => s.date === dateStr)) {
      userSubmissions.submissions.push({ date: dateStr, time: timeStr });
    }
  }
}
```

### 3. 報告格式（智能切換）

程式會根據**檢查日期數量**和**提交次數**自動選擇顯示格式：

#### 情境 A：週二到週五（檢查 1 天）
```
📊 每日彙報檢查報告
📅 檢查日期: 2025-12-09

👥 需追蹤人數: 3
✅ 已提交: 3 人
❌ 未提交: 0 人

已提交名單:
• Alice (submitted at 2025-12-09 09:00:00)
• Bob (submitted at 2025-12-09 09:30:00)
• Charlie (submitted at 2025-12-09 10:00:00)
```

#### 情境 B：週一（檢查 4 天）- 不同提交情況

```
📊 每日彙報檢查報告
📅 檢查日期: 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08

👥 需追蹤人數: 4
✅ 已提交: 4 人
❌ 未提交: 0 人

已提交名單:
• OP-Alice (submitted at 2025-12-05 09:30:00, 2025-12-06 10:15:00, 2025-12-07 08:45:00, 2025-12-08 09:00:00)
• OP-Shou (submitted at 2025-12-05 21:33:05)
• OP-James (submitted at 2025-12-05 22:41:26)
• OP-Bob (submitted at 2025-12-05 10:00:00, 2025-12-08 09:30:00)
```

**格式邏輯說明**：

| 提交次數 | 顯示格式 | 範例 |
|---------|---------|------|
| 1 次 | `(submitted at YYYY-MM-DD HH:MM:SS)` | `Shou (submitted at 2025-12-05 21:33:05)` |
| 多次 | `(submitted at TIME1, TIME2, ...)` | `Bob (submitted at 2025-12-05 10:00:00, 2025-12-08 09:30:00)` |

**改進**：
- ✅ **極簡邏輯**：只看提交次數，不管檢查幾天
- ✅ 提交 1 次：顯示該次的完整時間
- ✅ 提交多次：顯示所有時間（逗號分隔）
- ✅ 所有情況都使用單行格式

## 📂 檔案清單

### 主要檔案
- **TP370-daily-report-checker-updated.json** - 更新後的 n8n 工作流程配置（使用此檔案）
- ~~原始 JSON（用戶提供）~~ - 舊版本，已被新版本取代

### 測試檔案
- **test-date-logic.js** - 日期計算邏輯測試
  - 測試週一到週五各種情境
  - 驗證日期計算是否正確

- **test-real-scenario.js** - 真實場景模擬測試
  - 模擬用戶提交日報的場景
  - 驗證統計邏輯是否正確
  - 測試排除名單和 Bot 過濾

### 說明文件
- **TP370-UPGRADE-NOTES.md** - 本文件

## 🚀 部署步驟

### 1. 備份現有工作流程
在 n8n UI 中：
1. 開啟現有的「Gemini 每日彙報檢查自動化」工作流程
2. 點選右上角的「⋮」選單
3. 選擇「Export workflow」
4. 儲存為 `TP370-daily-report-checker-backup-YYYYMMDD.json`

### 2. 匯入新版本工作流程
在 n8n UI 中：
1. 點選左側選單的「Workflows」
2. 點選「Import from File」
3. 選擇 `TP370-daily-report-checker-updated.json`
4. 點選「Import」

### 3. 驗證配置
確認以下設定正確：
- ✅ Slack Token 是否正確
- ✅ Source Channel ID 是否正確 (`C07KLQ81N2X`)
- ✅ Notify Channel ID 是否正確 (`C07KXENMBB7`)
- ✅ Exclude Names 列表是否正確 (`["PM-Robin", "HR-Momo", "HEAD of IT-Jack", "lalahsu"]`)
- ✅ Cron 表達式是否正確 (`10 10 * * 1-5` = 週一到週五 10:10)

### 4. 測試執行
1. 點選「Execute Workflow」手動測試
2. 檢查輸出結果是否正確
3. 確認 Slack 通知是否正常發送

### 5. 啟用工作流程
1. 確認測試無誤後，點選右上角的「Active」開關
2. 工作流程將在下個週一到週五 10:10 自動執行

## 📝 測試驗證

### 運行測試腳本
```bash
cd /Users/lonelyhsu/gemini/claude-project/n8n-workflow

# 測試日期計算邏輯
node test-date-logic.js

# 測試真實場景
node test-real-scenario.js
```

### 預期結果
兩個測試腳本都應該輸出正確的結果，沒有錯誤。

## ⚠️ 注意事項

1. **時區問題**
   - 程式碼使用 `Asia/Taipei` 時區 (UTC+8)
   - 確保 n8n 伺服器時間設定正確

2. **日報格式要求**
   - 同仁的日報訊息必須包含日期格式 `YYYYMMDD`
   - 例如：`20251208 Daily Report: ...`

3. **週末執行**
   - Cron 設定為週一到週五執行
   - 如果意外在週末執行，程式會返回錯誤訊息

4. **Slack API 限制**
   - 程式使用分頁查詢，支援大量用戶和訊息
   - 每次查詢限制 200 筆，會自動分頁

## 🔍 常見問題

### Q1: 為什麼週一要檢查 4 天？
**A**: 因為同仁可能在週末（週六、週日）也有提交日報，加上週一當天和上週五，總共 4 天。

### Q2: 如果同仁在 10:10 之後才提交週一的日報怎麼辦？
**A**: 週一 10:10 執行時會檢查週一當天的日報，但如果同仁在 10:10 之後才提交，當天會被標記為「未提交」。建議同仁在 10:10 前提交。

### Q3: 可以改成週一只檢查 3 天（上週五+週六+週日）嗎？
**A**: 可以，修改程式碼中的迴圈範圍：
```javascript
// 從這裡
for (let i = 3; i >= 0; i--) {  // 檢查 4 天

// 改成這裡
for (let i = 3; i >= 1; i--) {  // 檢查 3 天（不包含週一）
```

### Q4: 可以改成每天都檢查過去 7 天嗎？
**A**: 可以，但不建議。這會導致報告過於冗長，且已提交的人會被重複顯示。目前的設計（週一檢查 4 天，其他日子檢查 1 天）是較佳的平衡。

## 📧 聯絡資訊

如有問題，請聯絡：
- **開發者**: Claude Code
- **日期**: 2025-12-08
- **專案**: TP370 Daily Report Checker

## 📜 變更歷史

| 日期 | 版本 | 變更內容 |
|------|------|----------|
| 2025-12-08 | v3.1 | **最終版本**：極簡邏輯 - 只看提交次數（1次=顯示完整時間，多次=逗號分隔所有時間） |
| 2025-12-08 | v3.0 | ~~智能格式切換 - 檢查多天時顯示比例~~ (已廢棄) |
| 2025-12-08 | v2.2 | 簡潔格式改為顯示完整日期時間 `(submitted at YYYY-MM-DD HH:MM:SS)` |
| 2025-12-08 | v2.1 | 新增智能報告格式：週二~五使用簡潔格式 `(submitted at ...)`，週一使用詳細多行格式 |
| 2025-12-08 | v2.0 | 週一改為檢查 4 天（上週五+週六+週日+週一），週二~五維持檢查前一天 |
| 2024-12-XX | v1.0 | 初始版本，每天只檢查前一個工作日 |
