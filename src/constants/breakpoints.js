/**
 * 響應式斷點常數定義
 * 與 useResponsive.js 中的 BREAKPOINTS 保持一致
 */

export const BREAKPOINTS = {
  /** 手機斷點（< 576px） */
  MOBILE: 576,
  /** 平板斷點（576px - 991px） */
  TABLET: 992,
  /** 桌面斷點（>= 992px） */
  DESKTOP: 1200
}

/**
 * 響應式標籤寬度預設值
 */
export const LABEL_WIDTH = {
  MOBILE: "80px",
  TABLET: "120px",
  DESKTOP: "150px"
}

/**
 * 響應式欄位數預設值
 */
export const COLUMNS = {
  MOBILE: 1,
  TABLET: 2,
  DESKTOP: 3
}
