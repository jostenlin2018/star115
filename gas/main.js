/**
 * GAS網頁主入口
 * 這個function用於部署為網頁時，載入web page
 * @param {GoogleAppsScript.Events.DoGet} e - 請求事件參數
 * @returns {GoogleAppsScript.HTML.HtmlOutput} HTML輸出
 */
// eslint-disable-next-line no-redeclare
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index')
  return template.evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
}

/**
 * 伺服器端 include 輔助，用於在模板中插入子檔案內容
 * 支援傳入不含副檔名（自動補上 .html）或完整檔名
 * @param {string} filename
 * @returns {string}
 */
function include(filename) {
  let name = String(filename)
  if (!/\.html$/i.test(name)) {
    name += '.html'
  }
  return HtmlService.createHtmlOutputFromFile(name).getContent()
}


