<template>
  <div class="history-page">
    <div class="page-header">
      <span class="header-title">打卡历史</span>
      <span class="header-subtitle">共 {{ total }} 条记录</span>
    </div>

    <div class="content-area">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-input-box">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索内容或地点..."
            @keyup.enter="handleSearch"
          />
          <el-icon v-if="keyword" class="clear-icon" @click="keyword = ''; handleSearch()">
            <CircleClose />
          </el-icon>
        </div>
        <span class="search-action" @click="handleSearch">搜索</span>
      </div>

      <!-- 心情筛选 -->
      <div class="mood-filter-bar">
        <div
          v-for="mood in moodOptions"
          :key="mood.value"
          class="filter-pill"
          :class="{ active: selectedMood === mood.value }"
          @click="toggleMood(mood.value)"
        >
          {{ mood.emoji }} {{ mood.label }}
        </div>
      </div>

      <!-- 日期筛选 -->
      <div class="date-filter-bar">
        <div class="date-filter-header" @click="showDateFilter = !showDateFilter">
          <span class="date-filter-title">日期范围筛选</span>
          <el-icon :class="{ rotated: showDateFilter }"><ArrowDown /></el-icon>
        </div>
        <div v-if="showDateFilter" class="date-picker-row">
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="开始日期"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
            class="date-picker-inline"
          />
          <span class="date-sep">至</span>
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="结束日期"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
            class="date-picker-inline"
          />
        </div>
        <div v-if="showDateFilter && (startDate || endDate)" class="date-filter-actions">
          <span class="clear-date-btn" @click="startDate = ''; endDate = ''; loadData()">清除日期</span>
        </div>
      </div>

      <!-- 筛选状态 -->
      <div v-if="hasActiveFilters" class="filter-status">
        <span class="filter-status-text">已应用筛选条件</span>
        <span class="clear-all-btn" @click="clearAllFilters">清除全部</span>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <span class="loading-text">⏳ 加载中...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="checkInList.length === 0" class="empty-container">
        <span class="empty-icon">📝</span>
        <span class="empty-title">还没有打卡记录</span>
        <span class="empty-subtitle">快去记录你的第一次旅程吧！</span>
      </div>

      <!-- 时间线列表 -->
      <div v-else class="timeline">
        <div v-for="item in checkInList" :key="item.id" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="time-label">{{ formatTime(item.checkInTime) }}</div>
            <div class="card">
              <div class="card-header">
                <div class="location">
                  <el-icon><Location /></el-icon>
                  <span>{{ item.locationName || '未知位置' }}</span>
                </div>
                <span v-if="item.mood" class="mood-emoji-large">{{ getMoodEmoji(item.mood) }}</span>
              </div>

              <div class="card-date">
                <el-icon class="date-icon"><Calendar /></el-icon>
                <span>{{ formatDate(item.checkInTime) }}</span>
              </div>

              <p class="card-content">{{ item.content }}</p>

              <div v-if="item.images && item.images.length > 0" class="card-images">
                <el-image
                  v-for="(img, index) in item.images"
                  :key="index"
                  :src="img"
                  :preview-src-list="item.images"
                  fit="cover"
                  class="thumb"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Location, Calendar, Search, CircleClose, ArrowDown } from '@element-plus/icons-vue'
import { checkInApi } from '@/api'

const checkInList = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)

const keyword = ref('')
const selectedMood = ref('')
const startDate = ref('')
const endDate = ref('')
const showDateFilter = ref(false)

const moodOptions = [
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'excited', emoji: '🤩', label: '兴奋' },
  { value: 'relaxed', emoji: '😌', label: '放松' },
  { value: 'tired', emoji: '😴', label: '疲惫' },
  { value: 'surprised', emoji: '😲', label: '惊喜' }
]

const moodMap: Record<string, string> = {
  happy: '😊', excited: '🤩', relaxed: '😌', tired: '😴', surprised: '😲'
}

const hasActiveFilters = computed(() => {
  return !!(keyword.value || selectedMood.value || startDate.value || endDate.value)
})

const getMoodEmoji = (mood: string) => moodMap[mood] || mood

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const formatDate = (time: string) => {
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })
}

const toggleMood = (mood: string) => {
  selectedMood.value = selectedMood.value === mood ? '' : mood
  page.value = 1
  loadData()
}

const handleSearch = () => {
  page.value = 1
  loadData()
}

const clearAllFilters = () => {
  keyword.value = ''
  selectedMood.value = ''
  startDate.value = ''
  endDate.value = ''
  page.value = 1
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      size: size.value
    }
    if (keyword.value) params.keyword = keyword.value
    if (selectedMood.value) params.mood = selectedMood.value
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value

    const res: any = await checkInApi.list(params)
    checkInList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.history-page {
  max-width: 800px;
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

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.search-input-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(237, 247, 244, 0.8);
  border-radius: 999px;
  padding: 10px 20px;
  margin-right: 12px;
  border: 1px solid rgba(23, 100, 92, 0.08);
}

.search-icon {
  font-size: 16px;
  color: #17A2B8;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #0f3f39;
  outline: none;
}

.search-input::placeholder {
  color: #7d8d89;
}

.clear-icon {
  font-size: 16px;
  color: #7d8d89;
  cursor: pointer;
  padding: 2px;
}

.search-action {
  font-size: 14px;
  color: #17645c;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

/* 心情筛选 */
.mood-filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  font-size: 13px;
  color: #355f59;
  border: 1.5px solid rgba(23, 100, 92, 0.1);
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-pill:hover {
  background: rgba(237, 247, 244, 0.9);
}

.filter-pill.active {
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(23, 100, 92, 0.25);
}

/* 日期筛选 */
.date-filter-bar {
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(23, 100, 92, 0.06);
}

.date-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.date-filter-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f3f39;
}

.date-filter-header .el-icon {
  transition: transform 0.3s;
  color: #17645c;
}

.date-filter-header .el-icon.rotated {
  transform: rotate(180deg);
}

.date-picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.date-picker-inline {
  flex: 1;
}

.date-sep {
  font-size: 13px;
  color: #7d8d89;
}

.date-filter-actions {
  margin-top: 12px;
  text-align: right;
}

.clear-date-btn {
  font-size: 13px;
  color: #ad7a2d;
  font-weight: 600;
  cursor: pointer;
}

/* 筛选状态 */
.filter-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(23, 100, 92, 0.06) 0%, rgba(33, 134, 122, 0.04) 100%);
  border-radius: 12px;
  border: 1px solid rgba(23, 100, 92, 0.1);
}

.filter-status-text {
  font-size: 13px;
  color: #17645c;
  font-weight: 600;
}

.clear-all-btn {
  font-size: 13px;
  color: #ad7a2d;
  font-weight: 600;
  cursor: pointer;
}

/* 加载和空状态 */
.loading-container, .empty-container {
  text-align: center;
  padding: 80px 20px;
}

.loading-text {
  font-size: 15px;
  color: #7d8d89;
}

.empty-icon {
  font-size: 60px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #0f3f39;
  margin-bottom: 6px;
}

.empty-subtitle {
  display: block;
  font-size: 14px;
  color: #7d8d89;
}

/* 时间线 */
.timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  margin-bottom: 24px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
  border-radius: 50%;
  margin-right: 16px;
  margin-top: 6px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(23, 100, 92, 0.3);
}

.timeline-content {
  flex: 1;
}

.time-label {
  font-size: 12px;
  color: #7d8d89;
  margin-bottom: 8px;
}

.card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 250, 248, 0.98) 100%);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(23, 100, 92, 0.06);
  box-shadow: 0 6px 20px rgba(23, 100, 92, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.location {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #355f59;
  font-weight: 600;
}

.mood-emoji-large {
  font-size: 28px;
}

.card-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #17645c;
  font-weight: 600;
  margin-bottom: 12px;
  padding: 8px 14px;
  background: rgba(23, 100, 92, 0.07);
  border-radius: 10px;
  width: fit-content;
}

.date-icon {
  font-size: 14px;
}

.card-content {
  font-size: 15px;
  color: #0f3f39;
  line-height: 1.7;
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.card-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.thumb {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  border: 1px solid rgba(23, 100, 92, 0.06);
  cursor: pointer;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination .el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(23, 100, 92, 0.1);
}
</style>
