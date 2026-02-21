import { gasGetSystemSetup, gasSaveStudentPreferences, gasGeneratePDF } from "@/utils/gas-service"

/**
 * 讀取系統設定（供非登入狀態查詢）
 */
export function getSystemSetupApi() {
  return gasGetSystemSetup()
}

/**
 * 儲存學生志願序
 * @param {string} studentId - 學號
 * @param {Array<string>} preferencesArray - 志願完整代碼陣列（最多 20 筆）
 */
export function saveStudentPreferencesApi(studentId, preferencesArray) {
  return gasSaveStudentPreferences(studentId, preferencesArray)
}

/**
 * 產生學生志願 PDF
 * @param {string} studentId - 學號
 */
export function generatePDFApi(studentId) {
  return gasGeneratePDF(studentId)
}
