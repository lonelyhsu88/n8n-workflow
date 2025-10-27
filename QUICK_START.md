# 🚀 快速開始指南

## 📥 匯入 Workflow

### 步驟 1: 準備 Google Sheets
在「2025排行榜」表單中加入以下新欄位（在現有欄位後面）：

```
| totalHours | sickLeaveHours | annualLeaveHours | remoteHours | birthdayLeaveHours | ... |
```

**完整欄位清單：**
- `totalHours` (總時數)
- `sickLeaveHours` (病假時數)
- `annualLeaveHours` (特休時數)
- `businessTripHours` (出差時數)
- `remoteHours` (遠端時數)
- `personalLeaveHours` (事假時數)
- `marriageLeaveHours` (婚假時數)
- `bereavementLeaveHours` (喪假時數)
- `maternityLeaveHours` (產假時數)
- `menstrualLeaveHours` (生理假時數)
- `compensatoryLeaveHours` (補休時數)
- `officialLeaveHours` (公假時數)
- `birthdayLeaveHours` (生日假時數)
- `othersHours` (其他時數)

### 步驟 2: 備份現有 Workflow
在 n8n 中匯出現有的 workflow 作為備份。

### 步驟 3: 匯入新版本
1. 登入 n8n
2. 點擊右上角 "..." → "Import from File"
3. 選擇 `attendance-statistics-analysis-clean.json`
4. 點擊 "Import"

### 步驟 4: 驗證設定
- ✅ Slack 認證正確
- ✅ Google Sheets 認證正確
- ✅ 頻道 ID: `C05FXLH7BCJ` (jvd每日出勤回報)
- ✅ 文件 ID: `176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw`

### 步驟 5: 測試執行
1. 點擊 "Execute Workflow"
2. 檢查輸出：
   - 「今日請假資料」節點
   - 「2025年排行榜」節點
3. 確認 Google Sheets 更新成功

### 步驟 6: 啟用
將 workflow 設為 "Active"，每小時自動執行。

---

## 🎯 新功能使用方式

### 1. 時數計算

**在 Slack 中發訊息時，使用以下格式：**

```
✅ 全天請假
10/28 @Someone 特休
→ 計算: 8 小時 (1 天)

✅ 從某時到下班
14- @Someone 特休
→ 計算: 4 小時 (0.5 天) [14:00-18:00]

✅ 明確時間範圍
14:00-18:00 @Someone 特休
→ 計算: 4 小時 (0.5 天)

✅ 上午/下午
上午請假
→ 計算: 3 小時 (0.375 天)

下午請假
→ 計算: 4 小時 (0.5 天)

✅ 半天
半天特休
→ 計算: 4 小時 (0.5 天)

✅ 複合請假
10/28 @Someone 上午健檢，下午特休
→ 計算: 7 小時 (0.875 天)
```

### 2. 變更檢測

**自動運作，無需設定：**

- ✅ 有人請假/銷假 → 發送通知
- ✅ 假別改變 → 發送通知
- ❌ 完全相同 → 不發送通知

---

## 📊 Google Sheets 查看

### 2025排行榜表單
開啟試算表後，你會看到：

| 排名 | 姓名 | 總天數 | **總時數** | 病假 | **病假時數** | 特休 | **特休時數** | ... |
|------|------|--------|-----------|------|-------------|------|-------------|-----|
| 1 | XX | 8.5 | **68** | 1 | **8** | 5.5 | **44** | ... |

**新增的時數欄位（粗體）方便你：**
- 精確追蹤每位同仁的實際請假時數
- 計算平均每天請假時數
- 分析哪種假別使用最多時數

---

## 🔍 驗證功能

### 測試時數計算

1. 在 Slack `#jvd每日出勤回報` 發送測試訊息：
   ```
   14:00-17:00 @你的名字 測試
   ```

2. 等待 workflow 執行（最多 1 小時）

3. 檢查 Google Sheets「2025排行榜」：
   - 你的名字應該出現
   - `totalHours` 欄位應顯示 3
   - `totalDays` 欄位應顯示 0.375

### 測試變更檢測

1. 第一次執行後，查看 Slack 通知

2. 不要改變任何人的請假狀況

3. 等待下一次執行（1 小時後）

4. 確認**沒有**收到新的 Slack 通知

5. 在 Slack 新增一筆請假：
   ```
   10/28 @另一個人 病假
   ```

6. 等待下一次執行

7. 確認**有**收到新的 Slack 通知

---

## ⚠️ 常見問題

### Q: Google Sheets 寫入失敗？
**A:** 確認你已在表單中加入所有時數欄位（步驟 1）

### Q: Slack 仍然每小時都發送？
**A:** 檢查 If 節點的條件設定是否正確

### Q: 時數計算錯誤？
**A:** 確認 Slack 訊息格式符合支援的模式

### Q: 看不到時數欄位？
**A:** 在 Google Sheets 中手動加入欄位名稱

---

## 📚 進階設定

### 修改下班時間
如果你的下班時間不是 18:00，修改「2025年排行榜」節點中的 `calculateLeaveHours` 函數：

```javascript
const endHour = 17; // 改為你的下班時間
```

### 修改上午/下午時數
```javascript
if (text.includes('上午')) {
  return { hours: 4, ... }; // 改為你的上午時數
}

if (text.includes('下午')) {
  return { hours: 5, ... }; // 改為你的下午時數
}
```

---

## 📞 需要幫助？

查看完整文件：
- `FEATURE_UPDATE_2025-10-28.md` - 功能詳情
- `BUGFIX_SUMMARY.md` - Bug 修正說明
- `README-attendance-fix.md` - 原始使用說明

---

**準備好了嗎？** 立即開始使用新功能！ 🚀

1. ✅ 在 Google Sheets 加入時數欄位
2. ✅ 匯入 workflow
3. ✅ 測試執行
4. ✅ 啟用
5. 🎉 完成！
