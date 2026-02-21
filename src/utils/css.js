/** 获取指定元素（默认全局）上的 CSS 变量的值 */
export const getCssVar = (varName, element = document.documentElement) => {
  if (!varName?.startsWith("--")) {
    console.warn("CSS 变量名应以 '--' 开头")
    return ""
  }
  // 没有拿到值时，会返回空串
  return getComputedStyle(element).getPropertyValue(varName)
}

/** 设置指定元素（默认全局）上的 CSS 变量的值 */
export const setCssVar = (varName, value, element = document.documentElement) => {
  if (!varName?.startsWith("--")) {
    console.warn("CSS 变量名应以 '--' 开头")
    return
  }
  element.style.setProperty(varName, value)
}
