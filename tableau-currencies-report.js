{
  "nodes": [
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "success",
              "leftValue": "={{ $json.action }}",
              "rightValue": "success",
              "operator": {
                "type": "string",
                "operation": "equals",
                "singleValue": true
              }
            },
            {
              "id": "retry",
              "leftValue": "={{ $json.action }}",
              "rightValue": "retry",
              "operator": {
                "type": "string",
                "operation": "equals",
                "singleValue": true
              }
            },
            {
              "id": "skip",
              "leftValue": "={{ $json.action }}",
              "rightValue": "skip",
              "operator": {
                "type": "string",
                "operation": "equals",
                "singleValue": true
              }
            },
            {
              "id": "fail",
              "leftValue": "={{ $json.action }}",
              "rightValue": "fail",
              "operator": {
                "type": "string",
                "operation": "equals",
                "singleValue": true
              }
            }
          ],
          "combinator": "or"
        },
        "options": {}
      },
      "id": "7c43b9f1-2b92-4c16-a0e7-dadf31bbc1c5",
      "name": "Decide Action",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        -64,
        848
      ]
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "15 09 * * *"
            }
          ]
        }
      },
      "id": "6a3ce210-36af-456e-9150-9d1facd68274",
      "name": "每日早上09:",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [
        -1920,
        848
      ]
    },
    {
      "parameters": {
        "jsCode": "// 取得台北時區的日期與時間\nconst now = new Date();\nconst timezone = 'Asia/Taipei';\nconst dateStr = now.toLocaleDateString('zh-TW', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\\//g, '-');\nconst timeStr = now.toLocaleTimeString('zh-TW', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });\n\nreturn {\n  json: {\n    current_date: dateStr,\n    current_time: timeStr,\n    timestamp: now.toISOString(),\n    timezone: timezone\n  }\n};"
      },
      "id": "24d924f1-b82b-4d30-99d2-61ce57a75ac2",
      "name": "Get Date Time",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1712,
        848
      ]
    },
    {
      "parameters": {
        "jsCode": "// 格式化日期為所需格式\nconst inputData = $input.first().json;\nconst currentDate = inputData.current_date;\nconst formattedDate = currentDate.replace(/-/g, '');\n\nreturn {\n  json: {\n    ...inputData,\n    formatted_date: formattedDate,\n    display_date: currentDate,\n    api_date: formattedDate\n  }\n};"
      },
      "id": "2eb9cff6-e5f1-49d3-8ef6-0b9c5717de7d",
      "name": "Format Date",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1488,
        848
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://prod-apnortheast-a.online.tableau.com/api/3.4/auth/signin",
        "sendBody": true,
        "contentType": "raw",
        "body": "<tsRequest>|\t<credentials\t  personalAccessTokenName=\"n8n-token\" personalAccessTokenSecret=\"2q8IRO+0QRqBlyPkN/ExXg==:VLH8z7ApygXo7nOEqXqtZtd1SgASPRii\" >  \t\t<site contentUrl=\"tableauadmin59b92d016b\" />\t</credentials></tsRequest>",
        "options": {}
      },
      "id": "d9c8582d-f1f4-48ab-ae19-90f547e3da6b",
      "name": "Tableau Login",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        -1264,
        848
      ]
    },
    {
      "parameters": {
        "jsCode": "// 取得輸入數據\nconst dateData = $input.all().find(item => item.json.formatted_date)?.json || $input.first().json;\nconst tableauAuth = $input.all().find(item => item.json.credentials || item.json.token)?.json || $input.first().json;\n\nconst TABLEAU_SITE_ID = $env.TABLEAU_SITE_ID || \"1b4032aa-745d-491e-93a6-847c7d77e26e\";\nconst TABLEAU_BASE_URL = \"https://prod-apnortheast-a.online.tableau.com/api/3.4\";\n\n// 提取 Tableau token\nlet tableauToken = null;\ntry {\n  if (tableauAuth.credentials) {\n    tableauToken = tableauAuth.credentials.token || tableauAuth.credentials.sessionId;\n  } else if (tableauAuth.token) {\n    tableauToken = tableauAuth.token;\n  }\n} catch (error) {\n  console.log('無法獲取 Tableau token:', error.message);\n}\n\n// 數據源配置 - 嚴格按順序排列\nconst dataSources = [\n  { id: \"PHP\", name: \"PHP日報\", viewId: \"0b7a5bb5-8175-4054-9f01-9526545ce1a0\", tableauWorkbook: \"PHP-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"PHP日報\", threadTs: \"1751956785.291529\", order: 1, sortOrder: \"001\" },\n  { id: \"BDT\", name: \"BDT日報\", viewId: \"310f3cf5-b69b-4ea1-98ab-ecfa22c92b3a\", tableauWorkbook: \"BDT-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"BDT日報\", threadTs: \"1751963000.070679\", order: 2, sortOrder: \"002\" },\n  { id: \"IDR\", name: \"IDR日報\", viewId: \"f134baf2-4a65-45b7-9580-2d799335647e\", tableauWorkbook: \"IDR-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"IDR日報\", threadTs: \"1751959097.357189\", order: 3, sortOrder: \"003\" },\n  { id: \"INR\", name: \"INR日報\", viewId: \"c50261d9-8467-4b75-a821-111adb0972e8\", tableauWorkbook: \"INR-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"INR日報\", threadTs: \"1751964126.401729\", order: 4, sortOrder: \"004\" },\n  { id: \"VND\", name: \"VND日報\", viewId: \"021fd5cb-a51a-4932-b7b5-f0d3608d7111\", tableauWorkbook: \"VND-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"VND日報\", threadTs: \"1751959401.083219\", order: 5, sortOrder: \"005\" },\n  { id: \"PKR\", name: \"PKR日報\", viewId: \"ec182a16-5168-4d86-bd82-867e7edd9604\", tableauWorkbook: \"PKR-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"PKR日報\", threadTs: \"1751960366.985189\", order: 6, sortOrder: \"006\" },\n  { id: \"GMP\", name: \"GMP日報\", viewId: \"404c95b0-6d2b-405d-a37f-24b9b2943fa2\", tableauWorkbook: \"GMP-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"GMP日報\", threadTs: \"1751960289.522089\", order: 7, sortOrder: \"007\" },\n  { id: \"MYR\", name: \"MYR日報\", viewId: \"c83305bf-baa0-4386-b7d6-163c02a427e0\", tableauWorkbook: \"MYR-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"MYR日報\", threadTs: \"1751962338.743799\", order: 8, sortOrder: \"008\" },\n  { id: \"KRW\", name: \"KRW日報\", viewId: \"204c9add-ecde-4bdc-bb78-b2aef2954442\", tableauWorkbook: \"KRW-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"KRW日報\", threadTs: \"1751963933.340389\", order: 9, sortOrder: \"009\" },\n  { id: \"BRL\", name: \"BRL日報\", viewId: \"0f9d14f7-75da-47de-bf85-908619c4614b\", tableauWorkbook: \"BRL-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"BRL日報\", threadTs: \"1751963419.449579\", order: 10, sortOrder: \"010\" },\n  { id: \"THB\", name: \"THB日報\", viewId: \"e783ff72-1fdb-407f-99be-b20629625600\", tableauWorkbook: \"THB-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"THB日報\", threadTs: \"1751960487.171699\", order: 11, sortOrder: \"011\" },\n  { id: \"MXN\", name: \"MXN日報\", viewId: \"f014e89a-87ce-4124-ab55-6b825cd37244\", tableauWorkbook: \"MXN-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"MXN日報\", threadTs: \"1751963494.891839\", order: 12, sortOrder: \"012\" },\n  { id: \"NPR\", name: \"NPR日報\", viewId: \"2a7ecee0-8bf3-4280-9999-9a6e7fcb0009\", tableauWorkbook: \"NPR-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"NPR日報\", threadTs: \"1751964366.372059\", order: 13, sortOrder: \"013\" },\n  { id: \"SGD\", name: \"SGD日報\", viewId: \"ce312594-7ef1-40a1-a9a0-fa2a1c863fca\", tableauWorkbook: \"SGD-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"SGD日報\", threadTs: \"1751964063.361709\", order: 14, sortOrder: \"014\" },\n  { id: \"USD\", name: \"USD日報\", viewId: \"8591b12e-5010-4c67-9750-46c0aca5a7d8\", tableauWorkbook: \"USD-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"USD日報\", threadTs: \"1751963580.515309\", order: 15, sortOrder: \"015\" },\n  { id: \"JPY\", name: \"JPY日報\", viewId: \"ebfd8ead-992f-401f-b2d2-c28b2894c4d7\", tableauWorkbook: \"JPY-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"JPY日報\", threadTs: \"1751963654.735119\", order: 16, sortOrder: \"016\" },\n  { id: \"HKD\", name: \"HKD日報\", viewId: \"3bc59b7b-314d-4d83-b84a-64c237231503\", tableauWorkbook: \"HKD-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"HKD日報\", threadTs: \"1751963732.125829\", order: 17, sortOrder: \"017\" },\n  { id: \"AUD\", name: \"AUD日報\", viewId: \"f70f45e1-77f5-4a4a-9328-a3e8a5d0cd9a\", tableauWorkbook: \"AUD-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"AUD日報\", threadTs: \"1751963802.314139\", order: 18, sortOrder: \"018\" },\n  { id: \"CNY\", name: \"CNY日報\", viewId: \"588feb74-6a1b-4f07-a004-06128ffa12de\", tableauWorkbook: \"CNY-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"CNY日報\", threadTs: \"1751963869.606039\", order: 19, sortOrder: \"019\" },\n  { id: \"EUR\", name: \"EUR日報\", viewId: \"e6e41e8d-9b1c-4954-989b-fb7f57df1c7f\", tableauWorkbook: \"EUR-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"EUR日報\", threadTs: \"1751963998.991089\", order: 20, sortOrder: \"020\" },\n  { id: \"MMK\", name: \"MMK日報\", viewId: \"5f288a63-4b9c-4756-a8d6-e784a215c342\", tableauWorkbook: \"MMK-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"MMK日報\", threadTs: \"1751964203.552189\", order: 21, sortOrder: \"021\" },\n  { id: \"BND\", name: \"BND日報\", viewId: \"67af8635-643d-466e-97e7-1504f87ddc63\", tableauWorkbook: \"BND-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"BND日報\", threadTs: \"1751964299.219369\", order: 22, sortOrder: \"022\" },\n  { id: \"AED\", name: \"AED日報\", viewId: \"bc31da8b-d4a8-440f-a964-67d3726c4ed5\", tableauWorkbook: \"AED-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"AED日報\", threadTs: \"1751968214.821629\", order: 23, sortOrder: \"023\" },\n  { id: \"RUB\", name: \"RUB日報\", viewId: \"088d942a-a56f-4096-9610-ff0b457eef63\", tableauWorkbook: \"RUB-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"RUB日報\", threadTs: \"1751964430.881059\", order: 24, sortOrder: \"024\" },\n  { id: \"CAD\", name: \"CAD日報\", viewId: \"a31d6305-f5ab-4eef-b180-4c7eb4dbf469\", tableauWorkbook: \"CAD-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"CAD日報\", threadTs: \"1758793574.161249\", order: 25, sortOrder: \"025\" },\n  { id: \"COP\", name: \"COP日報\", viewId: \"bc4a1b1a-3ba7-4be2-8c88-4e0676d44856\", tableauWorkbook: \"COP-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"COP日報\", threadTs: \"1758793742.385739\", order: 26, sortOrder: \"026\" },\n  { id: \"IRR\", name: \"IRR日報\", viewId: \"1c3430c7-ba32-4eb2-8aec-ffda768d3fdc\", tableauWorkbook: \"IRR-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"IRR日報\", threadTs: \"1758793749.403669\", order: 27, sortOrder: \"027\" },\n  { id: \"KES\", name: \"KES日報\", viewId: \"1a990f9e-88d5-4d26-8fdb-30a052df339f\", tableauWorkbook: \"KES-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"KES日報\", threadTs: \"1758793757.747249\", order: 28, sortOrder: \"028\" },\n  { id: \"LAK\", name: \"LAK日報\", viewId: \"3d3d7bc9-a7c7-4dc9-bbd0-486b286df5f7\", tableauWorkbook: \"LAK-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"LAK日報\", threadTs: \"1758793763.409699\", order: 29, sortOrder: \"029\" },\n  { id: \"TRY\", name: \"TRY日報\", viewId: \"150533c3-1aa5-4b9a-8ef7-a60fd8692bc7\", tableauWorkbook: \"TRY-DailyRpt\", slackChannel: \"#tableau-遊戲日報-月報\", description: \"TRY日報\", threadTs: \"1758793771.055689\", order: 30, sortOrder: \"030\" }\n];\n\nconst sortedDataSources = dataSources.sort((a, b) => a.order - b.order);\n\nconsole.log(`準備處理 ${sortedDataSources.length} 個數據源`);\n\nconst results = sortedDataSources.map((source, index) => ({\n  json: {\n    ...source,\n    index: index + 1,\n    total: sortedDataSources.length,\n    date: dateData.formatted_date,\n    displayDate: dateData.display_date,\n    startTime: new Date().toISOString(),\n    status: 'pending',\n    tableauToken,\n    siteId: TABLEAU_SITE_ID,\n    baseUrl: TABLEAU_BASE_URL,\n    executionOrder: index + 1,\n    retryCount: 0,\n    maxRetries: 2\n  }\n}));\n\nreturn results;"
      },
      "id": "a9284ce6-3091-47f7-ae30-a41d10faf787",
      "name": "Data Sources Config",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1056,
        848
      ]
    },
    {
      "parameters": {
        "options": {
          "reset": false
        }
      },
      "id": "4cac1cb9-4193-4298-8326-c0683d65c25c",
      "name": "Process Data Sources",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [
        -784,
        848
      ]
    },
    {
      "parameters": {
        "url": "={{$json.baseUrl}}/sites/{{$json.siteId}}/views/{{$json.viewId}}/image?maxAge=1&:refresh=y",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-Tableau-Auth",
              "value": "={{$json.tableauToken}}"
            }
          ]
        },
        "options": {
          "timeout": 60000
        }
      },
      "id": "fdc6f465-ee76-46e2-98a2-2045cf2584ce",
      "name": "Get Tableau Image",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        -464,
        848
      ],
      "continueOnFail": true
    },
    {
      "parameters": {
        "jsCode": "const item = $input.first();\nconst response = item.json;\nconst binary = item.binary;\nconst config = $('Process Data Sources').item.json;\nconst retryCount = config.retryCount || 0;\nconst MAX_RETRIES = 3;\n\n// 強制重試次數保護\nif (retryCount >= MAX_RETRIES) {\n  return [{\n    json: {\n      ...response,\n      ...config,\n      action: 'fail',\n      reason: `已達最大重試次數 (${retryCount})`,\n      forceStop: true,\n      finalStatus: 'failed_after_retries'\n    }\n  }];\n}\n\n// 檢查成功條件\nconst hasError = !!response.error;\nconst statusCode = response.statusCode || 0;\nconst hasBinary = binary && binary.data;\nconst isSuccessStatus = statusCode >= 200 && statusCode < 300;\n\n// 如果有 binary 數據且沒有錯誤，視為成功\nif (hasBinary && !hasError) {\n  return [{\n    json: {\n      ...response,\n      ...config,\n      action: 'success',\n      processingTime: new Date() - new Date(config.startTime)\n    },\n    binary\n  }];\n}\n\n// 如果狀態碼是 2xx 且沒有錯誤，視為成功\nif (isSuccessStatus && !hasError) {\n  return [{\n    json: {\n      ...response,\n      ...config,\n      action: 'success',\n      processingTime: new Date() - new Date(config.startTime)\n    },\n    binary\n  }];\n}\n\n// 定義可重試的錯誤代碼\nconst RETRYABLE_ERROR_CODES = ['ETIMEDOUT', 'ECONNABORTED', 'ECONNRESET', 'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED'];\nconst errorCode = response.error?.code;\nconst isRetryableError = errorCode && RETRYABLE_ERROR_CODES.includes(errorCode);\n\n// 錯誤分類\nlet action = 'fail';\nlet reason = 'Unknown error';\nlet waitTime = 0;\n\nif (statusCode === 404) {\n  action = 'skip';\n  reason = 'View 不存在 (404)';\n} else if (statusCode === 401 || statusCode >= 500 || isRetryableError) {\n  action = 'retry';\n  reason = `${response.error?.message || 'HTTP ' + statusCode} (錯誤碼: ${errorCode || statusCode})`;\n  // 指數退避策略: 5秒, 10秒, 20秒\n  waitTime = Math.pow(2, retryCount) * 5;\n} else {\n  action = 'fail';\n  reason = response.error?.message || `HTTP ${statusCode}`;\n}\n\n// 記錄重試資訊\nconst retryInfo = action === 'retry' ? {\n  retryAttempt: retryCount + 1,\n  maxRetries: MAX_RETRIES,\n  nextWaitTime: waitTime,\n  errorType: errorCode || statusCode\n} : {};\n\n// 返回結果\nreturn [{\n  json: {\n    ...response,\n    ...config,\n    retryCount: action === 'retry' ? retryCount + 1 : retryCount,\n    action,\n    reason,\n    waitTime,\n    ...retryInfo,\n    checkTime: new Date().toISOString()\n  },\n  binary\n}];"
      },
      "id": "f931f7f8-d7d9-481a-b321-fda295463650",
      "name": "Check Response Status",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -256,
        848
      ]
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "resource": "file",
        "options": {
          "fileName": "={{ $('Process Data Sources').item.json.tableauWorkbook }}",
          "title": "={{ DateTime.now().toFormat('yyyy-MM-dd') }} {{ $('Process Data Sources').item.json.name }}"
        }
      },
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.3,
      "position": [
        128,
        496
      ],
      "id": "a66f7b13-2b76-4595-9772-0a858d530e81",
      "name": "Upload Image",
      "webhookId": "6c6d390e-a551-4488-955d-3d41644956a1",
      "credentials": {
        "slackOAuth2Api": {
          "id": "KNVe8c0mMqQQTpnW",
          "name": "n8n-slackapi-oauth2"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://slack.com/api/chat.postMessage",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "slackOAuth2Api",
        "sendBody": true,
        "contentType": "multipart-form-data",
        "bodyParameters": {
          "parameters": [
            {
              "name": "channel",
              "value": "={{ $('Process Data Sources').item.json.slackChannel }}"
            },
            {
              "name": "reply_broadcast",
              "value": "true"
            },
            {
              "name": "blocks",
              "value": "=[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"{{ $json.permalink }}\"}}]"
            },
            {
              "name": "thread_ts",
              "value": "={{ $('Process Data Sources').item.json.threadTs }}"
            }
          ]
        },
        "options": {}
      },
      "id": "806fe150-5594-41c4-b4b3-fa3c826f47f5",
      "name": "Post Slack Message",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        320,
        496
      ],
      "credentials": {
        "slackOAuth2Api": {
          "id": "KNVe8c0mMqQQTpnW",
          "name": "n8n-slackapi-oauth2"
        }
      }
    },
    {
      "parameters": {
        "amount": 3,
        "unit": "seconds"
      },
      "id": "776ddf2e-358b-4c0d-ab5a-5ccf68878927",
      "name": "Wait 3s Between Uploads",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        512,
        496
      ],
      "webhookId": "19cf67cf-4aed-4dcd-b599-9cc27dcc7c50"
    },
    {
      "parameters": {
        "amount": "={{$json.waitTime}}",
        "unit": "seconds"
      },
      "id": "e6ec8ba7-c60a-4d5c-85f8-8e5a0b57c218",
      "name": "Wait Before Retry",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        192,
        752
      ],
      "webhookId": "retry-wait-webhook"
    },
    {
      "parameters": {
        "jsCode": "const item = $input.first().json;\nconst timestamp = new Date().toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' });\nconsole.log(`⏭️  [SKIPPED] ${item.name} (${item.index}/${item.total})`);\nconsole.log(`    Reason: ${item.reason}`);\nconsole.log(`    View ID: ${item.viewId}`);\nconsole.log(`    Time: ${timestamp}`);\nreturn [{ json: { ...item, status: 'skipped', completedAt: new Date().toISOString() } }];"
      },
      "id": "6d1826b1-85ee-4617-956c-78f1e6621d2b",
      "name": "Log Skipped Item",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        144,
        944
      ]
    },
    {
      "parameters": {
        "jsCode": "const item = $input.first().json;\nconst timestamp = new Date().toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' });\nconst retryAttempts = item.retryCount || 0;\nconsole.log(`❌ [FAILED] ${item.name} (${item.index}/${item.total})`);\nconsole.log(`    Reason: ${item.reason}`);\nif (retryAttempts > 0) {\n  console.log(`    Retry Attempts: ${retryAttempts}`);\n}\nconsole.log(`    Error Type: ${item.errorType || 'Unknown'}`);\nconsole.log(`    View ID: ${item.viewId}`);\nconsole.log(`    Time: ${timestamp}`);\nreturn [{ json: { ...item, status: 'failed', completedAt: new Date().toISOString() } }];"
      },
      "id": "7177396b-15b1-4db2-bad5-9dd9fb98b3b6",
      "name": "Log Failed Item",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        144,
        1040
      ]
    },
    {
      "parameters": {
        "jsCode": "// Workflow execution completed - summary statistics\nconst now = new Date();\nconst endTime = now.toISOString();\nconst dateStr = now.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' });\nconst timeStr = now.toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });\n\n// Get total currency count from input\nconst items = $input.all();\nconst totalCurrencies = items.length || 30;\nconst firstItem = items[0]?.json;\nconst workflowStartTime = firstItem?.startTime || endTime;\n\n// Calculate total execution time\nconst executionTimeMs = new Date(endTime) - new Date(workflowStartTime);\nconst executionTimeMin = Math.floor(executionTimeMs / 60000);\nconst executionTimeSec = Math.floor((executionTimeMs % 60000) / 1000);\n\nconst summary = {\n  workflowName: 'Tableau Currency Daily Report',\n  date: dateStr,\n  time: timeStr,\n  endTime: endTime,\n  startTime: workflowStartTime,\n  totalCurrencies: totalCurrencies,\n  executionTime: `${executionTimeMin}m ${executionTimeSec}s`,\n  executionTimeMs: executionTimeMs,\n  status: 'completed',\n  message: `Tableau Currency Daily Report workflow completed\\nProcessed ${totalCurrencies} currencies\\nTotal time: ${executionTimeMin}m ${executionTimeSec}s\\nCompleted at: ${dateStr} ${timeStr}`\n};\n\nconsole.log(`\\n========== Tableau Workflow Execution Summary ==========`);\nconsole.log(`📊 Total Currencies: ${totalCurrencies}`);\nconsole.log(`⏱️  Execution Time: ${executionTimeMin}m ${executionTimeSec}s`);\nconsole.log(`✅ Completed At: ${dateStr} ${timeStr}`);\nconsole.log(`========================================================\\n`);\n\nreturn [{ json: summary }];"
      },
      "id": "summary-stats-node",
      "name": "Summary Statistics",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -576,
        640
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://slack.com/api/chat.postMessage",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "slackOAuth2Api",
        "sendBody": true,
        "contentType": "multipart-form-data",
        "bodyParameters": {
          "parameters": [
            {
              "name": "channel",
              "value": "#ops-test"
            },
            {
              "name": "text",
              "value": "={{ $json.message }}"
            },
            {
              "name": "blocks",
              "value": "=[{\"type\":\"header\",\"text\":{\"type\":\"plain_text\",\"text\":\"📊 Tableau Currency Daily Report Completed\"}},{\"type\":\"section\",\"fields\":[{\"type\":\"mrkdwn\",\"text\":\"*Status:* ✅ Completed\"},{\"type\":\"mrkdwn\",\"text\":\"*Total Currencies:* {{ $json.totalCurrencies }}\"},{\"type\":\"mrkdwn\",\"text\":\"*Execution Time:* {{ $json.executionTime }}\"},{\"type\":\"mrkdwn\",\"text\":\"*Completed At:* {{ $json.date }} {{ $json.time }}\"}]},{\"type\":\"divider\"},{\"type\":\"context\",\"elements\":[{\"type\":\"mrkdwn\",\"text\":\"📌 Workflow: *Tableau Currency Daily Report* | Environment: Production\"}]}]"
            }
          ]
        },
        "options": {}
      },
      "id": "ops-notification-node",
      "name": "Send Ops Notification",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        -352,
        640
      ],
      "credentials": {
        "slackOAuth2Api": {
          "id": "KNVe8c0mMqQQTpnW",
          "name": "n8n-slackapi-oauth2"
        }
      }
    }
  ],
  "connections": {
    "Decide Action": {
      "main": [
        [
          {
            "node": "Upload Image",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Wait Before Retry",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Log Skipped Item",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Log Failed Item",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "每日早上09:": {
      "main": [
        [
          {
            "node": "Get Date Time",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Date Time": {
      "main": [
        [
          {
            "node": "Format Date",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Date": {
      "main": [
        [
          {
            "node": "Tableau Login",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Tableau Login": {
      "main": [
        [
          {
            "node": "Data Sources Config",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Data Sources Config": {
      "main": [
        [
          {
            "node": "Process Data Sources",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Data Sources": {
      "main": [
        [
          {
            "node": "Summary Statistics",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Get Tableau Image",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Summary Statistics": {
      "main": [
        [
          {
            "node": "Send Ops Notification",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Tableau Image": {
      "main": [
        [
          {
            "node": "Check Response Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Response Status": {
      "main": [
        [
          {
            "node": "Decide Action",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Upload Image": {
      "main": [
        [
          {
            "node": "Post Slack Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Post Slack Message": {
      "main": [
        [
          {
            "node": "Wait 3s Between Uploads",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait 3s Between Uploads": {
      "main": [
        [
          {
            "node": "Process Data Sources",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait Before Retry": {
      "main": [
        [
          {
            "node": "Get Tableau Image",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Log Skipped Item": {
      "main": [
        [
          {
            "node": "Process Data Sources",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Log Failed Item": {
      "main": [
        [
          {
            "node": "Process Data Sources",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "instanceId": "d199863ffc9db867666b46f91ded4dd90670cb9b6704b5177a20902e2f629e3b"
  }
}
