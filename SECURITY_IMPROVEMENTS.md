# 安全性改进建议

## 🔴 高优先级：移除硬编码的 Tableau Token

### 当前问题

在 `gemini-currencies-report.js` 的第 118 行，Tableau Personal Access Token 被硬编码在工作流中：

```xml
<credentials
  personalAccessTokenName="n8n-token"
  personalAccessTokenSecret="YOUR_TOKEN_SECRET_HERE"
>
```

**风险**：
- Token 暴露在版本控制系统中
- 任何有权访问此文件的人都可以使用该 Token
- Token 泄露可能导致未授权访问 Tableau 数据

---

## ✅ 解决方案

### 方案 1：使用 N8N 环境变量（推荐）

#### 步骤 1：在 N8N 中设置环境变量

在 N8N 服务器上设置环境变量：

```bash
# 方法 A: 通过 .env 文件
echo 'TABLEAU_TOKEN_NAME=n8n-token' >> /path/to/n8n/.env
echo 'TABLEAU_TOKEN_SECRET=YOUR_TOKEN_SECRET_HERE' >> /path/to/n8n/.env

# 方法 B: 通过系统环境变量
export TABLEAU_TOKEN_NAME="n8n-token"
export TABLEAU_TOKEN_SECRET="YOUR_TOKEN_SECRET_HERE"
```

#### 步骤 2：修改工作流中的 Tableau Login 节点

将硬编码的 Token 替换为环境变量引用：

**修改前**：
```xml
<credentials
  personalAccessTokenName="n8n-token"
  personalAccessTokenSecret="YOUR_TOKEN_SECRET_HERE"
>
```

**修改后**：
```xml
<credentials
  personalAccessTokenName="{{ $env.TABLEAU_TOKEN_NAME }}"
  personalAccessTokenSecret="{{ $env.TABLEAU_TOKEN_SECRET }}"
>
```

#### 步骤 3：重启 N8N 服务

```bash
# Docker
docker-compose restart n8n

# systemd
sudo systemctl restart n8n

# PM2
pm2 restart n8n
```

---

### 方案 2：使用 N8N Credentials 系统（最安全）

#### 步骤 1：在 N8N UI 中创建凭证

1. 进入 N8N Web UI
2. 点击左侧菜单 **Credentials**
3. 点击 **+ Add Credential**
4. 搜索 "HTTP Header Auth" 或创建自定义凭证
5. 输入以下信息：
   - **Name**: `Tableau Auth`
   - **Header Name**: `X-Tableau-Auth`
   - **Header Value**: (先留空，登录后获取)

#### 步骤 2：修改工作流结构

不再使用硬编码的 XML 登录，而是：

1. 创建一个新的 **HTTP Request** 节点用于登录
2. 使用 N8N Credentials 存储 Token
3. 在后续请求中引用该凭证

**新的登录节点配置**：

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://prod-apnortheast-a.online.tableau.com/api/3.4/auth/signin",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "tableauApi",
    "sendBody": true,
    "contentType": "raw",
    "body": "<tsRequest><credentials personalAccessTokenName=\"{{ $credentials.tableauTokenName }}\" personalAccessTokenSecret=\"{{ $credentials.tableauTokenSecret }}\" ><site contentUrl=\"tableauadmin59b92d016b\" /></credentials></tsRequest>"
  }
}
```

---

## 🔒 额外安全建议

### 1. 使用 Tableau 的短期 Token

建议设置 Token 过期时间：

```bash
# 在 Tableau Server 中设置 Token 过期策略
# Admin > Settings > Authentication > Personal Access Tokens
# 设置过期时间为 90 天或更短
```

### 2. 限制 Token 权限

为这个自动化任务创建一个专用的 Tableau 用户，只授予必要的权限：

- ✅ 查看指定工作簿
- ✅ 导出图像
- ❌ 编辑工作簿
- ❌ 管理用户
- ❌ 管理站点

### 3. 定期轮换 Token

建议每 90 天轮换一次 Token：

```bash
# 1. 在 Tableau 中生成新 Token
# 2. 更新 N8N 环境变量
# 3. 撤销旧 Token
```

### 4. 监控 Token 使用情况

在 Tableau Server 中启用审计日志：

```bash
# 监控以下活动：
# - Token 使用频率
# - 异常访问模式
# - 失败的认证尝试
```

### 5. 使用 Secrets Manager（企业级）

对于生产环境，建议使用专业的密钥管理服务：

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**

示例（AWS Secrets Manager）：

```bash
# 存储 Token
aws secretsmanager create-secret \
  --name tableau/n8n-token \
  --secret-string '{"tokenName":"n8n-token","tokenSecret":"YOUR_SECRET"}'

# 在 N8N 中通过 AWS SDK 获取
```

---

## 📋 迁移检查清单

- [ ] 在 N8N 服务器上设置环境变量
- [ ] 修改工作流中的 Tableau Login 节点
- [ ] 测试工作流是否正常运行
- [ ] 从代码中删除硬编码的 Token
- [ ] 从 Git 历史中清除敏感信息（如需要）
- [ ] 在 Tableau 中撤销旧 Token（如果暴露）
- [ ] 生成新的 Token
- [ ] 更新文档
- [ ] 通知团队成员

---

## 🚨 紧急响应（如果 Token 已泄露）

如果怀疑 Token 已经泄露，请立即执行：

1. **立即撤销 Token**
   ```
   Tableau Server > Settings > Personal Access Tokens > Revoke
   ```

2. **生成新 Token**
   ```
   创建新的 Personal Access Token
   ```

3. **更新 N8N 配置**
   ```bash
   # 更新环境变量
   export TABLEAU_TOKEN_SECRET="NEW_TOKEN_HERE"
   # 重启 N8N
   docker-compose restart n8n
   ```

4. **检查审计日志**
   ```
   查看是否有未授权的访问
   ```

5. **通知安全团队**

---

## 📞 联系方式

如有安全问题或需要帮助，请联系：

- **DevOps 团队**: #ops-team
- **安全团队**: #security-alerts
- **紧急联系**: security@company.com

---

**最后更新**: 2025-10-24
**下次审查**: 2025-11-24
