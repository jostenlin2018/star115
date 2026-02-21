/**
 * Google Spreadsheet - Single Fruit 單一水果編輯功能
 * 這些函數用於選擇並編輯單一水果的資料
 *
 * 功能特色：
 * - 提供水果列表供下拉選單使用
 * - 根據 ID 取得單一水果的完整資料
 * - 更新單一水果的資料
 * - 不包含新增和刪除功能
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
function getSingleFruitsSheet() {
  const spreadsheet = getActiveSpreadsheet()
  const sheetName = 'fruits'
  const sheet = spreadsheet.getSheetByName(sheetName)

  // 如果工作表不存在，返回錯誤
  if (!sheet) {
    return null
  }

  return sheet
}

/**
 * 取得所有水果的簡要列表（用於下拉選單）
 * 只返回 id 和 fruit_name，用於下拉選單顯示
 * @returns {Object} 回應物件
 */
// eslint-disable-next-line no-unused-vars
function getFruitOptionsForSelect() {
  try {
    const sheet = getSingleFruitsSheet()

    if (!sheet) {
      return {
        code: 1,
        data: null,
        message: '找不到 fruits 工作表'
      }
    }

    const lastRow = sheet.getLastRow()

    if (lastRow <= 1) {
      // 只有標題列或沒有資料
      return {
        code: 0,
        data: [],
        message: '暫無水果資料'
      }
    }

    // 取得所有資料（從第2列開始，排除標題列）
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues()

    // 只返回 id 和 fruit_name 用於下拉選單
    const options = data.map((row) => ({
      id: row[0] || '',
      fruit_name: row[1] || '',
      label: `${row[0]} - ${row[1]}` // 組合顯示格式：「1 - 蘋果」
    }))

    return {
      code: 0,
      data: options,
      message: '成功'
    }
  } catch (error) {
    return {
      code: 1,
      data: null,
      message: '取得水果選項失敗: ' + error.message
    }
  }
}

/**
 * 根據 ID 取得單一水果的完整資料（用於編輯）
 * @param {string|number} id - 水果 ID
 * @returns {Object} 回應物件，包含完整的水果資料
 */
// eslint-disable-next-line no-unused-vars
function getSingleFruitForEdit(id) {
  try {
    const sheet = getSingleFruitsSheet()

    if (!sheet) {
      return {
        code: 1,
        data: null,
        message: '找不到 fruits 工作表'
      }
    }

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
            rowIndex: i + 2, // 實際在試算表中的列數
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
      message: '找不到指定 ID 的水果資料'
    }
  } catch (error) {
    return {
      code: 1,
      data: null,
      message: '取得水果資料失敗: ' + error.message
    }
  }
}

/**
 * 更新單一水果的資料
 * @param {string|number} originalId - 原始水果 ID（用於定位要更新的資料列）
 * @param {Object} fruitData - 更新的水果資料
 * @param {string|number} fruitData.id - 水果 ID（可能被修改）
 * @param {string} fruitData.fruit_name - 水果名稱
 * @param {number} fruitData.numbers - 數量
 * @param {string} fruitData.descript - 描述
 * @returns {Object} 回應物件
 */
// eslint-disable-next-line no-unused-vars
function updateSingleFruit(originalId, fruitData) {
  try {
    const sheet = getSingleFruitsSheet()

    if (!sheet) {
      return {
        code: 1,
        data: null,
        message: '找不到 fruits 工作表'
      }
    }

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
      if (String(ids[i][0]) === String(originalId)) {
        targetRow = i + 2 // 實際列數
        break
      }
    }

    if (targetRow === -1) {
      return {
        code: 1,
        data: null,
        message: '找不到指定 ID 的水果資料'
      }
    }

    // 如果要更新的 ID 與原本不同，檢查新 ID 是否已存在
    if (String(fruitData.id) !== String(originalId)) {
      const existingId = ids.some((row, index) => {
        // 排除當前行，檢查其他行是否有重複 ID
        return (index + 2) !== targetRow && String(row[0]) === String(fruitData.id)
      })

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
      data: {
        ...fruitData,
        rowIndex: targetRow
      },
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
 * 驗證水果資料的有效性
 * @param {Object} fruitData - 水果資料
 * @returns {Object} 驗證結果
 */
// eslint-disable-next-line no-unused-vars
function validateSingleFruitData(fruitData) {
  const errors = []

  // 驗證 ID
  if (!fruitData.id || String(fruitData.id).trim() === '') {
    errors.push('ID 不能為空')
  }

  // 驗證名稱
  if (!fruitData.fruit_name || String(fruitData.fruit_name).trim() === '') {
    errors.push('水果名稱不能為空')
  }

  // 驗證數量
  if (fruitData.numbers === undefined || fruitData.numbers === null) {
    errors.push('數量不能為空')
  } else if (typeof fruitData.numbers !== 'number' || fruitData.numbers < 0) {
    errors.push('數量必須為非負數')
  }

  if (errors.length > 0) {
    return {
      code: 1,
      data: null,
      message: '資料驗證失敗: ' + errors.join(', ')
    }
  }

  return {
    code: 0,
    data: null,
    message: '驗證成功'
  }
}

