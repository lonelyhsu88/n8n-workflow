// 測試新的格式邏輯

// 場景 1: 週一檢查 4 天
console.log('=== 場景 1: 週一檢查 4 天 ===\n');

const mondayData = {
  checkDates: ['2025-12-05', '2025-12-06', '2025-12-07', '2025-12-08'],
  submittedList: [
    {
      name: 'OP-Alice',
      submissions: [
        { date: '2025-12-05', time: '2025-12-05 09:30:00' },
        { date: '2025-12-06', time: '2025-12-06 10:15:00' },
        { date: '2025-12-07', time: '2025-12-07 08:45:00' },
        { date: '2025-12-08', time: '2025-12-08 09:00:00' }
      ]
    },
    {
      name: 'OP-Shou',
      submissions: [
        { date: '2025-12-05', time: '2025-12-05 21:33:05' }
      ]
    },
    {
      name: 'OP-James',
      submissions: [
        { date: '2025-12-05', time: '2025-12-05 22:41:26' }
      ]
    },
    {
      name: 'OP-Bob',
      submissions: [
        { date: '2025-12-05', time: '2025-12-05 10:00:00' },
        { date: '2025-12-08', time: '2025-12-08 09:30:00' }
      ]
    }
  ]
};

let message = '';
const checkDatesCount = mondayData.checkDates.length;

message += `📊 *每日彙報檢查報告*\\n`;
message += `📅 檢查日期: ${mondayData.checkDates.join(', ')}\\n\\n`;

if (mondayData.submittedList.length > 0) {
  message += `*已提交名單:*\\n`;
  for (const item of mondayData.submittedList) {
    if (item.submissions.length === 1) {
      // 只提交 1 次：顯示完整時間
      const fullDateTime = item.submissions[0].time;
      message += `• ${item.name} (submitted at ${fullDateTime})\\n`;
    } else if (item.submissions.length > 1) {
      // 提交多次：單行顯示所有時間
      const times = item.submissions.map(s => s.time).join(', ');
      message += `• ${item.name} (submitted at ${times})\\n`;
    }
  }
}

console.log(message);
console.log('');

// 場景 2: 週二檢查 1 天
console.log('=== 場景 2: 週二檢查 1 天 ===\n');

const tuesdayData = {
  checkDates: ['2025-12-09'],
  submittedList: [
    {
      name: 'OP-Alice',
      submissions: [
        { date: '2025-12-09', time: '2025-12-09 09:00:00' }
      ]
    },
    {
      name: 'OP-Bob',
      submissions: [
        { date: '2025-12-09', time: '2025-12-09 09:30:00' }
      ]
    }
  ]
};

message = '';
const checkDatesCount2 = tuesdayData.checkDates.length;

message += `📊 *每日彙報檢查報告*\\n`;
message += `📅 檢查日期: ${tuesdayData.checkDates.join(', ')}\\n\\n`;

if (tuesdayData.submittedList.length > 0) {
  message += `*已提交名單:*\\n`;
  for (const item of tuesdayData.submittedList) {
    if (item.submissions.length === 1) {
      // 只提交 1 次：顯示完整時間
      const fullDateTime = item.submissions[0].time;
      message += `• ${item.name} (submitted at ${fullDateTime})\\n`;
    } else if (item.submissions.length > 1) {
      // 提交多次：單行顯示所有時間
      const times = item.submissions.map(s => s.time).join(', ');
      message += `• ${item.name} (submitted at ${times})\\n`;
    }
  }
}

console.log(message);
console.log('');

console.log('=== 預期結果驗證 ===');
console.log('週一場景（檢查 4 天）:');
console.log('✓ OP-Alice (提交 4 次) → 顯示所有時間（逗號分隔）');
console.log('✓ OP-Shou (提交 1 次) → 顯示 (submitted at 2025-12-05 21:33:05)');
console.log('✓ OP-James (提交 1 次) → 顯示 (submitted at 2025-12-05 22:41:26)');
console.log('✓ OP-Bob (提交 2 次) → 顯示兩個時間（逗號分隔）');
console.log('');
console.log('週二場景（檢查 1 天）:');
console.log('✓ OP-Alice (提交 1 次) → 顯示 (submitted at 2025-12-09 09:00:00)');
console.log('✓ OP-Bob (提交 1 次) → 顯示 (submitted at 2025-12-09 09:30:00)');
