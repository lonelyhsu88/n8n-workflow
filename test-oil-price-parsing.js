// 測試中油油價資料解析

// 模擬 XML to JSON 後的資料結構
const mockData = {
  'Dataset': {
    'Table': [
      {
        '型別名稱': '汽柴油零售',
        '產品編號': '113F 1209800',
        '產品名稱': '98無鉛汽油',
        '包裝': '散裝',
        '銷售對象': '一般自用客戶 ',
        '交貨地點': '中油自營站',
        '計價單位': '元/ 公升',
        '參考牌價_金額': '30.5000',
        '營業稅_稅捐': '5',
        '貨物稅': '內含',
        '牌價生效日期': '1141027',
        '備註': ''
      },
      {
        '型別名稱': '汽柴油零售',
        '產品編號': '113F 1209500',
        '產品名稱': '95無鉛汽油',
        '包裝': '散裝',
        '銷售對象': '一般自用客戶 ',
        '交貨地點': '中油自營站',
        '計價單位': '元/ 公升',
        '參考牌價_金額': '28.5000',
        '營業稅_稅捐': '5',
        '貨物稅': '內含',
        '牌價生效日期': '1141027',
        '備註': ''
      },
      {
        '型別名稱': '汽柴油零售',
        '產品編號': '113F 1209200',
        '產品名稱': '92無鉛汽油',
        '包裝': '散裝',
        '銷售對象': '一般自用客戶',
        '交貨地點': '中油自營站',
        '計價單位': '元/ 公升',
        '參考牌價_金額': '27.0000',
        '營業稅_稅捐': '5',
        '貨物稅': '內含',
        '牌價生效日期': '1141027',
        '備註': ''
      },
      {
        '型別名稱': '汽柴油零售',
        '產品編號': '113F 5100100',
        '產品名稱': '超級柴油',
        '包裝': '散裝',
        '銷售對象': '一般自用客戶',
        '交貨地點': '中油自營站',
        '計價單位': '元/ 公升',
        '參考牌價_金額': '25.5000',
        '營業稅_稅捐': '5',
        '貨物稅': '內含',
        '牌價生效日期': '1141027',
        '備註': ''
      }
    ]
  }
};

// 提取資料 (模擬 n8n 的程式碼)
const data = mockData['Dataset'] && mockData['Dataset']['Table'] ? mockData['Dataset']['Table'] : [];

console.log('==========================================');
console.log('資料解析測試');
console.log('==========================================');
console.log(`資料筆數: ${data.length}`);

// 測試提取油價
const products = {
  '92無鉛汽油': parseFloat(data.find(item => item['產品名稱'] === '92無鉛汽油')?.['參考牌價_金額'] || '0'),
  '95無鉛汽油': parseFloat(data.find(item => item['產品名稱'] === '95無鉛汽油')?.['參考牌價_金額'] || '0'),
  '98無鉛汽油': parseFloat(data.find(item => item['產品名稱'] === '98無鉛汽油')?.['參考牌價_金額'] || '0'),
  '超級柴油': parseFloat(data.find(item => item['產品名稱'] === '超級柴油')?.['參考牌價_金額'] || '0')
};

console.log('\n提取的油價：');
console.log(`• 92無鉛汽油: ${products['92無鉛汽油']} 元/公升`);
console.log(`• 95無鉛汽油: ${products['95無鉛汽油']} 元/公升`);
console.log(`• 98無鉛汽油: ${products['98無鉛汽油']} 元/公升`);
console.log(`• 超級柴油: ${products['超級柴油']} 元/公升`);

// 測試生效日期轉換
const effectiveDateRaw = data[0]['牌價生效日期'];
const rocYear = parseInt(effectiveDateRaw.substring(0, 3));
const month = effectiveDateRaw.substring(3, 5);
const day = effectiveDateRaw.substring(5, 7);
const westernYear = rocYear + 1911;
const effectiveDate = `${westernYear}-${month}-${day}`;

console.log('\n生效日期轉換：');
console.log(`• 民國日期: ${effectiveDateRaw}`);
console.log(`• 西元日期: ${effectiveDate}`);

// 驗證結果
console.log('\n==========================================');
if (products['92無鉛汽油'] === 27 &&
    products['95無鉛汽油'] === 28.5 &&
    products['98無鉛汽油'] === 30.5 &&
    products['超級柴油'] === 25.5) {
  console.log('✅ 測試通過！所有油價都正確解析');
} else {
  console.log('❌ 測試失敗！油價解析錯誤');
}
console.log('==========================================');
