// ========================================
// 出缺勤解析程式碼 - 簡化版 (無需手動 userMapping)
// 自動從 Slack 訊息中提取使用者資訊
// ========================================

const messages = $input.all();
const attendanceData = [];
const taipeiTimeZone = 'Asia/Taipei';

// 自動建立的使用者對照表
const autoUserMapping = {};

// 掃描所有訊息，建立使用者對照表
for (const item of messages) {
  const message = item.json;

  if (message.user && message.user_profile) {
    const userId = message.user;
    const profile = message.user_profile;
    const userName = profile.real_name || profile.display_name || profile.name || userId;

    if (userName && userName !== userId) {
      autoUserMapping[userId] = userName;
    }
  }
}

// 名稱別名對照表
const nameAliases = {
  "bread": "RD-Bread",
  "mark": "PM-Mark",
  "mike": "Math-Mike Tsai"
};

// 定義狀態關鍵字
const statusKeywords = {
  'remote': '遠端工作',
  'wfh': '在家工作',
  'work from home': '在家工作',
  '請假': '請假',
  '病假': '病假',
  '事假': '事假',
  '特休': '特休',
  '年假': '年假',
  '生日假': '生日假',
  'birthday': '生日假',
  'bd假': '生日假',
  'bd': '生日假',
  '出差': '出差',
  '公出': '公出',
  '半天': '請假半天',
  '上午請假': '上午請假',
  '下午請假': '下午請假',
  '早退': '早退',
  '遲到': '遲到',
  '外出': '外出',
  '健檢': '健檢',
  '婚假': '婚假',
  '喪假': '喪假',
  '產假': '產假',
  '陪產假': '陪產假',
  '育嬰假': '育嬰假',
  '家庭照顧假': '家庭照顧假',
  '公假': '公假',
  '補休': '補休',
  '調休': '調休',
  '生理假': '生理假'
};

// 取得使用者顯示名稱
function getUserDisplayName(userId) {
  return autoUserMapping[userId] || userId;
}

// 替換訊息中的使用者 ID 為實際姓名
function replaceUserIdsWithNames(text) {
  let replacedText = text;
  const userIdPattern = /<@([A-Z0-9]+)>/g;
  replacedText = replacedText.replace(userIdPattern, (match, userId) => {
    const userName = getUserDisplayName(userId);
    return `@${userName}`;
  });
  const namePattern = /<@([^>]+)>/g;
  replacedText = replacedText.replace(namePattern, (match, name) => {
    if (!/^U[A-Z0-9]+$/.test(name)) {
      return `@${name}`;
    }
    return match;
  });
  return replacedText;
}

// 解析訊息狀態
function parseMessageStatus(messageText) {
  let cleanText = messageText.replace(/[（(][^）)]*[）)]/g, '').trim();
  const textLower = cleanText.toLowerCase();

  for (const [keyword, statusName] of Object.entries(statusKeywords)) {
    if (keyword.length <= 3) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regexPattern = '\\b' + escapedKeyword + '\\b';
      const regex = new RegExp(regexPattern, 'i');
      if (regex.test(cleanText)) {
        return statusName;
      }
    } else {
      if (textLower.includes(keyword)) {
        return statusName;
      }
    }
  }

  return '正常上班';
}

// 從訊息文字中提取實際請假的使用者
function extractActualUser(messageText) {
  // 檢查特殊格式 "日期 名稱 狀態"
  const specialPattern = /^\d{1,2}\/\d{1,2}\s+([a-zA-Z]+)\s+/i;
  const specialMatch = messageText.match(specialPattern);

  if (specialMatch) {
    const nameFound = specialMatch[1].toLowerCase();

    if (nameAliases[nameFound]) {
      return { userId: null, userName: nameAliases[nameFound] };
    }

    for (const [userId, fullName] of Object.entries(autoUserMapping)) {
      if (fullName.toLowerCase().includes(nameFound)) {
        return { userId: userId, userName: fullName };
      }
    }

    const capitalizedName = nameFound.charAt(0).toUpperCase() + nameFound.slice(1);
    return { userId: null, userName: capitalizedName };
  }

  // 模式1: <@UserID> 格式
  const pattern1 = /<@(U[A-Z0-9]+)>/;
  const match1 = messageText.match(pattern1);

  if (match1) {
    const userId = match1[1];
    return { userId: userId, userName: getUserDisplayName(userId) };
  }

  // 模式2: <@使用者名稱> 格式
  const pattern2 = /<@([^>]+)>/;
  const match2 = messageText.match(pattern2);

  if (match2) {
    const name = match2[1];
    if (!/^U[A-Z0-9]+$/.test(name)) {
      return { userId: null, userName: name };
    }
  }

  // 模式3: @使用者名稱 格式
  const pattern3 = /@([^\s>]+)/;
  const match3 = messageText.match(pattern3);

  if (match3) {
    const name = match3[1];
    return { userId: null, userName: name };
  }

  return null;
}

// 從訊息詳情中解析實際請假日期
function extractLeaveDates(messageText, messageTimestamp) {
  const currentYear = new Date().getFullYear();
  const results = [];

  // 檢查日期範圍格式
  const rangePatterns = [
    /(\d{1,2})\/(\d{1,2})\s*[~～\-]\s*(\d{1,2})\/(\d{1,2})/,
    /(\d{1,2})\/(\d{1,2})\s*[~～\-]\s*(\d{1,2})(?!\/)/,
  ];

  for (const pattern of rangePatterns) {
    const match = messageText.match(pattern);
    if (match) {
      let startMonth, startDay, endMonth, endDay;

      if (match.length === 5) {
        startMonth = parseInt(match[1]);
        startDay = parseInt(match[2]);
        endMonth = parseInt(match[3]);
        endDay = parseInt(match[4]);
      } else if (match.length === 4) {
        startMonth = parseInt(match[1]);
        startDay = parseInt(match[2]);
        endMonth = startMonth;
        endDay = parseInt(match[3]);
      }

      if (startMonth >= 1 && startMonth <= 12 && startDay >= 1 && startDay <= 31 &&
          endMonth >= 1 && endMonth <= 12 && endDay >= 1 && endDay <= 31) {

        const startDate = new Date(currentYear, startMonth - 1, startDay);
        const endDate = new Date(currentYear, endMonth - 1, endDay);

        if (endDate < startDate) {
          endDate.setFullYear(currentYear + 1);
        }

        const messageDate = new Date(messageTimestamp);
        const daysDiff = (messageDate - startDate) / (1000 * 60 * 60 * 24);

        if (daysDiff > 0 && daysDiff < 60 && messageDate.getMonth() > startMonth - 1) {
          startDate.setFullYear(currentYear - 1);
          endDate.setFullYear(currentYear - 1);
        } else if (daysDiff > 180) {
          startDate.setFullYear(currentYear + 1);
          endDate.setFullYear(currentYear + 1);
        } else if (daysDiff < -180) {
          startDate.setFullYear(currentYear - 1);
          endDate.setFullYear(currentYear - 1);
        }

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            results.push({
              date: currentDate.toLocaleDateString('zh-TW', {
                timeZone: taipeiTimeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }),
              status: null
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return results;
      }
    }
  }

  // 檢查單一日期
  const singlePatterns = [
    /(\d{1,2})\/(\d{1,2})/,
    /(\d{1,2})月(\d{1,2})日?/,
  ];

  for (const pattern of singlePatterns) {
    const match = messageText.match(pattern);
    if (match) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const leaveDate = new Date(currentYear, month - 1, day);

        const dayOfWeek = leaveDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return results;
        }

        const messageDate = new Date(messageTimestamp);
        const daysDiff = (messageDate - leaveDate) / (1000 * 60 * 60 * 24);
        if (daysDiff > 180) {
          leaveDate.setFullYear(currentYear + 1);
        } else if (daysDiff < -180) {
          leaveDate.setFullYear(currentYear - 1);
        }

        results.push({
          date: leaveDate.toLocaleDateString('zh-TW', {
            timeZone: taipeiTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          status: null
        });
        return results;
      }
    }
  }

  // 預設返回訊息發送日期
  const defaultDate = new Date(messageTimestamp);
  const dayOfWeek = defaultDate.getDay();

  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    results.push({
      date: defaultDate.toLocaleDateString('zh-TW', {
        timeZone: taipeiTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      status: null
    });
  }

  return results;
}

// 主要處理邏輯
for (const item of messages) {
  const message = item.json;
  if (!message.text) continue;

  // 過濾系統訊息
  const systemMessagePatterns = [
    /已加入頻道/,
    /已離開頻道/,
    /加入了 #/,
    /set the channel/,
    /renamed the channel/,
    /uploaded a file/,
    /^slackbot$/i
  ];

  const isSystemMessage = systemMessagePatterns.some(pattern =>
    pattern.test(message.text)
  );

  if (isSystemMessage) {
    continue;
  }

  const messageTimestamp = parseFloat(message.ts) * 1000;
  const messageTime = new Date(messageTimestamp);

  const userInfo = extractActualUser(message.text);
  if (!userInfo) continue;

  let userName = userInfo.userName || 'Unknown';
  const actualLeaveDates = extractLeaveDates(message.text, messageTimestamp);
  const status = parseMessageStatus(message.text);

  const timeStr = messageTime.toLocaleTimeString('zh-TW', {
    timeZone: taipeiTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  for (const leaveInfo of actualLeaveDates) {
    attendanceData.push({
      date: leaveInfo.date,
      messageDate: messageTime.toLocaleDateString('zh-TW', {
        timeZone: taipeiTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      time: timeStr,
      userName: userName,
      userId: userInfo.userId || null,
      status: status,
      details: replaceUserIdsWithNames(message.text)
    });
  }
}

// 按日期和使用者分組統計
const userStats = {};
for (const record of attendanceData) {
  const key = `${record.userName}_${record.date}`;
  if (!userStats[key]) {
    userStats[key] = {
      userName: record.userName,
      userId: record.userId,
      date: record.date,
      messageDate: record.messageDate,
      firstCheckIn: record.time,
      lastCheckOut: record.time,
      status: record.status,
      details: record.details,
      messageCount: 1
    };
  } else {
    userStats[key].lastCheckOut = record.time;
    userStats[key].messageCount++;
    if (record.status !== '正常上班') {
      userStats[key].status = record.status;
      userStats[key].details = record.details;
    }
  }
}

// 整理最終結果
const finalResults = Object.values(userStats).map(stat => {
  let workDuration = '';
  if (stat.firstCheckIn !== stat.lastCheckOut) {
    const [startHour, startMin] = stat.firstCheckIn.split(':').map(Number);
    const [endHour, endMin] = stat.lastCheckOut.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (durationMinutes > 0) {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      workDuration = `${hours}小時${minutes}分鐘`;
    }
  }

  return {
    ...stat,
    workDuration: workDuration
  };
});

// 排序
finalResults.sort((a, b) => {
  const dateCompare = b.date.localeCompare(a.date);
  if (dateCompare !== 0) return dateCompare;
  return a.userName.localeCompare(b.userName, 'zh-TW');
});

// 統計摘要
const summary = {
  totalRecords: finalResults.length,
  uniqueUsers: [...new Set(finalResults.map(r => r.userName))].length,
  dateRange: {
    from: finalResults.length > 0 ? finalResults[finalResults.length - 1].date : '',
    to: finalResults.length > 0 ? finalResults[0].date : ''
  },
  statusBreakdown: {}
};

finalResults.forEach(record => {
  const status = record.status;
  summary.statusBreakdown[status] = (summary.statusBreakdown[status] || 0) + 1;
});

console.log("=== 處理完成 ===");
console.log("總記錄數：", finalResults.length);
console.log("狀態統計：", summary.statusBreakdown);
console.log("自動識別的使用者數:", Object.keys(autoUserMapping).length);

return {
  summary: summary,
  records: finalResults,
  rawDataCount: attendanceData.length
};
