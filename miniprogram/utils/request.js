const app = getApp()

// 封装请求
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token

    wx.request({
      url: app.globalData.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': options.contentType || 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data)
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          app.globalData.token = null
          app.globalData.userInfo = null
          wx.showToast({
            title: '登录已过期',
            icon: 'none'
          })
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/login/login' })
          }, 1500)
          reject(res)
        } else {
          console.error('请求失败:', res.statusCode, res.data)
          wx.showToast({
            title: '网络错误 ' + res.statusCode,
            icon: 'none'
          })
          reject(res)
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = {
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data, contentType) => request({ url, method: 'POST', data, contentType }),
  upload: (url, filePath, formData = {}) => {
    return new Promise((resolve, reject) => {
      const token = app.globalData.token

      wx.uploadFile({
        url: app.globalData.baseUrl + url,
        filePath: filePath,
        name: 'images',
        formData: formData,
        header: {
          'Authorization': token ? 'Bearer ' + token : ''
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
            reject(data)
          }
        },
        fail: reject
      })
    })
  }
}