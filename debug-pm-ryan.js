// 診斷 PM-Ryan 為什麼沒有被檢測到
const https = require('https');

const config = {
  slackToken: 'YOUR_SLACK_TOKEN_HERE',
  sourceChannel: 'C07KLQ81N2X',
  attendanceChannel: 'C05FXLH7BCJ',
};

function slackApiRequest(endpoint, params) {
  return new Promise((resolve, reject) => {
    const queryString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const options = {
      hostname: 'slack.com',
      path: `/api/${endpoint}?${queryString}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.slackToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

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

async function debugPMRyan() {
  try {
    console.log('🔍 診斷 PM-Ryan 請假檢測問題\n');
    console.log('='.repeat(80));

    // 1. 確認 PM-Ryan 在彙報 channel
    console.log('\n📋 步驟 1: 確認 PM-Ryan 在彙報 channel');

    const membersResult = await slackApiRequest('conversations.members', {
      channel: config.sourceChannel,
      limit: '200'
    });

    if (!membersResult.ok) {
      console.error('❌ 無法取得成員:', membersResult.error);
      return;
    }

    const channelMembers = membersResult.members;
    console.log(`   彙報 channel 共 ${channelMembers.length} 位成員`);

    // 取得 PM-Ryan 的資訊
    const ryanUserId = 'U07FFHDUTMH';
    const userResult = await slackApiRequest('users.info', { user: ryanUserId });

    if (userResult.ok) {
      const userName = userResult.user.profile?.display_name || userResult.user.real_name;
      const inChannel = channelMembers.includes(ryanUserId);
      console.log(`   PM-Ryan (${userName}): ${inChannel ? '✅ 在' : '❌ 不在'}彙報 channel`);
      console.log(`   User ID: ${ryanUserId}`);
    }

    // 2. 查詢出勤 channel 的請假記錄
    console.log('\n📋 步驟 2: 查詢出勤 channel 的 PM-Ryan 請假記錄');

    const startDate = new Date('2025-12-01T00:00:00+08:00');
    const endDate = new Date('2025-12-15T23:59:59+08:00');
    const oldestTs = Math.floor(startDate.getTime() / 1000);
    const latestTs = Math.floor(endDate.getTime() / 1000);

    const attendanceResult = await slackApiRequest('conversations.history', {
      channel: config.attendanceChannel,
      oldest: oldestTs.toString(),
      latest: latestTs.toString(),
      limit: '200'
    });

    if (!attendanceResult.ok) {
      console.error('❌ 無法取得出勤訊息:', attendanceResult.error);
      return;
    }

    const messages = attendanceResult.messages || [];
    const ryanMessages = messages.filter(msg =>
      msg.text && msg.text.includes(ryanUserId)
    );

    console.log(`   找到 ${ryanMessages.length} 則包含 PM-Ryan 的訊息`);

    if (ryanMessages.length === 0) {
      console.log('   ⚠️ 沒有找到 PM-Ryan 的請假記錄！');
      console.log('   可能使用了其他 User ID 或名字格式');

      // 搜尋包含 "Ryan" 的訊息
      const ryanNameMessages = messages.filter(msg =>
        msg.text && (msg.text.includes('Ryan') || msg.text.includes('PM-Ryan'))
      );

      console.log(`\n   搜尋包含 "Ryan" 的訊息: ${ryanNameMessages.length} 則`);

      for (const msg of ryanNameMessages) {
        const timestamp = new Date(parseFloat(msg.ts) * 1000);
        console.log(`\n   📅 ${timestamp.toISOString().substring(0, 10)}`);
        console.log(`   📝 ${msg.text.substring(0, 100)}`);
      }

      return;
    }

    // 3. 分析每則訊息
    console.log('\n📋 步驟 3: 分析 PM-Ryan 的請假訊息');

    for (const msg of ryanMessages) {
      const timestamp = new Date(parseFloat(msg.ts) * 1000);
      const text = msg.text;

      console.log(`\n   📅 發送時間: ${timestamp.toISOString()}`);
      console.log(`   📝 訊息內容: "${text}"`);

      // 測試整天請假判斷
      const isFullDay = isFullDayLeave(text);
      console.log(`   ⏰ 整天請假判斷: ${isFullDay ? '✅ 是' : '❌ 否'}`);

      if (!isFullDay) {
        console.log(`   ⚠️ 此訊息被判定為部分時間請假，不會被處理`);
        continue;
      }

      // 測試日期範圍展開
      const expandedDates = expandDateRange(text, 2025);
      console.log(`   📅 日期範圍展開: ${expandedDates.length > 0 ? expandedDates.join(', ') : '無範圍'}`);

      // 測試是否匹配 12/8
      const targetDate = '2025-12-08';
      const targetShortDate = '12/8';

      const isInRange = expandedDates.includes(targetDate);
      const includesShortDate = text.includes(targetShortDate);

      console.log(`   🎯 匹配 ${targetDate}: ${isInRange || includesShortDate ? '✅ 是' : '❌ 否'}`);

      if (isInRange) {
        console.log(`      └─ 透過日期範圍匹配`);
      } else if (includesShortDate) {
        console.log(`      └─ 透過文字匹配 "${targetShortDate}"`);
      }

      // 測試 User ID 提取
      const userIdMatch = text.match(/<@([A-Z0-9]+)>/);
      if (userIdMatch) {
        console.log(`   👤 提取的 User ID: ${userIdMatch[1]}`);
        console.log(`   ✅ 符合預期: ${userIdMatch[1] === ryanUserId ? '是' : '否'}`);
      } else {
        console.log(`   ❌ 無法提取 User ID`);
      }
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ 執行錯誤:', error);
  }
}

debugPMRyan();
