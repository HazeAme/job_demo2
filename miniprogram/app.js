App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:8080'
  },

  onLaunch() {
    // 从本地存储读取token
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
  }
})