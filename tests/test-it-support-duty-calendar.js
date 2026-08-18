/**
 * workflows/it-support-duty-calendar.js（n8n Code 節點）本地驗證
 *
 * 用法：
 *   node tests/test-it-support-duty-calendar.js            # 用線上 ICS 跑（需連外）
 *   node tests/test-it-support-duty-calendar.js path/to.ics # 用本地 ICS 快照跑
 *
 * 驗證方式：以 Google Calendar 畫面實際顯示的值班人員為期望值。
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CODE_PATH = path.join(__dirname, '..', 'workflows', 'it-support-duty-calendar.js');
const ICS_URL =
  'https://calendar.google.com/calendar/ical/jvdiamondtech.com_kd6pnalr81o4a59aog7onc5joc%40group.calendar.google.com/public/basic.ics';

// 期望值來源：Google Calendar 週檢視畫面（2026-07-27 為使用者提供的截圖）
const CASES = [
  { date: '2026-07-27', expect: { ND: 'Wayne', FC: '😼 Henry', FP: 'Stephanie' } },
  { date: '2026-07-20', expect: { ND: 'K11', FC: '😼 Ziv', FP: 'Bruce' } },
  { date: '2026-07-25', expect: { ND: 'K11', FC: '😼 Ziv', FP: 'Stephanie' } },
  { date: '2026-08-18', expect: { ND: 'Wayne', FC: '😼 Hector', FP: 'Ricky' } },
];

function fetchIcs() {
  const local = process.argv[2];
  if (local) return Promise.resolve(fs.readFileSync(local, 'utf8'));
  return new Promise((resolve, reject) => {
    https
      .get(ICS_URL, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`ICS HTTP ${res.statusCode}`));
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(body));
      })
      .on('error', reject);
  });
}

function runCodeNode(ics, targetDate) {
  const src = fs.readFileSync(CODE_PATH, 'utf8');
  const $input = { first: () => ({ json: { data: ics, targetDate } }) };
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args.join(' '));
  try {
    // eslint-disable-next-line no-new-func
    return { result: new Function('$input', src)($input), logs };
  } finally {
    console.log = originalLog;
  }
}

(async () => {
  const ics = await fetchIcs();
  console.log(`ICS 載入: ${ics.length} bytes\n`);

  let failed = 0;
  for (const testCase of CASES) {
    const { result } = runCodeNode(ics, testCase.date);
    const actual = {};
    for (const g of result[0].json.dutyGroups) actual[g.tag] = g.people.join(', ');

    const tags = [...new Set([...Object.keys(testCase.expect), ...Object.keys(actual)])].sort();
    const diffs = tags.filter((t) => (testCase.expect[t] || '(none)') !== (actual[t] || '(none)'));

    if (diffs.length === 0) {
      console.log(`✅ ${testCase.date}  ${tags.map((t) => `[${t}]${actual[t]}`).join('  ')}`);
    } else {
      failed++;
      console.log(`❌ ${testCase.date}`);
      for (const t of diffs) {
        console.log(`   [${t}] 期望="${testCase.expect[t] || '(none)'}" 實際="${actual[t] || '(none)'}"`);
      }
    }
  }

  console.log('\n--- Slack 訊息預覽（第一個案例）---');
  console.log(runCodeNode(ics, CASES[0].date).result[0].json.slackMessage);

  if (failed > 0) {
    console.error(`\n${failed}/${CASES.length} 案例失敗`);
    process.exit(1);
  }
  console.log(`\n${CASES.length}/${CASES.length} 案例通過`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
