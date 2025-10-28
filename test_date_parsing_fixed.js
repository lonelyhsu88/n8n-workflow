// 測試日期範圍解析 - 修復版

const taipeiTimeZone = 'Asia/Taipei';

// 測試案例
const testCases = [
  {
    name: "QA-Lisa",
    text: "10/23-11/1 @QA-Lisa 特休",
    timestamp: new Date('2025-10-21T06:49:00Z').getTime(),
    expected: "應包含 10/23 到 11/1"
  },
  {
    name: "RD-Jean",
    text: "10/23，27-31 @RD-Jean 特休",
    timestamp: new Date('2025-10-21T07:39:00Z').getTime(),
    expected: "應包含 10/23 和 10/27-31"
  },
  {
    name: "RD-Jean (只測 27-31)",
    text: "10/27-31 @RD-Jean 特休",
    timestamp: new Date('2025-10-21T07:39:00Z').getTime(),
    expected: "應包含 10/27-31"
  }
];

// 修復的解析函數
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
          // 修復：正確的日期遞增
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return results;
      }
    }
  }

  return results;
}

// 測試
console.log("=== 測試日期範圍解析 (修復版) ===\n");

testCases.forEach((test, idx) => {
  console.log("測試", idx + 1, ":", test.name);
  console.log("  訊息:", test.text);
  console.log("  預期:", test.expected);

  const dates = extractLeaveDates(test.text, test.timestamp);
  console.log("  解析結果:", dates.length, "筆記錄");

  if (dates.length > 0) {
    console.log("  第一天:", dates[0].date);
    console.log("  最後一天:", dates[dates.length - 1].date);

    // 檢查是否包含 10/29
    const has1029 = dates.some(d => d.date.includes('10/29'));
    console.log("  包含 10/29:", has1029 ? "✅ 是" : "❌ 否");

    // 顯示所有日期
    const allDates = dates.map(d => d.date.split('/').slice(1).join('/')).join(', ');
    console.log("  所有日期:", allDates);
  } else {
    console.log("  ❌ 無法解析！");
  }
  console.log();
});
