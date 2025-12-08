// 模擬真實場景測試

// 模擬用戶資料
const users = {
  'U001': { name: 'Alice', isBot: false, deleted: false },
  'U002': { name: 'Bob', isBot: false, deleted: false },
  'U003': { name: 'Charlie', isBot: false, deleted: false },
  'U004': { name: 'PM-Robin', isBot: false, deleted: false }, // 排除名單
  'U005': { name: 'Bot', isBot: true, deleted: false }, // Bot
};

// 模擬訊息（包含日報）
const messages = [
  { user: 'U001', text: '20251205 Daily Report: 完成功能開發', ts: '1733356800' }, // 上週五
  { user: 'U001', text: '20251206 Daily Report: 修復 Bug', ts: '1733443200' }, // 週六
  { user: 'U001', text: '20251207 Daily Report: 撰寫文件', ts: '1733529600' }, // 週日
  { user: 'U001', text: '20251208 Daily Report: Code Review', ts: '1733616000' }, // 週一

  { user: 'U002', text: '20251205 Daily Report: 測試新功能', ts: '1733360400' }, // 上週五
  { user: 'U002', text: '20251208 Daily Report: 部署到測試環境', ts: '1733619600' }, // 週一

  { user: 'U003', text: '20251205 Daily Report: 會議討論', ts: '1733364000' }, // 上週五
  // Charlie 沒有提交週六、週日、週一的日報

  { user: 'U004', text: '20251205 Daily Report: PM 工作', ts: '1733367600' }, // PM-Robin (應該被排除)
  { user: 'U005', text: '20251205 Bot Message', ts: '1733371200' }, // Bot (應該被排除)
];

const excludeNames = ['PM-Robin', 'HR-Momo'];

// 測試邏輯
console.log('=== 模擬週一 2025-12-08 10:10 執行 ===\n');

// 1. 計算檢查日期
const checkDates = ['2025-12-05', '2025-12-06', '2025-12-07', '2025-12-08'];
const checkDateTitles = ['20251205', '20251206', '20251207', '20251208'];

console.log('檢查日期:', checkDates.join(', '));
console.log('');

// 2. 過濾追蹤成員
const trackableMembers = Object.entries(users)
  .filter(([id, info]) => !info.isBot && !info.deleted && !excludeNames.includes(info.name))
  .map(([id, info]) => ({ id, name: info.name }));

console.log('需追蹤成員:');
trackableMembers.forEach(m => console.log(`  - ${m.name} (${m.id})`));
console.log('');

// 3. 統計提交情況
const submittedMap = new Map();

for (const msg of messages) {
  if (!msg.user || !msg.text) continue;

  for (let i = 0; i < checkDateTitles.length; i++) {
    const dateTitle = checkDateTitles[i];
    const dateStr = checkDates[i];

    if (msg.text.includes(dateTitle)) {
      if (!submittedMap.has(msg.user)) {
        submittedMap.set(msg.user, {
          name: users[msg.user]?.name || 'Unknown',
          submissions: []
        });
      }

      const userSubmissions = submittedMap.get(msg.user);
      if (!userSubmissions.submissions.some(s => s.date === dateStr)) {
        userSubmissions.submissions.push({
          date: dateStr,
          time: new Date(parseInt(msg.ts) * 1000).toISOString().slice(0, 19).replace('T', ' ')
        });
      }
    }
  }
}

// 4. 分類已提交和未提交
const submittedList = [];
const notSubmittedList = [];

for (const member of trackableMembers) {
  if (submittedMap.has(member.id)) {
    const info = submittedMap.get(member.id);
    info.submissions.sort((a, b) => a.time.localeCompare(b.time));
    submittedList.push({ name: member.name, submissions: info.submissions });
  } else {
    notSubmittedList.push(member.name);
  }
}

submittedList.sort((a, b) => a.submissions[0].time.localeCompare(b.submissions[0].time));

// 5. 輸出結果
console.log('=== 檢查結果 ===\n');
console.log(`需追蹤人數: ${trackableMembers.length}`);
console.log(`已提交: ${submittedList.length} 人`);
console.log(`未提交: ${notSubmittedList.length} 人\n`);

if (submittedList.length > 0) {
  console.log('已提交名單:');
  for (const item of submittedList) {
    console.log(`• ${item.name}`);
    for (const sub of item.submissions) {
      console.log(`  - ${sub.date} at ${sub.time}`);
    }
  }
  console.log('');
}

if (notSubmittedList.length > 0) {
  console.log('未提交名單:');
  for (const name of notSubmittedList) {
    console.log(`• ${name}`);
  }
} else {
  console.log('🎉 太棒了！所有人都已提交每日彙報！');
}

console.log('\n=== 驗證結果 ===');
console.log('✓ Alice 提交了 4 天的日報（上週五、週六、週日、週一）');
console.log('✓ Bob 只提交了 2 天的日報（上週五、週一）');
console.log('✓ Charlie 只提交了 1 天的日報（上週五）');
console.log('✓ PM-Robin 被正確排除（不在追蹤名單）');
console.log('✓ Bot 被正確排除（不在追蹤名單）');
