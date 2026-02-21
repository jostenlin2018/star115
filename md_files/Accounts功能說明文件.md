# Accounts 學生帳戶資料管理功能說明文件

## 📖 概述

本文件說明 **Accounts 學生帳戶資料管理模組**的設計與實作。此模組專注於讓學生填寫和管理自己的郵局帳戶資料，是基於 Single Fruit 模組改良的單一資料編輯模式。

### 🎯 核心特色

與 Single Fruit 模組的最大差異：

- **無下拉選單** - 學生登入後自動根據自己的學號載入資料
- **不可選擇其他學生** - 只能查看和編輯自己的資料
- **部分欄位唯讀** - 學號、姓名、班級座號不可修改
- **多種驗證規則** - 郵局局號、帳號檢查碼、身分證字號、電子郵件、手機號碼等驗證
- **前端驗證優先** - 使用前端驗證提供即時反饋，後端只做基本檢查
- **確認核取方塊** - 修改資料後自動取消勾選，必須重新確認後才能儲存
- **學校色彩** - 使用學校藍色(#4169e1)作為主題色

---

## 🗂️ 檔案結構

```
vue3-gas/
├── gas/
│   └── accounts.js                           # GAS 後端函數
├── src/
│   ├── api/
│   │   └── accounts/
│   │       └── index.js                      # API 層
│   ├── store/
│   │   └── modules/
│   │       └── accounts.js                   # Pinia Store
│   ├── views/
│   │   └── accounts/
│   │       └── index.vue                     # Vue 組件頁面
│   └── router/
│       └── index.js                          # 路由配置（已更新）
└── md_files/
    └── Accounts功能說明文件.md                # 本說明文件
```

---

## 📋 資料結構

### Google Spreadsheet 工作表

**工作表名稱：** `accounts`

**欄位結構：**

| 欄位名稱       | 說明           | 可否編輯  | 驗證規則                    |
| -------------- | -------------- | --------- | --------------------------- |
| stunum         | 學號           | ❌ 唯讀   | 必須與登入學號相同          |
| name           | 學生姓名       | ❌ 唯讀   | -                           |
| classnum       | 班級座號       | ❌ 唯讀   | -                           |
| officenum      | 立帳郵局局號   | ✅ 可編輯 | 7位數字                     |
| accountnum     | 郵局存簿帳號   | ✅ 可編輯 | 7位數字（含檢查碼驗證）     |
| aownername     | 郵局帳號戶名   | ✅ 可編輯 | 必須與郵局戶名完全相同      |
| aownerid       | 戶名身分證字號 | ✅ 可編輯 | 台灣身分證格式驗證          |
| aownerrelation | 戶名親屬關係   | ✅ 可編輯 | 下拉選單選項                |
| email          | 學生電子郵件   | ✅ 可編輯 | 電子郵件格式驗證            |
| cellphone      | 學生手機號碼   | ✅ 可編輯 | 台灣手機格式驗證（09 開頭） |
| confirm        | 確認正確       | ✅ 可編輯 | 核取方塊                    |
| remark         | 備註           | ✅ 可編輯 | 自由文字                    |

### 親屬關係選項

下拉式選單的選項依序為：

- 本人
- 父親
- 母親
- 祖父
- 祖母
- 外祖父
- 外祖母
- 其他

---

## 🎯 功能特色

### ✨ 核心功能

1. **自動載入資料** - 根據登入學號自動載入該學生的資料
2. **即時編輯** - 在表單中修改可編輯欄位
3. **前端即時驗證** - 使用 validatePost7 和 validateTaiwanID 進行檢查碼驗證
4. **確認機制** - 修改資料後自動取消確認勾選，必須重新確認才能儲存
5. **儲存變更** - 先驗證表單，再檢查確認勾選，最後保存到 Google Spreadsheet
6. **重置功能** - 放棄變更，恢復到原始狀態（包括確認勾選狀態）
7. **修改偵測** - 即時偵測表單是否已被修改（confirm 欄位不計入修改判斷）
8. **離開提醒** - 未儲存時切換頁面會提醒
9. **完整驗證** - 前端驗證（格式+檢查碼）+ 後端基本驗證

### 🎨 UI/UX 特色

- 📊 **三大區域** - 學生基本資料（唯讀）、郵局帳戶資料、聯絡資料
- 💾 **狀態顯示** - 清楚顯示「已修改」或「未修改」狀態
- ⚠️ **多重提醒** - 未儲存變更時提醒、表單驗證錯誤提醒
- ✅ **即時驗證** - 表單欄位即時驗證
- 📱 **響應式設計** - 支援各種螢幕尺寸
- 💡 **使用說明** - 內建填寫說明和重要提醒

---

## 🚀 實作步驟

### 步驟 1: 準備 Google Spreadsheet

#### 1.1 建立工作表

在您的 Google Spreadsheet 中建立名為 `accounts` 的工作表。

#### 1.2 設定欄位

第一列（標題列）應包含以下欄位：

```
stunum | name | classnum | officenum | accountnum | aownername | aownerid | aownerrelation | email | cellphone | confirm | remark
```

#### 1.3 匯入初始資料

可以參考以下範例格式匯入學生基本資料：

```
stunum    name        classnum  officenum  accountnum  aownername  aownerid  aownerrelation  email            cellphone     confirm  remark
admin     系統管理員   40199                                                   本人           abc@123.com     0912345678    1
9000001   學生1       40103                                                   本人           student1@...    0912345678    1
9000002   學生2       40104                                                   父親           student2@...    0912345678    1
```

> 💡 **提示：** 學號、姓名、班級座號應預先建立，學生登入後填寫其他資料。

---

### 步驟 2: 建立 GAS 後端函數 (`gas/accounts.js`)

#### 2.1 核心函數說明

| 函數名稱                             | 功能                 | 參數                | 回傳值       |
| ------------------------------------ | -------------------- | ------------------- | ------------ |
| `getAccountByStudentNumber(stunum)`  | 根據學號取得帳戶資料 | stunum              | 帳戶資料物件 |
| `updateAccount(stunum, accountData)` | 更新帳戶資料         | stunum, accountData | 操作結果     |
| `validateAccountData(accountData)`   | 驗證資料有效性       | accountData         | 驗證結果     |
| `getRelationshipOptions()`           | 取得親屬關係選項列表 | 無                  | 選項列表     |

#### 2.2 關鍵技術要點

**1. 根據學號查詢資料：**

```javascript
function getAccountByStudentNumber(stunum) {
  // 取得所有資料
  const data = sheet.getDataRange().getValues()
  const rows = data.slice(1) // 移除標題列

  // 尋找符合學號的資料
  const targetRow = rows.find((row) => String(row[0]) === String(stunum))

  // 轉換為物件格式並返回
}
```

**2. 不允許修改學號：**

```javascript
function updateAccount(stunum, accountData) {
  // 確保學號不被修改
  if (String(accountData.stunum) !== String(stunum)) {
    return {
      code: -1,
      msg: "不允許修改學號"
    }
  }

  // 更新資料...
}
```

**3. 後端驗證（簡化版）：**

```javascript
function validateAccountData(accountData) {
  const { stunum, name } = accountData

  // 基本必填檢查
  if (!stunum || String(stunum).trim() === "") {
    return { code: -1, msg: "學號不可為空" }
  }

  if (!name || String(name).trim() === "") {
    return { code: -1, msg: "姓名不可為空" }
  }

  // 其他欄位不在後端驗證，由前端處理
  return { code: 0, msg: "驗證通過" }
}
```

> 💡 **設計理念：** 後端只做基本的必填檢查，複雜的格式和檢查碼驗證由前端處理，提供更好的使用者體驗。

**4. 身分證字號驗證：**

```javascript
// 格式：第一碼為大寫英文字母，第二碼為1或2，後面8碼為數字
if (!/^[A-Z][12]\d{8}$/.test(aownerid)) {
  return {
    code: -1,
    msg: "身分證字號格式不正確"
  }
}
```

**5. 手機號碼驗證：**

```javascript
// 台灣手機格式：09 開頭的 10 位數字
if (!/^09\d{8}$/.test(cellphone)) {
  return {
    code: -1,
    msg: "手機號碼格式不正確"
  }
}
```

---

### 步驟 3: 建立 API 層 (`src/api/accounts/index.js`)

#### 3.1 API 函數列表

```javascript
// 根據學號取得帳戶資料
export function getAccountByStudentNumber(stunum)

// 更新帳戶資料
export function updateAccount(stunum, accountData)

// 驗證資料
export function validateAccountData(accountData)

// 取得親屬關係選項
export function getRelationshipOptions()
```

#### 3.2 使用範例

```javascript
import { getAccountByStudentNumber, updateAccount, getRelationshipOptions } from "@/api/accounts"

// 取得學生帳戶資料
const account = await getAccountByStudentNumber("9000001")

// 更新資料
const result = await updateAccount("9000001", {
  stunum: "9000001",
  name: "學生1",
  classnum: "40103",
  officenum: "0001234",
  accountnum: "1234567",
  aownername: "王大明",
  aownerid: "A123456789",
  aownerrelation: "本人",
  email: "student@example.com",
  cellphone: "0912345678",
  confirm: true,
  remark: ""
})

// 取得親屬關係選項
const options = await getRelationshipOptions()
```

---

### 步驟 4: 建立 Pinia Store (`src/store/modules/accounts.js`)

#### 4.1 Store 架構

使用 Composition API 風格，包含：

- **State（狀態）**: 儲存資料和狀態
- **Computed（計算屬性）**: 衍生狀態
- **Actions（動作）**: 執行操作

#### 4.2 State 狀態

| 狀態名稱              | 類型        | 說明                             |
| --------------------- | ----------- | -------------------------------- |
| `relationshipOptions` | Array       | 親屬關係選項列表                 |
| `editingAccount`      | Object/null | 當前正在編輯的帳戶資料           |
| `originalAccount`     | Object/null | 原始的帳戶資料（用於重置和比對） |
| `loading`             | Boolean     | 載入狀態                         |
| `saving`              | Boolean     | 儲存狀態                         |
| `error`               | String/null | 錯誤訊息                         |

#### 4.3 Computed 計算屬性

| 計算屬性         | 類型    | 說明                                       |
| ---------------- | ------- | ------------------------------------------ |
| `hasAccountData` | Boolean | 是否已載入資料                             |
| `isModified`     | Boolean | 表單是否已被修改（confirm 欄位不計入比對） |
| `canSave`        | Boolean | 是否可以儲存（有資料、已修改、未在儲存中） |

> 💡 **重要：** `isModified` 不包含 `confirm` 欄位的比對，因為勾選確認不算「修改資料」。

#### 4.4 Actions 動作

| Action 名稱                  | 功能                 | 參數         | 說明                                   |
| ---------------------------- | -------------------- | ------------ | -------------------------------------- |
| `fetchRelationshipOptions()` | 載入親屬關係選項列表 | 無           | 更新 relationshipOptions               |
| `loadAccountData(stunum)`    | 載入帳戶資料         | stunum       | 更新 editingAccount 和 originalAccount |
| `saveAccount()`              | 儲存編輯的資料       | 無           | 更新後刷新 originalAccount             |
| `resetForm()`                | 重置表單             | 無           | 恢復到原始資料                         |
| `updateField(field, value)`  | 更新單一欄位         | field, value | 修改 editingAccount 的欄位             |
| `clearError()`               | 清除錯誤訊息         | 無           | -                                      |
| `resetState()`               | 重置所有狀態         | 無           | -                                      |

#### 4.5 核心邏輯：修改偵測

```javascript
// 比對可編輯欄位是否有修改
// 注意：confirm 欄位不計入修改判斷
const isModified = computed(() => {
  if (!editingAccount.value || !originalAccount.value) {
    return false
  }

  return (
    editingAccount.value.officenum !== originalAccount.value.officenum ||
    editingAccount.value.accountnum !== originalAccount.value.accountnum ||
    editingAccount.value.aownername !== originalAccount.value.aownername ||
    editingAccount.value.aownerid !== originalAccount.value.aownerid ||
    editingAccount.value.aownerrelation !== originalAccount.value.aownerrelation ||
    editingAccount.value.email !== originalAccount.value.email ||
    editingAccount.value.cellphone !== originalAccount.value.cellphone ||
    editingAccount.value.remark !== originalAccount.value.remark
    // confirm 欄位不計入，因為勾選確認不算「修改資料」
  )
})
```

> 💡 **重要差異：**
>
> 1. 只比對可編輯欄位，唯讀欄位（stunum, name, classnum）不納入比對
> 2. `confirm` 欄位特意排除，因為勾選確認不算資料修改

#### 4.6 使用範例

```javascript
import { useAccountsStore } from "@/store/modules/accounts"
import { useUserStore } from "@/store/modules/user"
import { storeToRefs } from "pinia"

// 在組件中使用
const accountsStore = useAccountsStore()
const userStore = useUserStore()

const { editingAccount, isModified, canSave } = storeToRefs(accountsStore)

// 載入親屬關係選項
await accountsStore.fetchRelationshipOptions()

// 根據登入學號載入資料
const stunum = userStore.username
await accountsStore.loadAccountData(stunum)

// 修改資料
editingAccount.value.email = "newemail@example.com"
console.log(isModified.value) // true

// 儲存變更
await accountsStore.saveAccount()
console.log(isModified.value) // false

// 重置表單
accountsStore.resetForm()
```

---

### 步驟 5: 建立 Vue 組件 (`src/views/accounts/index.vue`)

#### 5.1 組件功能

1. **頁面標題區** - 顯示功能名稱和說明
2. **學生基本資料區** - 顯示唯讀欄位（學號、姓名、班級座號）和修改狀態標籤
3. **郵局帳戶資料區** - 編輯郵局相關資料（局號、帳號、戶名等）
4. **聯絡資料區** - 編輯聯絡資料（電子郵件、手機號碼、確認核取方塊）
5. **操作按鈕區** - 儲存、重置按鈕和未儲存提醒
6. **使用說明區** - 提供填寫說明和重要提醒

#### 5.2 核心功能實作

**1. 整合 User Store 獲取學號：**

```javascript
import { useUserStore } from "@/store/modules/user"
import { useAccountsStore } from "@/store/modules/accounts"

const userStore = useUserStore()
const accountsStore = useAccountsStore()

// 載入資料時使用登入學號
const loadData = async () => {
  const stunum = userStore.username

  if (!stunum) {
    ElMessage.error("無法取得學號，請重新登入")
    return
  }

  await accountsStore.loadAccountData(stunum)
}
```

**2. 唯讀欄位顯示：**

```vue
<el-descriptions :column="3" border>
  <el-descriptions-item label="學號">
    {{ editingAccount.stunum }}
  </el-descriptions-item>
  <el-descriptions-item label="學生姓名">
    {{ editingAccount.name }}
  </el-descriptions-item>
  <el-descriptions-item label="班級座號">
    {{ editingAccount.classnum }}
  </el-descriptions-item>
</el-descriptions>
```

**3. 前端驗證函數：**

```javascript
// 驗證郵局單一 7 碼區段（局號或帳號）
// 權重：[2, 3, 4, 5, 6, 7]
// 檢查碼計算：11 - (加權總和 % 11)，若為 10 則檢查碼為 0，若為 11 則檢查碼為 1
const validatePost7 = (segment) => {
  if (!/^\d{7}$/.test(segment)) {
    return false
  }

  const digits = segment.split("").map(Number)
  const weights = [2, 3, 4, 5, 6, 7]
  let sum = 0

  for (let i = 0; i < 6; i++) {
    sum += digits[i] * weights[i]
  }

  const remainder = sum % 11
  let checkValue = 11 - remainder
  if (checkValue === 10) checkValue = 0
  if (checkValue === 11) checkValue = 1

  return digits[6] === checkValue
}

// 驗證台灣身分證字號
// 格式：1個大寫英文字母 + 1或2開頭 + 8個數字
const validateTaiwanID = (id) => {
  if (!/^[A-Z][12]\d{8}$/.test(id)) {
    return false
  }

  const letters = {
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 34,
    J: 18,
    K: 19,
    L: 20,
    M: 21,
    N: 22,
    O: 35,
    P: 23,
    Q: 24,
    R: 25,
    S: 26,
    T: 27,
    U: 28,
    V: 29,
    W: 32,
    X: 30,
    Y: 31,
    Z: 33
  }

  const code = letters[id[0]]
  const digits = [Math.floor(code / 10), code % 10].concat(id.slice(1).split("").map(Number))

  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1]
  const total = digits.reduce((sum, num, i) => sum + num * weights[i], 0)

  return total % 10 === 0
}
```

**4. 表單驗證規則（含自訂驗證器）：**

```javascript
const formRules = computed(() => ({
  officenum: [
    {
      pattern: /^\d{7}$/,
      message: "郵局局號應為7位數字",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback()
          return
        }
        if (!validatePost7(value)) {
          callback(new Error("局號檢查碼錯誤"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  accountnum: [
    {
      pattern: /^\d{7}$/,
      message: "郵局帳號應為7位數字",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback()
          return
        }
        if (!validatePost7(value)) {
          callback(new Error("帳號檢查碼錯誤"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  aownerid: [
    {
      pattern: /^[A-Z][12]\d{8}$/,
      message: "身分證字號格式不正確",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback()
          return
        }
        const upperValue = value.toUpperCase()
        if (!validateTaiwanID(upperValue)) {
          callback(new Error("身分證檢查碼錯誤"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  email: [
    {
      type: "email",
      message: "電子郵件格式不正確",
      trigger: "blur"
    }
  ],
  cellphone: [
    {
      pattern: /^09\d{8}$/,
      message: "手機號碼應為09開頭的10位數字",
      trigger: "blur"
    }
  ]
}))
```

> 💡 **重點：** 每個欄位都有兩層驗證：基本格式驗證 + 檢查碼驗證，錯誤訊息簡短明確。

**5. 確認核取方塊自動取消機制：**

```javascript
// 監聽資料變更
const isInitialLoad = ref(true) // 標記是否為初次載入

watch(
  () => [
    editingAccount.value?.officenum,
    editingAccount.value?.accountnum,
    editingAccount.value?.aownername,
    editingAccount.value?.aownerid,
    editingAccount.value?.aownerrelation,
    editingAccount.value?.email,
    editingAccount.value?.cellphone,
    editingAccount.value?.remark
  ],
  () => {
    // 初次載入時不處理
    if (isInitialLoad.value) {
      isInitialLoad.value = false
      return
    }

    // 如果目前是已確認狀態，則自動取消確認（靜默，不顯示訊息）
    if (editingAccount.value?.confirm === true) {
      editingAccount.value.confirm = false
    }
  }
)

// 儲存按鈕邏輯
const canSaveWithConfirm = computed(() => {
  return isModified.value && editingAccount.value?.confirm === true && !saving.value
})
```

> 💡 **重點：** 修改任何欄位時，如果已勾選確認，會自動取消勾選。使用者必須重新確認後才能儲存。

**6. 儲存功能（含確認檢查）：**

```javascript
const handleSave = async () => {
  // 1. 驗證所有表單
  let valid = true

  if (formRef.value) {
    await formRef.value.validate((isValid) => {
      if (!isValid) valid = false
    })
  }

  if (contactFormRef.value) {
    await contactFormRef.value.validate((isValid) => {
      if (!isValid) valid = false
    })
  }

  if (!valid) {
    ElMessage.warning("請檢查表單中的錯誤")
    return
  }

  // 2. 檢查是否已確認資料正確
  if (!editingAccount.value.confirm) {
    ElMessage.warning("請勾選「確認資料正確」後再儲存")
    return
  }

  // 3. 儲存資料
  const response = await accountsStore.saveAccount()

  if (response.code === 0) {
    ElMessage.success("儲存成功！")

    // 清除表單驗證狀態
    if (formRef.value) formRef.value.clearValidate()
    if (contactFormRef.value) contactFormRef.value.clearValidate()
  } else {
    ElMessage.error(response.msg || "儲存失敗")
  }
}
```

> 💡 **儲存流程：** 先驗證表單格式 → 再檢查確認勾選 → 最後儲存資料

**7. 重置功能（含確認狀態恢復）：**

```javascript
const handleReset = () => {
  ElMessageBox.confirm("確定要放棄所有變更，恢復到原始狀態嗎？", "確認重置", {
    type: "warning",
    confirmButtonText: "確定",
    cancelButtonText: "取消"
  })
    .then(() => {
      // 重置初次載入標記，避免 watch 觸發
      isInitialLoad.value = true

      accountsStore.resetForm()

      // 清除表單驗證狀態
      if (formRef.value) formRef.value.clearValidate()
      if (contactFormRef.value) contactFormRef.value.clearValidate()

      ElMessage.success("已恢復到原始狀態")
    })
    .catch(() => {
      // 取消操作
    })
}
```

> 💡 **重點：** 重置會恢復所有欄位到原始狀態，包括 confirm 欄位。設置 `isInitialLoad = true` 避免觸發 watch。

**8. 離開頁面前提醒：**

```javascript
import { onBeforeRouteLeave } from "vue-router"

onBeforeRouteLeave((to, from, next) => {
  if (isModified.value) {
    ElMessageBox.confirm("您有未儲存的修改，確定要離開嗎？", "確認離開", {
      type: "warning",
      confirmButtonText: "確定離開",
      cancelButtonText: "取消"
    })
      .then(() => next())
      .catch(() => next(false))
  } else {
    next()
  }
})
```

**9. 頁面刷新前提醒：**

```javascript
const handleBeforeUnload = (e) => {
  if (isModified.value) {
    e.preventDefault()
    e.returnValue = ""
  }
}

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload)
})
```

---

### 步驟 6: 更新路由配置 (`src/router/index.js`)

在 `constantRoutes` 陣列中新增 accounts 路由：

```javascript
{
  path: "/accounts",
  component: Layouts,
  redirect: "/accounts/index",
  children: [
    {
      path: "index",
      component: () => import("@/views/accounts/index.vue"),
      name: "Accounts",
      meta: {
        title: "學生帳戶資料",
        svgIcon: "component"
      }
    }
  ]
}
```

---

## 📋 與 Single Fruit 模組的差異比較

| 特性         | Single Fruit（水果編輯） | Accounts（帳戶管理）       |
| ------------ | ------------------------ | -------------------------- |
| **選擇方式** | 下拉選單選擇水果         | 自動根據登入學號載入       |
| **可否切換** | ✅ 可選擇其他水果        | ❌ 只能查看自己的資料      |
| **唯讀欄位** | ❌ 無                    | ✅ 有（學號、姓名、班級）  |
| **欄位數量** | 4 個                     | 12 個                      |
| **驗證規則** | 簡單驗證                 | 複雜驗證（檢查碼、格式等） |
| **下拉選單** | 需要取得選項列表         | 只有親屬關係為下拉選單     |
| **適用場景** | 管理員編輯任意資料       | 學生填寫自己的資料         |

---

## 📋 驗證規則說明

### 1. 郵局局號（officenum）

- **格式：** 7 位數字
- **範例：** `0001234`
- **說明：** 郵局的局號代碼
- **驗證層級：**
  - 前端：格式驗證（7位數字）+ 檢查碼驗證（validatePost7）
  - 後端：無額外驗證（前端已處理）

### 2. 郵局帳號（accountnum）

- **格式：** 7 位數字
- **範例：** `1234567`
- **驗證：** 最後一碼為檢查碼，使用 validatePost7 函數驗證
- **驗證層級：**
  - 前端：格式驗證（7位數字）+ 檢查碼驗證（validatePost7）
  - 後端：無額外驗證（前端已處理）

#### 郵局 7 碼檢查碼演算法（validatePost7）

```
權重：[2, 3, 4, 5, 6, 7]

步驟：
1. 將前6碼數字分別乘以對應權重
2. 加總所有乘積
3. 計算：11 - (總和 % 11)
4. 若計算結果為 10，則檢查碼為 0
5. 若計算結果為 11，則檢查碼為 1
6. 否則檢查碼就是計算結果
7. 驗證第7碼是否等於檢查碼
```

**範例：**

局號/帳號：`0041081`

```
計算：0×2 + 0×3 + 4×4 + 1×5 + 0×6 + 8×7
     = 0 + 0 + 16 + 5 + 0 + 56 = 77
餘數：77 % 11 = 0
檢查碼：11 - 0 = 11 → 轉為 1
驗證：第7碼 (1) 是否等於檢查碼 (1)？ ✅ 正確
```

### 3. 身分證字號（aownerid）

- **格式：** 第一碼為大寫英文字母，第二碼為 1 或 2，後面 8 碼為數字
- **範例：** `A123456789`
- **說明：** 台灣身分證格式
- **驗證層級：**
  - 前端：格式驗證 + 檢查碼驗證（validateTaiwanID）
  - 後端：無額外驗證（前端已處理）

#### 台灣身分證檢查碼演算法（validateTaiwanID）

```
步驟：
1. 將首位字母轉換為數字（A=10, B=11, ..., Z=33）
2. 將該數字拆分為十位數和個位數
3. 連接後面9碼數字，形成11位數字陣列
4. 使用權重 [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1] 計算加權總和
5. 檢查總和是否能被 10 整除
```

**範例：**

身分證：`A123456789`

```
A = 10 → 分為 1 和 0
數字陣列：[1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
權重：    [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1]
計算：1×1 + 0×9 + 1×8 + 2×7 + 3×6 + 4×5 + 5×4 + 6×3 + 7×2 + 8×1 + 9×1
     = 1 + 0 + 8 + 14 + 18 + 20 + 20 + 18 + 14 + 8 + 9 = 130
驗證：130 % 10 = 0 ✅ 正確
```

### 4. 電子郵件（email）

- **格式：** 標準電子郵件格式
- **範例：** `student@example.com`
- **驗證：** Element Plus 內建 email 驗證
- **驗證層級：**
  - 前端：格式驗證
  - 後端：無額外驗證

### 5. 手機號碼（cellphone）

- **格式：** 09 開頭的 10 位數字
- **範例：** `0912345678`
- **驗證：** 正則表達式 `/^09\d{8}$/`
- **驗證層級：**
  - 前端：格式驗證
  - 後端：無額外驗證

---

## 🎨 UI 樣式設計

### 學校色彩主題

使用學校藍色（#4169e1）作為主題色，營造專業且親切的視覺效果：

```scss
// 頁面標題卡片
.page-header {
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-left: 4px solid #4169e1; // 學校藍色強調

  .header-content {
    h2 {
      color: #2c3e50;

      .header-icon {
        color: #4169e1; // 圖示使用學校藍色
      }
    }
  }
}

// 卡片標題
.card-title {
  color: #4169e1; // 學校藍色
}
```

### 導航欄設計

```html
<!-- 使用者資訊 + 登出按鈕 -->
<div class="right-menu-item user-info">
  <el-avatar :icon="UserFilled" :size="30" />
  <span class="display-name">{{ userStore.displayName }}</span>
</div>
<el-button type="danger" plain class="logout-button" @click="logout"> 登出 </el-button>
```

**設計要點：**

- displayName 使用純文字標籤（不可點擊）
- 登出按鈕使用淺紅色（plain 樣式），簡短明確
- 按鈕直接顯示在右上角，學生容易找到

---

## 💡 驗證策略

### 前後端驗證分工

本專案採用**前端驗證優先**的策略：

| 驗證類型   | 處理位置 | 說明                                   |
| ---------- | -------- | -------------------------------------- |
| 格式驗證   | 前端     | 即時反饋，提升使用者體驗               |
| 檢查碼驗證 | 前端     | 使用 validatePost7 和 validateTaiwanID |
| 必填欄位   | 後端     | stunum 和 name 的基本檢查              |
| 資料一致性 | 後端     | 確保學號不被修改                       |

**優點：**

1. ✅ **即時反饋** - 使用者填寫時立即知道錯誤
2. ✅ **減少伺服器負擔** - 無效資料不會送到後端
3. ✅ **更好的使用者體驗** - 不需要等待後端回應才知道錯誤
4. ✅ **明確的錯誤訊息** - 「局號檢查碼錯誤」比「資料格式錯誤」更明確

### 錯誤訊息設計原則

```javascript
// ❌ 不好：訊息太長
"郵局局號檢查碼驗證失敗，請確認您輸入的局號是否正確"

// ✅ 好：簡短明確
"局號檢查碼錯誤"
```

**原則：**

- 簡短（5-10 字）
- 明確指出問題
- 告訴使用者要修正什麼
- 避免技術術語

---

## 🔒 確認機制設計

### 核心概念

確認核取方塊是為了確保使用者：

1. 已仔細檢查填寫的資料
2. 對資料的正確性負責
3. 有意識地執行儲存動作

### 自動取消勾選

```javascript
// 監聽所有可編輯欄位
watch(() => [officenum, accountnum, ...], () => {
  // 初次載入時不處理
  if (isInitialLoad.value) {
    isInitialLoad.value = false
    return
  }

  // 有修改且已勾選 → 自動取消（靜默，不顯示訊息）
  if (editingAccount.value?.confirm === true) {
    editingAccount.value.confirm = false
  }
})
```

**設計要點：**

1. **自動取消** - 任何欄位修改都會取消勾選
2. **靜默處理** - 不顯示彈窗，避免干擾使用者
3. **初次載入例外** - 載入資料時不觸發
4. **重置時恢復** - 重置會恢復確認狀態
5. **confirm 不計入 isModified** - 勾選確認不算「修改資料」

### 儲存按鈕邏輯

```javascript
// 三個條件都滿足才能儲存
const canSaveWithConfirm = computed(() => {
  return (
    isModified.value && // 有修改
    editingAccount.value?.confirm === true && // 已確認
    !saving.value
  ) // 未在儲存中
})
```

---

## 🎓 如何模仿此範例建立新功能

假設您要建立一個「家長資料」功能，工作表名稱為 `parent_info`。

### 步驟清單

1. **在 Google Spreadsheet 建立工作表**

   - 工作表名稱：`parent_info`
   - 定義欄位結構

2. **建立 GAS 後端** (`gas/parent_info.js`)

   - 複製 `gas/accounts.js`
   - 全局替換：`accounts` → `parent_info`
   - 全局替換：`Account` → `ParentInfo`
   - 全局替換：`account` → `parentInfo`
   - 修改欄位名稱和數量
   - 調整驗證規則

3. **建立 API 層** (`src/api/parent_info/index.js`)

   - 複製 `src/api/accounts/index.js`
   - 全局替換相關名稱

4. **建立 Pinia Store** (`src/store/modules/parent_info.js`)

   - 複製 `src/store/modules/accounts.js`
   - 全局替換相關名稱
   - 修改 state 欄位名稱
   - 調整 isModified 比對邏輯

5. **建立 Vue 組件** (`src/views/parent_info/index.vue`)

   - 複製 `src/views/accounts/index.vue`
   - 全局替換相關名稱
   - 修改表單欄位
   - 調整驗證規則

6. **更新路由** (`src/router/index.js`)
   - 新增 parent_info 路由配置

---

## 🔧 替換範本

使用以下表格快速替換名稱：

| 原名稱           | 新名稱（範例：parent_info） |
| ---------------- | --------------------------- |
| accounts         | parent_info                 |
| Accounts         | ParentInfo                  |
| account          | parentInfo                  |
| Account          | ParentInfo                  |
| 帳戶             | 家長資料                    |
| editingAccount   | editingParentInfo           |
| originalAccount  | originalParentInfo          |
| useAccountsStore | useParentInfoStore          |
| accountsStore    | parentInfoStore             |

---

## 🎯 關鍵技術要點總結

### 1. 整合 User Store 取得學號

```javascript
import { useUserStore } from "@/store/modules/user"

const userStore = useUserStore()
const stunum = userStore.username // 登入的學號
```

### 2. 唯讀欄位與可編輯欄位分離

```javascript
// Store 中只比對可編輯欄位
const isModified = computed(() => {
  // 不比對 stunum, name, classnum
  return (
    editingAccount.value.officenum !== originalAccount.value.officenum ||
    // ... 其他可編輯欄位
  )
})
```

### 3. 複雜驗證規則

```javascript
// 前端驗證
const formRules = {
  accountnum: [{ pattern: /^\d{7}$/, message: "格式錯誤", trigger: "blur" }]
}

// 後端驗證（含檢查碼）
function validateAccountData(accountData) {
  if (!validatePostalAccountChecksum(accountData.accountnum)) {
    return { code: -1, msg: "檢查碼驗證失敗" }
  }
}
```

### 4. 多表單驗證

```javascript
// 組件中使用多個 formRef
const formRef = ref(null) // 郵局帳戶資料表單
const contactFormRef = ref(null) // 聯絡資料表單

// 儲存時驗證所有表單
let valid = true
await formRef.value.validate((isValid) => {
  if (!isValid) valid = false
})
await contactFormRef.value.validate((isValid) => {
  if (!isValid) valid = false
})
```

### 5. 三重未儲存保護

```javascript
// 1. 離開路由時提醒
onBeforeRouteLeave((to, from, next) => {
  if (isModified.value) {
    // 提示使用者
  }
})

// 2. 頁面刷新時提醒
window.addEventListener("beforeunload", handleBeforeUnload)

// 3. 操作按鈕狀態控制
const canSave = computed(() => {
  return hasAccountData.value && isModified.value && !saving.value
})
```

---

## 🎨 UI/UX 設計要點

### 1. 分區顯示

- **基本資料區** - 唯讀欄位，使用 `el-descriptions` 顯示
- **編輯資料區** - 可編輯欄位，使用 `el-form` 編輯
- **操作區** - 儲存、重置按鈕
- **說明區** - 填寫說明和重要提醒

### 2. 狀態指示

- 使用標籤顯示「已修改」/「未修改」狀態
- 使用警告訊息提醒未儲存的變更
- 按鈕根據狀態啟用/停用

### 3. 友善提示

- 每個欄位下方提供填寫提示
- 使用時間軸顯示填寫步驟
- 提供重要提醒列表

### 4. 響應式設計

```vue
<el-row :gutter="20">
  <el-col :xs="24" :sm="12">
    <!-- 在小螢幕時占滿一列，大螢幕時占半列 -->
  </el-col>
</el-row>
```

---

## ⚠️ 注意事項

### 1. 學號管理

- 學號不可修改
- 學號必須與登入的 username 相同
- 後端會驗證學號是否一致

### 2. 資料驗證

- 前端驗證提供即時反饋
- 後端驗證確保資料安全性
- 兩層驗證確保資料正確性

### 3. 核取方塊處理

```javascript
// 在 GAS 中將 boolean 轉換為 0/1
const confirmValue = accountData.confirm ? 1 : 0

// 在讀取時將 0/1 轉換為 boolean
confirm: targetRow[10] === 1 || targetRow[10] === "1" || targetRow[10] === true
```

### 4. 表單狀態同步

- 載入資料後清除驗證狀態
- 重置表單後清除驗證狀態
- 儲存成功後清除驗證狀態

---

## 🧪 測試檢查清單

### 基本功能

- [ ] 能正常根據登入學號載入資料
- [ ] 唯讀欄位無法編輯
- [ ] 可編輯欄位可以正常修改
- [ ] 修改資料後狀態正確顯示為「已修改」
- [ ] 親屬關係下拉選單正常運作
- [ ] 響應式設計在各種螢幕尺寸下正常

### 前端驗證

- [ ] 郵局局號格式驗證（7位數字）
- [ ] 郵局局號檢查碼驗證（validatePost7）
- [ ] 郵局帳號格式驗證（7位數字）
- [ ] 郵局帳號檢查碼驗證（validatePost7）
- [ ] 身分證格式驗證（英文+1或2+8位數字）
- [ ] 身分證檢查碼驗證（validateTaiwanID）
- [ ] 電子郵件格式驗證
- [ ] 手機號碼格式驗證（09開頭10位數）
- [ ] 錯誤訊息簡短明確

### 確認機制

- [ ] 修改欄位後，confirm 自動取消勾選
- [ ] 初次載入時，confirm 不會被自動取消
- [ ] 未勾選 confirm 時無法儲存
- [ ] 勾選 confirm 後可以儲存
- [ ] 重置後 confirm 狀態恢復到原始值
- [ ] confirm 變更不會觸發「已修改」狀態

### 儲存和重置

- [ ] 表單驗證失敗時無法儲存
- [ ] confirm 未勾選時無法儲存
- [ ] 全部驗證通過且已確認才能儲存
- [ ] 儲存成功後狀態變為「未修改」
- [ ] 重置功能恢復所有欄位（包括 confirm）
- [ ] 重置後表單驗證狀態被清除

### 離開保護

- [ ] 離開頁面時會提醒未儲存的變更
- [ ] 頁面刷新時會提醒未儲存的變更
- [ ] 無修改時可以直接離開

### UI/UX

- [ ] 頁面標題有淡藍色漸層背景
- [ ] 頁面標題左側有藍色邊條
- [ ] 卡片標題使用學校藍色
- [ ] 登出按鈕明顯且易於找到
- [ ] 顯示使用者名稱（不可點擊）
- [ ] 提示訊息「請勾選確認後再儲存變更」正確顯示

---

## 📞 常見問題

### Q1: 為什麼不使用下拉選單選擇學生？

**A:** 基於安全性和隱私考量，學生只能查看和編輯自己的資料，不應該能夠選擇其他學生的資料。系統會根據登入的學號自動載入對應的資料。

### Q2: 如果學生找不到自己的資料怎麼辦？

**A:** 請確保：

1. Google Spreadsheet 中已建立該學生的資料列
2. 學號（stunum）與登入的 username 完全相同
3. 若仍無法載入，請聯絡系統管理員檢查資料

### Q3: 郵局帳號檢查碼驗證失敗怎麼辦？

**A:**

1. 請仔細核對郵局存簿上的帳號
2. 確認輸入的是完整的 7 位數字
3. 若確認無誤但仍驗證失敗，可能是存簿號碼有誤，請洽郵局確認

### Q4: 為什麼有些欄位是唯讀的？

**A:** 學號、姓名、班級座號等基本資料應由系統管理員統一管理，學生不應自行修改。這些資料通常來自學校的學籍系統。

### Q5: 如何新增更多欄位？

**A:** 修改以下地方：

1. Google Spreadsheet 工作表（新增欄位）
2. GAS 中的資料轉換邏輯（調整 getRange 和 index）
3. Store 中的 isModified 比對邏輯（新增欄位比對）
4. Vue 組件中的表單欄位（新增表單項目）
5. 驗證規則（如有需要）

### Q6: 能否讓管理員編輯所有學生的資料？

**A:** 可以，但需要修改 Vue 組件：

1. 新增下拉選單選擇學生（類似 Single Fruit 模組）
2. 根據使用者角色顯示/隱藏下拉選單
3. 管理員可選擇任意學生，一般學生只能看到自己的資料

---

## 📚 相關檔案

- `gas/accounts.js` - GAS 後端函數
- `src/api/accounts/index.js` - API 層
- `src/store/modules/accounts.js` - Pinia Store
- `src/views/accounts/index.vue` - Vue 組件
- `src/router/index.js` - 路由配置
- `src/store/modules/user.js` - User Store（用於取得登入學號）
- `src/utils/gas-service.js` - GAS 服務工具

---

## 🆚 何時使用不同的模組？

### 使用 Fruits（列表 CRUD）當：

- 需要一次查看多筆資料
- 經常需要新增/刪除資料
- 需要批次操作
- 使用者是管理員

### 使用 Single Fruit（下拉選單編輯）當：

- 需要從多筆資料中選擇一筆編輯
- 不需要新增/刪除功能
- 強調編輯體驗
- 使用者可以選擇任意資料

### 使用 Accounts（學號綁定編輯）當：

- 使用者只能編輯自己的資料
- 資料與使用者身分綁定
- 需要高安全性和隱私保護
- 如：學生填寫個人資料、帳戶管理、個人設定

---

## 📝 版本記錄

- **v1.1.0** (2024-10-12)

  - 🎨 新增學校色彩主題（藍色 #4169e1）
  - ✨ 實作前端檢查碼驗證（validatePost7, validateTaiwanID）
  - 🔒 新增確認核取方塊自動取消機制
  - 💬 優化錯誤訊息（簡短明確）
  - 🎯 改進登出按鈕 UI（直接顯示在右上角）
  - 🧹 簡化後端驗證（只保留基本必填檢查）
  - 📐 修正郵局局號為 7 位數（原為 3-4 位）
  - ⚙️ confirm 欄位不計入 isModified 判斷
  - 🔄 重置功能包含 confirm 狀態恢復
  - 📱 優化導航欄設計（displayName + 登出按鈕）

- **v1.0.0** (2024-10-12)
  - 初始版本
  - 完整帳戶資料管理功能
  - 整合 User Store 自動載入資料
  - 唯讀與可編輯欄位分離
  - 基礎驗證規則
  - 修改偵測與重置功能
  - 未儲存變更保護（路由、刷新、操作）
  - 包含詳細說明文件

---

## 👨‍💻 作者

此範例由 AI 助手建立，供學習和參考使用。

## 📄 授權

MIT License

---

**祝您開發順利！🎉**
