// 測試日期解析邏輯
const dateRangeStr = "10/7~12  20~27";
const todayStr = "2025-10-27"; // 週日

// 模擬當週計算
const today = new Date(todayStr);
console.log('DEBUG: 原始日期:', today.toString());
console.log('DEBUG: dayOfWeek (0=Sun, 1=Mon):', today.getDay());

const dayOfWeek = today.getDay(); // 0 = Sunday
const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
console.log('DEBUG: daysToMonday:', daysToMonday);

const monday = new Date(today);
monday.setDate(today.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);
console.log('DEBUG: 計算出的週一:', monday.toString());

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

const currentWeek = {
  start: monday,
  end: sunday,
  startStr: monday.toISOString().split('T')[0],
  endStr: sunday.toISOString().split('T')[0]
};

console.log('=== 測試日期範圍解析 ===');
console.log('今天:', todayStr, '(週日)');
console.log('當週範圍:', currentWeek.startStr, '~', currentWeek.endStr);
console.log('測試字串:', dateRangeStr);
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

// 解析邏輯
const dateStr = dateRangeStr.toString();
const ranges = dateStr.split(/[\s,]+/).filter(r => r.trim());
const weekStart = normaliseToDayStart(currentWeek.start);
const weekEnd = normaliseToDayEnd(currentWeek.end);

console.log('分割後的範圍:', ranges);
console.log('');

let lastUsedMonth = weekStart.getMonth(); // 預設使用當週的月份 (9 = October, 0-indexed)

let matchFound = false;

for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex++) {
  const range = ranges[rangeIndex];
  const trimmedRange = range.trim();
  if (!trimmedRange) continue;

  console.log(`--- 處理範圍 #${rangeIndex + 1}: "${trimmedRange}" ---`);

  if (trimmedRange.includes('~') || trimmedRange.includes('-')) {
    const parts = trimmedRange.split(/[~-]/).map(p => p.trim());
    if (parts.length === 2) {
      let startPart = parts[0];
      let endPart = parts[1];
      let startDate;
      let endDate;
      const currentYear = currentWeek.start.getFullYear();

      console.log(`  開始部分: "${startPart}", 結束部分: "${endPart}"`);

      // 解析開始日期
      if (startPart.includes('/')) {
        startDate = parseDate(startPart, currentWeek.start);
        if (startDate) {
          lastUsedMonth = startDate.getMonth();
          console.log(`  ✅ 解析開始日期: ${startPart} -> ${startDate.toISOString().split('T')[0]} (月份更新為 ${lastUsedMonth + 1})`);
        }
      } else {
        const day = parseInt(startPart, 10);
        if (!isNaN(day)) {
          startDate = new Date(currentYear, lastUsedMonth, day);
          console.log(`  ✅ 使用繼承月份(${lastUsedMonth + 1})補充開始日期: ${day} -> ${startDate.toISOString().split('T')[0]}`);
        }
      }

      // 解析結束日期
      if (endPart.includes('/')) {
        endDate = parseDate(endPart, currentWeek.start);
        if (endDate) {
          lastUsedMonth = endDate.getMonth();
          console.log(`  ✅ 解析結束日期: ${endPart} -> ${endDate.toISOString().split('T')[0]} (月份更新為 ${lastUsedMonth + 1})`);
        }
      } else {
        const day = parseInt(endPart, 10);
        if (!isNaN(day)) {
          if (startDate) {
            endDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
            if (endDate < startDate) {
              endDate.setMonth(endDate.getMonth() + 1);
              console.log(`  ⚠️ 偵測到跨月: ${startDate.toISOString().split('T')[0]} 到 ${endDate.toISOString().split('T')[0]}`);
            } else {
              console.log(`  ✅ 使用開始日期的月份補充結束日期: ${day} -> ${endDate.toISOString().split('T')[0]}`);
            }
            lastUsedMonth = endDate.getMonth();
          } else {
            endDate = new Date(currentYear, lastUsedMonth, day);
            console.log(`  ✅ 使用繼承月份(${lastUsedMonth + 1})補充結束日期: ${day} -> ${endDate.toISOString().split('T')[0]}`);
          }
        }
      }

      if (startDate && endDate) {
        const rangeStart = normaliseToDayStart(startDate);
        const rangeEnd = normaliseToDayEnd(endDate);

        console.log(`  📅 範圍: ${rangeStart.toISOString().split('T')[0]} ~ ${rangeEnd.toISOString().split('T')[0]}`);
        console.log(`  📅 當週: ${weekStart.toISOString().split('T')[0]} ~ ${weekEnd.toISOString().split('T')[0]}`);

        // 週一交班邏輯檢查
        const rangeEndStart = normaliseToDayStart(endDate);
        if (rangeEndStart.getTime() === weekStart.getTime() && rangeStart.getTime() < weekStart.getTime()) {
          console.log(`  ⏭️ 週一交班邏輯觸發: 結束日 ${rangeEndStart.toISOString().split('T')[0]} = 週一 ${weekStart.toISOString().split('T')[0]}, 且開始日在週一之前 -> 跳過`);
          continue;
        } else {
          console.log(`  ℹ️ 週一交班檢查: 不適用`);
        }

        // 重疊判斷
        if (rangeStart.getTime() <= weekEnd.getTime() && rangeEnd.getTime() >= weekStart.getTime()) {
          console.log(`  ✅ 匹配成功! 範圍與當週有重疊`);
          matchFound = true;
        } else {
          console.log(`  ❌ 不匹配: 範圍與當週無重疊`);
        }
      }
    }
  }
  console.log('');
}

console.log('=== 最終結果 ===');
console.log('是否找到匹配:', matchFound ? '✅ 是' : '❌ 否');
console.log('預期結果: ✅ 是 (因為 10/20~27 覆蓋了 10/21~10/27)');
