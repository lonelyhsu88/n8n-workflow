const fs = require('fs');
const workflow = JSON.parse(fs.readFileSync('TP370-daily-report-checker-FINAL-FIXED.json', 'utf8'));
const dataNode = workflow.nodes.find(n => n.name === '查詢並處理資料');
const code = dataNode.parameters.jsCode;

console.log('=== 驗證修復內容 ===\n');

// 1. 檢查 isFullDayLeave 是否包含 mention 檢查
const hasIsFullDayLeave = code.includes('function isFullDayLeave');
const hasMentionCheck = code.includes('const hasMention = /@[\\w-]+/.test(text)');
const hasFixedPmCheck = code.includes('只在沒有提及時檢查 am/pm');
console.log('1. isFullDayLeave 函數:', hasIsFullDayLeave ? '✅' : '❌');
console.log('   - Mention 檢查:', hasMentionCheck ? '✅' : '❌');
console.log('   - 修復 PM 誤判:', hasFixedPmCheck ? '✅' : '❌');

// 2. 檢查新函數
const hasFindUserIdByName = code.includes('function findUserIdByName');
const hasExtractUserIdentifier = code.includes('function extractUserIdentifier');
console.log('\n2. findUserIdByName 函數:', hasFindUserIdByName ? '✅' : '❌');
console.log('3. extractUserIdentifier 函數:', hasExtractUserIdentifier ? '✅' : '❌');

// 3. 檢查 User ID 提取邏輯
const usesExtractUserIdentifier = code.includes('extractUserIdentifier(text, userMap)');
console.log('\n4. 使用 extractUserIdentifier:', usesExtractUserIdentifier ? '✅' : '❌');

// 4. 檢查是否移除 debug 邏輯
const hasDebugLog = code.includes('debugLog.push');
console.log('5. 移除 debug 邏輯:', !hasDebugLog ? '✅' : '❌');

// 5. 檢查 token
const configNode = workflow.nodes.find(n => n.name === '設定參數');
const hasPlaceholder = configNode.parameters.jsonOutput.includes('YOUR_SLACK_TOKEN_HERE');
const hasRealToken = configNode.parameters.jsonOutput.includes('xoxp-');
console.log('\n6. Token placeholder:', hasPlaceholder ? '✅' : '❌');
console.log('7. 無真實 token:', !hasRealToken ? '✅' : '❌');

// 總結
console.log('\n=== 驗證結果 ===');
const allPassed = hasIsFullDayLeave && hasMentionCheck && hasFixedPmCheck &&
                   hasFindUserIdByName && hasExtractUserIdentifier &&
                   usesExtractUserIdentifier && !hasDebugLog &&
                   hasPlaceholder && !hasRealToken;

if (allPassed) {
  console.log('✅ 所有修復都已正確應用！');
} else {
  console.log('⚠️ 某些修復可能未完全應用');
}

console.log('\n檔案大小:', fs.statSync('TP370-daily-report-checker-FINAL-FIXED.json').size, 'bytes');
console.log('節點數量:', workflow.nodes.length);
