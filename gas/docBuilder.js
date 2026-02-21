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
 * @returns {string} 新產生的 PDF 檔案 URL
 */
function fillStudentData(studentId) {
  try {
    // 步驟 A: 獲取志願
    // 呼叫 dataLoader.js 的 getStudentPreferences
    const volunteerCodes = getStudentPreferences(studentId);
    
    // // 檢核：如果 volunteerCodes 長度小於 5，拋出 Error
    // if (volunteerCodes.length < 5) {
    //   throw new Error('志願選填不足 5 個，不產生 PDF');
    // }

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
      Logger.log(`⚠️ 已刪除舊有同名 PDF: ${pdfName} (ID: ${existingFile.getId()})`);
    }

    const pdfFile = pdfFolder.createFile(pdfBlob).setName(pdfName);
    
    // 9. 刪除 Google Doc 副本
    tempFile.setTrashed(true);
    
    Logger.log(`✅ 已建立 PDF: ${pdfFile.getName()} (ID: ${pdfFile.getId()})`);
    Logger.log(`🗑️ 已刪除暫存 Doc: ${tempDocName}`);
    
    return pdfFile.getUrl();

  } catch (error) {
    Logger.log(`❌ 處理失敗 (${studentId}): ${error.message}`);
    throw error;
  }
}


