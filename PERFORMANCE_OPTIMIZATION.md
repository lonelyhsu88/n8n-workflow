# 性能优化指南

## 📊 当前性能指标

### 工作流执行时间分析

**基本参数**：
- 总货币数：30
- Tableau 请求超时：60 秒
- Slack 上传间隔：3 秒
- 重试等待时间：5/10/20 秒（指数退避）

**理想情况**（无失败）：
```
30 货币 × 3 秒 = 90 秒 (1.5 分钟)
+ Tableau 认证: ~2 秒
+ 总计: ~2 分钟
```

**实际情况**（含重试）：
```
假设 10% 失败率，平均重试 1 次：
90 秒 + (3 货币 × 5 秒) = 105 秒 (1.75 分钟)
```

**最坏情况**（多个超时）：
```
如果 5 个货币都超时且重试 3 次：
90 秒 + (5 × 60 × 3) = 990 秒 (16.5 分钟)
```

---

## ⚡ 优化策略

### 1. 并行处理（高影响）

#### 当前实现
```
Sequential: PHP → BDT → IDR → ... (一个接一个)
```

#### 优化方案
```javascript
// 将 30 个货币分成 3 个批次，每批 10 个并行处理
Batch 1: PHP, BDT, IDR, INR, VND, PKR, GMP, MYR, KRW, BRL (并行)
等待 3 秒
Batch 2: THB, MXN, NPR, SGD, USD, JPY, HKD, AUD, CNY, EUR (并行)
等待 3 秒
Batch 3: MMK, BND, AED, RUB, CAD, COP, IRR, KES, LAK, TRY (并行)
```

**预期提升**：
- 执行时间从 ~2 分钟降至 ~30 秒
- **70% 性能提升**

**实现方式**：
在 `Process Data Sources` 节点之后添加 `Split In Batches` 节点，配置批次大小为 10。

**限制因素**：
- Tableau API 限流（需测试最大并发数）
- Slack API 限流（Tier 3: 50+ requests/minute）
- N8N 服务器资源

---

### 2. 智能超时管理（已实现 ✅）

#### 当前优化
```javascript
// 动态超时策略
Tableau 请求超时: 60 秒（从 30 秒增加）
指数退避重试: 5s → 10s → 20s
最大重试次数: 3
```

#### 进一步优化建议

**按货币历史成功率调整超时**：
```javascript
// 在 Data Sources Config 中添加
{
  id: "PHP",
  viewId: "...",
  timeout: 60000,  // 默认 60 秒
  successRate: 0.98  // 历史成功率
}

// 高成功率货币使用较短超时
if (source.successRate > 0.95) {
  timeout = 45000;  // 45 秒
} else {
  timeout = 75000;  // 75 秒
}
```

---

### 3. 缓存机制（中等影响）

#### 问题
每次请求都需要重新认证 Tableau。

#### 解决方案
```javascript
// 缓存 Tableau Token (有效期通常为几小时)
const CACHE_KEY = 'tableau_token';
const CACHE_TTL = 3600000; // 1 小时

// 在 Tableau Login 节点中
const cachedToken = $getWorkflowStaticData(CACHE_KEY);
if (cachedToken && cachedToken.expires > Date.now()) {
  return [{ json: cachedToken }];
}
// 否则重新登录并缓存
```

**预期提升**：
- 减少 ~2 秒认证时间（后续运行）
- 降低 Tableau 服务器负载

---

### 4. Slack 上传优化（低影响）

#### 当前实现
```
Upload Image → Post Message → Wait 3s → 下一个
```

#### 优化方案 A：批量上传
```javascript
// 累积 5 个图片后批量上传
if (uploadQueue.length >= 5) {
  uploadBatch(uploadQueue);
  uploadQueue = [];
}
```

#### 优化方案 B：异步上传
```javascript
// 上传后不等待 Slack 响应，直接处理下一个
// 使用 webhook 或回调处理上传结果
```

**预期提升**：
- 减少 ~60 秒等待时间（30 × 2 秒）
- **30% 性能提升**

**风险**：
- Slack API 限流
- 消息顺序可能错乱

---

### 5. 预热机制（低影响）

#### 概念
在实际执行前 5 分钟，发送预热请求唤醒 Tableau 缓存。

#### 实现
```javascript
// 新增触发器：每日 09:10 (比主任务早 5 分钟)
Cron: "10 09 * * *"

// 执行轻量级请求
GET /api/3.4/sites/{siteId}/views/{viewId}/image?maxAge=300
```

**预期提升**：
- 减少首次请求延迟
- 提高首批货币成功率

---

## 📈 推荐实施计划

### Phase 1：立即实施（已完成 ✅）
- [x] 增加 Tableau 请求超时到 60 秒
- [x] 实现指数退避重试策略
- [x] 添加详细错误日志
- [x] 优化 Slack 等待时间（5s → 3s）

### Phase 2：短期优化（1-2 周）
- [ ] 实施并行处理（批次大小：5-10）
- [ ] 添加 Tableau Token 缓存
- [ ] 测试并调整最优并发数
- [ ] 监控 API 限流情况

### Phase 3：中期优化（1-2 月）
- [ ] 实施智能超时管理
- [ ] 添加历史成功率追踪
- [ ] 实施 Slack 批量上传
- [ ] 添加预热机制

### Phase 4：长期优化（3+ 月）
- [ ] 迁移到更快的 Tableau API (v3.14+)
- [ ] 实施全局缓存层（Redis）
- [ ] 添加实时监控仪表板
- [ ] 自动化性能调优

---

## 🧪 性能测试方案

### 基准测试

**测试 1：单货币延迟**
```bash
# 测量单个货币从开始到完成的时间
目标: < 5 秒
```

**测试 2：总执行时间**
```bash
# 测量整个工作流的执行时间
目标: < 3 分钟
```

**测试 3：并发压力测试**
```bash
# 测试不同并发数的性能
并发数: 1, 3, 5, 10, 15
监控: 成功率、平均延迟、错误率
```

**测试 4：故障恢复**
```bash
# 模拟网络故障和超时
场景: 30% 请求超时
目标: 所有货币最终成功或标记为失败
```

---

## 📊 监控指标

### 关键性能指标 (KPIs)

1. **总执行时间**
   - 目标: < 3 分钟
   - 警告: > 5 分钟
   - 严重: > 10 分钟

2. **成功率**
   - 目标: > 95%
   - 警告: < 90%
   - 严重: < 80%

3. **平均单货币处理时间**
   - 目标: < 5 秒
   - 警告: > 10 秒
   - 严重: > 30 秒

4. **重试率**
   - 目标: < 10%
   - 警告: > 20%
   - 严重: > 30%

### 监控实施

```javascript
// 在 Summary Statistics 节点中添加
const metrics = {
  totalTime: executionTimeMs,
  successRate: (successCount / totalCurrencies) * 100,
  avgProcessingTime: totalProcessingTime / successCount,
  retryRate: (retryCount / totalCurrencies) * 100,
  failedCurrencies: failedItems.map(i => i.id).join(', ')
};

// 发送到监控系统
if (metrics.totalTime > 300000) {  // > 5 分钟
  sendAlert('performance', metrics);
}
```

---

## 🔧 故障排查

### 常见性能问题

#### 问题 1：整体执行时间过长
**症状**: 工作流执行超过 10 分钟

**可能原因**：
1. Tableau 服务器响应缓慢
2. 网络延迟
3. 大量重试

**诊断步骤**：
```bash
# 检查 N8N 日志
docker logs n8n -f | grep "Currency Daily Report"

# 检查单个货币的处理时间
# 查找超时的货币模式
```

**解决方案**：
1. 检查 Tableau 服务器状态
2. 增加超时时间
3. 联系 Tableau 管理员检查服务器负载

#### 问题 2：高重试率
**症状**: 超过 30% 的请求需要重试

**可能原因**：
1. Tableau 服务器不稳定
2. 网络不稳定
3. Token 即将过期

**解决方案**：
1. 增加初始超时时间
2. 检查网络连接
3. 轮换 Tableau Token

#### 问题 3：Slack API 限流
**症状**: Slack 上传失败，错误 "rate_limited"

**解决方案**：
1. 增加 Slack 等待时间（3s → 5s）
2. 实施批量上传
3. 升级 Slack API Tier

---

## 📞 支持

如有性能问题或需要优化建议：

- **DevOps**: #ops-team
- **N8N 专家**: @n8n-admin
- **Tableau 管理**: #tableau-support

---

**最后更新**: 2025-10-24
**下次审查**: 2025-11-24
