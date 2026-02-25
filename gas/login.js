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

// ============ 系統設定功能 ============

/**
 * 讀取 setup 工作表的系統設定
 * @returns {Object} 系統設定物件 { status, startTime, endTime }
 */
function getSystemSetup() {
  try {
    const sheet = getSpreadsheet().getSheetByName('setup');
    if (!sheet) {
      return {
        code: 500,
        data: null,
        message: '找不到 setup 工作表'
      };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return {
        code: 500,
        data: null,
        message: 'setup 工作表資料不足'
      };
    }

    // setup 工作表為「直向鍵值格式」：
    //   A 欄 = key（撕榜前 / 撕榜後 / 開始時間 / 結束時間）
    //   B 欄 = value（有打 V 的列代表目前生效的狀態；時間列填入時間字串）
    // 第 1 列（data[0]）為標題列（status / 目前狀態），從第 2 列開始讀取資料。
    let status = '撕榜前';
    let startTime = '';
    let endTime = '';

    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0]).trim();
      const val = String(data[i][1]).trim();

      if (key === '撕榜前' || key === '撕榜後') {
        // 哪一列的 B 欄有 V（不分大小寫），就是目前生效的狀態
        if (val.toLowerCase() === 'v') {
          status = key;
        }
      } else if (key === '開始時間') {
        startTime = val;
      } else if (key === '結束時間') {
        endTime = val;
      }
    }

    Logger.log('讀取系統設定成功: status=' + status + ', startTime=' + startTime + ', endTime=' + endTime);
    return {
      code: 0,
      data: { status: status, startTime: startTime, endTime: endTime },
      message: '成功'
    };
  } catch (error) {
    Logger.log('讀取系統設定失敗: ' + error.toString());
    return {
      code: 500,
      data: null,
      message: '讀取系統設定失敗: ' + error.toString()
    };
  }
}

// ============ 志願儲存功能 ============

/**
 * 儲存學生志願序到「撕榜前志願表」
 * @param {string} studentId - 學號
 * @param {Array<string>} preferencesArray - 志願完整代碼陣列（最多 20 筆）
 * @returns {Object} 執行結果
 */
function saveStudentPreferences(studentId, preferencesArray) {
  try {
    if (!studentId) {
      return { code: 400, data: null, message: '學號不得為空' };
    }
    if (!Array.isArray(preferencesArray)) {
      return { code: 400, data: null, message: '志願資料格式錯誤' };
    }
    if (preferencesArray.length > 20) {
      return { code: 400, data: null, message: '志願數量不得超過 20 個' };
    }

    const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.STUDENT_PREFS);
    if (!sheet) {
      return { code: 500, data: null, message: '找不到「' + CONFIG.SHEET_NAMES.STUDENT_PREFS + '」工作表' };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return { code: 500, data: null, message: '工作表資料不足' };
    }

    const headers = data[0];
    const studentIdIdx = headers.indexOf('學號');
    const vol1Idx = headers.indexOf('志願1');

    if (studentIdIdx === -1 || vol1Idx === -1) {
      return { code: 500, data: null, message: '工作表缺少「學號」或「志願1」欄位' };
    }

    // 搜尋該學生所在列
    let targetRowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][studentIdIdx]).trim() === String(studentId).trim()) {
        targetRowIdx = i;
        break;
      }
    }

    if (targetRowIdx === -1) {
      return { code: 404, data: null, message: '找不到學號 ' + studentId + ' 的資料列' };
    }

    // 補齊 20 個欄位（不足補空字串）
    const volValues = [];
    for (let v = 0; v < 20; v++) {
      volValues.push(preferencesArray[v] || '');
    }

    // 寫入志願欄位（GAS 列號從 1 開始，標題列佔第 1 列）
    const targetRow = targetRowIdx + 1;
    const startCol = vol1Idx + 1; // GAS 欄號從 1 開始
    sheet.getRange(targetRow, startCol, 1, 20).setValues([volValues]);

    Logger.log('儲存學生 ' + studentId + ' 志願成功，共 ' + preferencesArray.length + ' 筆');
    return { code: 0, data: null, message: '儲存成功' };

  } catch (error) {
    Logger.log('儲存志願失敗: ' + error.toString());
    return { code: 500, data: null, message: '儲存志願失敗: ' + error.toString() };
  }
}

// ============ 撕榜後志願儲存功能 ============

/**
 * 儲存學生撕榜後志願序到「撕榜後志願表」
 * @param {string} studentId - 學號
 * @param {Array<string>} preferencesArray - 志願完整代碼陣列（最多 50 筆）
 * @returns {Object} 執行結果
 */
function savePostRankingPreferences(studentId, preferencesArray) {
  try {
    if (!studentId) {
      return { code: 400, data: null, message: '學號不得為空' };
    }
    if (!Array.isArray(preferencesArray)) {
      return { code: 400, data: null, message: '志願資料格式錯誤' };
    }
    // 先做技術上限保護（工作表僅有志願1~志願50欄）
    if (preferencesArray.length > 50) {
      return { code: 400, data: null, message: '志願數量不得超過 50 個' };
    }

    const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.POST_RANKING_PREFS);
    if (!sheet) {
      return { code: 500, data: null, message: '找不到「' + CONFIG.SHEET_NAMES.POST_RANKING_PREFS + '」工作表' };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return { code: 500, data: null, message: '工作表資料不足' };
    }

    const headers = data[0];
    const studentIdIdx = headers.indexOf('學號');
    const vol1Idx      = headers.indexOf('志願1');
    const rankingResultIdx = headers.indexOf('撕榜結果');

    if (studentIdIdx === -1 || vol1Idx === -1 || rankingResultIdx === -1) {
      return { code: 500, data: null, message: '工作表缺少必要欄位（學號 / 撕榜結果 / 志願1）' };
    }

    // 搜尋該學生所在列
    let targetRowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][studentIdIdx]).trim() === String(studentId).trim()) {
        targetRowIdx = i;
        break;
      }
    }

    if (targetRowIdx === -1) {
      return { code: 404, data: null, message: '找不到學號 ' + studentId + ' 的資料列' };
    }

    const rankingResult = String(data[targetRowIdx][rankingResultIdx] || '').trim();
    if (!rankingResult) {
      return { code: 400, data: null, message: '尚未完成撕榜，無法儲存志願' };
    }

    const rankingKey = rankingResult.replace(/-$/, '');
    const rankingParts = rankingKey.split('-');
    if (rankingParts.length < 2) {
      return { code: 500, data: null, message: '撕榜結果格式錯誤，無法判定志願上限' };
    }

    const schoolCode = String(parseInt(rankingParts[0], 10));
    const groupCode = String(parseInt(rankingParts[1], 10));
    if (schoolCode === 'NaN' || groupCode === 'NaN') {
      return { code: 500, data: null, message: '撕榜結果代碼無效，無法判定志願上限' };
    }

    const departments = loadDepartmentStandards();
    const matchedDept = departments.find((dept) => {
      const deptSchoolCode = String(parseInt(dept['學校代碼'], 10));
      const deptGroupCode = String(parseInt(dept['學群類別代碼'], 10));
      return deptSchoolCode === schoolCode && deptGroupCode === groupCode;
    });

    if (!matchedDept) {
      return { code: 500, data: null, message: '找不到對應學群的校系分則，無法判定志願上限' };
    }

    const quota = parseInt(matchedDept['招生名額可填志願數'], 10);
    if (isNaN(quota) || quota < 0) {
      return { code: 500, data: null, message: '校系分則「招生名額可填志願數」設定無效' };
    }

    const dynamicLimit = Math.min(quota, 50);
    if (preferencesArray.length > dynamicLimit) {
      return { code: 400, data: null, message: '志願數量不得超過 ' + dynamicLimit + ' 個' };
    }

    // Bug fix #3：建立固定長度 50 的陣列，不足補空字串，確保覆蓋舊資料
    const volValues = [];
    for (let v = 0; v < 50; v++) {
      volValues.push(preferencesArray[v] !== undefined ? preferencesArray[v] : '');
    }

    const targetRow = targetRowIdx + 1; // GAS 列號從 1 開始
    const startCol  = vol1Idx + 1;      // GAS 欄號從 1 開始
    sheet.getRange(targetRow, startCol, 1, 50).setValues([volValues]);

    Logger.log('儲存學生 ' + studentId + ' 撕榜後志願成功，共 ' + preferencesArray.length + ' 筆');
    return { code: 0, data: null, message: '儲存成功' };

  } catch (error) {
    Logger.log('儲存撕榜後志願失敗: ' + error.toString());
    return { code: 500, data: null, message: '儲存撕榜後志願失敗: ' + error.toString() };
  }
}

// ============ PDF 產生功能 ============

/**
 * 觸發 docBuilder.js 邏輯，產生學生志願 PDF
 * @param {string} studentId - 學號
 * @returns {Object} 包含 PDF 網址的結果物件
 */
function generatePDF(studentId) {
  try {
    if (!studentId) {
      return { code: 400, data: null, message: '學號不得為空' };
    }

    const pdfUrl = fillStudentData(studentId);

    Logger.log('學生 ' + studentId + ' PDF 產生成功: ' + pdfUrl);
    return {
      code: 0,
      data: { pdfUrl: pdfUrl },
      message: 'PDF 產生成功'
    };
  } catch (error) {
    Logger.log('PDF 產生失敗: ' + error.toString());
    return { code: 500, data: null, message: 'PDF 產生失敗: ' + error.toString() };
  }
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

    const headers = data[0];
    const usernameIdx    = headers.indexOf('username');
    const passwordIdx    = headers.indexOf('password');
    const displayNameIdx = headers.indexOf('displayName');
    const classnumIdx    = headers.indexOf('classnum');
    const statusIdx      = headers.indexOf('status');

    if (usernameIdx === -1 || passwordIdx === -1) {
      Logger.log('users 工作表缺少必要欄位（username / password），headers: ' + JSON.stringify(headers));
      return {};
    }

    // 從第2列開始讀取（第1列是標題）
    for (let i = 1; i < data.length; i++) {
      const username    = String(data[i][usernameIdx]).trim();
      const password    = String(data[i][passwordIdx]).trim();
      const displayName = displayNameIdx !== -1 ? String(data[i][displayNameIdx] || 'unknown') : 'unknown';
      const classnum    = classnumIdx    !== -1 ? String(data[i][classnumIdx]    || '')        : '';
      const status      = statusIdx      !== -1 ? String(data[i][statusIdx]      || 'active')  : 'active';

      // 只載入啟用的帳號
      if (username && status === 'active') {
        users[username] = {
          password: password,
          username: username,
          displayName: displayName || username,
          classnum: classnum
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
      let sessionData = sessions ? JSON.parse(sessions) : {};

      // 清理超過 24 小時的過期 sessions
      const now = new Date().getTime();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const validSessionData = {};
      let cleanedCount = 0;
      
      for (const [key, session] of Object.entries(sessionData)) {
        if (session.loginTime && (now - session.loginTime < ONE_DAY_MS)) {
          validSessionData[key] = session;
        } else {
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        Logger.log('已清理 ' + cleanedCount + ' 個過期 session');
      }
      
      sessionData = validSessionData;

      sessionData[token] = {
        username: username,
        displayName: users[username].displayName,
        nationalId: users[username].password,
        loginTime: now
      };

      scriptProperties.setProperty('sessions', JSON.stringify(sessionData));

      // 讀取系統設定
      const setupResult = getSystemSetup();
      const setup = setupResult.code === 0 ? setupResult.data : { status: '撕榜前', startTime: '', endTime: '' };

      // 讀取學生 JSON（獨立 try-catch，失敗不影響登入）
      let studentJSON = null;
      let studentJSONError = null;
      try {
        const jsonFolder = DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
        const jsonFileName = 'student_' + username + '.json';
        const files = jsonFolder.getFilesByName(jsonFileName);
        if (files.hasNext()) {
          const jsonFile = files.next();
          studentJSON = JSON.parse(jsonFile.getBlob().getDataAsString());
          Logger.log('成功讀取學生 JSON: ' + jsonFileName);
        } else {
          studentJSONError = '找不到學生校系資料檔案（' + jsonFileName + '），請聯絡管理員';
          Logger.log('找不到學生 JSON: ' + jsonFileName);
        }
      } catch (jsonError) {
        studentJSONError = '讀取學生校系資料失敗: ' + jsonError.toString();
        Logger.log('讀取學生 JSON 失敗: ' + jsonError.toString());
      }

      // 讀取撕榜前已填志願清單
      const preferencesList = getStudentPreferences(username);

      // 讀取撕榜後相關資料（撕榜結果、中文名稱、已選志願）
      const postRankingData = getStudentPostRankingData(username);

      Logger.log('登入成功: ' + username);
      return {
        code: 0,
        data: {
          token: token,
          setup: setup,
          studentJSON: studentJSON,
          studentJSONError: studentJSONError,
          preferencesList: preferencesList,
          rankingResult:   postRankingData.rankingResult,
          rankingName:     postRankingData.rankingName,
          postRankingList: postRankingData.postRankingList
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
      const username = sessionData[token].username;

      // 讀取系統設定
      const setupResult = getSystemSetup();
      const setup = setupResult.code === 0 ? setupResult.data : { status: '撕榜前', startTime: '', endTime: '' };

      // 讀取學生 JSON（獨立 try-catch，失敗不影響取得資訊）
      let studentJSON = null;
      let studentJSONError = null;
      try {
        const jsonFolder = DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
        const jsonFileName = 'student_' + username + '.json';
        const files = jsonFolder.getFilesByName(jsonFileName);
        if (files.hasNext()) {
          const jsonFile = files.next();
          studentJSON = JSON.parse(jsonFile.getBlob().getDataAsString());
          Logger.log('成功讀取學生 JSON: ' + jsonFileName);
        } else {
          studentJSONError = '找不到學生校系資料檔案（' + jsonFileName + '），請聯絡管理員';
          Logger.log('找不到學生 JSON: ' + jsonFileName);
        }
      } catch (jsonError) {
        studentJSONError = '讀取學生校系資料失敗: ' + jsonError.toString();
        Logger.log('讀取學生 JSON 失敗: ' + jsonError.toString());
      }

      // 讀取撕榜前已填志願清單
      const preferencesList = getStudentPreferences(username);

      // 讀取撕榜後相關資料（撕榜結果、中文名稱、已選志願）
      const postRankingData = getStudentPostRankingData(username);

      return {
        code: 0,
        data: {
          username: sessionData[token].username,
          displayName: sessionData[token].displayName,
          nationalId: sessionData[token].nationalId,
          setup: setup,
          studentJSON: studentJSON,
          studentJSONError: studentJSONError,
          preferencesList: preferencesList,
          rankingResult:   postRankingData.rankingResult,
          rankingName:     postRankingData.rankingName,
          postRankingList: postRankingData.postRankingList
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

