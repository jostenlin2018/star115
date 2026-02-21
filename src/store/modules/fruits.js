import { defineStore } from "pinia"
import { ref } from "vue"
import { getAllFruits, getFruitById, addFruit, updateFruit, deleteFruit } from "@/api/fruits"

/**
 * Fruits Store
 * 用於管理水果資料的狀態和操作
 */
export const useFruitsStore = defineStore("fruits", () => {
  // ========== State ==========

  /** 所有水果資料列表 */
  const fruitsList = ref([])

  /** 當前選中的單一水果資料 */
  const currentFruit = ref(null)

  /** 載入狀態 */
  const loading = ref(false)

  /** 錯誤訊息 */
  const error = ref(null)

  // ========== Actions ==========

  /**
   * 取得所有水果資料
   * @returns {Promise<Object>} 回傳 API 回應
   */
  const fetchAllFruits = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await getAllFruits()
      if (response.code === 0) {
        fruitsList.value = response.data || []
      } else {
        error.value = response.message || "取得資料失敗"
        fruitsList.value = []
      }
      return response
    } catch (err) {
      error.value = err.message || "取得資料失敗"
      fruitsList.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 根據 ID 取得單一水果資料
   * @param {string|number} id - 水果 ID
   * @returns {Promise<Object>} 回傳 API 回應
   */
  const fetchFruitById = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await getFruitById(id)
      if (response.code === 0) {
        currentFruit.value = response.data
      } else {
        error.value = response.message || "取得資料失敗"
        currentFruit.value = null
      }
      return response
    } catch (err) {
      error.value = err.message || "取得資料失敗"
      currentFruit.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 新增水果資料
   * @param {Object} fruitData - 水果資料
   * @returns {Promise<Object>} 回傳 API 回應
   */
  const createFruit = async (fruitData) => {
    loading.value = true
    error.value = null
    try {
      const response = await addFruit(fruitData)
      if (response.code === 0) {
        // 新增成功後重新載入列表
        await fetchAllFruits()
      } else {
        error.value = response.message || "新增失敗"
      }
      return response
    } catch (err) {
      error.value = err.message || "新增失敗"
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新水果資料
   * @param {string|number} id - 水果 ID
   * @param {Object} fruitData - 更新的水果資料
   * @returns {Promise<Object>} 回傳 API 回應
   */
  const modifyFruit = async (id, fruitData) => {
    loading.value = true
    error.value = null
    try {
      const response = await updateFruit(id, fruitData)
      if (response.code === 0) {
        // 更新成功後重新載入列表
        await fetchAllFruits()
        // 如果當前選中的是這筆資料，也更新它
        if (currentFruit.value && String(currentFruit.value.id) === String(id)) {
          currentFruit.value = { ...fruitData }
        }
      } else {
        error.value = response.message || "更新失敗"
      }
      return response
    } catch (err) {
      error.value = err.message || "更新失敗"
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除水果資料
   * @param {string|number} id - 水果 ID
   * @returns {Promise<Object>} 回傳 API 回應
   */
  const removeFruit = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await deleteFruit(id)
      if (response.code === 0) {
        // 刪除成功後重新載入列表
        await fetchAllFruits()
        // 如果刪除的是當前選中的資料，清空它
        if (currentFruit.value && String(currentFruit.value.id) === String(id)) {
          currentFruit.value = null
        }
      } else {
        error.value = response.message || "刪除失敗"
      }
      return response
    } catch (err) {
      error.value = err.message || "刪除失敗"
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 設定當前選中的水果
   * @param {Object|null} fruit - 水果資料物件
   */
  const setCurrentFruit = (fruit) => {
    currentFruit.value = fruit
  }

  /**
   * 清除當前選中的水果
   */
  const clearCurrentFruit = () => {
    currentFruit.value = null
  }

  /**
   * 清除錯誤訊息
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 重置所有狀態
   */
  const resetState = () => {
    fruitsList.value = []
    currentFruit.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    fruitsList,
    currentFruit,
    loading,
    error,
    // Actions
    fetchAllFruits,
    fetchFruitById,
    createFruit,
    modifyFruit,
    removeFruit,
    setCurrentFruit,
    clearCurrentFruit,
    clearError,
    resetState
  }
})
