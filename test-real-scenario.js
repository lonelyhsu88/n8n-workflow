// 真實場景測試：2025-10-27 (週一)
console.log('=== 真實場景分析 ===\n');

const today = new Date(2025, 9, 27, 12, 0, 0); // 2025-10-27 中午
console.log('今天:', today.toISOString().split('T')[0], '(' + ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][today.getDay()] + ')');
console.log('');

// 計算當週範圍 (週一到週日)
const dayOfWeek = today.getDay(); // 1 = Monday
const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
const monday = new Date(today);
monday.setDate(today.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

console.log('當週範圍 (週一-週日):');
console.log('  週一:', monday.toISOString().split('T')[0]);
console.log('  週日:', sunday.toISOString().split('T')[0]);
console.log('');

// Google Sheet 資料
const dutyData = {
  'Bread': '10/7~12  20~27',
  'Joe': '10/28~31',
  'Phoebe': '10/13~19',
  'Owen': '10/1~6'
};

console.log('Backend 值班資料:');
Object.entries(dutyData).forEach(([person, dates]) => {
  console.log(`  ${person.padEnd(10)} ${dates}`);
});
console.log('');

// 分析每個人的值班日期
console.log('=== 日期範圍分析 ===\n');

// Bread: 10/7~12  20~27
console.log('Bread: "10/7~12  20~27"');
console.log('  範圍 1: 10/7~12 → 2025-10-07 ~ 2025-10-12');
console.log('  範圍 2: 20~27  → 2025-10-20 ~ 2025-10-27');
console.log('  當週: 2025-10-27 ~ 2025-11-02');
console.log('  結論: 範圍 2 的結束日 10-27 剛好是本週一');
console.log('        → 觸發「週一交班邏輯」→ 被跳過 ❌');
console.log('');

// Joe: 10/28~31
console.log('Joe: "10/28~31"');
console.log('  範圍: 2025-10-28 ~ 2025-10-31');
console.log('  當週: 2025-10-27 ~ 2025-11-02');
console.log('  結論: 範圍在當週內 → 匹配成功 ✅');
console.log('');

console.log('=== 問題根因 ===');
console.log('週一交班邏輯的設計意圖:');
console.log('  如果值班「結束在週一」且「開始在週一之前」→ 視為上週值班 → 跳過');
console.log('');
console.log('Bread 的情況:');
console.log('  10/20~27 結束日是 10/27 (本週一)');
console.log('  開始日 10/20 在週一之前');
console.log('  → 被誤判為「上週的值班」→ 跳過');
console.log('');
console.log('問題:');
console.log('  週一交班邏輯過於嚴格!');
console.log('  Bread 的 10/20~27 應該包含本週一，不應該被跳過');
console.log('  因為值班期間「跨越」週一，不是「結束於」週一前一天');
