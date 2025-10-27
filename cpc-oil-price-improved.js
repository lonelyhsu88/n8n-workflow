{
  "nodes": [
    {
      "parameters": {
        "functionCode": "// 取得 API 資料\nconst data = $node['XML to JSON'].json['Dataset'] && $node['XML to JSON'].json['Dataset']['Table'] ? $node['XML to JSON'].json['Dataset']['Table'] : [];\n\n// 檢查資料是否有效\nif (!data.length) {\n  const errorMsg = `無法取得有效資料，API 回應結構：${JSON.stringify($node['XML to JSON'].json, null, 2)}`;\n  return [{ json: { \n    notification: `中油油價通知失敗\\n:date: 更新時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}\\n錯誤訊息: ${errorMsg}\\n資料來源: <https://www.cpc.com.tw|台灣中油官網>`,\n    hasError: true\n  } }];\n}\n\nconst updateTime = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });\n// 修正後的程式碼\nconst effectiveDateRaw = data[0]['牌價生效日期']; // 例如: 1140825\nlet effectiveDate = '未知';\n\nif (effectiveDateRaw) {\n  // 民國年轉西元年：民國 114 年 = 西元 2025 年 (114 + 1911)\n  const rocYear = parseInt(effectiveDateRaw.substring(0, 3)); // 114\n  const month = effectiveDateRaw.substring(3, 5); // 08\n  const day = effectiveDateRaw.substring(5, 7); // 25\n  const westernYear = rocYear + 1911; // 114 + 1911 = 2025\n  \n  effectiveDate = `${westernYear}-${month}-${day}`;\n}\n\n// 提取當前油價\nconst products = {\n  '92無鉛汽油': parseFloat(data.find(item => item['產品名稱'] === '92無鉛汽油')?.['參考牌價_金額'] || '0'),\n  '95無鉛汽油': parseFloat(data.find(item => item['產品名稱'] === '95無鉛汽油')?.['參考牌價_金額'] || '0'),\n  '98無鉛汽油': parseFloat(data.find(item => item['產品名稱'] === '98無鉛汽油')?.['參考牌價_金額'] || '0'),\n  '超級柴油': parseFloat(data.find(item => item['產品名稱'] === '超級柴油')?.['參考牌價_金額'] || '0')\n};\n\n// 讀取前次價格\nlet previousPrices = products; // 預設為當前價格\ntry {\n  // 方法1: 使用 $items() 取得所有項目\n  const allItems = $items('Get Previous Prices');\n  console.log(`Google Sheets 回傳 ${allItems.length} 筆資料`);\n  \n  if (allItems && allItems.length > 0) {\n    // 取最後一筆\n    const lastItem = allItems[allItems.length - 1];\n    const prevData = lastItem.json;\n    \n    console.log(`使用最後一筆資料：${prevData.Date}`);\n    console.log('資料內容：', JSON.stringify(prevData));\n    \n    if (prevData && prevData['92無鉛汽油'] !== undefined) {\n      previousPrices = {\n        '92無鉛汽油': parseFloat(prevData['92無鉛汽油']),\n        '95無鉛汽油': parseFloat(prevData['95無鉛汽油']),\n        '98無鉛汽油': parseFloat(prevData['98無鉛汽油']),\n        '超級柴油': parseFloat(prevData['超級柴油'])\n      };\n      \n      console.log('==========================================');\n      console.log('價格比對：');\n      console.log(`92無鉛: ${previousPrices['92無鉛汽油']} → ${products['92無鉛汽油']} (${(products['92無鉛汽油'] - previousPrices['92無鉛汽油']).toFixed(1)})`);\n      console.log(`95無鉛: ${previousPrices['95無鉛汽油']} → ${products['95無鉛汽油']} (${(products['95無鉛汽油'] - previousPrices['95無鉛汽油']).toFixed(1)})`);\n      console.log(`98無鉛: ${previousPrices['98無鉛汽油']} → ${products['98無鉛汽油']} (${(products['98無鉛汽油'] - previousPrices['98無鉛汽油']).toFixed(1)})`);\n      console.log(`超級柴油: ${previousPrices['超級柴油']} → ${products['超級柴油']} (${(products['超級柴油'] - previousPrices['超級柴油']).toFixed(1)})`);\n      console.log('==========================================');\n    }\n  }\n} catch (e) {\n  console.log('讀取失敗，嘗試備用方法...');\n  \n  // 方法2: 如果方法1失敗，嘗試直接存取\n  try {\n    const prevData = $node['Get Previous Prices'].all()[\n      $node['Get Previous Prices'].all().length - 1\n    ].json;\n    \n    if (prevData && prevData['92無鉛汽油'] !== undefined) {\n      previousPrices = {\n        '92無鉛汽油': parseFloat(prevData['92無鉛汽油']),\n        '95無鉛汽油': parseFloat(prevData['95無鉛汽油']),\n        '98無鉛汽油': parseFloat(prevData['98無鉛汽油']),\n        '超級柴油': parseFloat(prevData['超級柴油'])\n      };\n      console.log('備用方法成功，使用資料：', prevData.Date);\n    }\n  } catch (e2) {\n    console.log('所有方法都失敗：', e2.message);\n  }\n}\n// 計算各油品個別價格變動\nconst priceChanges = {\n  '92無鉛': products['92無鉛汽油'] - previousPrices['92無鉛汽油'],\n  '95無鉛': products['95無鉛汽油'] - previousPrices['95無鉛汽油'],\n  '98無鉛': products['98無鉛汽油'] - previousPrices['98無鉛汽油'],\n  '超級柴油': products['超級柴油'] - previousPrices['超級柴油']\n};\n\n// 計算汽油平均變動\nconst avgGasChange = (priceChanges['92無鉛'] + priceChanges['95無鉛'] + priceChanges['98無鉛']) / 3;\n\n// 格式化價格變動顯示\nconst formatChange = (change) => {\n  const num = parseFloat(change);\n  return num > 0 ? `+${num.toFixed(1)}` : num < 0 ? num.toFixed(1) : '0.0';\n};\n\n// 判斷整體變動趨勢（任一汽油或柴油有變動即算）\nconst hasGasIncrease = priceChanges['92無鉛'] > 0 || priceChanges['95無鉛'] > 0 || priceChanges['98無鉛'] > 0;\nconst hasGasDecrease = priceChanges['92無鉛'] < 0 || priceChanges['95無鉛'] < 0 || priceChanges['98無鉛'] < 0;\nconst hasDieselIncrease = priceChanges['超級柴油'] > 0;\nconst hasDieselDecrease = priceChanges['超級柴油'] < 0;\n\n// 【新增】計算是否有任何價格變動\nconst hasAnyChange = Object.values(priceChanges).some(change => Math.abs(change) > 0);\n\n// 判斷通知標題\nconst title = (hasGasIncrease || hasDieselIncrease) ? '上漲' : \n              (hasGasDecrease || hasDieselDecrease) ? '下跌' : '不變';\n\n// 格式化通知內容\nconst notification = `中油油價${title}通知\\n:date: 更新時間: ${updateTime}\\n:round_pushpin: 生效時間: 自${effectiveDate}零時起實施\\n\\n價格變動\\n• 汽油平均: ${formatChange(avgGasChange)} 元\\n• 柴油: ${formatChange(priceChanges['超級柴油'])} 元\\n\\n調整後價格 (元/公升)\\n• 92無鉛: ${products['92無鉛汽油'].toFixed(1)} (${formatChange(priceChanges['92無鉛'])})\\n• 95無鉛: ${products['95無鉛汽油'].toFixed(1)} (${formatChange(priceChanges['95無鉛'])})\\n• 98無鉛: ${products['98無鉛汽油'].toFixed(1)} (${formatChange(priceChanges['98無鉛'])})\\n• 超級柴油: ${products['超級柴油'].toFixed(1)} (${formatChange(priceChanges['超級柴油'])})\\n\\n資料來源: <https://www.cpc.com.tw|台灣中油官網>`;\n\n// 準備 Google Sheets 資料\nconst sheetData = {\n  Date: updateTime,\n  '92無鉛汽油': products['92無鉛汽油'],\n  '95無鉛汽油': products['95無鉛汽油'],\n  '98無鉛汽油': products['98無鉛汽油'],\n  '超級柴油': products['超級柴油']\n};\n\nreturn [{ \n  json: { \n    notification,\n    sheetData,\n    products,\n    priceChanges,\n    hasError: false,\n    hasAnyChange,  // 新增：是否有任何變動\n    shouldNotify: hasAnyChange  // 新增：是否應該發送通知（有變動就通知）\n  } \n}];"
      },
      "name": "Format Notification",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        496,
        16
      ],
      "id": "4aac6682-fc42-4890-9332-d569777a37b2"
    },
    {
      "parameters": {
        "options": {}
      },
      "name": "XML to JSON",
      "type": "n8n-nodes-base.xml",
      "typeVersion": 1,
      "position": [
        112,
        16
      ],
      "id": "8804d469-b609-419f-9d2c-837747c7d181"
    },
    {
      "parameters": {
        "authentication": "serviceAccount",
        "documentId": {
          "__rl": true,
          "value": "1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8",
          "mode": "list",
          "cachedResultName": "CPC Oil Price",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8/edit?usp=drivesdk"
        },
        "sheetName": {
          "__rl": true,
          "value": "gid=0",
          "mode": "list",
          "cachedResultName": "rawdata",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8/edit#gid=0"
        },
        "filtersUI": {
          "values": []
        },
        "options": {}
      },
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5,
      "position": [
        288,
        16
      ],
      "id": "5b8d4630-b6fa-4cfa-8b6e-763da387df49",
      "name": "Get Previous Prices",
      "credentials": {
        "googleApi": {
          "id": "u1JNoGs9f7NtuqBD",
          "name": "n8n-googlesheet"
        }
      },
      "continueOnFail": true
    },
    {
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "append",
        "documentId": {
          "__rl": true,
          "value": "1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8",
          "mode": "list",
          "cachedResultName": "CPC Oil Price",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8/edit?usp=drivesdk"
        },
        "sheetName": {
          "__rl": true,
          "value": "gid=0",
          "mode": "list",
          "cachedResultName": "rawdata",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1HPKesYFX7jLhEtmzfxPi1LxnpqpPykMa9D-HhODIl_8/edit#gid=0"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Date": "={{ $json.sheetData.Date }}",
            "92無鉛汽油": "={{ $json.sheetData['92無鉛汽油'] }}",
            "95無鉛汽油": "={{ $json.sheetData['95無鉛汽油'] }}",
            "98無鉛汽油": "={{ $json.sheetData['98無鉛汽油'] }}",
            "超級柴油": "={{ $json.sheetData['超級柴油'] }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "Date",
              "displayName": "Date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "92無鉛汽油",
              "displayName": "92無鉛汽油",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "95無鉛汽油",
              "displayName": "95無鉛汽油",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "98無鉛汽油",
              "displayName": "98無鉛汽油",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "超級柴油",
              "displayName": "超級柴油",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": false,
              "removed": false
            }
          ],
          "attemptToConvertTypes": true,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5,
      "position": [
        672,
        16
      ],
      "id": "2a1b25e9-a26f-4ff4-997e-b18ed8b484db",
      "name": "Save to Google Sheets",
      "credentials": {
        "googleApi": {
          "id": "u1JNoGs9f7NtuqBD",
          "name": "n8n-googlesheet"
        }
      }
    },
    {
      "parameters": {
        "url": "https://vipmbr.cpc.com.tw/cpcstn/listpricewebservice.asmx/getCPCMainProdListPrice_XML",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": []
        },
        "options": {
          "timeout": 30000
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -64,
        16
      ],
      "id": "cb43092e-8098-4018-b208-dbd5f7abb9af",
      "name": "HTTP Request",
      "continueOnFail": true,
      "onError": "continueErrorOutput"
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 14 * * 0"
            }
          ]
        }
      },
      "id": "a5321231-fe6c-4cec-963b-9c4ebc313230",
      "name": "每週日14:00",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [
        -288,
        16
      ]
    },
    {
      "parameters": {
        "select": "user",
        "user": {
          "__rl": true,
          "value": "U07F9203EP8",
          "mode": "list",
          "cachedResultName": "lonely.h"
        },
        "text": "={{$node['Format Notification'].json['notification']}}",
        "otherOptions": {}
      },
      "id": "3846adbc-c429-4f7f-951e-3814374dcc96",
      "name": "Send Success Notification",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.1,
      "position": [
        1024,
        16
      ],
      "webhookId": "379ac1d6-25eb-4a92-a9f2-e2dce54d2915",
      "credentials": {
        "slackApi": {
          "id": "UfdPURfRn78d2HjH",
          "name": "n8n-ops"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "// 【新增節點】檢查 HTTP Request 是否成功\nconst httpResult = $input.all()[0];\n\nif (!httpResult || httpResult.error) {\n  // API 請求失敗\n  const errorMsg = httpResult?.error?.message || '未知錯誤';\n  \n  return {\n    json: {\n      hasError: true,\n      errorMessage: errorMsg,\n      timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })\n    }\n  };\n}\n\n// 成功，繼續執行\nreturn httpResult;"
      },
      "id": "check-api-success",
      "name": "Check API Success",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        112,
        -160
      ]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.hasError }}",
              "value2": true
            }
          ]
        }
      },
      "id": "if-has-error",
      "name": "Has Error?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        288,
        -80
      ]
    },
    {
      "parameters": {
        "select": "user",
        "user": {
          "__rl": true,
          "value": "U07F9203EP8",
          "mode": "list",
          "cachedResultName": "lonely.h"
        },
        "text": "=:warning: 中油油價 API 請求失敗警告\\n\\n:date: 發生時間: {{ $json.timestamp }}\\n:x: 錯誤訊息: {{ $json.errorMessage }}\\n\\n請檢查網路連線或 API 狀態。",
        "otherOptions": {}
      },
      "id": "send-error-notification",
      "name": "Send Error Notification",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.1,
      "position": [
        496,
        -160
      ],
      "webhookId": "error-notification-webhook",
      "credentials": {
        "slackApi": {
          "id": "UfdPURfRn78d2HjH",
          "name": "n8n-ops"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.shouldNotify }}",
              "value2": true
            }
          ]
        }
      },
      "id": "should-notify-filter",
      "name": "Should Notify?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        848,
        16
      ]
    }
  ],
  "connections": {
    "每週日14:00": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request": {
      "main": [
        [
          {
            "node": "Check API Success",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Check API Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check API Success": {
      "main": [
        [
          {
            "node": "Has Error?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Has Error?": {
      "main": [
        [
          {
            "node": "Send Error Notification",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "XML to JSON",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "XML to JSON": {
      "main": [
        [
          {
            "node": "Get Previous Prices",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Previous Prices": {
      "main": [
        [
          {
            "node": "Format Notification",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Notification": {
      "main": [
        [
          {
            "node": "Save to Google Sheets",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Save to Google Sheets": {
      "main": [
        [
          {
            "node": "Should Notify?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Should Notify?": {
      "main": [
        [
          {
            "node": "Send Success Notification",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "baf9ef3389ae9954a59e5ee8a681df3c34a6de0fdb1ec09145b5fdd99e4ef636"
  }
}
