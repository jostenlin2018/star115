# Single Fruit 單一水果編輯功能說明文件

## 📖 概述

本文件說明如何建立一個**專注於單一資料編輯**的功能模組。與傳統的 CRUD 列表不同，此模組使用**下拉選單**選擇資料，然後進行**編輯和儲存**，不包含新增和刪除功能。

這種設計模式特別適合：

- 配置檔案編輯
- 個人資料設定
- 單一記錄修改
- 需要專注於某一筆資料的場景

---

## 🗂️ 檔案結構

```
vue3-gas/
├── gas/
│   └── single_fruit.js                       # GAS 後端函數
├── src/
│   ├── api/
│   │   └── single_fruit/
│   │       └── index.js                      # API 層
│   ├── store/
│   │   └── modules/
│   │       └── single_fruit.js               # Pinia Store
│   ├── views/
│   │   └── single_fruit/
│   │       └── index.vue                     # Vue 組件頁面
│   └── router/
│       └── index.js                          # 路由配置（已更新）
└── SingleFruit功能說明文件.md                # 本說明文件
```

---

## 🎯 功能特色

### ✨ 核心功能

1. **下拉選單選擇** - 從列表中選擇要編輯的水果
2. **資料載入** - 自動載入選中水果的完整資料
3. **即時編輯** - 在表單中修改資料
4. **儲存變更** - 將修改保存到 Google Spreadsheet
5. **重置功能** - 放棄變更，恢復到原始狀態
6. **修改偵測** - 即時偵測表單是否已被修改
7. **離開提醒** - 未儲存時切換頁面會提醒

### 🎨 UI/UX 特色

- 🔍 下拉選單支援搜尋和篩選
- 💾 清楚顯示「已修改」或「未修改」狀態
- ⚠️ 切換水果時自動提醒未儲存的變更
- ✅ 表單驗證確保資料正確性
- 🎯 專注單一資料的編輯體驗
- 📱 響應式設計，支援各種螢幕尺寸

---

## 🚀 實作步驟

### 步驟 1: 確認資料來源

此模組使用與 `fruits` 模組相同的 Google Spreadsheet 工作表。

**工作表名稱：** `fruits`

**欄位結構：**

```
| id | fruit_name | numbers | descript |
```

> 💡 此模組只讀取和更新現有資料，不會新增或刪除資料。

---

### 步驟 2: 建立 GAS 後端函數 (`gas/single_fruit.js`)

#### 2.1 核心函數說明

| 函數名稱                                   | 功能             | 參數                  | 回傳值         |
| ------------------------------------------ | ---------------- | --------------------- | -------------- |
| `getFruitOptionsForSelect()`               | 取得水果選項列表 | 無                    | 簡化的水果列表 |
| `getSingleFruitForEdit(id)`                | 取得單一水果資料 | id                    | 完整水果物件   |
| `updateSingleFruit(originalId, fruitData)` | 更新水果資料     | originalId, fruitData | 操作結果       |
| `validateSingleFruitData(fruitData)`       | 驗證資料有效性   | fruitData             | 驗證結果       |

#### 2.2 關鍵技術要點

**1. 下拉選單選項格式化：**

```javascript
// 返回格式化的選項，方便前端使用
const options = data.map((row) => ({
  id: row[0] || "",
  fruit_name: row[1] || "",
  label: `${row[0]} - ${row[1]}` // 組合顯示：「1 - 蘋果」
}))
```

**2. 使用原始 ID 定位資料：**

```javascript
// 更新時使用 originalId 定位資料列
// 這樣即使 ID 被修改，也能正確更新
function updateSingleFruit(originalId, fruitData) {
  // 先用 originalId 找到要更新的列
  // 再將新資料（包括可能修改的 ID）寫入
}
```

**3. ID 重複檢查（排除自己）：**

```javascript
// 如果修改 ID，需要檢查新 ID 是否與其他資料重複
const existingId = ids.some((row, index) => {
  // 排除當前行，檢查其他行是否有重複 ID
  return index + 2 !== targetRow && String(row[0]) === String(fruitData.id)
})
```

---

### 步驟 3: 建立 API 層 (`src/api/single_fruit/index.js`)

#### 3.1 API 函數列表

```javascript
// 取得下拉選單選項
export function getFruitOptionsForSelect()

// 取得單一水果資料（用於編輯）
export function getSingleFruitForEdit(id)

// 更新水果資料
export function updateSingleFruit(originalId, fruitData)

// 驗證資料
export function validateSingleFruitData(fruitData)
```

#### 3.2 使用範例

```javascript
import { getFruitOptionsForSelect, getSingleFruitForEdit, updateSingleFruit } from "@/api/single_fruit"

// 取得選項列表
const options = await getFruitOptionsForSelect()

// 載入單一水果資料
const fruit = await getSingleFruitForEdit("1")

// 更新水果資料
const result = await updateSingleFruit("1", {
  id: "1",
  fruit_name: "大蘋果",
  numbers: 10,
  descript: "更新後的描述"
})
```

---

### 步驟 4: 建立 Pinia Store (`src/store/modules/single_fruit.js`)

#### 4.1 Store 架構

使用 Composition API 風格，包含：

- **State（狀態）**: 儲存資料和狀態
- **Computed（計算屬性）**: 衍生狀態
- **Actions（動作）**: 執行操作

#### 4.2 State 狀態

| 狀態名稱          | 類型        | 說明                         |
| ----------------- | ----------- | ---------------------------- |
| `fruitOptions`    | Array       | 水果選項列表（用於下拉選單） |
| `selectedFruitId` | String/null | 當前選中的水果 ID            |
| `editingFruit`    | Object/null | 當前正在編輯的水果資料       |
| `originalFruit`   | Object/null | 原始的水果資料（用於重置）   |
| `loading`         | Boolean     | 載入狀態                     |
| `saving`          | Boolean     | 儲存狀態                     |
| `error`           | String/null | 錯誤訊息                     |

#### 4.3 Computed 計算屬性

| 計算屬性           | 類型    | 說明             |
| ------------------ | ------- | ---------------- |
| `isModified`       | Boolean | 表單是否已被修改 |
| `hasSelectedFruit` | Boolean | 是否有選中的水果 |
| `canSave`          | Boolean | 是否可以儲存     |

#### 4.4 Actions 動作

| Action 名稱                 | 功能             | 參數         | 說明                               |
| --------------------------- | ---------------- | ------------ | ---------------------------------- |
| `fetchFruitOptions()`       | 取得水果選項列表 | 無           | 更新 fruitOptions                  |
| `loadFruitForEdit(id)`      | 載入水果資料     | id           | 更新 editingFruit 和 originalFruit |
| `saveFruit()`               | 儲存編輯的資料   | 無           | 更新後刷新 originalFruit           |
| `resetForm()`               | 重置表單         | 無           | 恢復到原始資料                     |
| `updateField(field, value)` | 更新單一欄位     | field, value | 修改 editingFruit 的欄位           |
| `clearSelection()`          | 清除選擇         | 無           | 清空所有選擇狀態                   |
| `clearError()`              | 清除錯誤訊息     | 無           | -                                  |
| `resetState()`              | 重置所有狀態     | 無           | -                                  |

#### 4.5 核心邏輯：修改偵測

```javascript
// 比對當前編輯資料與原始資料
const isModified = computed(() => {
  if (!editingFruit.value || !originalFruit.value) return false

  return (
    editingFruit.value.id !== originalFruit.value.id ||
    editingFruit.value.fruit_name !== originalFruit.value.fruit_name ||
    editingFruit.value.numbers !== originalFruit.value.numbers ||
    editingFruit.value.descript !== originalFruit.value.descript
  )
})
```

#### 4.6 核心邏輯：儲存後更新原始資料

```javascript
const saveFruit = async () => {
  // 儲存資料...

  if (response.code === 0) {
    // 更新成功後，將當前編輯資料設為新的原始資料
    originalFruit.value = { ...editingFruit.value }
    // 這樣 isModified 會自動變為 false
  }
}
```

#### 4.7 使用範例

```javascript
import { useSingleFruitStore } from "@/store/modules/single_fruit"
import { storeToRefs } from "pinia"

// 在組件中使用
const singleFruitStore = useSingleFruitStore()
const { editingFruit, isModified, canSave } = storeToRefs(singleFruitStore)

// 載入選項列表
await singleFruitStore.fetchFruitOptions()

// 選擇並載入水果
await singleFruitStore.loadFruitForEdit("1")

// 修改資料
editingFruit.value.fruit_name = "大蘋果"
console.log(isModified.value) // true

// 儲存變更
await singleFruitStore.saveFruit()
console.log(isModified.value) // false

// 重置表單
singleFruitStore.resetForm()
```

---

### 步驟 5: 建立 Vue 組件 (`src/views/single_fruit/index.vue`)

#### 5.1 組件功能

1. **選擇區域** - 下拉選單選擇水果
2. **編輯區域** - 表單編輯水果資料
3. **狀態顯示** - 顯示「已修改」或「未修改」
4. **操作按鈕** - 儲存、重置、取消
5. **使用說明** - 提供操作指引

#### 5.2 核心功能實作

**1. 下拉選單變更處理：**

```javascript
const handleFruitChange = async (fruitId) => {
  // 如果有未儲存的修改，詢問使用者
  if (isModified.value) {
    await ElMessageBox.confirm("您有未儲存的修改，切換水果將會遺失這些變更。確定要繼續嗎？")
  }

  // 載入選中的水果資料
  await singleFruitStore.loadFruitForEdit(fruitId)
}
```

**2. 儲存功能：**

```javascript
const handleSave = async () => {
  // 先驗證表單
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    // 儲存資料
    const response = await singleFruitStore.saveFruit()
    if (response.code === 0) {
      ElMessage.success("儲存成功！")
    }
  })
}
```

**3. 重置功能：**

```javascript
const handleReset = () => {
  ElMessageBox.confirm("確定要放棄所有變更，恢復到原始狀態嗎？").then(() => {
    singleFruitStore.resetForm()
    ElMessage.success("已恢復到原始狀態")
  })
}
```

**4. 離開頁面前提醒：**

```javascript
import { onBeforeRouteLeave } from "vue-router"

onBeforeRouteLeave((to, from, next) => {
  if (isModified.value) {
    ElMessageBox.confirm("您有未儲存的修改，確定要離開嗎？")
      .then(() => next())
      .catch(() => next(false))
  } else {
    next()
  }
})
```

#### 5.3 UI 元件說明

**1. 下拉選單選項格式：**

```vue
<el-option v-for="option in fruitOptions" :key="option.id" :label="option.label" :value="option.id">
  <div class="option-item">
    <span class="option-id">{{ option.id }}</span>
    <span class="option-name">{{ option.fruit_name }}</span>
  </div>
</el-option>
```

**2. 修改狀態標籤：**

```vue
<el-tag v-if="isModified" type="warning" effect="dark">
  已修改
</el-tag>
<el-tag v-else type="success" effect="plain">
  未修改
</el-tag>
```

**3. 儲存按鈕狀態：**

```vue
<el-button type="primary" @click="handleSave" :loading="saving" :disabled="!canSave">
  {{ saving ? "儲存中..." : "儲存變更" }}
</el-button>
```

---

### 步驟 6: 更新路由配置 (`src/router/index.js`)

在 `constantRoutes` 陣列中新增 single-fruit 路由：

```javascript
{
  path: "/single-fruit",
  component: Layouts,
  redirect: "/single-fruit/index",
  children: [
    {
      path: "index",
      component: () => import("@/views/single_fruit/index.vue"),
      name: "SingleFruit",
      meta: {
        title: "單一水果編輯",
        svgIcon: "component"
      }
    }
  ]
}
```

---

## 📋 與 Fruits 模組的差異比較

| 特性         | Fruits（列表 CRUD） | Single Fruit（單一編輯） |
| ------------ | ------------------- | ------------------------ |
| **顯示方式** | 表格列表            | 下拉選單 + 表單          |
| **新增功能** | ✅ 有               | ❌ 無                    |
| **刪除功能** | ✅ 有               | ❌ 無                    |
| **編輯功能** | ✅ 有（對話框）     | ✅ 有（頁面表單）        |
| **查看功能** | ✅ 有（表格）       | ✅ 有（選擇後載入）      |
| **修改偵測** | ❌ 無               | ✅ 有                    |
| **重置功能** | ❌ 無               | ✅ 有                    |
| **離開提醒** | ❌ 無               | ✅ 有                    |
| **適用場景** | 管理多筆資料        | 專注編輯單一資料         |

---

## 📋 如何模仿此範例建立新功能

假設您要建立一個「個人設定」功能，工作表名稱為 `user_settings`，包含 `setting_id`, `setting_name`, `setting_value`, `description` 欄位。

### 步驟清單

1. **在 Google Spreadsheet 建立工作表**

   - 工作表名稱：`user_settings`
   - 欄位：`setting_id`, `setting_name`, `setting_value`, `description`

2. **建立 GAS 後端** (`gas/user_settings.js`)

   - 複製 `gas/single_fruit.js`
   - 全局替換：`single_fruit` → `user_settings`
   - 全局替換：`SingleFruit` → `UserSettings`
   - 全局替換：`Fruit` → `Setting`
   - 全局替換：`fruit` → `setting`
   - 修改欄位名稱和數量

3. **建立 API 層** (`src/api/user_settings/index.js`)

   - 複製 `src/api/single_fruit/index.js`
   - 全局替換相關名稱

4. **建立 Pinia Store** (`src/store/modules/user_settings.js`)

   - 複製 `src/store/modules/single_fruit.js`
   - 全局替換相關名稱
   - 修改 state 欄位名稱

5. **建立 Vue 組件** (`src/views/user_settings/index.vue`)

   - 複製 `src/views/single_fruit/index.vue`
   - 全局替換相關名稱
   - 修改表單欄位

6. **更新路由** (`src/router/index.js`)
   - 新增 user_settings 路由配置

---

## 🔧 替換範本

使用以下表格快速替換名稱：

| 原名稱              | 新名稱（範例：user_settings） |
| ------------------- | ----------------------------- |
| single_fruit        | user_settings                 |
| SingleFruit         | UserSettings                  |
| single-fruit        | user-settings                 |
| Fruit               | Setting                       |
| fruit               | setting                       |
| 水果                | 設定                          |
| fruitOptions        | settingOptions                |
| editingFruit        | editingSetting                |
| originalFruit       | originalSetting               |
| selectedFruitId     | selectedSettingId             |
| useSingleFruitStore | useUserSettingsStore          |

---

## 🎯 關鍵技術要點總結

### 1. 雙資料狀態模式

```javascript
// 原始資料（用於比對和重置）
const originalFruit = ref(null)

// 編輯中的資料（會被修改）
const editingFruit = ref(null)

// 修改偵測
const isModified = computed(() => {
  return editingFruit !== originalFruit
})
```

### 2. 使用原始 ID 定位更新

```javascript
// 即使 ID 被修改，仍然能正確更新
function updateSingleFruit(originalId, fruitData) {
  // 使用 originalId 找到列
  // 用 fruitData（包括新 ID）更新
}
```

### 3. 未儲存變更的全方位保護

- 切換水果時提醒
- 清除選擇時提醒
- 離開頁面時提醒（onBeforeRouteLeave）

### 4. 智慧按鈕狀態

```javascript
const canSave = computed(() => {
  return hasSelectedFruit && isModified && !saving
})
```

---

## 🎨 UI/UX 設計要點

### 1. 清楚的狀態指示

- 使用標籤顯示「已修改」狀態
- 使用警告訊息提醒未儲存的變更
- 按鈕根據狀態啟用/停用

### 2. 友善的操作流程

1. 選擇水果（下拉選單）
2. 編輯資料（表單）
3. 儲存變更（按鈕）

### 3. 防止資料遺失

- 切換前詢問
- 離開前提醒
- 重置前確認

---

## ⚠️ 注意事項

### 1. ID 管理

- 允許修改 ID，但需檢查重複
- 使用 `originalId` 定位要更新的資料列
- 儲存成功後更新 `selectedFruitId`

### 2. 表單狀態同步

- 載入資料後清除驗證狀態
- 重置表單後清除驗證狀態

### 3. 選項列表更新

- 如果 ID 被修改，需重新載入選項列表
- 確保下拉選單顯示最新資料

### 4. Store 狀態管理

- 儲存成功後，將編輯資料設為新的原始資料
- 這樣 `isModified` 會自動變為 `false`

---

## 🧪 測試檢查清單

- [ ] 能正常載入水果選項列表
- [ ] 能成功選擇並載入單一水果資料
- [ ] 修改資料後狀態正確顯示為「已修改」
- [ ] 能成功儲存變更
- [ ] 儲存後狀態變為「未修改」
- [ ] 重置功能正常運作
- [ ] 切換水果時會提醒未儲存的變更
- [ ] 離開頁面時會提醒未儲存的變更
- [ ] 表單驗證正常運作
- [ ] 修改 ID 時會檢查重複
- [ ] 響應式設計正常

---

## 📞 常見問題

### Q1: 為什麼需要 originalFruit 和 editingFruit 兩個狀態？

**A:**

- `originalFruit` 保存原始資料，用於：
  - 比對是否有修改（`isModified`）
  - 重置表單時恢復原始資料
- `editingFruit` 是可以被修改的資料，用於：
  - v-model 綁定表單
  - 提交儲存時使用

### Q2: 如何處理 ID 被修改的情況？

**A:** 使用兩個 ID：

- `originalId` - 用於定位要更新的資料列
- `fruitData.id` - 新的 ID 值
- GAS 函數會先用 `originalId` 找到列，再寫入新資料

### Q3: 如何新增更多欄位？

**A:** 修改以下地方：

1. GAS 中的 `getRange` 參數（欄位數量）
2. GAS 中的資料轉換邏輯
3. Store 中的 `isModified` 比對邏輯
4. Vue 組件中的表單欄位

### Q4: 如何客製化下拉選單顯示格式？

**A:** 修改 GAS 中的 `label` 欄位：

```javascript
label: `${row[0]} - ${row[1]} (數量: ${row[2]})`
```

---

## 📚 相關檔案

- `gas/single_fruit.js` - GAS 後端函數
- `src/api/single_fruit/index.js` - API 層
- `src/store/modules/single_fruit.js` - Pinia Store
- `src/views/single_fruit/index.vue` - Vue 組件
- `src/router/index.js` - 路由配置
- `src/utils/gas-service.js` - GAS 服務工具

---

## 🆚 何時使用列表 CRUD vs 單一編輯？

### 使用列表 CRUD（如 Fruits）當：

- 需要一次查看多筆資料
- 經常需要新增/刪除資料
- 需要批次操作
- 資料量大，需要搜尋和分頁

### 使用單一編輯（如 Single Fruit）當：

- 專注於修改單一資料
- 不需要新增/刪除功能
- 需要防止資料遺失（未儲存提醒）
- 強調編輯體驗和資料完整性
- 如：個人設定、配置檔案、單一記錄管理

---

## 📝 版本記錄

- **v1.0.0** (2024-10-11)
  - 初始版本
  - 完整單一編輯功能
  - 修改偵測與重置
  - 未儲存變更保護
  - 包含詳細說明文件

---

## 👨‍💻 作者

此範例由 AI 助手建立，供學習和參考使用。

## 📄 授權

MIT License

---

**祝您開發順利！🎉**
