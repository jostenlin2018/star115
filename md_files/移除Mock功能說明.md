# 移除 Mock 功能說明

## 📋 變更內容

已成功移除專案中的 Mock 功能，改為 **直接部署到 GAS 測試** 的開發方式。

## ✅ 已完成的修改

### 1. 程式碼修改

#### `src/utils/gas-service.js`

- ❌ 移除 `isInGasEnvironment()` 函數
- ❌ 移除 `getMockResponse()` 函數
- ❌ 移除所有 Mock 資料定義
- ✅ 簡化 `callGasFunction()` 函數，直接呼叫 GAS

**修改前：**

```javascript
// 檢查環境，返回 Mock 或呼叫 GAS
if (!isInGasEnvironment()) {
  resolve(getMockResponse(functionName, ...args))
  return
}
```

**修改後：**

```javascript
// 直接呼叫 GAS
google.script.run
  .withSuccessHandler(...)
  .withFailureHandler(...)
  [functionName](...args)
```

### 2. 文件更新

#### `README.md`

- ✅ 更新開發流程說明
- ✅ 強調使用 `pnpm run deploy:gas` 部署測試
- ✅ 說明清除快取的重要性

#### `專案重構說明.md`

- ✅ 移除 Mock 相關說明
- ✅ 更新開發流程步驟
- ✅ 新增除錯技巧說明
- ✅ 更新常見問題解答

#### `快速開始.md`

- ✅ 移除本地開發伺服器說明
- ✅ 更新為直接部署流程
- ✅ 新增開發技巧和除錯指南

## 🚀 新的開發流程

### 標準開發步驟

1. **修改程式碼**

   - 編輯 Vue 組件、API 或 GAS 函數

2. **部署到 GAS**

   ```bash
   pnpm run deploy:gas
   ```

3. **瀏覽器測試**

   - 開啟測試部署網址（`.../dev`）
   - 清除快取（Ctrl+Shift+R）
   - 測試最新功能

4. **除錯和修正**

   - 前端：使用瀏覽器開發者工具
   - 後端：使用 GAS 編輯器的 Logger.log()

5. **重複步驟 1-4** 直到功能完成

6. **建立正式版本**
   - 確認功能正確無誤
   - 建立新的部署版本
   - 使用正式部署網址（`.../exec`）

### 重要提示

⚠️ **不再使用以下指令：**

- ~~`pnpm dev`~~ （本地開發伺服器）
- ~~Mock 資料~~ （開發環境模擬）

✅ **改用：**

- `pnpm run deploy:gas` （每次修改後部署）
- 實際 GAS 環境測試

## 🔧 優點

### 1. 真實環境測試

- 直接在 GAS 環境中測試
- 使用 `.../dev` 測試網址進行開發測試
- 使用 `.../exec` 正式網址提供給使用者
- 確保功能在實際環境中正常運作

### 2. 簡化架構

- 移除 Mock 相關程式碼
- 減少條件判斷邏輯
- 程式碼更簡潔易讀

### 3. 一致性

- 開發和部署使用相同環境
- 減少環境切換的困擾
- 降低除錯難度

## 💡 開發技巧

### 快速清除快取

**Windows/Linux:**

```
Ctrl + Shift + R
```

**Mac:**

```
Cmd + Shift + R
```

**或在開發者工具中：**

1. 開啟開發者工具（F12）
2. 在網路標籤中勾選「停用快取」
3. 保持開發者工具開啟

### 提高部署效率

1. **批次修改**

   - 一次修改多個相關檔案
   - 統一部署測試
   - 減少部署次數

2. **使用終端機監控**

   - 保持終端機開啟
   - 隨時執行 `pnpm run deploy:gas`
   - 快速看到部署結果

3. **版本控制**
   - 使用 Git 提交穩定版本
   - 方便回溯和比對
   - 避免遺失工作進度

### 除錯流程

#### 前端錯誤

1. 開啟瀏覽器開發者工具（F12）
2. 查看 Console 標籤
3. 檢查錯誤訊息和堆疊追蹤
4. 使用 Network 標籤查看 API 呼叫

#### 後端錯誤

1. 開啟 GAS 編輯器
2. 使用 `Logger.log()` 記錄變數值
3. 查看執行記錄
4. 檢查函數回傳值

#### API 通訊錯誤

1. 確認 GAS 函數名稱正確
2. 檢查參數傳遞格式
3. 驗證回應格式 `{ code, data, message }`
4. 查看 `withFailureHandler` 的錯誤訊息

## 📦 部署檢查清單

部署前確認：

- [ ] 所有檔案已儲存
- [ ] 沒有語法錯誤
- [ ] GAS 函數已創建
- [ ] API 呼叫參數正確

部署後確認：

- [ ] 部署成功完成
- [ ] 瀏覽器已清除快取
- [ ] 先在測試網址（`.../dev`）測試
- [ ] 功能正常運作
- [ ] 確認無誤後建立正式版本（`.../exec`）

## 🎯 範例：完整開發流程

### 情境：新增一個「取得用戶列表」功能

1. **創建 GAS 函數**

   ```javascript
   // gas/user-list.js
   function getUserList() {
     try {
       const users = [
         /* ... */
       ]
       return { code: 0, data: users, message: "成功" }
     } catch (error) {
       Logger.log("錯誤: " + error)
       return { code: 1, data: null, message: error.message }
     }
   }
   ```

2. **創建 API**

   ```javascript
   // src/api/user/index.js
   import { callGasFunction } from "@/utils/gas-service"

   export function getUserList() {
     return callGasFunction("getUserList")
   }
   ```

3. **創建組件**

   ```vue
   <!-- src/views/user-list/index.vue -->
   <script setup>
   import { ref, onMounted } from "vue"
   import { getUserList } from "@/api/user"

   const users = ref([])

   onMounted(async () => {
     const res = await getUserList()
     if (res.code === 0) {
       users.value = res.data
     }
   })
   </script>
   ```

4. **部署測試**

   ```bash
   pnpm run deploy:gas
   ```

5. **瀏覽器測試**

   - 開啟測試部署網址（`.../dev`）
   - 按 Ctrl+Shift+R 清除快取
   - 檢查用戶列表是否正確顯示

6. **如有問題**

   - 開啟開發者工具查看錯誤
   - 開啟 GAS 編輯器查看日誌
   - 修正問題後重新部署並測試

7. **建立正式版本**
   - 確認所有功能正常運作
   - 建立新的部署版本
   - 使用正式網址（`.../exec`）提供給使用者

## 📚 相關文件

- [README.md](./README.md) - 專案介紹
- [專案重構說明.md](./專案重構說明.md) - 詳細開發指南
- [快速開始.md](./快速開始.md) - 快速入門
- [GAS\_部署說明.md](./GAS_部署說明.md) - 部署指南

## ❓ 常見問題

### Q: 為什麼不用本地開發伺服器？

A: 因為 GAS 的 `google.script.run` API 只能在 GAS 環境中運作，本地開發無法真實測試功能。直接部署到 GAS 可以在真實環境中開發和測試。

### Q: 每次都要部署會不會很慢？

A: `pnpm run deploy:gas` 指令已經優化，通常在 10-30 秒內完成。批次修改可以減少部署次數。開發時使用 `.../dev` 測試網址，確認無誤後再建立 `.../exec` 正式版本。

### Q: 如何加快測試速度？

A:

1. 保持瀏覽器和終端機開啟
2. 使用 `.../dev` 測試網址進行開發
3. 使用快捷鍵清除快取
4. 一次修改多個檔案再部署
5. 使用 GAS 編輯器直接測試函數
6. 只在確認無誤後才建立正式版本

### Q: 如果部署失敗怎麼辦？

A:

1. 檢查終端機的錯誤訊息
2. 確認 clasp 配置正確
3. 確認網路連線正常
4. 重新執行 `clasp login` 授權

### Q: .../dev 和 .../exec 有什麼差別？

A:

- `.../dev` 是測試部署網址，用於開發測試，每次 `clasp push` 都會更新
- `.../exec` 是正式部署網址，需要手動建立新版本，提供給實際使用者
- 開發時使用 `.../dev`，確認無誤後建立 `.../exec` 版本

---

**總結：** 移除 Mock 功能後，開發流程更加簡潔和真實。使用 `.../dev` 測試網址進行開發，確認無誤後建立 `.../exec` 正式版本，確保了在實際環境中測試，減少了環境差異問題。
