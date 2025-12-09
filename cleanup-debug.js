const fs = require('fs');

const workflow = JSON.parse(fs.readFileSync('TP370-daily-report-checker-FINAL-FIXED.json', 'utf8'));
const dataNode = workflow.nodes.find(n => n.name === '查詢並處理資料');
let code = dataNode.parameters.jsCode;

console.log('開始清理 DEBUG_USER_ID 殘留...\n');

// 1. Line 240: 移除 pmRyanTrackable
const pattern1 = /\}const pmRyanTrackable = trackableMembers\.find\(m => m\.id === DEBUG_USER_ID\);?\n?/;
if (pattern1.test(code)) {
  code = code.replace(pattern1, '}\n');
  console.log('✓ 移除 pmRyanTrackable');
}

// 2. Line 325-327: 移除 pmRyanAttendanceMessages
const pattern2 = /\} while \(attendanceCursor\);const pmRyanAttendanceMessages = attendanceMessages\.filter\(msg => \n\s+msg\.text && msg\.text\.includes\(DEBUG_USER_ID\)\n\);?\n*/;
if (pattern2.test(code)) {
  code = code.replace(pattern2, '} while (attendanceCursor);\n');
  console.log('✓ 移除 pmRyanAttendanceMessages');
}

// 3. Line 423-430: 移除整個 pmRyanFinalCategory 區塊
const pattern3 = /onLeaveList\.sort\(\(a, b\) => a\.name\.localeCompare\(b\.name\)\);let pmRyanFinalCategory = '[^']*';\nif \(onLeaveList\.find\(item => item\.name === userMap\[DEBUG_USER_ID\]\?\.name\)\) \{\n\s+pmRyanFinalCategory = '[^']*';\n\} else if \(submittedList\.find\(item => item\.name === userMap\[DEBUG_USER_ID\]\?\.name\)\) \{\n\s+pmRyanFinalCategory = '[^']*';\n\} else if \(notSubmittedList\.includes\(userMap\[DEBUG_USER_ID\]\?\.name\)\) \{\n\s+pmRyanFinalCategory = '[^']*';\n\}\n*/;
if (pattern3.test(code)) {
  code = code.replace(pattern3, 'onLeaveList.sort((a, b) => a.name.localeCompare(b.name));\n');
  console.log('✓ 移除 pmRyanFinalCategory 區塊');
}

// 驗證
const hasDebugUserId = code.includes('DEBUG_USER_ID');
console.log('\n驗證結果:', hasDebugUserId ? '❌ 還有殘留' : '✅ 已完全移除');

if (hasDebugUserId) {
  const lines = code.split('\n');
  console.log('\n殘留位置:');
  lines.forEach((line, i) => {
    if (line.includes('DEBUG_USER_ID')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  });
} else {
  // 更新並寫入
  dataNode.parameters.jsCode = code;
  fs.writeFileSync('TP370-daily-report-checker-FINAL-FIXED.json', JSON.stringify(workflow, null, 2), 'utf8');

  const stats = fs.statSync('TP370-daily-report-checker-FINAL-FIXED.json');
  console.log('\n✅ 清理完成！');
  console.log('   檔案大小:', stats.size, 'bytes');
}
