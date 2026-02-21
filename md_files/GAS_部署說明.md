# Google Apps Script 部署說明

## 📋 前置準備

### 1. Google Spreadsheet 設定

在您的 Google Spreadsheet 中建立**工作表1**，包含以下欄位：

| A欄          | B欄          | C欄             | D欄       | E欄        |
| ------------ | ------------ | --------------- | --------- | ---------- |
| **username** | **password** | **displayName** | **roles** | **status** |
| admin        | 12345678     | 系統管理員      | admin     | active     |
| editor       | 12345678     | 編輯者          | editor    | active     |
| viewer       | 12345678     | 訪客            | viewer    | active     |

### 2. GAS 腳本設定

確認 `gas/程式碼.js` 中的試算表連接方式：

```javascript
function getSpreadsheet() {
  // 如果 GAS 專案綁定在試算表上（推薦）
  return SpreadsheetApp.getActiveSpreadsheet()

  // 或使用試算表 ID
  // var spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE';
  // return SpreadsheetApp.openById(spreadsheetId);
}
```

## 🚀 部署步驟

### 方式 1：使用 clasp 命令列工具（推薦）

1. **安裝 clasp**（如果還沒安裝）

```bash
npm install -g @google/clasp
```

2. **登入 Google 帳號**

```bash
clasp login
```

3. **建置專案**

```bash
npm run build:prod
```

4. **推送到 GAS**

```bash
clasp push
```

5. **部署為網頁應用程式**

```bash
clasp deploy
```

或在 GAS 編輯器中手動部署：

- 開啟 [Google Apps Script](https://script.google.com)
- 點選「部署」→「新增部署」
- 選擇「網頁應用程式」
- 存取權限設為「任何人」
- 點選「部署」

### 方式 2：手動複製（簡單但較麻煩）

1. **建置專案**

```bash
npm run build:prod
```

2. **開啟 Google Apps Script 編輯器**

   - 在試算表中：擴充功能 → Apps Script

3. **建立檔案並複製內容**

   - `程式碼.gs` ← 複製 `gas/程式碼.js` 的內容
   - `index.html` ← 複製 `gas/index.html` 的內容
   - `css.html` ← 複製 `gas/css.html` 的內容
   - `js.html` ← 複製 `gas/js.html` 的內容

4. **部署為網頁應用程式**
   - 點選「部署」→「新增部署」
   - 選擇「網頁應用程式」
   - 存取權限設為「任何人」
   - 點選「部署」

## 🧪 測試

### 在 GAS 編輯器中測試

1. **測試讀取使用者資料**

   - 執行函數：`testLoadUsers()`
   - 查看日誌：應該顯示載入的使用者數量

2. **測試登入功能**
   - 執行函數：`testLogin()`
   - 查看日誌：應該顯示登入成功的訊息

### 在網頁中測試

1. **取得網頁網址**

   - 部署後會獲得一個網址（例如：`https://script.google.com/macros/s/xxx/exec`）

2. **開啟網頁**

   - 使用試算表中設定的帳號密碼登入
   - 預設帳號：admin / 12345678

3. **檢查瀏覽器控制台**
   - 應該看到「使用 GAS 模式登入」的訊息
   - 如果登入成功，會顯示「登入成功」

## 🔍 除錯

### 問題 1：找不到工作表

**錯誤訊息**：`找不到工作表`

**解決方式**：

- 確認工作表名稱是「工作表1」
- 或修改 `gas/程式碼.js` 中的工作表名稱
- 確認 GAS 專案有權限存取試算表

### 問題 2：登入失敗

**檢查事項**：

1. 試算表資料格式正確
2. status 欄位是「active」
3. 帳號密碼正確
4. 查看 GAS 執行日誌（執行階段 → 日誌）

### 問題 3：顯示模擬數據

**原因**：不在 GAS 環境中（在本機開發環境）

**解決方式**：

- 這是正常的，開發環境會自動使用模擬數據
- 部署到 GAS 後會自動切換為正式資料

## 📝 開發測試

如果要在本機開發環境測試：

1. **啟動開發伺服器**

```bash
npm run dev
```

2. **會自動使用模擬數據**
   - 帳號：admin（任何帳號都可以）
   - 密碼：任何密碼都可以
   - 會顯示「開發模擬」訊息

## 🔐 安全性建議

1. **試算表權限**

   - 只給管理員編輯權限
   - 不要公開分享試算表

2. **密碼加密**（進階）

   - 目前密碼是明文存儲
   - 建議實作密碼加密功能

3. **Token 管理**（進階）
   - 定期清理過期的 session
   - 實作 token 過期機制

## 📚 相關檔案

- `gas/程式碼.js` - GAS 後端程式碼
- `src/utils/gas-service.js` - 前端 GAS 通訊工具
- `src/api/login/index.js` - 登入 API（自動切換模式）
- `.env.development` - 開發環境設定
- `.env.production` - 生產環境設定

## 💡 注意事項

1. **自動模式切換**

   - 程式會自動偵測是否在 GAS 環境中
   - 在 GAS 中：使用 `google.script.run` 呼叫後端
   - 在本機：使用模擬數據

2. **修改帳號資料**

   - 直接在試算表中修改即可
   - 不需要重新部署
   - 立即生效

3. **新增帳號**
   - 在試算表中新增一列
   - status 設為 「active」
   - 立即可用

需要協助或有問題，請查看 GAS 執行日誌或聯繫開發者。
