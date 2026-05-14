<template>
  <div class="layout-container">
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <span class="logo-icon">🧭</span>
          <span class="title">旅行打卡</span>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container class="main-container">
        <el-aside width="200px" class="layout-aside">
          <el-menu
            :default-active="$route.path"
            router
            class="layout-menu"
          >
            <el-menu-item index="/checkin">
              <el-icon><EditPen /></el-icon>
              <span>打卡</span>
            </el-menu-item>
            <el-menu-item index="/history">
              <el-icon><Clock /></el-icon>
              <span>历史记录</span>
            </el-menu-item>
            <el-menu-item index="/statistics">
              <el-icon><TrendCharts /></el-icon>
              <span>数据统计</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="layout-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled, ArrowDown, SwitchButton,
  EditPen, Clock, TrendCharts
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.layout-header {
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(23, 100, 92, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left .logo-icon {
  font-size: 26px;
}

.header-left .title {
  font-size: 20px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #fff;
  padding: 5px 10px;
  border-radius: 20px;
  transition: background 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.15);
}

.username {
  font-size: 14px;
}

.main-container {
  height: calc(100vh - 60px);
}

.layout-aside {
  background: rgba(255, 255, 255, 0.6);
  border-right: 1px solid rgba(23, 100, 92, 0.08);
}

.layout-menu {
  border-right: none;
  background: transparent !important;
}

.layout-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  font-size: 15px;
  color: #355f59;
  margin: 4px 12px;
  border-radius: 12px;
}

.layout-menu :deep(.el-menu-item:hover) {
  background: rgba(23, 100, 92, 0.08) !important;
  color: #17645c !important;
}

.layout-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%) !important;
  color: #fff !important;
  font-weight: 700;
}

.layout-main {
  padding: 24px;
  overflow-y: auto;
}
</style>
