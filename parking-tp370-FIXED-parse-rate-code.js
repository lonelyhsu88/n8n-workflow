// 修復後的「解析費率」節點程式碼
// 修復日期: 2024-12-08
// 修復項目:
//   1. 修正 limitText 字串拼接語法錯誤
//   2. 修正 messageText 格式字串缺少 $ 符號

const item = $input.first();
const data = item.json;

const parkId = 'TP370';
const parkName = data.d && data.d.length > 0 ? data.d[1] : '未知停車場';
const parkUrl = 'https://www.dodohome.com.tw/p2_parkdetail.aspx?park_id=' + parkId;
const operatingHours = data.d && data.d.length > 0 ? data.d[4] : '未知';

// HTML 清理
function cleanHtml(text) {
  if (!text) return '';
  return text.replace(/&nbsp;?/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// 解析日期 MM/DD
function parseDate(dateStr, year) {
  const parts = dateStr.trim().split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    return new Date(year, month, day);
  }
  return null;
}

// 檢查日期是否在範圍內
function isDateInRange(checkDate, startStr, endStr, year) {
  const start = parseDate(startStr, year);
  const end = parseDate(endStr, year);
  if (!start || !end) return false;
  const check = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
  return check >= start && check <= end;
}

// 取得費率資訊
let feeText = '';
if (data.d && data.d.length > 8) {
  feeText = cleanHtml(data.d[8]);
}

console.log('費率原文:', feeText);

// 取得當前日期 (Asia/Taipei)
const now = new Date();
const taipeiOffset = 8 * 60; // UTC+8
const localOffset = now.getTimezoneOffset();
const taipeiTime = new Date(now.getTime() + (taipeiOffset + localOffset) * 60000);
const year = taipeiTime.getFullYear();
const month = taipeiTime.getMonth() + 1;
const day = taipeiTime.getDate();

console.log('當前日期:', month + '/' + day + '/' + year);

// 預設費率
let currentRate = 50;
let currentLimit = 300;
let rateType = '標準費率';
let noLimit = false;

// 解析標準費率
const stdRateMatch = feeText.match(/臨停[：:]?\s*\$?(\d+)\/H/);
if (stdRateMatch) currentRate = parseInt(stdRateMatch[1]);

const stdLimitMatch = feeText.match(/當日當次最高上限\$?(\d+)/);
if (stdLimitMatch) currentLimit = parseInt(stdLimitMatch[1]);

// 解析展期費率 - 支援多個展期
const exhibitionPattern = /(\d{1,2}\/\d{1,2})[~～-](\d{1,2}\/\d{1,2})展期費率[：:]\s*\$?(\d+)\/H[，,]?(當日當次最高上限\$?(\d+)|無最高上限)?/g;
let match;

while ((match = exhibitionPattern.exec(feeText)) !== null) {
  const startDate = match[1];
  const endDate = match[2];
  const rate = parseInt(match[3]);
  const hasNoLimit = match[0].includes('無最高上限');
  const limit = match[5] ? parseInt(match[5]) : null;

  console.log('找到展期:', startDate + '~' + endDate, '費率:' + rate, '上限:' + (hasNoLimit ? '無上限' : limit));

  // 檢查今天是否在此展期內
  if (isDateInRange(taipeiTime, startDate, endDate, year)) {
    currentRate = rate;
    if (hasNoLimit) {
      noLimit = true;
      currentLimit = null;
    } else if (limit) {
      currentLimit = limit;
      noLimit = false;
    }
    rateType = '展期費率 (' + startDate + '~' + endDate + ')';
    console.log('✅ 今天在展期內，使用展期費率');
    break;
  }
}

console.log('最終費率:', currentRate, '上限:', noLimit ? '無上限' : currentLimit, '類型:', rateType);

// 格式化時間
const timeStr = new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'Asia/Taipei',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false
}).format(now);

// 🔧 修復 1: 修正 limitText 字串拼接
const limitText = noLimit ? '無上限' : ('$' + currentLimit);

// 🔧 修復 2: 修正訊息格式，補上缺少的 $ 符號
const messageText =
  '🏞️ 停車場: ' + parkName + '\n' +
  '🕒 營業時間: ' + operatingHours + '\n' +
  '💰 當前收費: $' + currentRate + '/H\n' +
  '📊 當日上限: ' + limitText + '\n' +
  '📋 費率類型: ' + rateType + '\n' +
  '🌐 查看詳情: ' + parkUrl + '\n' +
  '⏰ 檢查時間: ' + timeStr;

return [{ json: { text: messageText } }];
