# Tableau Gemini Daily Report 半自動化工具

## 📋 專案資訊

- **主腳本**: `analyze_report.py`
- **包裝腳本**: `analyze_report.sh`
- **自動化類型**: 半自動化（下載 + 通知，手動分析）
- **最後更新**: 2025-12-11
- **狀態**: ✅ Active

## 🎯 功能說明

自動從 Tableau 下載 Gemini Daily Report 圖片，並發送通知到 Slack #ops-test 頻道，提醒進行手動分析。

### 工作流程

```
┌─────────────────────────────────────────────────────┐
│ 1. Cron Job 觸發 (每天 09:00)                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 2. 自動下載報表圖片                                   │
│    - 登入 Tableau API                                │
│    - 下載報表圖片                                     │
│    - 儲存到本地目錄                                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 3. 自動發送 Slack 通知                               │
│    - 發送到 #ops-test                                │
│    - @提及負責人                                      │
│    - 附上圖片路徑                                     │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 4. 手動分析（在 Claude Code 中）                     │
│    - 讀取圖片                                         │
│    - AI 分析內容                                     │
│    - 發送分析結果到 Slack                             │
└─────────────────────────────────────────────────────┘
```

## 🚀 快速開始

### 1. 環境設置

```bash
# 1. 確保虛擬環境已設置
cd /Users/lonelyhsu/gemini/claude-project/n8n-workflow
source .venv/bin/activate

# 2. 驗證依賴已安裝
pip list | grep -E "requests|python-dotenv"

# 3. 確認 .env 檔案存在並包含必要憑證
cat .env | grep -E "TABLEAU_PAT_NAME|SLACK_USER_TOKEN"
```

### 2. 手動測試

```bash
# 執行腳本測試
./analyze_report.sh
```

預期輸出：
```
============================================================
🚀 Gemini Daily Report 圖片下載
============================================================
📅 執行時間: 2025-12-11 09:00:00

🔐 登入 Tableau...
   ✅ 登入成功
📥 下載報表圖片...
   ✅ 下載成功 (323016 bytes)

💾 圖片已儲存: .../gemini_report_20251211.png

📤 發送通知到 Slack #ops-test...
   ✅ Slack 通知已發送

============================================================
✅ 圖片下載完成！
============================================================

💡 已發送通知到 Slack #ops-test
   等待手動分析...

============================================================
```

### 3. 設置 Cron Job

```bash
# 執行設置腳本
./setup-cronjob.sh
```

這會設置每天早上 9:00 自動執行。

## 📊 Slack 通知格式

當腳本成功執行後，會在 #ops-test 頻道發送以下通知：

```
📊 *Gemini Daily Report 已下載完成* (2025/12/11)

✅ 報表圖片已成功下載
📂 檔案路徑: `/Users/lonelyhsu/.../gemini_report_20251211.png`

🔔 請 @lonely 在 Claude Code 中執行分析：
```
請分析 /Users/.../gemini_report_20251211.png 並發送分析結果到 #ops-test
```

---
🤖 _自動化通知 by analyze_report.py_
```

## 🔧 技術架構

### 檔案結構

```
n8n-workflow/
├── analyze_report.py          # 主程式
├── analyze_report.sh           # 包裝腳本
├── setup-cronjob.sh            # Cron job 設置工具
├── .env                        # 環境變數（包含憑證）
├── .venv/                      # Python 虛擬環境
├── requirements.txt            # Python 依賴
├── gemini-hashbingo-report/    # 報表圖片儲存目錄
│   └── gemini_report_YYYYMMDD.png
└── cronjob.log                 # Cron 執行日誌
```

### 環境變數

`.env` 檔案需包含以下變數：

```bash
# Tableau API
TABLEAU_PAT_NAME=n8n-token-2026
TABLEAU_PAT_SECRET=WpXSyOKYR5+MW9blXYJQuw==:...

# Tableau API 設定（可選，已有預設值）
TABLEAU_API_URL=https://prod-apnortheast-a.online.tableau.com
TABLEAU_SITE_ID=1b4032aa-745d-491e-93a6-847c7d77e26e
TABLEAU_VIEW_ID=f76c724f-5625-4b84-aea5-59bc0a63b233

# Slack API
SLACK_USER_TOKEN=xoxp-271976915280-7519068116790-...
```

### Python 依賴

```
requests>=2.31.0
python-dotenv>=1.0.0
```

## 📝 手動分析流程

當收到 Slack 通知後，在 Claude Code 中執行：

```
請分析 /Users/lonelyhsu/gemini/claude-project/n8n-workflow/gemini-hashbingo-report/gemini_report_20251211.png 並發送分析結果到 #ops-test
```

Claude Code 會：
1. 讀取圖片
2. 分析報表內容（關鍵指標、趨勢、市場分布、商戶表現等）
3. 自動發送分析結果到 #ops-test

## 🔄 Cron Job 管理

### 查看當前 Cron Jobs

```bash
crontab -l | grep analyze_report
```

### 手動編輯 Cron Job

```bash
crontab -e
```

預設設定：
```
0 9 * * * cd /Users/lonelyhsu/gemini/claude-project/n8n-workflow && ./analyze_report.sh >> /Users/lonelyhsu/gemini/claude-project/n8n-workflow/cronjob.log 2>&1
```

### 查看執行日誌

```bash
# 查看最新日誌
tail -f /Users/lonelyhsu/gemini/claude-project/n8n-workflow/cronjob.log

# 查看今天的執行記錄
grep "$(date +%Y-%m-%d)" cronjob.log
```

### 移除 Cron Job

```bash
crontab -l | grep -v "analyze_report.sh" | crontab -
```

## 🐛 故障排除

### 問題 1: Tableau 登入失敗

**症狀**: `❌ 登入失敗: 401 Unauthorized`

**解決方案**:
1. 檢查 `.env` 中的 `TABLEAU_PAT_NAME` 和 `TABLEAU_PAT_SECRET`
2. 驗證 Tableau PAT 是否過期
3. 確認 `TABLEAU_SITE_ID` 正確

### 問題 2: Slack 通知失敗

**症狀**: `⚠️ Slack 通知失敗: invalid_auth`

**解決方案**:
1. 檢查 `.env` 中的 `SLACK_USER_TOKEN`
2. 驗證 token 權限是否包含 `chat:write`
3. 確認 channel ID `C07KQTH9F1T` 正確

### 問題 3: Cron Job 未執行

**症狀**: 到了時間但沒有執行

**解決方案**:
1. 檢查 crontab 設定：`crontab -l`
2. 確認腳本有執行權限：`chmod +x analyze_report.sh`
3. 查看系統日誌：`grep CRON /var/log/system.log`
4. 手動測試腳本：`./analyze_report.sh`

### 問題 4: 虛擬環境問題

**症狀**: `ModuleNotFoundError: No module named 'requests'`

**解決方案**:
```bash
# 重新建立虛擬環境
rm -rf .venv
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## 🔐 安全建議

1. **憑證管理**
   - ✅ `.env` 已在 `.gitignore` 中排除
   - ✅ 不要將憑證提交到 Git
   - ⚠️ 定期輪換 Tableau PAT 和 Slack token

2. **檔案權限**
   ```bash
   chmod 600 .env          # 只有擁有者可讀寫
   chmod 755 *.sh          # 腳本可執行
   ```

3. **日誌清理**
   ```bash
   # 定期清理舊日誌（保留最近 30 天）
   find . -name "cronjob.log" -mtime +30 -delete
   ```

## 📈 未來改進計劃

### 短期（當取得 API key 後）

- [ ] 整合 Claude API，實現完全自動化
- [ ] 自動分析報表內容
- [ ] 自動發送分析結果到 Slack

### 中期

- [ ] 支援多個報表來源
- [ ] 歷史數據追蹤和趨勢分析
- [ ] 異常值自動告警

### 長期

- [ ] 整合到 n8n workflow
- [ ] Dashboard 視覺化
- [ ] 自定義分析規則

## 📞 支援資訊

- **維護者**: DevOps Team
- **相關文件**: `/Users/lonelyhsu/gemini/claude-project/n8n-workflow/`
- **Slack Channel**: #ops-test (C07KQTH9F1T)
- **Tableau Server**: https://prod-apnortheast-a.online.tableau.com

## 📄 版本歷史

- **v1.1** (2025-12-11):
  - ✅ 實作半自動化流程
  - ✅ 自動下載 Tableau 報表圖片
  - ✅ 自動發送 Slack 通知
  - ✅ 整合虛擬環境和 .env 管理
  - ✅ 新增 Cron job 設置工具

- **v1.0** (2025-12-04):
  - ✅ 初始版本
  - ✅ 基本圖片下載功能
  - ⚠️ 需要手動執行所有步驟

## 📄 授權

Internal use only - FunTech Gaming
