const api = require('../../utils/api.js')
const app = getApp()

const moodMap = {
  happy: '😊',
  excited: '🤩',
  relaxed: '😌',
  tired: '😴',
  surprised: '😲'
}

Page({
  data: {
    checkInList: [],
    loading: false,
    page: 1,
    size: 10,
    total: 0,
    hasMore: true,
    searchKeyword: '',
    selectedMood: '',
    moods: [
      { value: 'happy', emoji: '😊', label: '开心' },
      { value: 'excited', emoji: '🤩', label: '兴奋' },
      { value: 'relaxed', emoji: '😌', label: '放松' },
      { value: 'tired', emoji: '😴', label: '疲惫' },
      { value: 'surprised', emoji: '😲', label: '惊喜' }
    ],
    // 日期筛选 - 默认为空，不筛选
    startDate: '',
    endDate: ''
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    // 设置默认日期为今天，用于picker组件
    const today = this.formatDate(new Date())
    this.setData({
      defaultDate: today
    })
    this.loadData()
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  onShow() {
    if (app.globalData.token) {
      this.setData({ page: 1, checkInList: [] })
      this.loadData()
    }
  },

  async loadData() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const params = {
        page: this.data.page,
        size: this.data.size
      }
      // 只在有值时添加参数
      if (this.data.searchKeyword && this.data.searchKeyword.trim()) {
        params.keyword = this.data.searchKeyword.trim()
      }
      if (this.data.selectedMood) {
        params.mood = this.data.selectedMood
      }
      if (this.data.startDate) {
        params.startDate = this.data.startDate
      }
      if (this.data.endDate) {
        params.endDate = this.data.endDate
      }

      console.log('请求参数:', params)
      const res = await api.getCheckInList(params)
      console.log('响应结果:', res)

      let list = res.data.list || []

      // 处理图片URL，将相对路径转为完整URL
      list = list.map(item => {
        if (item.images && Array.isArray(item.images)) {
          item.images = item.images.map(img => {
            if (img && img.startsWith('/uploads/')) {
              return app.globalData.baseUrl + img
            }
            return img
          })
        }
        return item
      })

      this.setData({
        checkInList: this.data.page === 1 ? list : [...this.data.checkInList, ...list],
        total: res.data.total || 0,
        loading: false,
        hasMore: list.length === this.data.size
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      this.setData({ loading: false })
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  // 执行搜索
  doSearch() {
    this.setData({ page: 1, checkInList: [] })
    this.loadData()
  },

  // 清除搜索
  clearSearch() {
    this.setData({ searchKeyword: '', page: 1, checkInList: [] })
    this.loadData()
  },

  // 选择开始日期
  onStartDateChange(e) {
    console.log('开始日期选择事件:', e.detail)
    const startDate = e.detail.value
    console.log('选择的开始日期:', startDate)
    this.setData({ startDate, page: 1, checkInList: [] }, () => {
      console.log('开始日期已更新到data:', this.data.startDate)
      this.loadData()
    })
  },

  // 选择结束日期
  onEndDateChange(e) {
    console.log('结束日期选择事件:', e.detail)
    const endDate = e.detail.value
    console.log('选择的结束日期:', endDate)
    this.setData({ endDate, page: 1, checkInList: [] }, () => {
      console.log('结束日期已更新到data:', this.data.endDate)
      this.loadData()
    })
  },

  // 清除日期筛选
  clearDateFilter() {
    this.setData({ startDate: '', endDate: '', page: 1, checkInList: [] })
    this.loadData()
  },

  // 按心情筛选
  filterByMood(e) {
    const mood = e.currentTarget.dataset.mood
    this.setData({ selectedMood: mood, page: 1, checkInList: [] })
    this.loadData()
  },

  // 清除所有筛选
  clearAllFilters() {
    this.setData({
      searchKeyword: '',
      selectedMood: '',
      startDate: '',
      endDate: '',
      page: 1,
      checkInList: []
    })
    this.loadData()
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadData()
  },

  getMoodEmoji(mood) {
    return moodMap[mood] || mood
  },

  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  formatDate(time) {
    if (!time) return ''
    const date = new Date(time)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[date.getDay()]
    return `${year}年${month}月${day}日 ${weekday}`
  },

  formatTimeOnly(time) {
    if (!time) return ''
    const date = new Date(time)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  previewImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({
      urls: urls,
      current: current
    })
  }
})
