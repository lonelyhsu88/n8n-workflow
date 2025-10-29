# n8n 工作流导入指南

## 🎯 目标
导入修复后的 `attendance-statistics-analysis-SIMPLIFIED.json` 到 n8n

## 📍 修复的问题
- ✅ 支持逗号分隔的日期格式（如 "10/23，27-31"）
- ✅ 支持纯数字日期范围并自动推断月份
- ✅ 修复日期递增 bug
- ✅ 10/29 的报告现在会包含 QA-Lisa 和 RD-Jean

---

## 方法 1: 通过 Web UI 导入（推荐） ⭐

### 步骤 1: 登录 n8n
```
URL: https://n8n-production-9f9c.zeabur.app/
```

### 步骤 2: 找到现有工作流
1. 在左侧菜单找到 **Workflows**
2. 搜索: `出勤統計分析-優化完整版-簡化版`
3. 点击打开工作流

### 步骤 3: 更新工作流代码

**选项 A: 直接编辑节点代码**
1. 找到 **"解析出缺勤資料"** 节点
2. 点击该节点打开编辑器
3. 复制 `PARSE_CODE_FIXED_V2.js` 的内容
4. 粘贴替换整个 jsCode 字段
5. 点击 **Execute Node** 测试
6. 点击 **Save** 保存

**选项 B: 导入整个工作流**
1. 在 n8n 首页点击 **Import from File**
2. 选择本地的 `attendance-statistics-analysis-SIMPLIFIED.json`
3. 确认导入
4. **重要**: 检查并重新配置凭证（Slack API, Google Sheets API）
5. 点击 **Save**

---

## 方法 2: 使用 n8n CLI（如果安装了 n8n CLI）

```bash
# 导入工作流
n8n import:workflow \
  --input=attendance-statistics-analysis-SIMPLIFIED.json \
  --separate
```

---

## 方法 3: 使用 API（需要有效的 API Key）

### 步骤 1: 获取 API Key
1. 登录 n8n: https://n8n-production-9f9c.zeabur.app/
2. 点击右上角用户头像 → **Settings**
3. 进入 **API** 标签
4. 创建新的 API Key 或使用现有的

### 步骤 2: 使用 API 更新
```bash
# 设置 API Key
export N8N_API_KEY="your-api-key-here"

# 创建新工作流（如果是新的）
curl -X POST \
  "https://n8n-production-9f9c.zeabur.app/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @attendance-statistics-analysis-SIMPLIFIED.json

# 或更新现有工作流（需要知道 workflow ID）
curl -X PUT \
  "https://n8n-production-9f9c.zeabur.app/api/v1/workflows/{workflow-id}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @attendance-statistics-analysis-SIMPLIFIED.json
```

---

## ✅ 验证步骤

导入后，请验证：

### 1. 手动执行工作流
1. 在 n8n 中打开工作流
2. 点击右上角 **Execute Workflow**
3. 查看 **"今日請假資料"** 节点的输出

### 2. 检查今日报告
预期输出应该包含：
```json
[
  {
    "date": "2025/10/29",
    "userName": "QA-Lisa",
    "status": "特休",
    ...
  },
  {
    "date": "2025/10/29",
    "userName": "RD-Jean",
    "status": "特休",
    ...
  }
]
```

### 3. 查看 Console 日志
在 **"解析出缺勤資料"** 节点的输出中应该看到：
```
=== 處理完成 ===
總記錄數：XX
狀態統計：{ "特休": XX, ... }
自動識別的使用者數: XX
```

---

## 🐛 故障排除

### 问题 1: 凭证失效
**症状**: 工作流执行失败，提示 "Invalid credentials"

**解决方案**:
1. 重新配置 Slack API 凭证
2. 重新配置 Google Sheets API 凭证

### 问题 2: 没有检测到今天的请假
**症状**: 今日请假数据为空

**解决方案**:
1. 检查 Slack 频道 ID 是否正确: `C05FXLH7BCJ`
2. 确认 Slack 中有今天的请假消息
3. 手动执行 "取得頻道資訊" 节点查看原始数据

### 问题 3: 日期格式问题
**症状**: 某些日期没有被解析

**解决方案**:
1. 检查日期格式是否符合支持的模式
2. 查看 Console 日志中的错误信息
3. 使用测试文件 `test-v3-parsing.js` 验证解析逻辑

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 n8n 的执行日志
2. 查看节点的输出数据
3. 确认所有凭证配置正确

---

**最后更新**: 2025-10-29
**修复版本**: V3.2
**文件**: attendance-statistics-analysis-SIMPLIFIED.json
