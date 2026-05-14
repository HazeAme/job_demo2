const api = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    activeTab: 'login',
    loading: false,
    loginForm: {
      username: '',
      password: ''
    },
    registerForm: {
      username: '',
      password: '',
      confirmPassword: ''
    }
  },

  onLoad() {
    // 如果已登录，跳转到首页
    if (app.globalData.token) {
      wx.switchTab({ url: '/pages/checkin/checkin' })
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  onLoginUsernameInput(e) {
    this.setData({ 'loginForm.username': e.detail.value })
  },

  onLoginPasswordInput(e) {
    this.setData({ 'loginForm.password': e.detail.value })
  },

  onRegisterUsernameInput(e) {
    this.setData({ 'registerForm.username': e.detail.value })
  },

  onRegisterPasswordInput(e) {
    this.setData({ 'registerForm.password': e.detail.value })
  },

  onRegisterConfirmPasswordInput(e) {
    this.setData({ 'registerForm.confirmPassword': e.detail.value })
  },

  async handleLogin() {
    const { username, password } = this.data.loginForm
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await api.login({ username, password })
      app.globalData.token = res.data.token
      app.globalData.userInfo = { id: res.data.id, username: res.data.username }
      wx.setStorageSync('token', res.data.token)
      wx.setStorageSync('userInfo', app.globalData.userInfo)

      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/checkin/checkin' })
      }, 1000)
    } catch (error) {
      console.error(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  async handleRegister() {
    const { username, password, confirmPassword } = this.data.registerForm
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await api.register({ username, password })
      app.globalData.token = res.data.token
      app.globalData.userInfo = { id: res.data.id, username: res.data.username }
      wx.setStorageSync('token', res.data.token)
      wx.setStorageSync('userInfo', app.globalData.userInfo)

      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/checkin/checkin' })
      }, 1000)
    } catch (error) {
      console.error(error)
    } finally {
      this.setData({ loading: false })
    }
  }
})