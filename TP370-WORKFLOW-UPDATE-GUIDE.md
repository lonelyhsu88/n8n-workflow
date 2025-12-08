# 🔧 TP370 停車場監控 Workflow 更新指南

**Workflow ID**: `sYMdY6F2anBF7k0S`
**更新日期**: 2024-12-08
**版本**: V2 修復版本

---

## 🚨 **問題摘要**

目前 workflow 有 **3 個問題**：

1. ❌ **字串拼接語法錯誤**（第 87 行）：`limitText` 變數
2. ❌ **訊息格式錯誤**（第 90 行）：缺少 `$` 符號
3. ❌ **展期費率無法正確解析**：Regex 無法匹配逗號分隔的多個日期範圍

**影響**：
- 今天（12/8）在展期內，應該顯示 **$60/H 無上限**
- 實際卻顯示 **$50/H $300** 標準費率 ❌

---

## ✅ **修復後效果**

| 項目 | 修復前 | 修復後 |
|------|--------|--------|
| 今天費率 | ❌ $50/H | ✅ $60/H |
| 今天上限 | ❌ $300 | ✅ 無上限 |
| 費率類型 | ❌ 標準費率 | ✅ 展期費率 (12/4~12/8) |
| 第一個展期 | ❌ 未偵測 | ✅ 正確偵測 |
| 第二個展期 | ✅ 正確 | ✅ 正確 |

---

## 🔧 **更新步驟**

### 方法 1：複製完整程式碼（推薦）⭐

**步驟**：

1. **開啟本地檔案**
   ```bash
   cat /Users/lonelyhsu/gemini/claude-project/n8n-workflow/parking-tp370-FIXED-V2-parse-rate-code.js
   ```

2. **複製全部內容**（Cmd+A, Cmd+C）

3. **開啟 n8n Workflow**
   - 前往：https://n88.zeabur.app/workflow/sYMdY6F2anBF7k0S

4. **點擊「解析費率」節點**

5. **替換程式碼**
   - 刪除舊程式碼（Cmd+A, Delete）
   - 貼上新程式碼（Cmd+V）

6. **儲存**
   - 點擊「Save」

7. **測試**
   - 點擊「Execute Workflow」
   - 確認訊息顯示：**$60/H 無上限**

---

### 方法 2：手動修改（3 處）

如果你想了解修改細節，可以手動修改：

#### 🔧 修改 1：第 87 行

**找到**：
```javascript
const limitText = noLimit ? '無上限' : (' + currentLimit);
```

**改為**：
```javascript
const limitText = noLimit ? '無上限' : ('$' + currentLimit);
```

---

#### 🔧 修改 2：第 90 行

**找到**：
```javascript
'💰 當前收費:  + currentRate + '/H\n' +
```

**改為**：
```javascript
'💰 當前收費: $' + currentRate + '/H\n' +
```

---

#### 🔧 修改 3：展期解析邏輯（第 68-100 行左右）

**刪除舊的展期解析邏輯**：
```javascript
// 解析展期費率 - 支援多個展期
const exhibitionPattern = /(\d{1,2}\/\d{1,2})[~～-](\d{1,2}\/\d{1,2})展期費率[：:]\s*\$?(\d+)\/H[，,]?(當日當次最高上限\$?(\d+)|無最高上限)?/g;
let match;

while ((match = exhibitionPattern.exec(feeText)) !== null) {
  // ... 舊邏輯 ...
}
```

**替換為新邏輯**：
```javascript
// 🔧 V2 修復：支援多個逗號分隔的日期範圍
// 格式: (12/4~12/8,12/11~12/14展期費率:$60/H,無最高上限)
const exhibitionBlockMatch = feeText.match(/\(([^)]+展期費率[^)]+)\)/);

if (exhibitionBlockMatch) {
  const exhibitionBlock = exhibitionBlockMatch[1];
  console.log('展期區塊:', exhibitionBlock);

  // 提取費率資訊
  const rateMatch = exhibitionBlock.match(/展期費率[：:]\s*\$?(\d+)\/H/);
  const limitMatch = exhibitionBlock.match(/當日當次最高上限\$?(\d+)|無最高上限/);

  if (rateMatch) {
    const exhibitionRate = parseInt(rateMatch[1]);
    const hasNoLimit = exhibitionBlock.includes('無最高上限');
    const exhibitionLimit = limitMatch && limitMatch[1] ? parseInt(limitMatch[1]) : null;

    console.log('展期費率:', exhibitionRate + '/H');
    console.log('展期上限:', hasNoLimit ? '無上限' : exhibitionLimit);

    // 提取所有日期範圍（支援逗號分隔）
    // 匹配格式: 12/4~12/8 或 12/11~12/14
    const dateRangePattern = /(\d{1,2}\/\d{1,2})[~～-](\d{1,2}\/\d{1,2})/g;
    let dateMatch;
    let inExhibition = false;

    while ((dateMatch = dateRangePattern.exec(exhibitionBlock)) !== null) {
      const startDate = dateMatch[1];
      const endDate = dateMatch[2];

      console.log('找到展期:', startDate + '~' + endDate);

      // 檢查今天是否在此展期內
      if (isDateInRange(taipeiTime, startDate, endDate, year)) {
        currentRate = exhibitionRate;
        if (hasNoLimit) {
          noLimit = true;
          currentLimit = null;
        } else if (exhibitionLimit) {
          currentLimit = exhibitionLimit;
          noLimit = false;
        }
        rateType = '展期費率 (' + startDate + '~' + endDate + ')';
        console.log('✅ 今天在展期內，使用展期費率');
        inExhibition = true;
        break;
      }
    }

    if (!inExhibition) {
      console.log('今天不在任何展期內');
    }
  }
}
```

---

## 🧪 **驗證步驟**

更新後，請執行以下驗證：

### 1️⃣ **執行 Workflow**
- 點擊「Execute Workflow」

### 2️⃣ **檢查 Console 日誌**

應該看到：
```
費率原文: 臨停：$50/H，當日當次最高上限$300 (12/4~12/8,12/11~12/14展期費率:$60/H,無最高上限)
當前日期: 12/8/2024
展期區塊: 12/4~12/8,12/11~12/14展期費率:$60/H,無最高上限
展期費率: 60/H
展期上限: 無上限
找到展期: 12/4~12/8
✅ 今天在展期內，使用展期費率
最終費率: 60 上限: 無上限 類型: 展期費率 (12/4~12/8)
```

### 3️⃣ **檢查 Slack 訊息**

應該收到：
```
🏞️ 停車場: 南港軟體園區站
🕒 營業時間: 7:00~23:00
💰 當前收費: $60/H          ← 確認是 $60
📊 當日上限: 無上限           ← 確認是無上限
📋 費率類型: 展期費率 (12/4~12/8)  ← 確認是展期費率
🌐 查看詳情: https://www.dodohome.com.tw/p2_parkdetail.aspx?park_id=TP370
⏰ 檢查時間: 2024/12/08 06:00:00
```

### 4️⃣ **日期測試**

| 測試日期 | 預期結果 |
|---------|---------|
| 12/3 | 標準 $50/H, 上限 $300 |
| 12/4-12/8 | **展期 $60/H, 無上限** ⭐ |
| 12/9-12/10 | 標準 $50/H, 上限 $300 |
| 12/11-12/14 | **展期 $60/H, 無上限** ⭐ |
| 12/15+ | 標準 $50/H, 上限 $300 |

---

## 📊 **技術細節**

### V1 問題：Regex 無法匹配第一個展期

**原因**：
```
費率文字: (12/4~12/8,12/11~12/14展期費率:$60/H,無最高上限)
                    ↑
                    逗號分隔

舊 Regex 期望: 12/4~12/8展期費率
實際格式:      12/4~12/8,12/11~12/14展期費率
```

**結果**：
- ❌ 第一個展期 `12/4~12/8` 沒有被匹配
- ✅ 第二個展期 `12/11~12/14` 被匹配（因為後面緊接「展期費率」）

### V2 解決方案：分步驟解析

```javascript
// 步驟 1: 提取整個展期區塊
const exhibitionBlock = "12/4~12/8,12/11~12/14展期費率:$60/H,無最高上限"

// 步驟 2: 從區塊中提取費率和上限
const rate = $60/H
const limit = 無上限

// 步驟 3: 從區塊中提取所有日期範圍
const ranges = ["12/4~12/8", "12/11~12/14"]

// 步驟 4: 逐一檢查今天是否在範圍內
for each range:
  if 今天 in range:
    使用展期費率
    break
```

---

## 📝 **變更記錄**

| 版本 | 日期 | 變更內容 |
|------|------|---------|
| V1 | 2024-12-08 | 修正字串拼接和格式錯誤 |
| V2 | 2024-12-08 | 修正展期費率解析邏輯，支援多個日期範圍 |

---

## 🔗 **相關檔案**

| 檔案 | 說明 |
|------|------|
| `parking-tp370-FIXED-V2-parse-rate-code.js` | ✅ **V2 修復完整程式碼** |
| `test-parking-rate-parser-v2.js` | V2 測試腳本 |
| `parking-tp370-FIXED-parse-rate-code.js` | V1 修復程式碼（已過時） |
| `parking-tp370-BUG-FIX-REPORT.md` | V1 錯誤報告 |
| `TP370-WORKFLOW-UPDATE-GUIDE.md` | 本更新指南 |

---

## ⚠️ **重要提醒**

1. **備份**：更新前建議先備份現有 workflow
2. **測試**：更新後務必執行測試驗證
3. **時效性**：展期結束後（12/14 之後）會自動回到標準費率

---

## 🎯 **下一步**

更新完成後：

1. ✅ 啟用 Workflow（如果未啟用）
2. ✅ 確認定時觸發器正常（每天 06:00）
3. ✅ 監控 Slack 訊息是否正確

---

**更新指南製作**: Claude Code AI Agent
**最後更新**: 2024-12-08
**專案**: n8n Workflow 管理
