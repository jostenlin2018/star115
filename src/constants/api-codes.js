/**
 * API 回應碼常數定義
 */

export const API_CODES = {
  /** 成功 */
  SUCCESS: 0,
  /** 一般錯誤 */
  ERROR: -1,
  /** 未授權 */
  UNAUTHORIZED: 401,
  /** 找不到資源 */
  NOT_FOUND: 404,
  /** 伺服器錯誤 */
  SERVER_ERROR: 500
}

/**
 * API 回應訊息常數
 */
export const API_MESSAGES = {
  SUCCESS: "操作成功",
  ERROR: "操作失敗",
  UNAUTHORIZED: "未授權，請重新登入",
  NOT_FOUND: "找不到資源",
  SERVER_ERROR: "伺服器錯誤",
  NETWORK_ERROR: "網路錯誤",
  TIMEOUT: "請求超時"
}
