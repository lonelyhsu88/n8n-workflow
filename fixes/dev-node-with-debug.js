// ═══════════════════════════════════════
// 🔍 DEBUG 區塊（診斷完後可刪除）
// ═══════════════════════════════════════

const items = $input.all();

console.log("=== 🔍 DEBUG: 診斷開始 ===");
console.log("總筆數:", items.length);

// 印出前 3 筆資料
console.log("\n=== 前 3 筆原始資料 ===");
items.slice(0, 3).forEach((item, idx) => {
  console.log(`\n第 ${idx + 1} 筆:`, JSON.stringify(item.json, null, 2));
});

// 檢查欄位名稱
if (items.length > 0) {
  const keys = Object.keys(items[0].json);
  console.log("\n=== 欄位名稱 ===");
  console.log(keys);
  console.log("\n各欄位對應:");
  keys.forEach((key, idx) => {
    console.log(`  ${String.fromCharCode(65 + idx)} 欄 (col_${idx}): ${key}`);
  });
}

// 搜尋包含 "1/5" 的資料
console.log("\n=== 搜尋包含 '1/5' 的資料 ===");
const matchingItems = items.filter(item => {
  const str = JSON.stringify(item.json);
  return str.includes('1/5');
});
console.log(`找到 ${matchingItems.length} 筆包含 '1/5' 的資料`);
matchingItems.slice(0, 3).forEach((item, idx) => {
  console.log(`\n匹配第 ${idx + 1} 筆:`, JSON.stringify(item.json, null, 2));
});

console.log("\n=== 🔍 DEBUG: 診斷結束 ===\n");

// ═══════════════════════════════════════
// 以下是原本的值班表處理邏輯
// ═══════════════════════════════════════

const rawToday = new Date();
console.log('=== 值班表處理系統（跨年修復版 v2.0）===');
console.log('原始 UTC 時間:', rawToday.toISOString());

// ✅ 修正：正確獲取台北時間（UTC+8）
// 直接使用 rawToday，所有格式化都指定 timeZone: 'Asia/Taipei'
const today = rawToday;
const taipeiDateStr = today.toLocaleString('zh-TW', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});
console.log('台北時間:', taipeiDateStr);

// 清理數據函數
const cleanData = (value) => {
  if (value === '[empty]' || value === 'empty' || value === null || value === undefined || value === '') {
    return '';
  }
  return value;
};

// ✅ 獲取台北時區的年月日，用於週數計算
const taipeiParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).formatToParts(today);

const taipeiDate = {};
taipeiParts.forEach(({ type, value }) => {
  if (type !== 'literal') taipeiDate[type] = value;
});

// 創建用於計算的 Date 物件（基於台北時區的年月日）
const todayForCalc = new Date(
  parseInt(taipeiDate.year),
  parseInt(taipeiDate.month) - 1,
  parseInt(taipeiDate.day),
  12, 0, 0 // 設定為中午，避免夏令時問題
);

console.log('計算用日期:', `${taipeiDate.year}-${taipeiDate.month}-${taipeiDate.day}`);

// 修正的週數計算函數
const getWeekRange = (date) => {
  console.log('計算週數，輸入日期:', date.toString());
  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  console.log('當週星期一:', monday.toISOString().split('T')[0]);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  console.log('當週星期日:', sunday.toISOString().split('T')[0]);

  // ISO 8601 週數計算
  const year = monday.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const jan4DayOfWeek = jan4.getDay();
  const daysToJan4Monday = jan4DayOfWeek === 0 ? -6 : 1 - jan4DayOfWeek;
  const jan4Monday = new Date(jan4);
  jan4Monday.setDate(jan4.getDate() + daysToJan4Monday);
  jan4Monday.setHours(0, 0, 0, 0);

  const weekNumber = Math.floor((monday - jan4Monday) / (7 * 24 * 60 * 60 * 1000)) + 1;
  console.log('計算週數:', weekNumber);

  return {
    start: monday,
    end: sunday,
    startStr: monday.toISOString().split('T')[0],
    endStr: sunday.toISOString().split('T')[0],
    weekNumber,
    year: monday.getFullYear()
  };
};

const currentWeek = getWeekRange(todayForCalc);
console.log('當週範圍:', currentWeek.startStr, '至', currentWeek.endStr);
console.log('週數:', currentWeek.weekNumber);

// 清理所有數據並統一列名
const allData = [];
for (let i = 0; i < items.length; i++) {
  const data = items[i].json;
  const keys = Object.keys(data);
  const monthColumn = keys.find(key => key.includes('/') && key.includes('-')) || keys[1];
  const personColumn = keys.find(key => key.includes('值班人員') || key === 'col_2') || keys[2];
  // ✅ 修正：值班日期欄位實際上在 keys[3]（欄位名稱：「值班日期」）
  const dutyColumn = keys.find(key => key.includes('值班日期')) || keys[3];

  const cleanedRow = {
    row: i,
    A: cleanData(data[monthColumn] || data[keys[1]]),
    B: cleanData(data[personColumn] || data[keys[2]]),
    C: cleanData(data[keys[3]]),
    D: cleanData(data[keys[4]]),
    // ✅ 修正：從 keys[3] 讀取值班日期，而非 keys[5]
    E: cleanData(data[dutyColumn] || data[keys[3]])
  };
  allData.push(cleanedRow);
}
console.log('清理數據行數:', allData.length);

const targetData = allData;
const nameCorrections = { 'Joebe': 'Phoebe', 'Phonebe': 'Phoebe', 'Joe': 'Joe' };
const deptIcons = {
  'SEG Manager': '👔',
  'Backend': '⚜️',
  'DevOps': '🔧',
  'QA': '🔍',
  'OP': '💎'
};

const monthDayFormatter = new Intl.DateTimeFormat('zh-TW', {
  month: 'numeric',
  day: 'numeric',
  timeZone: 'Asia/Taipei'
});
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Asia/Taipei' });
const todayMonthDay = monthDayFormatter
  .format(today)
  .replace('月', '/')
  .replace('日', '');
const todayWeekday = weekdayFormatter.format(today);
const todayDisplay = `${todayMonthDay} ${todayWeekday}`;

// 🔧 修復：智能年份判斷，支援跨年解析
const parseDate = (dateStr, referenceDate) => {
  if (!dateStr) return null;
  const base = referenceDate instanceof Date ? referenceDate : todayForCalc;
  const parts = dateStr.split('/');

  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);

    if (!isNaN(month) && !isNaN(day)) {
      let year = base.getFullYear();
      const currentMonth = base.getMonth() + 1; // 1-12

      // 🔧 跨年智能判斷：
      // 如果解析的月份是12月，且當前是1-3月，可能是去年的日期
      if (month === 12 && currentMonth >= 1 && currentMonth <= 3) {
        year = year - 1;
        console.log(`⚠️ 跨年偵測：${month}/${day} 判斷為 ${year}年（當前月份：${currentMonth}）`);
      }
      // 如果解析的月份是1-3月，且當前是12月，可能是明年的日期
      else if (month >= 1 && month <= 3 && currentMonth === 12) {
        year = year + 1;
        console.log(`⚠️ 跨年偵測：${month}/${day} 判斷為 ${year}年（當前月份：${currentMonth}）`);
      }

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

// ✅ 修正：支援月份繼承格式 "10/7~12  20~27"
// 檢查值班日期範圍是否包含「今天」（而非「本週」）
const checkDateOverlap = (dateRangeStr, currentWeek) => {
  if (!dateRangeStr) return false;
  console.log(`檢查日期重疊: "${dateRangeStr}" vs 今天 ${taipeiDate.year}-${taipeiDate.month}-${taipeiDate.day}`);

  const dateStr = dateRangeStr.toString();
  const ranges = dateStr.split(/[\s,]+/).filter(r => r.trim());
  // 改用「今天」而非「週範圍」
  const todayStart = normaliseToDayStart(todayForCalc);
  const todayEnd = normaliseToDayEnd(todayForCalc);

  // ✅ 新增：追蹤最後使用的月份，用於處理 "10/7~12  20~27" 這種格式
  let lastUsedMonth = todayStart.getMonth(); // 預設使用今天的月份

  for (const range of ranges) {
    const trimmedRange = range.trim();
    if (!trimmedRange) continue;

    // 處理範圍格式: mm/dd-mm/dd, mm/dd~mm/dd, mm/dd-dd, dd~dd
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
            lastUsedMonth = startDate.getMonth(); // ✅ 更新最後使用的月份
            console.log(`解析到月份: ${lastUsedMonth + 1}, 日期: ${startDate.toISOString().split('T')[0]}`);
          }
        } else {
          // 僅日期，使用最後的月份（繼承前面範圍的月份）
          const day = parseInt(startPart, 10);
          if (!isNaN(day)) {
            startDate = new Date(currentYear, lastUsedMonth, day);
            console.log(`使用繼承月份(${lastUsedMonth + 1})補充開始日期: ${day} -> ${startDate.toISOString().split('T')[0]}`);
          }
        }

        // 解析結束日期
        if (endPart.includes('/')) {
          endDate = parseDate(endPart, currentWeek.start);
          if (endDate) {
            lastUsedMonth = endDate.getMonth(); // ✅ 更新最後使用的月份
            console.log(`解析到月份: ${lastUsedMonth + 1}, 日期: ${endDate.toISOString().split('T')[0]}`);
          }
        } else {
          // 僅日期
          const day = parseInt(endPart, 10);
          if (!isNaN(day)) {
            if (startDate) {
              // ✅ 修正：處理跨月情況
              endDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
              // 如果結束日小於開始日，表示跨月，月份+1
              if (endDate < startDate) {
                endDate.setMonth(endDate.getMonth() + 1);
                console.log(`偵測到跨月範圍: ${startPart}-${endPart} -> ${startDate.toISOString().split('T')[0]} 到 ${endDate.toISOString().split('T')[0]}`);
              }
              lastUsedMonth = endDate.getMonth(); // ✅ 更新最後使用的月份
            } else {
              endDate = new Date(currentYear, lastUsedMonth, day);
            }
            console.log(`使用繼承月份(${lastUsedMonth + 1})補充結束日期: ${day} -> ${endDate.toISOString().split('T')[0]}`);
          }
        }

        if (startDate && endDate) {
          const rangeStart = normaliseToDayStart(startDate);
          const rangeEnd = normaliseToDayEnd(endDate);

          console.log(`範圍檢查: ${rangeStart.toISOString().split('T')[0]} 到 ${rangeEnd.toISOString().split('T')[0]}`);
          console.log(`今天: ${todayStart.toISOString().split('T')[0]}`);

          // 使用範圍包含判斷：只要值班期間包含今天就算匹配
          if (rangeStart.getTime() <= todayEnd.getTime() && rangeEnd.getTime() >= todayStart.getTime()) {
            console.log('✅ 今天在值班期間內!');
            return true;
          } else {
            console.log('❌ 今天不在值班期間內');
          }
        }
      }
    } else {
      // 處理單日格式
      let singleDate;
      if (trimmedRange.includes('/')) {
        singleDate = parseDate(trimmedRange, currentWeek.start);
        if (singleDate) {
          lastUsedMonth = singleDate.getMonth(); // ✅ 更新最後使用的月份
          console.log(`解析到月份: ${lastUsedMonth + 1}, 日期: ${singleDate.toISOString().split('T')[0]}`);
        }
      } else {
        const day = parseInt(trimmedRange, 10);
        if (!isNaN(day)) {
          singleDate = new Date(currentWeek.start.getFullYear(), lastUsedMonth, day);
          console.log(`使用繼承月份(${lastUsedMonth + 1})補充單日: ${day} -> ${singleDate.toISOString().split('T')[0]}`);
        }
      }

      if (singleDate) {
        const singleDayStart = normaliseToDayStart(singleDate);
        const singleDayEnd = normaliseToDayEnd(singleDate);
        console.log(`單日檢查: ${singleDayStart.toISOString().split('T')[0]}`);

        if (singleDayStart.getTime() <= todayEnd.getTime() && singleDayEnd.getTime() >= todayStart.getTime()) {
          console.log('✅ 單日匹配今天!');
          return true;
        } else {
          console.log('❌ 單日不是今天');
        }
      }
    }
  }
  return false;
};

const shouldSkipRow = (row) => {
  return row.A === 'Total' || row.B === 'Total' ||
         (row.A && row.A.toLowerCase().includes('total')) ||
         (row.B && row.B.toLowerCase().includes('total')) ||
         (!row.A && !row.B && !row.E);
};

const currentWeekDuty = [];
const departmentGroups = {};
let currentDepartment = '';
const knownDepartments = ['SEG Manager', 'Backend', 'DevOps', 'QA', 'OP'];
const personDeptMapping = {
  'Dean': 'SEG Manager',
  'Owen': 'SEG Manager',
  'Bread': 'Backend',
  'Joe': 'Backend',
  'Phoebe': 'Backend',
  'Lonely': 'DevOps',
  'Ollie': 'DevOps',
  'Lisa': 'QA',
  'Jason': 'QA',
  'Shelby': 'QA',
  'Shou': 'OP',
  'James': 'OP'
};
const devopsOpMapping = {
  'Lonely': 'Shou',
  'Ollie': 'James'
};

console.log('開始解析值班人員...');
for (let i = 0; i < targetData.length; i++) {
  const row = targetData[i];
  if (shouldSkipRow(row)) continue;
  console.log(`處理第${i + 1}行:`, JSON.stringify(row, null, 2));

  if (row.A && knownDepartments.includes(row.A)) {
    currentDepartment = row.A;
    console.log(`🏢 設定部門: ${currentDepartment}`);

    if (row.B && row.B !== currentDepartment && !row.B.toLowerCase().includes('total')) {
      let person = row.B;
      const dutyDates = row.E;
      if (nameCorrections[person]) person = nameCorrections[person];
      console.log(`檢查部門內人員: ${person}, 值班日期: ${dutyDates}`);

      if (dutyDates && checkDateOverlap(dutyDates, currentWeek)) {
        console.log(`✅ ${person} (${currentDepartment}) 在當週值班 - 值班期間: ${dutyDates}`);
        currentWeekDuty.push({ person, department: currentDepartment, dutyRange: dutyDates });
        if (!departmentGroups[currentDepartment]) departmentGroups[currentDepartment] = [];
        if (!departmentGroups[currentDepartment].find(p => p.person === person)) {
          departmentGroups[currentDepartment].push({ person, department: currentDepartment });
        }
      } else {
        console.log(`❌ ${person} (${currentDepartment}) 不在當週值班 - 值班期間: ${dutyDates}`);
      }
    }
    continue;
  }

  if (row.B && !row.B.toLowerCase().includes('total') && row.B !== '[empty]') {
    let person = row.B;
    const dutyDates = row.E;
    if (nameCorrections[person]) person = nameCorrections[person];
    console.log(`檢查獨立人員: ${person}, 值班日期: ${dutyDates}`);

    let assignedDept = currentDepartment;
    if (personDeptMapping[person]) {
      assignedDept = personDeptMapping[person];
      console.log(`從映射表找到 ${person} 屬於 ${assignedDept}`);

      if (person === 'Owen' && currentDepartment) {
        if (currentDepartment === 'SEG Manager' || currentDepartment === 'Backend') {
          assignedDept = currentDepartment;
          console.log(`Owen 根據上下文歸類為: ${assignedDept}`);
        }
      }
    } else if (!assignedDept) {
      assignedDept = 'General';
    }

    if (dutyDates && checkDateOverlap(dutyDates, currentWeek)) {
      console.log(`✅ ${person} (${assignedDept}) 在當週值班 - 值班期間: ${dutyDates}`);
      currentWeekDuty.push({ person, department: assignedDept, dutyRange: dutyDates });
      if (!departmentGroups[assignedDept]) departmentGroups[assignedDept] = [];
      if (!departmentGroups[assignedDept].find(p => p.person === person)) {
        departmentGroups[assignedDept].push({ person, department: assignedDept });
      }
    } else {
      console.log(`❌ ${person} (${assignedDept}) 不在當週值班 - 值班期間: ${dutyDates}`);
    }
  }
}

const totalPeople = Object.values(departmentGroups).flat().length;
console.log('總值班人數:', totalPeople);

// DevOps-OP 對應關係
if (departmentGroups['DevOps']) {
  const devOpsPeople = departmentGroups['DevOps'];
  for (const devOpsPerson of devOpsPeople) {
    const correspondingOp = devopsOpMapping[devOpsPerson.person];
    if (correspondingOp) {
      console.log(`DevOps ${devOpsPerson.person} 對應 OP ${correspondingOp}`);
      if (!departmentGroups['OP']) departmentGroups['OP'] = [];
      if (!departmentGroups['OP'].find(p => p.person === correspondingOp)) {
        departmentGroups['OP'].push({ person: correspondingOp, department: 'OP' });
        console.log(`✅ 自動添加對應的 OP 人員: ${correspondingOp}`);
      }
    }
  }
}

const finalTotalPeople = Object.values(departmentGroups).flat().length;
console.log('最終總值班人數:', finalTotalPeople);

// 生成 Slack 訊息
let slackMessage = '';
if (finalTotalPeople > 0) {
  const headerLine = `:date: *第${currentWeek.weekNumber}週* ｜ ${currentWeek.startStr} → ${currentWeek.endStr}`;
  const separator = '━━━━━━━━━━━━━━━━━━━━━━━━';
  const teamTitle = `:busts_in_silhouette: *今日(${todayDisplay})值班人員* ｜ ${finalTotalPeople} 人`;
  const deptEntries = Object.entries(departmentGroups);
  const deptLines = deptEntries.map(([dept, people], index) => {
    const icon = deptIcons[dept] || '📋';
    const names = people.map(p => p.person).join(', ');
    const prefix = index === deptEntries.length - 1 ? '└─' : '├─';
    return `${prefix} ${icon} *${dept}* ｜ ${names}`;
  });

  slackMessage = [
    headerLine,
    separator,
    teamTitle,
    ...deptLines,
    separator,
    ':link: <https://docs.google.com/spreadsheets/d/1YC91xSd1UNjoMup8srAWHVv7Ipn4RNCh/edit?gid=740610504#gid=740610504|值班人員通訊錄>'
  ].join('\n');
} else {
  slackMessage = [
    `:warning: *今日(${todayDisplay})值班人員* ｜ 未排班`,
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '請檢查值班表或聯絡管理員確認排程。',
    '',
    `:date: 週次：W${currentWeek.weekNumber}`,
    `:spiral_calendar_pad: 日期：${currentWeek.startStr} → ${currentWeek.endStr}`,
    '',
    '@duty-manager',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    ':link: <https://docs.google.com/spreadsheets/d/1YC91xSd1UNjoMup8srAWHVv7Ipn4RNCh/edit?gid=740610504#gid=740610504|值班人員通訊錄>'
  ].join('\n');
}

return [{
  json: {
    currentWeek,
    totalPeople: finalTotalPeople,
    hasDutyPeople: finalTotalPeople > 0,
    dutyPersonnel: currentWeekDuty,
    departmentGroups,
    slackMessage,
    searchInfo: {
      matchType: '跨年修復版 v2.0 with DEBUG',
      dataStartRow: allData.length > 0 ? 1 : 0,
      dataEndRow: allData.length,
      fixApplied: 'Cross-year date range parsing with intelligent year detection'
    }
  }
}];
