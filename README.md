<div align="center">
  <img alt="V3 Admin Vite Logo" width="120" height="120" src="./src/assets/layouts/logo.png">
  <h1>Vue3 + Google Apps Script 管理系統</h1>
</div>

## ⚡ 簡介

基於 Vue3 + Google Apps Script 的簡化版管理系統，專注於 GAS 後端整合。

> 📖 **重要：** 請查看 [專案重構說明.md](./專案重構說明.md) 了解重構內容和新模組開發流程。

## 📚 文件

- [專案重構說明](./專案重構說明.md) - 重構內容和新模組開發流程
- [GAS 部署說明](./GAS_部署說明.md) - Google Apps Script 部署指南
- 原始專案文件：[V3 Admin Vite](https://juejin.cn/post/7089377403717287972)

## ✨ 重構特點

- **極簡架構**：只保留登入、Dashboard 和必要功能
- **純 GAS 後端**：移除 axios，僅使用 Google Apps Script
- **Spreadsheet 範例**：完整的 Google 試算表 CRUD 操作範例
- **易於擴展**：清晰的模組結構，方便快速新增功能
- **直接部署測試**：每次修改後部署到 GAS 進行測試，真實環境開發

## 🛠️ 技術棧

- **Vue3**：採用 Vue3 + script setup 組合式 API
- **Element Plus**：UI 組件庫
- **Pinia**：狀態管理
- **Vite**：構建工具
- **Vue Router**：路由管理
- **Google Apps Script**：後端服務（替代傳統後端）
- **PNPM**：套件管理工具
- **Scss**：CSS 預處理器
- **ESlint + Prettier**：程式碼品質控制
- **UnoCSS**：原子化 CSS 引擎

## 🎯 核心功能

- **用戶管理**：GAS 登入/登出系統
- **Dashboard**：可自訂的首頁
- **試算表管理**：Google Spreadsheet CRUD 完整範例
  - 讀取試算表資料
  - 新增/編輯/刪除資料列
  - 切換工作表
  - 自動創建工作表
- **錯誤頁面**：403、404
- **佈局系統**：側邊欄、導航列、標籤頁
- **主題切換**：支援多種主題模式
- **響應式設計**：支援桌面和移動裝置

## 🚀 快速開始

### 環境需求

- Node.js 18.x 或 20+
- pnpm 8.x 或最新版
- Google Apps Script 帳號
- clasp（Google Apps Script CLI）

### 開發流程

本專案採用 **直接部署到 GAS 測試** 的開發方式：

```bash
# 1. 安裝依賴
pnpm install

# 2. 每次修改後，建置並部署到 GAS
pnpm run deploy:gas

# 3. 在瀏覽器開啟測試部署網址（.../dev）查看最新結果

# 4. 確認無誤後，建立新的正式部署版本（.../exec）
```

**重要提示：**

- 不使用本地開發伺服器（`pnpm dev`）
- 每次修改後都需要重新部署到 GAS
- 先使用 `.../dev` 網址進行測試
- 確認功能正確後，再使用 `.../exec` 正式版本
- 清除瀏覽器快取（Ctrl+Shift+R）以確保載入最新版本

詳細部署步驟請參考 [GAS\_部署說明.md](./GAS_部署說明.md)。

## 📦 建置指令

```bash
# 建置 GAS 版本
pnpm run build:gas

# 建置並部署
pnpm run deploy:gas

# 預覽正式環境
pnpm run preview:prod
```

## 🔧 程式碼檢查

```bash
# 程式碼格式化和檢查
pnpm lint

# 執行測試
pnpm test
```

## 📋 新增模組流程

完整的模組開發流程請參考 [專案重構說明.md](./專案重構說明.md)，包含：

1. 創建 API 層
2. 創建 Vue 組件
3. 新增路由
4. 創建 GAS 函數
5. 更新 Mock 資料

## 📁 專案結構

```
vue3-gas/
├── src/
│   ├── api/              # API 層
│   ├── views/            # 頁面組件
│   ├── router/           # 路由配置
│   ├── store/            # Pinia 狀態管理
│   ├── utils/            # 工具函數
│   │   └── gas-service.js  # GAS 服務核心
│   └── layouts/          # 佈局組件
├── gas/
│   ├── main.js           # GAS 主入口
│   ├── login.js          # 登入功能
│   ├── spreadsheet.js    # 試算表功能
│   └── index.html        # HTML 模板
└── dist/                 # 建置輸出

```

## 🎯 範例：試算表管理

專案包含完整的 Google Spreadsheet 管理範例，展示如何：

- 🔍 讀取試算表資料
- ➕ 新增資料列
- ✏️ 編輯資料列
- 🗑️ 刪除資料列
- 📊 切換工作表
- 📝 自動創建工作表

可作為開發其他模組的參考範本。

## 💡 開發提示

- **開發流程**：修改程式碼後執行 `pnpm run deploy:gas` 部署測試
- **GAS 函數**：統一回應格式 `{ code, data, message }`
- **錯誤處理**：使用 try-catch 並返回友善的錯誤訊息
- **除錯技巧**：使用 GAS 編輯器的 Logger.log() 和瀏覽器控制台
- **狀態管理**：簡單狀態用 ref/reactive，全域狀態用 Pinia

## 🔗 相關連結

- [原始專案 - V3 Admin Vite](https://github.com/un-pany/v3-admin-vite)
- [Google Apps Script 文件](https://developers.google.com/apps-script)
- [Vue 3 文件](https://vuejs.org/)
- [Element Plus 文件](https://element-plus.org/)

## 📄 授權

本專案基於原始 V3 Admin Vite 模板重構，保留原始授權條款。
