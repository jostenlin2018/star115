/**
 * 統一載入狀態管理 Store
 * 提供統一的載入狀態管理，避免每個模組重複實現
 */

import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useLoadingStore = defineStore("loading", () => {
  // ========== State ==========

  /** 載入狀態映射表 */
  const loadingMap = ref(new Map())

  // ========== Computed ==========

  /**
   * 檢查是否有任何載入中的任務
   */
  const hasLoading = computed(() => {
    return Array.from(loadingMap.value.values()).some((value) => value === true)
  })

  // ========== Actions ==========

  /**
   * 設定載入狀態
   * @param {string} key - 載入狀態的鍵（通常是模組名或操作名）
   * @param {boolean} value - 載入狀態
   */
  const setLoading = (key, value) => {
    if (value) {
      loadingMap.value.set(key, true)
    } else {
      loadingMap.value.delete(key)
    }
  }

  /**
   * 檢查指定鍵是否正在載入
   * @param {string} key - 載入狀態的鍵
   * @returns {boolean} 是否正在載入
   */
  const isLoading = (key) => {
    return loadingMap.value.get(key) === true
  }

  /**
   * 清除指定鍵的載入狀態
   * @param {string} key - 載入狀態的鍵
   */
  const clearLoading = (key) => {
    loadingMap.value.delete(key)
  }

  /**
   * 清除所有載入狀態
   */
  const clearAllLoading = () => {
    loadingMap.value.clear()
  }

  /**
   * 執行異步操作並自動管理載入狀態
   * @param {string} key - 載入狀態的鍵
   * @param {Function} asyncFn - 異步函數
   * @returns {Promise} 異步函數的結果
   */
  const withLoading = async (key, asyncFn) => {
    setLoading(key, true)
    try {
      const result = await asyncFn()
      return result
    } finally {
      setLoading(key, false)
    }
  }

  // ========== Return ==========

  return {
    // State
    loadingMap,
    // Computed
    hasLoading,
    // Actions
    setLoading,
    isLoading,
    clearLoading,
    clearAllLoading,
    withLoading
  }
})
