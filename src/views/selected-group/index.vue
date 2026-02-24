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
            <el-tag v-if="isDirty" type="danger">尚未儲存</el-tag>
          </span>
        </div>
      </template>

      <div class="info-hint">
        <div class="info-hint__title">
          <el-icon class="hint-icon"><InfoFilled /></el-icon>
          <span>說明：</span>
        </div>
        <ol class="info-hint__list">
          <li>科系新增、刪除、或變更志願序之後請記得存檔。</li>
          <li>存檔完成之後，才能匯出PDF志願表。</li>
          <li>非志願選填時段系統會呈現唯讀，無法變更或匯出。</li>
        </ol>
      </div>

      <!-- 電腦端：Table（CSS 在 <=768px 隱藏） -->
      <div class="table-wrapper">
        <el-table :data="detailedPreferencesList" stripe border empty-text="尚未選填任何志願" class="pref-table">
          <el-table-column label="序號" type="index" width="60" align="center" />
          <el-table-column label="學校" prop="學校名稱" min-width="140" />
          <el-table-column label="學群" prop="學群名稱" min-width="120" />
          <el-table-column label="學系" prop="學系名稱" min-width="160" />
          <el-table-column label="完整代碼" prop="完整代碼" width="110" align="center" />
          <el-table-column v-if="open" label="操作" width="160" align="center">
            <template #default="{ $index }">
              <div class="action-btns">
                <el-button size="small" :disabled="$index === 0" @click="preferencesStore.moveUp($index)">
                  ↑
                </el-button>
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
      </div>

      <!-- 手機端：卡片清單（CSS 在 >768px 隱藏） -->
      <div class="mobile-card-list">
        <el-empty v-if="detailedPreferencesList.length === 0" description="尚未選填任何志願" />
        <div v-for="(dept, index) in detailedPreferencesList" :key="dept.完整代碼" class="pref-card">
          <!-- 頂部：志願序 + 學校名稱 -->
          <div class="pref-card__header">
            <span class="pref-card__rank">志願 {{ index + 1 }}</span>
            <span class="pref-card__school">{{ dept.學校名稱 }}</span>
          </div>

          <!-- 中段：學群 + 學系 -->
          <div class="pref-card__body">
            <div class="pref-card__meta">
              <el-tag size="small" type="info" class="pref-card__group-tag">{{ dept.學群名稱 }}</el-tag>
              <span class="pref-card__dept">{{ dept.學系名稱 }}</span>
            </div>
            <div class="pref-card__code">代碼：{{ dept.完整代碼 }}</div>
          </div>

          <!-- 底部：操作按鈕（僅開放期間顯示） -->
          <div v-if="open" class="pref-card__actions">
            <el-button size="default" :disabled="index === 0" @click="preferencesStore.moveUp(index)">
              <el-icon><ArrowUp /></el-icon>
              上移
            </el-button>
            <el-button
              size="default"
              :disabled="index === detailedPreferencesList.length - 1"
              @click="preferencesStore.moveDown(index)"
            >
              <el-icon><ArrowDown /></el-icon>
              下移
            </el-button>
            <el-button size="default" type="danger" @click="preferencesStore.removePreference(index)">
              <el-icon><Delete /></el-icon>
              移除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 統一底部按鈕列（電腦端靠右，手機端透過 CSS 變為 sticky） -->
      <div class="footer-actions">
        <el-button @click="router.push('/add-group')">
          <el-icon><Plus /></el-icon>
          新增志願
        </el-button>
        <template v-if="open">
          <el-button
            :type="isDirty ? 'warning' : 'primary'"
            :disabled="!isDirty"
            :loading="isSaving"
            @click="handleSave"
            >儲存志願</el-button
          >
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
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter, onBeforeRouteLeave } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { ArrowUp, ArrowDown, Delete, Plus, InfoFilled } from "@element-plus/icons-vue"
import { usePreferencesStore } from "@/store/modules/preferences"

const router = useRouter()
const preferencesStore = usePreferencesStore()

const preferencesList = computed(() => preferencesStore.preferencesList)
const detailedPreferencesList = computed(() => preferencesStore.detailedPreferencesList)
const pdfReady = computed(() => preferencesStore.pdfReady)
const isDirty = computed(() => preferencesStore.isDirty)
const open = computed(() => preferencesStore.isOpen())

const isSaving = ref(false)
const isPdfGenerating = ref(false)

function handleBeforeUnload(e) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ""
  }
}

onMounted(() => window.addEventListener("beforeunload", handleBeforeUnload))
onUnmounted(() => window.removeEventListener("beforeunload", handleBeforeUnload))

onBeforeRouteLeave(async () => {
  if (!isDirty.value) return true
  try {
    await ElMessageBox.confirm("您有未儲存的志願變更，確定要離開嗎？", "警告", {
      type: "warning",
      confirmButtonText: "確定離開",
      cancelButtonText: "取消"
    })
    return true
  } catch {
    return false
  }
})

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

.info-hint {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.info-hint__title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.info-hint__list {
  margin: 0;
  padding-left: 20px;
}

.info-hint__list li + li {
  margin-top: 2px;
}

.info-hint .hint-icon {
  font-size: 14px;
  color: var(--el-color-info);
  flex-shrink: 0;
  margin-top: 1px;
}

/* ====== 桌面版 table（>768px 顯示，<=768px 隱藏） ====== */
.table-wrapper {
  display: block;
  margin-bottom: 20px;
}

.pref-table {
  width: 100%;
}

.action-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* ====== 手機版卡片清單（>768px 隱藏，<=768px 顯示） ====== */
.mobile-card-list {
  display: none;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

/* ====== 統一底部按鈕列 ====== */
.footer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 4px;
}

/* ====== 手機版卡片樣式 ====== */
.pref-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  &__rank {
    background: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  &__school {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__body {
    margin-bottom: 12px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  &__group-tag {
    flex-shrink: 0;
  }

  &__dept {
    font-size: 15px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  &__code {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-top: 2px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);

    .el-button {
      flex: 1;
    }
  }
}

/* ====== RWD：手機端覆蓋 ====== */
@media (max-width: 768px) {
  .selected-group-page {
    padding: 12px;
    /* 為底部 sticky bar 騰出空間，避免內容被遮住 */
    padding-bottom: 90px;
  }

  /* 隱藏桌面 table，顯示手機卡片 */
  .table-wrapper {
    display: none;
  }

  .mobile-card-list {
    display: flex;
  }

  /* 將底部按鈕列轉為 Sticky Action Bar */
  .footer-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    justify-content: center;
    padding: 12px 16px;
    /* iOS Safe Area 支援 */
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    background: var(--el-bg-color);
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.12);
    border-top: 1px solid var(--el-border-color-lighter);

    .el-button {
      flex: 1;
      max-width: 140px;
    }
  }
}
</style>
