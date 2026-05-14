const api = require('../../utils/api.js')
const app = getApp()

// 引入腾讯地图SDK
const QQMapWX = require('../../libs/qqmap-wx-jssdk.min.js')
const qqmapsdk = new QQMapWX({
  key: 'IPVBZ-PC46Z-BWFXB-T2RJ3-ADPZZ-EOBWC'
})

Page({
  data: {
    location: {
      name: '',
      latitude: null,
      longitude: null,
      address: ''
    },
    locationLoading: false,
    searchKeyword: '',
    searchResults: [],
    moods: [
      { value: 'happy', emoji: '😊', label: '开心' },
      { value: 'excited', emoji: '🤩', label: '兴奋' },
      { value: 'relaxed', emoji: '😌', label: '放松' },
      { value: 'tired', emoji: '😴', label: '疲惫' },
      { value: 'surprised', emoji: '😲', label: '惊喜' }
    ],
    selectedMood: '',
    content: '',
    images: [],
    submitting: false,
    // 地图相关
    markers: [],
    mapScale: 16,
    // 日期时间
    checkInDate: '',
    checkInTime: ''
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    // 初始化日期时间为当前时间
    this.initDateTime()
  },

  // 初始化日期时间
  initDateTime() {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    this.setData({
      checkInDate: date,
      checkInTime: time
    })
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ checkInDate: e.detail.value })
  },

  // 选择时间
  onTimeChange(e) {
    this.setData({ checkInTime: e.detail.value })
  },

  // 设置为当前日期时间
  setCurrentDateTime() {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    this.setData({
      checkInDate: date,
      checkInTime: time
    })
    wx.showToast({
      title: '已设置为当前时间',
      icon: 'none',
      duration: 1500
    })
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
    }
  },

  onReady() {
    // 获取地图上下文
    this.mapCtx = wx.createMapContext('locationMap')
  },

  // 获取当前位置 - 自动定位到用户当前位置
  getLocation() {
    this.setData({ locationLoading: true })

    // 先获取当前经纬度
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        console.log('当前位置:', res)
        const { latitude, longitude } = res

        // 使用逆地理编码获取地址名称
        this.reverseGeocode(latitude, longitude)
        wx.showToast({ title: '定位成功', icon: 'success' })
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        this.setData({ locationLoading: false })

        if (err.errMsg && err.errMsg.includes('auth')) {
          wx.showModal({
            title: '提示',
            content: '需要位置权限才能使用此功能',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({ title: '定位失败，请重试', icon: 'none' })
        }
      }
    })
  },

  // 更新位置信息
  updateLocation(latitude, longitude, name, address = '') {
    const marker = {
      id: 1,
      latitude: latitude,
      longitude: longitude,
      title: name
      // 不设置iconPath，使用默认标记
    }

    this.setData({
      'location.latitude': latitude,
      'location.longitude': longitude,
      'location.name': name,
      'location.address': address,
      markers: [marker],
      locationLoading: false
    })
  },

  // 设置地图中心
  setMapCenter(latitude, longitude) {
    this.setData({
      'location.latitude': latitude,
      'location.longitude': longitude
    })
  },

  // 搜索位置
  searchLocation() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }

    wx.showLoading({ title: '搜索中...' })

    // 获取当前城市限制（如果有位置）
    let region = ''
    if (this.data.location.latitude) {
      // 可以通过reverseGeocoder获取城市，这里简化处理
    }

    qqmapsdk.search({
      keyword: keyword,
      region: region,
      page_size: 20,
      success: (res) => {
        wx.hideLoading()
        console.log('搜索结果:', res)

        if (res.data && res.data.length > 0) {
          const results = res.data.map(item => ({
            id: item.id,
            title: item.title,
            address: item.address,
            latitude: item.location.lat,
            longitude: item.location.lng,
            category: item.category
          }))
          this.setData({ searchResults: results })
        } else {
          this.setData({ searchResults: [] })
          wx.showToast({ title: '未找到相关地点', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('搜索失败:', err)
        wx.showToast({ title: '搜索失败', icon: 'none' })
      }
    })
  },

  // 选择搜索结果
  selectLocation(e) {
    const item = e.currentTarget.dataset.item
    const { latitude, longitude, title, address } = item

    // 更新地图中心
    this.setMapCenter(latitude, longitude)

    // 更新位置信息
    this.updateLocation(latitude, longitude, title, address)

    // 清空搜索结果
    this.setData({
      searchResults: [],
      searchKeyword: ''
    })

    wx.showToast({ title: '已选择：' + title, icon: 'none' })
  },

  // 逆地理编码 - 将经纬度转换为地址
  reverseGeocode(latitude, longitude) {
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: (res) => {
        console.log('逆地理编码结果:', res)
        const info = res.result
        const address = info.address
        const name = info.formatted_addresses?.recommend || info.name || address

        this.updateLocation(latitude, longitude, name, address)
        this.setData({ locationLoading: false })
      },
      fail: (err) => {
        console.error('逆地理编码失败:', err)
        // 如果逆地理编码失败，使用默认名称
        this.updateLocation(latitude, longitude, '当前位置', '')
        this.setData({ locationLoading: false })
      }
    })
  },

  // 点击地图选择位置
  onMapTap(e) {
    const { latitude, longitude } = e.detail
    console.log('地图点击:', latitude, longitude)

    // 逆地理编码获取地址
    this.reverseGeocode(latitude, longitude)
  },

  // 地图视野变化结束
  onRegionChange(e) {
    if (e.type === 'end' && this.mapCtx) {
      // 可以在这里实现拖动结束后更新位置
      // 获取地图中心点需要调用getCenterLocation
      this.mapCtx.getCenterLocation({
        success: (res) => {
          console.log('地图中心:', res)
          // 可选：拖动结束后更新位置
          // this.reverseGeocode(res.latitude, res.longitude)
        }
      })
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  // 打开微信原生地图选择器（备用方案）
  openMapPicker() {
    wx.chooseLocation({
      success: (res) => {
        this.updateLocation(
          res.latitude,
          res.longitude,
          res.name || res.address || '所选位置',
          res.address
        )
      }
    })
  },

  // 打开地图查看位置
  openMap() {
    const { latitude, longitude, name } = this.data.location
    if (latitude && longitude) {
      wx.openLocation({
        latitude,
        longitude,
        name: name || '当前位置',
        scale: 16
      })
    } else {
      // 如果没有位置，打开地图选择器
      this.openMapPicker()
    }
  },

  // 选择心情
  selectMood(e) {
    this.setData({ selectedMood: e.currentTarget.dataset.mood })
  },

  // 输入内容
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath)
        this.setData({
          images: [...this.data.images, ...newImages]
        })
      }
    })
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    })
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  // 提交打卡
  async submit() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      // 组合日期和时间
      const checkInDateTime = `${this.data.checkInDate} ${this.data.checkInTime}`
      const formData = {
        content: this.data.content,
        mood: this.data.selectedMood,
        locationName: this.data.location.name,
        latitude: this.data.location.latitude,
        longitude: this.data.location.longitude,
        checkInTime: checkInDateTime
      }

      // 如果有图片，先上传图片
      if (this.data.images.length > 0) {
        for (let i = 0; i < this.data.images.length; i++) {
          await this.uploadFile(this.data.images[i], formData)
          if (i === this.data.images.length - 1) {
            // 最后一张图片上传成功，表示全部完成
            wx.showToast({ title: '打卡成功', icon: 'success' })
            this.resetForm()
            setTimeout(() => {
              wx.switchTab({ url: '/pages/history/history' })
            }, 1000)
          }
        }
      } else {
        // 没有图片，直接提交
        await api.createCheckIn(formData)
        wx.showToast({ title: '打卡成功', icon: 'success' })
        this.resetForm()
        setTimeout(() => {
          wx.switchTab({ url: '/pages/history/history' })
        }, 1000)
      }
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 上传文件
  uploadFile(filePath, formData) {
    return new Promise((resolve, reject) => {
      const token = app.globalData.token

      wx.uploadFile({
        url: app.globalData.baseUrl + '/api/check-in',
        filePath: filePath,
        name: 'images',
        formData: formData,
        header: {
          'Authorization': token ? 'Bearer ' + token : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 200) {
              resolve(data)
            } else {
              wx.showToast({ title: data.message || '上传失败', icon: 'none' })
              reject(data)
            }
          } catch (e) {
            reject(e)
          }
        },
        fail: (err) => {
          wx.showToast({ title: '上传失败', icon: 'none' })
          reject(err)
        }
      })
    })
  },

  // 重置表单
  resetForm() {
    this.setData({
      location: { name: '', latitude: null, longitude: null, address: '' },
      selectedMood: '',
      content: '',
      images: [],
      searchResults: [],
      searchKeyword: '',
      markers: []
    })
    // 重置日期时间为当前时间
    this.initDateTime()
  }
})
