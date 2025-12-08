// 測試日期計算邏輯

function calculateTargetDates(testDate) {
  const taipeiOffset = 8 * 60; // UTC+8 in minutes
  const now = testDate || new Date();
  const localOffset = now.getTimezoneOffset();
  const taipeiTime = new Date(now.getTime() + (taipeiOffset + localOffset) * 60 * 1000);

  const dayOfWeek = taipeiTime.getDay();
  const targetDates = [];

  if (dayOfWeek === 1) {
    // 週一：檢查上週五、週六、週日、週一（4天）
    for (let i = 3; i >= 0; i--) {
      const date = new Date(taipeiTime);
      date.setDate(taipeiTime.getDate() - i);
      targetDates.push(date);
    }
  } else if (dayOfWeek >= 2 && dayOfWeek <= 5) {
    // 週二到週五：只檢查前一天
    const date = new Date(taipeiTime);
    date.setDate(taipeiTime.getDate() - 1);
    targetDates.push(date);
  }

  return targetDates.map(date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
}

// 測試各種情境
console.log('=== 測試日期計算邏輯 ===\n');

// 測試 1: 週一 12/8
const monday = new Date('2025-12-08T10:10:00+08:00');
console.log('測試 1: 週一 2025-12-08 10:10');
console.log('檢查日期:', calculateTargetDates(monday));
console.log('預期: ["2025-12-05", "2025-12-06", "2025-12-07", "2025-12-08"]');
console.log('');

// 測試 2: 週二 12/9
const tuesday = new Date('2025-12-09T10:10:00+08:00');
console.log('測試 2: 週二 2025-12-09 10:10');
console.log('檢查日期:', calculateTargetDates(tuesday));
console.log('預期: ["2025-12-08"]');
console.log('');

// 測試 3: 週三 12/10
const wednesday = new Date('2025-12-10T10:10:00+08:00');
console.log('測試 3: 週三 2025-12-10 10:10');
console.log('檢查日期:', calculateTargetDates(wednesday));
console.log('預期: ["2025-12-09"]');
console.log('');

// 測試 4: 週四 12/11
const thursday = new Date('2025-12-11T10:10:00+08:00');
console.log('測試 4: 週四 2025-12-11 10:10');
console.log('檢查日期:', calculateTargetDates(thursday));
console.log('預期: ["2025-12-10"]');
console.log('');

// 測試 5: 週五 12/12
const friday = new Date('2025-12-12T10:10:00+08:00');
console.log('測試 5: 週五 2025-12-12 10:10');
console.log('檢查日期:', calculateTargetDates(friday));
console.log('預期: ["2025-12-11"]');
