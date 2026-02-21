/**
 * Google Apps Script 專用的 API 服務
 * 使用 google.script.run 與 GAS 後端通訊
 */

/* global google */

import { ElMessage } from "element-plus"

/**
 * 等待 google 物件載入
 * @param {number} timeout - 超時時間（毫秒）
 * @returns {Promise<boolean>}
 */
function waitForGoogleScript(timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now()

    const checkGoogle = () => {
      if (typeof google !== "undefined" && google?.script?.run) {
        resolve(true)
        return
      }

      if (Date.now() - startTime > timeout) {
        resolve(false)
        return
      }

      setTimeout(checkGoogle, 100)
    }

    checkGoogle()
  })
}

/**
 * 呼叫 GAS 函數的通用方法（保留舊版本以向後兼容）
 * @param {string} functionName - GAS 函數名稱
 * @param  {...any} args - 函數參數
 * @param {Object} options - 選項（可選）
 * @param {boolean} options.silent - 是否靜默處理錯誤（不自動顯示錯誤訊息）
 * @returns {Promise}
 */
export function callGasFunction(functionName, ...args) {
  // 檢查最後一個參數是否為選項物件
  const lastArg = args[args.length - 1]
  const options =
    typeof lastArg === "object" && lastArg !== null && !Array.isArray(lastArg) && "silent" in lastArg
      ? args.pop()
      : { silent: false }

  return new Promise((resolve, reject) => {
    // 定義異步處理函數
    const executeGasFunction = async () => {
      // 如果 google 物件不存在，等待載入
      if (typeof google === "undefined" || !google?.script?.run) {
        const loaded = await waitForGoogleScript()

        if (!loaded) {
          const errorMsg = "Google Apps Script API 無法載入，請確認使用正式部署網址（.../exec）並清除瀏覽器快取"
          if (!options.silent) {
            ElMessage.error(errorMsg)
          }
          reject(new Error(errorMsg))
          return
        }
      }

      // 呼叫實際函數
      google.script.run
        .withSuccessHandler((response) => {
          // 檢查回應格式
          if (!response) {
            const errorMsg = "GAS 函數無回應"
            if (!options.silent) {
              ElMessage.error(errorMsg)
            }
            reject(new Error(errorMsg))
            return
          }

          if (response.code === 0) {
            resolve(response)
          } else {
            const errorMsg = response.message || response.msg || `操作失敗 (code: ${response.code})`
            if (!options.silent) {
              ElMessage.error(errorMsg)
            }
            const error = new Error(errorMsg)
            error.response = response
            reject(error)
          }
        })
        .withFailureHandler((error) => {
          const errorMsg = "GAS 函數呼叫失敗: " + (error.message || "未知錯誤")
          if (!options.silent) {
            ElMessage.error(errorMsg)
          }
          reject(error)
        })
        [functionName](...args)
    }

    // 執行異步函數
    executeGasFunction()
  })
}

/**
 * 呼叫 GAS 函數（靜默模式，不自動顯示錯誤訊息）
 * 新版本推薦使用此方法，配合 ErrorHandler 統一處理錯誤
 * @param {string} functionName - GAS 函數名稱
 * @param  {...any} args - 函數參數
 * @returns {Promise}
 */
export function callGasFunctionSilent(functionName, ...args) {
  return callGasFunction(functionName, ...args, { silent: true })
}

/**
 * GAS 專用的登入 API
 * @param {string} username - 使用者名稱
 * @param {string} password - 密碼
 * @returns {Promise}
 */
export function gasLogin(username, password) {
  return callGasFunction("loginUser", username, password)
}

/**
 * GAS 專用的取得使用者資訊 API
 * @param {string} token - 認證 token
 * @returns {Promise}
 */
export function gasGetUserInfo(token) {
  return callGasFunction("getUserInfo", token)
}

/**
 * GAS 專用的登出 API
 * @param {string} token - 認證 token
 * @returns {Promise}
 */
export function gasLogout(token) {
  return callGasFunction("logoutUser", token)
}
