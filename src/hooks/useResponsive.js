/**
 * 響應式設計工具
 * 提供統一的響應式斷點檢測和工具函數
 */

import { ref, computed, onMounted, onUnmounted } from "vue"

/**
 * 響應式斷點定義
 */
export const BREAKPOINTS = {
  MOBILE: 576, // 手機
  TABLET: 992, // 平板
  DESKTOP: 1200 // 桌面
}

/**
 * 響應式設計 Composable
 * @returns {Object} 響應式狀態和工具函數
 */
export function useResponsive() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(true)
  const screenWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1920)

  /**
   * 檢測螢幕尺寸
   */
  const checkScreen = () => {
    if (typeof window === "undefined") return

    const width = window.innerWidth
    screenWidth.value = width

    isMobile.value = width < BREAKPOINTS.MOBILE
    isTablet.value = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET
    isDesktop.value = width >= BREAKPOINTS.TABLET
  }

  /**
   * 防抖處理的檢測函數
   */
  let resizeTimer = null
  const handleResize = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    resizeTimer = setTimeout(() => {
      checkScreen()
    }, 150)
  }

  onMounted(() => {
    checkScreen()
    window.addEventListener("resize", handleResize)
  })

  onUnmounted(() => {
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    window.removeEventListener("resize", handleResize)
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    checkScreen
  }
}

/**
 * 獲取響應式的 label-width
 * @param {Object} options - 選項
 * @param {string} options.mobile - 手機端寬度，預設 "80px"
 * @param {string} options.tablet - 平板端寬度，預設 "120px"
 * @param {string} options.desktop - 桌面端寬度，預設 "150px"
 * @returns {import('vue').ComputedRef<string>}
 */
export function useResponsiveLabelWidth(options = {}) {
  const { mobile = "80px", tablet = "120px", desktop = "150px" } = options
  const { isMobile, isTablet, isDesktop } = useResponsive()

  return computed(() => {
    if (isMobile.value) return mobile
    if (isTablet.value) return tablet
    if (isDesktop.value) return desktop
    return desktop
  })
}

/**
 * 獲取響應式的欄位數
 * @param {Object} options - 選項
 * @param {number} options.mobile - 手機端欄位數，預設 1
 * @param {number} options.tablet - 平板端欄位數，預設 2
 * @param {number} options.desktop - 桌面端欄位數，預設 3
 * @returns {import('vue').ComputedRef<number>}
 */
export function useResponsiveColumns(options = {}) {
  const { mobile = 1, tablet = 2, desktop = 3 } = options
  const { isMobile, isTablet, isDesktop } = useResponsive()

  return computed(() => {
    if (isMobile.value) return mobile
    if (isTablet.value) return tablet
    if (isDesktop.value) return desktop
    return desktop
  })
}
