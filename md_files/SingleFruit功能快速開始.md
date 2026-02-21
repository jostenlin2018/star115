# 🚀 Single Fruit 單一水果編輯功能快速開始

## 📦 已建立的檔案

本次已為您建立以下完整的檔案：

```
✅ gas/single_fruit.js                      # GAS 後端（4個函數）
✅ src/api/single_fruit/index.js            # API 層（4個 API）
✅ src/store/modules/single_fruit.js        # Pinia Store（狀態管理）
✅ src/views/single_fruit/index.vue         # Vue 前端頁面
✅ src/router/index.js                      # 路由配置（已更新）
✅ SingleFruit功能說明文件.md               # 詳細說明文件
```

---

## 🎯 功能概述

這是一個**專注於單一資料編輯**的模組，與傳統列表 CRUD 不同：

### 🆚 主要差異

| 特性     | Fruits（列表 CRUD） | Single Fruit（單一編輯） |
| -------- | ------------------- | ------------------------ |
| 顯示方式 | 表格列表            | 下拉選單 + 表單          |
| 新增     | ✅                  | ❌                       |
| 刪除     | ✅                  | ❌                       |
| 編輯     | ✅                  | ✅                       |
| 修改偵測 | ❌                  | ✅                       |
| 重置功能 | ❌                  | ✅                       |
| 離開提醒 | ❌                  | ✅                       |

### ✨ 核心功能

1. 📋 **下拉選單** - 從列表中選擇水果
2. 📝 **編輯表單** - 修改水果資料
3. 💾 **儲存變更** - 保存到 Google Spreadsheet
4. 🔄 **重置功能** - 放棄變更，恢復原始狀態
5. 🔍 **修改偵測** - 即時顯示「已修改」或「未修改」
6. ⚠️ **離開提醒** - 未儲存時切換頁面會提醒

---

## 🎯 立即使用步驟

### 1️⃣ 確認資料來源

此模組使用與 `fruits` 相同的 Google Spreadsheet 工作表。

**工作表名稱：** `fruits`

> 💡 確保您的 Google Spreadsheet 中已有 `fruits` 工作表並包含資料

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

### 4️⃣ 存取單一水果編輯頁面

開啟瀏覽器，訪問以下網址：

```
http://localhost:你的埠號/single-fruit
```

或在應用程式中點擊左側選單的「單一水果編輯」。

---

## 🎮 使用流程

### 步驟 1: 選擇水果

從頁面上方的下拉選單中選擇要編輯的水果。

> 💡 下拉選單支援搜尋功能，可以輸入關鍵字快速找到想要的水果

### 步驟 2: 編輯資料

在表單中修改水果的資料：

- **ID** - 水果編號（可修改，但會檢查重複）
- **名稱** - 水果名稱
- **數量** - 庫存數量
- **描述** - 說明文字

### 步驟 3: 儲存變更

- 修改資料後，狀態標籤會顯示「已修改」
- 點擊「儲存變更」按鈕保存到 Google Spreadsheet
- 儲存成功後，狀態會變為「未修改」

### 額外功能

- **重置按鈕** - 放棄所有變更，恢復到原始狀態
- **取消編輯** - 清除當前選擇

---

## 🎨 介面說明

### 1. 選擇水果卡片

- 下拉選單選擇水果
- 顯示「清除選擇」按鈕（選擇後）
- 空狀態提示

### 2. 編輯表單卡片

- 顯示「已修改」或「未修改」標籤
- 四個表單欄位（ID、名稱、數量、描述）
- 三個操作按鈕（儲存、重置、取消）
- 未儲存提醒訊息

### 3. 使用說明卡片

- 步驟說明
- 功能特色列表

---

## 🔍 功能測試

### 測試 1: 選擇和載入

1. 開啟頁面
2. 從下拉選單選擇一個水果（例如：1 - 蘋果）
3. 檢查表單是否正確載入資料

### 測試 2: 編輯和儲存

1. 修改水果名稱或數量
2. 觀察狀態標籤變為「已修改」
3. 點擊「儲存變更」
4. 檢查是否成功儲存並變為「未修改」

### 測試 3: 重置功能

1. 修改某些資料
2. 點擊「重置」按鈕
3. 確認資料恢復到原始狀態

### 測試 4: 切換提醒

1. 修改資料但不儲存
2. 嘗試從下拉選單選擇另一個水果
3. 確認出現「未儲存變更」的提醒對話框

### 測試 5: 離開提醒

1. 修改資料但不儲存
2. 嘗試切換到其他頁面
3. 確認出現「確定要離開」的提醒對話框

---

## 📂 檔案功能說明

### 🖥️ 後端層 (`gas/single_fruit.js`)

提供 4 個主要函數：

```javascript
getFruitOptionsForSelect() // 取得水果選項列表
getSingleFruitForEdit(id) // 取得單一水果資料
updateSingleFruit(originalId, data) // 更新水果資料
validateSingleFruitData(data) // 驗證資料有效性
```

**關鍵特性：**

- 使用 `originalId` 定位要更新的資料列
- 即使 ID 被修改，也能正確更新
- 自動檢查 ID 重複（排除自己）

### 🌐 API 層 (`src/api/single_fruit/index.js`)

封裝 API 呼叫，使用方式：

```javascript
import { getFruitOptionsForSelect, getSingleFruitForEdit, updateSingleFruit } from "@/api/single_fruit"

// 取得選項
const options = await getFruitOptionsForSelect()

// 載入資料
const fruit = await getSingleFruitForEdit("1")

// 更新資料
const result = await updateSingleFruit("1", fruitData)
```

### 📦 狀態管理 (`src/store/modules/single_fruit.js`)

**核心狀態：**

- `fruitOptions` - 下拉選單選項
- `editingFruit` - 當前編輯的資料
- `originalFruit` - 原始資料（用於重置和比對）
- `isModified` - 是否已修改（計算屬性）

**核心動作：**

- `fetchFruitOptions()` - 載入選項列表
- `loadFruitForEdit(id)` - 載入水果資料
- `saveFruit()` - 儲存變更
- `resetForm()` - 重置表單

### 🎨 前端頁面 (`src/views/single_fruit/index.vue`)

**核心功能：**

- 下拉選單選擇（支援搜尋）
- 表單編輯（含驗證）
- 狀態顯示（已修改/未修改）
- 三種保護機制（切換、清除、離開）

---

## 🔄 與 Fruits 模組的配合使用

### 建議工作流程

1. **Fruits 模組** - 用於批次管理
   - 查看所有水果列表
   - 新增新水果
   - 刪除不需要的水果
2. **Single Fruit 模組** - 用於精細編輯
   - 選擇特定水果
   - 仔細修改資料
   - 確保不會誤操作

### 實際應用場景

**場景 1：新增並編輯**

1. 在 Fruits 模組新增水果
2. 切換到 Single Fruit 模組精細編輯

**場景 2：批次查看，單一修改**

1. 在 Fruits 模組查看所有資料
2. 發現需要修改的水果
3. 切換到 Single Fruit 模組進行編輯

**場景 3：重要資料修改**

1. 使用 Single Fruit 模組
2. 利用修改偵測和重置功能
3. 確保資料正確後才儲存

---

## 💡 開發小技巧

### 1. 除錯 Store 狀態

使用 Vue DevTools 查看 Store 狀態：

```javascript
// 在瀏覽器 Console 中
console.log(singleFruitStore.editingFruit)
console.log(singleFruitStore.isModified)
```

### 2. 測試修改偵測

```javascript
// 修改資料
editingFruit.value.fruit_name = "測試"

// 檢查狀態
console.log(isModified.value) // true

// 重置
singleFruitStore.resetForm()

// 再次檢查
console.log(isModified.value) // false
```

### 3. 客製化下拉選單

修改 `gas/single_fruit.js` 中的 `label` 格式：

```javascript
label: `${row[0]} - ${row[1]} (庫存: ${row[2]}個)`
// 顯示：1 - 蘋果 (庫存: 5個)
```

---

## ⚠️ 常見問題

### Q: 為什麼沒有新增和刪除功能？

**A:** 這個模組專注於**單一資料的編輯體驗**。如果需要新增或刪除，請使用 Fruits 模組。

### Q: 修改 ID 後會發生什麼？

**A:**

- 系統會檢查新 ID 是否重複
- 如果沒問題，會更新資料並重新載入選項列表
- `selectedFruitId` 會自動更新為新 ID

### Q: 如果不小心修改了資料，如何復原？

**A:** 點擊「重置」按鈕即可恢復到載入時的原始狀態。

### Q: 切換水果時提示未儲存，但我確定要切換怎麼辦？

**A:** 在確認對話框中點擊「確定」，系統會放棄當前變更並載入新選擇的水果。

### Q: 能否同時編輯多個水果？

**A:** 不行，這個模組設計為**一次只編輯一個水果**，確保資料一致性和操作安全性。

---

## 🎓 進階學習

### 想要深入了解？

1. **閱讀詳細文件** - `SingleFruit功能說明文件.md`
2. **研究程式碼** - 查看各檔案中的註解
3. **對比差異** - 比較 Fruits 和 Single Fruit 的實作差異
4. **自己實作** - 參考文件建立類似的模組

### 學習重點

- 🎯 雙狀態模式（original + editing）
- 🔍 修改偵測機制
- ⚠️ 未儲存變更保護
- 🎨 使用者體驗設計

---

## 📚 相關資源

- **Fruits功能說明文件.md** - 列表 CRUD 範例
- **SingleFruit功能說明文件.md** - 本模組詳細技術文件
- **Vue 3 文件** - https://vuejs.org/
- **Pinia 文件** - https://pinia.vuejs.org/
- **Element Plus 文件** - https://element-plus.org/

---

## 🎉 完成！

恭喜您！現在您已經擁有兩種不同風格的資料管理模組：

1. ✅ **Fruits** - 列表式 CRUD（適合批次管理）
2. ✅ **Single Fruit** - 單一編輯（適合精細操作）

您可以：

- ✅ 根據不同需求選擇合適的模組
- ✅ 參考這兩個範例建立其他功能
- ✅ 學習不同的 UI/UX 設計模式

**祝您開發順利！** 🚀
