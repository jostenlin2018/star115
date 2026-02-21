/**
 * 驗證中華郵政14碼存款帳號是否有效。
 * 郵局帳號共 14 碼，分為局號與帳號各 7 碼。
 * 每段的第 7 碼是檢查碼，依前 6 碼加權後取模 11 計算，兩段皆正確才算有效。
 */
function VALIDATE_POST_ACCOUNT(accountNumber) {
  var value = accountNumber.trim();
  if (!/^\d{14}$/.test(value)) return false;

  var digits = value.split('').map(Number);

  function calculateCheck(startIndex) {
    const weights = [2, 3, 4, 5, 6, 7];
    let sum = 0;
    for (let i = 0; i < 6; i++) {
      sum += digits[startIndex + i] * weights[i];
    }
    const remainder = sum % 11;
    let checkValue = 11 - remainder;
    if (checkValue === 10) return 0;
    if (checkValue === 11) return 1;
    return checkValue;
  }

  // 局號第7碼
  if (calculateCheck(0) !== digits[6]) return false;

  // 帳號第14碼
  if (calculateCheck(7) !== digits[13]) return false;

  return true;
}


function test1(){
  Logger.log(VALIDATE_POST_ACCOUNT('00410810316280'))
  Logger.log(VALIDATE_POST_ACCOUNT('01012780006247'))
  Logger.log(VALIDATE_POST_ACCOUNT('00410320539098'))
}

/**
 * 驗證郵局單一 7 碼區段（局號或帳號）是否有效。
 * @param {string} segment - 7 位數字字串。
 * @return {boolean} - 若檢查碼正確則回傳 true，否則 false。
 */
function validatePost7(segment) {
  if (!/^\d{7}$/.test(segment)) {
    return false; // 格式錯誤
  }

  const digits = segment.split('').map(Number);
  const weights = [2, 3, 4, 5, 6, 7];
  let sum = 0;

  for (let i = 0; i < 6; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 11;
  let checkValue = 11 - remainder;
  if (checkValue === 10) checkValue = 0;
  if (checkValue === 11) checkValue = 1;

  return digits[6] === checkValue;
}

function test2(){
  Logger.log(validatePost7('0041081'))
  Logger.log(validatePost7('0101278'))
  Logger.log(validatePost7('0041032'))
  Logger.log(validatePost7('0316280'))
  Logger.log(validatePost7('0006247'))
  Logger.log(validatePost7('0539098'))
}

/**
 * 驗證台灣身分證號（A123456789 等格式）
 * @param {string} id - 身分證號字串
 * @return {boolean} - 若格式正確且檢查碼通過，回傳 true
 */
function validateTaiwanID(id) {
  // 1. 基本格式檢查：1個大寫字母 + 1或2開頭 + 8個數字
  if (!/^[A-Z][12]\d{8}$/.test(id)) {
    return false;
  }

  // 2. 建立字母對應的數值表
  const letters = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18, K: 19, L: 20,
    M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29,
    W: 32, X: 30, Y: 31, Z: 33
  };

  // 3. 將身分證號轉換為純數字陣列以進行計算
  const code = letters[id[0]]; // 取得首位字母對應的數字
  const digits = [
    Math.floor(code / 10), // 字母對應數的十位數
    code % 10             // 字母對應數的個位數
  ].concat(
    id.slice(1).split('').map(Number) // 原始身分證號的後9碼
  );

  // 4. 定義加權數
  // 修正：權重陣列應為 11 位，最後一位是給檢查碼本身使用的，權重為 1
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];

  // 5. 計算加權總和
  const total = digits.reduce((sum, num, i) => {
    return sum + num * weights[i];
  }, 0);

  // 6. 驗證：加權總和必須能被 10 整除
  return total % 10 === 0;
}

function test3(){
  Logger.log(validateTaiwanID('O100865489'));
  Logger.log(validateTaiwanID('E126583732'));
  Logger.log(validateTaiwanID('T126163303'));
  Logger.log(validateTaiwanID('E125522119'));
}
