// ============ 設定區 ============

/**
 * 取得試算表
 * 請在這裡填入您的試算表 ID 或使用綁定的試算表
 */
function getSpreadsheet() {
  // 方法1: 使用試算表 ID（請替換成您的試算表 ID）
  // var spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE';
  // return SpreadsheetApp.openById(spreadsheetId);

  // 方法2: 使用此腳本綁定的試算表（如果 GAS 專案綁定在試算表上）
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ============ 使用者認證功能 ============

/**
 * 從試算表讀取所有使用者資料
 * @returns {Object} 使用者資料物件
 */
function loadUsersFromSheet() {
  try {
    const sheet = getSpreadsheet().getSheetByName('users');
    const data = sheet.getDataRange().getValues();
    const users = {};

    // 從第2列開始讀取（第1列是標題）
    // 從第2列開始讀取（第1列是標題）
    for (let i = 1; i < data.length; i++) {
      const username = String(data[i][0]).trim();    // A欄: username
      const password = String(data[i][1]).trim();    // B欄: password
      const displayName = String(data[i][2] || 'unknown'); // C欄: displayName
      const classnum = String(data[i][3] || '');     // D欄: classnum (新增)
      const roles = String(data[i][4] || 'viewer');  // E欄: roles (改為索引 4)
      const status = String(data[i][5] || 'active'); // F欄: status (改為索引 5)

      // 只載入啟用的帳號
      if (username && status === 'active') {
        users[username] = {
          password: password,
          username: username,
          displayName: displayName || username,
          classnum: classnum, // 新增 classnum
          roles: roles ? [roles] : ['viewer']
        };
      }
    }

    Logger.log('成功載入 ' + Object.keys(users).length + ' 個使用者');
    return users;
  } catch (error) {
    Logger.log('載入使用者資料失敗: ' + error.toString());
    return {};
  }
}

/**
 * 使用者登入驗證
 * @param {string} username - 使用者名稱
 * @param {string} password - 密碼
 * @returns {Object} 登入結果
 */
function loginUser(username, password) {
  try {
    Logger.log('嘗試登入: ' + username);

    // 從試算表讀取使用者資料
    const users = loadUsersFromSheet();

    // 驗證使用者
    if (users[username] && users[username].password === password) {
      // 生成 token
      const token = 'token-' + username + '-' + new Date().getTime();

      // 儲存 session
      const scriptProperties = PropertiesService.getScriptProperties();
      const sessions = scriptProperties.getProperty('sessions');
      const sessionData = sessions ? JSON.parse(sessions) : {};

      sessionData[token] = {
        username: username,
        displayName: users[username].displayName,
        roles: users[username].roles,
        nationalId: users[username].password,
        loginTime: new Date().getTime()
      };

      scriptProperties.setProperty('sessions', JSON.stringify(sessionData));

      Logger.log('登入成功: ' + username);
      return {
        code: 0,
        data: {
          token: token
        },
        message: '登入成功'
      };
    } else {
      Logger.log('登入失敗: 帳號或密碼錯誤');
      return {
        code: 401,
        data: null,
        message: '帳號或密碼錯誤'
      };
    }
  } catch (error) {
    Logger.log('登入錯誤: ' + error.toString());
    return {
      code: 500,
      data: null,
      message: '登入失敗: ' + error.toString()
    };
  }
}

/**
 * 取得使用者資訊
 * @param {string} token - 認證 token
 * @returns {Object} 使用者資訊
 */
function getUserInfo(token) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sessions = scriptProperties.getProperty('sessions');

    if (!sessions) {
      return {
        code: 401,
        data: null,
        message: 'Token 無效'
      };
    }

    const sessionData = JSON.parse(sessions);

    if (sessionData[token]) {
      return {
        code: 0,
        data: {
          username: sessionData[token].username,
          displayName: sessionData[token].displayName,
          roles: sessionData[token].roles,
          nationalId: sessionData[token].nationalId
        },
        message: '成功'
      };
    } else {
      return {
        code: 401,
        data: null,
        message: 'Token 無效或已過期'
      };
    }
  } catch (error) {
    Logger.log('取得使用者資訊失敗: ' + error.toString());
    return {
      code: 500,
      data: null,
      message: '取得使用者資訊失敗: ' + error.toString()
    };
  }
}

/**
 * 登出
 * @param {string} token - 認證 token
 * @returns {Object} 登出結果
 */
function logoutUser(token) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sessions = scriptProperties.getProperty('sessions');

    if (sessions) {
      const sessionData = JSON.parse(sessions);
      delete sessionData[token];
      scriptProperties.setProperty('sessions', JSON.stringify(sessionData));
    }

    return {
      code: 0,
      data: null,
      message: '登出成功'
    };
  } catch (error) {
    return {
      code: 500,
      data: null,
      message: '登出失敗: ' + error.toString()
    };
  }
}

// ============ 測試用函數 ============

/**
 * 測試讀取使用者資料（可在 GAS 編輯器中執行此函數測試）
 */
function testLoadUsers() {
  const users = loadUsersFromSheet();
  Logger.log('載入的使用者數量: ' + Object.keys(users).length);
  Logger.log(JSON.stringify(users, null, 2));
  return users;
}

/**
 * 測試登入功能
 */
function testLogin() {
  const result = loginUser('admin', '12345678');
  Logger.log('登入測試結果: ' + JSON.stringify(result, null, 2));
  return result;
}

/**
 * 測試總務股長統計功能
 */
function testOfficerStatus() {
  // 測試學號 123（林小良，總務股長，classnum: 10103）
  const result = getOfficerStatus('123');
  Logger.log('總務股長統計測試結果: ' + JSON.stringify(result, null, 2));
  return result;
}

// ============ 總務股長統計功能 ============

/**
 * 取得總務股長班級填報統計
 * @param {string} stunum - 學號（對應 username）
 * @returns {Object} 統計結果
 */
function getOfficerStatus(stunum) {
  try {
    // 1. 權限檢查
    const users = loadUsersFromSheet();

    // 檢查使用者是否存在
    if (!users[stunum]) {
      Logger.log('使用者不存在: ' + stunum);
      return {
        code: 404,
        data: null,
        message: '使用者不存在'
      };
    }

    const user = users[stunum];

    // 檢查是否為總務股長
    if (!user.roles || !user.roles.includes('chief')) {
      Logger.log('非總務股長: ' + stunum);
      return {
        code: 0,
        data: null,
        message: '非總務股長'
      };
    }

    // 2. 取得班級前綴（前3個字元）
    const classPrefix = user.classnum.substring(0, 3);
    Logger.log('班級代號: ' + classPrefix);

    // 3. 讀取與統計資料
    const sheet = getSpreadsheet().getSheetByName('active');

    if (!sheet) {
      Logger.log('找不到 active 工作表');
      return {
        code: 500,
        data: null,
        message: '找不到 active 工作表'
      };
    }

    const data = sheet.getDataRange().getValues();

    // 找出標題列的欄位索引（支援中英文欄位名稱）
    const headers = data[0];

    // 嘗試找 classnum 或 班級座號
    let classnumIndex = headers.indexOf('classnum');
    if (classnumIndex === -1) {
      classnumIndex = headers.indexOf('班級座號');
    }

    // 嘗試找 name 或 學生姓名
    let nameIndex = headers.indexOf('name');
    if (nameIndex === -1) {
      nameIndex = headers.indexOf('學生姓名');
    }

    // 找 isok
    const isokIndex = headers.indexOf('isok');

    Logger.log('欄位索引 - classnumIndex: ' + classnumIndex + ', nameIndex: ' + nameIndex + ', isokIndex: ' + isokIndex);

    if (classnumIndex === -1 || isokIndex === -1 || nameIndex === -1) {
      Logger.log('找不到必要欄位，標題列：' + JSON.stringify(headers));
      return {
        code: 500,
        data: null,
        message: '工作表欄位設定錯誤，找不到必要欄位'
      };
    }

    // 統計變數
    let totalCount = 0;
    let completedCount = 0;
    const uncompletedList = [];

    // 從第2列開始遍歷資料（跳過標題列）
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const classnumValue = String(row[classnumIndex]).trim();
      const isokValue = String(row[isokIndex]).trim().toLowerCase();
      const nameValue = String(row[nameIndex]).trim();

      // 檢查是否符合班級代號
      if (classnumValue.startsWith(classPrefix)) {
        totalCount++;

        // 檢查是否已填寫
        if (isokValue === 'ok') {
          completedCount++;
        } else {
          // 未填寫，加入名單
          uncompletedList.push({
            seat: classnumValue,
            name: nameValue
          });
        }
      }
    }

    Logger.log('統計完成 - 應填: ' + totalCount + ', 已填: ' + completedCount);

    // 4. 回傳結果
    return {
      code: 0,
      data: {
        totalCount: totalCount,
        completedCount: completedCount,
        uncompletedList: uncompletedList
      },
      message: '成功'
    };

  } catch (error) {
    Logger.log('取得總務股長統計失敗: ' + error.toString());
    return {
      code: 500,
      data: null,
      message: '取得統計資料失敗: ' + error.toString()
    };
  }
}
