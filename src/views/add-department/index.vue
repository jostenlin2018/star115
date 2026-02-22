<template>
  <div class="add-dept-page">
    <!-- 非開放期間警告 Banner -->
    <el-alert
      v-if="!isPostRankingOpen"
      title="目前非志願選填開放時間，無法新增志願"
      type="warning"
      :closable="false"
      show-icon
      class="time-alert"
    />

    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span class="title">選擇科系</span>
          <el-button @click="router.push('/selected-department')">返回志願清單</el-button>
        </div>
      </template>

      <!-- 搜尋欄（手機端透過 CSS 改為垂直排列） -->
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="輸入關鍵字過濾科系"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
          @clear="handleClear"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button class="search-btn" type="primary" :disabled="!keyword.trim()" @click="handleSearch">
          搜尋
        </el-button>
      </div>

      <div class="search-hint">
        <el-icon class="hint-icon"><InfoFilled /></el-icon>
        顯示您可選填的科系（共 {{ availableDepartments.length }} 個），可輸入關鍵字過濾
      </div>

      <!-- 搜尋結果數量提示 -->
      <div v-if="confirmedKeyword" class="search-info">
        <span
          >過濾「<strong>{{ confirmedKeyword }}</strong
          >」，符合 {{ filteredDepts.length }} 筆</span
        >
      </div>

      <!-- 電腦端：Table（CSS 在 <=768px 隱藏） -->
      <div class="table-wrapper">
        <el-table :data="pagedResults" stripe border empty-text="沒有符合條件的科系" class="result-table">
          <el-table-column label="學校" prop="學校名稱" min-width="140" />
          <el-table-column label="學群" prop="學群名稱" min-width="120" />
          <el-table-column label="學系" prop="學系名稱" min-width="160" />
          <el-table-column label="代碼" prop="完整代碼" width="110" align="center" />
          <el-table-column label="操作" width="110" align="center">
            <template #default="{ row }">
              <el-button
                size="small"
                :type="isSelected(row) ? 'info' : 'primary'"
                :disabled="!isPostRankingOpen || isSelected(row)"
                @click="handleAdd(row)"
              >
                {{ isSelected(row) ? "已選取" : "加入志願" }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 手機端：卡片清單（CSS 在 >768px 隱藏） -->
      <div class="mobile-card-list">
        <el-empty v-if="pagedResults.length === 0" description="沒有符合條件的科系" />
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
              :type="isSelected(dept) ? 'info' : 'primary'"
              :disabled="!isPostRankingOpen || isSelected(dept)"
              style="width: 100%"
              @click="handleAdd(dept)"
            >
              {{ isSelected(dept) ? "已選取" : "加入志願" }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分頁導航 -->
      <div v-if="displayList.length > pageSize" class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="displayList.length"
          :layout="isMobile ? 'prev, pager, next' : 'prev, pager, next, jumper, total'"
          :small="isMobile"
          background
        />
      </div>
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

const isPostRankingOpen = computed(() => preferencesStore.isPostRankingOpen())
const availableDepartments = computed(() => preferencesStore.availableDepartments)
const isDirty = computed(() => preferencesStore.isDirty)

// ============ RWD：isMobile（僅用於 el-pagination props） ============
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
const keyword = ref("")
const confirmedKeyword = ref("")
const currentPage = ref(1)
const pageSize = 10

function handleSearch() {
  const kw = keyword.value.trim()
  confirmedKeyword.value = kw
  currentPage.value = 1
}

function handleClear() {
  confirmedKeyword.value = ""
  currentPage.value = 1
}

watch(confirmedKeyword, () => {
  currentPage.value = 1
})

// ============ 過濾 + 分頁 ============

/** 在 availableDepartments 中依關鍵字過濾 */
const filteredDepts = computed(() => {
  const kw = confirmedKeyword.value.trim()
  if (!kw) return availableDepartments.value

  const keywords = kw.split(/\s+/).filter(Boolean)
  const filtered = availableDepartments.value.filter((d) => keywords.every((k) => d.搜尋文本.includes(k)))

  // 智慧排序：完整命中優先
  filtered.sort((a, b) => {
    const aExact = a.搜尋文本.includes(kw) ? 1 : 0
    const bExact = b.搜尋文本.includes(kw) ? 1 : 0
    return bExact - aExact
  })

  return filtered
})

/** 當前顯示的資料（有關鍵字時用過濾結果，否則用全部） */
const displayList = computed(() => filteredDepts.value)

/** 當頁資料 */
const pagedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return displayList.value.slice(start, start + pageSize)
})

// ============ 按鈕狀態 ============

function isSelected(dept) {
  return preferencesStore.checkPostRankingAddStatus(dept).status === "selected"
}

// ============ 加入防呆（簡化版：ok / selected only） ============

function handleAdd(dept) {
  const { status } = preferencesStore.checkPostRankingAddStatus(dept)

  if (status === "selected") return

  // status === 'ok'
  preferencesStore.addPostRankingPreference(dept)
  ElMessage.success(`已加入「${dept.學系名稱}」`)
}
</script>

<style scoped lang="scss">
.add-dept-page {
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
  .add-dept-page {
    padding: 12px;
  }

  .search-bar {
    flex-direction: column;

    .search-input {
      width: 100%;
    }

    .search-btn {
      width: 100%;
    }
  }

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
