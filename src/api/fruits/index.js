import { callGasFunction } from "@/utils/gas-service"

/**
 * 取得所有 fruits 資料
 * @returns {Promise<Object>} 回傳包含所有水果資料的 Promise
 */
export function getAllFruits() {
  return callGasFunction("getAllFruits")
}

/**
 * 根據 ID 取得單一 fruit 資料
 * @param {string|number} id - 水果 ID
 * @returns {Promise<Object>} 回傳包含單一水果資料的 Promise
 */
export function getFruitById(id) {
  return callGasFunction("getFruitById", id)
}

/**
 * 新增 fruit 資料
 * @param {Object} fruitData - 水果資料物件
 * @param {string|number} fruitData.id - 水果 ID
 * @param {string} fruitData.fruit_name - 水果名稱
 * @param {number} fruitData.numbers - 數量
 * @param {string} fruitData.descript - 描述
 * @returns {Promise<Object>} 回傳操作結果的 Promise
 */
export function addFruit(fruitData) {
  return callGasFunction("addFruit", fruitData)
}

/**
 * 更新 fruit 資料
 * @param {string|number} id - 要更新的水果 ID
 * @param {Object} fruitData - 更新的水果資料
 * @param {string|number} fruitData.id - 水果 ID
 * @param {string} fruitData.fruit_name - 水果名稱
 * @param {number} fruitData.numbers - 數量
 * @param {string} fruitData.descript - 描述
 * @returns {Promise<Object>} 回傳操作結果的 Promise
 */
export function updateFruit(id, fruitData) {
  return callGasFunction("updateFruit", id, fruitData)
}

/**
 * 刪除 fruit 資料
 * @param {string|number} id - 要刪除的水果 ID
 * @returns {Promise<Object>} 回傳操作結果的 Promise
 */
export function deleteFruit(id) {
  return callGasFunction("deleteFruit", id)
}
