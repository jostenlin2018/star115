<template>
  <div class="selected-group-page">
    <!-- 非開放期間警告 Banner -->
    <el-alert
      v-if="!open"
      title="目前非志願選填開放時間，頁面為唯讀模式"
      type="warning"
      :closable="false"
      show-icon
      class="time-alert"
    />

    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span class="title">我的志願清單</span>
          <span class="count">
            <el-tag :type="preferencesList.length >= 20 ? 'danger' : 'info'">
              {{ preferencesList.length }} / 20 個志願
            </el-tag>
          </span>
        </div>
      </template>

      <!-- 志願清單 -->
      <el-table :data="detailedPreferencesList" stripe border empty-text="尚未選填任何志願" class="pref-table">
        <el-table-column label="序號" type="index" width="60" align="center" />
        <el-table-column label="學校" prop="學校名稱" min-width="140" />
        <el-table-column label="學群" prop="學群名稱" min-width="120" />
        <el-table-column label="學系" prop="學系名稱" min-width="160" />
        <el-table-column label="完整代碼" prop="完整代碼" width="110" align="center" />
        <el-table-column v-if="open" label="操作" width="160" align="center">
          <template #default="{ $index }">
            <div class="action-btns">
              <el-button size="small" :disabled="$index === 0" @click="preferencesStore.moveUp($index)"> ↑ </el-button>
              <el-button
                size="small"
                :disabled="$index === detailedPreferencesList.length - 1"
                @click="preferencesStore.moveDown($index)"
              >
                ↓
              </el-button>
              <el-button size="small" type="danger" @click="preferencesStore.removePreference($index)">
                移除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部按鈕列 -->
      <div class="footer-actions">
        <el-button @click="router.push('/add-group')">前往新增志願</el-button>

        <template v-if="open">
          <el-button type="primary" :loading="isSaving" @click="handleSave"> 儲存志願 </el-button>
          <el-button type="success" :disabled="!pdfReady" :loading="isPdfGenerating" @click="handleGeneratePDF">
            匯出 PDF
          </el-button>
        </template>
      </div>
    </el-card>

    <!-- PDF 產生中的全螢幕遮罩 -->
    <div
      v-if="isPdfGenerating"
      v-loading.fullscreen.lock="isPdfGenerating"
      element-loading-text="PDF 產生中，請稍候..."
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { usePreferencesStore } from "@/store/modules/preferences"

const router = useRouter()
const preferencesStore = usePreferencesStore()

const preferencesList = computed(() => preferencesStore.preferencesList)
const detailedPreferencesList = computed(() => preferencesStore.detailedPreferencesList)
const pdfReady = computed(() => preferencesStore.pdfReady)
const open = computed(() => preferencesStore.isOpen())

const isSaving = ref(false)
const isPdfGenerating = ref(false)

async function handleSave() {
  isSaving.value = true
  try {
    await preferencesStore.savePreferences()
    ElMessage.success("志願儲存成功")
  } catch {
    ElMessage.error("儲存失敗，請稍後再試")
  } finally {
    isSaving.value = false
  }
}

async function handleGeneratePDF() {
  isPdfGenerating.value = true
  try {
    const pdfUrl = await preferencesStore.generatePDF()
    ElMessage.success("PDF 產生成功，即將開啟")
    window.open(pdfUrl, "_blank")
  } catch {
    ElMessage.error("PDF 產生失敗，請稍後再試")
  } finally {
    isPdfGenerating.value = false
  }
}
</script>

<style scoped lang="scss">
.selected-group-page {
  padding: 20px;
  max-width: 960px;
  margin: 0 auto;
}

.time-alert {
  margin-bottom: 16px;
}

.main-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.pref-table {
  width: 100%;
  margin-bottom: 20px;
}

.action-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.footer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 4px;
}
</style>
