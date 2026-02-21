import { callGasFunction } from "@/utils/gas-service"

/**
 * 取得水果選項列表（用於下拉選單）
 * 返回簡化的水果列表，包含 id、fruit_name 和 label
 * @returns {Promise<Object>} 回傳包含水果選項的 Promise
 */
export function getFruitOptionsForSelect() {
  return callGasFunction("getFruitOptionsForSelect")
}

/**
 * 根據 ID 取得單一水果的完整資料（用於編輯）
 * @param {string|number} id - 水果 ID
 * @returns {Promise<Object>} 回傳包含單一水果完整資料的 Promise
 */
export function getSingleFruitForEdit(id) {
  return callGasFunction("getSingleFruitForEdit", id)
}

/**
 * 更新單一水果的資料
 * @param {string|number} originalId - 原始水果 ID（用於定位要更新的資料列）
 * @param {Object} fruitData - 更新的水果資料
 * @param {string|number} fruitData.id - 水果 ID
 * @param {string} fruitData.fruit_name - 水果名稱
 * @param {number} fruitData.numbers - 數量
 * @param {string} fruitData.descript - 描述
 * @returns {Promise<Object>} 回傳操作結果的 Promise
 */
export function updateSingleFruit(originalId, fruitData) {
  return callGasFunction("updateSingleFruit", originalId, fruitData)
}

/**
 * 驗證水果資料的有效性
 * @param {Object} fruitData - 水果資料
 * @returns {Promise<Object>} 回傳驗證結果的 Promise
 */
export function validateSingleFruitData(fruitData) {
  return callGasFunction("validateSingleFruitData", fruitData)
}
