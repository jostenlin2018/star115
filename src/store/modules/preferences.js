import { ref, computed } from "vue"
import { pinia } from "@/store"
import { defineStore } from "pinia"
import { saveStudentPreferencesApi, generatePDFApi, savePostRankingPreferencesApi } from "@/api/preferences"

export const usePreferencesStore = defineStore("preferences", () => {
  // ============ State ============

  const setup = ref({
    status: "撕榜前",
    startTime: "",
    endTime: ""
  })

  /** 原始巢狀校系資料（從 Drive 讀取） */
  const studentJSON = ref(null)

  /** 撕榜前：已選志願完整代碼字串陣列，最多 20 筆 */
  const preferencesList = ref([])

  /** 扁平化後的校系物件陣列，供搜尋使用 */
  const flattenedDepts = ref([])

  /** 前端資料是否與後端同步，savePreferences 成功後設 true */
  const pdfReady = ref(false)

  /** 志願陣列是否有未儲存的變更 */
  const isDirty = ref(false)

  /** 撕榜後：學生的撕榜結果代碼（例如 "1-1"），尚未撕榜時為 null */
  const rankingResult = ref(null)

  /** 撕榜後：撕榜結果中文名稱（例如 "國立臺灣大學 第一類學群"） */
  const rankingName = ref(null)

  /** 撕榜後：已選志願完整代碼陣列（長度 0~50） */
  const postRankingList = ref([])

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

  /**
   * 撕榜後可選科系清單：從 flattenedDepts 過濾出 學校學群代碼 === rankingResult + '-' 的科系。
   * Bug fix #1：學校學群代碼格式為 "1-1-"（含尾部 dash），rankingResult 為 "1-1"，需拼接 '-'。
   */
  const availableDepartments = computed(() => {
    if (!rankingResult.value) return []
    return flattenedDepts.value.filter((d) => d.學校學群代碼 === rankingResult.value + "-")
  })

  /** 撕榜後志願數上限（動態取決於可選科系總數） */
  const maxPostRankingLimit = computed(() => availableDepartments.value.length)

  /** 將 postRankingList 代碼對應回完整扁平化物件，供 selected-department 頁面渲染 */
  const detailedPostRankingList = computed(() =>
    postRankingList.value.map((code) => {
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

    // 撕榜後新增欄位
    rankingResult.value = data.rankingResult || null
    rankingName.value = data.rankingName || null
    postRankingList.value = Array.isArray(data.postRankingList) ? data.postRankingList : []

    flattenStudentData()
    pdfReady.value = true
    isDirty.value = false
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
      const 學校簡稱 = group.學校簡稱 || ""
      const 學群名稱 = group.學群類別 || group.學群名稱 || ""
      const 學群代碼 = String(group.學群類別代碼 || group.學群代碼 || "")
      const depts = group.可選填科系 || group.學系 || []

      for (const dept of depts) {
        const 學系名稱 = dept.學系名稱 || ""
        const 學系代碼 = String(dept.學系代碼 || "")
        const 學系簡稱 = dept.學系簡稱 || ""
        const 補充搜尋關鍵詞 = dept.補充搜尋關鍵詞 || ""
        const 完整代碼 = `${學校代碼}-${學群代碼}-${學系代碼}`
        const 學校學群代碼 = `${學校代碼}-${學群代碼}-`
        const 搜尋文本 = `${學校名稱} ${學校簡稱} ${學群名稱} ${學系名稱} ${學系簡稱} ${補充搜尋關鍵詞}`.toLowerCase()

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
   * 判斷目前是否在撕榜前志願選填開放時間內
   * @returns {boolean}
   */
  function isOpen() {
    if (setup.value.status === "撕榜後") return false

    const { startTime, endTime } = setup.value
    if (!startTime || !endTime) return true

    const now = new Date()
    const start = new Date(startTime.replace(/-/g, "/"))
    const end = new Date(endTime.replace(/-/g, "/"))

    return now >= start && now <= end
  }

  /**
   * 判斷目前是否在撕榜後志願選填開放時間內
   * @returns {boolean}
   */
  function isPostRankingOpen() {
    if (setup.value.status !== "撕榜後") return false

    const { startTime, endTime } = setup.value
    if (!startTime || !endTime) return true

    const now = new Date()
    const start = new Date(startTime.replace(/-/g, "/"))
    const end = new Date(endTime.replace(/-/g, "/"))

    return now >= start && now <= end
  }

  /**
   * 檢查加入某校系的狀態（撕榜前版）
   * @param {Object} dept - 扁平化校系物件
   * @returns {{ status: 'ok'|'selected'|'replace'|'full', existingIndex?: number }}
   */
  function checkAddStatus(dept) {
    if (preferencesList.value.includes(dept.完整代碼)) {
      return { status: "selected" }
    }

    const existingIndex = detailedPreferencesList.value.findIndex((d) => d.學校學群代碼 === dept.學校學群代碼)
    if (existingIndex !== -1) {
      return { status: "replace", existingIndex }
    }

    if (preferencesList.value.length >= 20) {
      return { status: "full" }
    }

    return { status: "ok" }
  }

  /**
   * 檢查加入撕榜後科系的狀態（簡化版：只有 ok / selected）
   * @param {Object} dept - 扁平化校系物件
   * @returns {{ status: 'ok'|'selected' }}
   */
  function checkPostRankingAddStatus(dept) {
    if (postRankingList.value.includes(dept.完整代碼)) {
      return { status: "selected" }
    }
    return { status: "ok" }
  }

  // ============ 撕榜前操作 Actions ============

  function addPreference(dept) {
    preferencesList.value.push(dept.完整代碼)
    pdfReady.value = false
    isDirty.value = true
  }

  function replacePreference(existingIndex, dept) {
    preferencesList.value[existingIndex] = dept.完整代碼
    pdfReady.value = false
    isDirty.value = true
  }

  function removePreference(index) {
    preferencesList.value.splice(index, 1)
    pdfReady.value = false
    isDirty.value = true
  }

  function moveUp(index) {
    if (index <= 0) return
    const arr = preferencesList.value
    ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
    pdfReady.value = false
    isDirty.value = true
  }

  function moveDown(index) {
    if (index >= preferencesList.value.length - 1) return
    const arr = preferencesList.value
    ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
    pdfReady.value = false
    isDirty.value = true
  }

  async function savePreferences() {
    const { useUserStore } = await import("./user")
    const userStore = useUserStore()
    const studentId = userStore.username

    const response = await saveStudentPreferencesApi(studentId, preferencesList.value)
    pdfReady.value = true
    isDirty.value = false
    return response
  }

  async function generatePDF() {
    const { useUserStore } = await import("./user")
    const userStore = useUserStore()
    const studentId = userStore.username

    const response = await generatePDFApi(studentId)
    return response.data.pdfUrl
  }

  // ============ 撕榜後操作 Actions ============

  function addPostRankingPreference(dept) {
    postRankingList.value.push(dept.完整代碼)
    isDirty.value = true
  }

  function removePostRankingPreference(index) {
    postRankingList.value.splice(index, 1)
    isDirty.value = true
  }

  function movePostRankingUp(index) {
    if (index <= 0) return
    const arr = postRankingList.value
    ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
    isDirty.value = true
  }

  function movePostRankingDown(index) {
    if (index >= postRankingList.value.length - 1) return
    const arr = postRankingList.value
    ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
    isDirty.value = true
  }

  async function savePostRankingPreferences() {
    const { useUserStore } = await import("./user")
    const userStore = useUserStore()
    const studentId = userStore.username

    const response = await savePostRankingPreferencesApi(studentId, postRankingList.value)
    isDirty.value = false
    return response
  }

  return {
    // State
    setup,
    studentJSON,
    preferencesList,
    flattenedDepts,
    pdfReady,
    isDirty,
    rankingResult,
    rankingName,
    postRankingList,
    // Getters
    detailedPreferencesList,
    availableDepartments,
    maxPostRankingLimit,
    detailedPostRankingList,
    // Actions（共用）
    initFromLoginPayload,
    flattenStudentData,
    isOpen,
    isPostRankingOpen,
    // Actions（撕榜前）
    checkAddStatus,
    addPreference,
    replacePreference,
    removePreference,
    moveUp,
    moveDown,
    savePreferences,
    generatePDF,
    // Actions（撕榜後）
    checkPostRankingAddStatus,
    addPostRankingPreference,
    removePostRankingPreference,
    movePostRankingUp,
    movePostRankingDown,
    savePostRankingPreferences
  }
})

export function usePreferencesStoreHook() {
  return usePreferencesStore(pinia)
}
