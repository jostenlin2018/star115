import { ref, computed } from "vue"
import { pinia } from "@/store"
import { defineStore } from "pinia"
import { saveStudentPreferencesApi, generatePDFApi } from "@/api/preferences"

export const usePreferencesStore = defineStore("preferences", () => {
  // ============ State ============

  const setup = ref({
    status: "撕榜前",
    startTime: "",
    endTime: ""
  })

  /** 原始巢狀校系資料（從 Drive 讀取） */
  const studentJSON = ref(null)

  /** 已選志願完整代碼字串陣列，最多 20 筆 */
  const preferencesList = ref([])

  /** 扁平化後的校系物件陣列，供搜尋使用 */
  const flattenedDepts = ref([])

  /**
   * 前端資料是否與後端同步。
   * initFromLoginPayload 時預設 true（登入即同步）；
   * 任何增刪移動後設 false；savePreferences 成功後設 true。
   */
  const pdfReady = ref(false)

  // ============ Getters ============

  /**
   * 將 preferencesList 的每個代碼字串對應回完整的扁平化物件（含中文名稱），
   * 供 selected-group 頁面直接綁定 el-table 渲染。
   */
  const detailedPreferencesList = computed(() =>
    preferencesList.value.map((code) => {
      const dept = flattenedDepts.value.find((d) => d.完整代碼 === code)
      return dept || { 完整代碼: code, 學校名稱: "未知", 學群名稱: "—", 學系名稱: "資料缺失" }
    })
  )

  // ============ Actions ============

  /**
   * 登入後由 user store 呼叫，初始化所有志願相關資料
   * @param {Object} data - loginUser() 回傳的 data 物件
   */
  function initFromLoginPayload(data) {
    if (data.setup) {
      setup.value = data.setup
    }
    studentJSON.value = data.studentJSON || null
    preferencesList.value = Array.isArray(data.preferencesList) ? data.preferencesList : []
    flattenStudentData()
    // 登入當下資料與後端完全同步，直接啟用 PDF 按鈕
    pdfReady.value = true
  }

  /**
   * 將 studentJSON 的巢狀結構轉換為一維扁平化陣列
   * 支援 buildStudentDataJSON() 產生的格式：
   * { 可選填校系: [{ 學校名稱, 學校代碼, 學群類別, 學群類別代碼, 可選填科系: [{ 學系名稱, 學系代碼 }] }] }
   */
  function flattenStudentData() {
    if (!studentJSON.value) {
      flattenedDepts.value = []
      return
    }

    const result = []
    const schoolGroups = studentJSON.value.可選填校系 || []

    for (const group of schoolGroups) {
      const 學校名稱 = group.學校名稱 || ""
      const 學校代碼 = String(group.學校代碼 || "")
      const 學群名稱 = group.學群類別 || group.學群名稱 || ""
      const 學群代碼 = String(group.學群類別代碼 || group.學群代碼 || "")
      const depts = group.可選填科系 || group.學系 || []

      for (const dept of depts) {
        const 學系名稱 = dept.學系名稱 || ""
        const 學系代碼 = String(dept.學系代碼 || "")
        const 完整代碼 = `${學校代碼}-${學群代碼}-${學系代碼}`
        const 學校學群代碼 = `${學校代碼}-${學群代碼}`
        const 搜尋文本 = `${學校名稱} ${學群名稱} ${學系名稱}`

        result.push({
          學校名稱,
          學校代碼,
          學群名稱,
          學群代碼,
          學系名稱,
          學系代碼,
          完整代碼,
          學校學群代碼,
          搜尋文本
        })
      }
    }

    flattenedDepts.value = result
  }

  /**
   * 判斷目前是否在志願選填開放時間內
   * @returns {boolean}
   */
  function isOpen() {
    if (setup.value.status === "撕榜後") return false

    const { startTime, endTime } = setup.value
    if (!startTime || !endTime) return true // 未設定時間區間，視為開放

    const now = new Date()
    const start = new Date(startTime.replace(/\//g, "-"))
    const end = new Date(endTime.replace(/\//g, "-"))

    return now >= start && now <= end
  }

  /**
   * 檢查加入某校系的狀態（純資料邏輯，不操作 UI）
   * @param {Object} dept - 扁平化校系物件（含 完整代碼 與 學校學群代碼）
   * @returns {{ status: 'ok'|'selected'|'replace'|'full', existingIndex?: number }}
   */
  function checkAddStatus(dept) {
    // 1. 已選取（完整代碼已存在）
    if (preferencesList.value.includes(dept.完整代碼)) {
      return { status: "selected" }
    }

    // 2. 同校同學群已有其他科系
    const existingIndex = detailedPreferencesList.value.findIndex((d) => d.學校學群代碼 === dept.學校學群代碼)
    if (existingIndex !== -1) {
      return { status: "replace", existingIndex }
    }

    // 3. 已達上限
    if (preferencesList.value.length >= 20) {
      return { status: "full" }
    }

    return { status: "ok" }
  }

  /**
   * 直接加入一個新志願（呼叫前應確認 checkAddStatus 回傳 'ok'）
   * @param {Object} dept - 扁平化校系物件
   */
  function addPreference(dept) {
    preferencesList.value.push(dept.完整代碼)
    pdfReady.value = false
  }

  /**
   * 原位替換同校同學群的志願（維持序位不變）
   * @param {number} existingIndex - 欲替換的志願在 preferencesList 中的索引
   * @param {Object} dept - 新的扁平化校系物件
   */
  function replacePreference(existingIndex, dept) {
    preferencesList.value[existingIndex] = dept.完整代碼
    pdfReady.value = false
  }

  /**
   * 移除指定索引的志願
   * @param {number} index
   */
  function removePreference(index) {
    preferencesList.value.splice(index, 1)
    pdfReady.value = false
  }

  /**
   * 將指定志願向上移動一位
   * @param {number} index
   */
  function moveUp(index) {
    if (index <= 0) return
    const arr = preferencesList.value
    ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
    pdfReady.value = false
  }

  /**
   * 將指定志願向下移動一位
   * @param {number} index
   */
  function moveDown(index) {
    if (index >= preferencesList.value.length - 1) return
    const arr = preferencesList.value
    ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
    pdfReady.value = false
  }

  /**
   * 儲存志願至 GAS 後端
   * 透過 useUserStore() 跨 Store 取得學號
   * @returns {Promise<boolean>} 儲存是否成功
   */
  async function savePreferences() {
    const { useUserStore } = await import("./user")
    const userStore = useUserStore()
    const studentId = userStore.username

    const response = await saveStudentPreferencesApi(studentId, preferencesList.value)
    pdfReady.value = true
    return response
  }

  /**
   * 呼叫 GAS 產生 PDF，回傳 PDF URL
   * 透過 useUserStore() 跨 Store 取得學號
   * @returns {Promise<string>} PDF URL
   */
  async function generatePDF() {
    const { useUserStore } = await import("./user")
    const userStore = useUserStore()
    const studentId = userStore.username

    const response = await generatePDFApi(studentId)
    return response.data.pdfUrl
  }

  return {
    // State
    setup,
    studentJSON,
    preferencesList,
    flattenedDepts,
    pdfReady,
    // Getters
    detailedPreferencesList,
    // Actions
    initFromLoginPayload,
    flattenStudentData,
    isOpen,
    checkAddStatus,
    addPreference,
    replacePreference,
    removePreference,
    moveUp,
    moveDown,
    savePreferences,
    generatePDF
  }
})

export function usePreferencesStoreHook() {
  return usePreferencesStore(pinia)
}
