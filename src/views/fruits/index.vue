<script setup>
import { ref, onMounted, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useFruitsStore } from "@/store/modules/fruits"
import { storeToRefs } from "pinia"

// ========== Store ==========
const fruitsStore = useFruitsStore()
const { fruitsList, loading } = storeToRefs(fruitsStore)

// ========== 對話框控制 ==========
const dialogVisible = ref(false)
const dialogTitle = ref("新增水果")
const isEditMode = ref(false)

// ========== 表單資料 ==========
const formData = ref({
  id: "",
  fruit_name: "",
  numbers: 0,
  descript: ""
})

// 原始 ID（用於編輯時識別）
const originalId = ref("")

// ========== 表單驗證規則 ==========
const formRules = {
  id: [{ required: true, message: "請輸入水果 ID", trigger: "blur" }],
  fruit_name: [{ required: true, message: "請輸入水果名稱", trigger: "blur" }],
  numbers: [
    { required: true, message: "請輸入數量", trigger: "blur" },
    { type: "number", message: "數量必須為數字", trigger: "blur" }
  ]
}

// 表單 ref
const formRef = ref(null)

// ========== 計算屬性 ==========
const tableData = computed(() => fruitsList.value || [])

// ========== 方法 ==========

/**
 * 載入所有水果資料
 */
const loadData = async () => {
  try {
    await fruitsStore.fetchAllFruits()
    ElMessage.success("載入成功")
  } catch (error) {
    console.error("載入水果資料錯誤:", error)
    ElMessage.error("載入失敗：" + error.message)
  }
}

/**
 * 開啟新增對話框
 */
const handleAdd = () => {
  dialogTitle.value = "新增水果"
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

/**
 * 開啟編輯對話框
 * @param {Object} row - 要編輯的水果資料
 */
const handleEdit = (row) => {
  dialogTitle.value = "編輯水果"
  isEditMode.value = true
  originalId.value = row.id
  formData.value = {
    id: row.id,
    fruit_name: row.fruit_name,
    numbers: row.numbers,
    descript: row.descript
  }
  dialogVisible.value = true
}

/**
 * 刪除水果資料
 * @param {Object} row - 要刪除的水果資料
 */
const handleDelete = (row) => {
  ElMessageBox.confirm(`確定要刪除「${row.fruit_name}」嗎？`, "警告", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const response = await fruitsStore.removeFruit(row.id)
        if (response.code === 0) {
          ElMessage.success("刪除成功")
        } else {
          ElMessage.error(response.message || "刪除失敗")
        }
      } catch (error) {
        console.error("刪除水果錯誤:", error)
        ElMessage.error("刪除失敗：" + error.message)
      }
    })
    .catch(() => {
      // 使用者取消
    })
}

/**
 * 提交表單
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning("請填寫所有必填欄位")
      return
    }

    try {
      const submitData = {
        id: formData.value.id,
        fruit_name: formData.value.fruit_name,
        numbers: Number(formData.value.numbers),
        descript: formData.value.descript
      }

      if (isEditMode.value) {
        // 更新資料
        const response = await fruitsStore.modifyFruit(originalId.value, submitData)
        if (response.code === 0) {
          ElMessage.success("更新成功")
          dialogVisible.value = false
        } else {
          ElMessage.error(response.message || "更新失敗")
        }
      } else {
        // 新增資料
        const response = await fruitsStore.createFruit(submitData)
        if (response.code === 0) {
          ElMessage.success("新增成功")
          dialogVisible.value = false
        } else {
          ElMessage.error(response.message || "新增失敗")
        }
      }
    } catch (error) {
      console.error("提交表單錯誤:", error)
      ElMessage.error("操作失敗：" + error.message)
    }
  })
}

/**
 * 重置表單
 */
const resetForm = () => {
  formData.value = {
    id: "",
    fruit_name: "",
    numbers: 0,
    descript: ""
  }
  originalId.value = ""
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

/**
 * 取消對話框
 */
const handleCancel = () => {
  dialogVisible.value = false
  resetForm()
}

// ========== 生命週期 ==========
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="app-container">
    <!-- 標題與操作按鈕 -->
    <el-card class="header-card">
      <div class="header">
        <div class="header-title">
          <h2>🍎 水果管理系統</h2>
          <p class="subtitle">管理 Google Spreadsheet 中的 fruits 工作表資料</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="handleAdd" :icon="'Plus'">新增水果</el-button>
          <el-button @click="loadData" :icon="'Refresh'">重新載入</el-button>
        </div>
      </div>
    </el-card>

    <!-- 資料表格 -->
    <el-card class="table-card">
      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%" empty-text="暫無資料">
        <el-table-column prop="id" label="ID" width="100" align="center" />
        <el-table-column prop="fruit_name" label="水果名稱" width="150" />
        <el-table-column prop="numbers" label="數量" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.numbers > 5 ? 'success' : row.numbers > 0 ? 'warning' : 'danger'">
              {{ row.numbers }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="descript" label="描述" min-width="200">
          <template #default="{ row }">
            <span v-if="row.descript" class="descript-text">{{ row.descript }}</span>
            <span v-else class="empty-text">（無描述）</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)" :icon="'Edit'"> 編輯 </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" :icon="'Delete'"> 刪除 </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 資料統計 -->
      <div class="table-footer">
        <el-text type="info">共 {{ tableData.length }} 筆資料</el-text>
      </div>
    </el-card>

    <!-- 新增/編輯對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :before-close="handleCancel"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="ID" prop="id">
          <el-input v-model="formData.id" placeholder="請輸入水果 ID（例如：1, 2, 3...）" :disabled="isEditMode" />
          <el-text v-if="isEditMode" type="warning" size="small"> 編輯模式下 ID 不可修改 </el-text>
        </el-form-item>

        <el-form-item label="水果名稱" prop="fruit_name">
          <el-input v-model="formData.fruit_name" placeholder="請輸入水果名稱（例如：蘋果）" />
        </el-form-item>

        <el-form-item label="數量" prop="numbers">
          <el-input-number
            v-model="formData.numbers"
            :min="0"
            :max="999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="描述" prop="descript">
          <el-input
            v-model="formData.descript"
            type="textarea"
            :rows="3"
            placeholder="請輸入描述（選填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
  width: 100%;
  max-width: 100%;
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
  font-size: 24px;
}

.header-title .subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.table-card {
  margin-top: 20px;
}

.table-footer {
  margin-top: 16px;
  text-align: right;
}

.descript-text {
  color: #606266;
}

.empty-text {
  color: #c0c4cc;
  font-style: italic;
}

/* 大螢幕 (>= 1200px) */
@media screen and (min-width: 1200px) {
  .app-container {
    padding: 30px;
  }

  .header-title h2 {
    font-size: 28px;
  }
}

/* 平板裝置 (768px - 1199px) */
@media screen and (min-width: 768px) and (max-width: 1199px) {
  .app-container {
    padding: 20px;
  }

  .header-title h2 {
    font-size: 22px;
  }

  :deep(.el-table) {
    font-size: 14px;
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
    font-size: 20px;
  }

  .header-title .subtitle {
    font-size: 13px;
  }

  .header-actions {
    width: 100%;
    flex-direction: row;
    gap: 10px;
  }

  .header-actions .el-button {
    flex: 1;
  }

  /* 表格滾動顯示 */
  :deep(.el-table) {
    font-size: 13px;

    .el-table__cell {
      padding: 8px 0;
    }
  }
}

/* 手機直向 (< 576px) */
@media screen and (max-width: 575px) {
  .app-container {
    padding: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  .header-card,
  .table-card {
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
    font-size: 20px;
    margin-bottom: 3px;
  }

  .header-title .subtitle {
    font-size: 12px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .header-actions .el-button {
    width: 100%;
  }

  /* 表格在手機上的優化 */
  :deep(.el-table) {
    font-size: 12px;

    .el-table__cell {
      padding: 10px 5px;
    }

    /* 隱藏描述欄位以節省空間 */
    .el-table__body-wrapper {
      overflow-x: auto;
    }
  }

  /* 表格操作按鈕優化 */
  :deep(.el-table__fixed-right) {
    .el-button {
      padding: 5px 8px;
      font-size: 12px;
    }
  }

  .table-footer {
    text-align: center;
    padding: 10px;
    font-size: 13px;
  }

  /* 對話框在手機上的優化 */
  :deep(.el-dialog) {
    width: 95% !important;
    margin-top: 5vh !important;

    .el-dialog__header {
      padding: 15px;
    }

    .el-dialog__body {
      padding: 15px;
    }

    .el-dialog__footer {
      padding: 10px 15px;
    }

    .el-form-item__label {
      font-size: 14px;
    }
  }
}

/* 極小螢幕 (< 360px) */
@media screen and (max-width: 359px) {
  .header-title h2 {
    font-size: 18px;
  }

  :deep(.el-table) {
    font-size: 11px;

    .el-button {
      padding: 4px 6px;
      font-size: 11px;
    }
  }

  :deep(.el-dialog) {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0;

    .el-form-item__label {
      width: 70px !important;
      font-size: 13px;
    }
  }
}
</style>
