<script setup>
import { useRouter } from "vue-router"
import { useUserStore } from "@/store/modules/user"
import { CircleCheckFilled } from "@element-plus/icons-vue"

const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
  userStore.logout()
  router.push("/dashboard")
}

/** 遮罩身分證字號，只顯示頭尾各一碼 */
const maskedNationalId = (id) => {
  if (!id || id.length < 3) return id
  return id[0] + "*".repeat(id.length - 2) + id[id.length - 1]
}
</script>

<template>
  <div class="success-container">
    <div class="success-card">
      <el-icon class="check-icon" :size="64" color="#67c23a">
        <CircleCheckFilled />
      </el-icon>
      <h1 class="title">登入成功</h1>

      <el-descriptions :column="1" border class="user-info">
        <el-descriptions-item label="姓名">
          <strong>{{ userStore.displayName || "—" }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="學號">
          {{ userStore.username || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="身分證字號">
          {{ maskedNationalId(userStore.nationalId) || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-for="role in userStore.roles" :key="role" type="primary" style="margin-right: 4px">
            {{ role }}
          </el-tag>
          <span v-if="!userStore.roles?.length">—</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-button type="danger" plain size="large" class="logout-btn" @click="handleLogout"> 登出 </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #e6e6fa 0%, #d8bfd8 100%);
  padding: 20px;
  box-sizing: border-box;
}

.success-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 50px 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 480px;

  .check-icon {
    animation: pop-in 0.4s ease-out;
  }

  .title {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #303133;
  }

  .user-info {
    width: 100%;
  }

  .logout-btn {
    width: 180px;
    height: 44px;
    font-size: 15px;
  }
}

@keyframes pop-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  80% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
