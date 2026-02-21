<script setup>
import { ref, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useSingleFruitStore } from "@/store/modules/single_fruit"
import { storeToRefs } from "pinia"
import { onBeforeRouteLeave } from "vue-router"

// ========== Store ==========
const singleFruitStore = useSingleFruitStore()
const { fruitOptions, selectedFruitId, editingFruit, loading, saving, isModified, hasSelectedFruit, canSave } =
  storeToRefs(singleFruitStore)

// ========== 表單 Ref ==========
const formRef = ref(null)

// ========== 表單驗證規則 ==========
const formRules = {
  id: [{ required: true, message: "請輸入水果 ID", trigger: "blur" }],
  fruit_name: [{ required: true, message: "請輸入水果名稱", trigger: "blur" }],
  numbers: [
    { required: true, message: "請輸入數量", trigger: "blur" },
    { type: "number", message: "數量必須為數字", trigger: "blur" }
  ]
}

// ========== 方法 ==========

/**
 * 載入水果選項列表
 */
const loadFruitOptions = async () => {
  try {
    await singleFruitStore.fetchFruitOptions()
  } catch (error) {
    console.error("載入水果選項錯誤:", error)
    ElMessage.error("載入水果選項失敗：" + error.message)
  }
}

/**
 * 處理水果選擇變更
 * 當使用者從下拉選單選擇水果時觸發
 */
const handleFruitChange = async (fruitId) => {
  if (!fruitId) {
    singleFruitStore.clearSelection()
    return
  }

  // 如果當前有未儲存的修改，詢問使用者
  if (isModified.value) {
    try {
      await ElMessageBox.confirm("您有未儲存的修改，切換水果將會遺失這些變更。確定要繼續嗎？", "警告", {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "warning"
      })
    } catch {
      // 使用者取消，恢復原來的選擇
      selectedFruitId.value = singleFruitStore.originalFruit?.id || null
      return
    }
  }

  // 載入選中的水果資料
  try {
    const response = await singleFruitStore.loadFruitForEdit(fruitId)
    if (response.code === 0) {
      ElMessage.success("載入成功")
      // 重置表單驗證狀態
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    } else {
      ElMessage.error(response.message || "載入失敗")
    }
  } catch (error) {
    console.error("載入水果資料錯誤:", error)
    ElMessage.error("載入失敗：" + error.message)
  }
}

/**
 * 儲存水果資料
 */
const handleSave = async () => {
  if (!formRef.value) return

  // 先驗證表單
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning("請填寫所有必填欄位")
      return
    }

    try {
      const response = await singleFruitStore.saveFruit()
      if (response.code === 0) {
        ElMessage.success("儲存成功！")
        // 重新載入選項列表（以防 ID 被修改）
        await loadFruitOptions()
      } else {
        ElMessage.error(response.message || "儲存失敗")
      }
    } catch (error) {
      console.error("儲存水果資料錯誤:", error)
      ElMessage.error("儲存失敗：" + error.message)
    }
  })
}

/**
 * 重置表單到原始狀態
 */
const handleReset = () => {
  if (!isModified.value) {
    ElMessage.info("表單未被修改")
    return
  }

  ElMessageBox.confirm("確定要放棄所有變更，恢復到原始狀態嗎？", "提示", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "info"
  })
    .then(() => {
      singleFruitStore.resetForm()
      if (formRef.value) {
        formRef.value.clearValidate()
      }
      ElMessage.success("已恢復到原始狀態")
    })
    .catch(() => {
      // 使用者取消
    })
}

/**
 * 清除選擇
 */
const handleClearSelection = () => {
  if (isModified.value) {
    ElMessageBox.confirm("您有未儲存的修改，確定要清除選擇嗎？", "警告", {
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        singleFruitStore.clearSelection()
        if (formRef.value) {
          formRef.value.clearValidate()
        }
        ElMessage.success("已清除選擇")
      })
      .catch(() => {
        // 使用者取消
      })
  } else {
    singleFruitStore.clearSelection()
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  }
}

// ========== 生命週期 ==========
onMounted(() => {
  loadFruitOptions()
})

// ========== 監聽 ==========
// 監聽路由變化或組件卸載時的未儲存提醒
onBeforeRouteLeave((to, from, next) => {
  if (isModified.value) {
    ElMessageBox.confirm("您有未儲存的修改，確定要離開嗎？", "警告", {
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        next()
      })
      .catch(() => {
        next(false)
      })
  } else {
    next()
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 標題卡片 -->
    <el-card class="header-card">
      <div class="header">
        <div class="header-title">
          <h2>🍎 單一水果編輯器</h2>
          <p class="subtitle">選擇一個水果並進行編輯和儲存</p>
        </div>
      </div>
    </el-card>

    <!-- 選擇水果卡片 -->
    <el-card class="select-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">選擇水果</span>
          <el-button v-if="hasSelectedFruit" type="info" size="small" @click="handleClearSelection" :icon="'Close'">
            清除選擇
          </el-button>
        </div>
      </template>

      <div class="select-container">
        <el-select
          v-model="selectedFruitId"
          placeholder="請選擇要編輯的水果"
          size="large"
          style="width: 100%"
          :loading="loading"
          clearable
          filterable
          @change="handleFruitChange"
        >
          <el-option v-for="option in fruitOptions" :key="option.id" :label="option.label" :value="option.id">
            <div class="option-item">
              <span class="option-id">{{ option.id }}</span>
              <span class="option-name">{{ option.fruit_name }}</span>
            </div>
          </el-option>
        </el-select>

        <div v-if="!hasSelectedFruit && !loading" class="empty-hint">
          <el-icon :size="48" color="#C0C4CC">
            <component :is="'FolderOpened'" />
          </el-icon>
          <p>請從上方選單選擇一個水果開始編輯</p>
        </div>
      </div>
    </el-card>

    <!-- 編輯表單卡片 -->
    <el-card v-if="hasSelectedFruit" class="edit-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="card-title">編輯水果資料</span>
          <div class="status-badges">
            <el-tag v-if="isModified" type="warning" effect="dark">
              <el-icon><component :is="'EditPen'" /></el-icon>
              已修改
            </el-tag>
            <el-tag v-else type="success" effect="plain">
              <el-icon><component :is="'CircleCheck'" /></el-icon>
              未修改
            </el-tag>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="editingFruit" :rules="formRules" label-width="120px" size="large">
        <el-form-item label="水果 ID" prop="id">
          <el-input v-model="editingFruit.id" placeholder="請輸入水果 ID" />
          <el-text type="info" size="small" style="margin-top: 5px">
            修改 ID 前請確保新的 ID 不會與其他水果重複
          </el-text>
        </el-form-item>

        <el-form-item label="水果名稱" prop="fruit_name">
          <el-input v-model="editingFruit.fruit_name" placeholder="請輸入水果名稱" />
        </el-form-item>

        <el-form-item label="數量" prop="numbers">
          <el-input-number
            v-model="editingFruit.numbers"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="描述" prop="descript">
          <el-input
            v-model="editingFruit.descript"
            type="textarea"
            :rows="4"
            placeholder="請輸入描述（選填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 操作按鈕 -->
        <el-form-item>
          <div class="button-group">
            <el-button
              type="primary"
              size="large"
              @click="handleSave"
              :loading="saving"
              :disabled="!canSave"
              :icon="'Check'"
            >
              {{ saving ? "儲存中..." : "儲存變更" }}
            </el-button>

            <el-button
              type="warning"
              size="large"
              @click="handleReset"
              :disabled="!isModified || saving"
              :icon="'RefreshLeft'"
            >
              重置
            </el-button>

            <el-button size="large" @click="handleClearSelection" :disabled="saving" :icon="'Close'">
              取消編輯
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <!-- 提示訊息 -->
      <el-alert v-if="isModified" type="warning" :closable="false" show-icon style="margin-top: 20px">
        <template #title> 您有未儲存的變更，請記得點擊「儲存變更」按鈕以保存修改。 </template>
      </el-alert>
    </el-card>

    <!-- 使用說明卡片 -->
    <el-card class="info-card">
      <template #header>
        <span class="card-title">
          <el-icon><component :is="'InfoFilled'" /></el-icon>
          使用說明
        </span>
      </template>

      <el-timeline>
        <el-timeline-item timestamp="步驟 1" placement="top">
          <p>從下拉選單中選擇要編輯的水果</p>
        </el-timeline-item>
        <el-timeline-item timestamp="步驟 2" placement="top">
          <p>在表單中修改水果的資料（ID、名稱、數量、描述）</p>
        </el-timeline-item>
        <el-timeline-item timestamp="步驟 3" placement="top">
          <p>點擊「儲存變更」按鈕將修改保存到 Google Spreadsheet</p>
        </el-timeline-item>
        <el-timeline-item timestamp="提示" placement="top" type="success">
          <p>✅ 如果想放棄修改，可以點擊「重置」按鈕恢復原始資料</p>
        </el-timeline-item>
      </el-timeline>

      <el-divider />

      <div class="feature-list">
        <h4>✨ 功能特色：</h4>
        <ul>
          <li>🔍 下拉選單支援搜尋和篩選</li>
          <li>💾 即時偵測表單修改狀態</li>
          <li>🔄 一鍵重置到原始資料</li>
          <li>✅ 表單驗證確保資料正確性</li>
          <li>⚠️ 離開頁面前自動提醒未儲存的變更</li>
          <li>🎯 專注於單一水果的編輯體驗</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.header-card {
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h2 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 28px;
}

.header-title .subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.select-card,
.edit-card,
.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badges {
  display: flex;
  gap: 10px;
  align-items: center;
}

.select-container {
  min-height: 100px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-id {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  color: #606266;
  min-width: 40px;
  text-align: center;
}

.option-name {
  color: #303133;
}

.empty-hint {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-hint p {
  margin-top: 16px;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.feature-list {
  margin-top: 16px;
}

.feature-list h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.feature-list ul {
  margin: 0;
  padding-left: 24px;
  color: #606266;
}

.feature-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}

/* 大螢幕 (>= 1200px) */
@media screen and (min-width: 1200px) {
  .app-container {
    padding: 30px;
  }

  .header-title h2 {
    font-size: 32px;
  }
}

/* 平板裝置 (768px - 1199px) */
@media screen and (min-width: 768px) and (max-width: 1199px) {
  .app-container {
    padding: 20px;
    max-width: 100%;
  }

  .header-title h2 {
    font-size: 26px;
  }

  :deep(.el-form) {
    .el-form-item__label {
      font-size: 14px;
    }
  }
}

/* 平板直向或手機橫向 (576px - 767px) */
@media screen and (min-width: 576px) and (max-width: 767px) {
  .app-container {
    padding: 15px;
  }

  .header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-title h2 {
    font-size: 24px;
  }

  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .button-group {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    gap: 10px;
  }

  .button-group .el-button {
    flex: 1;
    min-width: calc(50% - 5px);
  }

  :deep(.el-form) {
    .el-form-item__label {
      width: 100px !important;
      font-size: 14px;
    }
  }
}

/* 手機直向 (< 576px) */
@media screen and (max-width: 575px) {
  .app-container {
    padding: 0;
    max-width: 100%;
    width: 100%;
    overflow-x: hidden;
  }

  .header-card,
  .select-card,
  .edit-card,
  .info-card {
    border-radius: 0;
    margin-bottom: 1px;
    border-left: none;
    border-right: none;
    box-shadow: none;
    border-bottom: 1px solid #ebeef5;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;

    :deep(.el-card__body) {
      padding: 15px 12px;
      width: 100%;
      box-sizing: border-box;
    }
  }

  .header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .header-title h2 {
    font-size: 22px;
    margin-bottom: 3px;
  }

  .header-title .subtitle {
    font-size: 13px;
  }

  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
    width: 100%;
  }

  .status-badges {
    width: 100%;
    justify-content: flex-start;
  }

  .button-group {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .button-group .el-button {
    width: 100%;
  }

  :deep(.el-form) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;

    .el-form-item {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .el-form-item__label {
      width: 75px !important;
      font-size: 14px;
      line-height: 1.4;
      padding-right: 8px;
      flex-shrink: 0;
    }

    .el-form-item__content {
      margin-left: 75px !important;
      flex: 1;
      min-width: 0;
    }

    .el-input,
    .el-input-number,
    .el-textarea,
    .el-select {
      width: 100%;
      max-width: 100%;
    }

    .el-input__wrapper,
    .el-textarea__inner {
      padding: 1px 12px;
      width: 100%;
      box-sizing: border-box;
    }
  }

  .empty-hint {
    padding: 40px 15px;

    p {
      font-size: 13px;
    }
  }

  .feature-list {
    li {
      font-size: 14px;
    }
  }
}

/* 極小螢幕 (< 360px) */
@media screen and (max-width: 359px) {
  .header-card,
  .select-card,
  .edit-card,
  .info-card {
    :deep(.el-card__body) {
      padding: 12px 10px;
      width: 100%;
      box-sizing: border-box;
    }
  }

  .header-title h2 {
    font-size: 20px;
  }

  .card-title {
    font-size: 15px;
  }

  :deep(.el-form) {
    .el-form-item__label {
      width: 70px !important;
      font-size: 13px;
      padding-right: 6px;
      flex-shrink: 0;
    }

    .el-form-item__content {
      margin-left: 70px !important;
      flex: 1;
      min-width: 0;
    }

    .el-input__wrapper,
    .el-textarea__inner {
      padding: 1px 10px;
      width: 100%;
      box-sizing: border-box;
    }
  }
}
</style>
