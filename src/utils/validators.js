/**
 * 驗證工具庫
 * 提供統一的驗證函數，可在多個模組中重用
 */

/**
 * 驗證郵局單一 7 碼區段（局號或帳號）
 * 權重：[2, 3, 4, 5, 6, 7]
 * 檢查碼計算：11 - (加權總和 % 11)，若為 10 則檢查碼為 0，若為 11 則檢查碼為 1
 *
 * @param {string} segment - 7位數字字串
 * @returns {boolean} 是否通過驗證
 */
export function validatePostal7Digits(segment) {
  if (!/^\d{7}$/.test(segment)) {
    return false
  }

  const digits = segment.split("").map(Number)
  const weights = [2, 3, 4, 5, 6, 7]
  let sum = 0

  for (let i = 0; i < 6; i++) {
    sum += digits[i] * weights[i]
  }

  const remainder = sum % 11
  let checkValue = 11 - remainder
  if (checkValue === 10) checkValue = 0
  if (checkValue === 11) checkValue = 1

  return digits[6] === checkValue
}

/**
 * 驗證台灣身分證字號
 * 格式：1個大寫英文字母 + 1或2開頭 + 8個數字
 *
 * @param {string} id - 身分證字號
 * @returns {boolean} 是否通過驗證
 */
export function validateTaiwanID(id) {
  // 基本格式檢查
  if (!/^[A-Z][12]\d{8}$/.test(id)) {
    return false
  }

  // 字母對應數值表
  const letters = {
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 34,
    J: 18,
    K: 19,
    L: 20,
    M: 21,
    N: 22,
    O: 35,
    P: 23,
    Q: 24,
    R: 25,
    S: 26,
    T: 27,
    U: 28,
    V: 29,
    W: 32,
    X: 30,
    Y: 31,
    Z: 33
  }

  // 轉換為數字陣列
  const code = letters[id[0]]
  if (!code) return false

  const digits = [Math.floor(code / 10), code % 10].concat(id.slice(1).split("").map(Number))

  // 加權數
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1]

  // 計算加權總和
  const total = digits.reduce((sum, num, i) => sum + num * weights[i], 0)

  // 總和必須能被 10 整除
  return total % 10 === 0
}

/**
 * 驗證台灣手機號碼
 * 格式：09開頭的10位數字
 *
 * @param {string} phone - 手機號碼
 * @returns {boolean} 是否通過驗證
 */
export function validateTaiwanCellphone(phone) {
  return /^09\d{8}$/.test(phone)
}

/**
 * 驗證電子郵件格式
 *
 * @param {string} email - 電子郵件
 * @returns {boolean} 是否通過驗證
 */
export function validateEmail(email) {
  // 使用 Element Plus 的驗證規則或標準正則表達式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 驗證必填欄位
 *
 * @param {any} value - 要驗證的值
 * @returns {boolean} 是否為有效值（非空）
 */
export function validateRequired(value) {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim() !== ""
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * 驗證數字範圍
 *
 * @param {number} value - 要驗證的數字
 * @param {Object} options - 選項
 * @param {number} options.min - 最小值
 * @param {number} options.max - 最大值
 * @returns {boolean} 是否在範圍內
 */
export function validateNumberRange(value, options = {}) {
  const { min, max } = options
  const num = Number(value)

  if (isNaN(num)) return false
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false

  return true
}

/**
 * 驗證字串長度
 *
 * @param {string} value - 要驗證的字串
 * @param {Object} options - 選項
 * @param {number} options.min - 最小長度
 * @param {number} options.max - 最大長度
 * @returns {boolean} 是否符合長度要求
 */
export function validateStringLength(value, options = {}) {
  const { min, max } = options
  const str = String(value)

  if (min !== undefined && str.length < min) return false
  if (max !== undefined && str.length > max) return false

  return true
}

/**
 * 驗證器集合（方便統一導入）
 */
export const validators = {
  postal7Digits: validatePostal7Digits,
  taiwanID: validateTaiwanID,
  taiwanCellphone: validateTaiwanCellphone,
  email: validateEmail,
  required: validateRequired,
  numberRange: validateNumberRange,
  stringLength: validateStringLength
}
