# TP370 每日彙報檢查 - 請假整合更新指南

## 📋 更新概述

本次更新新增了與 JVD 每日出勤回報 channel 的整合功能,能夠自動識別請假人員並將其從未提交名單中移除,避免誤判。

### 🎯 更新目標

1. ✅ 自動從 JVD 出勤 channel 取得請假資訊
2. ✅ 智能解析兩種請假訊息格式
3. ✅ 將請假人員正確分類
4. ✅ 在報告中顯示請假名單

---

## 🔄 更新內容

### 1. **設定參數節點** - 新增出勤 Channel

**新增參數:**
```json
{
  "attendanceChannel": "C05FXLH7BCJ"  // JVD 每日出勤回報 channel
}
```

**完整配置:**
```json
{
  "slackToken": "YOUR_SLACK_TOKEN_HERE",
  "sourceChannel": "C07KLQ81N2X",         // 每日彙報 channel
  "notifyChannel": "C07KXENMBB7",          // 通知結果 channel
  "attendanceChannel": "C05FXLH7BCJ",      // JVD 出勤回報 channel (新增)
  "excludeNames": ["PM-Robin", "HR-Momo", "HEAD of IT-Jack", "lalahsu"]
}
```

---

### 2. **查詢並處理資料節點** - 新增請假檢查邏輯

#### 新增功能:

##### 📅 **日期格式處理**
除了原有的 `YYYY-MM-DD` 和 `YYYYMMDD` 格式,新增 `MM/DD` 短格式用於出勤訊息匹配。

```javascript
const targetDateShortStrs = []; // MM/DD 格式用於出勤檢查
```

##### 📨 **取得出勤頻道訊息**
```javascript
// 6. 取得出勤頻道的請假訊息
let attendanceMessages = [];
let attendanceCursor = '';

do {
  const attendanceParams = {
    channel: attendanceChannel,
    oldest: oldestTs.toString(),
    latest: latestTs.toString(),
    limit: '200'
  };
  if (attendanceCursor) attendanceParams.cursor = attendanceCursor;

  const attendanceResult = await callSlackApi('conversations.history', attendanceParams);

  if (!attendanceResult.ok) {
    return [{ json: { error: '無法取得出勤頻道歷史', detail: attendanceResult.error, slackToken, notifyChannel } }];
  }

  attendanceMessages = attendanceMessages.concat(attendanceResult.messages || []);
  attendanceCursor = attendanceResult.response_metadata?.next_cursor || '';
} while (attendanceCursor);
```

##### 🔍 **智能解析請假訊息**

支援兩種訊息格式:

**格式 1: 人工提交 - User ID 格式**
```
12/09 <@U07SQFQNC1H> 15:00 ~ 19:00 事假
12/9 <@U08C9QZUVSL> 10:00-11:00 病假
12/9 <@UK4SWG8DS> 上午病假
```

**格式 2: Bot 自動彙總 - 部門-姓名格式**
```
:date: *今日請假通知* (2025-12-09)
• Design-Jill: Su 特休
• PM-Jeff: 上午健檢
```

**支援的請假類型關鍵字:**
- 請假
- 病假
- 事假
- 年假
- 特休
- 休假
- 生日假
- 健檢

**解析邏輯:**
```javascript
// 7. 解析請假人員
const onLeaveMap = new Map(); // userId -> { name, leaves: [{date, type}] }
const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];

for (const msg of attendanceMessages) {
  if (!msg.text) continue;
  const text = msg.text;

  // 檢查是否包含請假關鍵字
  const hasLeaveKeyword = leaveKeywords.some(keyword => text.includes(keyword));
  if (!hasLeaveKeyword) continue;

  // 檢查訊息是否涉及目標日期
  for (let i = 0; i < targetDateStrs.length; i++) {
    const dateStr = targetDateStrs[i];
    const shortDateStr = targetDateShortStrs[i];

    // 格式1: MM/DD <@USER_ID> [詳情]
    const userIdMatch = text.match(/<@([A-Z0-9]+)>/);
    if (userIdMatch && text.includes(shortDateStr)) {
      // 處理 User ID 格式...
    }

    // 格式2: Bot 彙總格式
    if (text.includes(':date:') && text.includes(dateStr)) {
      // 處理部門-姓名格式...
    }
  }
}
```

##### 📊 **三類人員分類**

```javascript
// 8. 計算已提交、未提交和請假的人員
for (const member of trackableMembers) {
  const isOnLeave = onLeaveMap.has(member.id);
  const hasSubmitted = submittedMap.has(member.id);

  if (isOnLeave) {
    // 請假的人員
    onLeaveList.push({ name: member.name, leaves: info.leaves });
  } else if (hasSubmitted) {
    // 已提交的人員
    submittedList.push({ name: member.name, submissions: info.submissions });
  } else {
    // 未提交且未請假的人員
    notSubmittedList.push(member.name);
  }
}
```

**輸出資料結構:**
```javascript
{
  slackToken,
  notifyChannel,
  checkDates: targetDateStrs,
  trackableCount: trackableMembers.length,
  submittedCount: submittedList.length,
  notSubmittedCount: notSubmittedList.length,
  onLeaveCount: onLeaveList.length,           // 新增
  submittedList: submittedList,
  notSubmittedList: notSubmittedList.sort(),
  onLeaveList: onLeaveList                    // 新增
}
```

---

### 3. **發送通知節點** - 新增請假名單顯示

#### 更新的報告格式:

**統計摘要 - 新增請假人數**
```
📊 *每日彙報檢查報告*
📅 檢查日期: 2025-12-08

👥 需追蹤人數: 45
✅ 已提交: 35 人
🏖️ 請假: 8 人          ← 新增
❌ 未提交: 2 人
```

**請假名單顯示 - 新增區塊**
```
*請假名單:*
• Design-Jill (特休 on 2025-12-08)
• PM-Jeff (病假 on 2025-12-08)
• RD-Alan (病假 on 2025-12-08)
• Finance-Julia (病假 on 2025-12-08)
```

**多日請假顯示:**
```
*請假名單:*
• PM-Ryan (特休 on 2025-12-08, 生日假 on 2025-12-09)
```

**智能結尾訊息:**
```javascript
if (data.notSubmittedCount > 0) {
  message += `*未提交名單:*\n`;
  // 顯示未提交名單...
} else if (data.onLeaveCount === 0) {
  message += `🎉 太棒了！所有人都已提交每日彙報！`;
} else {
  message += `🎉 太棒了！除了請假人員，所有人都已提交每日彙報！`;  // 新增
}
```

---

## 📂 檔案結構

```
n8n-workflow/
├── TP370-daily-report-checker-updated.json    # 更新後的 workflow (主檔案)
├── test-attendance-channel.js                  # 出勤 channel 分析工具
├── updated-data-processing-logic.js            # 新的資料處理邏輯 (原始碼)
├── updated-notification-logic.js               # 新的通知邏輯 (原始碼)
├── update-workflow.js                          # Workflow 更新腳本
├── update-notification.js                      # 通知節點更新腳本
└── TP370-LEAVE-CHECK-UPDATE-GUIDE.md          # 本文檔
```

---

## 🚀 使用方式

### 1. **匯入更新後的 Workflow**

將 `TP370-daily-report-checker-updated.json` 匯入到 n8n:

```bash
# 方法 1: 透過 n8n UI 匯入
1. 開啟 n8n
2. 點擊 "Import workflow"
3. 選擇 TP370-daily-report-checker-updated.json

# 方法 2: 使用 n8n API 匯入
curl -X POST "http://your-n8n-instance/api/v1/workflows" \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d @TP370-daily-report-checker-updated.json
```

### 2. **更新設定參數**

在"設定參數"節點中,確保已設定正確的 Slack Token:

```json
{
  "slackToken": "YOUR_SLACK_TOKEN_HERE",
  "sourceChannel": "C07KLQ81N2X",
  "notifyChannel": "C07KXENMBB7",
  "attendanceChannel": "C05FXLH7BCJ",
  "excludeNames": ["PM-Robin", "HR-Momo", "HEAD of IT-Jack", "lalahsu"]
}
```

### 3. **測試 Workflow**

**手動測試:**
```bash
# 在 n8n UI 中點擊 "Execute Workflow" 按鈕
# 或設定測試排程:
0 10 * * 1-5  # 每週一到週五 10:00 執行
```

---

## 🔍 測試與驗證

### 測試工具使用

**分析出勤 channel 訊息:**
```bash
node test-attendance-channel.js
```

**輸出範例:**
```
查詢時間範圍: 2025-12-02T02:42:20.188Z ~ 2025-12-09T02:42:20.188Z
Timestamp 範圍: 1764643340 ~ 1765248140

🔍 正在查詢 JVD 每日出勤回報 channel...

📊 共取得 55 則訊息

找到 44 則包含請假關鍵字的訊息:

[1] 時間: 2025-12-09 02:10:51
    用戶: PM-Yihsiu
    內容: 12/09 <@U07SQFQNC1H> 15:00 ~ 19:00 事假

[2] 時間: 2025-12-09 01:43:34
    用戶: RD-Hannah
    內容: 11/9 <@U05F85X2S67> 上午病假
...
```

### 預期行為驗證

**場景 1: 人員已提交彙報**
- ✅ 出現在"已提交名單"
- ⭕ 不出現在"請假名單"
- ⭕ 不出現在"未提交名單"

**場景 2: 人員請假**
- ⭕ 不出現在"已提交名單"
- ✅ 出現在"請假名單"並顯示請假類型
- ⭕ 不出現在"未提交名單"

**場景 3: 人員未提交且未請假**
- ⭕ 不出現在"已提交名單"
- ⭕ 不出現在"請假名單"
- ✅ 出現在"未提交名單"

**場景 4: 人員請假但仍提交彙報**
- ✅ 出現在"請假名單"(優先分類為請假)
- ⭕ 不出現在"已提交名單"
- ⭕ 不出現在"未提交名單"

---

## 📊 報告範例

### 完整報告範例

```
📊 *每日彙報檢查報告*
📅 檢查日期: 2025-12-08

👥 需追蹤人數: 45
✅ 已提交: 35 人
🏖️ 請假: 8 人
❌ 未提交: 2 人

*已提交名單:*
• RD-John (submitted at 2025-12-08 09:15:23)
• PM-Alice (submitted at 2025-12-08 09:28:47)
• Design-Bob (submitted at 2025-12-08 10:02:11)
...

*請假名單:*
• Design-Jill (特休 on 2025-12-08)
• PM-Jeff (病假 on 2025-12-08)
• RD-Alan (病假 on 2025-12-08)
• Finance-Julia (病假 on 2025-12-08)
• QA-Emma (病假 on 2025-12-08)
• RD-Greg (特休 on 2025-12-08)
• Design-Vera (病假 on 2025-12-08)
• RD-Jean (特休 on 2025-12-08)

*未提交名單:*
• QA-Charlie
• RD-David
```

### 週一報告範例 (檢查 4 天)

```
📊 *每日彙報檢查報告*
📅 檢查日期: 2025-12-05, 2025-12-06, 2025-12-07, 2025-12-08

👥 需追蹤人數: 45
✅ 已提交: 40 人
🏖️ 請假: 3 人
❌ 未提交: 2 人

*已提交名單:*
• RD-John (submitted at 2025-12-05 09:15:23, 2025-12-06 09:18:45, 2025-12-07 09:22:11, 2025-12-08 09:15:23)
...

*請假名單:*
• PM-Ryan (特休 on 2025-12-08, 生日假 on 2025-12-09)
• Design-Jill (特休 on 2025-12-05)
• RD-Jeff (健檢 on 2025-12-08, 特休 on 2025-12-08)

*未提交名單:*
• QA-Charlie
• RD-David
```

---

## 🛠️ 技術細節

### 請假識別演算法

```javascript
// 步驟 1: 關鍵字過濾
const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
const hasLeaveKeyword = leaveKeywords.some(keyword => text.includes(keyword));

// 步驟 2: 日期匹配
// - 短格式: MM/DD (用於人工提交)
// - 長格式: YYYY-MM-DD (用於 Bot 彙總)

// 步驟 3: 用戶識別
// 方法 1: 提取 <@USER_ID>
const userIdMatch = text.match(/<@([A-Z0-9]+)>/);

// 方法 2: 姓名匹配 (從 Bot 彙總訊息)
const match = line.match(/•\s*([^:]+):\s*(.+)/);
const nameWithDept = match[1].trim();  // "Design-Jill"
const extractedName = nameParts[1];     // "Jill"

// 步驟 4: 請假類型識別
let leaveType = '請假';  // 預設
for (const keyword of leaveKeywords) {
  if (text.includes(keyword)) {
    leaveType = keyword;  // 使用第一個匹配的關鍵字
    break;
  }
}
```

### 資料流程圖

```
┌─────────────────┐
│   每日定時觸發   │
│  (週一到週五)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    設定參數      │
│ - sourceChannel │
│ - attendChannel │ ← 新增
│ - notifyChannel │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│      查詢並處理資料              │
│  1. 取得彙報 channel 成員        │
│  2. 取得用戶資訊                 │
│  3. 過濾可追蹤成員               │
│  4. 取得彙報訊息                 │
│  5. 統計已提交人員               │
│  6. 取得出勤訊息 ← 新增          │
│  7. 解析請假人員 ← 新增          │
│  8. 三類人員分類 ← 更新          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│        發送通知                  │
│  - 統計摘要 (含請假人數) ← 更新  │
│  - 已提交名單                    │
│  - 請假名單 ← 新增               │
│  - 未提交名單                    │
└─────────────────────────────────┘
```

---

## 🎯 效果對比

### 更新前

```
📊 *每日彙報檢查報告*
📅 檢查日期: 2025-12-08

👥 需追蹤人數: 45
✅ 已提交: 35 人
❌ 未提交: 10 人

*未提交名單:*
• Design-Jill      ← 實際上請假了
• PM-Jeff          ← 實際上請假了
• RD-Alan          ← 實際上請假了
• Finance-Julia    ← 實際上請假了
• QA-Emma          ← 實際上請假了
• RD-Greg          ← 實際上請假了
• Design-Vera      ← 實際上請假了
• RD-Jean          ← 實際上請假了
• QA-Charlie       ← 真的未提交
• RD-David         ← 真的未提交
```

❌ **問題**: 將請假人員誤判為未提交,造成混淆

### 更新後

```
📊 *每日彙報檢查報告*
📅 檢查日期: 2025-12-08

👥 需追蹤人數: 45
✅ 已提交: 35 人
🏖️ 請假: 8 人          ← 清楚標示
❌ 未提交: 2 人         ← 真正未提交的人

*請假名單:*            ← 新增區塊
• Design-Jill (特休 on 2025-12-08)
• PM-Jeff (病假 on 2025-12-08)
• RD-Alan (病假 on 2025-12-08)
• Finance-Julia (病假 on 2025-12-08)
• QA-Emma (病假 on 2025-12-08)
• RD-Greg (特休 on 2025-12-08)
• Design-Vera (病假 on 2025-12-08)
• RD-Jean (特休 on 2025-12-08)

*未提交名單:*
• QA-Charlie
• RD-David
```

✅ **改善**:
- 請假人員正確分類,不再誤判
- 清楚顯示請假類型和日期
- 未提交名單只顯示真正需要追蹤的人員

---

## 🔧 故障排除

### 常見問題

#### 1. **請假人員沒有被正確識別**

**可能原因:**
- 出勤訊息格式不符合預期
- 請假關鍵字不在預設列表中
- User ID 或姓名匹配失敗

**解決方案:**
```bash
# 使用測試工具分析出勤 channel
node test-attendance-channel.js

# 檢查輸出,確認:
# 1. 訊息格式是否符合預期
# 2. 請假關鍵字是否在列表中
# 3. User ID 或姓名是否正確
```

**如需新增請假關鍵字:**
```javascript
// 在 updated-data-processing-logic.js 中修改:
const leaveKeywords = [
  '請假', '病假', '事假', '年假', '特休',
  '休假', '生日假', '健檢',
  '產假', '陪產假'  // 新增關鍵字
];
```

#### 2. **Bot 彙總訊息解析失敗**

**症狀**: 只能識別人工提交的請假,無法識別 Bot 彙總的請假

**檢查點:**
```javascript
// 確認 Bot 訊息格式是否為:
:date: *今日請假通知* (YYYY-MM-DD)
• [部門-姓名]: [詳情]

// 例如:
:date: *今日請假通知* (2025-12-09)
• Design-Jill: Su 特休
```

**姓名匹配邏輯:**
```javascript
// 從 "Design-Jill" 提取 "Jill"
const nameParts = nameWithDept.split('-');
const extractedName = nameParts.length > 1 ? nameParts[1] : nameWithDept;

// 與 userMap 中的姓名匹配
if (userInfo.name === extractedName || userInfo.name.includes(extractedName))
```

#### 3. **週一報告不正確**

**檢查點:**
- 確認週一檢查的是 4 天 (週五、週六、週日、週一)
- 確認時間範圍設定正確

```javascript
if (dayOfWeek === 1) {
  // 週一：檢查上週五、週六、週日、週一(4天)
  for (let i = 3; i >= 0; i--) {
    const date = new Date(taipeiTime);
    date.setDate(taipeiTime.getDate() - i);
    targetDates.push(date);
  }
}
```

#### 4. **Channel ID 設定錯誤**

**驗證 Channel ID:**
```bash
# 方法 1: 從 Slack URL 取得
https://app.slack.com/client/T088LGT7K/C05FXLH7BCJ
                                     ^^^^^^^^^^^^
                                     Channel ID

# 方法 2: 使用 Slack API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://slack.com/api/conversations.list"
```

---

## 📈 效能考量

### API 呼叫統計

**每次執行的 API 呼叫:**
- `conversations.members`: 1+ calls (支援分頁)
- `users.list`: 1+ calls (支援分頁)
- `conversations.history` (彙報 channel): 1+ calls (支援分頁)
- `conversations.history` (出勤 channel): 1+ calls (支援分頁,新增)
- `chat.postMessage`: 1 call

**預估執行時間:**
- 小型團隊 (< 50 人): ~5-10 秒
- 中型團隊 (50-200 人): ~10-20 秒
- 大型團隊 (> 200 人): ~20-30 秒

### Slack API Rate Limits

**Tier 3 方法 (conversations.history):**
- Rate limit: 50+ requests per minute
- 本 workflow 使用: 2 個 channel × (1 + 分頁次數) ≈ 2-6 requests

**Tier 2 方法 (users.list):**
- Rate limit: 20 requests per minute
- 本 workflow 使用: 1 + 分頁次數 ≈ 1-3 requests

✅ **結論**: 完全在 rate limit 範圍內,無需擔心

---

## 🎓 最佳實踐

### 1. **定期審查請假關鍵字列表**

每季審查一次,確保涵蓋所有請假類型:
```javascript
const leaveKeywords = [
  '請假', '病假', '事假', '年假', '特休',
  '休假', '生日假', '健檢',
  // 根據公司政策新增其他假別
];
```

### 2. **測試新的訊息格式**

當出勤回報格式改變時:
```bash
# 1. 使用測試工具查看新格式
node test-attendance-channel.js

# 2. 更新解析邏輯
# 3. 在測試環境驗證
# 4. 部署到生產環境
```

### 3. **監控 Workflow 執行狀態**

設定 n8n webhook 或 email 通知,在 workflow 失敗時發送警告。

### 4. **備份 Workflow 設定**

```bash
# 定期匯出 workflow JSON
cp TP370-daily-report-checker-updated.json \
   backups/TP370-daily-report-$(date +%Y%m%d).json
```

---

## 📝 版本歷史

### v2.0.0 (2025-12-09) - 請假整合更新
- ✅ 新增 JVD 出勤 channel 整合
- ✅ 新增請假人員自動識別
- ✅ 新增請假名單顯示
- ✅ 支援兩種請假訊息格式解析
- ✅ 改善報告分類邏輯

### v1.0.0 (原始版本)
- ✅ 基本彙報檢查功能
- ✅ 已提交/未提交分類
- ✅ 週一多日檢查支援
- ✅ Slack 通知整合

---

## 🤝 支援與回饋

如有任何問題或建議,請透過以下方式聯繫:

- **測試工具**: `node test-attendance-channel.js`
- **文檔**: 本指南及相關 MD 檔案
- **程式碼**: 查看 `updated-data-processing-logic.js` 和 `updated-notification-logic.js`

---

## 📚 相關文件

- `TP370-UPGRADE-NOTES.md` - 原始升級記錄
- `TP370-WORKFLOW-UPDATE-GUIDE.md` - Workflow 更新指南
- `CREDENTIALS_SETUP_GUIDE.md` - 憑證設定指南
- `EXECUTE_WORKFLOW.md` - 執行指南

---

**更新日期**: 2025-12-09
**作者**: Claude Code Assistant
**版本**: 2.0.0
