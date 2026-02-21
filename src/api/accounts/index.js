/**
 * Accounts API 層
 * 封裝與 GAS 後端的通訊
 */

import { callGasFunction } from "@/utils/gas-service"

/**
 * 根據學號取得帳戶資料
 * @param {string} stunum - 學號
 * @returns {Promise}
 */
export function getAccountByStudentNumber(stunum) {
  return callGasFunction("getAccountByStudentNumber", stunum)
}

/**
 * 更新帳戶資料
 * @param {string} stunum - 學號
 * @param {Object} accountData - 帳戶資料
 * @returns {Promise}
 */
export function updateAccount(stunum, accountData) {
  return callGasFunction("updateAccount", stunum, accountData)
}

/**
 * 驗證帳戶資料
 * @param {Object} accountData - 帳戶資料
 * @returns {Promise}
 */
export function validateAccountData(accountData) {
  return callGasFunction("validateAccountData", accountData)
}

/**
 * 取得親屬關係選項列表
 * @returns {Promise}
 */
export function getRelationshipOptions() {
  return callGasFunction("getRelationshipOptions")
}

/**
 * 取得總務股長班級填報統計
 * @param {string} stunum - 學號
 * @returns {Promise}
 */
export function getOfficerStatus(stunum) {
  return callGasFunction("getOfficerStatus", stunum)
}
