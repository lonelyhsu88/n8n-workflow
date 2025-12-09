// 完整模擬 PM-Ryan 請假檢測流程

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

console.log('🔍 完整模擬 PM-Ryan 請假檢測流程\n');
console.log('='.repeat(80));

// 模擬設定
const channelMemberIds = ['U07FFHDUTMH', 'U07F14AQ5ST', 'U123456789'];
const channelMemberSet = new Set(channelMemberIds);

const userMap = {
  'U07FFHDUTMH': { name: 'PM-Ryan', isBot: false, deleted: false },
  'U07F14AQ5ST': { name: 'QA-Lisa', isBot: false, deleted: false },
  'U123456789': { name: 'OP-Shou', isBot: false, deleted: false },
};

// 模擬出勤記錄
const attendanceMessages = [
  { text: '12/8-11 <@U07FFHDUTMH> 特休&生日假' },
  { text: '12/8 <@U07F14AQ5ST> 健檢特休' },
  { text: '12/8 <@U123456789> 事假' },
];

// 檢查日期
const targetDate = '2025-12-08';
const targetShortDate = '12/8';
const currentYear = 2025;

const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
const onLeaveMap = new Map();

console.log(`📅 檢查日期: ${targetDate}`);
console.log(`👥 Channel 成員數: ${channelMemberIds.length}`);
console.log(`📋 出勤訊息數: ${attendanceMessages.length}\n`);

// 處理出勤訊息
for (const msg of attendanceMessages) {
  if (!msg.text) continue;

  const text = msg.text;
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📝 處理訊息: "${text}"`);

  // 1. 檢查請假關鍵字
  const hasLeaveKeyword = leaveKeywords.some(keyword => text.includes(keyword));
  console.log(`   [1] 有請假關鍵字: ${hasLeaveKeyword}`);

  if (!hasLeaveKeyword) {
    console.log('   ❌ 跳過: 沒有請假關鍵字');
    continue;
  }

  // 2. 檢查整天請假
  const isFullDay = isFullDayLeave(text);
  console.log(`   [2] 整天請假: ${isFullDay}`);

  if (!isFullDay) {
    console.log('   ❌ 跳過: 不是整天請假');
    continue;
  }

  // 3. 展開日期範圍
  const rangeDates = expandDateRange(text, currentYear);
  console.log(`   [3] 日期範圍展開: [${rangeDates.join(', ')}]`);

  const datesToCheck = new Set(rangeDates);

  // 4. 檢查是否匹配目標日期
  const isInRange = datesToCheck.has(targetDate);
  const includesShortDate = text.includes(targetShortDate);

  console.log(`   [4] 在範圍內 (Set): ${isInRange}`);
  console.log(`   [4] 包含短日期 (includes): ${includesShortDate}`);

  if (!isInRange && !includesShortDate) {
    console.log('   ❌ 跳過: 不匹配目標日期');
    continue;
  }

  // 5. 提取 User ID
  const userIdMatch = text.match(/<@([A-Z0-9]+)>/);
  console.log(`   [5] User ID 匹配: ${userIdMatch ? userIdMatch[1] : '(none)'}`);

  if (userIdMatch && (isInRange || includesShortDate)) {
    const userId = userIdMatch[1];

    // 6. 檢查是否在 channel 成員中
    const inChannel = channelMemberSet.has(userId);
    console.log(`   [6] 在 channel 中: ${inChannel}`);

    if (!channelMemberSet.has(userId)) {
      console.log('   ❌ 跳過: 不在 channel 成員中');
      continue;
    }

    // 7. 取得用戶資訊
    const userName = userMap[userId]?.name || 'Unknown';
    console.log(`   [7] 用戶名稱: ${userName}`);

    // 8. 提取請假類型
    let leaveType = '請假';
    for (const keyword of leaveKeywords) {
      if (text.includes(keyword)) {
        leaveType = keyword;
        break;
      }
    }
    console.log(`   [8] 請假類型: ${leaveType}`);

    // 9. 記錄到 onLeaveMap
    if (!onLeaveMap.has(userId)) {
      onLeaveMap.set(userId, {
        name: userName,
        leaves: []
      });
    }

    const userLeaves = onLeaveMap.get(userId);
    if (!userLeaves.leaves.some(l => l.date === targetDate)) {
      userLeaves.leaves.push({ date: targetDate, type: leaveType });
    }

    console.log(`   ✅ 成功記錄到 onLeaveMap`);
  } else {
    console.log('   ❌ 無法處理: User ID 不匹配或日期不符');
  }
}

// 顯示最終結果
console.log(`\n\n${'='.repeat(80)}`);
console.log('📊 最終結果\n');

console.log(`🏖️ 請假: ${onLeaveMap.size} 人\n`);

if (onLeaveMap.size > 0) {
  console.log('請假名單:');
  const leaveList = Array.from(onLeaveMap.entries())
    .map(([userId, info]) => ({
      userId,
      name: info.name,
      leaves: info.leaves
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const user of leaveList) {
    console.log(`  • ${user.name}`);
    for (const leave of user.leaves) {
      console.log(`    - ${leave.type} on ${leave.date}`);
    }
  }
} else {
  console.log('⚠️ 沒有檢測到任何請假記錄！');
}

console.log('\n' + '='.repeat(80));

// 驗證預期結果
const expectedLeaveCount = 3;
const success = onLeaveMap.size === expectedLeaveCount;

console.log(`\n驗證結果: ${success ? '✅ 通過' : '❌ 失敗'}`);
console.log(`預期請假人數: ${expectedLeaveCount}`);
console.log(`實際請假人數: ${onLeaveMap.size}`);

if (success) {
  console.log('\n✅ PM-Ryan 的日期範圍請假檢測正常！');
} else {
  console.log('\n❌ 檢測邏輯有問題，需要進一步調查');
}
