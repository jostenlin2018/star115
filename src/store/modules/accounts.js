/**
 * Accounts Store
 * 管理學生帳戶資料的狀態
 *
 * 特點：
 * - 根據登入學號自動載入資料
 * - 不可選擇其他學生的資料
 * - 某些欄位唯讀（學號、姓名、班級座號）
 * - 支援修改偵測和重置功能
 */

import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { getAccountByStudentNumber, updateAccount, getRelationshipOptions, getOfficerStatus } from "@/api/accounts"

export const useAccountsStore = defineStore("accounts", () => {
  // ========== State ==========

  /** 親屬關係選項列表 */
  const relationshipOptions = ref([])

  /** 當前編輯的帳戶資料 */
  const editingAccount = ref(null)

  /** 原始帳戶資料（用於重置和比對） */
  const originalAccount = ref(null)

  /** 載入狀態 */
  const loading = ref(false)

  /** 儲存狀態 */
  const saving = ref(false)

  /** 錯誤訊息 */
  const error = ref(null)

  /** 總務股長統計資料 */
  const officerData = ref(null)

  // ========== Computed ==========

  /**
   * 是否已載入帳戶資料
   */
  const hasAccountData = computed(() => {
    return editingAccount.value !== null
  })

  /**
   * 表單是否已被修改
   * 比對當前編輯資料與原始資料
   * 注意：confirm 欄位不計入修改判斷
   */
  const isModified = computed(() => {
    if (!editingAccount.value || !originalAccount.value) {
      return false
    }

    return (
      editingAccount.value.officenum !== originalAccount.value.officenum ||
      editingAccount.value.accountnum !== originalAccount.value.accountnum ||
      editingAccount.value.aownername !== originalAccount.value.aownername ||
      editingAccount.value.aownerid !== originalAccount.value.aownerid ||
      editingAccount.value.aownerrelation !== originalAccount.value.aownerrelation ||
      editingAccount.value.email !== originalAccount.value.email ||
      editingAccount.value.cellphone !== originalAccount.value.cellphone ||
      editingAccount.value.remark !== originalAccount.value.remark
    )
  })

  /**
   * 是否可以儲存
   * 條件：有資料、已修改、未在儲存中
   */
  const canSave = computed(() => {
    return hasAccountData.value && isModified.value && !saving.value
  })

  // ========== Actions ==========

  /**
   * 載入親屬關係選項列表
   */
  const fetchRelationshipOptions = async () => {
    try {
      const response = await getRelationshipOptions()
      if (response.code === 0) {
        relationshipOptions.value = response.data
      } else {
        console.error("載入親屬關係選項失敗：", response.msg)
      }
    } catch (err) {
      console.error("載入親屬關係選項時發生錯誤：", err)
    }
  }

  /**
   * 根據學號載入帳戶資料
   * @param {string} stunum - 學號
   */
  const loadAccountData = async (stunum) => {
    if (!stunum) {
      error.value = "學號不可為空"
      return {
        code: -1,
        msg: "學號不可為空"
      }
    }

    loading.value = true
    error.value = null

    try {
      const response = await getAccountByStudentNumber(stunum)

      if (response.code === 0) {
        // 設定編輯資料和原始資料
        editingAccount.value = { ...response.data }
        originalAccount.value = { ...response.data }

        return response
      } else {
        error.value = response.msg
        editingAccount.value = null
        originalAccount.value = null

        return response
      }
    } catch (err) {
      const errorMsg = "載入帳戶資料時發生錯誤：" + err.message
      error.value = errorMsg

      return {
        code: -1,
        msg: errorMsg
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 儲存帳戶資料
   */
  const saveAccount = async () => {
    if (!canSave.value) {
      return {
        code: -1,
        msg: "目前無法儲存"
      }
    }

    saving.value = true
    error.value = null

    try {
      const stunum = editingAccount.value.stunum
      const response = await updateAccount(stunum, editingAccount.value)

      if (response.code === 0) {
        // 更新成功後，將當前編輯資料設為新的原始資料
        originalAccount.value = { ...editingAccount.value }
      } else {
        error.value = response.msg
      }

      return response
    } catch (err) {
      const errorMsg = "儲存帳戶資料時發生錯誤：" + err.message
      error.value = errorMsg

      return {
        code: -1,
        msg: errorMsg
      }
    } finally {
      saving.value = false
    }
  }

  /**
   * 重置表單
   * 放棄所有變更，恢復到原始狀態
   */
  const resetForm = () => {
    if (originalAccount.value) {
      editingAccount.value = { ...originalAccount.value }
      error.value = null
    }
  }

  /**
   * 更新單一欄位
   * @param {string} field - 欄位名稱
   * @param {any} value - 欄位值
   */
  const updateField = (field, value) => {
    if (editingAccount.value) {
      editingAccount.value[field] = value
    }
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
    editingAccount.value = null
    originalAccount.value = null
    loading.value = false
    saving.value = false
    error.value = null
    officerData.value = null
  }

  /**
   * 取得總務股長班級填報統計
   * @param {string} stunum - 學號
   * @param {Array} roles - 使用者角色陣列
   */
  const fetchOfficerStatus = async (stunum, roles) => {
    console.log("fetchOfficerStatus 被調用", { stunum, roles })

    // 檢查是否為總務股長
    if (!roles || !roles.includes("chief")) {
      console.log("非總務股長，roles:", roles)
      officerData.value = null
      return {
        code: -1,
        msg: "非總務股長"
      }
    }

    try {
      console.log("開始呼叫 getOfficerStatus API...")
      const response = await getOfficerStatus(stunum)
      console.log("getOfficerStatus API 回應：", response)

      if (response.code === 0 && response.data) {
        officerData.value = response.data
        console.log("成功設定 officerData：", officerData.value)
      } else {
        officerData.value = null
        console.log("回應 code 不是 0 或沒有 data：", response)
      }

      return response
    } catch (err) {
      const errorMsg = "取得統計資料時發生錯誤：" + err.message
      console.error("fetchOfficerStatus 錯誤：", err)
      officerData.value = null

      return {
        code: -1,
        msg: errorMsg
      }
    }
  }

  // ========== Return ==========

  return {
    // State
    relationshipOptions,
    editingAccount,
    originalAccount,
    loading,
    saving,
    error,
    officerData,

    // Computed
    hasAccountData,
    isModified,
    canSave,

    // Actions
    fetchRelationshipOptions,
    loadAccountData,
    saveAccount,
    resetForm,
    updateField,
    clearError,
    resetState,
    fetchOfficerStatus
  }
})
