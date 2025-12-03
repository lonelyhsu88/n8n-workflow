# Gemini 每日日報檢查自動化

## 📋 專案資訊

- **Workflow ID**: `au8yJIIFJcKEqTOg`
- **版本**: v20
- **最後更新**: 2025-12-02T06:41:11.044Z
- **狀態**: ✅ Active
- **n8n 實例**: https://n8n.ftgaming.cc

## 🎯 功能說明

自動檢查 Slack `#gemini-每日彙報` 頻道的日報提交狀況，並在每個工作日早上 9 點發送報告。

### 主要功能

1. **自動排程執行**：每週一到週五早上 9:00 AM 自動執行
2. **成員管理**：自動取得頻道成員並過濾機器人和已刪除用戶
3. **提交狀態分析**：
   - 計算應提交人數（排除 IT 主管、HR 等特定人員）
   - 統計已提交和未提交人數
   - 計算提交率
   - 列出未提交人員名單
4. **自動通知**：將報告發送到 Slack 頻道

## 📊 報告格式

```
📊 *#gemini-每日彙報 日報提交狀況*
==================================================

📅 *日期*: 2025-12-01

👥 *應提交人數*: 30 人
✅ *已提交*: 24 人
❌ *未提交*: 6 人
📈 *提交率*: 80.0%

⚠️ *未提交日報人員名單* (6 人):
1. Design-Eve (@eve)
2. QA-Jason Hsieh (@jason.hsieh)
3. RD-Bread (@bread)
4. RD-David Kuo (@david.kuo)
5. RD-Henry Ye (@henry.ye)
6. Design-Sendai (@sendai)

ℹ️ (總成員 34 人，排除 4 人不需提交)
```

## 🔧 技術架構

### Workflow 節點說明

1. **每日排程觸發** (Schedule Trigger)
   - Cron 表達式: `0 9 * * 1-5`
   - 執行時間: 週一至週五 09:00

2. **取得頻道成員** (HTTP Request)
   - API: `conversations.members`
   - Channel ID: `C07KLQ81N2X`

3. **拆分成員ID** (Split Out)
   - 將成員陣列拆分為單獨項目

4. **批次取得使用者資訊** (HTTP Request)
   - API: `users.info`
   - 批次查詢每個成員的詳細資訊

5. **過濾真實成員** (Code)
   - 過濾掉機器人 (`is_bot`)
   - 過濾掉已刪除用戶 (`deleted`)

6. **彙整成員資訊** (Aggregate)
   - 將處理後的成員資訊彙整為陣列

7. **取得昨日訊息** (HTTP Request)
   - API: `conversations.history`
   - 時間範圍: 昨天 00:00 - 今天 00:00

8. **分析提交狀況** (Code)
   - 比對成員與訊息，判斷提交狀態
   - 生成報告文字
   - 計算統計數據

9. **發送報告到 Slack** (HTTP Request)
   - API: `chat.postMessage`
   - 使用 Markdown 格式

### 排除名單

以下人員不需要提交日報（在 "分析提交狀況" 節點中定義）：

- `HEAD of IT-Jack` - IT 主管
- `HR-LALA` - HR 部門
- `HR-Momo` - HR 部門
- `PM-Robin` - PM-Robin

### 修改排除名單

如需修改排除名單，請編輯 "分析提交狀況" 節點的 JavaScript 程式碼：

```javascript
const excludedMembers = new Set([
  'HEAD of IT-Jack',
  'HR-LALA',
  'HR-Momo',
  'PM-Robin'
  // 在此新增或移除人員
]);
```

## 🔐 認證設定

### Slack OAuth2 認證

- **Credential ID**: `uB8nqjfDBs738eff`
- **Credential Name**: `n8n-ops`
- **類型**: Slack OAuth2 API

需要以下 Slack API 權限：
- `channels:read` - 讀取頻道資訊
- `channels:history` - 讀取頻道訊息記錄
- `users:read` - 讀取使用者資訊
- `chat:write` - 發送訊息

## 📦 部署方式

### 方法 1: 使用 n8n UI 匯入

1. 登入 https://n8n.ftgaming.cc
2. 點選 "Workflows" → "Import from File"
3. 選擇 `gemini-daily-report-checker.json`
4. 檢查並設定 Slack OAuth2 認證
5. 啟動 workflow

### 方法 2: 使用 n8n API 部署

```bash
# 設定 n8n API key
export N8N_API_KEY="your-api-key"

# 使用 curl 匯入
curl -X POST https://n8n.ftgaming.cc/api/v1/workflows \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @gemini-daily-report-checker.json
```

### 方法 3: 使用 Claude Code n8n MCP Tools

```typescript
// 創建 workflow
const result = await mcp__n8n_ftgaming__n8n_create_workflow({
  // 從 JSON 檔案讀取並傳入
});
```

## 🔄 版本歷史

- **v20** (2025-12-02):
  - 改進報告格式，突顯「應提交人數」
  - 將「未提交日報人員」改為「未提交日報人員名單」
  - 移除未提交人員名單的 🔴 emoji
  - 簡化提交率顯示
  - 將總成員和排除人數移到資訊註腳

- **v17** (2025-12-02):
  - 修復 OAuth2 認證問題
  - 使用正確的 Slack OAuth2 credential

- **v13** (2025-12-02):
  - 初始版本部署

## 🐛 故障排除

### 問題 1: Workflow 執行失敗

**症狀**: Workflow 執行時出現 401 認證錯誤

**解決方案**:
1. 檢查 Slack OAuth2 credential 是否正確設定
2. 確認 OAuth token 未過期
3. 驗證 Bot 是否已加入 `#gemini-每日彙報` 頻道

### 問題 2: 報告中成員數據不正確

**症狀**: 顯示的成員數與實際不符

**解決方案**:
1. 檢查 Channel ID 是否正確 (`C07KLQ81N2X`)
2. 確認排除名單中的人員 real_name 與 Slack 實際名稱一致
3. 查看 "過濾真實成員" 節點是否正確過濾機器人

### 問題 3: 未在指定時間執行

**症狀**: Workflow 沒有在週一至週五 9:00 執行

**解決方案**:
1. 確認 Workflow 狀態為 Active
2. 檢查 Cron 表達式: `0 9 * * 1-5`
3. 確認 n8n 實例時區設定

## 📝 維護建議

### 定期檢查項目

- [ ] 每月檢查 Slack OAuth token 有效性
- [ ] 每季更新排除名單（人員異動）
- [ ] 每半年檢視報告格式是否需要調整
- [ ] 監控 workflow 執行成功率

### 效能優化

- 當前設計已針對 30-40 人的團隊規模優化
- 如團隊規模擴大到 100+ 人，考慮:
  - 使用 Slack Bulk API
  - 實作批次處理邏輯
  - 增加錯誤重試機制

## 📞 支援資訊

- **維護團隊**: DevOps Team
- **相關文件**: `/Users/lonelyhsu/gemini/claude-project/n8n-workflow/`
- **n8n 實例**: https://n8n.ftgaming.cc
- **Slack Channel**: #gemini-每日彙報 (C07KLQ81N2X)

## 📄 授權

Internal use only - FunTech Gaming
