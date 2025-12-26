#!/usr/bin/env node
/**
 * 測試假日檢測邏輯
 * 用法: node test-holiday-logic.js [日期]
 * 範例: node test-holiday-logic.js 2025-12-25
 */

// ============================================================================
// 台灣國定假日清單 (2025-2026) - 只包含平日假日
// 更新日期: 2024-12-26
// 資料來源: 行政院人事行政總處
// ============================================================================
const holidays = {
  2025: {
    '2025-01-01': '元旦',           // 週三
    '2025-01-27': '春節初一',       // 週一
    '2025-01-28': '春節初二',       // 週二
    '2025-01-29': '春節初三',       // 週三
    '2025-01-30': '春節初四',       // 週四
    '2025-01-31': '春節初五',       // 週五
    '2025-02-28': '和平紀念日',     // 週五
    '2025-04-03': '兒童節',         // 週四
    '2025-04-04': '清明節',         // 週五
    '2025-05-01': '勞動節',         // 週四
    '2025-05-02': '勞動節調整放假', // 週五
    '2025-05-30': '端午節',         // 週五
    '2025-09-29': '教師節補假',     // 週一
    '2025-10-06': '中秋節',         // 週一
    '2025-10-10': '國慶日',         // 週五
    '2025-10-24': '台灣光復節補假', // 週五
    '2025-12-25': '行憲紀念日'      // 週四
  },
  2026: {
    '2026-01-01': '元旦',              // 週四
    '2026-02-16': '春節初一',          // 週一
    '2026-02-17': '春節初二',          // 週二
    '2026-02-18': '春節初三',          // 週三
    '2026-02-19': '春節初四',          // 週四
    '2026-02-20': '春節初五',          // 週五
    '2026-02-27': '和平紀念日',        // 週五
    '2026-04-03': '兒童節調整放假',    // 週五
    '2026-04-06': '清明節調整放假',    // 週一
    '2026-05-01': '勞動節',            // 週五
    '2026-06-19': '端午節',            // 週五
    '2026-09-25': '中秋節',            // 週五
    '2026-09-28': '教師節',            // 週一
    '2026-10-09': '國慶日調整放假',    // 週五
    '2026-10-26': '台灣光復節調整放假', // 週一
    '2026-12-25': '行憲紀念日'         // 週五
  }
};

function getHolidaysByYear(year) {
  return holidays[year] || {};
}

function isHoliday(dateStr) {
  const year = parseInt(dateStr.substring(0, 4));
  const holidayList = getHolidaysByYear(year);
  return holidayList[dateStr] || null;
}

function getDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[date.getDay()];
}

function testDate(testDateStr) {
  console.log('='.repeat(80));
  console.log(`📅 測試日期: ${testDateStr} (星期${getDayOfWeek(testDateStr)})`);
  console.log('='.repeat(80));

  // 檢查當天是否為假日
  const holidayName = isHoliday(testDateStr);
  if (holidayName) {
    console.log(`✅ 第 1 層檢測: 當天是國定假日`);
    console.log(`   🏖️ ${holidayName}`);
    console.log(`\n📱 預期通知:`);
    console.log(`   🏖️ 今天是國定假日：${holidayName} (${testDateStr})`);
    console.log(`   無需檢查日報，祝您假期愉快！`);
    return;
  } else {
    console.log(`✅ 第 1 層檢測: 當天不是假日，繼續執行`);
  }

  // 計算檢查日期
  const testDate = new Date(testDateStr);
  const dayOfWeek = testDate.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log(`❌ 今天是週末（星期${getDayOfWeek(testDateStr)}），Cron 不會執行`);
    return;
  }

  const targetDates = [];
  if (dayOfWeek === 1) {
    // 週一檢查前4天
    for (let i = 3; i >= 0; i--) {
      const date = new Date(testDate);
      date.setDate(testDate.getDate() - i);
      targetDates.push(date);
    }
  } else {
    // 週二至週五檢查前1天
    const date = new Date(testDate);
    date.setDate(testDate.getDate() - 1);
    targetDates.push(date);
  }

  console.log(`\n🔍 檢查模式: ${dayOfWeek === 1 ? '週一（前4天）' : `週${getDayOfWeek(testDateStr)}（前1天）`}`);
  console.log(`   檢查日期數: ${targetDates.length} 天`);

  // 分類工作日和假日
  const workDays = [];
  const holidayDates = [];

  for (const date of targetDates) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const holidayName = isHoliday(dateStr);
    if (holidayName) {
      holidayDates.push({ date: dateStr, name: holidayName });
    } else {
      workDays.push(dateStr);
    }
  }

  console.log(`\n✅ 第 2 層檢測: 目標日期假日過濾`);
  console.log(`   工作日: ${workDays.length} 天`);
  console.log(`   假日: ${holidayDates.length} 天`);

  if (workDays.length === 0 && holidayDates.length > 0) {
    console.log(`\n🎯 結果: 所有檢查日期都是假日`);
    console.log(`\n📱 預期通知:`);
    const holidayInfo = holidayDates.map(h => `${h.name} (${h.date})`).join('、');
    console.log(`   🏖️ 檢查日期皆為國定假日：${holidayInfo}`);
    console.log(`   無需檢查日報，祝您假期愉快！`);
    return;
  }

  console.log(`\n✅ 第 3 層檢測: 正常檢查 + 假日註記`);

  console.log(`\n📋 檢查清單:`);
  console.log(`   工作日需檢查:`);
  workDays.forEach(d => {
    console.log(`     • ${d} (星期${getDayOfWeek(d)})`);
  });

  if (holidayDates.length > 0) {
    console.log(`   假日已排除:`);
    holidayDates.forEach(h => {
      console.log(`     • ${h.date} (星期${getDayOfWeek(h.date)}) - ${h.name}`);
    });
  }

  console.log(`\n📱 預期通知:`);
  console.log(`   📊 *每日彙報檢查報告*`);
  console.log(`   📅 檢查日期: ${workDays.join(', ')}`);
  console.log(`   ...（正常統計提交狀況）...`);

  if (holidayDates.length > 0) {
    const holidayNote = holidayDates.map(h => `${h.name} (${h.date})`).join('、');
    console.log(`\n   ℹ️ 以下日期為國定假日，已排除：${holidayNote}`);
  }
}

// 主程式
console.log('\n🧪 Gemini 每日彙報 - 假日檢測邏輯測試工具\n');

const testDateStr = process.argv[2];

if (!testDateStr) {
  console.log('用法: node test-holiday-logic.js [日期]');
  console.log('\n範例:');
  console.log('  node test-holiday-logic.js 2025-12-25  # 測試行憲紀念日');
  console.log('  node test-holiday-logic.js 2025-02-03  # 測試春節後週一');
  console.log('  node test-holiday-logic.js 2025-05-05  # 測試勞動節後週一');
  console.log('\n預設測試案例:');

  const testCases = [
    '2025-12-25',  // 行憲紀念日（週四）
    '2025-02-03',  // 春節後週一
    '2025-05-05',  // 勞動節後週一
    '2025-03-11'   // 正常工作日（週二）
  ];

  testCases.forEach(date => {
    testDate(date);
    console.log('\n');
  });
} else {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(testDateStr)) {
    console.error('❌ 錯誤: 日期格式不正確，請使用 YYYY-MM-DD 格式');
    process.exit(1);
  }

  testDate(testDateStr);
  console.log('\n');
}

console.log('='.repeat(80));
console.log('測試完成！');
console.log('='.repeat(80) + '\n');
