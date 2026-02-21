<script setup>
import { useRouter } from "vue-router"

const router = useRouter()

const goToLogin = () => {
  router.push("/login")
}
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-content">
      <img src="@/assets/layouts/logo-text-2.png" alt="Logo" class="logo" />
      <h1 class="title">歡迎使用系統</h1>
      <p class="subtitle">請登入以繼續使用</p>
      <el-button type="primary" size="large" class="login-btn" @click="goToLogin"> 登入 </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #e6e6fa 0%, #d8bfd8 100%);
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 60px 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

  .logo {
    max-height: 80px;
    max-width: 240px;
  }

  .title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #303133;
  }

  .subtitle {
    margin: 0;
    font-size: 15px;
    color: #909399;
  }

  .login-btn {
    width: 180px;
    height: 44px;
    font-size: 16px;
    margin-top: 8px;
  }
}
</style>
