// 測試修復後的邏輯
const dateRangeStr = "10/7~12  20~27";
const todayStr = "2025-10-27"; // 週一

// 創建今天的日期
const today = new Date(2025, 9, 27, 12, 0, 0); // 2025-10-27 中午

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

console.log('=== 測試修復後的日期匹配邏輯 ===');
console.log('今天:', todayStr, '(週一)');
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

// 修復後的邏輯（移除週一交班邏輯）
const checkDateOverlap = (dateRangeStr, currentWeek) => {
  if (!dateRangeStr) return false;

  const dateStr = dateRangeStr.toString();
  const ranges = dateStr.split(/[\s,]+/).filter(r => r.trim());
  const weekStart = normaliseToDayStart(currentWeek.start);
  const weekEnd = normaliseToDayEnd(currentWeek.end);

  let lastUsedMonth = weekStart.getMonth();

  for (const range of ranges) {
    const trimmedRange = range.trim();
    if (!trimmedRange) continue;

    if (trimmedRange.includes('~') || trimmedRange.includes('-')) {
      const parts = trimmedRange.split(/[~-]/).map(p => p.trim());
      if (parts.length === 2) {
        let startPart = parts[0];
        let endPart = parts[1];
        let startDate;
        let endDate;
        const currentYear = currentWeek.start.getFullYear();

        // 解析開始日期
        if (startPart.includes('/')) {
          startDate = parseDate(startPart, currentWeek.start);
          if (startDate) {
            lastUsedMonth = startDate.getMonth();
          }
        } else {
          const day = parseInt(startPart, 10);
          if (!isNaN(day)) {
            startDate = new Date(currentYear, lastUsedMonth, day);
          }
        }

        // 解析結束日期
        if (endPart.includes('/')) {
          endDate = parseDate(endPart, currentWeek.start);
          if (endDate) {
            lastUsedMonth = endDate.getMonth();
          }
        } else {
          const day = parseInt(endPart, 10);
          if (!isNaN(day)) {
            if (startDate) {
              endDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
              if (endDate < startDate) {
                endDate.setMonth(endDate.getMonth() + 1);
              }
              lastUsedMonth = endDate.getMonth();
            } else {
              endDate = new Date(currentYear, lastUsedMonth, day);
            }
          }
        }

        if (startDate && endDate) {
          const rangeStart = normaliseToDayStart(startDate);
          const rangeEnd = normaliseToDayEnd(endDate);

          console.log(`範圍: ${rangeStart.toISOString().split('T')[0]} ~ ${rangeEnd.toISOString().split('T')[0]}`);
          console.log(`當週: ${weekStart.toISOString().split('T')[0]} ~ ${weekEnd.toISOString().split('T')[0]}`);

          // ✅ 修復：直接使用範圍重疊判斷，不做週一交班檢查
          if (rangeStart.getTime() <= weekEnd.getTime() && rangeEnd.getTime() >= weekStart.getTime()) {
            console.log('✅ 匹配成功!\n');
            return true;
          } else {
            console.log('❌ 不匹配\n');
          }
        }
      }
    }
  }
  return false;
};

const result = checkDateOverlap(dateRangeStr, currentWeek);

console.log('=== 測試結果 ===');
console.log('Bread (10/7~12  20~27) 匹配本週?', result ? '✅ 是' : '❌ 否');
console.log('預期結果: ✅ 是');
console.log('');
console.log('結論:', result ? '✅ 修復成功！' : '❌ 仍有問題');
