# 值班表腳本修復總結

## 問題描述

**原始問題**：10/27 當天顯示 Joe 在值班，但 Joe 的值班期間是 `10/28~31`，不應包含 10/27。

## 根本原因

腳本使用「**週範圍**」來判斷值班人員，而非「**當天**」：
- 當週範圍：10/27 (週一) ~ 11/02 (週日)
- Joe 的值班期間 10/28~31 與當週有重疊 → 被錯誤包含

## 修復方案

將判斷邏輯從「週範圍」改為「當天」：

### 修改前
```javascript
const weekStart = normaliseToDayStart(currentWeek.start);
const weekEnd = normaliseToDayEnd(currentWeek.end);

if (rangeStart.getTime() <= weekEnd.getTime() && rangeEnd.getTime() >= weekStart.getTime()) {
  return true; // 值班期間與本週有重疊
}
```

### 修改後
```javascript
const todayStart = normaliseToDayStart(todayForCalc);
const todayEnd = normaliseToDayEnd(todayForCalc);

if (rangeStart.getTime() <= todayEnd.getTime() && rangeEnd.getTime() >= todayStart.getTime()) {
  return true; // 值班期間包含今天
}
```

## 測試結果

### 10/27 當天值班人員（修復後）

| 部門 | 人員 | 值班日期 | 是否包含 10/27 |
|------|------|----------|----------------|
| **SEG Manager** | Dean | 10/1~12  20~31 | ✅ 是 |
| | Owen | 10/13~19 | ❌ 否 |
| **Backend** | Bread | 10/7~12  20~27 | ✅ 是 |
| | Joe | 10/28~31 | ❌ 否 |
| | Phoebe | 10/13~19 | ❌ 否 |
| | Owen | 10/1~6 | ❌ 否 |
| **DevOps** | Lonely | 10/1-10/5,10/13-10/19,10/27-10/31 | ✅ 是 |
| | Ollie | 10/6-10/12,10/20-10/26 | ❌ 否 |
| **QA** | Lisa | 10/13~10/19 | ❌ 否 |
| | Jason | 10/1~12, 10/20~31 | ✅ 是 |

### 預期輸出

```
:date: 第44週 ｜ 2025-10-27 → 2025-11-02
━━━━━━━━━━━━━━━━━━━━━━━━
:busts_in_silhouette: 今日(10/27 Mon)值班人員 ｜ 5 人
├─ 👔 SEG Manager ｜ Dean
├─ ⚜️ Backend ｜ Bread
├─ 🔧 DevOps ｜ Lonely
├─ 🔍 QA ｜ Jason
└─ 💎 OP ｜ Shou
━━━━━━━━━━━━━━━━━━━━━━━━
```

## 修改的文件

- `/Users/lonelyhsu/gemini/claude-project/n8n-workflow/duty-schedule-processor.js`

## 更新步驟

1. 複製 `duty-schedule-processor.js` 的完整內容
2. 在 N8N 中打開 workflow
3. 編輯 "dev" 節點
4. 將代碼貼到 JavaScript Code 欄位
5. 儲存並測試

## 修改行數

- 第 168 行：日誌訊息
- 第 173-174 行：使用 `todayStart/todayEnd` 替代 `weekStart/weekEnd`
- 第 177 行：初始月份使用今天的月份
- 第 244 行：判斷邏輯改為檢查今天
- 第 274 行：單日格式改為檢查今天

