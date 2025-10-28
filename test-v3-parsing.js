// 测试 V3 修复版本 - 修复纯数字范围的正则表达式
const taipeiTimeZone = 'Asia/Taipei';

function extractLeaveDates(messageText, messageTimestamp) {
  const currentYear = new Date().getFullYear();
  const results = [];

  const commaParts = messageText.split(/[,，、]/);

  if (commaParts.length > 1) {
    let inferredMonth = null;
    const firstPartMatch = commaParts[0].match(/(\d{1,2})\/(\d{1,2})/);
    if (firstPartMatch) {
      inferredMonth = parseInt(firstPartMatch[1]);
    }

    for (const part of commaParts) {
      const partResults = extractSingleDateRange(part.trim(), messageTimestamp, currentYear, inferredMonth);
      results.push(...partResults);
    }

    if (results.length > 0) {
      return results;
    }
  }

  return extractSingleDateRange(messageText, messageTimestamp, currentYear, null);
}

function extractSingleDateRange(messageText, messageTimestamp, currentYear, inferredMonth) {
  const results = [];

  const rangePatterns = [
    { regex: /(\d{1,2})\/(\d{1,2})\s*[~～\-]\s*(\d{1,2})\/(\d{1,2})/, type: 'full' },
    { regex: /(\d{1,2})\/(\d{1,2})\s*[~～\-]\s*(\d{1,2})(?!\/)/, type: 'same_month' },
    { regex: /^(\d{1,2})\s*[~～\-]\s*(\d{1,2})(?:\s|@|$)/, type: 'day_only' }, // ✅ 修复：匹配后面跟空格、@或结尾
  ];

  for (const { regex, type } of rangePatterns) {
    const match = messageText.match(regex);
    if (match) {
      let startMonth, startDay, endMonth, endDay;

      if (type === 'full') {
        startMonth = parseInt(match[1]);
        startDay = parseInt(match[2]);
        endMonth = parseInt(match[3]);
        endDay = parseInt(match[4]);
      } else if (type === 'same_month') {
        startMonth = parseInt(match[1]);
        startDay = parseInt(match[2]);
        endMonth = startMonth;
        endDay = parseInt(match[3]);
      } else if (type === 'day_only') {
        startDay = parseInt(match[1]);
        endDay = parseInt(match[2]);

        if (inferredMonth) {
          startMonth = inferredMonth;
          endMonth = inferredMonth;
        } else {
          const messageDate = new Date(messageTimestamp);
          startMonth = messageDate.getMonth() + 1;
          endMonth = startMonth;
        }
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

  // 单日期处理
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

  return results;
}

// 测试用例
const testMessages = [
  {
    text: "10/23-11/1 @QA-Lisa 特休",
    timestamp: new Date("2025-10-21T22:49:00Z").getTime(),
    user: "QA-Lisa"
  },
  {
    text: "10/23，27-31 @RD-Jean 特休",
    timestamp: new Date("2025-10-20T23:39:00Z").getTime(),
    user: "RD-Jean"
  },
  {
    text: "10/29 @Test-User 病假",
    timestamp: new Date("2025-10-29T00:00:00Z").getTime(),
    user: "Test-User"
  }
];

console.log('=== V3 修复版日期范围解析测试 ===\n');

testMessages.forEach(msg => {
  console.log(`测试消息: "${msg.text}"`);
  console.log(`发送者: ${msg.user}`);

  // 调试：显示逗号分割后的部分
  const parts = msg.text.split(/[,，、]/);
  if (parts.length > 1) {
    console.log('逗号分割后的部分:');
    parts.forEach((p, i) => console.log(`  [${i}]: "${p.trim()}"`));
  }

  const dates = extractLeaveDates(msg.text, msg.timestamp);
  console.log(`解析出的日期数量: ${dates.length}`);

  if (dates.length > 0) {
    console.log('日期列表:');
    if (dates.length <= 10) {
      dates.forEach(d => console.log(`  - ${d.date}`));
    } else {
      dates.slice(0, 5).forEach(d => console.log(`  - ${d.date}`));
      console.log(`  ... (省略 ${dates.length - 10} 个日期)`);
      dates.slice(-5).forEach(d => console.log(`  - ${d.date}`));
    }

    const contains1029 = dates.some(d => d.date === '2025/10/29');
    console.log(`包含 10/29: ${contains1029 ? '✅ 是' : '❌ 否'}`);
  } else {
    console.log('❌ 无法解析任何日期');
  }

  console.log('\n---\n');
});
