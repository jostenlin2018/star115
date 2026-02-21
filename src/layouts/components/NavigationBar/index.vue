<script setup>
import { useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import { useAppStore } from "@/store/modules/app"
import { useSettingsStore } from "@/store/modules/settings"
import { useUserStore } from "@/store/modules/user"
import { UserFilled } from "@element-plus/icons-vue"
import Hamburger from "../Hamburger/index.vue"
import Breadcrumb from "../Breadcrumb/index.vue"
import Sidebar from "../Sidebar/index.vue"
import Notify from "@/components/Notify/index.vue"
import ThemeSwitch from "@/components/ThemeSwitch/index.vue"
import Screenfull from "@/components/Screenfull/index.vue"
import SearchMenu from "@/components/SearchMenu/index.vue"
import { useDevice } from "@/hooks/useDevice"
import { useLayoutMode } from "@/hooks/useLayoutMode"

const { isMobile } = useDevice()
const { isTop } = useLayoutMode()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const { showNotify, showThemeSwitch, showScreenfull, showSearchMenu, showHamburger } = storeToRefs(settingsStore)

/** 切换侧边栏 */
const toggleSidebar = () => {
  appStore.toggleSidebar(false)
}

/** 登出 */
const logout = () => {
  userStore.logout()
  router.push("/login")
}
</script>

<template>
  <div class="navigation-bar">
    <Hamburger
      v-if="showHamburger && (!isTop || isMobile)"
      :is-active="appStore.sidebar.opened"
      class="hamburger"
      @toggle-click="toggleSidebar"
    />
    <Breadcrumb v-if="showHamburger && (!isTop || isMobile)" class="breadcrumb" />
    <Sidebar v-if="isTop && !isMobile" class="sidebar" />
    <div class="right-menu">
      <SearchMenu v-if="showSearchMenu" class="right-menu-item" />
      <Screenfull v-if="showScreenfull" class="right-menu-item" />
      <ThemeSwitch v-if="showThemeSwitch" class="right-menu-item" />
      <Notify v-if="showNotify" class="right-menu-item" />
      <div class="right-menu-item user-info">
        <el-avatar :icon="UserFilled" :size="30" />
        <span class="display-name">{{ userStore.displayName }}</span>
      </div>
      <el-button type="danger" plain class="logout-button" @click="logout">登出</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navigation-bar {
  height: var(--v3-navigationbar-height);
  overflow: hidden;
  color: var(--v3-navigationbar-text-color);
  display: flex;
  justify-content: space-between;
  .hamburger {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 15px;
    cursor: pointer;
  }
  .breadcrumb {
    flex: 1;
    // 参考 Bootstrap 的响应式设计将宽度设置为 576
    @media screen and (max-width: 576px) {
      display: none;
    }
  }
  .sidebar {
    flex: 1;
    // 设置 min-width 是为了让 Sidebar 里的 el-menu 宽度自适应
    min-width: 0px;
    :deep(.el-menu) {
      background-color: transparent;
    }
    :deep(.el-sub-menu) {
      &.is-active {
        .el-sub-menu__title {
          color: var(--el-color-primary) !important;
        }
      }
    }
  }
  .right-menu {
    margin-left: auto; // 確保始終靠右對齊
    margin-right: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    .right-menu-item {
      padding: 0 10px;
      cursor: pointer;
      &.user-info {
        display: flex;
        align-items: center;
        cursor: default;
        .el-avatar {
          margin-right: 10px;
        }
        .display-name {
          font-size: 16px;
          font-weight: 500;
        }
      }
    }
    .logout-button {
      margin-left: 5px;
      margin-right: 10px;
    }
  }
}

// 單頁模式（無漢堡按鈕）時的額外優化
.navigation-bar:not(:has(.hamburger, .breadcrumb, .sidebar)) {
  .right-menu {
    margin-left: auto;
  }
}
</style>
