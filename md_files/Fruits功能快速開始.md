# 🚀 Fruits 功能快速開始指南

## 📦 已建立的檔案

本次已為您建立以下完整的檔案：

```
✅ gas/fruits.js                    # GAS 後端（5個函數：增刪改查）
✅ src/api/fruits/index.js          # API 層（5個 API）
✅ src/store/modules/fruits.js      # Pinia Store（狀態管理）
✅ src/views/fruits/index.vue       # Vue 前端頁面
✅ src/router/index.js              # 路由配置（已更新）
✅ Fruits功能說明文件.md            # 詳細說明文件
```

---

## 🎯 立即使用步驟

### 1️⃣ 確認 Google Spreadsheet 設定

請確認您的 Google Spreadsheet 中已有 `fruits` 工作表，格式如下：

```
| id | fruit_name | numbers | descript      |
|----|------------|---------|---------------|
| 1  | 蘋果       | 5       | 小寶的最愛    |
| 2  | 香蕉       | 7       |               |
| 3  | 鳳梨       | 1       | 大樹的名產    |
```

> 💡 如果沒有此工作表，系統會自動建立！

---

### 2️⃣ 部署 GAS 後端

執行以下指令將新的 GAS 函數部署到 Google Apps Script：

```powershell
# 方法一：使用專案提供的部署腳本
.\gas.ps1

# 方法二：使用 clasp 指令
clasp push
```

---

### 3️⃣ 啟動前端開發伺服器

```powershell
# 安裝依賴（如果尚未安裝）
pnpm install

# 啟動開發伺服器
pnpm dev
```

---

### 4️⃣ 存取水果管理頁面

開啟瀏覽器，訪問以下網址：

```
http://localhost:你的埠號/fruits
```

或在應用程式中點擊左側選單的「水果管理」。

---

## 🎨 功能特色

### ✨ 完整 CRUD 操作

- ✅ 新增水果資料
- ✅ 編輯水果資料
- ✅ 刪除水果資料
- ✅ 查看所有水果

### 🎯 智慧功能

- 自動檢查 ID 重複
- 表單驗證（必填欄位）
- 操作成功/失敗訊息提示
- 載入狀態顯示
- 數量標籤顏色區分（綠/黃/紅）

### 📱 響應式設計

- 支援電腦、平板、手機螢幕
- 現代化 UI 設計
- 流暢的使用者體驗

---

## 🔍 功能測試

### 測試 1: 新增水果

1. 點擊「新增水果」按鈕
2. 填寫表單資料
3. 點擊「確定」
4. 檢查是否成功新增到表格中

### 測試 2: 編輯水果

1. 點擊表格中的「編輯」按鈕
2. 修改資料
3. 點擊「確定」
4. 檢查資料是否更新

### 測試 3: 刪除水果

1. 點擊表格中的「刪除」按鈕
2. 確認刪除
3. 檢查資料是否從表格中移除

---

## 📂 檔案功能說明

### 🖥️ 後端層 (`gas/fruits.js`)

提供 5 個主要函數：

```javascript
getAllFruits() // 取得所有水果
getFruitById(id) // 取得單一水果
addFruit(fruitData) // 新增水果
updateFruit(id, fruitData) // 更新水果
deleteFruit(id) // 刪除水果
```

### 🌐 API 層 (`src/api/fruits/index.js`)

封裝 API 呼叫，使用方式：

```javascript
import { getAllFruits, addFruit } from "@/api/fruits"

// 取得資料
const response = await getAllFruits()

// 新增資料
const result = await addFruit({
  id: "6",
  fruit_name: "芒果",
  numbers: 3,
  descript: "好吃"
})
```

### 📦 狀態管理 (`src/store/modules/fruits.js`)

Pinia Store，提供：

**狀態（State）：**

- `fruitsList` - 所有水果列表
- `currentFruit` - 當前選中的水果
- `loading` - 載入狀態
- `error` - 錯誤訊息

**動作（Actions）：**

- `fetchAllFruits()` - 取得所有水果
- `createFruit(data)` - 新增水果
- `modifyFruit(id, data)` - 更新水果
- `removeFruit(id)` - 刪除水果

### 🎨 前端頁面 (`src/views/fruits/index.vue`)

完整的 Vue 3 組件，包含：

- 資料表格顯示
- 新增/編輯對話框
- 刪除確認對話框
- 表單驗證
- 載入狀態

---

## 🔄 如何擴充新功能

### 範例：新增「書籍管理」功能

只需要 6 個步驟：

1. **建立 Google Spreadsheet 工作表** `books`
2. **複製並修改** `gas/fruits.js` → `gas/books.js`
3. **複製並修改** `src/api/fruits/` → `src/api/books/`
4. **複製並修改** `src/store/modules/fruits.js` → `src/store/modules/books.js`
5. **複製並修改** `src/views/fruits/` → `src/views/books/`
6. **在路由中新增** books 路由配置

> 詳細步驟請參考 `Fruits功能說明文件.md`

---

## 🎓 程式碼架構

```
使用者操作
    ↓
Vue 組件 (index.vue)
    ↓
Pinia Store (fruits.js)
    ↓
API 層 (api/fruits/index.js)
    ↓
GAS 服務 (utils/gas-service.js)
    ↓
GAS 後端 (gas/fruits.js)
    ↓
Google Spreadsheet
```

---

## 💡 開發小技巧

### 1. 除錯 GAS 函數

在 GAS 編輯器中使用 `Logger.log()` 來除錯：

```javascript
function getAllFruits() {
  Logger.log("開始取得水果資料")
  const sheet = getFruitsSheet()
  Logger.log("工作表名稱: " + sheet.getName())
  // ...
}
```

### 2. 除錯前端

使用瀏覽器開發者工具：

```javascript
console.log("水果列表:", fruitsList.value)
console.log("載入狀態:", loading.value)
```

### 3. 查看 Store 狀態

安裝 Vue DevTools 擴充套件，即可查看 Pinia Store 的狀態變化。

---

## ⚠️ 常見問題

### Q: 為什麼資料沒有載入？

**A:** 請檢查：

1. GAS 是否已正確部署（執行 `clasp push`）
2. Google Spreadsheet 是否有 `fruits` 工作表
3. 瀏覽器 Console 是否有錯誤訊息

### Q: 新增資料時出現「ID 已存在」錯誤？

**A:** 請使用不同的 ID，系統會自動檢查 ID 重複。

### Q: 編輯資料後沒有變化？

**A:** 請檢查網路連線，並確認 GAS 部署正確。

---

## 📚 進階學習

想要深入了解？請閱讀：

1. **Fruits功能說明文件.md** - 完整的技術文件
2. **專案程式碼** - 閱讀實際程式碼註解
3. **Google Apps Script 文件** - https://developers.google.com/apps-script
4. **Vue 3 官方文件** - https://vuejs.org/
5. **Pinia 文件** - https://pinia.vuejs.org/

---

## 🎉 完成！

恭喜您！現在您已經擁有一個完整可用的 Fruits 水果管理功能。

您可以：

- ✅ 直接使用此功能管理水果資料
- ✅ 參考此範例建立其他 CRUD 功能
- ✅ 根據需求客製化修改

**祝您開發順利！** 🚀
