// 測試 11 月資料在 10/27 的匹配情況
const today = new Date(2025, 9, 27, 12, 0, 0); // 2025-10-27 (週一)

console.log('=== 測試 11 月值班資料在 10/27 的匹配情況 ===\n');
console.log('今天:', today.toISOString().split('T')[0], '(' + ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][today.getDay()] + ')');
console.log('');

// 計算當週範圍
const dayOfWeek = today.getDay();
const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
const monday = new Date(today);
monday.setDate(today.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

const currentWeek = {
  start: monday,
  end: sunday,
  startStr: monday.toISOString().split('T')[0],
  endStr: sunday.toISOString().split('T')[0]
};

console.log('當週範圍 (10/27 這週):', currentWeek.startStr, '~', currentWeek.endStr);
console.log('');

// Backend 11 月值班資料
const backendDuty = {
  'Bread': '11/10~16  24~30',
  'Joe': '11/1~2',
  'Phoebe': '11/3~9',
  'Owen': '11/17~23'
};

console.log('Backend 11 月值班資料:');
Object.entries(backendDuty).forEach(([person, dates]) => {
  console.log(`  ${person.padEnd(10)} ${dates}`);
});
console.log('');

// 輔助函數
const parseDate = (dateStr, referenceDate) => {
  if (!dateStr) return null;
  const base = referenceDate instanceof Date ? referenceDate : today;
  const year = base.getFullYear();
  const parts = dateStr.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  }
  return null;
};

const normaliseToDayStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const normaliseToDayEnd = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

// 檢查 Bread 的日期範圍
console.log('=== 分析 Bread: "11/10~16  24~30" ===\n');

const breadRange = "11/10~16  24~30";
const ranges = breadRange.split(/[\s,]+/).filter(r => r.trim());
console.log('分割後的範圍:', ranges);
console.log('');

const weekStart = normaliseToDayStart(currentWeek.start);
const weekEnd = normaliseToDayEnd(currentWeek.end);
let lastUsedMonth = weekStart.getMonth(); // 10/27 的月份是 9 (October, 0-indexed)

console.log('初始月份 (從當週推導):', lastUsedMonth, '(0-indexed, 所以 9 = October)');
console.log('');

for (let i = 0; i < ranges.length; i++) {
  const range = ranges[i].trim();
  console.log(`--- 處理範圍 #${i + 1}: "${range}" ---`);

  if (range.includes('~')) {
    const parts = range.split('~').map(p => p.trim());
    let startPart = parts[0];
    let endPart = parts[1];
    let startDate;
    let endDate;
    const currentYear = currentWeek.start.getFullYear();

    console.log(`  開始: "${startPart}", 結束: "${endPart}"`);

    // 解析開始日期
    if (startPart.includes('/')) {
      startDate = parseDate(startPart, currentWeek.start);
      if (startDate) {
        lastUsedMonth = startDate.getMonth();
        console.log(`  ✅ 開始日期: ${startPart} -> ${startDate.toISOString().split('T')[0]}`);
        console.log(`  📅 更新 lastUsedMonth = ${lastUsedMonth} (${lastUsedMonth + 1}月)`);
      }
    } else {
      const day = parseInt(startPart, 10);
      if (!isNaN(day)) {
        startDate = new Date(currentYear, lastUsedMonth, day);
        console.log(`  ✅ 開始日期 (使用月份 ${lastUsedMonth + 1}): ${day} -> ${startDate.toISOString().split('T')[0]}`);
      }
    }

    // 解析結束日期
    if (endPart.includes('/')) {
      endDate = parseDate(endPart, currentWeek.start);
      if (endDate) {
        lastUsedMonth = endDate.getMonth();
        console.log(`  ✅ 結束日期: ${endPart} -> ${endDate.toISOString().split('T')[0]}`);
        console.log(`  📅 更新 lastUsedMonth = ${lastUsedMonth} (${lastUsedMonth + 1}月)`);
      }
    } else {
      const day = parseInt(endPart, 10);
      if (!isNaN(day)) {
        if (startDate) {
          endDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
          if (endDate < startDate) {
            endDate.setMonth(endDate.getMonth() + 1);
            console.log(`  ⚠️ 跨月: ${startDate.toISOString().split('T')[0]} 到 ${endDate.toISOString().split('T')[0]}`);
          } else {
            console.log(`  ✅ 結束日期 (使用開始日期的月份 ${startDate.getMonth() + 1}): ${day} -> ${endDate.toISOString().split('T')[0]}`);
          }
          lastUsedMonth = endDate.getMonth();
        } else {
          endDate = new Date(currentYear, lastUsedMonth, day);
          console.log(`  ✅ 結束日期 (使用月份 ${lastUsedMonth + 1}): ${day} -> ${endDate.toISOString().split('T')[0]}`);
        }
      }
    }

    if (startDate && endDate) {
      const rangeStart = normaliseToDayStart(startDate);
      const rangeEnd = normaliseToDayEnd(endDate);

      console.log(`  📅 範圍: ${rangeStart.toISOString().split('T')[0]} ~ ${rangeEnd.toISOString().split('T')[0]}`);
      console.log(`  📅 當週: ${weekStart.toISOString().split('T')[0]} ~ ${weekEnd.toISOString().split('T')[0]}`);

      // 重疊判斷
      const overlaps = rangeStart.getTime() <= weekEnd.getTime() && rangeEnd.getTime() >= weekStart.getTime();
      console.log(`  ${overlaps ? '✅' : '❌'} 重疊判斷:`, overlaps);
    }
  }
  console.log('');
}

console.log('=== 結論 ===');
console.log('問題: Bread 的值班日期是 11 月，今天是 10/27');
console.log('預期: 不應該匹配到本週 (10/27 這週)');
console.log('');
console.log('可能原因: 腳本的月份繼承邏輯可能出錯');
