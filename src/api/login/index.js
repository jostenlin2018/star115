import { gasLogin, gasGetUserInfo } from "@/utils/gas-service"
import { getToken } from "@/utils/cache/cookies"

/**
 * 登錄並返回 Token
 * 僅使用 GAS 服務
 */
export function loginApi(data) {
  return gasLogin(data.username, data.password)
}

/**
 * 獲取用戶詳情
 * 僅使用 GAS 服務
 */
export function getUserInfoApi() {
  const token = getToken()
  return gasGetUserInfo(token)
}
