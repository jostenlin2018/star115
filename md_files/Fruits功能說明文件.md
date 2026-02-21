# Fruits 水果管理功能說明文件

## 📖 概述

本文件說明如何建立一個完整的 Google Apps Script (GAS) + Vue 3 的 CRUD 功能模組。以 **Fruits（水果管理）** 為範例，展示從後端到前端的完整實作流程。

---

## 🗂️ 檔案結構

```
vue3-gas/
├── gas/
│   └── fruits.js                          # GAS 後端函數
├── src/
│   ├── api/
│   │   └── fruits/
│   │       └── index.js                   # API 層
│   ├── store/
│   │   └── modules/
│   │       └── fruits.js                  # Pinia Store
│   ├── views/
│   │   └── fruits/
│   │       └── index.vue                  # Vue 組件頁面
│   └── router/
│       └── index.js                       # 路由配置（需更新）
└── Fruits功能說明文件.md                  # 本說明文件
```

---

## 🚀 實作步驟

### 步驟 1: 建立 Google Spreadsheet 工作表

在您的 Google Spreadsheet 中建立一個名為 `fruits` 的工作表，並設定以下欄位：

| 欄位名稱   | 說明                  | 範例             |
| ---------- | --------------------- | ---------------- |
| id         | 水果 ID（唯一識別碼） | 1, 2, 3...       |
| fruit_name | 水果名稱              | 蘋果、香蕉、鳳梨 |
| numbers    | 數量                  | 5, 7, 1...       |
| descript   | 描述                  | 小寶的最愛       |

**範例資料：**

```
id	fruit_name	numbers	descript
1	蘋果	5	小寶的最愛
2	香蕉	7
3	鳳梨	1	大樹的名產
4	草莓	2
5	西瓜	9
```

---

### 步驟 2: 建立 GAS 後端函數 (`gas/fruits.js`)

#### 2.1 核心功能說明

GAS 後端負責直接操作 Google Spreadsheet，提供以下 5 個主要函數：

| 函數名稱                     | 功能             | 參數                | 回傳值           |
| ---------------------------- | ---------------- | ------------------- | ---------------- |
| `getAllFruits()`             | 取得所有水果資料 | 無                  | 所有水果資料陣列 |
| `getFruitById(id)`           | 取得單一水果資料 | id: 水果 ID         | 單一水果物件     |
| `addFruit(fruitData)`        | 新增水果資料     | fruitData: 水果物件 | 操作結果         |
| `updateFruit(id, fruitData)` | 更新水果資料     | id, fruitData       | 操作結果         |
| `deleteFruit(id)`            | 刪除水果資料     | id: 水果 ID         | 操作結果         |

#### 2.2 回傳格式

所有函數統一使用以下格式回傳：

```javascript
{
  code: 0,           // 0: 成功, 1: 失敗
  data: {...},       // 資料內容
  message: "成功"    // 訊息
}
```

#### 2.3 關鍵技術要點

**1. 工作表自動建立：**

```javascript
function getFruitsSheet() {
  const spreadsheet = getActiveSpreadsheet()
  const sheetName = "fruits"
  let sheet = spreadsheet.getSheetByName(sheetName)

  // 如果工作表不存在，自動創建
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName)
    sheet.getRange(1, 1, 1, 4).setValues([["id", "fruit_name", "numbers", "descript"]])
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold")
  }
  return sheet
}
```

**2. 資料讀取與轉換：**

```javascript
// 取得資料（排除標題列）
const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues()

// 轉換為物件陣列
const fruits = data.map((row, index) => ({
  rowIndex: index + 2, // 實際列數
  id: row[0] || "",
  fruit_name: row[1] || "",
  numbers: row[2] || 0,
  descript: row[3] || ""
}))
```

**3. ID 重複檢查：**

```javascript
// 檢查 ID 是否已存在
const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
const existingId = ids.some((row) => String(row[0]) === String(fruitData.id))
if (existingId) {
  return { code: 1, data: null, message: "ID 已存在" }
}
```

---

### 步驟 3: 建立 API 層 (`src/api/fruits/index.js`)

#### 3.1 功能說明

API 層作為前端與 GAS 後端的橋樑，使用 `callGasFunction` 函數呼叫 GAS 函數。

#### 3.2 API 函數列表

```javascript
// 取得所有水果
export function getAllFruits()

// 取得單一水果
export function getFruitById(id)

// 新增水果
export function addFruit(fruitData)

// 更新水果
export function updateFruit(id, fruitData)

// 刪除水果
export function deleteFruit(id)
```

#### 3.3 使用範例

```javascript
import { getAllFruits, addFruit } from "@/api/fruits"

// 取得所有水果
const response = await getAllFruits()
console.log(response.data)

// 新增水果
const newFruit = {
  id: "6",
  fruit_name: "芒果",
  numbers: 3,
  descript: "夏天的味道"
}
const result = await addFruit(newFruit)
```

---

### 步驟 4: 建立 Pinia Store (`src/store/modules/fruits.js`)

#### 4.1 Store 架構

Pinia Store 使用 Composition API 風格，包含：

- **State（狀態）**: 儲存資料
- **Actions（動作）**: 執行操作

#### 4.2 State 狀態

| 狀態名稱       | 類型        | 說明             |
| -------------- | ----------- | ---------------- |
| `fruitsList`   | Array       | 所有水果資料列表 |
| `currentFruit` | Object/null | 當前選中的水果   |
| `loading`      | Boolean     | 載入狀態         |
| `error`        | String/null | 錯誤訊息         |

#### 4.3 Actions 動作

| Action 名稱                  | 功能         | 參數          | 說明               |
| ---------------------------- | ------------ | ------------- | ------------------ |
| `fetchAllFruits()`           | 取得所有水果 | 無            | 更新 fruitsList    |
| `fetchFruitById(id)`         | 取得單一水果 | id            | 更新 currentFruit  |
| `createFruit(fruitData)`     | 新增水果     | fruitData     | 新增後重新載入列表 |
| `modifyFruit(id, fruitData)` | 更新水果     | id, fruitData | 更新後重新載入列表 |
| `removeFruit(id)`            | 刪除水果     | id            | 刪除後重新載入列表 |
| `setCurrentFruit(fruit)`     | 設定當前水果 | fruit         | 手動設定           |
| `clearCurrentFruit()`        | 清除當前水果 | 無            | 清空選擇           |
| `clearError()`               | 清除錯誤訊息 | 無            | -                  |
| `resetState()`               | 重置所有狀態 | 無            | -                  |

#### 4.4 使用範例

```javascript
import { useFruitsStore } from "@/store/modules/fruits"
import { storeToRefs } from "pinia"

// 在組件中使用
const fruitsStore = useFruitsStore()
const { fruitsList, loading } = storeToRefs(fruitsStore)

// 取得資料
await fruitsStore.fetchAllFruits()

// 新增資料
const newFruit = {
  id: "7",
  fruit_name: "水蜜桃",
  numbers: 4,
  descript: "甜美多汁"
}
await fruitsStore.createFruit(newFruit)

// 更新資料
await fruitsStore.modifyFruit("1", {
  id: "1",
  fruit_name: "蘋果",
  numbers: 10,
  descript: "更新後的描述"
})

// 刪除資料
await fruitsStore.removeFruit("2")
```

---

### 步驟 5: 建立 Vue 組件 (`src/views/fruits/index.vue`)

#### 5.1 組件功能

- 顯示水果資料表格
- 新增水果（對話框表單）
- 編輯水果（對話框表單）
- 刪除水果（確認對話框）
- 資料載入狀態顯示
- 表單驗證

#### 5.2 核心功能實作

**1. 資料載入：**

```javascript
const loadData = async () => {
  try {
    await fruitsStore.fetchAllFruits()
    ElMessage.success("載入成功")
  } catch (error) {
    ElMessage.error("載入失敗：" + error.message)
  }
}
```

**2. 新增資料：**

```javascript
const handleAdd = () => {
  dialogTitle.value = "新增水果"
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}
```

**3. 編輯資料：**

```javascript
const handleEdit = (row) => {
  dialogTitle.value = "編輯水果"
  isEditMode.value = true
  originalId.value = row.id // 保存原始 ID
  formData.value = { ...row }
  dialogVisible.value = true
}
```

**4. 刪除資料：**

```javascript
const handleDelete = (row) => {
  ElMessageBox.confirm(`確定要刪除「${row.fruit_name}」嗎？`, "警告", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    const response = await fruitsStore.removeFruit(row.id)
    if (response.code === 0) {
      ElMessage.success("刪除成功")
    }
  })
}
```

**5. 表單提交：**

```javascript
const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    const submitData = {
      id: formData.value.id,
      fruit_name: formData.value.fruit_name,
      numbers: Number(formData.value.numbers),
      descript: formData.value.descript
    }

    if (isEditMode.value) {
      // 編輯模式：使用原始 ID 更新
      await fruitsStore.modifyFruit(originalId.value, submitData)
    } else {
      // 新增模式
      await fruitsStore.createFruit(submitData)
    }

    dialogVisible.value = false
  })
}
```

#### 5.3 UI 特色

- **數量標籤顏色**：根據庫存量顯示不同顏色

  - 綠色：數量 > 5
  - 橙色：0 < 數量 ≤ 5
  - 紅色：數量 = 0

- **表單驗證**：ID、名稱、數量為必填欄位

- **響應式設計**：支援手機、平板、電腦螢幕

---

### 步驟 6: 更新路由配置 (`src/router/index.js`)

在 `constantRoutes` 陣列中新增 fruits 路由：

```javascript
{
  path: "/fruits",
  component: Layouts,
  redirect: "/fruits/index",
  children: [
    {
      path: "index",
      component: () => import("@/views/fruits/index.vue"),
      name: "Fruits",
      meta: {
        title: "水果管理",
        svgIcon: "component"
      }
    }
  ]
}
```

---

## 📋 如何模仿此範例建立新功能

假設您要建立一個「書籍管理」功能，工作表名稱為 `books`，包含 `book_id`, `title`, `author`, `price` 欄位。

### 步驟清單

1. **在 Google Spreadsheet 建立工作表**

   - 工作表名稱：`books`
   - 欄位：`book_id`, `title`, `author`, `price`

2. **建立 GAS 後端** (`gas/books.js`)

   - 複製 `gas/fruits.js`
   - 全局替換：`fruits` → `books`
   - 全局替換：`Fruit` → `Book`
   - 全局替換：`fruit` → `book`
   - 修改欄位名稱和數量（改為 4 欄）

3. **建立 API 層** (`src/api/books/index.js`)

   - 複製 `src/api/fruits/index.js`
   - 全局替換：`Fruit` → `Book`
   - 全局替換：`fruit` → `book`

4. **建立 Pinia Store** (`src/store/modules/books.js`)

   - 複製 `src/store/modules/fruits.js`
   - 全局替換：`fruits` → `books`
   - 全局替換：`Fruit` → `Book`
   - 全局替換：`fruit` → `book`
   - 修改 state 欄位名稱（如 `booksList`, `currentBook`）

5. **建立 Vue 組件** (`src/views/books/index.vue`)

   - 複製 `src/views/fruits/index.vue`
   - 全局替換相關名稱
   - 修改表單欄位（改為 book_id, title, author, price）
   - 修改表格欄位顯示

6. **更新路由** (`src/router/index.js`)
   - 新增 books 路由配置

---

## 🔧 替換範本

使用以下表格快速替換名稱：

| 原名稱         | 新名稱（範例：books） |
| -------------- | --------------------- |
| fruits         | books                 |
| Fruits         | Books                 |
| Fruit          | Book                  |
| fruit          | book                  |
| 水果           | 書籍                  |
| fruitsList     | booksList             |
| currentFruit   | currentBook           |
| getAllFruits   | getAllBooks           |
| getFruitById   | getBookById           |
| addFruit       | addBook               |
| updateFruit    | updateBook            |
| deleteFruit    | deleteBook            |
| useFruitsStore | useBooksStore         |

---

## 🎯 關鍵技術要點總結

### 1. GAS 後端層

- 使用 `SpreadsheetApp` 操作試算表
- 統一錯誤處理格式
- ID 重複檢查機制
- 資料型別轉換（String 轉 Number）

### 2. API 層

- 使用 `callGasFunction` 呼叫 GAS 函數
- 簡潔的函數封裝
- Promise 風格的非同步操作

### 3. Pinia Store 層

- Composition API 風格
- State 狀態管理
- Actions 封裝業務邏輯
- 自動重新載入機制

### 4. Vue 組件層

- 表單驗證
- 對話框控制
- 載入狀態顯示
- 錯誤處理與訊息提示

---

## ⚠️ 注意事項

1. **ID 管理**

   - GAS 中所有 ID 比對都使用 `String()` 轉換，避免型別不匹配
   - 編輯時保存 `originalId`，防止 ID 變更時找不到資料

2. **資料載入時機**

   - 新增、更新、刪除後自動重新載入列表
   - 頁面載入時（onMounted）自動載入資料

3. **錯誤處理**

   - 每個 try-catch 區塊都有對應的錯誤訊息
   - 使用 ElMessage 顯示操作結果

4. **表單重置**

   - 對話框關閉時自動重置表單
   - 避免資料殘留

5. **GAS 部署**
   - 修改 GAS 檔案後需要重新部署
   - 使用 `clasp push` 推送變更

---

## 🧪 測試檢查清單

- [ ] 能正常載入所有資料
- [ ] 能成功新增資料
- [ ] 能成功編輯資料
- [ ] 能成功刪除資料
- [ ] 表單驗證正常運作
- [ ] 載入狀態正確顯示
- [ ] 錯誤訊息正確顯示
- [ ] ID 重複檢查有效
- [ ] 對話框正常開關
- [ ] 響應式設計正常

---

## 📞 常見問題

### Q1: 如何處理更多欄位？

修改 GAS 中的 `getRange(row, col, numRows, numCols)` 參數，並在資料轉換時增加對應欄位。

### Q2: 如何新增搜尋功能？

在 Vue 組件中新增 `searchQuery` ref，使用 `computed` 過濾 `tableData`。

### Q3: 如何新增分頁功能？

可以整合 Element Plus 的 `el-pagination` 組件，或使用 VXE Table。

### Q4: 如何處理大量資料？

- 在 GAS 端實作分頁查詢
- 使用虛擬滾動表格
- 實作懶加載機制

---

## 📚 相關檔案

- `gas/fruits.js` - GAS 後端函數
- `src/api/fruits/index.js` - API 層
- `src/store/modules/fruits.js` - Pinia Store
- `src/views/fruits/index.vue` - Vue 組件
- `src/router/index.js` - 路由配置
- `src/utils/gas-service.js` - GAS 服務工具

---

## 📝 版本記錄

- **v1.0.0** (2024-10-11)
  - 初始版本
  - 完整 CRUD 功能
  - 包含詳細說明文件

---

## 👨‍💻 作者

此範例由 AI 助手建立，供學習和參考使用。

## 📄 授權

MIT License

---

**祝您開發順利！🎉**
