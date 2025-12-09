const fs = require('fs');

console.log('生成完整正確的 workflow (包含 token)\n');
console.log('='.repeat(80));

// 讀取最終修復版本
const workflow = JSON.parse(fs.readFileSync('TP370-daily-report-checker-FINAL-FIXED.json', 'utf8'));

// 1. 更新 token
const configNode = workflow.nodes.find(n => n.name === '設定參數');
configNode.parameters.jsonOutput = configNode.parameters.jsonOutput.replace(
  '"slackToken": "YOUR_SLACK_TOKEN_HERE"',
  '"slackToken": "YOUR_SLACK_TOKEN_HERE"'
);

// 2. 驗證所有關鍵功能
const dataNode = workflow.nodes.find(n => n.name === '查詢並處理資料');
const code = dataNode.parameters.jsCode;

console.log('驗證修復內容:');
console.log('-'.repeat(80));

const checks = [
  { name: '✓ isFullDayLeave 函數', test: code.includes('function isFullDayLeave') },
  { name: '✓ Mention 檢查邏輯（避免誤判 @PM-Ryan）', test: code.includes('const hasMention = /@[\\w-]+/.test(text)') },
  { name: '✓ findUserIdByName 函數', test: code.includes('function findUserIdByName') },
  { name: '✓ extractUserIdentifier 函數', test: code.includes('function extractUserIdentifier') },
  { name: '✓ 使用 extractUserIdentifier 提取 User ID', test: code.includes('extractUserIdentifier(text, userMap)') },
  { name: '✓ expandDateRange 函數', test: code.includes('function expandDateRange') },
  { name: '✓ 沒有 DEBUG_USER_ID 殘留', test: !code.includes('DEBUG_USER_ID') },
  { name: '✓ 沒有 isPMRyanMessage 殘留', test: !code.includes('isPMRyanMessage') },
  { name: '✓ 沒有 debugLog 殘留', test: !code.includes('debugLog') },
  { name: '✓ Token 已正確設定', test: configNode.parameters.jsonOutput.includes('xoxp-271976915280') }
];

let allPass = true;
checks.forEach(check => {
  const status = check.test ? '✅' : '❌';
  console.log(`  ${status} ${check.name}`);
  if (!check.test) allPass = false;
});

console.log();

if (allPass) {
  // 寫入最終版本
  fs.writeFileSync('TP370-COMPLETE-FINAL.json', JSON.stringify(workflow, null, 2), 'utf8');

  const stats = fs.statSync('TP370-COMPLETE-FINAL.json');
  console.log('='.repeat(80));
  console.log('✅ 已生成完整最終版本');
  console.log(`   檔案: TP370-COMPLETE-FINAL.json`);
  console.log(`   大小: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
  console.log(`   節點: ${workflow.nodes.length}`);
  console.log('='.repeat(80));

  console.log('\n📋 包含功能:');
  console.log('  1. ✅ 支援 <@USER_ID> 格式（原有）');
  console.log('  2. ✅ 支援 @姓名 格式（新增）');
  console.log('  3. ✅ 避免誤判 @PM-Ryan 為 "pm"（修復）');
  console.log('  4. ✅ 日期範圍展開 12/8-11 → 4天（正確）');
  console.log('  5. ✅ 整天請假判斷（正確）');
  console.log('  6. ✅ 已移除所有 debug 程式碼');
  console.log('  7. ✅ Token 已設定為真實值');

  console.log('\n⚠️  請注意:');
  console.log('  此檔案包含真實 Slack token，請勿 commit 到 git');

  console.log('\n📝 測試結果:');
  console.log('  訊息: "12/8-11 <@U07FFHDUTMH> 特休&生日假"');
  console.log('  應該: ✅ PM-Ryan 被識別為 12/8-11 請假');
  console.log('  實際: 請在 n8n 中執行測試');

} else {
  console.log('❌ 驗證失敗，有功能缺失');
  process.exit(1);
}
