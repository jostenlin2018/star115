// import { getConfigLayout } from "@/utils/cache/local-storage"
import { LayoutModeEnum } from "@/constants/app-key"

/** 默认配置 */
const defaultSettings = {
  layoutMode: LayoutModeEnum.Left,
  showSettings: false,
  showTagsView: false, // 標籤欄 - 已隱藏
  fixedHeader: true,
  showFooter: true,
  showLogo: true,
  showNotify: false, // 消息通知 - 已隱藏
  showThemeSwitch: false, // 主題模式 - 已隱藏
  showScreenfull: false, // 全屏按鈕 - 已隱藏
  showSearchMenu: false, // 搜尋菜單 - 已隱藏
  cacheTagsView: false,
  showWatermark: false,
  showGreyMode: false,
  showColorWeakness: false,
  showSidebar: false, // 控制側邊欄顯示（單頁模式：false，多頁模式：true）
  showHamburger: false // 控制漢堡按鈕顯示（單頁模式：false，多頁模式：true）
}

/** 项目配置 */
// 程式預設會自動儲存使用者設定，並在下次登入時恢復
// export const layoutSettings = { ...defaultSettings, ...getConfigLayout() }

// 修改後所有使用者均採用預設配置
export const layoutSettings = { ...defaultSettings }
