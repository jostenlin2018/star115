/**
 * 為所有學生產生 JSON 檔案
 * 主要執行函數
 * 自動檢查【選取】欄位，為標記為 V 或 v 的學生生成 JSON
 */
function generateSelectedStudentsJSON() {
  try {
    // 取得當前活動的試算表和工作表
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const activeSheet = ss.getActiveSheet();

    // 檢查是否為【學測英聽術科成績】工作表
    if (activeSheet.getName() !== CONFIG.SHEET_NAMES.STUDENT_SCORES) {
      const message = `請先切換到【${CONFIG.SHEET_NAMES.STUDENT_SCORES}】工作表再執行`;
      Logger.log(message);
      SpreadsheetApp.getUi().alert(message);
      return {
        錯誤: message,
        成功: [],
        失敗: []
      };
    }

    // 取得所有資料
    const data = activeSheet.getDataRange().getValues();
    const headers = data[0];

    // 找出各欄位的索引
    const selectIndex = headers.indexOf('選取');
    const studentIdIndex = headers.indexOf('學號');
    const timestampIndex = headers.indexOf('時間戳記');

    // 檢查必要欄位是否存在
    if (selectIndex === -1) {
      throw new Error('找不到【選取】欄位，請確認【選取】欄位在時間戳記前面');
    }

    if (studentIdIndex === -1) {
      throw new Error('找不到【學號】欄位');
    }

    if (timestampIndex === -1) {
      throw new Error('找不到【時間戳記】欄位');
    }

    // 從所有資料中篩選出【選取】欄位為 V 或 v 的學生
    const studentData = [];

    for (let i = 1; i < data.length; i++) { // 從第2列開始（跳過標題列）
      const selectValue = data[i][selectIndex];
      const studentId = data[i][studentIdIndex];

      // 檢查【選取】欄位是否為 V 或 v
      if (selectValue && (selectValue.toString().toUpperCase() === 'V') && studentId) {
        studentData.push({
          學號: studentId,
          列號: i + 1 // 實際列號（Excel 列號從 1 開始）
        });
      }
    }

    // 檢查是否有需要處理的學生
    if (studentData.length === 0) {
      const message = '沒有找到任何標記為 V 或 v 的學生\n\n請在【選取】欄位中填入 V 或 v 來標記要生成 JSON 的學生';
      Logger.log(message);
      SpreadsheetApp.getUi().alert(message);
      return {
        錯誤: message,
        成功: [],
        失敗: []
      };
    }

    Logger.log(`開始處理 ${studentData.length} 位學生...`);

    // 預先載入所有標準資料（只讀取一次）
    Logger.log('正在載入標準資料...');
    const referenceData = {
      students: loadStudentScores(),
      departments: loadDepartmentStandards(),
      gsatStandards: loadGSATStandards(),
      skillStandards: loadSkillStandards(),
      uniRankReqs: loadUniversityRankRequirements(),
      semesterRankData: loadSemesterRankData()
    };
    Logger.log('標準資料載入完成');

    // 準備 Drive 環境（預先載入資料夾與檔案列表）
    Logger.log('正在準備 Drive 環境...');
    const folder = DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
    const files = folder.getFiles();
    const fileMap = {};
    while (files.hasNext()) {
      const file = files.next();
      fileMap[file.getName()] = file;
    }
    Logger.log(`Drive 環境準備完成，目前共有 ${Object.keys(fileMap).length} 個檔案`);

    const results = {
      成功: [],
      失敗: []
    };

    // 處理每位學生
    for (let i = 0; i < studentData.length; i++) {
      const item = studentData[i];
      const studentId = item.學號;
      const rowNumber = item.列號;

      try {
        Logger.log(`[${i + 1}/${studentData.length}] ${studentId}`);

        // 取得學生 JSON (傳入預先載入的資料)
        const jsonData = buildStudentDataJSON(studentId, referenceData);

        // 儲存到 Drive (傳入預先準備的 folder 和 fileMap)
        const fileId = saveJSONToDrive(studentId, jsonData, folder, fileMap);

        // 更新時間戳記（使用台北時區 GMT+8）
        const timestamp = new Date();
        const taipeiTime = Utilities.formatDate(timestamp, 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
        activeSheet.getRange(rowNumber, timestampIndex + 1).setValue(taipeiTime);

        // 清空【選取】欄位（處理完成後自動清除標記）
        activeSheet.getRange(rowNumber, selectIndex + 1).setValue('');

        // 計算實際可選填校系數（所有分組中的科系總數）
        let totalDepts = 0;
        jsonData.可選填校系.forEach(group => {
          totalDepts += group.可選填科系.length;
        });

        results.成功.push({
          學號: studentId,
          檔案ID: fileId,
          可選填校系數: totalDepts,
          分組數: jsonData.可選填校系.length
        });

        // 避免超過 Google API 限制，每處理一個學生暫停一下
        Utilities.sleep(100);

      } catch (error) {
        Logger.log(`❌ ${studentId}: ${error.message}`);
        results.失敗.push({
          學號: studentId,
          錯誤: error.message
        });

        // 即使失敗也清空【選取】欄位，避免重複處理
        activeSheet.getRange(rowNumber, selectIndex + 1).setValue('');
      }
    }

    // 輸出結果摘要
    Logger.log(`\n✅ 完成: ${results.成功.length} 位 ${results.失敗.length > 0 ? '| ❌ 失敗: ' + results.失敗.length + ' 位' : ''}`);

    if (results.失敗.length > 0) {
      results.失敗.forEach(item => {
        Logger.log(`   ${item.學號}: ${item.錯誤}`);
      });
    }

    // 強制刷新介面，確保儲存格更新立即生效
    SpreadsheetApp.flush();

    // 顯示完成訊息
    let summaryMessage = `處理完成！\n成功: ${results.成功.length} 位\n失敗: ${results.失敗.length} 位`;
    if (results.失敗.length > 0) {
      summaryMessage += '\n\n失敗的學生:\n';
      results.失敗.forEach(item => {
        summaryMessage += `  ${item.學號}: ${item.錯誤}\n`;
      });
    }

    // 根據結果選擇顯示方式
    if (results.失敗.length === 0) {
      // 完全成功：使用非阻斷式通知
      ss.toast(summaryMessage, '處理完成', 5);
    } else {
      // 有失敗案例：使用彈窗顯示詳情
      SpreadsheetApp.getUi().alert(summaryMessage);
    }

    return results;

  } catch (error) {
    Logger.log(`執行失敗: ${error.message}`);
    SpreadsheetApp.getUi().alert(`執行失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 測試單一學生
 * 用於開發和測試
 */
function testSingleStudent() {
  // 請替換成實際的學號
  const testStudentId = '11001';

  try {
    Logger.log(`測試學號: ${testStudentId}`);

    // 預先載入所有標準資料
    Logger.log('正在載入標準資料...');
    const referenceData = {
      students: loadStudentScores(),
      departments: loadDepartmentStandards(),
      gsatStandards: loadGSATStandards(),
      skillStandards: loadSkillStandards(),
      uniRankReqs: loadUniversityRankRequirements(),
      semesterRankData: loadSemesterRankData()
    };
    Logger.log('標準資料載入完成');

    // 準備 Drive 環境
    Logger.log('正在準備 Drive 環境...');
    const folder = DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
    const files = folder.getFiles();
    const fileMap = {};
    while (files.hasNext()) {
      const file = files.next();
      fileMap[file.getName()] = file;
    }

    // 測試學生資料
    const jsonData = buildStudentDataJSON(testStudentId, referenceData);

    // 計算實際可選填校系數（所有分組中的科系總數）
    let totalDepts = 0;
    jsonData.可選填校系.forEach(group => {
      totalDepts += group.可選填科系.length;
    });

    // 儲存到 Drive
    const fileId = saveJSONToDrive(testStudentId, jsonData, folder, fileMap);

    Logger.log(`✅ 完成 | 可選填: ${totalDepts} 個校系 (${jsonData.可選填校系.length} 個分組)`);

  } catch (error) {
    Logger.log(`❌ 失敗: ${error.message}`);
  }
}
