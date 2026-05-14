<template>
  <div class="statistics-page">
    <div class="page-header">
      <span class="header-title">数据统计</span>
      <span class="header-subtitle">你的旅行足迹分析</span>
    </div>

    <div class="content-area">
      <div v-if="loading" class="loading-container">
        <span class="loading-text">⏳ 加载中...</span>
      </div>

      <template v-else>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">📊</span>
            <span class="stat-value">{{ stats.totalCheckIns }}</span>
            <span class="stat-label">总打卡次数</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📅</span>
            <span class="stat-value">{{ stats.thisMonthCheckIns }}</span>
            <span class="stat-label">本月打卡</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💭</span>
            <span class="stat-value">{{ getMoodLabel(stats.favoriteMood) || '-' }}</span>
            <span class="stat-label">最常心情</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📍</span>
            <span class="stat-value stat-value-small">{{ stats.favoriteLocation || '-' }}</span>
            <span class="stat-label">最爱地点</span>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-title">近7天打卡趋势</div>
          <div ref="trendChartRef" class="chart"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">心情分布</div>
          <div class="mood-list">
            <div v-for="item in moodDistribution" :key="item.mood" class="mood-stat-item">
              <span class="mood-item-emoji">{{ getMoodEmoji(item.mood) }}</span>
              <span class="mood-item-name">{{ getMoodLabel(item.mood) }}</span>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: getMoodPercent(item.count) + '%' }"
                ></div>
              </div>
              <span class="mood-item-count">{{ item.count }}</span>
            </div>
          </div>
          <div ref="moodChartRef" class="chart chart-small"></div>
        </div>

        <div class="logout-section">
          <el-button class="logout-btn" @click="handleLogout">退出登录</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { statisticsApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const trendChartRef = ref<HTMLElement>()
const moodChartRef = ref<HTMLElement>()

const stats = ref<any>({
  totalCheckIns: 0,
  thisMonthCheckIns: 0,
  favoriteMood: '',
  favoriteLocation: '',
  recentTrend: [],
  moodDistribution: []
})

const moodLabels: Record<string, string> = {
  happy: '开心', excited: '兴奋', relaxed: '放松', tired: '疲惫', surprised: '惊喜'
}

const moodEmojis: Record<string, string> = {
  happy: '😊', excited: '🤩', relaxed: '😌', tired: '😴', surprised: '😲'
}

const getMoodLabel = (mood: string) => moodLabels[mood] || mood
const getMoodEmoji = (mood: string) => moodEmojis[mood] || '❓'

const moodDistribution = computed(() => stats.value.moodDistribution || [])

const maxMoodCount = computed(() => {
  if (moodDistribution.value.length === 0) return 1
  return Math.max(...moodDistribution.value.map((item: any) => item.count), 1)
})

const getMoodPercent = (count: number) => (count / maxMoodCount.value) * 100

let trendChart: echarts.ECharts | undefined
let moodChart: echarts.ECharts | undefined

const initTrendChart = () => {
  if (!trendChartRef.value) return

  const chart = echarts.init(trendChartRef.value)
  const dates = stats.value.recentTrend.map((item: any) => item.date)
  const counts = stats.value.recentTrend.map((item: any) => item.count)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#999' } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { lineStyle: { color: '#999' } }
    },
    series: [{
      data: counts,
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(23, 100, 92, 0.35)' },
          { offset: 1, color: 'rgba(23, 100, 92, 0.05)' }
        ])
      },
      lineStyle: { color: '#17645c', width: 3 },
      itemStyle: { color: '#17645c' }
    }]
  })

  return chart
}

const initMoodChart = () => {
  if (!moodChartRef.value) return

  const chart = echarts.init(moodChartRef.value)
  const data = stats.value.moodDistribution.map((item: any) => ({
    name: getMoodLabel(item.mood),
    value: item.count
  }))

  chart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 1 }],
      color: ['#17645c', '#21867a', '#d6a151', '#ad7a2d', '#17A2B8']
    }]
  })

  return chart
}

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await statisticsApi.get()
    stats.value = res.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
    await nextTick()
    trendChart = initTrendChart()
    moodChart = initMoodChart()
  }
}

const handleLogout = () => {
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

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => {
    trendChart?.resize()
    moodChart?.resize()
  })
})
</script>

<style scoped>
.statistics-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  padding: 32px 40px;
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
  border-radius: 0 0 32px 32px;
  box-shadow: 0 8px 32px rgba(23, 100, 92, 0.15);
  margin: -24px -24px 0;
}

.header-title {
  display: block;
  font-size: 26px;
  font-weight: 900;
  color: #fff;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.header-subtitle {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.content-area {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 250, 248, 0.98) 100%);
  border-radius: 28px;
  padding: 24px;
  margin-top: -16px;
  border: 1px solid rgba(23, 100, 92, 0.06);
  box-shadow: 0 12px 36px rgba(23, 100, 92, 0.06);
  position: relative;
  z-index: 1;
}

.loading-container {
  text-align: center;
  padding: 80px 20px;
}

.loading-text {
  font-size: 15px;
  color: #7d8d89;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 250, 248, 0.98) 100%);
  border-radius: 20px;
  padding: 24px 16px;
  text-align: center;
  border: 1px solid rgba(23, 100, 92, 0.06);
  box-shadow: 0 6px 20px rgba(23, 100, 92, 0.04);
}

.stat-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: #17645c;
  margin-bottom: 4px;
}

.stat-value-small {
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-label {
  font-size: 12px;
  color: #7d8d89;
}

.chart-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 250, 248, 0.98) 100%);
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid rgba(23, 100, 92, 0.06);
  box-shadow: 0 6px 20px rgba(23, 100, 92, 0.04);
}

.chart-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f3f39;
  margin-bottom: 20px;
}

.chart {
  height: 260px;
}

.chart-small {
  height: 220px;
}

.mood-list {
  margin-bottom: 16px;
}

.mood-stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.mood-item-emoji {
  font-size: 22px;
  margin-right: 10px;
}

.mood-item-name {
  width: 56px;
  font-size: 13px;
  color: #0f3f39;
  font-weight: 600;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: rgba(23, 100, 92, 0.07);
  border-radius: 5px;
  margin: 0 14px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #17645c 0%, #21867a 100%);
  border-radius: 5px;
  transition: width 0.4s;
}

.mood-item-count {
  width: 32px;
  font-size: 13px;
  color: #355f59;
  text-align: right;
  font-weight: 600;
}

.logout-section {
  margin-top: 8px;
  text-align: center;
}

.logout-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  color: #ad7a2d;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 250, 248, 0.98) 100%);
  border: 1px solid rgba(173, 122, 45, 0.2);
  border-radius: 999px;
  box-shadow: 0 4px 16px rgba(23, 100, 92, 0.05);
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: rgba(173, 122, 45, 0.4);
  color: #8b611f;
}

.logout-btn:active {
  transform: translateY(1px);
}
</style>
