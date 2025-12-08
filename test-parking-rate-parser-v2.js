// 測試費率解析邏輯 V2
// 實際費率文字: 臨停：$50/H，當日當次最高上限$300 (12/4~12/8,12/11~12/14展期費率:$60/H,無最高上限)

// 模擬 API 回應資料
const mockApiResponse = {
  d: [
    "TP370",
    "南港軟體園區站",
    "台北市南港區園區街3號B3、B4",
    "02-2655-5999",
    "24小時",
    "汽車、機車",
    "平面",
    "月租資訊...",
    "臨停：$50/H，當日當次最高上限$300 (12/4~12/8,12/11~12/14展期費率:$60/H,無最高上限)",
    "其他資訊..."
  ]
};

// 測試用的日期設定函數
function testWithDate(testDate, description) {
  console.log('\n' + '='.repeat(80));
  console.log(`📅 測試日期: ${description}`);
  console.log('='.repeat(80));

  const data = mockApiResponse;
  const parkId = 'TP370';
  const parkName = data.d && data.d.length > 0 ? data.d[1] : '未知停車場';
  const parkUrl = 'https://www.dodohome.com.tw/p2_parkdetail.aspx?park_id=' + parkId;
  const operatingHours = data.d && data.d.length > 0 ? data.d[4] : '未知';

  function cleanHtml(text) {
    if (!text) return '';
    return text.replace(/&nbsp;?/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }

  function parseDate(dateStr, year) {
    const parts = dateStr.trim().split('/');
    if (parts.length === 2) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      return new Date(year, month, day);
    }
    return null;
  }

  function isDateInRange(checkDate, startStr, endStr, year) {
    const start = parseDate(startStr, year);
    const end = parseDate(endStr, year);
    if (!start || !end) return false;
    const check = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
    return check >= start && check <= end;
  }

  let feeText = '';
  if (data.d && data.d.length > 8) {
    feeText = cleanHtml(data.d[8]);
  }

  console.log('📋 費率原文:', feeText);

  const now = testDate;
  const taipeiTime = testDate;
  const year = taipeiTime.getFullYear();
  const month = taipeiTime.getMonth() + 1;
  const day = taipeiTime.getDate();

  console.log('📆 當前日期:', month + '/' + day + '/' + year);

  let currentRate = 50;
  let currentLimit = 300;
  let rateType = '標準費率';
  let noLimit = false;

  const stdRateMatch = feeText.match(/臨停[：:]?\s*\$?(\d+)\/H/);
  if (stdRateMatch) {
    currentRate = parseInt(stdRateMatch[1]);
    console.log('✅ 標準費率:', currentRate + '/H');
  }

  const stdLimitMatch = feeText.match(/當日當次最高上限\$?(\d+)/);
  if (stdLimitMatch) {
    currentLimit = parseInt(stdLimitMatch[1]);
    console.log('✅ 標準上限: $' + currentLimit);
  }

  // 🔧 V2 修復：支援多個逗號分隔的日期範圍
  console.log('\n🔍 搜尋展期費率...');
  const exhibitionBlockMatch = feeText.match(/\(([^)]+展期費率[^)]+)\)/);

  if (exhibitionBlockMatch) {
    const exhibitionBlock = exhibitionBlockMatch[1];
    console.log('  📦 展期區塊:', exhibitionBlock);

    const rateMatch = exhibitionBlock.match(/展期費率[：:]\s*\$?(\d+)\/H/);
    const limitMatch = exhibitionBlock.match(/當日當次最高上限\$?(\d+)|無最高上限/);

    if (rateMatch) {
      const exhibitionRate = parseInt(rateMatch[1]);
      const hasNoLimit = exhibitionBlock.includes('無最高上限');
      const exhibitionLimit = limitMatch && limitMatch[1] ? parseInt(limitMatch[1]) : null;

      console.log('  💰 展期費率: $' + exhibitionRate + '/H');
      console.log('  📊 展期上限:', hasNoLimit ? '無上限' : ('$' + exhibitionLimit));

      const dateRangePattern = /(\d{1,2}\/\d{1,2})[~～-](\d{1,2}\/\d{1,2})/g;
      let dateMatch;
      let inExhibition = false;

      while ((dateMatch = dateRangePattern.exec(exhibitionBlock)) !== null) {
        const startDate = dateMatch[1];
        const endDate = dateMatch[2];

        console.log('  📌 找到展期:', startDate + '~' + endDate);

        if (isDateInRange(taipeiTime, startDate, endDate, year)) {
          currentRate = exhibitionRate;
          if (hasNoLimit) {
            noLimit = true;
            currentLimit = null;
          } else if (exhibitionLimit) {
            currentLimit = exhibitionLimit;
            noLimit = false;
          }
          rateType = '展期費率 (' + startDate + '~' + endDate + ')';
          console.log('  ✅ 今天在展期內，使用展期費率');
          inExhibition = true;
          break;
        } else {
          console.log('  ⏭️  今天不在此展期內');
        }
      }

      if (!inExhibition) {
        console.log('  ℹ️  今天不在任何展期內，使用標準費率');
      }
    }
  } else {
    console.log('  ℹ️  未找到展期費率資訊');
  }

  console.log('\n💡 最終結果:');
  console.log('  費率: $' + currentRate + '/H');
  console.log('  上限:', noLimit ? '無上限' : ('$' + currentLimit));
  console.log('  類型:', rateType);

  const timeStr = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(now);

  const limitText = noLimit ? '無上限' : ('$' + currentLimit);
  const messageText =
    '🏞️ 停車場: ' + parkName + '\n' +
    '🕒 營業時間: ' + operatingHours + '\n' +
    '💰 當前收費: $' + currentRate + '/H\n' +
    '📊 當日上限: ' + limitText + '\n' +
    '📋 費率類型: ' + rateType + '\n' +
    '🌐 查看詳情: ' + parkUrl + '\n' +
    '⏰ 檢查時間: ' + timeStr;

  console.log('\n📨 Slack 訊息預覽:');
  console.log('─'.repeat(80));
  console.log(messageText);
  console.log('─'.repeat(80));
}

// 執行測試
console.log('🧪 開始測試費率解析邏輯 V2\n');

testWithDate(new Date(2024, 11, 3, 6, 0, 0), '2024/12/3 (標準費率)');
testWithDate(new Date(2024, 11, 4, 6, 0, 0), '2024/12/4 (展期1開始) ★');
testWithDate(new Date(2024, 11, 6, 6, 0, 0), '2024/12/6 (展期1中) ★');
testWithDate(new Date(2024, 11, 8, 6, 0, 0), '2024/12/8 (展期1結束) ★ 今天！');
testWithDate(new Date(2024, 11, 10, 6, 0, 0), '2024/12/10 (展期間隔)');
testWithDate(new Date(2024, 11, 11, 6, 0, 0), '2024/12/11 (展期2開始) ★');
testWithDate(new Date(2024, 11, 14, 6, 0, 0), '2024/12/14 (展期2結束) ★');
testWithDate(new Date(2024, 11, 15, 6, 0, 0), '2024/12/15 (標準費率)');

console.log('\n✅ 測試完成！\n');
