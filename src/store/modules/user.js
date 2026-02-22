import { ref } from "vue"
import { pinia } from "@/store"
import { defineStore } from "pinia"
import { useTagsViewStore } from "./tags-view"
import { useSettingsStore } from "./settings"
import { usePreferencesStore } from "./preferences"
import { getToken, removeToken, setToken } from "@/utils/cache/cookies"
import { resetRouter } from "@/router"
import { loginApi, getUserInfoApi } from "@/api/login"
import routeSettings from "@/config/route"
import { ElMessage } from "element-plus"

export const useUserStore = defineStore("user", () => {
  const token = ref(getToken() || "")
  const roles = ref([])
  const username = ref("")
  const displayName = ref("")
  const nationalId = ref("")

  const tagsViewStore = useTagsViewStore()
  const settingsStore = useSettingsStore()

  /** 登录 */
  const login = async ({ username: u, password /*, code*/ }) => {
    const response = await loginApi({ username: u, password /*, code*/ })
    const { data } = response
    setToken(data.token)
    token.value = data.token

    // 初始化志願相關資料（setup / studentJSON / preferencesList）
    const preferencesStore = usePreferencesStore()
    preferencesStore.initFromLoginPayload(data)

    // 若學生 JSON 讀取失敗，顯示友善提示（不阻斷登入流程）
    if (data.studentJSONError) {
      ElMessage.warning(data.studentJSONError)
    }
  }
  /** 获取用户详情 */
  const getInfo = async () => {
    const response = await getUserInfoApi()
    const { data } = response
    username.value = data.username // username 即學號，供 preferences store 跨 Store 存取
    displayName.value = data.displayName
    nationalId.value = data.nationalId
    // 验证返回的 roles 是否为一个非空数组，否则塞入一个没有任何作用的默认角色，防止路由守卫逻辑进入无限循环
    roles.value = data.roles?.length > 0 ? data.roles : routeSettings.defaultRoles

    // 重新初始化志願相關資料（F5 重新整理時重載狀態）
    const preferencesStore = usePreferencesStore()
    preferencesStore.initFromLoginPayload(data)

    // 若學生 JSON 讀取失敗，顯示友善提示
    if (data.studentJSONError) {
      ElMessage.warning(data.studentJSONError)
    }
  }
  /** 模拟角色变化 */
  const changeRoles = async (role) => {
    const newToken = "token-" + role
    token.value = newToken
    setToken(newToken)
    // 用刷新页面代替重新登录
    window.location.reload()
  }
  /** 登出 */
  const logout = () => {
    removeToken()
    token.value = ""
    roles.value = []
    resetRouter()
    _resetTagsView()
  }
  /** 重置 Token */
  const resetToken = () => {
    removeToken()
    token.value = ""
    roles.value = []
  }
  /** 重置 Visited Views 和 Cached Views */
  const _resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { token, roles, username, displayName, nationalId, login, getInfo, changeRoles, logout, resetToken }
})

/**
 * 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreHook() {
  return useUserStore(pinia)
}
