import { createRouter } from "vue-router"
import { history, flatMultiLevelRoutes } from "./helper"
import routeSettings from "@/config/route"
import { usePreferencesStoreHook } from "@/store/modules/preferences"

const Layouts = () => import("@/layouts/index.vue")

/**
 * 常駐路由
 * 除了 redirect/403/404/login 等隱藏頁面，其他頁面建議設置 Name 屬性
 */
export const constantRoutes = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/views/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/views/error-page/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/views/error-page/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: Layouts,
    // Bug fix #4：動態重導向，依 setup.status 決定首頁
    redirect: () => {
      const preferencesStore = usePreferencesStoreHook()
      return preferencesStore.setup.status === "撕榜後" ? "/selected-department" : "/selected-group"
    },
    children: [
      {
        path: "success",
        component: () => import("@/views/success/index.vue"),
        name: "Success",
        meta: {
          title: "登入成功",
          hidden: true
        }
      },
      {
        path: "selected-group",
        component: () => import("@/views/selected-group/index.vue"),
        name: "SelectedGroup",
        meta: {
          title: "我的志願清單"
        }
      },
      {
        path: "add-group",
        component: () => import("@/views/add-group/index.vue"),
        name: "AddGroup",
        meta: {
          title: "搜尋並新增志願"
        }
      },
      {
        path: "selected-department",
        component: () => import("@/views/selected-department/index.vue"),
        name: "SelectedDepartment",
        meta: {
          title: "我的撕榜後志願"
        }
      },
      {
        path: "add-department",
        component: () => import("@/views/add-department/index.vue"),
        name: "AddDepartment",
        meta: {
          title: "選擇科系"
        }
      }
    ]
  }
]

/**
 * 動態路由
 * 用來放置有權限 (Roles 屬性) 的路由
 * 必須帶有 Name 屬性
 */
export const dynamicRoutes = []

export const router = createRouter({
  history,
  routes: routeSettings.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
  try {
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    window.location.reload()
  }
}
