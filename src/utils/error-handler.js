/**
 * 統一錯誤處理工具
 * 提供統一的錯誤處理機制，避免重複的錯誤提示
 */

import { ElMessage } from "element-plus"
import { API_CODES, API_MESSAGES } from "@/constants/api-codes"

/**
 * 錯誤處理選項
 * @typedef {Object} ErrorHandlerOptions
 * @property {boolean} silent - 是否靜默處理（不顯示錯誤訊息）
 * @property {string} customMessage - 自訂錯誤訊息
 * @property {Function} onError - 錯誤回調函數
 */

/**
 * 處理 API 回應
 * @param {Object} response - API 回應物件
 * @param {ErrorHandlerOptions} options - 處理選項
 * @returns {Object} 處理結果 { success: boolean, data: any, message: string }
 */
export function handleResponse(response, options = {}) {
  const { silent = false, customMessage, onError } = options

  // 檢查回應格式
  if (!response) {
    const message = customMessage || API_MESSAGES.ERROR
    if (!silent) {
      ElMessage.error(message)
    }
    const error = { success: false, message, data: null }
    if (onError) onError(error)
    return error
  }

  // 檢查回應碼
  if (response.code === API_CODES.SUCCESS) {
    return {
      success: true,
      data: response.data,
      message: response.msg || response.message || API_MESSAGES.SUCCESS
    }
  }

  // 處理錯誤回應
  const message = customMessage || response.msg || response.message || API_MESSAGES.ERROR

  if (!silent) {
    // 根據錯誤碼顯示不同類型的訊息
    switch (response.code) {
      case API_CODES.UNAUTHORIZED:
        ElMessage.warning(message)
        break
      case API_CODES.NOT_FOUND:
        ElMessage.warning(message)
        break
      default:
        ElMessage.error(message)
    }
  }

  const error = {
    success: false,
    message,
    data: response.data || null,
    code: response.code
  }

  if (onError) onError(error)

  return error
}

/**
 * 處理異常錯誤
 * @param {Error} error - 錯誤物件
 * @param {ErrorHandlerOptions} options - 處理選項
 * @returns {Object} 處理結果
 */
export function handleError(error, options = {}) {
  const { silent = false, customMessage, onError } = options

  const message = customMessage || error.message || API_MESSAGES.ERROR

  if (!silent) {
    ElMessage.error(message)
  }

  const errorResult = {
    success: false,
    message,
    error: error,
    data: null
  }

  if (onError) onError(errorResult)

  return errorResult
}

/**
 * 統一的錯誤處理器類
 */
export class ErrorHandler {
  /**
   * 處理 API 回應
   * @static
   * @param {Object} response - API 回應物件
   * @param {ErrorHandlerOptions} options - 處理選項
   * @returns {Object} 處理結果
   */
  static handle(response, options = {}) {
    return handleResponse(response, options)
  }

  /**
   * 處理異常錯誤
   * @static
   * @param {Error} error - 錯誤物件
   * @param {ErrorHandlerOptions} options - 處理選項
   * @returns {Object} 處理結果
   */
  static handleError(error, options = {}) {
    return handleError(error, options)
  }

  /**
   * 靜默處理（不顯示錯誤訊息）
   * @static
   * @param {Object} response - API 回應物件
   * @returns {Object} 處理結果
   */
  static silent(response) {
    return handleResponse(response, { silent: true })
  }
}
