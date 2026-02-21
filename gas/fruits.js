/**
 * Google Spreadsheet - Fruits 管理功能
 * 這些函數用於操作 fruits 工作表的資料
 *
 * 工作表結構：
 * - id: 水果編號
 * - fruit_name: 水果名稱
 * - numbers: 數量
 * - descript: 描述
 */

/**
 * 取得目前的試算表
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getActiveSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet()
}

/**
 * 取得 fruits 工作表
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getFruitsSheet() {
  const spreadsheet = getActiveSpreadsheet()
  const sheetName = 'fruits'
  let sheet = spreadsheet.getSheetByName(sheetName)

  // 如果工作表不存在，創建一個新的
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName)
    // 設置預設標題列
    sheet.getRange(1, 1, 1, 4).setValues([['id', 'fruit_name', 'numbers', 'descript']])
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold')
  }

  return sheet
}

/**
 * 取得所有 fruits 資料
 * @returns {Object} 回應物件
 */
// eslint-disable-next-line no-unused-vars
function getAllFruits() {
  try {
    const sheet = getFruitsSheet()
    const lastRow = sheet.getLastRow()

    if (lastRow <= 1) {
      // 只有標題列或沒有資料
      return {
        code: 0,
        data: [],
        message: '成功'
      }
    }

    // 取得所有資料（從第2列開始，排除標題列）
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues()

    // 轉換為物件陣列
    const fruits = data.map((row, index) => ({
      rowIndex: index + 2, // 實際在試算表中的列數（+2 是因為索引從0開始，且第一列是標題）
      id: row[0] || '',
      fruit_name: row[1] || '',
      numbers: row[2] || 0,
      descript: row[3] || ''
    }))

    return {
      code: 0,
      data: fruits,
      message: '成功'
    }
  } catch (error) {
    return {
      code: 1,
      data: null,
      message: '取得資料失敗: ' + error.message
    }
  }
}

/**
 * 根據 ID 取得單一 fruit 資料
 * @param {string|number} id - 水果 ID
 * @returns {Object} 回應物件
 */
// eslint-disable-next-line no-unused-vars
function getFruitById(id) {
  try {
    const sheet = getFruitsSheet()
    const lastRow = sheet.getLastRow()

    if (lastRow <= 1) {
      return {
        code: 1,
        data: null,
        message: '找不到資料'
      }
    }

    // 取得所有資料
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues()

    // 尋找符合 ID 的資料
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        return {
          code: 0,
          data: {
            rowIndex: i + 2,
            id: data[i][0] || '',
            fruit_name: data[i][1] || '',
            numbers: data[i][2] || 0,
            descript: data[i][3] || ''
          },
          message: '成功'
        }
      }
    }

    return {
      code: 1,
      data: null,
      message: '找不到指定的水果資料'
    }
  } catch (error) {
    return {
      code: 1,
      data: null,
      message: '取得資料失敗: ' + error.message
    }
  }
}

/**
 * 新增 fruit 資料
 * @param {Object} fruitData - 水果資料物件
 * @param {string|number} fruitData.id - 水果 ID
 * @param {string} fruitData.fruit_name - 水果名稱
 * @param {number} fruitData.numbers - 數量
 * @param {string} fruitData.descript - 描述
 * @returns {Object} 回應物件
 */
// eslint-disable-next-line no-unused-vars
function addFruit(fruitData) {
  try {
    const sheet = getFruitsSheet()

    // 檢查 ID 是否已存在
    const lastRow = sheet.getLastRow()
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
      const existingId = ids.some(row => String(row[0]) === String(fruitData.id))
      if (existingId) {
        return {
          code: 1,
          data: null,
          message: 'ID 已存在，請使用不同的 ID'
        }
      }
    }

    // 新增資料
    const rowData = [
      fruitData.id || '',
      fruitData.fruit_name || '',
      fruitData.numbers || 0,
      fruitData.descript || ''
    ]
    sheet.appendRow(rowData)

    return {
      code: 0,
      data: fruitData,
      message: '新增成功'
    }
  } catch (error) {
    return {
      code: 1,
      data: null,
      message: '新增失敗: ' + error.message
    }
  }
}

/**
 * 更新 fruit 資料
 * @param {string|number} id - 要更新的水果 ID
 * @param {Object} fruitData - 更新的水果資料
 * @param {string|number} fruitData.id - 水果 ID
 * @param {string} fruitData.fruit_name - 水果名稱
 * @param {number} fruitData.numbers - 數量
 * @param {string} fruitData.descript - 描述
 * @returns {Object} 回應物件
 */
// eslint-disable-next-line no-unused-vars
function updateFruit(id, fruitData) {
  try {
    const sheet = getFruitsSheet()
    const lastRow = sheet.getLastRow()

    if (lastRow <= 1) {
      return {
        code: 1,
        data: null,
        message: '找不到資料'
      }
    }

    // 尋找要更新的資料列
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    let targetRow = -1

    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        targetRow = i + 2 // 實際列數
        break
      }
    }

    if (targetRow === -1) {
      return {
        code: 1,
        data: null,
        message: '找不到指定的水果資料'
      }
    }

    // 如果要更新的 ID 與原本不同，檢查新 ID 是否已存在
    if (String(fruitData.id) !== String(id)) {
      const existingId = ids.some(row => String(row[0]) === String(fruitData.id))
      if (existingId) {
        return {
          code: 1,
          data: null,
          message: '新的 ID 已存在，請使用不同的 ID'
        }
      }
    }

    // 更新資料
    const rowData = [
      fruitData.id || '',
      fruitData.fruit_name || '',
      fruitData.numbers || 0,
      fruitData.descript || ''
    ]
    sheet.getRange(targetRow, 1, 1, 4).setValues([rowData])

    return {
      code: 0,
      data: fruitData,
      message: '更新成功'
    }
  } catch (error) {
    return {
      code: 1,
      data: null,
      message: '更新失敗: ' + error.message
    }
  }
}

/**
 * 刪除 fruit 資料
 * @param {string|number} id - 要刪除的水果 ID
 * @returns {Object} 回應物件
 */
// eslint-disable-next-line no-unused-vars
function deleteFruit(id) {
  try {
    const sheet = getFruitsSheet()
    const lastRow = sheet.getLastRow()

    if (lastRow <= 1) {
      return {
        code: 1,
        data: null,
        message: '找不到資料'
      }
    }

    // 尋找要刪除的資料列
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    let targetRow = -1

    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        targetRow = i + 2 // 實際列數
        break
      }
    }

    if (targetRow === -1) {
      return {
        code: 1,
        data: null,
        message: '找不到指定的水果資料'
      }
    }

    // 刪除資料列
    sheet.deleteRow(targetRow)

    return {
      code: 0,
      data: null,
      message: '刪除成功'
    }
  } catch (error) {
    return {
      code: 1,
      data: null,
      message: '刪除失敗: ' + error.message
    }
  }
}

