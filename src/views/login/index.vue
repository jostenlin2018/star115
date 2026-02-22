<script setup>
import { reactive, ref } from "vue"
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
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
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
/* ====== 基礎樣式（桌面） ====== */
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
  max-width: 500px;
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 30px 30px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-card__body) {
    padding: 30px;
  }

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

  .login-tips {
    margin-top: 10px;
  }
}

/* 平板 (768px - 1024px) */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  .login-card {
    max-width: 480px;
  }
}

/* ====== 手機橫向（<= 767px landscape） ====== */
@media screen and (max-width: 767px) and (orientation: landscape) {
  .login-container {
    padding: 12px;
    justify-content: flex-start;
  }

  .login-card {
    max-width: 520px;

    :deep(.el-card__header) {
      padding: 14px 24px 12px;
    }

    :deep(.el-card__body) {
      padding: 16px 24px;
    }

    .card-header {
      .logo {
        max-height: 38px;
      }

      h2 {
        font-size: 18px;
        margin-top: 4px;
      }
    }
  }
}

/* ====== 手機直向（<= 575px portrait） ====== */
@media screen and (max-width: 575px) and (orientation: portrait) {
  .login-container {
    padding: 0;
    align-items: center;
    justify-content: flex-start;
  }

  .login-card {
    width: 90%;
    max-width: 90%;
    min-width: 90%;
    margin-top: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

    :deep(.el-card__header) {
      padding: 24px 20px 18px;
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

/* ====== 極小螢幕（<= 359px） ====== */
@media screen and (max-width: 359px) {
  .login-card {
    width: 94%;
    max-width: 94%;
    min-width: 86%;

    :deep(.el-card__header) {
      padding: 20px 15px 14px;
    }

    :deep(.el-card__body) {
      padding: 16px 14px;
    }

    .card-header {
      .logo {
        max-height: 44px;
      }

      h2 {
        font-size: 20px;
      }
    }
  }
}
</style>
