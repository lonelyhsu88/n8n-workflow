// 測試特殊關鍵字組合
function isFullDayLeave(text) {
  const lowerText = text.toLowerCase();

  if (/\d{1,2}:\d{2}/.test(text) || /\d{1,2}\s*[-~]\s*\d{1,2}(?!\/)/.test(text)) {
    const hasDateRange = /\d{1,2}\/\d{1,2}\s*-/.test(text);
    if (!hasDateRange) {
      return false;
    }
  }

  const hasPartialTimeKeyword =
    lowerText.includes('上午') || lowerText.includes('下午') ||
    /\bam\b/.test(lowerText) || /\bpm\b/.test(lowerText) ||
    lowerText.includes('早上') || lowerText.includes('中午') || lowerText.includes('晚上');

  if (hasPartialTimeKeyword) {
    return false;
  }

  const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
  return leaveKeywords.some(keyword => text.includes(keyword));
}

const testCases = [
  '12/8-11 <@U07FFHDUTMH> 特休&生日假',
  '12/8 <@U07F14AQ5ST> 健檢特休',
  '12/08 <@U123456789> 事假',
  '12/8-11 PM-Ryan 特休&生日假',  // Without User ID format
];

console.log('🧪 測試 isFullDayLeave 函數\n');
console.log('='.repeat(80));

testCases.forEach((text, index) => {
  const result = isFullDayLeave(text);
  console.log(`\n測試 ${index + 1}:`);
  console.log(`  Text: "${text}"`);
  console.log(`  Result: ${result ? '✅ 整天請假' : '❌ 非整天請假'}`);

  // Debug: 檢查是否有請假關鍵字
  const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
  const foundKeywords = leaveKeywords.filter(keyword => text.includes(keyword));
  console.log(`  Found keywords: ${foundKeywords.join(', ') || '(none)'}`);
});

console.log('\n' + '='.repeat(80));
