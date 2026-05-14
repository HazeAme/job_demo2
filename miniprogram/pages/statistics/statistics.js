const api = require('../../utils/api.js')
const app = getApp()

const moodMap = {
  happy: { emoji: '😊', label: '开心' },
  excited: { emoji: '🤩', label: '兴奋' },
  relaxed: { emoji: '😌', label: '放松' },
  tired: { emoji: '😴', label: '疲惫' },
  surprised: { emoji: '😲', label: '惊喜' }
}

Page({
  data: {
    loading: false,
    stats: {
      totalCheckIns: 0,
      thisMonthCheckIns: 0,
      favoriteMood: '',
      favoriteLocation: '',
      recentTrend: [],
      moodDistribution: []
    },
    maxCount: 0,
    totalMoodCount: 0
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.loadData()
  },

  onShow() {
    if (app.globalData.token) {
      this.loadData()
    }
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      const res = await api.getStatistics()
      const stats = res.data

      // 计算最大打卡数（用于柱状图比例）
      const maxCount = stats.recentTrend.length > 0
        ? Math.max(...stats.recentTrend.map(item => item.count))
        : 0

      // 计算心情总数
      const totalMoodCount = stats.moodDistribution.reduce((sum, item) => sum + item.count, 0)

      // 处理心情分布数据，添加表情和标签
      if (stats.moodDistribution) {
        stats.moodDistribution = stats.moodDistribution.map(item => ({
          ...item,
          emoji: this.getMoodEmoji(item.mood),
          label: this.getMoodLabel(item.mood)
        }))
      }

      // 处理最常心情的标签
      if (stats.favoriteMood) {
        stats.favoriteMoodLabel = this.getMoodLabel(stats.favoriteMood)
      }

      this.setData({
        stats,
        maxCount,
        totalMoodCount,
        loading: false
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
      this.setData({ loading: false })
    }
  },

  getMoodEmoji(mood) {
    return moodMap[mood]?.emoji || mood
  },

  getMoodLabel(mood) {
    return moodMap[mood]?.label || mood
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')

          // 清除全局数据
          const app = getApp()
          app.globalData.token = null
          app.globalData.userInfo = null

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })

          setTimeout(() => {
            wx.redirectTo({ url: '/pages/login/login' })
          }, 1500)
        }
      }
    })
  }
})