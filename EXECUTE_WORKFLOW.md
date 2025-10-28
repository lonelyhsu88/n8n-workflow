# 🚀 執行「出勤統計分析-優化版」Workflow

**Workflow ID**: 9omWYJLV7jqv18lN
**最後更新**: 2025-10-28

---

## ⚠️ 重要提醒

n8n REST API **不支援**直接執行 workflow，必須透過 Web UI 操作。

---

## 📋 執行前檢查清單

在執行前，請確認以下事項：

### 1. 憑證是否已設定？

| 節點名稱 | 需要的憑證 | 狀態 |
|---------|-----------|------|
| 取得頻道資訊 | n8n-ops | ⏳ 待確認 |
| lonely.h | n8n-ops | ⏳ 待確認 |
| 清空今日請假 | n8n-googlesheet | ⏳ 待確認 |
| 更新今日請假 | n8n-googlesheet | ⏳ 待確認 |
| 清空2025年排行榜 | n8n-googlesheet | ⏳ 待確認 |
| 更新2025年排行榜 | n8n-googlesheet | ⏳ 待確認 |

**如果還沒設定憑證**，請參考：`CREDENTIALS_SETUP_GUIDE.md`

### 2. Slack Bot 是否已加入頻道？

```bash
在 Slack 的 #jvd每日出勤回報 頻道中執行:
/invite @你的機器人名稱
```

### 3. Google Sheets 權限是否正確？

```
開啟: https://docs.google.com/spreadsheets/d/176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw
確認您的 Google 帳號有「編輯」權限
```

---

## 🎯 執行步驟

### 方式 1: 手動執行 (測試用) ⭐ 推薦

1. **開啟 n8n Workflow**:
   ```
   https://n88.zeabur.app/workflow/9omWYJLV7jqv18lN
   ```

2. **檢查所有節點**:
   - 確認沒有紅色錯誤標記
   - 確認所有憑證都已設定

3. **點擊執行按鈕**:
   ```
   點擊右上角的 "Execute Workflow" 按鈕
   ```

4. **觀察執行過程**:
   - 每個節點執行時會有動畫效果
   - 成功的節點會變成 **綠色** ✅
   - 失敗的節點會變成 **紅色** ❌

5. **查看執行結果**:
   ```
   點擊節點可以查看該節點的輸入/輸出資料
   ```

---

### 方式 2: 啟用自動執行 (正式運行) ⏰

1. **開啟 n8n Workflow**:
   ```
   https://n88.zeabur.app/workflow/9omWYJLV7jqv18lN
   ```

2. **確認憑證已設定** (參考上方檢查清單)

3. **點擊 Active 開關**:
   ```
   點擊右上角的 "Active" 開關
   開關變成綠色/藍色表示已啟用
   ```

4. **Workflow 將每小時自動執行**:
   ```
   觸發時間: 每小時的第 0 分鐘
   例如: 08:00, 09:00, 10:00, 11:00...
   ```

5. **查看執行歷史**:
   ```
   點擊左側選單 "Executions"
   篩選 workflow: 出勤統計分析-優化版
   ```

---

## 📊 預期執行結果

### 成功執行後，您會看到:

#### 1. Slack 通知 💬
```
lonely.h 會收到一則訊息，內容包含:
- 今日請假人員
- 請假類型
- 時間資訊
```

#### 2. Google Sheets 更新 📝

**「今日請假」工作表**:
```
| 日期 | 訊息日期 | 首次打卡 | 使用者 | 使用者ID | 狀態 | 詳情 | 最後打卡 | 工作時長 | 訊息次數 |
```

**「2025排行榜」工作表** (重點！):
```
| 排名 | 使用者 | 總天數 | 總時數 | 病假天 | 病假時數 | 特休天 | 特休時數 | ... |
                      ↑ 新增   ↑ 新增          ↑ 新增          ↑ 新增
```

#### 3. 執行時間 ⚡
```
預期執行時間: 3-5 秒
記憶體使用: 8-10MB
```

---

## 🐛 常見錯誤與解決

### 錯誤 1: 「取得頻道資訊」節點失敗

**錯誤訊息**:
```json
{
  "error": "channel_not_found"
}
```

**原因**: Bot 沒有被加入 #jvd每日出勤回報 頻道

**解決**:
```
1. 在 Slack 中開啟 #jvd每日出勤回報 頻道
2. 執行指令: /invite @你的機器人名稱
3. 確認 Bot 成功加入頻道
4. 重新執行 workflow
```

---

### 錯誤 2: 「取得頻道資訊」節點失敗 (憑證問題)

**錯誤訊息**:
```json
{
  "error": "not_authed"
}
```

**原因**: Slack 憑證未設定或無效

**解決**:
```
1. 點擊「取得頻道資訊」節點
2. 檢查 Credential 欄位
3. 選擇 "n8n-ops" 憑證
4. 如果沒有此選項:
   - Settings → Credentials
   - 確認 "n8n-ops" 存在
   - 如不存在，需要重新建立
```

---

### 錯誤 3: Google Sheets 節點失敗

**錯誤訊息**:
```json
{
  "error": "The caller does not have permission"
}
```

**原因**: Google 帳號沒有 Sheets 的編輯權限

**解決**:
```
1. 開啟 Google Sheets:
   https://docs.google.com/spreadsheets/d/176_Vy1vjv-_-At94RmPp6mAT9TwMjme3QF7_UPo-fDw

2. 點擊右上角「共用」按鈕

3. 加入 n8n 授權的 Google 帳號

4. 設定權限為「編輯者」

5. 重新執行 workflow
```

---

### 錯誤 4: 「處理請假資料」節點失敗

**錯誤訊息**:
```
$getWorkflowStaticData is not defined
```

**原因**: n8n 版本太舊 (< 0.220.0)

**解決**:
```
1. 檢查 n8n 版本 (右下角)

2. 如果版本 < 0.220.0:
   - 前往 Zeabur Dashboard
   - 選擇 n8n 服務
   - 點擊 "Redeploy" 或更新版本
   - 等待部署完成

3. 重新執行 workflow
```

---

### 錯誤 5: 整個 Workflow 無法執行

**錯誤訊息**:
```
Cannot execute workflow as it is not active
```

**原因**: Workflow 處於停用狀態

**解決**:
```
1. 前往 workflow 頁面
2. 點擊右上角 "Active" 開關
3. 確認開關變成綠色/藍色
4. Workflow 現在會自動執行
```

---

## ✅ 執行成功驗證清單

執行完成後，請確認以下項目:

### 基本驗證
- [ ] 所有 13 個節點都是綠色 ✅
- [ ] 沒有任何紅色錯誤標記 ❌
- [ ] 執行時間 < 10 秒
- [ ] 在 Executions 中看到成功記錄

### Slack 驗證
- [ ] lonely.h 收到 Slack 通知
- [ ] 訊息格式正確
- [ ] 訊息內容包含請假資訊

### Google Sheets 驗證 (重要！)

**「今日請假」工作表**:
- [ ] 有新的資料行
- [ ] 日期正確
- [ ] 使用者名稱正確
- [ ] 狀態正確

**「2025排行榜」工作表** (重點檢查！):
- [ ] 有資料更新
- [ ] 包含以下欄位:
  - [ ] rank (排名)
  - [ ] userName (使用者名稱)
  - [ ] totalDays (總天數)
  - [ ] **totalHours (總時數)** ⭐
  - [ ] **sickLeaveHours (病假時數)** ⭐
  - [ ] **annualLeaveHours (特休時數)** ⭐
  - [ ] **remoteHours (遠端工作時數)** ⭐
  - [ ] 其他 10 個 xxxHours 欄位

### 時數欄位驗證 (新功能！)
- [ ] totalHours 有數值 (不是空白)
- [ ] sickLeaveHours 有數值 (如果有人請病假)
- [ ] 各類請假時數加總 = totalHours

---

## 🔍 Debug 技巧

### 查看節點輸出資料

1. **執行完成後**:
   ```
   點擊任意節點
   ```

2. **查看 Output 標籤**:
   ```
   可以看到該節點的輸出資料
   JSON 格式顯示
   ```

3. **常用的 Debug 節點**:

   #### 「解析出缺勤資料」節點
   ```
   查看是否正確解析 Slack 訊息
   確認 attendanceData 陣列有資料
   ```

   #### 「2025年排行榜」節點
   ```
   查看 ranking 陣列
   確認包含 totalHours, sickLeaveHours 等欄位
   ```

   #### 「處理請假資料」節點
   ```
   查看 shouldSendNewMessage 和 attendanceHash
   確認邏輯正確
   ```

---

## 📖 相關文檔

| 問題 | 參考文檔 |
|------|----------|
| 如何設定憑證？ | `CREDENTIALS_SETUP_GUIDE.md` |
| 完整配置資訊？ | `SESSION_RECORD_2025-10-28.md` |
| 快速查詢？ | `QUICK_REFERENCE.md` |
| 如何執行？ | `EXECUTE_WORKFLOW.md` (本文件) |

---

## 🎯 下一步

### 如果手動執行成功 ✅

1. **啟用自動執行**:
   ```
   點擊 "Active" 開關
   ```

2. **監控第一次自動執行**:
   ```
   等待下一個整點 (例如 10:00)
   檢查 Executions 是否有新記錄
   ```

3. **設定失敗通知** (可選):
   ```
   Workflow Settings → Error Workflow
   當執行失敗時自動通知
   ```

### 如果手動執行失敗 ❌

1. **查看錯誤訊息**:
   ```
   點擊紅色節點
   查看 Error 標籤
   ```

2. **參考上方「常見錯誤與解決」**

3. **修復問題後重新執行**:
   ```
   點擊 "Execute Workflow" 再試一次
   ```

4. **如果仍無法解決**:
   ```
   參考 SESSION_RECORD_2025-10-28.md
   查看完整的 debug 資訊
   ```

---

## 💡 小技巧

### 快速測試單一節點

1. 右鍵點擊節點
2. 選擇 "Execute Node"
3. 只執行這一個節點 (用於測試)

### 查看執行時間

1. 執行完成後
2. 點擊節點
3. 查看 "Execution Time" (執行時間)

### 比較執行結果

1. 在 Executions 中選擇兩次執行
2. 點擊 "Compare"
3. 查看差異

---

**文件版本**: v1.0
**建立日期**: 2025-10-28
**Workflow ID**: 9omWYJLV7jqv18lN
**Workflow 連結**: https://n88.zeabur.app/workflow/9omWYJLV7jqv18lN

🎯 **現在就去執行 workflow 吧！** 點擊上方連結即可開始。
