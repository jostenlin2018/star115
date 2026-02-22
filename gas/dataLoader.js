/**
 * 資料載入器
 * 負責從 Google Sheets 讀取資料
 */

/**
 * 取得試算表物件
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * 讀取學生成績資料
 * @returns {Array} 學生成績陣列
 */
function loadStudentScores() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.STUDENT_SCORES);
  
  if (!sheet) {
    throw new Error(`找不到工作表: ${CONFIG.SHEET_NAMES.STUDENT_SCORES}`);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const students = [];
  
  // 從第二列開始讀取資料
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const student = {};
    
    headers.forEach((header, index) => {
      student[header] = row[index];
    });
    
    students.push(student);
  }
  
  return students;
}

/**
 * 讀取大學校排要求
 * @returns {Object} 學校代碼對應校排要求 { '1': 20, '2': 20 ... }
 */
function loadUniversityRankRequirements() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.UNIVERSITY_RANK);
  
  if (!sheet) {
    // 如果找不到工作表，回傳空物件，避免程式報錯
    Logger.log(`找不到工作表: ${CONFIG.SHEET_NAMES.UNIVERSITY_RANK}`);
    return {};
  }
  
  const data = sheet.getDataRange().getValues();
  // 假設 CSV 標題是：代碼, 學校名稱, 學校簡稱, 學業成績百分比
  // 我們需要第 1 欄(索引0)的代碼 和 第 4 欄(索引3)的百分比
  
  const requirements = {};
  
  // 從第 2 列開始讀取 (跳過標題)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const schoolCode = row[0].toString().trim(); // 學校代碼
    const percentage = parseFloat(row[3]);      // 學業成績百分比
    
    if (schoolCode && !isNaN(percentage)) {
      requirements[schoolCode] = percentage;
    }
  }
  
  return requirements;
}

/**
 * 讀取校系檢定標準
 * @returns {Array} 校系檢定標準陣列
 */
function loadDepartmentStandards() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DEPARTMENT_STANDARDS);
  
  if (!sheet) {
    throw new Error(`找不到工作表: ${CONFIG.SHEET_NAMES.DEPARTMENT_STANDARDS}`);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim());
  const departments = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dept = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      dept[header] = typeof value === 'string' ? value.trim() : value;
    });
    
    departments.push(dept);
  }
  
  return departments;
}

/**
 * 讀取學測五標
 * @returns {Object} 學測五標物件
 * CSV 格式: 項目,國文,英文,數學A,數學B,自然,社會
 * 輸出格式: { "國文": { "頂標": 15, "前標": 12, ... }, "英文": {...}, ... }
 */
function loadGSATStandards() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GSAT_STANDARDS);
  
  if (!sheet) {
    throw new Error(`找不到工作表: ${CONFIG.SHEET_NAMES.GSAT_STANDARDS}`);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];  // 第一列：項目,國文,英文,數學A,數學B,自然,社會
  
  // 建立每科的五標物件
  const standards = {};
  
  // 從第二欄開始，每一欄代表一個科目
  for (let col = 1; col < headers.length; col++) {
    const subject = headers[col].toString().trim();
    
    // 跳過空欄位
    if (!subject) continue;
    
    standards[subject] = {};
    
    // 讀取該科目的五標（頂標、前標、均標、後標、底標）
    for (let row = 1; row < data.length && row <= 5; row++) {
      const level = data[row][0].toString().trim();  // 頂標、前標、均標、後標、底標
      const score = parseFloat(data[row][col]) || 0;
      
      if (level) {
        standards[subject][level] = score;
      }
    }
  }
  
  return standards;
}

/**
 * 讀取術科五標
 * @returns {Object} 術科五標物件
 * CSV 格式: 項目,術科項目1,術科項目2,術科項目3,術科項目4,術科項目5
 * 輸出格式: { "術科項目1": { "頂標": 15, "前標": 12, ... }, ... }
 */
function loadSkillStandards() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SKILL_STANDARDS);
  
  if (!sheet) {
    throw new Error(`找不到工作表: ${CONFIG.SHEET_NAMES.SKILL_STANDARDS}`);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];  // 第一列：項目,術科項目1,術科項目2,...
  
  // 建立每個術科項目的五標物件
  const standards = {};
  
  // 從第二欄開始，每一欄代表一個術科項目
  for (let col = 1; col < headers.length; col++) {
    const subject = headers[col].toString().trim();
    
    // 跳過空欄位
    if (!subject) continue;
    
    standards[subject] = {};
    
    // 讀取該術科項目的五標（頂標、前標、均標、後標、底標）
    for (let row = 1; row < data.length && row <= 5; row++) {
      const level = data[row][0].toString().trim();  // 頂標、前標、均標、後標、底標
      const score = parseFloat(data[row][col]) || 0;
      
      if (level) {
        standards[subject][level] = score;
      }
    }
  }
  
  return standards;
}

/**
 * 讀取各科校排學期平均
 * @returns {Object} 學號對應的成績資料 Map
 */
function loadSemesterRankData() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SEMESTER_RANK);
  
  if (!sheet) {
    Logger.log(`找不到工作表: ${CONFIG.SHEET_NAMES.SEMESTER_RANK}`);
    return {};
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rankData = {};
  
  // 找出「學號」欄位的索引
  const studentIdIndex = headers.indexOf('學號');
  if (studentIdIndex === -1) {
    throw new Error(`在 ${CONFIG.SHEET_NAMES.SEMESTER_RANK} 中找不到「學號」欄位`);
  }
  
  // 從第二列開始讀取資料
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const studentId = row[studentIdIndex];
    
    // 確保有學號才處理
    if (studentId) {
      const studentRow = {};
      headers.forEach((header, index) => {
        studentRow[header] = row[index];
      });
      // 確保學號轉為字串比較
      rankData[studentId.toString()] = studentRow;
    }
  }
  
  return rankData;
}

/**
 * 讀取學生撕榜後相關資料（撕榜結果、中文名稱、已選志願）
 * @param {string} studentId 學號
 * @returns {{ rankingResult: string|null, rankingName: string|null, postRankingList: string[] }}
 */
function getStudentPostRankingData(studentId) {
  const emptyResult = { rankingResult: null, rankingName: null, postRankingList: [] }

  try {
    const ss = getSpreadsheet()
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.POST_RANKING_PREFS)

    if (!sheet) {
      Logger.log('找不到工作表: ' + CONFIG.SHEET_NAMES.POST_RANKING_PREFS)
      return emptyResult
    }

    const data = sheet.getDataRange().getValues()
    if (data.length < 2) return emptyResult

    const headers = data[0]
    const studentIdIdx    = headers.indexOf('學號')
    const rankingResultIdx = headers.indexOf('撕榜結果')
    const universityIdx   = headers.indexOf('大學')
    const groupIdx        = headers.indexOf('學群')
    const vol1Idx         = headers.indexOf('志願1')

    if (studentIdIdx === -1 || rankingResultIdx === -1 || vol1Idx === -1) {
      Logger.log('撕榜後志願表缺少必要欄位')
      return emptyResult
    }

    // 搜尋符合 studentId 的列
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (String(row[studentIdIdx]).trim() !== String(studentId).trim()) continue

      // Bug fix #2：先檢查撕榜結果是否為空，避免拼接出 "undefined undefined"
      const rankingResultVal = String(row[rankingResultIdx]).trim()
      if (!rankingResultVal) return emptyResult

      const university = universityIdx !== -1 ? String(row[universityIdx]).trim() : ''
      const group      = groupIdx      !== -1 ? String(row[groupIdx]).trim()      : ''
      const rankingName = (university && group) ? university + ' ' + group : null

      // 讀取志願1~志願50，過濾空字串
      const postRankingList = []
      for (let v = 0; v < 50; v++) {
        const val = row[vol1Idx + v]
        if (val !== undefined && String(val).trim() !== '') {
          postRankingList.push(String(val).trim())
        }
      }

      return {
        rankingResult: rankingResultVal,
        rankingName:   rankingName,
        postRankingList: postRankingList
      }
    }

    return emptyResult
  } catch (error) {
    Logger.log('讀取撕榜後資料失敗: ' + error.toString())
    return emptyResult
  }
}

/**
 * 讀取學生志願序
 * @param {string} studentId 學號
 * @returns {Array<string>} 志願代碼陣列 ['1-1-101', ...]
 */
function getStudentPreferences(studentId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.STUDENT_PREFS);

  if (!sheet) {
    Logger.log(`找不到工作表: ${CONFIG.SHEET_NAMES.STUDENT_PREFS}`);
    return [];
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const studentIdIdx = headers.indexOf('學號');
  const vol1Idx = headers.indexOf('志願1');

  if (studentIdIdx === -1 || vol1Idx === -1) {
    Logger.log('找不到「學號」或「志願1」欄位');
    return [];
  }

  // 搜尋符合 studentId 的那一列
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // 強制轉字串比較
    if (String(row[studentIdIdx]).trim() === String(studentId).trim()) {
      const prefs = [];
      // 假設志願1~志願20是連續欄位
      for (let v = 0; v < 20; v++) {
        const val = row[vol1Idx + v];
        if (val && String(val).trim() !== '') {
          prefs.push(String(val).trim());
        }
      }
      return prefs;
    }
  }

  return [];
}
