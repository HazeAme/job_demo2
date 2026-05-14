// index.js
Page({
  data: {

  },
  onLoad() {
    // 检查登录状态，如果已登录跳转到打卡页
    const app = getApp()
    if (app.globalData.token) {
      wx.switchTab({ url: '/pages/checkin/checkin' })
    } else {
      wx.redirectTo({ url: '/pages/login/login' })
    }
  }
})