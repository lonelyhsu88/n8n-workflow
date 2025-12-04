# n8n API 連接與認證指南

**最後更新**: 2025-12-04 (UTC+8)
**記錄目的**: 統一管理 n8n API 連接資訊，避免重複查詢

---

## 🔐 認證資訊

### n8n API URL
```
https://n8n.ftgaming.cc
```

### n8n API Key (JWT Token)
```
# 從環境變數讀取
export N8N_API_KEY="<your-n8n-api-key>"

# 或查看 MCP Server 配置
cat ~/.config/claude-code/mcp_servers.json | jq '.n8n.env.N8N_API_KEY'
```

### 認證方式
```bash
X-N8N-API-KEY: <api_key>
Accept: application/json
```

### 來源位置
全域 MCP Server 配置檔：
```
~/.config/claude-code/mcp_servers.json
```

---

## 📡 API 使用範例

### 使用 curl
```bash
# 設定環境變數
export N8N_API_KEY="<your-api-key>"

# 列出所有 workflows
curl -s "https://n8n.ftgaming.cc/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | jq '.'

# 取得特定 workflow
curl -s "https://n8n.ftgaming.cc/api/v1/workflows/<workflow_id>" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | jq '.'
```

### 使用 Python
```python
import requests
import json
import os

N8N_API_URL = "https://n8n.ftgaming.cc"
N8N_API_KEY = os.environ.get("N8N_API_KEY")

if not N8N_API_KEY:
    raise ValueError("請設定環境變數 N8N_API_KEY")

headers = {
    "X-N8N-API-KEY": N8N_API_KEY,
    "Accept": "application/json"
}

# 列出所有 workflows
response = requests.get(f"{N8N_API_URL}/api/v1/workflows", headers=headers)
workflows = response.json()

# 取得特定 workflow
workflow_id = "LDZGgICCNCYIH7Nx"
response = requests.get(f"{N8N_API_URL}/api/v1/workflows/{workflow_id}", headers=headers)
workflow = response.json()
```

---

## 🔧 常用 API Endpoints

### Workflows
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/v1/workflows` | 列出所有 workflows |
| GET | `/api/v1/workflows/{id}` | 取得特定 workflow |
| POST | `/api/v1/workflows` | 建立新 workflow |
| PUT | `/api/v1/workflows/{id}` | 更新 workflow |
| DELETE | `/api/v1/workflows/{id}` | 刪除 workflow |
| POST | `/api/v1/workflows/{id}/activate` | 啟用 workflow |
| POST | `/api/v1/workflows/{id}/deactivate` | 停用 workflow |

### Executions
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/v1/executions` | 列出所有執行記錄 |
| GET | `/api/v1/executions/{id}` | 取得特定執行記錄 |
| DELETE | `/api/v1/executions/{id}` | 刪除執行記錄 |

### Credentials
| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/v1/credentials` | 列出所有憑證 |
| GET | `/api/v1/credentials/{id}` | 取得特定憑證 |

---

## 🤖 AI API 整合

### OpenAI API Key
```bash
# 從環境變數讀取
export OPENAI_API_KEY="<your-openai-api-key>"

# n8n 中已配置 OpenAI credential，無需手動設定
```

### 使用方式 (n8n HTTP Request)
```
URL: https://api.openai.com/v1/chat/completions
Method: POST
Headers:
  - Authorization: Bearer <api_key>
  - Content-Type: application/json
Model: gpt-4o (支援 Vision)
```

---

## 📋 重要 Workflow 索引

### 報表類
| Workflow Name | ID | 說明 |
|---------------|-----|------|
| 線上-老闆每日報表分析 | `LDZGgICCNCYIH7Nx` | 每日 Gemini 報表 → AI 分析 → Slack |

### Workflow 詳細說明

#### 線上-老闆每日報表分析
- **觸發時間**: 每日 9:00 UTC (17:00 UTC+8)
- **流程**:
  1. Schedule Trigger → Get Date Time → Format Date
  2. N Tableau Login → Download Report For Boss
  3. **分支 A**: slack.tableau-hashbingo-report → Wait → tableau.preview
  4. **分支 B**: OpenAI Vision Analysis → Format Analysis → Send to ops-test
- **AI 分析**: 使用 GPT-4o Vision 分析報表圖片
- **輸出頻道**:
  - `#tableau-hashbingo-report` (原始報表)
  - `#ops-test` (AI 分析結果)

### 待補充...
- (其他常用 workflow 可逐步加入)

---

## 🔗 MCP Server 整合

n8n MCP Server 已配置在全域設定中，可直接使用 MCP 工具操作 n8n。

### MCP 配置位置
```
~/.config/claude-code/mcp_servers.json
```

### MCP 配置內容
```json
{
  "n8n": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "n8n-mcp"],
    "env": {
      "MCP_MODE": "stdio",
      "LOG_LEVEL": "error",
      "DISABLE_CONSOLE_OUTPUT": "true",
      "N8N_API_URL": "https://n8n.ftgaming.cc",
      "N8N_API_KEY": "<從 mcp_servers.json 讀取>",
      "N8N_MCP_TELEMETRY_DISABLED": "true"
    }
  }
}
```

---

## 📊 帳號資訊

| 項目 | 值 |
|------|-----|
| 擁有者 | Devops Devops |
| Email | gemini-devops@jvd.tw |
| User ID | f0497e7e-57bf-4887-aa67-9193ee39e01a |
| Project ID | 23TS46UeV6epbiuy |

---

## ⚠️ 注意事項

1. **API Key 安全性**: 此 API Key 具有完整的 n8n 操作權限，請勿外洩
2. **Token 過期**: JWT Token 目前無過期時間設定，但建議定期更換
3. **Rate Limiting**: n8n API 有請求頻率限制，大量操作時需注意
4. **執行權限**: 此 API Key 可執行 workflows，操作時請小心

---

## 📝 更新記錄

- **2025-12-04**: 初始化文檔，記錄 API Key 及使用方式
- **2025-12-04**: 新增 MCP Server 整合說明
- **2025-12-04**: 新增「線上-老闆每日報表分析」workflow 分析
- **2025-12-04**: 新增 OpenAI API Key，workflow 升級為 GPT-4o Vision AI 分析

---

**記錄者**: Claude Code AI Agent
**專案**: n8n Workflow 管理
**平台**: FT Gaming n8n Instance
