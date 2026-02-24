/**
 * 測試用的函數
 */
function testDocGeneration() {
  const studentId = '11001';
  try {
    const url = fillStudentData(studentId);
    Logger.log(`PDF 產生成功！連結: ${url}`);
  } catch (e) {
    Logger.log(`測試失敗: ${e.toString()}`);
  }
}
/**
 * 讀取學生 JSON 並填入 Google Doc 模板，最後匯出 PDF 並刪除暫存 Doc
 * @param {string} studentId 學號
 * @param {{ silent?: boolean }} [options] 控制是否輸出一般成功日誌
 * @returns {string} 新產生的 PDF 檔案 URL
 */
function fillStudentData(studentId, options) {
  try {
    const opts = options || {};
    const silent = opts.silent === true;
    // 步驟 A: 獲取志願
    // 呼叫 dataLoader.js 的 getStudentPreferences
    const volunteerCodes = getStudentPreferences(studentId);

    // 1. 取得資料夾 (配合 config.js 更新變數名稱)
    // 檢查設定是否存在
    if (!CONFIG.JSON_FOLDER_ID || !CONFIG.PDF_FOLDER_ID || !CONFIG.TEMPLATE_DOC_ID) {
      throw new Error('設定檔 (CONFIG) 缺少必要的 ID (JSON_FOLDER_ID, PDF_FOLDER_ID, TEMPLATE_DOC_ID)');
    }

    const jsonFolder = DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
    const pdfFolder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);

    // 2. 讀取學生 JSON 檔案
    const jsonFileName = `student_${studentId}.json`;
    const files = jsonFolder.getFilesByName(jsonFileName);

    if (!files.hasNext()) {
      throw new Error(`在資料夾中找不到檔案: ${jsonFileName}`);
    }

    const jsonFile = files.next();
    const studentData = JSON.parse(jsonFile.getBlob().getDataAsString());

    // 步驟 C: 建立快查表
    const lookupMap = {};
    if (studentData['可選填校系'] && Array.isArray(studentData['可選填校系'])) {
      studentData['可選填校系'].forEach(groupItem => {
        const schoolCode = groupItem['學校代碼'];
        const schoolName = groupItem['學校名稱'];
        const groupCode = groupItem['學群類別代碼'];
        const groupName = groupItem['學群類別'];

        if (groupItem['可選填科系'] && Array.isArray(groupItem['可選填科系'])) {
          groupItem['可選填科系'].forEach(deptItem => {
            const deptCode = deptItem['學系代碼'];
            const deptName = deptItem['學系名稱'];

            // Key: 學校代碼-學群類別代碼-學系代碼
            const key = `${schoolCode}-${groupCode}-${deptCode}`;
            lookupMap[key] = {
              schoolName,
              schoolCode,
              groupName,
              deptName,
              deptCode
            };
          });
        }
      });
    }

    // 3. 複製模板並重新命名 (暫存 Doc)
    const templateFile = DriveApp.getFileById(CONFIG.TEMPLATE_DOC_ID);
    // 暫存檔名，稍後轉 PDF 會用到此檔名
    const tempDocName = `student_${studentId}`;
    const tempFile = templateFile.makeCopy(tempDocName, jsonFolder); // 暫時放在 JSON 資料夾或任意位置皆可
    const tempFileId = tempFile.getId();

    // 4. 開啟新文件進行編輯
    const doc = DocumentApp.openById(tempFileId);
    const body = doc.getBody();

    // 處理座號補零邏輯
    let seatNumber = studentData['座號'];
    if (seatNumber) {
      seatNumber = String(seatNumber).trim().padStart(2, '0');
    }

    // 5. 定義資料對照表 (Mapping)
    const replacements = {
      '{1}': studentData['班級'],
      '{2}': seatNumber, // 修正：確保座號為兩位數 (例如 2 -> 02)
      '{3}': studentData['姓名'],
      '{4}': studentData['校排百分比'],
      '{5}': studentData['填榜序號'],

      // 學測成績
      '{6}': studentData.個人資訊?.學測成績?.['國文'],
      '{7}': studentData.個人資訊?.學測成績?.['英文'],
      '{8}': studentData.個人資訊?.學測成績?.['數學A'],
      '{9}': studentData.個人資訊?.學測成績?.['數學B'],
      '{10}': studentData.個人資訊?.學測成績?.['社會'],
      '{11}': studentData.個人資訊?.學測成績?.['自然'],

      // 英聽
      '{12}': studentData.個人資訊?.['大考英聽'],

      // 學測等級
      '{13}': studentData.個人資訊?.學測等級?.['國文'],
      '{14}': studentData.個人資訊?.學測等級?.['英文'],
      '{15}': studentData.個人資訊?.學測等級?.['數學A'],
      '{16}': studentData.個人資訊?.學測等級?.['數學B'],
      '{17}': studentData.個人資訊?.學測等級?.['社會'],
      '{18}': studentData.個人資訊?.學測等級?.['自然'],

      // 術科成績 (1-5)
      '{19}': studentData.個人資訊?.術科成績?.['術科項目1'],
      '{20}': studentData.個人資訊?.術科成績?.['術科項目2'],
      '{21}': studentData.個人資訊?.術科成績?.['術科項目3'],
      '{22}': studentData.個人資訊?.術科成績?.['術科項目4'],
      '{23}': studentData.個人資訊?.術科成績?.['術科項目5'],

      // 術科等級 (1-5)
      '{24}': studentData.個人資訊?.術科等級?.['術科項目1'],
      '{25}': studentData.個人資訊?.術科等級?.['術科項目2'],
      '{26}': studentData.個人資訊?.術科等級?.['術科項目3'],
      '{27}': studentData.個人資訊?.術科等級?.['術科項目4'],
      '{28}': studentData.個人資訊?.術科等級?.['術科項目5'],

      // 校內成績 - 各科校排
      '{29}': studentData.個人資訊?.校內成績?.各科校排?.['國文'],
      '{30}': studentData.個人資訊?.校內成績?.各科校排?.['英文'],
      '{31}': studentData.個人資訊?.校內成績?.各科校排?.['數學'],
      '{32}': studentData.個人資訊?.校內成績?.各科校排?.['物理'],
      '{33}': studentData.個人資訊?.校內成績?.各科校排?.['化學'],
      '{34}': studentData.個人資訊?.校內成績?.各科校排?.['生物'],
      '{35}': studentData.個人資訊?.校內成績?.各科校排?.['地科'],
      '{36}': studentData.個人資訊?.校內成績?.各科校排?.['公民'],
      '{37}': studentData.個人資訊?.校內成績?.各科校排?.['歷史'],
      '{38}': studentData.個人資訊?.校內成績?.各科校排?.['地理'],

      // 校內成績 - 學期平均
      '{39}': studentData.個人資訊?.校內成績?.學期平均?.['高三上'],
      '{40}': studentData.個人資訊?.校內成績?.學期平均?.['高二下'],
      '{41}': studentData.個人資訊?.校內成績?.學期平均?.['高二上'],
      '{42}': studentData.個人資訊?.校內成績?.學期平均?.['高一下'],
      '{43}': studentData.個人資訊?.校內成績?.學期平均?.['高一上']
    };

    // 步驟 D: 新增志願填寫邏輯 (V1 ~ V20)
    for (let i = 1; i <= 20; i++) {
      let code = (volunteerCodes[i - 1] || '').trim();

      // 嘗試標準化代碼格式 (去除前導零)，以匹配 key (例如 "01-01-101" -> "1-1-101")
      if (code && /^\d+-\d+-\d+$/.test(code)) {
        code = code.split('-').map(num => parseInt(num, 10)).join('-');
      }

      let sName = ''; // School Name
      let gName = ''; // Group Name
      let dName = ''; // Dept Name

      if (code && lookupMap[code]) {
        const info = lookupMap[code];
        // 學校名稱需顯示為：學校名稱 (學校代碼)
        sName = `${info.schoolName} (${info.schoolCode})`;
        // 學群名稱直接顯示
        gName = info.groupName;
        // 學系名稱需顯示為：學系名稱 (學系代碼)
        dName = `${info.deptName} (${info.deptCode})`;
      }

      replacements[`{V${i}_School}`] = sName;
      replacements[`{V${i}_Group}`] = gName;
      replacements[`{V${i}_Dept}`] = dName;
    }

    // 6. 執行取代
    for (const [placeholder, value] of Object.entries(replacements)) {
      const textToReplace = (value === undefined || value === null) ? '' : String(value);
      // 跳脫正規表達式的特殊字元 {}
      const escapedPlaceholder = placeholder.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
      body.replaceText(escapedPlaceholder, textToReplace);
    }

    // 7. 儲存並關閉 (重要：必須先儲存才能確保 PDF 內容是最新的)
    doc.saveAndClose();

    // 8. 匯出 PDF
    // 重新獲取一次檔案以確保狀態更新 (通常可以直接用 tempFile，但 getAs 有時需要確保 flush)
    const pdfBlob = tempFile.getAs(MimeType.PDF);
    const pdfName = `${tempDocName}.pdf`;

    // 檢查 PDF 資料夾中是否已存在同名檔案，若有則刪除 (模擬覆蓋)
    const existingFiles = pdfFolder.getFilesByName(pdfName);
    while (existingFiles.hasNext()) {
      const existingFile = existingFiles.next();
      existingFile.setTrashed(true);
      if (!silent) {
        Logger.log(`⚠️ 已刪除舊有同名 PDF: ${pdfName} (ID: ${existingFile.getId()})`);
      }
    }

    const pdfFile = pdfFolder.createFile(pdfBlob).setName(pdfName);

    // 9. 刪除 Google Doc 副本
    tempFile.setTrashed(true);

    if (!silent) {
      Logger.log(`✅ 已建立 PDF: ${pdfFile.getName()} (ID: ${pdfFile.getId()})`);
      Logger.log(`🗑️ 已刪除暫存 Doc: ${tempDocName}`);
    }

    return pdfFile.getUrl();

  } catch (error) {
    Logger.log(`❌ 處理失敗 (${studentId}): ${error.message}`);
    throw error;
  }
}


/**
 * 建立「學校-學群-學系」快查表
 * @param {Object} studentData 學生 JSON 物件
 * @returns {Object} 快查 map
 */
function buildLookupMapForPdf_(studentData) {
  const lookupMap = {};

  if (studentData['可選填校系'] && Array.isArray(studentData['可選填校系'])) {
    studentData['可選填校系'].forEach(groupItem => {
      const schoolCode = groupItem['學校代碼'];
      const schoolName = groupItem['學校名稱'];
      const groupCode = groupItem['學群類別代碼'];
      const groupName = groupItem['學群類別'];

      if (groupItem['可選填科系'] && Array.isArray(groupItem['可選填科系'])) {
        groupItem['可選填科系'].forEach(deptItem => {
          const deptCode = deptItem['學系代碼'];
          const deptName = deptItem['學系名稱'];
          const key = `${schoolCode}-${groupCode}-${deptCode}`;

          lookupMap[key] = {
            schoolName: schoolName,
            schoolCode: schoolCode,
            groupName: groupName,
            deptName: deptName,
            deptCode: deptCode
          };
        });
      }
    });
  }

  return lookupMap;
}

/**
 * 建立模板替換字典
 * @param {Object} studentData 學生 JSON 物件
 * @param {string[]} volunteerCodes 志願代碼陣列
 * @returns {Object} placeholder 對照表
 */
function createReplacementsForPdf_(studentData, volunteerCodes) {
  let seatNumber = studentData['座號'];
  if (seatNumber) {
    seatNumber = String(seatNumber).trim().padStart(2, '0');
  }

  const replacements = {
    '{1}': studentData['班級'],
    '{2}': seatNumber,
    '{3}': studentData['姓名'],
    '{4}': studentData['校排百分比'],
    '{5}': studentData['填榜序號'],

    '{6}': studentData.個人資訊?.學測成績?.['國文'],
    '{7}': studentData.個人資訊?.學測成績?.['英文'],
    '{8}': studentData.個人資訊?.學測成績?.['數學A'],
    '{9}': studentData.個人資訊?.學測成績?.['數學B'],
    '{10}': studentData.個人資訊?.學測成績?.['社會'],
    '{11}': studentData.個人資訊?.學測成績?.['自然'],

    '{12}': studentData.個人資訊?.['大考英聽'],

    '{13}': studentData.個人資訊?.學測等級?.['國文'],
    '{14}': studentData.個人資訊?.學測等級?.['英文'],
    '{15}': studentData.個人資訊?.學測等級?.['數學A'],
    '{16}': studentData.個人資訊?.學測等級?.['數學B'],
    '{17}': studentData.個人資訊?.學測等級?.['社會'],
    '{18}': studentData.個人資訊?.學測等級?.['自然'],

    '{19}': studentData.個人資訊?.術科成績?.['術科項目1'],
    '{20}': studentData.個人資訊?.術科成績?.['術科項目2'],
    '{21}': studentData.個人資訊?.術科成績?.['術科項目3'],
    '{22}': studentData.個人資訊?.術科成績?.['術科項目4'],
    '{23}': studentData.個人資訊?.術科成績?.['術科項目5'],

    '{24}': studentData.個人資訊?.術科等級?.['術科項目1'],
    '{25}': studentData.個人資訊?.術科等級?.['術科項目2'],
    '{26}': studentData.個人資訊?.術科等級?.['術科項目3'],
    '{27}': studentData.個人資訊?.術科等級?.['術科項目4'],
    '{28}': studentData.個人資訊?.術科等級?.['術科項目5'],

    '{29}': studentData.個人資訊?.校內成績?.各科校排?.['國文'],
    '{30}': studentData.個人資訊?.校內成績?.各科校排?.['英文'],
    '{31}': studentData.個人資訊?.校內成績?.各科校排?.['數學'],
    '{32}': studentData.個人資訊?.校內成績?.各科校排?.['物理'],
    '{33}': studentData.個人資訊?.校內成績?.各科校排?.['化學'],
    '{34}': studentData.個人資訊?.校內成績?.各科校排?.['生物'],
    '{35}': studentData.個人資訊?.校內成績?.各科校排?.['地科'],
    '{36}': studentData.個人資訊?.校內成績?.各科校排?.['公民'],
    '{37}': studentData.個人資訊?.校內成績?.各科校排?.['歷史'],
    '{38}': studentData.個人資訊?.校內成績?.各科校排?.['地理'],

    '{39}': studentData.個人資訊?.校內成績?.學期平均?.['高三上'],
    '{40}': studentData.個人資訊?.校內成績?.學期平均?.['高二下'],
    '{41}': studentData.個人資訊?.校內成績?.學期平均?.['高二上'],
    '{42}': studentData.個人資訊?.校內成績?.學期平均?.['高一下'],
    '{43}': studentData.個人資訊?.校內成績?.學期平均?.['高一上']
  };

  const lookupMap = buildLookupMapForPdf_(studentData);
  for (let i = 1; i <= 20; i++) {
    let code = (volunteerCodes[i - 1] || '').trim();
    if (code && /^\d+-\d+-\d+$/.test(code)) {
      code = code.split('-').map(num => parseInt(num, 10)).join('-');
    }

    let sName = '';
    let gName = '';
    let dName = '';

    if (code && lookupMap[code]) {
      const info = lookupMap[code];
      sName = `${info.schoolName} (${info.schoolCode})`;
      gName = info.groupName;
      dName = `${info.deptName} (${info.deptCode})`;
    }

    replacements[`{V${i}_School}`] = sName;
    replacements[`{V${i}_Group}`] = gName;
    replacements[`{V${i}_Dept}`] = dName;
  }

  return replacements;
}

/**
 * 批次專用：直接以預載資料渲染單一學生 PDF
 * @param {string} studentId 學號
 * @param {Object} studentData 學生 JSON 物件
 * @param {string[]} volunteerCodes 志願代碼
 * @param {{templateFile:GoogleAppsScript.Drive.File, jsonFolder:GoogleAppsScript.Drive.Folder, pdfFolder:GoogleAppsScript.Drive.Folder}} resources
 */
function buildPdfForStudentBatch_(studentId, studentData, volunteerCodes, resources) {
  const tempDocName = `student_${studentId}`;
  const tempFile = resources.templateFile.makeCopy(tempDocName, resources.jsonFolder);
  const tempFileId = tempFile.getId();

  try {
    const doc = DocumentApp.openById(tempFileId);
    const body = doc.getBody();
    const replacements = createReplacementsForPdf_(studentData, volunteerCodes);

    for (const [placeholder, value] of Object.entries(replacements)) {
      const textToReplace = (value === undefined || value === null) ? '' : String(value);
      const escapedPlaceholder = placeholder.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
      body.replaceText(escapedPlaceholder, textToReplace);
    }

    doc.saveAndClose();

    const pdfBlob = tempFile.getAs(MimeType.PDF);
    const pdfName = `${tempDocName}.pdf`;
    const existingFiles = resources.pdfFolder.getFilesByName(pdfName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }

    resources.pdfFolder.createFile(pdfBlob).setName(pdfName);
  } finally {
    tempFile.setTrashed(true);
  }
}

/**
 * 批次為所有已選取且存在 JSON 的學生產生 PDF
 */
function generateSelectedStudentPdfs() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.STUDENT_PREFS);
    
    if (!sheet) {
      SpreadsheetApp.getUi().alert(`找不到工作表: ${CONFIG.SHEET_NAMES.STUDENT_PREFS}`);
      return;
    }

    if (!CONFIG.JSON_FOLDER_ID) {
      SpreadsheetApp.getUi().alert('設定檔缺少 JSON_FOLDER_ID，請先於 CONFIG 設定');
      return;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      SpreadsheetApp.getUi().alert('工作表沒有可處理的學生資料');
      return;
    }

    const headers = data[0];

    const selectIndex = headers.indexOf('選取');
    const studentIdIndex = headers.indexOf('學號');
    const timestampIndex = headers.indexOf('時間戳記');
    const vol1Index = headers.indexOf('志願1');

    if (selectIndex === -1 || studentIdIndex === -1 || timestampIndex === -1 || vol1Index === -1) {
      SpreadsheetApp.getUi().alert('找不到【選取】、【學號】、【時間戳記】或【志願1】欄位，請確認工作表格式');
      return;
    }

    // 篩選出標記為 V 或 v 的學生，並預先攜帶該列志願資料
    const selectedStudents = [];
    for (let i = 1; i < data.length; i++) {
      const selectValue = data[i][selectIndex];
      const studentId = data[i][studentIdIndex];
      const normalizedSelect = (selectValue === undefined || selectValue === null)
        ? ''
        : selectValue.toString().trim().toUpperCase();
      
      if (normalizedSelect === 'V' && studentId) {
        const volunteerCodes = [];
        for (let v = 0; v < 20; v++) {
          const val = data[i][vol1Index + v];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            volunteerCodes.push(String(val).trim());
          }
        }

        selectedStudents.push({
          studentId: String(studentId).trim(),
          rowNumber: i + 1,
          volunteerCodes: volunteerCodes
        });
      }
    }

    if (selectedStudents.length === 0) {
      SpreadsheetApp.getUi().alert('沒有找到任何標記為 V 或 v 的學生\n\n請在【選取】欄位中填入 V 或 v 來標記要產生 PDF 的學生');
      return;
    }

    if (!CONFIG.PDF_FOLDER_ID || !CONFIG.TEMPLATE_DOC_ID) {
      SpreadsheetApp.getUi().alert('設定檔缺少 PDF_FOLDER_ID 或 TEMPLATE_DOC_ID，請先於 CONFIG 設定');
      return;
    }

    const jsonFolder = DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
    const pdfFolder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);
    const templateFile = DriveApp.getFileById(CONFIG.TEMPLATE_DOC_ID);

    // 一次掃描 JSON 資料夾建立快取 (檔名 -> 檔案物件)
    const jsonFileMap = {};
    const allJsonFiles = jsonFolder.getFiles();
    while (allJsonFiles.hasNext()) {
      const file = allJsonFiles.next();
      jsonFileMap[file.getName()] = file;
    }

    const rowCount = data.length - 1;
    const selectWriteValues = [];
    const timestampWriteValues = [];
    for (let r = 1; r < data.length; r++) {
      selectWriteValues.push([data[r][selectIndex]]);
      timestampWriteValues.push([data[r][timestampIndex]]);
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    const totalCount = selectedStudents.length;

    const startTime = Date.now();
    const maxRuntimeMs = 320000; // 保留緩衝，避免觸發 6 分鐘上限

    for (let i = 0; i < selectedStudents.length; i++) {
      const elapsedMs = Date.now() - startTime;
      if (elapsedMs >= maxRuntimeMs) {
        break;
      }

      const item = selectedStudents[i];
      const studentId = item.studentId;
      const rowNumber = item.rowNumber;
      const writeIndex = rowNumber - 2;

      try {
        const jsonFileName = `student_${studentId}.json`;
        const jsonFile = jsonFileMap[jsonFileName];

        Logger.log(`生成 ${i + 1}/${totalCount}`);

        if (jsonFile) {
          const studentJson = JSON.parse(jsonFile.getBlob().getDataAsString());
          buildPdfForStudentBatch_(studentId, studentJson, item.volunteerCodes, {
            templateFile: templateFile,
            jsonFolder: jsonFolder,
            pdfFolder: pdfFolder
          });

          const timestamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
          timestampWriteValues[writeIndex][0] = timestamp;
          successCount++;
        } else {
          skipCount++;
        }
      } catch (error) {
        Logger.log(`❌ 學生 ${studentId} 產生 PDF 失敗: ${error.message}`);
        errorCount++;
      }

      // 只清除已處理項目（成功/跳過/失敗）
      selectWriteValues[writeIndex][0] = '';
      processedCount++;
    }

    // 批次寫回，避免逐筆 setValue
    if (rowCount > 0) {
      sheet.getRange(2, selectIndex + 1, rowCount, 1).setValues(selectWriteValues);
      sheet.getRange(2, timestampIndex + 1, rowCount, 1).setValues(timestampWriteValues);
    }

    SpreadsheetApp.flush();
    const remainingCount = totalCount - processedCount;
    const summaryMessage =
      `處理完成！\n` +
      `成功產生: ${successCount} 位\n` +
      `JSON不存在而跳過: ${skipCount} 位\n` +
      `產生失敗: ${errorCount} 位\n` +
      `未處理(保留下次續跑): ${remainingCount} 位`;

    if (skipCount === 0 && errorCount === 0 && remainingCount === 0) {
      ss.toast(summaryMessage, '執行完畢', 5);
    } else {
      SpreadsheetApp.getUi().alert(summaryMessage + '\n\n詳情請查看執行紀錄 (Logger)');
    }
    
  } catch (error) {
    Logger.log(`批次產生 PDF 發生錯誤: ${error.message}`);
    SpreadsheetApp.getUi().alert(`執行失敗: ${error.message}`);
  }
}
