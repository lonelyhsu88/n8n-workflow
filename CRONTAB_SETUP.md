# Cron Job 手動設置指南

由於 macOS 的安全限制，需要手動設置 crontab。

## 📝 步驟 1：給予 Terminal 完整磁碟訪問權限

1. 打開 **系統設定 (System Settings)**
2. 進入 **隱私權與安全性 (Privacy & Security)**
3. 點選 **完整磁碟取用權限 (Full Disk Access)**
4. 點擊 🔒 解鎖
5. 點擊 ➕ 新增你使用的終端機應用程式：
   - **Terminal.app** (`/System/Applications/Utilities/Terminal.app`)
   - 或 **iTerm.app** (如果你使用 iTerm)
6. 勾選啟用

## 📝 步驟 2：編輯 crontab

在終端機中執行：

```bash
crontab -e
```

這會打開編輯器（通常是 vim 或 nano）。

## 📝 步驟 3：新增以下內容

按 `i` 進入插入模式（如果是 vim），然後貼上：

```bash
# Gemini Daily Report 自動下載 (每天 09:00)
0 9 * * * cd /Users/lonelyhsu/gemini/claude-project/n8n-workflow && ./analyze_report.sh >> /Users/lonelyhsu/gemini/claude-project/n8n-workflow/cronjob.log 2>&1
```

## 📝 步驟 4：儲存並退出

- **vim**: 按 `ESC`，然後輸入 `:wq` 按 Enter
- **nano**: 按 `Ctrl + O` (儲存)，然後 `Ctrl + X` (退出)

## 📝 步驟 5：驗證設置

```bash
crontab -l
```

應該會看到剛才新增的內容。

## ✅ 完成！

現在每天早上 09:00，系統會自動：
1. 下載 Tableau 報表圖片
2. 發送通知到 Slack #ops-test

## 📊 監控執行狀態

查看執行日誌：
```bash
tail -f /Users/lonelyhsu/gemini/claude-project/n8n-workflow/cronjob.log
```

## 🧪 測試（可選）

如果想立即測試而不等到明天 09:00，可以手動執行：

```bash
cd /Users/lonelyhsu/gemini/claude-project/n8n-workflow
./analyze_report.sh
```

然後到 Slack #ops-test 查看是否收到通知。

## ⚠️ 疑難排除

### 問題：crontab -e 仍然顯示 "Operation not permitted"

**解決方案**：
1. 重新啟動終端機應用程式
2. 或重新登入 macOS
3. 確認在「完整磁碟取用權限」中有勾選

### 問題：到了時間但沒有執行

**檢查項目**：
1. 確認 crontab 有正確設置：`crontab -l`
2. 確認腳本有執行權限：`ls -l analyze_report.sh`
3. 查看系統日誌：`grep CRON /var/log/system.log`

---

如有問題，請參考：`README-tableau-report-automation.md`
