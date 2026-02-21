// 設定檔
const CONFIG = {
  // Google Drive 資料夾 ID，請替換成您的資料夾 ID
  JSON_FOLDER_ID: '1MqVQlswlgK7G3YK7cb6KtmirSg1SY62N',

  // Google Drive 資料夾 ID，請替換成您的資料夾 ID
  PDF_FOLDER_ID: '1mz1-I3s2t5GB7g5_vQv375ej3YG1XuFz',

  // 模板文件 ID，請替換成您的模板文件 ID
  TEMPLATE_DOC_ID: '1uYhE_d_8aWa0wWWvNOr66ybL5AQG-DPI0Nk5S2kdk70',
  
  // 工作表名稱
  SHEET_NAMES: {
    STUDENT_SCORES: '學測英聽術科成績',
    UNIVERSITY_RANK: '大學要求校排',
    DEPARTMENT_STANDARDS: '校系分則',
    GSAT_STANDARDS: '學測五標',
    SKILL_STANDARDS: '術科五標',
    SEMESTER_RANK: '各科校排學期平均',
    STUDENT_PREFS: '撕榜前志願表'
  },
  
  // 科目對應
  SUBJECTS: {
    GSAT: ['國文', '英文', '數學A', '數學B', '社會', '自然'],
    LISTENING: ['大考英聽'],
    SKILL: ['術科項目1', '術科項目2', '術科項目3', '術科項目4', '術科項目5']
  },
  
  // 標準等級
  LEVELS: ['頂標', '前標', '均標', '後標', '底標'],
  
  // 等級順序（數值越大代表等級越高）
  LEVEL_ORDER: {
    '頂標': 5,
    '前標': 4,
    '均標': 3,
    '後標': 2,
    '底標': 1
  }
};
