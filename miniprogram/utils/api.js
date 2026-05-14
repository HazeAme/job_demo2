const request = require('./request.js')

module.exports = {
  // 用户模块
  login: (data) => request.post('/api/user/login', data),
  register: (data) => request.post('/api/user/register', data),

  // 打卡模块
  createCheckIn: (data, images) => {
    // 如果有图片，使用uploadFile
    if (images && images.length > 0) {
      return new Promise((resolve, reject) => {
        const app = getApp()
        const token = app.globalData.token

        wx.uploadFile({
          url: app.globalData.baseUrl + '/api/check-in',
          filePath: images[0],
          name: 'images',
          formData: data,
          header: {
            'Authorization': token ? 'Bearer ' + token : ''
          },
          success: (res) => {
            const result = JSON.parse(res.data)
            if (result.code === 200) {
              resolve(result)
            } else {
              wx.showToast({ title: result.message || '提交失败', icon: 'none' })
              reject(result)
            }
          },
          fail: reject
        })
      })
    }
    return request.post('/api/check-in', data, 'application/x-www-form-urlencoded')
  },
  getCheckInList: (params) => {
    // 支持两种调用方式：
    // 1. 传入对象 { page, size, keyword, mood }
    // 2. 传入 page, size 两个参数（兼容旧代码）
    if (typeof params === 'object') {
      return request.get('/api/check-in/list', params)
    }
    return request.get('/api/check-in/list', { page: params, size: arguments[1] || 10 })
  },
  getCheckInDetail: (id) => request.get(`/api/check-in/${id}`),

  // 统计模块
  getStatistics: () => request.get('/api/statistics')
}