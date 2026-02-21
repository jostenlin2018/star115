# 顯示腳本開始運作的標題訊息
Write-Host "`n### GAS: Build for Google Apps Script ###`n" -ForegroundColor Green

# --- 變數定義 ---
# 設定 GAS 部署檔案的目標資料夾路徑
$GAS_DIR = "./gas"
# 設定 Vue.js 專案建置後檔案的來源資料夾路徑
$DIST_DIR = "./dist"

# --- 前置檢查 ---
# 檢查 ./dist 資料夾是否存在，這個資料夾是執行 `npm run build` 或 `pnpm build` 後才會產生的
if (!(Test-Path $DIST_DIR)) {
    # 如果 ./dist 資料夾不存在，顯示錯誤訊息並終止腳本
    Write-Host "`n### GAS: You Need to Build the Project First! ###`n" -ForegroundColor Red
    return
}

# 建立目標資料夾
# 檢查 ./gas 資料夾是否已經存在
if (!(Test-Path $GAS_DIR)) {
    # 如果不存在，就建立一個新的資料夾。`Out-Null` 會抑制 New-Item 指令的輸出訊息
    New-Item -ItemType Directory -Path $GAS_DIR | Out-Null
}

# --- 檔案處理：HTML ---
# 複製並修改 index.html
# 1. 讀取 ./dist/index.html 的完整內容
$indexContent = Get-Content "dist/index.html" -Raw -Encoding UTF8
# 2. 移除所有 <link rel="modulepreload"> 標籤（GAS 不需要這些）
$indexContent = $indexContent -replace '<link rel="modulepreload"[^>]*>', ''
# 3. 使用正則表達式，將所有 <script> 標籤替換為單一的 GAS 樣板語法
$indexContent = $indexContent -replace '<script.+?</script>', ''
# 4. 將所有 <link rel="stylesheet"> 標籤替換為空
$indexContent = $indexContent -replace '<link rel="stylesheet"[^>]*>', ''
# 5. 在 </head> 之前插入 CSS 和 JS 的 include
$indexContent = $indexContent -replace '</head>', '<?!= include("css"); ?><?!= include("js"); ?></head>'
# 6. 將處理過的 HTML 內容寫入到 ./gas/index.html，並指定編碼為 UTF8（不含 BOM）
[System.IO.File]::WriteAllText("./gas/index.html", $indexContent, [System.Text.UTF8Encoding]::new($false))

# 顯示 index.html 檔案建立成功的訊息
Write-Host "### GAS: Index.html Created! ###" -ForegroundColor Yellow

# --- 檔案處理：圖片轉 Base64 ---
# 建立圖片到 Base64 的映射表
Write-Host "### GAS: Converting images to Base64... ###" -ForegroundColor Cyan
$imageMap = @{}
$imageFiles = Get-ChildItem "./dist/static/*.png", "./dist/static/*.jpg", "./dist/static/*.jpeg", "./dist/static/*.gif", "./dist/static/*.svg", "./dist/static/*.woff", "./dist/static/*.ttf" -ErrorAction SilentlyContinue

foreach ($imgFile in $imageFiles) {
    $bytes = [System.IO.File]::ReadAllBytes($imgFile.FullName)
    $base64 = [System.Convert]::ToBase64String($bytes)

    # 根據副檔名確定 MIME type
    $mimeType = switch ($imgFile.Extension.ToLower()) {
        ".png" { "image/png" }
        ".jpg" { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".gif" { "image/gif" }
        ".svg" { "image/svg+xml" }
        ".woff" { "font/woff" }
        ".ttf" { "font/ttf" }
        default { "application/octet-stream" }
    }

    $dataUri = "data:$mimeType;base64,$base64"
    $imageMap[$imgFile.Name] = $dataUri
    Write-Host "  - Converted: $($imgFile.Name) ($([math]::Round($imgFile.Length/1024, 2)) KB)" -ForegroundColor Gray
}

Write-Host "### GAS: $($imageMap.Count) images converted ###" -ForegroundColor Cyan

# --- 檔案處理：JavaScript ---
# 合併所有 JS 檔案到 js.html，每個檔案使用獨立的 script 標籤
# 1. 尋找 ./dist/static/ 目錄下所有 '.js' 結尾的檔案（包含所有依賴）
$jsFiles = Get-ChildItem "./dist/static/*.js"
# 2. 如果有找到對應的 JS 檔案
if ($jsFiles) {
    # 3. 建立一個空字串變數
    $jsContent = ''
    # 4. 遍歷所有找到的 JS 檔案
    foreach ($file in $jsFiles) {
        # 為每個 JS 檔案建立獨立的 <script> 標籤
        $fileContent = Get-Content $file.FullName -Raw -Encoding UTF8

        # 替換圖片路徑為 Base64 data URI
        foreach ($imgName in $imageMap.Keys) {
            # 替換各種可能的路徑格式
            $fileContent = $fileContent -replace [regex]::Escape("""$imgName"""), """$($imageMap[$imgName])"""
            $fileContent = $fileContent -replace [regex]::Escape("'$imgName'"), "'$($imageMap[$imgName])'"
            # 替換 url() 格式（可能在 JS 中生成的 CSS）
            $fileContent = $fileContent -replace [regex]::Escape("url(./static/$imgName)"), "url($($imageMap[$imgName]))"
            $fileContent = $fileContent -replace [regex]::Escape("url(/static/$imgName)"), "url($($imageMap[$imgName]))"
            $fileContent = $fileContent -replace [regex]::Escape("url(./$imgName)"), "url($($imageMap[$imgName]))"
            $fileContent = $fileContent -replace [regex]::Escape("url($imgName)"), "url($($imageMap[$imgName]))"
            # 一般路徑替換
            $fileContent = $fileContent -replace [regex]::Escape("./static/$imgName"), $imageMap[$imgName]
            $fileContent = $fileContent -replace [regex]::Escape("/static/$imgName"), $imageMap[$imgName]
            $fileContent = $fileContent -replace [regex]::Escape("static/$imgName"), $imageMap[$imgName]
            # 替換 new URL(...) 格式 (Vite 動態導入)
            $escapedName = [regex]::Escape($imgName)
            $pattern = """""""(\+new URL\(""$escapedName""[^)]+\)\.href|\+?""$escapedName""\+?)"
            $fileContent = $fileContent -replace $pattern, """$($imageMap[$imgName])"""
        }

        $jsContent += "<script type=`"module`" crossorigin>`n" + $fileContent + "`n</script>`n"
    }
    # 5. 將所有 script 標籤寫入到 ./gas/js.html 檔案中（不含 BOM）
    [System.IO.File]::WriteAllText("./gas/js.html", $jsContent, [System.Text.UTF8Encoding]::new($false))
    # 顯示 js.html 檔案建立成功的訊息
    $fileCount = $jsFiles.Count
    Write-Host "### GAS: js.html Created! ($fileCount JS files included) ###" -ForegroundColor Yellow
}

# --- 檔案處理：CSS ---
# 合併所有 CSS 檔案到 css.html
# 1. 尋找 ./dist/static/ 目錄下所有 '.css' 結尾的檔案
$cssFiles = Get-ChildItem "./dist/static/*.css"
# 2. 如果有找到對應的 CSS 檔案
if ($cssFiles) {
    # 3. 建立一個字串變數，並以 <style> 標籤開頭
    $cssContent = '<style>'
    # 4. 遍歷所有找到的 CSS 檔案
    foreach ($file in $cssFiles) {
        # 讀取 CSS 檔案內容
        $fileContent = Get-Content $file.FullName -Raw -Encoding UTF8

        # 替換圖片路徑為 Base64 data URI
        foreach ($imgName in $imageMap.Keys) {
            # 替換各種可能的路徑格式
            $fileContent = $fileContent -replace [regex]::Escape("""$imgName"""), """$($imageMap[$imgName])"""
            $fileContent = $fileContent -replace [regex]::Escape("'$imgName'"), "'$($imageMap[$imgName])'"
            # 替換 CSS url() 格式
            $fileContent = $fileContent -replace [regex]::Escape("url(./static/$imgName)"), "url($($imageMap[$imgName]))"
            $fileContent = $fileContent -replace [regex]::Escape("url(/static/$imgName)"), "url($($imageMap[$imgName]))"
            $fileContent = $fileContent -replace [regex]::Escape("url(./$imgName)"), "url($($imageMap[$imgName]))"
            $fileContent = $fileContent -replace [regex]::Escape("url($imgName)"), "url($($imageMap[$imgName]))"
            # 一般路徑替換
            $fileContent = $fileContent -replace [regex]::Escape("./static/$imgName"), $imageMap[$imgName]
            $fileContent = $fileContent -replace [regex]::Escape("/static/$imgName"), $imageMap[$imgName]
            $fileContent = $fileContent -replace [regex]::Escape("static/$imgName"), $imageMap[$imgName]
            # 替換 new URL(...) 格式 (Vite 動態導入)
            $escapedName = [regex]::Escape($imgName)
            $pattern = """""""(\+new URL\(""$escapedName""[^)]+\)\.href|\+?""$escapedName""\+?)"
            $fileContent = $fileContent -replace $pattern, """$($imageMap[$imgName])"""
        }

        # 將處理過的 CSS 內容附加
        $cssContent += "`n" + $fileContent
    }
    # 5. 在所有 CSS 內容後面加上 </style> 結尾標籤
    $cssContent += "`n</style>"
    # 6. 將合併後的 CSS 內容寫入到 ./gas/css.html 檔案中（不含 BOM）
    [System.IO.File]::WriteAllText("./gas/css.html", $cssContent, [System.Text.UTF8Encoding]::new($false))
    # 顯示 css.html 檔案建立成功的訊息
    $cssFileCount = $cssFiles.Count
    Write-Host "### GAS: css.html Created! ($cssFileCount CSS files included) ###" -ForegroundColor Yellow
}

# --- 完成訊息 ---
# 顯示腳本執行完成的訊息
Write-Host "`n### GAS: Done! ###`n" -ForegroundColor Green
