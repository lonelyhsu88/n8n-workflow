// 測試時區問題
console.log('=== JavaScript Date 時區測試 ===\n');

// 方法 1: 使用 ISO 格式字串 (會被解析為 UTC)
const date1 = new Date('2025-10-27');
console.log('方法 1: new Date("2025-10-27")');
console.log('  toString():', date1.toString());
console.log('  getDay() (0=Sun, 6=Sat):', date1.getDay());
console.log('  實際表示:', date1.getDay() === 0 ? '週日' : date1.getDay() === 1 ? '週一' : '其他');
console.log('');

// 方法 2: 使用個別參數 (使用本地時區)
const date2 = new Date(2025, 9, 27); // 月份從 0 開始，9 = 10月
console.log('方法 2: new Date(2025, 9, 27)');
console.log('  toString():', date2.toString());
console.log('  getDay() (0=Sun, 6=Sat):', date2.getDay());
console.log('  實際表示:', date2.getDay() === 0 ? '週日' : date2.getDay() === 1 ? '週一' : '其他');
console.log('');

// 方法 3: 使用 UTC 明確指定
const date3 = new Date(Date.UTC(2025, 9, 27));
console.log('方法 3: new Date(Date.UTC(2025, 9, 27))');
console.log('  toString():', date3.toString());
console.log('  getDay() (0=Sun, 6=Sat):', date3.getDay());
console.log('  實際表示:', date3.getDay() === 0 ? '週日' : date3.getDay() === 1 ? '週一' : '其他');
console.log('');

// 檢查實際是週幾
console.log('=== 2025-10-27 實際是週幾？===');
const realDate = new Date(2025, 9, 27, 12, 0, 0); // 使用中午時間
console.log('2025-10-27 (台北時間) 是:', ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][realDate.getDay()]);
