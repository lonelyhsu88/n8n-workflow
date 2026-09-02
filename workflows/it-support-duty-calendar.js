/**
 * IT Support 值班表通知 — n8n Code 節點（Mode: Run Once for All Items）
 *
 * 資料來源：Google Calendar「IT Support (on Call)」公開 ICS（無需 Google 憑證）
 *   https://calendar.google.com/calendar/ical/jvdiamondtech.com_kd6pnalr81o4a59aog7onc5joc%40group.calendar.google.com/public/basic.ics
 *
 * 上游節點：HTTP Request（Response Format = Text，輸出欄位為 data）
 * 下游節點：Slack（text = {{ $json.slackMessage }}）
 *
 * 只輸出 TAG_WHITELIST 內的 tag，其餘（FP / FA / FB / FCQA / FG / 鬥雞 / OP-OnCall / 無 tag）忽略。
 *
 * ICS 需處理的特性（依實際日曆內容確認）：
 *   - 全部為 all-day 事件，DTEND 為排他（exclusive）
 *   - RRULE 僅 FREQ=WEEKLY，帶 INTERVAL / COUNT / UNTIL / 單一 BYDAY
 *   - EXDATE 排除特定日期
 *   - RECURRENCE-ID 單次覆寫（同 UID 另一個 VEVENT）
 */

const TAG_WHITELIST = ['ND', 'FC'];
const CALENDAR_URL =
  'https://calendar.google.com/calendar/u/0/embed?src=jvdiamondtech.com_kd6pnalr81o4a59aog7onc5joc@group.calendar.google.com&ctz=Asia/Taipei';

const DAY_MS = 86400000;
const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_OCCURRENCES = 2000; // 無 UNTIL/COUNT 的無限系列安全上限

// ── 取得 ICS 原文 ─────────────────────────────────────────────
const inputJson = $input.first().json;
const icsRaw =
  typeof inputJson.data === 'string'
    ? inputJson.data
    : typeof inputJson.body === 'string'
      ? inputJson.body
      : null;

if (!icsRaw || icsRaw.indexOf('BEGIN:VCALENDAR') === -1) {
  throw new Error(
    'ICS 內容讀取失敗：請確認 HTTP Request 節點的 Response Format 設為 Text（欄位 data）。' +
      `實際收到的 keys: ${Object.keys(inputJson).join(', ') || '(empty)'}`
  );
}

// ── 目標日期（台北時區；可用 targetDate 覆寫以便測試）────────────
const targetDateStr =
  typeof inputJson.targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(inputJson.targetDate)
    ? inputJson.targetDate
    : new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

const targetMs = Date.parse(`${targetDateStr}T00:00:00Z`);
const horizonMs = targetMs + 30 * DAY_MS; // 週期展開只需算到目標日之後一點
const targetDate = new Date(targetMs);
const todayDisplay = `${targetDate.getUTCMonth() + 1}/${targetDate.getUTCDate()} (${
  WEEKDAY_LABELS[targetDate.getUTCDay()]
})`;

console.log(`=== IT Support 值班表（ICS）===`);
console.log(`目標日期(台北): ${targetDateStr} (${todayDisplay})`);

// ── ICS 解析工具 ──────────────────────────────────────────────
// RFC 5545 unfolding：換行後接空白/tab 代表續行
const icsText = icsRaw.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');

const getProp = (block, name) => {
  const m = block.match(new RegExp(`^${name}(?:;[^:\\n]*)?:(.*)$`, 'm'));
  return m ? m[1].trim() : null;
};

const getAllProps = (block, name) => {
  const re = new RegExp(`^${name}(?:;[^:\\n]*)?:(.*)$`, 'gm');
  const out = [];
  let m;
  while ((m = re.exec(block)) !== null) out.push(m[1].trim());
  return out;
};

/** 'YYYYMMDD' 或 'YYYYMMDDTHHMMSSZ' → UTC 午夜 ms */
const toDayMs = (value) => {
  if (!value) return null;
  const d = value.trim().slice(0, 8);
  if (!/^\d{8}$/.test(d)) return null;
  return Date.UTC(Number(d.slice(0, 4)), Number(d.slice(4, 6)) - 1, Number(d.slice(6, 8)));
};

/** ms → 'YYYYMMDD'，用於 RECURRENCE-ID / EXDATE 比對 */
const toDayKey = (ms) => new Date(ms).toISOString().slice(0, 10).replace(/-/g, '');

/** 日曆標題常在人名前掛 emoji（[FC] 😼 Hector / [FA] 🎰 Wonton），只留人名 */
const stripLeadingSymbols = (name) => name.replace(/^[^\p{L}\p{N}]+/u, '').trim();

const parseSummary = (summary) => {
  const m = (summary || '').match(/^\s*\[([^\]]+)\]\s*(.*)$/);
  return {
    tag: m ? m[1].trim().toUpperCase() : '',
    person: stripLeadingSymbols(m ? m[2] : summary || ''),
  };
};

// ── 切出 VEVENT，分離「主事件」與「單次覆寫」────────────────────
const blocks = icsText
  .split('BEGIN:VEVENT')
  .slice(1)
  .map((b) => b.split('END:VEVENT')[0]);

const masters = [];
const overrideKeys = new Set(); // `${uid}|${YYYYMMDD}`
const overrideBlocks = [];

for (const block of blocks) {
  const recurrenceId = getProp(block, 'RECURRENCE-ID');
  if (recurrenceId) {
    const uid = getProp(block, 'UID') || '';
    const key = `${uid}|${toDayKey(toDayMs(recurrenceId))}`;
    overrideKeys.add(key);
    overrideBlocks.push(block);
  } else {
    masters.push(block);
  }
}

console.log(`VEVENT 總數: ${blocks.length}（主事件 ${masters.length} / 單次覆寫 ${overrideBlocks.length}）`);

// ── 展開為「涵蓋目標日」的值班區間 ─────────────────────────────
const occurrences = [];

const pushIfCoversTarget = (summary, startMs, endMs) => {
  if (startMs === null || startMs > targetMs) return;
  const end = endMs !== null && endMs > startMs ? endMs : startMs + DAY_MS; // DTEND 排他，缺值視為 1 天
  if (targetMs >= end) return;
  const { tag, person } = parseSummary(summary);
  if (!TAG_WHITELIST.includes(tag) || !person) return;
  occurrences.push({ tag, person, summary, start: toDayKey(startMs), end: toDayKey(end) });
};

for (const block of masters) {
  const summary = getProp(block, 'SUMMARY');
  const startMs = toDayMs(getProp(block, 'DTSTART'));
  const endMs = toDayMs(getProp(block, 'DTEND'));
  if (!summary || startMs === null) continue;

  const rruleRaw = getProp(block, 'RRULE');
  if (!rruleRaw) {
    pushIfCoversTarget(summary, startMs, endMs);
    continue;
  }

  const rule = {};
  for (const part of rruleRaw.split(';')) {
    const [k, v] = part.split('=');
    if (k) rule[k.toUpperCase()] = v;
  }

  if (rule.FREQ !== 'WEEKLY') {
    // 此日曆目前只有 WEEKLY；其他頻率退化為單次，避免靜默漏資料
    console.log(`⚠️ 未支援的 RRULE FREQ=${rule.FREQ}，以單次事件處理: ${summary}`);
    pushIfCoversTarget(summary, startMs, endMs);
    continue;
  }

  const interval = Math.max(1, parseInt(rule.INTERVAL || '1', 10) || 1);
  const count = rule.COUNT ? parseInt(rule.COUNT, 10) : null;
  const untilMs = rule.UNTIL ? toDayMs(rule.UNTIL) : null;
  const byDay = rule.BYDAY ? rule.BYDAY.split(',').map((d) => d.trim().toUpperCase()) : null;
  const durationMs = endMs !== null && endMs > startMs ? endMs - startMs : DAY_MS;

  const exDates = new Set();
  for (const line of getAllProps(block, 'EXDATE')) {
    for (const v of line.split(',')) {
      const ms = toDayMs(v);
      if (ms !== null) exDates.add(toDayKey(ms));
    }
  }

  const uid = getProp(block, 'UID') || '';
  let emitted = 0;
  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    const occStart = startMs + i * interval * 7 * DAY_MS;
    if (occStart > horizonMs) break;
    if (untilMs !== null && occStart > untilMs) break;
    if (byDay && !byDay.includes(WEEKDAY_CODES[new Date(occStart).getUTCDay()])) continue;

    emitted++;
    if (count !== null && emitted > count) break;

    const dayKey = toDayKey(occStart);
    if (exDates.has(dayKey)) continue; // EXDATE 排除
    if (overrideKeys.has(`${uid}|${dayKey}`)) continue; // 由覆寫事件提供實際日期

    pushIfCoversTarget(summary, occStart, occStart + durationMs);
  }
}

for (const block of overrideBlocks) {
  if ((getProp(block, 'STATUS') || '').toUpperCase() === 'CANCELLED') continue;
  pushIfCoversTarget(
    getProp(block, 'SUMMARY'),
    toDayMs(getProp(block, 'DTSTART')),
    toDayMs(getProp(block, 'DTEND'))
  );
}

// ── 依 tag 分組（去重）───────────────────────────────────────
const seen = new Set();
const groups = new Map(TAG_WHITELIST.map((t) => [t, []]));
for (const occ of occurrences) {
  const key = `${occ.tag}|${occ.person}`;
  if (seen.has(key)) continue;
  seen.add(key);
  groups.get(occ.tag).push(occ.person);
}

const dutyGroups = TAG_WHITELIST.filter((t) => groups.get(t).length > 0).map((t) => ({
  tag: t,
  people: groups.get(t),
}));
const dutyCount = dutyGroups.reduce((sum, g) => sum + g.people.length, 0);
const missingTags = TAG_WHITELIST.filter((t) => groups.get(t).length === 0);

console.log(`命中值班區間: ${occurrences.length} 筆 → 值班人數 ${dutyCount}`);
dutyGroups.forEach((g) => console.log(`  [${g.tag}] ${g.people.join(', ')}`));
if (missingTags.length) console.log(`⚠️ 未排班的 tag: ${missingTags.join(', ')}`);

// ── 組 Slack 訊息 ────────────────────────────────────────────
const CALENDAR_LINK = `:link: <${CALENDAR_URL}|IT Support 值班表>`;

let slackMessage;
if (dutyCount > 0) {
  const roster = TAG_WHITELIST.map((t) => {
    const people = groups.get(t);
    return `:bust_in_silhouette: *${t}* — ${people.length ? people.join(', ') : '(未排班)'}`;
  });

  slackMessage = [`:date: *${todayDisplay}* ｜ IT Support 值班`, '', ...roster, '', CALENDAR_LINK].join(
    '\n'
  );
} else {
  slackMessage = [
    `:warning: *${todayDisplay}* ｜ IT Support 值班 — 未排班`,
    '',
    `查無 ${TAG_WHITELIST.join(' / ')} 的值班事件，請檢查日曆排程。`,
    '',
    CALENDAR_LINK,
  ].join('\n');
}

return [
  {
    json: {
      targetDate: targetDateStr,
      todayDisplay,
      dutyCount,
      hasDuty: dutyCount > 0,
      dutyGroups,
      missingTags,
      matchedEvents: occurrences,
      slackMessage,
    },
  },
];
