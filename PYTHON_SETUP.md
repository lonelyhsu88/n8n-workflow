# Python 環境設置指南

## 快速開始

本專案使用 Python 3 和虛擬環境來隔離依賴，避免污染系統環境。

### 1. 虛擬環境已設置完成

虛擬環境位於 `.venv/` 目錄，已包含所有必要依賴：
- `requests>=2.31.0`

### 2. 使用方式

#### 方式 A：直接執行腳本（推薦）

```bash
./analyze_report.sh
```

腳本會自動使用虛擬環境中的 Python。

#### 方式 B：手動啟動虛擬環境

```bash
# 啟動虛擬環境
source .venv/bin/activate

# 執行 Python 腳本
python analyze_report.py

# 或執行其他 Python 指令
python slack_helper.py

# 退出虛擬環境
deactivate
```

### 3. 新增依賴

如果需要安裝其他 Python 套件：

```bash
# 使用虛擬環境中的 pip
.venv/bin/pip install <package-name>

# 更新 requirements.txt
.venv/bin/pip freeze > requirements.txt
```

### 4. 重新建立環境

如果需要重新建立虛擬環境：

```bash
# 刪除舊環境
rm -rf .venv

# 創建新環境
python3 -m venv .venv

# 安裝依賴
.venv/bin/pip install -r requirements.txt
```

## 檔案說明

- `.venv/` - Python 虛擬環境目錄（已在 .gitignore 中排除）
- `requirements.txt` - Python 依賴清單
- `analyze_report.py` - Tableau 報表分析腳本
- `slack_helper.py` - Slack API 輔助工具
- `analyze_report.sh` - 包裝腳本，自動使用虛擬環境

## 疑難排解

### 問題：ModuleNotFoundError: No module named 'requests'

**原因**：沒有使用虛擬環境執行腳本

**解決方案**：
```bash
# 使用虛擬環境中的 Python
.venv/bin/python analyze_report.py

# 或使用包裝腳本
./analyze_report.sh
```

### 問題：虛擬環境損壞

**解決方案**：重新建立虛擬環境（參考上方「重新建立環境」步驟）

## 最佳實踐

✅ **必須做**：
- 使用虛擬環境執行所有 Python 腳本
- 新增依賴後更新 `requirements.txt`
- 使用 `.venv/bin/pip` 安裝套件

❌ **禁止做**：
- `pip install <package>`（污染系統環境）
- `sudo pip install`
- 直接使用 `python3` 執行腳本（除非已 `source .venv/bin/activate`）

## 參考資源

- Python venv 官方文檔：https://docs.python.org/3/library/venv.html
- pip 使用指南：https://pip.pypa.io/en/stable/
