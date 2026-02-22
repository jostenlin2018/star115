import { router } from "@/router"
import { useUserStoreHook } from "@/store/modules/user"
import { usePermissionStoreHook } from "@/store/modules/permission"
import { usePreferencesStoreHook } from "@/store/modules/preferences"
import { ElMessage } from "element-plus"
import { setRouteChange } from "@/hooks/useRouteListener"
import { useTitle } from "@/hooks/useTitle"
import { getToken } from "@/utils/cache/cookies"
import routeSettings from "@/config/route"
import isWhiteList from "@/config/white-list"
import NProgress from "nprogress"
import "nprogress/nprogress.css"

NProgress.configure({ showSpinner: false })
const { setTitle } = useTitle()
const userStore = useUserStoreHook()
const permissionStore = usePermissionStoreHook()

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  // 如果没有登陆
  if (!getToken()) {
    // 如果在免登录的白名单中，则直接进入
    if (isWhiteList(to)) return next()
    // 其他没有访问权限的页面将被重定向到登录页面
    return next("/login")
  }

  // 如果已经登录，并准备进入 Login 页面，则重定向到成功頁面
  if (to.path === "/login") {
    return next({ path: "/success" })
  }

  // 如果用户已经获得其权限角色
  if (userStore.roles.length !== 0) {
    return next()
  }

  // 否则要重新获取权限角色
  try {
    await userStore.getInfo()
    // 注意：角色必须是一个数组！ 例如: ["admin"] 或 ["developer", "editor"]
    const roles = userStore.roles
    // 生成可访问的 Routes
    routeSettings.dynamic ? permissionStore.setRoutes(roles) : permissionStore.setAllRoutes()
    // 将 "有访问权限的动态路由" 添加到 Router 中
    permissionStore.addRoutes.forEach((route) => router.addRoute(route))

    // Pinia 為記憶體狀態，F5 重整後 preferencesStore 會被清空。
    // 若 studentJSON 不存在，代表本次是重整後的首次路由觸發，
    // 此時無法在不重新登入的情況下還原校系資料，強制導回登入頁。
    const preferencesStore = usePreferencesStoreHook()
    if (!preferencesStore.studentJSON) {
      userStore.resetToken()
      ElMessage.warning("登入狀態已過期，請重新登入")
      return next("/login")
    }

    // Bug fix #4：雙向路由守衛，防止使用者跨階段存取錯誤頁面
    const isPostRanking = preferencesStore.setup.status === "撕榜後"
    // 撕榜後期：禁止進入撕榜前頁面
    if (isPostRanking && ["/selected-group", "/add-group"].includes(to.path)) {
      return next("/selected-department")
    }
    // 撕榜前期：禁止進入撕榜後頁面
    if (!isPostRanking && ["/selected-department", "/add-department"].includes(to.path)) {
      return next("/selected-group")
    }
    // 撕榜後期但尚未撕榜（rankingResult 為 null）：禁止進入 add-department
    if (isPostRanking && to.path === "/add-department" && !preferencesStore.rankingResult) {
      return next("/selected-department")
    }

    // 设置 replace: true, 因此导航将不会留下历史记录
    next({ ...to, replace: true })
  } catch (error) {
    // 过程中发生任何错误，都直接重置 Token，并重定向到登录页面
    userStore.resetToken()
    ElMessage.error(error.message || "路由守卫过程发生错误")
    next("/login")
  }
})

router.afterEach((to) => {
  setRouteChange(to)
  setTitle(to.meta.title)
  NProgress.done()
})
