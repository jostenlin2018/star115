/**
 * Accounts 帳戶資料管理模組
 *
 * 此模組專注於單一學生帳戶資料的編輯
 * 學生登入後只能查看和編輯自己的資料
 *
 * 主要功能：
 * - 根據學號取得學生帳戶資料
 * - 更新學生帳戶資料
 * - 驗證資料有效性
 */

/**
 * 根據學號取得單一帳戶資料
 * @param {string} stunum - 學號
 * @return {Object} 回應物件
 */
function getAccountByStudentNumber(stunum) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheet = ss.getSheetByName("accounts")

    if (!sheet) {
      return {
        code: -1,
        msg: "找不到 accounts 工作表!"
      }
    }

    // 取得所有資料（包含標題列）
    const dataRange = sheet.getDataRange()
    const data = dataRange.getValues()

    // 移除標題列
    const headers = data[0]
    const rows = data.slice(1)

    // 尋找符合學號的資料
    const targetRow = rows.find(row => String(row[0]) === String(stunum))

    if (!targetRow) {
      return {
        code: -1,
        msg: `找不到學號 ${stunum} 的資料`
      }
    }

    // 轉換為物件格式
    const accountData = {
      stunum: targetRow[0] || "",
      name: targetRow[1] || "",
      classnum: targetRow[2] || "",
      officenum: targetRow[3] || "",
      accountnum: targetRow[4] || "",
      aownername: targetRow[5] || "",
      aownerid: targetRow[6] || "",
      aownerrelation: targetRow[7] || "",
      email: targetRow[8] || "",
      cellphone: targetRow[9] || "",
      confirm: targetRow[10] === 1 || targetRow[10] === "1" || targetRow[10] === true,
      remark: targetRow[11] || ""
    }

    return {
      code: 0,
      msg: "取得成功",
      data: accountData
    }

  } catch (error) {
    return {
      code: -1,
      msg: "取得帳戶資料時發生錯誤：" + error.message
    }
  }
}

/**
 * 更新帳戶資料
 * @param {string} stunum - 學號（用於定位資料列）
 * @param {Object} accountData - 帳戶資料物件
 * @return {Object} 回應物件
 */
function updateAccount(stunum, accountData) {
  try {
    // 先驗證資料
    const validation = validateAccountData(accountData)
    if (validation.code !== 0) {
      return validation
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheet = ss.getSheetByName("accounts")

    if (!sheet) {
      return {
        code: -1,
        msg: "找不到 accounts 工作表"
      }
    }

    // 取得所有資料
    const dataRange = sheet.getDataRange()
    const data = dataRange.getValues()

    // 找到對應學號的列（從第2列開始，因為第1列是標題）
    let targetRow = -1
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(stunum)) {
        targetRow = i + 1 // 轉換為工作表的列號（1-based）
        break
      }
    }

    if (targetRow === -1) {
      return {
        code: -1,
        msg: `找不到學號 ${stunum} 的資料`
      }
    }

    // 確保學號不被修改
    if (String(accountData.stunum) !== String(stunum)) {
      return {
        code: -1,
        msg: "不允許修改學號"
      }
    }

    // 將 confirm 轉換為數字格式（1 或 0）
    const confirmValue = accountData.confirm ? 1 : 0

    // 準備要更新的資料
    const rowData = [
      accountData.stunum,
      accountData.name,
      accountData.classnum,
      accountData.officenum || "",
      accountData.accountnum || "",
      accountData.aownername || "",
      accountData.aownerid || "",
      accountData.aownerrelation || "",
      accountData.email || "",
      accountData.cellphone || "",
      confirmValue,
      accountData.remark || ""
    ]

    // 更新整列資料
    sheet.getRange(targetRow, 1, 1, 12).setValues([rowData])

    return {
      code: 0,
      msg: "更新成功",
      data: accountData
    }

  } catch (error) {
    return {
      code: -1,
      msg: "更新帳戶資料時發生錯誤：" + error.message
    }
  }
}

/**
 * 驗證帳戶資料
 * @param {Object} accountData - 帳戶資料物件
 * @return {Object} 驗證結果
 *
 * 注意：GAS 端已移除所有驗證規則，資料收集後將在 Google Sheets 中統一驗證
 */
function validateAccountData(accountData) {
  try {
    // 只檢查必填欄位（學號、姓名）
    if (!accountData.stunum || String(accountData.stunum).trim() === "") {
      return {
        code: -1,
        msg: "學號為必填欄位"
      }
    }

    if (!accountData.name || String(accountData.name).trim() === "") {
      return {
        code: -1,
        msg: "姓名為必填欄位"
      }
    }

    // 所有其他欄位不進行驗證，允許自由填寫
    // 資料收集後將在 Google Sheets 中統一驗證

    return {
      code: 0,
      msg: "驗證通過"
    }

  } catch (error) {
    return {
      code: -1,
      msg: "驗證資料時發生錯誤：" + error.message
    }
  }
}

/**
 * 郵局帳號檢查碼驗證
 * 參考：https://www.post.gov.tw/
 * @param {string} accountnum - 7位數帳號
 * @return {boolean} 是否通過驗證
 */
function validatePostalAccountChecksum(accountnum) {
  try {
    if (!/^\d{7}$/.test(accountnum)) {
      return false
    }

    // 郵局帳號檢查碼演算法
    const digits = accountnum.split("").map(d => parseInt(d))
    const weights = [1, 2, 4, 8, 5, 10, 9] // 權重

    let sum = 0
    for (let i = 0; i < 6; i++) {
      sum += digits[i] * weights[i]
    }

    const checkDigit = (11 - (sum % 11)) % 11
    const lastDigit = digits[6]

    // 檢查碼為10時，帳號最後一碼應為0
    if (checkDigit === 10) {
      return lastDigit === 0
    }

    return checkDigit === lastDigit

  } catch (error) {
    return false
  }
}

/**
 * 取得親屬關係選項列表
 * @return {Object} 回應物件
 */
function getRelationshipOptions() {
  return {
    code: 0,
    msg: "取得成功",
    data: [
      { value: "本人", label: "本人" },
      { value: "父親", label: "父親" },
      { value: "母親", label: "母親" },
      { value: "祖父", label: "祖父" },
      { value: "祖母", label: "祖母" },
      { value: "外祖父", label: "外祖父" },
      { value: "外祖母", label: "外祖母" },
      { value: "其他", label: "其他" }
    ]
  }
}

