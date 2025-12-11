#!/usr/bin/env node

/**
 * 通用請假檢測診斷工具
 * 用途: 診斷為什麼某個日期的請假沒有被系統識別
 *
 * 使用方式:
 *   node debug-leave-detection.js [日期] [姓名或UserID]
 *
 * 範例:
 *   node debug-leave-detection.js 2025-12-10 Lonely
 *   node debug-leave-detection.js 12/10 U07FFHDUTMH
 *   node debug-leave-detection.js               # 自動檢測昨天
 */

const https = require('https');

// ⚠️ 需要設定 Slack Token
const SLACK_TOKEN = process.env.SLACK_TOKEN || 'YOUR_SLACK_TOKEN_HERE';
const ATTENDANCE_CHANNEL = 'C05FXLH7BCJ'; // JVD 每日出勤回報
const SOURCE_CHANNEL = 'C07KLQ81N2X';     // gemini-每日彙報

// 解析命令列參數
const args = process.argv.slice(2);
let targetDateInput = args[0];
let targetPerson = args[1]; // 可選: 姓名或 User ID

// 計算目標日期（預設為昨天）
let TARGET_DATE;
if (targetDateInput) {
  // 如果是短格式 MM/DD，補上年份
  if (/^\d{1,2}\/\d{1,2}$/.test(targetDateInput)) {
    const [month, day] = targetDateInput.split('/');
    const year = new Date().getFullYear();
    TARGET_DATE = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00+08:00`);
  } else {
    TARGET_DATE = new Date(targetDateInput + 'T00:00:00+08:00');
  }
} else {
  // 預設檢查昨天
  const now = new Date();
  const taipeiOffset = 8 * 60;
  const localOffset = now.getTimezoneOffset();
  const taipeiTime = new Date(now.getTime() + (taipeiOffset + localOffset) * 60 * 1000);
  TARGET_DATE = new Date(taipeiTime);
  TARGET_DATE.setDate(TARGET_DATE.getDate() - 1);
}

const TARGET_DATE_STR = TARGET_DATE.toISOString().split('T')[0];
const [year, month, day] = TARGET_DATE_STR.split('-');
const TARGET_DATE_SHORT = `${parseInt(month)}/${parseInt(day)}`;

// 擴大搜尋範圍到前後各 7 天
const OLDEST_TS = Math.floor(TARGET_DATE.getTime() / 1000) - (86400 * 7);
const LATEST_TS = Math.floor(TARGET_DATE.getTime() / 1000) + (86400 * 7);

console.log('='.repeat(80));
console.log('請假檢測診斷工具');
console.log('='.repeat(80));
console.log(`檢查日期: ${TARGET_DATE_STR} (${TARGET_DATE_SHORT})`);
if (targetPerson) {
  console.log(`目標人員: ${targetPerson}`);
} else {
  console.log(`模式: 檢查所有在未提交名單但有請假記錄的人`);
}
console.log(`搜尋時間範圍: ${new Date(OLDEST_TS * 1000).toISOString()} ~ ${new Date(LATEST_TS * 1000).toISOString()}`);
console.log(`Timestamp 範圍: ${OLDEST_TS} ~ ${LATEST_TS}`);
console.log();

if (SLACK_TOKEN === 'YOUR_SLACK_TOKEN_HERE') {
  console.error('❌ 錯誤: 請設定 SLACK_TOKEN 環境變數');
  console.error('   export SLACK_TOKEN="xoxp-..."');
  console.error('');
  console.error('使用方式:');
  console.error('   export SLACK_TOKEN="xoxp-..."');
  console.error('   node debug-leave-detection.js [日期] [姓名或UserID]');
  console.error('');
  console.error('範例:');
  console.error('   node debug-leave-detection.js 2025-12-10 Lonely');
  console.error('   node debug-leave-detection.js 12/10 U07FFHDUTMH');
  console.error('   node debug-leave-detection.js  # 檢查昨天所有人');
  process.exit(1);
}

// Slack API 呼叫函數
function slackApi(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const url = `https://slack.com/api/${endpoint}${queryString ? '?' + queryString : ''}`;

    https.get(url, {
      headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 日期範圍展開函數
function expandDateRange(text, currentYear) {
  const expandedDates = [];

  // 格式: MM/DD - MM/DD
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

  // 格式: MM/DD - DD
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

// 整天請假判斷函數
function isFullDayLeave(text) {
  const lowerText = text.toLowerCase();

  // 檢查是否有時間格式
  if (/\d{1,2}:\d{2}/.test(text) || /\d{1,2}\s*[-~]\s*\d{1,2}(?!\/)/.test(text)) {
    const hasDateRange = /\d{1,2}\/\d{1,2}\s*-/.test(text);
    if (!hasDateRange) {
      return false;
    }
  }

  // 檢查是否有提及 (避免誤判 @PM-Ryan)
  const hasMention = /@[\w-]+/.test(text) || /<@[A-Z0-9]+>/.test(text);

  // 檢查中文時間關鍵字
  const hasChineseTimeKeyword = lowerText.includes('上午') ||
    lowerText.includes('下午') ||
    lowerText.includes('早上') ||
    lowerText.includes('中午') ||
    lowerText.includes('晚上');

  if (hasChineseTimeKeyword) {
    return false;
  }

  // 只在沒有提及時檢查 am/pm
  if (!hasMention) {
    const hasEnglishTimeKeyword = /\bam\b/.test(lowerText) || /\bpm\b/.test(lowerText);
    if (hasEnglishTimeKeyword) {
      return false;
    }
  }

  const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
  return leaveKeywords.some(keyword => text.includes(keyword));
}

// 主診斷函數
async function diagnose() {
  try {
    console.log('🔍 Step 1: 取得 gemini-每日彙報 channel 成員...');
    const membersResult = await slackApi('conversations.members', {
      channel: SOURCE_CHANNEL,
      limit: '200'
    });

    if (!membersResult.ok) {
      console.error('❌ 無法取得 channel 成員:', membersResult.error);
      return;
    }

    const channelMembers = membersResult.members || [];
    console.log(`✅ 取得 ${channelMembers.length} 位成員`);
    console.log();

    // 取得所有成員的詳細資訊
    console.log('🔍 Step 2: 取得成員詳細資訊...');
    const userMap = {};
    let targetUserIds = []; // 要診斷的 User ID 列表

    for (const memberId of channelMembers) {
      const userResult = await slackApi('users.info', { user: memberId });
      if (userResult.ok) {
        const user = userResult.user;
        const displayName = user.profile?.display_name || user.real_name || user.name || 'Unknown';
        userMap[user.id] = {
          name: displayName,
          realName: user.real_name,
          isBot: user.is_bot || false,
          deleted: user.deleted || false
        };

        // 如果有指定目標人員，尋找匹配的人
        if (targetPerson) {
          // 檢查是否為 User ID
          if (targetPerson === user.id) {
            targetUserIds.push(user.id);
            console.log(`✅ 找到目標人員 (User ID):`);
            console.log(`   User ID: ${user.id}`);
            console.log(`   Display Name: ${displayName}`);
            console.log(`   Real Name: ${user.real_name}`);
            console.log();
          }
          // 檢查姓名是否包含關鍵字
          else if (displayName.includes(targetPerson) ||
                   (user.real_name && user.real_name.includes(targetPerson))) {
            targetUserIds.push(user.id);
            console.log(`✅ 找到目標人員 (姓名匹配):`);
            console.log(`   User ID: ${user.id}`);
            console.log(`   Display Name: ${displayName}`);
            console.log(`   Real Name: ${user.real_name}`);
            console.log();
          }
        }
      }
    }

    // 如果指定了目標人員但找不到
    if (targetPerson && targetUserIds.length === 0) {
      console.error(`❌ 找不到匹配 "${targetPerson}" 的人員`);
      console.log('\n📋 Channel 中所有非機器人成員:');
      Object.entries(userMap).forEach(([id, info]) => {
        if (!info.isBot && !info.deleted) {
          console.log(`   ${info.name} (${id})`);
        }
      });
      return;
    }

    // 取得出勤 channel 訊息
    console.log('🔍 Step 3: 取得出勤 channel 訊息...');
    const historyResult = await slackApi('conversations.history', {
      channel: ATTENDANCE_CHANNEL,
      oldest: OLDEST_TS.toString(),
      latest: LATEST_TS.toString(),
      limit: '200'
    });

    if (!historyResult.ok) {
      console.error('❌ 無法取得出勤 channel 歷史:', historyResult.error);
      return;
    }

    const messages = historyResult.messages || [];
    console.log(`✅ 取得 ${messages.length} 則訊息`);
    console.log();

    // 如果沒有指定目標人員，就檢查所有有出勤記錄的人
    if (!targetPerson) {
      console.log('🔍 Step 4: 分析所有有出勤記錄的人員...');
      const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];
      const peopleWithLeaveRecords = new Map(); // userId -> messages[]

      for (const msg of messages) {
        if (!msg.text) continue;

        const hasLeaveKeyword = leaveKeywords.some(k => msg.text.includes(k));
        if (!hasLeaveKeyword) continue;

        // 提取 User ID
        const userIdMatch = msg.text.match(/<@([A-Z0-9]+)>/);
        if (userIdMatch) {
          const userId = userIdMatch[1];
          if (channelMembers.includes(userId)) {
            if (!peopleWithLeaveRecords.has(userId)) {
              peopleWithLeaveRecords.set(userId, []);
            }
            peopleWithLeaveRecords.get(userId).push(msg);
          }
        }
      }

      console.log(`✅ 找到 ${peopleWithLeaveRecords.size} 位有出勤記錄的人`);
      targetUserIds = Array.from(peopleWithLeaveRecords.keys());

      if (targetUserIds.length === 0) {
        console.log('❌ 沒有找到任何出勤記錄');
        return;
      }
      console.log();
    }

    // 分析目標人員的訊息
    console.log(`🔍 Step 4: 分析 ${targetUserIds.length} 位目標人員的出勤記錄...\n`);
    const leaveKeywords = ['請假', '病假', '事假', '年假', '特休', '休假', '生日假', '健檢'];

    for (const userId of targetUserIds) {
      const userName = userMap[userId]?.name || 'Unknown';
      console.log('='.repeat(80));
      console.log(`👤 ${userName} (${userId})`);
      console.log('='.repeat(80));

      let foundMessages = [];

      for (const msg of messages) {
        if (!msg.text) continue;

        // 檢查是否包含此人的 User ID 或姓名
        const containsUser = msg.text.includes(userId) ||
          msg.text.includes(userName) ||
          (userMap[userId]?.realName && msg.text.includes(userMap[userId].realName));

        if (containsUser) {
          const msgTime = new Date(parseFloat(msg.ts) * 1000);
          const hasLeaveKeyword = leaveKeywords.some(k => msg.text.includes(k));
          const isFullDay = isFullDayLeave(msg.text);
          const expandedDates = expandDateRange(msg.text, TARGET_DATE.getFullYear());
          const includesTargetDate = expandedDates.includes(TARGET_DATE_STR) || msg.text.includes(TARGET_DATE_SHORT);

          foundMessages.push({
            time: msgTime.toISOString(),
            text: msg.text,
            hasLeaveKeyword,
            isFullDay,
            expandedDates,
            includesTargetDate,
            user: msg.user
          });
        }
      }

      if (foundMessages.length === 0) {
        console.log('❌ 找不到任何出勤記錄');
        console.log();
        console.log('💡 可能原因:');
        console.log('   1. 請假記錄沒有發布到出勤 channel');
        console.log('   2. 請假記錄發布時間不在搜尋範圍內');
        console.log('   3. 請假記錄使用了不同的姓名或 ID 格式');
        console.log();
        continue;
      }

      console.log(`✅ 找到 ${foundMessages.length} 則出勤記錄:\n`);

      foundMessages.forEach((msg, idx) => {
        console.log(`[${idx + 1}] 時間: ${msg.time}`);
        console.log(`    內容: ${msg.text.substring(0, 200)}${msg.text.length > 200 ? '...' : ''}`);
        console.log(`    包含請假關鍵字: ${msg.hasLeaveKeyword ? '✅' : '❌'}`);
        console.log(`    整天請假: ${msg.isFullDay ? '✅' : '❌'}`);
        console.log(`    展開日期: ${msg.expandedDates.length > 0 ? msg.expandedDates.join(', ') : '(無)'}`);
        console.log(`    包含目標日期 (${TARGET_DATE_STR}): ${msg.includesTargetDate ? '✅' : '❌'}`);
        console.log();
      });

      // 診斷結果
      console.log('='.repeat(80));
      console.log(`📊 診斷結果 - ${userName}`);
      console.log('='.repeat(80));

      const targetDateMessages = foundMessages.filter(m => m.includesTargetDate);

      if (targetDateMessages.length === 0) {
        console.log(`❌ 沒有找到 ${TARGET_DATE_SHORT} 的請假記錄`);
        console.log();
        console.log('💡 可能原因:');
        console.log('   1. 請假記錄的日期格式無法被識別');
        console.log(`   2. 請假記錄沒有明確標示 ${TARGET_DATE_SHORT}`);
        console.log('   3. 請假記錄發布時間太早或太晚');
      } else {
        console.log(`✅ 找到 ${targetDateMessages.length} 則 ${TARGET_DATE_SHORT} 的相關訊息\n`);

        targetDateMessages.forEach((msg, idx) => {
          console.log(`訊息 ${idx + 1}:`);
          console.log(`  內容: ${msg.text}`);
          console.log(`  包含請假關鍵字: ${msg.hasLeaveKeyword ? '✅' : '❌'}`);
          console.log(`  判定為整天請假: ${msg.isFullDay ? '✅' : '❌'}`);

          if (!msg.hasLeaveKeyword) {
            console.log('  ⚠️ 問題: 沒有請假關鍵字');
            console.log('     需要的關鍵字: 請假, 病假, 事假, 年假, 特休, 休假, 生日假, 健檢');
          }

          if (!msg.isFullDay) {
            console.log('  ⚠️ 問題: 被判定為部分時間請假（半天/小時）');
            console.log('     可能原因:');
            console.log('       - 包含時間格式 (HH:MM)');
            console.log('       - 包含時間關鍵字 (上午/下午/am/pm)');
            console.log('       - 沒有請假關鍵字');
          }

          console.log();
        });

        // 提供修復建議
        if (targetDateMessages.some(m => !m.isFullDay || !m.hasLeaveKeyword)) {
          console.log('🔧 修復建議:');
          console.log('   檢查出勤記錄格式，確保:');
          console.log('   1. 使用 <@USER_ID> 格式而非 @姓名');
          console.log('   2. 整天請假不要包含時間 (HH:MM 或 上午/下午)');
          console.log('   3. 明確標示請假類型 (病假/事假/特休等)');
        }
      }

      console.log();
    }

  } catch (error) {
    console.error('❌ 診斷過程發生錯誤:', error.message);
    console.error(error.stack);
  }
}

// 執行診斷
diagnose().then(() => {
  console.log('\n✅ 診斷完成');
}).catch(err => {
  console.error('❌ 診斷失敗:', err);
  process.exit(1);
});
