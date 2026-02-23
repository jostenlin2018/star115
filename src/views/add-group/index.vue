<template>
  <div class="add-group-page">
    <!-- 非開放期間警告 Banner -->
    <el-alert
      v-if="!open"
      title="目前非志願選填開放時間，無法新增志願"
      type="warning"
      :closable="false"
      show-icon
      class="time-alert"
    />

    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span class="title">搜尋並新增志願</span>
          <el-button @click="router.push('/selected-group')">返回我的志願清單</el-button>
        </div>
      </template>

      <!-- 搜尋欄（手機端透過 CSS 改為垂直排列） -->
      <div class="search-bar">
        <el-input
          v-model="inputKeyword"
          placeholder="輸入關鍵字，按 Enter 或點擊搜尋"
          clearable
          :disabled="!open"
          class="search-input"
          @keyup.enter="handleSearch"
          @clear="handleClear"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button class="search-btn" type="primary" :disabled="!open || !inputKeyword.trim()" @click="handleSearch">
          搜尋
        </el-button>
      </div>

      <div class="search-hint">
        <el-icon class="hint-icon"><InfoFilled /></el-icon>
        多關鍵詞請用<strong>半形空白</strong>分隔，例如：<code>台大 電機</code>
      </div>

      <!-- 搜尋狀態提示 -->
      <div v-if="confirmedKeyword" class="search-info">
        <span
          >搜尋「<strong>{{ confirmedKeyword }}</strong
          >」，共找到 {{ filteredAndSorted.length }} 筆結果</span
        >
      </div>

      <!-- 電腦端：Table（CSS 在 <=768px 隱藏） -->
      <div v-if="confirmedKeyword" class="table-wrapper">
        <el-table :data="pagedResults" stripe border empty-text="沒有符合條件的校系" class="result-table">
          <el-table-column label="學校" prop="學校名稱" min-width="140" />
          <el-table-column label="學群" prop="學群名稱" min-width="120" />
          <el-table-column label="學系" prop="學系名稱" min-width="160" />
          <el-table-column label="代碼" prop="完整代碼" width="110" align="center" />
          <el-table-column label="操作" width="110" align="center">
            <template #default="{ row }">
              <el-button
                size="small"
                :type="getButtonType(row)"
                :disabled="!open || isSelected(row)"
                @click="handleAdd(row)"
              >
                {{ getButtonLabel(row) }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 手機端：卡片清單（CSS 在 >768px 隱藏） -->
      <div v-if="confirmedKeyword" class="mobile-card-list">
        <el-empty v-if="pagedResults.length === 0" description="沒有符合條件的校系" />
        <div v-for="dept in pagedResults" :key="dept.完整代碼" class="result-card">
          <!-- 頂部：學校 + 學系 -->
          <div class="result-card__header">
            <span class="result-card__school">{{ dept.學校名稱 }}</span>
            <span class="result-card__dept">{{ dept.學系名稱 }}</span>
          </div>

          <!-- 中段：學群 + 代碼 -->
          <div class="result-card__meta">
            <el-tag size="small" type="info">{{ dept.學群名稱 }}</el-tag>
            <span class="result-card__code">{{ dept.完整代碼 }}</span>
          </div>

          <!-- 底部：加入按鈕（滿版） -->
          <div class="result-card__action">
            <el-button
              :type="getButtonType(dept)"
              :disabled="!open || isSelected(dept)"
              style="width: 100%"
              @click="handleAdd(dept)"
            >
              {{ getButtonLabel(dept) }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分頁導航（isMobile 控制 layout 與 small 屬性） -->
      <div v-if="confirmedKeyword && filteredAndSorted.length > pageSize" class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredAndSorted.length"
          :layout="isMobile ? 'prev, pager, next' : 'prev, pager, next, jumper, total'"
          :small="isMobile"
          background
        />
      </div>

      <!-- 未搜尋時的引導提示 -->
      <el-empty v-if="!confirmedKeyword" description="請輸入關鍵字後按 Enter 或點擊搜尋" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { useRouter, onBeforeRouteLeave } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Search, InfoFilled } from "@element-plus/icons-vue"
import { usePreferencesStore } from "@/store/modules/preferences"

const router = useRouter()
const preferencesStore = usePreferencesStore()

const open = computed(() => preferencesStore.isOpen())
const isDirty = computed(() => preferencesStore.isDirty)

// ============ RWD：使用 matchMedia（與 CSS 媒體查詢相同引擎，更可靠） ============
// 僅用於 el-pagination 的 :layout 與 :small 動態 prop
const isMobile = ref(false)
let mq = null
const onMediaChange = (e) => {
  isMobile.value = e.matches
}

function handleBeforeUnload(e) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ""
  }
}

onMounted(() => {
  mq = window.matchMedia("(max-width: 768px)")
  isMobile.value = mq.matches
  mq.addEventListener("change", onMediaChange)
  window.addEventListener("beforeunload", handleBeforeUnload)
})
onUnmounted(() => {
  mq?.removeEventListener("change", onMediaChange)
  window.removeEventListener("beforeunload", handleBeforeUnload)
})

onBeforeRouteLeave(async (to) => {
  if (to.path.includes("selected")) return true
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

// ============ 搜尋狀態 ============
/** 搜尋框 v-model，不直接觸發過濾計算 */
const inputKeyword = ref("")
/** 使用者按下搜尋後才更新，作為 computed 的依賴 */
const confirmedKeyword = ref("")

const currentPage = ref(1)
const pageSize = 10

function handleSearch() {
  const kw = inputKeyword.value.trim()
  if (!kw) return
  confirmedKeyword.value = kw
  currentPage.value = 1
}

function handleClear() {
  confirmedKeyword.value = ""
  currentPage.value = 1
}

// confirmedKeyword 改變時重置分頁
watch(confirmedKeyword, () => {
  currentPage.value = 1
})

// ============ 搜尋 / 排序 / 分頁 computed ============

/** 完整過濾 + 智慧排序結果（不含分頁） */
const filteredAndSorted = computed(() => {
  const kw = confirmedKeyword.value.trim()
  if (!kw) return []

  const keywords = kw.split(/\s+/).filter(Boolean)
  const flatDepts = preferencesStore.flattenedDepts

  // AND 邏輯過濾
  const filtered = flatDepts.filter((dept) => keywords.every((k) => dept.搜尋文本.includes(k.toLowerCase())))

  // 智慧排序：完整字串命中（連續）優先
  filtered.sort((a, b) => {
    const aExact = a.搜尋文本.includes(kw.toLowerCase()) ? 1 : 0
    const bExact = b.搜尋文本.includes(kw.toLowerCase()) ? 1 : 0
    return bExact - aExact
  })

  return filtered
})

/** 分頁切割後的當頁結果 */
const pagedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredAndSorted.value.slice(start, start + pageSize)
})

// ============ 按鈕狀態輔助 ============

function isSelected(dept) {
  const result = preferencesStore.checkAddStatus(dept)
  return result.status === "selected"
}

function getButtonLabel(dept) {
  const result = preferencesStore.checkAddStatus(dept)
  return result.status === "selected" ? "已選取" : "加入志願"
}

function getButtonType(dept) {
  const result = preferencesStore.checkAddStatus(dept)
  return result.status === "selected" ? "info" : "primary"
}

// ============ 防呆加入流程 ============

async function handleAdd(dept) {
  const { status, existingIndex } = preferencesStore.checkAddStatus(dept)

  if (status === "full") {
    ElMessage.error("志願數已達上限（20 個），請先移除部分志願再新增")
    return
  }

  if (status === "selected") {
    return
  }

  if (status === "replace") {
    const existing = preferencesStore.detailedPreferencesList[existingIndex]
    try {
      await ElMessageBox.confirm(
        `您已選填「${existing.學校名稱} ${existing.學群名稱} ${existing.學系名稱}」。\n` +
          `同一大學同一學群只能選填一科系，是否以「${dept.學系名稱}」替換？`,
        "替換確認",
        {
          confirmButtonText: "確認替換",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
      preferencesStore.replacePreference(existingIndex, dept)
      ElMessage.success(`已替換為「${dept.學系名稱}」`)
    } catch {
      // 使用者點取消，不執行任何動作
    }
    return
  }

  // status === 'ok'
  preferencesStore.addPreference(dept)
  ElMessage.success(`已加入「${dept.學系名稱}」`)
}
</script>

<style scoped lang="scss">
.add-group-page {
  padding: 20px;
  max-width: 1024px;
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

/* ====== 搜尋欄（桌面水平，手機垂直） ====== */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;

  .search-input {
    flex: 1;
  }
}

.search-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .hint-icon {
    font-size: 14px;
    color: var(--el-color-info);
    flex-shrink: 0;
  }

  code {
    background: var(--el-fill-color);
    border-radius: 3px;
    padding: 0 4px;
    font-family: monospace;
    color: var(--el-text-color-primary);
  }
}

.search-info {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-bottom: 12px;
}

/* ====== 桌面版 table（>768px 顯示，<=768px 隱藏） ====== */
.table-wrapper {
  display: block;
  margin-bottom: 16px;
}

.result-table {
  width: 100%;
}

/* ====== 手機版卡片清單（>768px 隱藏，<=768px 顯示） ====== */
.mobile-card-list {
  display: none;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

/* ====== 手機版搜尋結果卡片樣式 ====== */
.result-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  &__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }

  &__school {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  &__dept {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__code {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__action {
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

/* ====== RWD：手機端覆蓋 ====== */
@media (max-width: 768px) {
  .add-group-page {
    padding: 12px;
  }

  /* 搜尋欄改為垂直排列，按鈕與輸入框滿版 */
  .search-bar {
    flex-direction: column;

    .search-input {
      width: 100%;
    }

    .search-btn {
      width: 100%;
    }
  }

  /* 隱藏桌面 table，顯示手機卡片 */
  .table-wrapper {
    display: none;
  }

  .mobile-card-list {
    display: flex;
  }

  .pagination-wrap {
    padding-top: 4px;
  }
}
</style>
