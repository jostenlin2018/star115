/**
 * JSON 建構器
 * 提供 buildStudentDataJSON 函數和儲存功能
 */

/**
 * 取得指定學生的 JSON 資料
 * @param {string} studentId 學號
 * @param {Object} referenceData 參考資料
 * @returns {Object} 學生的完整資料，包含個人資訊和可選填的校系
 */
function buildStudentDataJSON(studentId, referenceData) {
    try {
      // 從參考資料中解構需要的資料
      const {
        students,
        departments,
        gsatStandards,
        skillStandards,
        uniRankReqs,
        semesterRankData
      } = referenceData;
      
      // 找到該學生
      const student = students.find(s => s['學號'] === studentId || s['學號'].toString() === studentId.toString());
      
      if (!student) {
        throw new Error(`找不到學號: ${studentId}`);
      }

      // 檢查可選學群
      if (!student['可選學群'] || String(student['可選學群']).trim() === '') {
        throw new Error('【資料錯誤】「可選學群」欄位為空，無法進行篩選');
      }
      
      // 取得該學生的校內成績資料
      const studentRankData = semesterRankData ? semesterRankData[studentId.toString()] : {};

      // 計算學生的成績等級
      const studentLevels = {};
      
      // 學測科目等級
      ['國文', '英文', '數學A', '數學B', '社會', '自然'].forEach(subject => {
        if (student[subject] && gsatStandards[subject]) {
          studentLevels[subject] = getScoreLevel(student[subject], gsatStandards[subject]);
        }
      });
      
      // 術科等級
      CONFIG.SUBJECTS.SKILL.forEach(subject => {
        if (student[subject] && skillStandards[subject]) {
          studentLevels[subject] = getScoreLevel(student[subject], skillStandards[subject]);
        }
      });
      
      // 取得通過檢定的校系
      const qualifiedDepts = getQualifiedDepartments(student, departments, gsatStandards, skillStandards, uniRankReqs);
      
      // 將校系按學校和學群分組
      const groupedBySchool = {};
      
      qualifiedDepts.forEach(dept => {
        // 確保學校代碼和學系代碼為數字
        const schoolCode = parseInt(dept['學校代碼']) || 0;
        const schoolName = dept['學校名稱'] || '';
        const groupCategory = dept['學群類別'] || '';
        const groupCode = parseInt(dept['學群類別代碼']) || 0;
        
        // 建立分組的 key：學校代碼_學群類別
        const groupKey = `${schoolCode}_${groupCategory}`;
        
        if (!groupedBySchool[groupKey]) {
          groupedBySchool[groupKey] = {
            學校名稱: schoolName,
            學校代碼: schoolCode,
            學校簡稱: dept['學校簡稱'] || '',
            學群類別: groupCategory,
            學群類別代碼: groupCode,
            可選填科系: []
          };
        }
        
        // 加入學系資訊（確保學系代碼為數字）
        groupedBySchool[groupKey].可選填科系.push({
          學系代碼: parseInt(dept['學系代碼']) || 0,
          學系名稱: dept['學系名稱'] || '',
          學系簡稱: dept['學系簡稱'] || '',
          補充搜尋關鍵詞: dept['補充搜尋關鍵詞'] || ''
        });
      });
      
      // 轉換為陣列並排序（先按學校代碼，再按學群類別代碼）
      const groupedArray = Object.values(groupedBySchool).sort((a, b) => {
        if (a.學校代碼 !== b.學校代碼) {
          return a.學校代碼 - b.學校代碼;
        }
        return a.學群類別代碼 - b.學群類別代碼;
      });
      
      // 建立 JSON 物件
      const result = {
        學號: student['學號'],
        姓名: student['姓名'] || '',
        可選學群: student['可選學群'],
        班級: student['班級'].toString() || '',
        座號: student['座號'].toString().padStart(2, '0') || '',
        校排百分比: student['校排百分比'] || '',
        填榜序號: student['填榜序號'] || '',
        個人資訊: {
          學測成績: {},
          學測等級: {},
          大考英聽: student['大考英聽'] || '',
          術科成績: {},
          術科等級: {},
          校內成績: {
            各科校排: {
              國文: (studentRankData && studentRankData['國文']) || '',
              英文: (studentRankData && studentRankData['英文']) || '',
              數學: (studentRankData && studentRankData['數學']) || '',
              物理: (studentRankData && studentRankData['物理']) || '',
              化學: (studentRankData && studentRankData['化學']) || '',
              生物: (studentRankData && studentRankData['生物']) || '',
              地科: (studentRankData && studentRankData['地科']) || '',
              公民: (studentRankData && studentRankData['公民']) || '',
              歷史: (studentRankData && studentRankData['歷史']) || '',
              地理: (studentRankData && studentRankData['地理']) || ''
            },
            學期平均: {
              高三上: (studentRankData && studentRankData['高三上']) || '',
              高二下: (studentRankData && studentRankData['高二下']) || '',
              高二上: (studentRankData && studentRankData['高二上']) || '',
              高一下: (studentRankData && studentRankData['高一下']) || '',
              高一上: (studentRankData && studentRankData['高一上']) || ''
            }
          }
        },
        可選填校系: groupedArray,
        統計資訊: {
          通過校系數: qualifiedDepts.length,
          總校系數: departments.length,
          通過比例: `${(qualifiedDepts.length / departments.length * 100).toFixed(2)}%`
        },
        更新時間: new Date().toISOString()
      };
      
      // 填入學測成績和等級
      ['國文', '英文', '數學A', '數學B', '社會', '自然'].forEach(subject => {
        result.個人資訊.學測成績[subject] = student[subject] || 0;
        result.個人資訊.學測等級[subject] = studentLevels[subject] || '';
      });
      
      // 填入術科成績和等級
      ['術科項目1', '術科項目2', '術科項目3', '術科項目4', '術科項目5'].forEach(subject => {
        if (student[subject] !== undefined && student[subject] !== '') {
          result.個人資訊.術科成績[subject] = student[subject] || 0;
          result.個人資訊.術科等級[subject] = studentLevels[subject] || '';
        }
      });
      
      return result;
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 將 JSON 儲存到 Google Drive
   * @param {string} studentId 學號
   * @param {Object} jsonData JSON 資料
   * @param {GoogleAppsScript.Drive.Folder} folder 目標資料夾物件
   * @param {Object} fileMap 檔案對照表 {檔名: File物件}
   * @returns {string} 檔案 ID
   */
  function saveJSONToDrive(studentId, jsonData, folder, fileMap) {
    try {
      const fileName = `student_${studentId}.json`;
      const jsonString = JSON.stringify(jsonData, null, 2);
      
      // 直接從 Map 檢查檔案是否存在
      if (fileMap[fileName]) {
        // 更新現有檔案
        const file = fileMap[fileName];
        file.setContent(jsonString);
        return file.getId();
      } else {
        // 建立新檔案
        const file = folder.createFile(fileName, jsonString, MimeType.PLAIN_TEXT);
        // 更新 fileMap，避免同一次執行重複建立
        fileMap[fileName] = file;
        return file.getId();
      }
      
    } catch (error) {
      throw error;
    }
  }
