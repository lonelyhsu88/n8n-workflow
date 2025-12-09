const fs = require('fs');

// 讀取 debug workflow（包含請假檢測功能）
const workflow = JSON.parse(fs.readFileSync('TP370-daily-report-checker-v3.2-debug.json', 'utf8'));

// 找到資料處理節點
const dataNode = workflow.nodes.find(n => n.name === '查詢並處理資料');
let code = dataNode.parameters.jsCode;

console.log('✓ Loaded debug workflow');

// 1. 替換 isFullDayLeave 函數
const oldIsFullDayLeave = code.match(/function isFullDayLeave\(text\) \{[\s\S]*?\n\}/);

if (!oldIsFullDayLeave) {
  console.error('✗ Cannot find isFullDayLeave function');
  process.exit(1);
}

const newIsFullDayLeave = `function isFullDayLeave(text) {
  const lowerText = text.toLowerCase();

  if (/\\d{1,2}:\\d{2}/.test(text) || /\\d{1,2}\\s*[-~]\\s*\\d{1,2}(?!\\/)/.test(text)) {
    const hasDateRange = /\\d{1,2}\\/\\d{1,2}\\s*-/.test(text);
    if (!hasDateRange) {
      return false;
    }
  }

  // 🔧 修復：檢查部分時間關鍵字，但避免誤判 @PM-Ryan
  const hasMention = /@[\\w-]+/.test(text) || /<@[A-Z0-9]+>/.test(text);

  // 檢查中文時間關鍵字（這些不會誤判）
  const hasChineseTimeKeyword = lowerText.includes('上午') ||
    lowerText.includes('下午') ||
    lowerText.includes('早上') ||
    lowerText.includes('中午') ||
    lowerText.includes('晚上');

  if (hasChineseTimeKeyword) {
    return false;
  }

  // 只在沒有提及時檢查 am/pm（避免誤判 @PM-Ryan）
  if (!hasMention) {
    const hasEnglishTimeKeyword = /\\bam\\b/.test(lowerText) || /\\bpm\\b/.test(lowerText);
    if (hasEnglishTimeKeyword) {
      return false;
    }
  }

  const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
  return leaveKeywords.some(keyword => text.includes(keyword));
}`;

code = code.replace(oldIsFullDayLeave[0], newIsFullDayLeave);
console.log('✓ Replaced isFullDayLeave function');

// 2. 在 isFullDayLeave 之後插入新函數
const insertPoint = code.indexOf(newIsFullDayLeave) + newIsFullDayLeave.length;

const newFunctions = `

// 🔧 新增：從姓名反查 User ID
function findUserIdByName(name, userMap) {
  const cleanName = name.replace('@', '');
  for (const [userId, userInfo] of Object.entries(userMap)) {
    if (userInfo.name === cleanName) {
      return userId;
    }
  }
  return null;
}

// 🔧 新增：支援 @姓名 和 <@USER_ID> 格式
function extractUserIdentifier(text, userMap) {
  // 優先提取 <@USER_ID> 格式
  const userIdMatch = text.match(/<@([A-Z0-9]+)>/);
  if (userIdMatch) {
    return userIdMatch[1];
  }

  // 嘗試提取 @姓名 格式
  const nameMatch = text.match(/@([\\w\\u4e00-\\u9fa5]+-[\\w\\u4e00-\\u9fa5]+)/);
  if (nameMatch) {
    const name = nameMatch[1];
    const userId = findUserIdByName(name, userMap);
    if (userId) {
      return userId;
    }
  }

  return null;
}`;

code = code.substring(0, insertPoint) + newFunctions + code.substring(insertPoint);
console.log('✓ Inserted new functions');

// 3. 替換 User ID 提取邏輯
// 找到所有使用 text.match(/<@([A-Z0-9]+)>/) 的地方
const oldPattern1 = `const userIdMatch = text.match(/<@([A-Z0-9]+)>/);
    if (userIdMatch && (isInRange || includesShortDate)) {
      const userId = userIdMatch[1];`;

const newPattern1 = `// 🔧 修復：支援 @姓名 和 <@USER_ID> 格式
    const userId = extractUserIdentifier(text, userMap);

    if (userId && (isInRange || includesShortDate)) {`;

if (code.includes(oldPattern1)) {
  code = code.replace(oldPattern1, newPattern1);
  console.log('✓ Replaced User ID extraction logic (pattern 1)');
} else {
  console.log('⚠ Pattern 1 not found, searching for alternative...');

  // 嘗試找到類似的模式
  const altPattern = /const userIdMatch = text\.match\([\s\S]{0,200}if \(userIdMatch/;
  const match = code.match(altPattern);
  if (match) {
    console.log('Found alternative pattern:', match[0].substring(0, 100));
  }
}

// 移除所有 debug 邏輯
// 1. 移除第一行的 Debug 註解
code = code.replace('// 優化版：只取得彙報 channel 成員的資訊 + Debug 輸出', '// 優化版：只取得彙報 channel 成員的資訊');

// 2. 移除 Debug 設定區塊
code = code.replace(/\/\/ 🔍 Debug 設定[\s\S]*?const debugLog = \[\];?\n/m, '');

// 3. 移除所有 debugLog.push 呼叫
code = code.replace(/debugLog\.push\({[\s\S]*?\}\);?\n/g, '');

// 4. 移除 PM-Ryan 特定 debug 變數
code = code.replace(/const pmRyanLeaveDebug = \[\];?\n/g, '');
code = code.replace(/pmRyanLeaveDebug\.push\({[\s\S]*?\}\);?\n/g, '');

// 5. 移除 Debug 輸出到 console
code = code.replace(/\/\/ 🔍 輸出完整 Debug 資訊到 console[\s\S]*?console\.log\(JSON\.stringify\(debugLog, null, 2\)\);?\n/m, '');

// 6. 移除所有 Debug 註解行
code = code.replace(/\s*\/\/ 🔍 Debug[^\n]*\n/g, '');

// 7. 移除輸出中的 debugLog 欄位
code = code.replace(/,?\s*debugLog: debugLog\s*\/\/ 🔍 加入 debug 資訊到輸出\n/g, '');

// 8. 清理空白行（最多保留 2 個連續空行）
code = code.replace(/\n{4,}/g, '\n\n\n');

console.log('✓ Removed all debug logic');

// 更新 workflow
dataNode.parameters.jsCode = code;

// 移除 token（設為 placeholder）
const configNode = workflow.nodes.find(n => n.name === '設定參數');
if (configNode) {
  configNode.parameters.jsonOutput = configNode.parameters.jsonOutput.replace(
    /"slackToken": "xoxp-[^"]+"/,
    '"slackToken": "YOUR_SLACK_TOKEN_HERE"'
  );
  console.log('✓ Token placeholder set');
}

// 寫入新文件
fs.writeFileSync('TP370-daily-report-checker-FINAL-FIXED.json', JSON.stringify(workflow, null, 2), 'utf8');

const stats = fs.statSync('TP370-daily-report-checker-FINAL-FIXED.json');
console.log('\n✅ Generated: TP370-daily-report-checker-FINAL-FIXED.json');
console.log('   Size:', stats.size, 'bytes');
console.log('   Nodes:', workflow.nodes.length);
