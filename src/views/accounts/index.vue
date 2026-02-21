<template>
  <div class="app-container">
    <!-- 頁面標題 -->
    <el-card class="page-header" shadow="never">
      <div class="header-content">
        <h2>
          <el-icon class="header-icon">
            <User />
          </el-icon>
          學生退費帳戶資料管理
        </h2>
        <p class="header-description">請確實填寫您的郵局帳戶資料，以便後續相關作業使用</p>
      </div>
    </el-card>

    <!-- 載入中 -->
    <el-card v-if="loading" v-loading="loading" element-loading-text="載入中..." shadow="never" class="loading-card">
      <div style="height: 200px" />
    </el-card>

    <!-- 錯誤訊息 -->
    <el-alert v-if="error && !loading" :title="error" type="error" :closable="false" show-icon class="error-alert" />

    <!-- 主要內容 -->
    <div v-if="!loading && hasAccountData">
      <!-- 學生基本資料（唯讀） -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon>
                <InfoFilled />
              </el-icon>
              學生基本資料
            </span>
            <el-tag v-if="isModified" type="warning" effect="dark">
              <el-icon>
                <EditPen />
              </el-icon>
              已修改
            </el-tag>
            <el-tag v-else type="success" effect="plain">
              <el-icon>
                <Check />
              </el-icon>
              未修改
            </el-tag>
          </div>
        </template>

        <el-descriptions :column="descriptionsColumn" border>
          <el-descriptions-item label="學號" label-class-name="label-class">
            {{ editingAccount.stunum }}
          </el-descriptions-item>
          <el-descriptions-item label="學生姓名" label-class-name="label-class">
            {{ editingAccount.name }}
            <span v-if="isChief" class="chief-badge" @click="showOfficerStats">(總務股長點我)</span>
          </el-descriptions-item>
          <el-descriptions-item label="班級座號" label-class-name="label-class">
            {{ editingAccount.classnum }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 郵局帳戶資料（可編輯） -->
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon>
                <Postcard />
              </el-icon>
              帳戶資料(限使用郵局帳戶退費)
            </span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="editingAccount"
          :rules="formRules"
          :label-width="labelWidth"
          class="account-form"
        >
          <el-row :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item label="立帳郵局局號" prop="officenum">
                <el-input v-model="editingAccount.officenum" placeholder="請輸入7位數字" maxlength="7" clearable />
                <div class="form-tip">例如：0001234（郵局局號7位數）</div>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item label="郵局存簿帳號" prop="accountnum">
                <el-input v-model="editingAccount.accountnum" placeholder="請輸入7位數字" maxlength="7" clearable />
                <div class="form-tip">7位數字（含檢查碼）</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item label="郵局帳號戶名" prop="aownername">
                <el-input
                  v-model="editingAccount.aownername"
                  placeholder="請輸入戶名（需與郵局存簿完全相同）"
                  clearable
                />
                <div class="form-tip">請確保與郵局存簿上的戶名完全相同</div>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item label="戶名身分證字號" prop="aownerid">
                <el-input
                  v-model="editingAccount.aownerid"
                  placeholder="請輸入身分證字號"
                  maxlength="10"
                  clearable
                  style="text-transform: uppercase"
                />
                <div class="form-tip">格式：A123456789</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item label="戶名親屬關係" prop="aownerrelation">
                <el-select
                  v-model="editingAccount.aownerrelation"
                  placeholder="請選擇親屬關係"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in relationshipOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <div class="form-tip">請選戶名與您的關係，自己的帳戶就選「本人」，「其他」請於備註欄說明</div>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item label="備註" prop="remark">
                <el-input v-model="editingAccount.remark" placeholder="若親屬關係為「其他」，請在此說明" clearable />
                <div class="form-tip">原則上以直系親屬為主，「其他」須經校方同意才可退費</div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 聯絡資料（可編輯） -->
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon>
                <Phone />
              </el-icon>
              聯絡資料
            </span>
          </div>
        </template>

        <el-form
          ref="contactFormRef"
          :model="editingAccount"
          :rules="formRules"
          :label-width="labelWidth"
          class="account-form"
        >
          <el-row :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item label="學生電子郵件" prop="email">
                <el-input v-model="editingAccount.email" placeholder="請輸入電子郵件" clearable />
                <div class="form-tip">用於接收重要通知</div>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item label="學生手機號碼" prop="cellphone">
                <el-input v-model="editingAccount.cellphone" placeholder="請輸入手機號碼" maxlength="10" clearable />
                <div class="form-tip">格式：09開頭的10位數字</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="確認資料正確" prop="confirm">
                <el-checkbox v-model="editingAccount.confirm"> 我確認以上所填寫的資料皆為正確無誤 </el-checkbox>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 操作按鈕 -->
      <el-card shadow="never" class="action-card">
        <div class="action-buttons">
          <el-button type="primary" size="large" :loading="saving" :disabled="!canSaveWithConfirm" @click="handleSave">
            <el-icon v-if="!saving">
              <Check />
            </el-icon>
            {{ saving ? "儲存中..." : "儲存變更" }}
          </el-button>

          <el-button size="large" :disabled="!isModified || saving" @click="handleReset">
            <el-icon>
              <RefreshLeft />
            </el-icon>
            重置
          </el-button>
        </div>

        <el-alert
          v-if="isModified"
          title="您有未儲存的修改"
          type="warning"
          :closable="false"
          show-icon
          class="unsaved-alert"
        >
          <template #default> 請勾選確認後再儲存變更 </template>
        </el-alert>
      </el-card>

      <!-- 使用說明 -->
      <el-card shadow="never" class="help-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon>
                <QuestionFilled />
              </el-icon>
              填寫說明
            </span>
          </div>
        </template>

        <el-timeline>
          <el-timeline-item timestamp="步驟 1" placement="top">
            <el-card>
              <h4>正確填寫郵局帳戶資料</h4>
              <p>如果資料錯誤無法匯款，須等學校再辦理退費時才一併辦理，不得異議。</p>
            </el-card>
          </el-timeline-item>

          <el-timeline-item timestamp="步驟 2" placement="top">
            <el-card>
              <h4>填寫聯絡資料</h4>
              <p>請填寫您的電子郵件和手機號碼，以便學校聯繫</p>
            </el-card>
          </el-timeline-item>

          <el-timeline-item timestamp="步驟 3" placement="top">
            <el-card>
              <h4>確認並儲存</h4>
              <p>請勾選「確認資料正確」，然後點擊「儲存變更」按鈕</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <el-divider />

        <div class="help-tips">
          <h4>
            <el-icon>
              <WarnTriangleFilled />
            </el-icon>
            重要提醒
          </h4>
          <ul>
            <li>郵局帳號戶名必須與存簿上的戶名<strong>完全相同</strong></li>
            <li>若戶名非本人，請正確選擇親屬關係</li>
            <li>若親屬關係為「其他」，請在備註欄說明</li>
            <li>電子郵件和手機號碼將用於接收重要通知，請確實填寫</li>
            <li>資料填寫完成後，請務必勾選「確認資料正確」並點擊儲存</li>
          </ul>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { onBeforeRouteLeave } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { useAccountsStore } from "@/store/modules/accounts"
import { useUserStore } from "@/store/modules/user"
import { useResponsiveLabelWidth, useResponsiveColumns } from "@/hooks/useResponsive"
import { validatePostal7Digits, validateTaiwanID } from "@/utils/validators"
import {
  User,
  InfoFilled,
  EditPen,
  Check,
  Postcard,
  Phone,
  QuestionFilled,
  RefreshLeft,
  WarnTriangleFilled
} from "@element-plus/icons-vue"

// ========== Store ==========
const accountsStore = useAccountsStore()
const userStore = useUserStore()

const { relationshipOptions, editingAccount, loading, saving, error, hasAccountData, isModified, officerData } =
  storeToRefs(accountsStore)

// ========== 響應式設計 ==========
const labelWidth = useResponsiveLabelWidth({
  mobile: "100px",
  tablet: "120px",
  desktop: "150px"
})
const descriptionsColumn = useResponsiveColumns({
  mobile: 1,
  tablet: 2,
  desktop: 3
})

// ========== Refs ==========
const formRef = ref(null)
const contactFormRef = ref(null)

// ========== 表單驗證規則 ==========
const formRules = computed(() => ({
  officenum: [
    {
      pattern: /^\d{7}$/,
      message: "郵局局號應為7位數字",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback()
          return
        }
        if (!validatePostal7Digits(value)) {
          callback(new Error("局號檢查碼錯誤"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  accountnum: [
    {
      pattern: /^\d{7}$/,
      message: "郵局帳號應為7位數字",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback()
          return
        }
        if (!validatePostal7Digits(value)) {
          callback(new Error("帳號檢查碼錯誤"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  aownername: [
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback()
          return
        }
        // 檢查當親屬關係為「本人」時，戶名必須與學生姓名一致
        if (editingAccount.value?.aownerrelation === "本人") {
          if (value !== editingAccount.value?.name) {
            callback(new Error("選擇本人時，戶名必須與學生姓名一致"))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  aownerid: [
    {
      pattern: /^[A-Z][12]\d{8}$/,
      message: "身分證字號格式不正確",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback()
          return
        }
        const upperValue = value.toUpperCase()
        if (!validateTaiwanID(upperValue)) {
          callback(new Error("身分證檢查碼錯誤"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback()
          return
        }
        const upperValue = value.toUpperCase()
        const relation = editingAccount.value?.aownerrelation

        // 先確保通過基本格式檢查
        if (!validateTaiwanID(upperValue)) {
          callback()
          return
        }

        // 檢查本人身分證字號
        if (relation === "本人") {
          if (upperValue !== userStore.nationalId?.toUpperCase()) {
            callback(new Error("選擇本人時，身分證字號必須與學生本人一致"))
            return
          }
        }

        // 檢查性別（第二碼）
        const genderCode = upperValue.charAt(1)

        // 男性長輩：父親、祖父、外祖父
        const maleRelations = ["父親", "祖父", "外祖父"]
        if (maleRelations.includes(relation)) {
          if (genderCode !== "1") {
            callback(new Error("親屬關係為男性長輩，身分證字號第二碼應為 1"))
            return
          }
        }

        // 女性長輩：母親、祖母、外祖母
        const femaleRelations = ["母親", "祖母", "外祖母"]
        if (femaleRelations.includes(relation)) {
          if (genderCode !== "2") {
            callback(new Error("親屬關係為女性長輩，身分證字號第二碼應為 2"))
            return
          }
        }

        callback()
      },
      trigger: "blur"
    }
  ],
  email: [
    {
      type: "email",
      message: "電子郵件格式不正確",
      trigger: "blur"
    }
  ],
  cellphone: [
    {
      pattern: /^09\d{8}$/,
      message: "手機號碼應為09開頭的10位數字",
      trigger: "blur"
    }
  ]
}))

// ========== 監聽資料變更 ==========

/**
 * 監聽可編輯欄位的變更
 * 當任何欄位被修改時，自動取消「確認資料正確」的勾選
 */
const isInitialLoad = ref(true) // 標記是否為初次載入

// 監聽所有可編輯欄位
watch(
  () => [
    editingAccount.value?.officenum,
    editingAccount.value?.accountnum,
    editingAccount.value?.aownername,
    editingAccount.value?.aownerid,
    editingAccount.value?.aownerrelation,
    editingAccount.value?.email,
    editingAccount.value?.cellphone,
    editingAccount.value?.remark
  ],
  () => {
    // 初次載入時不處理
    if (isInitialLoad.value) {
      isInitialLoad.value = false
      return
    }

    // 如果目前是已確認狀態，則自動取消確認（不顯示訊息）
    if (editingAccount.value?.confirm === true) {
      editingAccount.value.confirm = false
    }
  }
)

/**
 * 監聽親屬關係變更，自動重新驗證相關欄位
 * 當親屬關係改變時，身分證和戶名的驗證規則也會改變，
 * 因此需要重新驗證這些欄位以即時更新錯誤提示
 */
watch(
  () => editingAccount.value?.aownerrelation,
  (newValue, oldValue) => {
    // 初次載入時不處理
    if (isInitialLoad.value || !formRef.value) {
      return
    }

    // 只在親屬關係實際改變時才觸發驗證
    if (newValue !== oldValue) {
      // 使用 nextTick 確保 DOM 更新完成後再進行驗證
      nextTick(() => {
        // 重新驗證身分證字號和戶名欄位
        formRef.value?.validateField(["aownerid", "aownername"], () => {})
      })
    }
  }
)

// ========== 儲存按鈕邏輯 ==========

/**
 * 是否可以儲存
 * 條件：有資料修改 且 已確認
 */
const canSaveWithConfirm = computed(() => {
  return isModified.value && editingAccount.value?.confirm === true && !saving.value
})

// ========== 方法 ==========

/**
 * 載入帳戶資料
 */
const loadData = async () => {
  const stunum = userStore.username

  if (!stunum) {
    ElMessage.error("無法取得學號，請重新登入")
    return
  }

  // 重置初次載入標記
  isInitialLoad.value = true

  const response = await accountsStore.loadAccountData(stunum)

  if (response.code !== 0) {
    ElMessage.error(response.msg)
  } else {
    // 如果是總務股長，載入統計資料
    if (userStore.roles && userStore.roles.includes("chief")) {
      await accountsStore.fetchOfficerStatus(stunum, userStore.roles)
    }
  }
}

/**
 * 檢查是否為總務股長
 */
const isChief = computed(() => {
  return userStore.roles && userStore.roles.includes("chief")
})

/**
 * 顯示總務股長統計
 */
const showOfficerStats = async () => {
  // 先顯示載入中
  const loadingInstance = ElMessage({
    message: "載入統計資料中...",
    type: "info",
    duration: 0
  })

  try {
    // 重新載入統計資料
    const stunum = userStore.username
    const result = await accountsStore.fetchOfficerStatus(stunum, userStore.roles)

    loadingInstance.close()

    console.log("統計資料結果：", result)
    console.log("officerData:", officerData.value)

    if (!officerData.value) {
      ElMessage.error("無法取得統計資料，請確認您是否為總務股長")
      return
    }

    const { totalCount, completedCount, uncompletedList } = officerData.value

    // 檢查是否全部填寫完畢
    if (uncompletedList.length === 0) {
      ElMessageBox.alert("貴班已經填寫完畢，感謝總務股長的辛勞!", "班級填報統計", {
        confirmButtonText: "確定",
        type: "success"
      })
      return
    }

    // 建立未填寫名單的 HTML
    let uncompletedHTML = `
      <div style="text-align: left; padding: 10px; max-height: 50vh; overflow-y: auto;">
        <p><strong>應填人數：</strong>${totalCount} 人</p>
        <p><strong>已填人數：</strong>${completedCount} 人</p>
        <p><strong>尚未填寫的同學：</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
    `

    uncompletedList.forEach((student) => {
      uncompletedHTML += `<li>${student.seat} ${student.name}</li>`
    })

    uncompletedHTML += `
        </ul>
      </div>
    `

    ElMessageBox.alert(uncompletedHTML, "班級填報統計", {
      confirmButtonText: "確定",
      dangerouslyUseHTMLString: true,
      type: "info"
    })
  } catch (error) {
    loadingInstance.close()
    console.error("取得統計資料失敗：", error)
    ElMessage.error("取得統計資料失敗：" + (error.message || "未知錯誤"))
  }
}

/**
 * 儲存變更
 */
const handleSave = async () => {
  // 驗證所有表單
  let valid = true

  if (formRef.value) {
    await formRef.value.validate((isValid) => {
      if (!isValid) valid = false
    })
  }

  if (contactFormRef.value) {
    await contactFormRef.value.validate((isValid) => {
      if (!isValid) valid = false
    })
  }

  if (!valid) {
    ElMessage.warning("請檢查表單中的錯誤")
    return
  }

  // 檢查是否已確認資料正確
  if (!editingAccount.value.confirm) {
    ElMessage.warning("請勾選「確認資料正確」後再儲存")
    return
  }

  // 儲存資料
  const response = await accountsStore.saveAccount()

  if (response.code === 0) {
    ElMessage.success("儲存成功！")

    // 清除表單驗證狀態
    if (formRef.value) formRef.value.clearValidate()
    if (contactFormRef.value) contactFormRef.value.clearValidate()
  } else {
    ElMessage.error(response.msg || "儲存失敗")
  }
}

/**
 * 重置表單
 */
const handleReset = () => {
  ElMessageBox.confirm("確定要放棄所有變更，恢復到原始狀態嗎？", "確認重置", {
    type: "warning",
    confirmButtonText: "確定",
    cancelButtonText: "取消"
  })
    .then(() => {
      // 重置初次載入標記，避免 watch 觸發
      isInitialLoad.value = true

      accountsStore.resetForm()

      // 清除表單驗證狀態
      if (formRef.value) formRef.value.clearValidate()
      if (contactFormRef.value) contactFormRef.value.clearValidate()

      ElMessage.success("已恢復到原始狀態")
    })
    .catch(() => {
      // 取消操作
    })
}

/**
 * 離開頁面前提醒
 */
onBeforeRouteLeave((to, from, next) => {
  if (isModified.value) {
    ElMessageBox.confirm("您有未儲存的修改，確定要離開嗎？", "確認離開", {
      type: "warning",
      confirmButtonText: "確定離開",
      cancelButtonText: "取消"
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

/**
 * 頁面刷新前提醒
 */
const handleBeforeUnload = (e) => {
  if (isModified.value) {
    e.preventDefault()
    e.returnValue = ""
  }
}

// ========== 生命週期 ==========
onMounted(async () => {
  // 載入親屬關係選項
  await accountsStore.fetchRelationshipOptions()

  // 載入帳戶資料
  await loadData()

  // 監聽頁面刷新
  window.addEventListener("beforeunload", handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload)
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden; // 防止水平滾動
}

.page-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-left: 4px solid #4169e1;

  .header-content {
    h2 {
      margin: 0;
      display: flex;
      align-items: center;
      font-size: 24px;
      color: #2c3e50;

      .header-icon {
        margin-right: 10px;
        font-size: 28px;
        color: #4169e1;
      }
    }

    .header-description {
      margin: 10px 0 0 0;
      color: #5a6c7d;
      font-size: 14px;
    }
  }
}

.loading-card {
  margin-bottom: 20px;
}

.error-alert {
  margin-bottom: 20px;
}

.info-card,
.form-card,
.action-card,
.help-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4169e1;
  }
}

:deep(.label-class) {
  font-weight: 600;
  background-color: #f5f7fa;
}

.chief-badge {
  margin-left: 8px;
  color: #4169e1;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;

  &:hover {
    color: #5a7ee1;
    text-decoration: underline;
  }
}

.account-form {
  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }

  // 手機上表單項目優化
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  // 手機上 label 換行顯示
  :deep(.el-form-item__label) {
    white-space: normal;
    word-break: break-word;
    line-height: 1.4;
  }
}

.action-card {
  .action-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .unsaved-alert {
    margin-top: 16px;
  }
}

.help-card {
  .help-tips {
    h4 {
      margin-top: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #e6a23c;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 8px;
        line-height: 1.6;
        color: #606266;

        strong {
          color: #f56c6c;
        }
      }
    }
  }
}

// 手機和平板直向樣式優化（< 768px 強制單列）
@media screen and (max-width: 767.98px) {
  .account-form {
    :deep(.el-row) {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    :deep(.el-col) {
      padding-left: 0 !important;
      padding-right: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      flex: 0 0 100% !important;
    }
  }
}

// 手機端樣式優化
@media screen and (max-width: 575.98px) {
  .app-container {
    padding: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .page-header {
    margin-left: 0;
    margin-right: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;

    .header-content {
      h2 {
        font-size: 18px;
        flex-wrap: wrap;

        .header-icon {
          font-size: 20px;
          margin-right: 8px;
        }
      }

      .header-description {
        font-size: 13px;
      }
    }
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    .card-title {
      font-size: 14px;
    }
  }

  // 手機上 descriptions 單列顯示
  :deep(.el-descriptions) {
    .el-descriptions__table {
      display: block;

      tbody {
        display: block;
      }

      tr {
        display: block;
        margin-bottom: 8px;
        border-bottom: 1px solid #ebeef5;
      }

      .el-descriptions__label {
        display: block;
        width: 100% !important;
        padding-bottom: 4px;
        font-weight: 600;
      }

      .el-descriptions__content {
        display: block;
        width: 100% !important;
        padding-left: 0;
      }
    }
  }

  // 確保卡片不會溢出
  .info-card,
  .form-card,
  .action-card,
  .help-card {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 1px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
    box-sizing: border-box;

    :deep(.el-card__body) {
      padding: 15px 12px;
      width: 100%;
      box-sizing: border-box;
    }
  }

  // 手機上表單優化
  .account-form {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;

    :deep(.el-row) {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    :deep(.el-col) {
      padding-left: 0 !important;
      padding-right: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      flex: 0 0 100% !important;
    }

    :deep(.el-form-item) {
      width: 100%;
      margin-right: 0;
      margin-bottom: 18px;
      box-sizing: border-box;
    }

    :deep(.el-form-item__label) {
      width: 100% !important;
      text-align: left;
      padding-bottom: 4px;
      margin-bottom: 4px;
      margin-left: 0 !important;
      white-space: normal;
      word-break: break-word;
      line-height: 1.4;
    }

    :deep(.el-form-item__content) {
      margin-left: 0 !important;
      width: 100% !important;
      box-sizing: border-box;
    }

    :deep(.el-input),
    :deep(.el-select),
    :deep(.el-textarea) {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box;
    }

    :deep(.el-select) {
      .el-input {
        width: 100% !important;
      }
    }
  }

  .action-card .action-buttons {
    flex-direction: column;
    width: 100%;

    .el-button {
      width: 100%;
      margin-left: 0;
      margin-right: 0;
    }
  }
}

// 平板和手機共用樣式
@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }

  .action-card .action-buttons {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
