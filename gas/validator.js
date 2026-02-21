/**
 * 檢定驗證器
 * 負責判斷學生成績是否通過校系檢定標準
 */

/**
 * 將成績轉換為標準等級
 * @param {number} score 學生成績
 * @param {Object} standards 該科目的五標
 * @returns {string} 標準等級
 */
function getScoreLevel(score, standards) {
  if (!score || !standards) return null;
  
  // 將成績轉換為數字
  const numScore = parseFloat(score);
  
  if (isNaN(numScore)) return null;
  
  // 判斷等級
  if (numScore >= standards['頂標']) return '頂標';
  if (numScore >= standards['前標']) return '前標';
  if (numScore >= standards['均標']) return '均標';
  if (numScore >= standards['後標']) return '後標';
  if (numScore >= standards['底標']) return '底標';
  
  return '底標以下';
}

/**
 * 檢查是否通過檢定標準
 * @param {string} studentLevel 學生成績等級
 * @param {string} requiredLevel 要求的最低等級
 * @returns {boolean} 是否通過
 */
function passStandard(studentLevel, requiredLevel) {
  if (!requiredLevel || requiredLevel === '' || requiredLevel === '---' || requiredLevel === '--') {
    return true; // 沒有要求則視為通過
  }
  
  if (!studentLevel || studentLevel === '底標以下') {
    return false;
  }
  
  const studentValue = CONFIG.LEVEL_ORDER[studentLevel] || 0;
  const requiredValue = CONFIG.LEVEL_ORDER[requiredLevel] || 0;
  
  return studentValue >= requiredValue;
}

/**
 * 判斷學生是否通過該校系的檢定標準
 * @param {Object} student 學生資料
 * @param {Object} department 校系檢定標準
 * @param {Object} gsatStandards 學測五標
 * @param {Object} skillStandards 術科五標
 * @param {Object} uniRankReqs 大學要求校排
 * @returns {boolean} 是否通過
 */
function checkDepartmentQualification(student, department, gsatStandards, skillStandards, uniRankReqs) {

  // 檢查學群類別
  // 將學生的輸入（字串，如 "01, 02"）以逗號分隔，轉為整數陣列
  const studentGroups = String(student['可選學群'] || '').split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n));
    
  // 將校系的學群類別代碼也轉為整數
  const deptGroupCode = parseInt(department['學群類別代碼'], 10);

  // 如果校系代碼不在學生的整數陣列中，或轉換後為 NaN，回傳 false
  if (isNaN(deptGroupCode) || !studentGroups.includes(deptGroupCode)) {
    return false;
  }

  // 檢查校排百分比
  // 取得該校系的學校代碼
  const schoolCode = department['學校代碼'];
  
  // 如果這間學校有設定校排要求
  if (uniRankReqs && uniRankReqs[schoolCode] !== undefined) {
    const requiredRank = uniRankReqs[schoolCode];
    const studentRank = parseFloat(student['校排百分比']);
    
    // 如果學生有填校排，且 校排數值 > 要求數值 (例如 學生40% > 要求20%)
    // 代表學生排名較後段，不符合「前 XX %」的要求 -> 傳回 false
    if (!isNaN(studentRank) && studentRank > requiredRank) {
      return false;
    }
  }

  // 檢查學測科目
  const gsatSubjects = ['國文', '英文', '數學A', '數學B', '社會', '自然'];
  
  // 特殊處理：檢查數學A和數學B的檢定
  const mathARequired = department['數學A檢定'] || department['數學A'];
  const mathBRequired = department['數學B檢定'] || department['數學B'];
  const hasMathARequirement = mathARequired && mathARequired !== '' && mathARequired !== '---' && mathARequired !== '--';
  const hasMathBRequirement = mathBRequired && mathBRequired !== '' && mathBRequired !== '---' && mathBRequired !== '--';
  
  // 如果同時檢定數學A和數學B，只要其中之一通過即可
  if (hasMathARequirement && hasMathBRequirement) {
    const mathAScore = student['數學A'];
    const mathBScore = student['數學B'];
    const mathAStandards = gsatStandards['數學A'];
    const mathBStandards = gsatStandards['數學B'];
    
    const mathALevel = mathAStandards ? getScoreLevel(mathAScore, mathAStandards) : null;
    const mathBLevel = mathBStandards ? getScoreLevel(mathBScore, mathBStandards) : null;
    
    const mathAPassed = passStandard(mathALevel, mathARequired);
    const mathBPassed = passStandard(mathBLevel, mathBRequired);
    
    // 兩者至少一個通過
    if (!mathAPassed && !mathBPassed) {
      return false;
    }
    // 如果其中一個通過，跳過後續對數學A和數學B的個別檢查
  }
  
  for (const subject of gsatSubjects) {
    // 如果已經處理過數學A和數學B的聯合檢定，則跳過
    if ((subject === '數學A' || subject === '數學B') && hasMathARequirement && hasMathBRequirement) {
      continue;
    }
    
    const requiredLevel = department[`${subject}檢定`] || department[subject];
    
    if (requiredLevel && requiredLevel !== '' && requiredLevel !== '---' && requiredLevel !== '--') {
      const studentScore = student[subject];
      const standards = gsatStandards[subject];
      
      if (!standards) {
        continue;
      }
      
      const studentLevel = getScoreLevel(studentScore, standards);
      
      if (!passStandard(studentLevel, requiredLevel)) {
        return false;
      }
    }
  }
  
  // 檢查英聽
  const listeningRequired = department['大考英聽檢定'] || department['大考英聽'];
  if (listeningRequired && listeningRequired !== '' && listeningRequired !== '---' && listeningRequired !== '--') {
    const studentListening = student['大考英聽'];
    
    // 英聽等級: A級, B級, C級, F級 或 A, B, C, F
    const listeningOrder = { 
      'A級': 4, 'A': 4, 
      'B級': 3, 'B': 3, 
      'C級': 2, 'C': 2, 
      'F級': 1, 'F': 1 
    };
    
    const studentLevel = listeningOrder[studentListening] || 0;
    const requiredLevel = listeningOrder[listeningRequired] || 0;
    
    if (!studentListening || studentLevel < requiredLevel) {
      return false;
    }
  }
  
  // 檢查術科
  const skillSubjects = CONFIG.SUBJECTS.SKILL;
  
  for (const subject of skillSubjects) {
    const requiredLevel = department[`${subject}檢定`] || department[subject];
    
    if (requiredLevel && requiredLevel !== '' && requiredLevel !== '---' && requiredLevel !== '--') {
      const studentScore = student[subject];
      const standards = skillStandards[subject];
      
      if (!standards) {
        continue;
      }
      
      const studentLevel = getScoreLevel(studentScore, standards);
      
      if (!passStandard(studentLevel, requiredLevel)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 取得學生通過的所有校系
 * @param {Object} student 學生資料
 * @param {Array} departments 所有校系檢定標準
 * @param {Object} gsatStandards 學測五標
 * @param {Object} skillStandards 術科五標
 * @returns {Array} 通過的校系陣列
 */
function getQualifiedDepartments(student, departments, gsatStandards, skillStandards, uniRankReqs) {
  const qualified = [];
  
  for (const dept of departments) {
    if (checkDepartmentQualification(student, dept, gsatStandards, skillStandards, uniRankReqs)) {
      qualified.push(dept);
    }
  }
  
  return qualified;
}


