<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <span class="logo-emoji">🧭</span>
        <h1>旅行打卡</h1>
        <p>记录你的每一次旅程</p>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button
              size="large"
              class="submit-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" :rules="rules" ref="registerFormRef">
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="密码"
                :prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="确认密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            <el-button
              size="large"
              class="submit-btn"
              :loading="loading"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('login')
const loading = ref(false)
const loginFormRef = ref()
const registerFormRef = ref()

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate()

  loading.value = true
  try {
    const res: any = await userApi.login({
      username: loginForm.username,
      password: loginForm.password
    })
    userStore.setToken(res.data.token)
    userStore.setUserInfo({
      id: res.data.id,
      username: res.data.username
    })
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate()

  loading.value = true
  try {
    const res: any = await userApi.register({
      username: registerForm.username,
      password: registerForm.password
    })
    userStore.setToken(res.data.token)
    userStore.setUserInfo({
      id: res.data.id,
      username: res.data.username
    })
    ElMessage.success('注册成功')
    router.push('/')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(29, 157, 142, 0.1), transparent 30%),
    radial-gradient(circle at right 20%, rgba(198, 156, 74, 0.1), transparent 25%),
    linear-gradient(180deg, #f8f7f2 0%, #eef5f2 46%, #f5f4ef 100%);
  padding: 20px;
}

.login-box {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 250, 248, 0.98) 100%);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(23, 100, 92, 0.08);
  box-shadow: 0 16px 48px rgba(23, 100, 92, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-emoji {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 900;
  color: #0f3f39;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.login-header p {
  color: #7d8d89;
  font-size: 14px;
}

.login-tabs :deep(.el-tabs__nav) {
  width: 100%;
}

.login-tabs :deep(.el-tabs__item) {
  width: 50%;
  text-align: center;
  font-size: 16px;
  color: #7d8d89;
  font-weight: 500;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: #17645c;
  font-weight: 700;
}

.login-tabs :deep(.el-tabs__active-bar) {
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
  border: none;
  height: 48px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(23, 100, 92, 0.25);
  transition: all 0.2s;
}

.submit-btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(23, 100, 92, 0.3);
}

.submit-btn:active {
  transform: translateY(1px);
  box-shadow: 0 4px 12px rgba(23, 100, 92, 0.2);
}
</style>
