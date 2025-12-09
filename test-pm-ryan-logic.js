// 測試 PM-Ryan 的請假檢測邏輯
// 模擬實際的資料和邏輯

function expandDateRange(text, currentYear) {
  const expandedDates = [];

  const rangeMatch2 = text.match(/(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})/);
  if (rangeMatch2) {
    const startMonth = parseInt(rangeMatch2[1]);
    const startDay = parseInt(rangeMatch2[2]);
    const endMonth = parseInt(rangeMatch2[3]);
    const endDay = parseInt(rangeMatch2[4]);

    const startDate = new Date(currentYear, startMonth - 1, startDay);
    const endDate = new Date(currentYear, endMonth - 1, endDay);

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      expandedDates.push(`${year}-${month}-${day}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return expandedDates;
  }

  const rangeMatch1 = text.match(/(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})(?!\d*\/)/);
  if (rangeMatch1) {
    const month = parseInt(rangeMatch1[1]);
    const startDay = parseInt(rangeMatch1[2]);
    const endDay = parseInt(rangeMatch1[3]);

    for (let day = startDay; day <= endDay; day++) {
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      expandedDates.push(`${currentYear}-${monthStr}-${dayStr}`);
    }
    return expandedDates;
  }

  return expandedDates;
}

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

console.log('🧪 測試 PM-Ryan 請假檢測邏輯\n');
console.log('='.repeat(80));

// 模擬測試資料
const testMessages = [
  {
    text: '12/8-11 <@U07FFHDUTMH> 特休&生日假',
    name: 'PM-Ryan',
    userId: 'U07FFHDUTMH'
  },
  {
    text: '12/08 <@U07F14AQ5ST> 健檢特休',
    name: 'QA-Lisa',
    userId: 'U07F14AQ5ST'
  },
  {
    text: '12/08 <@U123456789> 事假',
    name: 'OP-Shou',
    userId: 'U123456789'
  }
];

const targetDate = '2025-12-08';
const targetShortDate = '12/8';
const currentYear = 2025;

const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
const onLeaveMap = new Map();

console.log(`\n📅 檢查日期: ${targetDate}`);
console.log(`📋 短日期格式: ${targetShortDate}\n`);

for (const msg of testMessages) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`👤 測試: ${msg.name}`);
  console.log(`📝 訊息: "${msg.text}"`);

  const text = msg.text;

  // 1. 檢查是否有請假關鍵字
  const hasLeaveKeyword = leaveKeywords.some(keyword => text.includes(keyword));
  console.log(`   ✓ 有請假關鍵字: ${hasLeaveKeyword}`);

  if (!hasLeaveKeyword) {
    console.log('   ❌ 跳過: 沒有請假關鍵字');
    continue;
  }

  // 2. 檢查是否為整天請假
  const isFullDay = isFullDayLeave(text);
  console.log(`   ✓ 整天請假: ${isFullDay}`);

  if (!isFullDay) {
    console.log('   ❌ 跳過: 不是整天請假');
    continue;
  }

  // 3. 展開日期範圍
  const rangeDates = expandDateRange(text, currentYear);
  console.log(`   ✓ 日期範圍展開: ${rangeDates.length > 0 ? rangeDates.join(', ') : '(空)'}`);

  const datesToCheck = new Set(rangeDates);

  // 4. 檢查是否匹配目標日期
  const isInRange = datesToCheck.has(targetDate);
  const includesShortDate = text.includes(targetShortDate);

  console.log(`   ✓ 在日期範圍內 (${targetDate}): ${isInRange}`);
  console.log(`   ✓ 包含短日期 (${targetShortDate}): ${includesShortDate}`);

  if (!isInRange && !includesShortDate) {
    console.log('   ❌ 跳過: 不匹配目標日期');
    continue;
  }

  // 5. 提取 User ID
  const userIdMatch = text.match(/<@([A-Z0-9]+)>/);
  if (userIdMatch) {
    const userId = userIdMatch[1];
    console.log(`   ✓ 提取 User ID: ${userId}`);

    // 6. 提取請假類型
    let leaveType = '請假';
    for (const keyword of leaveKeywords) {
      if (text.includes(keyword)) {
        leaveType = keyword;
        break;
      }
    }
    console.log(`   ✓ 請假類型: ${leaveType}`);

    // 7. 記錄到 onLeaveMap
    if (!onLeaveMap.has(userId)) {
      onLeaveMap.set(userId, {
        name: msg.name,
        leaves: []
      });
    }

    const userLeaves = onLeaveMap.get(userId);
    if (!userLeaves.leaves.some(l => l.date === targetDate)) {
      userLeaves.leaves.push({ date: targetDate, type: leaveType });
    }

    console.log(`   ✅ 成功記錄到 onLeaveMap`);
  } else {
    console.log('   ❌ 無法提取 User ID');
  }
}

// 顯示最終結果
console.log(`\n\n${'='.repeat(80)}`);
console.log('📊 最終結果\n');

console.log(`請假人數: ${onLeaveMap.size}\n`);

if (onLeaveMap.size > 0) {
  console.log('請假名單:');
  for (const [userId, info] of onLeaveMap.entries()) {
    console.log(`  • ${info.name} (User ID: ${userId})`);
    for (const leave of info.leaves) {
      console.log(`    - ${leave.type} on ${leave.date}`);
    }
  }
} else {
  console.log('⚠️ 沒有檢測到任何請假記錄！');
}

console.log('\n' + '='.repeat(80));
