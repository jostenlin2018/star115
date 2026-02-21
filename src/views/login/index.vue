<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/store/modules/user"
import { User, Lock } from "@element-plus/icons-vue"

const router = useRouter()

/** 登录表单元素的引用 */
const loginFormRef = ref(null)

/** 登录按钮 Loading */
const loading = ref(false)

/** 登录表单数据 */
const loginFormData = reactive({
  username: "",
  password: ""
})

/** 登录表单校验规则 */
const loginFormRules = {
  username: [{ required: true, message: "請輸入學號", trigger: "blur" }],
  password: [{ required: true, message: "請輸入身分證字號", trigger: "blur" }]
}

/** 手機直向媒體偵測，必要時以行內樣式強制覆寫 */
const isMobilePortrait = ref(false)
const updateMobilePortrait = () => {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    isMobilePortrait.value = window.matchMedia("(max-width: 575px) and (orientation: portrait)").matches
  }
}

onMounted(() => {
  updateMobilePortrait()
  window.addEventListener("resize", updateMobilePortrait)
  window.addEventListener("orientationchange", updateMobilePortrait)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateMobilePortrait)
  window.removeEventListener("orientationchange", updateMobilePortrait)
})

const mobileContainerStyle = computed(() => {
  if (!isMobilePortrait.value) return {}
  return {
    position: "relative",
    padding: "0",
    margin: "0",
    background: "#e6e6fa"
  }
})

const mobileCardStyle = computed(() => {
  if (!isMobilePortrait.value) return {}
  return {
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: "90%",
    minWidth: "90%",
    margin: "0"
  }
})

/** 登录逻辑 */
const handleLogin = () => {
  loginFormRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true
      useUserStore()
        .login(loginFormData)
        .then(() => {
          router.push({ path: "/success" })
        })
        .catch(() => {
          loginFormData.password = ""
        })
        .finally(() => {
          loading.value = false
        })
    }
  })
}
</script>

<template>
  <div class="login-container" :style="mobileContainerStyle">
    <el-card class="login-card" shadow="hover" :style="mobileCardStyle">
      <template #header>
        <div class="card-header">
          <img src="@/assets/layouts/logo-text-2.png" alt="Logo" class="logo" />
          <h2>繁星推薦志願選填</h2>
        </div>
      </template>

      <el-form ref="loginFormRef" :model="loginFormData" :rules="loginFormRules" label-position="top" size="large">
        <el-form-item label="帳號" prop="username">
          <el-input
            v-model.trim="loginFormData.username"
            placeholder="請輸入學號"
            :prefix-icon="User"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item label="密碼" prop="password">
          <el-input
            v-model.trim="loginFormData.password"
            type="password"
            placeholder="請輸入身分證字號"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            {{ loading ? "登入中..." : "登入" }}
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="login-tips">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <div style="font-size: 13px">請使用您的學號和身分證字號登入系統</div>
          </template>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #e6e6fa 0%, #d8bfd8 100%);
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 675px;

  .card-header {
    text-align: center;

    .logo {
      max-height: 60px;
      max-width: 200px;
      margin-bottom: 10px;
    }

    h2 {
      margin: 10px 0 0 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }
  }

  :deep(.el-card__header) {
    padding: 30px 30px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-card__body) {
    padding: 30px;
  }

  .login-tips {
    margin-top: 10px;
  }
}

/* 平板 (768px - 1024px) */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  .login-card {
    max-width: 630px;
  }
}

/* 手機橫向 (< 768px landscape) */
@media screen and (max-width: 767px) and (orientation: landscape) {
  .login-container {
    padding: 15px;
  }

  .login-card {
    max-width: 600px;

    :deep(.el-card__header) {
      padding: 20px 25px 15px;
    }

    :deep(.el-card__body) {
      padding: 20px 25px;
    }

    .card-header {
      .logo {
        max-height: 50px;
      }

      h2 {
        font-size: 20px;
      }
    }
  }
}

/* 手機直向 (< 576px portrait) */
@media screen and (max-width: 575px) and (orientation: portrait) {
  .login-container {
    position: relative !important;
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #e6e6fa !important;
  }

  .login-card {
    position: absolute !important;
    top: 10px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 90% !important;
    max-width: 90% !important;
    min-width: 90% !important;
    margin: 0 !important;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    :deep(.el-card__header) {
      padding: 25px 20px 20px;
    }

    :deep(.el-card__body) {
      padding: 20px;
    }

    .card-header {
      .logo {
        max-height: 50px;
      }

      h2 {
        font-size: 22px;
      }
    }
  }
}

/* 極小螢幕 (< 360px) */
@media screen and (max-width: 359px) {
  .login-card {
    width: 94% !important;
    max-width: 94% !important;
    min-width: 86% !important;

    :deep(.el-card__header) {
      padding: 20px 15px 15px;
    }

    :deep(.el-card__body) {
      padding: 15px;
    }

    .card-header {
      .logo {
        max-height: 45px;
      }

      h2 {
        font-size: 20px;
      }
    }
  }
}
</style>
