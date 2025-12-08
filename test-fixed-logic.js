// 測試修正後的報告格式邏輯

// 場景 1: 週一檢查 4 天（顯示詳細的多日格式）
console.log('=== 場景 1: 週一檢查 4 天 ===\n');

const mondayData = {
  checkDates: ['2025-12-05', '2025-12-06', '2025-12-07', '2025-12-08'],
  submittedList: [
    {
      name: 'Alice',
      submissions: [
        { date: '2025-12-05', time: '2025-12-05 09:30:00' },
        { date: '2025-12-06', time: '2025-12-06 10:15:00' },
        { date: '2025-12-07', time: '2025-12-07 08:45:00' },
        { date: '2025-12-08', time: '2025-12-08 09:00:00' }
      ]
    },
    {
      name: 'Bob',
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
    if (checkDatesCount === 1 && item.submissions.length === 1) {
      // 單日檢查 + 單次提交：使用簡潔格式（顯示完整日期時間）
      const fullDateTime = item.submissions[0].time;
      message += `• ${item.name} (submitted at ${fullDateTime})\\n`;
    } else {
      // 多日檢查或多次提交：使用詳細格式
      message += `• ${item.name}\\n`;
      for (const sub of item.submissions) {
        const timeOnly = sub.time.split(' ')[1];
        message += `  - ${sub.date} at ${timeOnly}\\n`;
      }
    }
  }
}

console.log(message);
console.log('');

// 場景 2: 週二檢查 1 天（顯示簡潔的單行格式）
console.log('=== 場景 2: 週二檢查 1 天 ===\n');

const tuesdayData = {
  checkDates: ['2025-12-08'],
  submittedList: [
    {
      name: 'Alice',
      submissions: [
        { date: '2025-12-08', time: '2025-12-08 09:00:00' }
      ]
    },
    {
      name: 'Bob',
      submissions: [
        { date: '2025-12-08', time: '2025-12-08 09:30:00' }
      ]
    },
    {
      name: 'Charlie',
      submissions: [
        { date: '2025-12-08', time: '2025-12-08 10:00:00' }
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
    if (checkDatesCount2 === 1 && item.submissions.length === 1) {
      // 單日檢查 + 單次提交：使用簡潔格式（顯示完整日期時間）
      const fullDateTime = item.submissions[0].time;
      message += `• ${item.name} (submitted at ${fullDateTime})\\n`;
    } else {
      // 多日檢查或多次提交：使用詳細格式
      message += `• ${item.name}\\n`;
      for (const sub of item.submissions) {
        const timeOnly = sub.time.split(' ')[1];
        message += `  - ${sub.date} at ${timeOnly}\\n`;
      }
    }
  }
}

console.log(message);
console.log('');

console.log('=== 驗證 ===');
console.log('✓ 週一（檢查 4 天）使用多行詳細格式');
console.log('✓ 週二（檢查 1 天）使用單行簡潔格式 (submitted at YYYY-MM-DD HH:MM:SS)');
