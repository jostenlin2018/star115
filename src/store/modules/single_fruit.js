import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { getFruitOptionsForSelect, getSingleFruitForEdit, updateSingleFruit } from "@/api/single_fruit"

/**
 * Single Fruit Store
 * 用於管理單一水果編輯的狀態和操作
 *
 * 特色：
 * - 提供下拉選單用的水果選項列表
 * - 管理當前正在編輯的水果資料
 * - 追蹤表單是否已被修改
 * - 提供儲存和重置功能
 */
export const useSingleFruitStore = defineStore("singleFruit", () => {
  // ========== State ==========

  /** 水果選項列表（用於下拉選單） */
  const fruitOptions = ref([])

  /** 當前選中的水果 ID */
  const selectedFruitId = ref(null)

  /** 當前正在編輯的水果資料 */
  const editingFruit = ref(null)

  /** 原始的水果資料（用於重置） */
  const originalFruit = ref(null)

  /** 載入狀態 */
  const loading = ref(false)

  /** 儲存狀態 */
  const saving = ref(false)

  /** 錯誤訊息 */
  const error = ref(null)

  // ========== Computed ==========

  /**
   * 表單是否已被修改
   * 比對當前編輯資料與原始資料
   */
  const isModified = computed(() => {
    if (!editingFruit.value || !originalFruit.value) return false

    return (
      editingFruit.value.id !== originalFruit.value.id ||
      editingFruit.value.fruit_name !== originalFruit.value.fruit_name ||
      editingFruit.value.numbers !== originalFruit.value.numbers ||
      editingFruit.value.descript !== originalFruit.value.descript
    )
  })

  /**
   * 是否有選中的水果
   */
  const hasSelectedFruit = computed(() => {
    return selectedFruitId.value !== null && editingFruit.value !== null
  })

  /**
   * 是否可以儲存
   * 條件：有選中的水果、表單已修改、不在儲存中
   */
  const canSave = computed(() => {
    return hasSelectedFruit.value && isModified.value && !saving.value
  })

  // ========== Actions ==========

  /**
   * 取得水果選項列表（用於下拉選單）
   * @returns {Promise<Object>} 回傳 API 回應
   */
  const fetchFruitOptions = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await getFruitOptionsForSelect()
      if (response.code === 0) {
        fruitOptions.value = response.data || []
      } else {
        error.value = response.message || "取得水果選項失敗"
        fruitOptions.value = []
      }
      return response
    } catch (err) {
      error.value = err.message || "取得水果選項失敗"
      fruitOptions.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 根據 ID 載入水果資料進行編輯
   * @param {string|number} id - 水果 ID
   * @returns {Promise<Object>} 回傳 API 回應
   */
  const loadFruitForEdit = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await getSingleFruitForEdit(id)
      if (response.code === 0) {
        // 儲存原始資料和編輯資料
        originalFruit.value = { ...response.data }
        editingFruit.value = { ...response.data }
        selectedFruitId.value = id
      } else {
        error.value = response.message || "載入水果資料失敗"
        editingFruit.value = null
        originalFruit.value = null
        selectedFruitId.value = null
      }
      return response
    } catch (err) {
      error.value = err.message || "載入水果資料失敗"
      editingFruit.value = null
      originalFruit.value = null
      selectedFruitId.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 儲存編輯的水果資料
   * @returns {Promise<Object>} 回傳 API 回應
   */
  const saveFruit = async () => {
    if (!editingFruit.value || !originalFruit.value) {
      throw new Error("沒有可儲存的資料")
    }

    saving.value = true
    error.value = null
    try {
      // 使用原始 ID 進行更新
      const response = await updateSingleFruit(originalFruit.value.id, {
        id: editingFruit.value.id,
        fruit_name: editingFruit.value.fruit_name,
        numbers: Number(editingFruit.value.numbers),
        descript: editingFruit.value.descript
      })

      if (response.code === 0) {
        // 更新成功後，將當前編輯資料設為新的原始資料
        originalFruit.value = { ...editingFruit.value }
        selectedFruitId.value = editingFruit.value.id

        // 如果 ID 改變了，需要重新載入選項列表
        if (originalFruit.value.id !== editingFruit.value.id) {
          await fetchFruitOptions()
        }
      } else {
        error.value = response.message || "儲存失敗"
      }
      return response
    } catch (err) {
      error.value = err.message || "儲存失敗"
      throw err
    } finally {
      saving.value = false
    }
  }

  /**
   * 重置表單到原始狀態
   */
  const resetForm = () => {
    if (originalFruit.value) {
      editingFruit.value = { ...originalFruit.value }
    }
  }

  /**
   * 更新編輯中的水果資料
   * @param {string} field - 欄位名稱
   * @param {any} value - 新值
   */
  const updateField = (field, value) => {
    if (editingFruit.value) {
      editingFruit.value[field] = value
    }
  }

  /**
   * 清除當前選擇
   */
  const clearSelection = () => {
    selectedFruitId.value = null
    editingFruit.value = null
    originalFruit.value = null
    error.value = null
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
    fruitOptions.value = []
    selectedFruitId.value = null
    editingFruit.value = null
    originalFruit.value = null
    loading.value = false
    saving.value = false
    error.value = null
  }

  return {
    // State
    fruitOptions,
    selectedFruitId,
    editingFruit,
    originalFruit,
    loading,
    saving,
    error,
    // Computed
    isModified,
    hasSelectedFruit,
    canSave,
    // Actions
    fetchFruitOptions,
    loadFruitForEdit,
    saveFruit,
    resetForm,
    updateField,
    clearSelection,
    clearError,
    resetState
  }
})
