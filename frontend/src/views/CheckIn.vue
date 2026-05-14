<template>
  <div class="checkin-page">
    <div class="page-header">
      <span class="header-title">记录新旅程</span>
      <span class="header-subtitle">分享你的旅行故事</span>
    </div>

    <div class="form-container">
      <!-- 日期时间选择 -->
      <div class="form-section">
        <div class="section-label">
          <el-icon class="label-icon"><Calendar /></el-icon>
          <span>时间</span>
        </div>
        <div class="datetime-row">
          <div class="picker-item">
            <el-date-picker
              v-model="checkInDate"
              type="date"
              placeholder="选择日期"
              format="YYYY/MM/DD"
              value-format="YYYY-MM-DD"
              class="date-picker-full"
            />
          </div>
          <div class="picker-item">
            <el-time-picker
              v-model="checkInTime"
              placeholder="选择时间"
              format="HH:mm"
              value-format="HH:mm"
              class="date-picker-full"
            />
          </div>
          <div class="current-btn" @click="setCurrentTime">
            <span class="current-btn-text">当前</span>
          </div>
        </div>
      </div>

      <!-- 位置 -->
      <div class="form-section">
        <div class="section-label">
          <el-icon class="label-icon"><Location /></el-icon>
          <span>位置</span>
        </div>

        <!-- 搜索 + GPS 定位 -->
        <div class="location-search-row">
          <div class="search-wrapper">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索地点..."
              :prefix-icon="Search"
              clearable
              @input="onSearchInput"
              @focus="onSearchFocus"
            />
            <!-- 搜索结果下拉 -->
            <div v-if="searchResults.length > 0 && showResults" class="search-dropdown">
              <div
                v-for="item in searchResults"
                :key="item.id"
                class="search-result-item"
                @click="selectSearchResult(item)"
              >
                <span class="result-title">{{ item.title }}</span>
                <span class="result-address">{{ item.address }}</span>
              </div>
            </div>
          </div>
          <el-button
            class="location-btn primary"
            :loading="locationLoading"
            @click="getLocation"
          >
            定位
          </el-button>
        </div>

        <!-- 已选位置信息卡片 -->
        <div v-if="form.locationName" class="location-card">
          <div class="location-card-header">
            <el-icon class="location-pin"><MapLocation /></el-icon>
            <span class="location-title">{{ form.locationName }}</span>
          </div>
          <div v-if="form.latitude && form.longitude" class="location-coords">
            {{ form.latitude.toFixed(6) }}, {{ form.longitude.toFixed(6) }}
          </div>
        </div>
        <div v-else class="location-hint">
          搜索地点或点击"定位"获取当前位置
        </div>
      </div>

      <!-- 心情 -->
      <div class="form-section">
        <div class="section-label">
          <el-icon class="label-icon"><Sunny /></el-icon>
          <span>心情</span>
        </div>
        <div class="mood-selector">
          <div
            v-for="mood in moods"
            :key="mood.value"
            class="mood-item"
            :class="{ active: form.mood === mood.value }"
            @click="form.mood = form.mood === mood.value ? '' : mood.value"
          >
            <span class="mood-emoji">{{ mood.emoji }}</span>
            <span class="mood-label">{{ mood.label }}</span>
          </div>
        </div>
      </div>

      <!-- 内容 -->
      <div class="form-section">
        <div class="section-label">
          <el-icon class="label-icon"><EditPen /></el-icon>
          <span>内容</span>
        </div>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="5"
          placeholder="分享你的旅行故事..."
          maxlength="500"
          show-word-limit
          class="content-textarea"
        />
      </div>

      <!-- 照片 -->
      <div class="form-section">
        <div class="section-label">
          <el-icon class="label-icon"><PictureFilled /></el-icon>
          <span>照片</span>
        </div>
        <el-upload
          v-model:file-list="fileList"
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :on-change="handleChange"
          :on-remove="handleRemove"
          accept="image/*"
          multiple
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </div>

      <!-- 提交 -->
      <el-button
        size="large"
        class="submit-btn"
        :loading="submitting"
        @click="handleSubmit"
      >
        <el-icon><Check /></el-icon>
        发布打卡
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Location, MapLocation, Search, Sunny, EditPen, PictureFilled, Plus, Check } from '@element-plus/icons-vue'
import { checkInApi } from '@/api'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

const moods = [
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'excited', emoji: '🤩', label: '兴奋' },
  { value: 'relaxed', emoji: '😌', label: '放松' },
  { value: 'tired', emoji: '😴', label: '疲惫' },
  { value: 'surprised', emoji: '😲', label: '惊喜' }
]

const checkInDate = ref('')
const checkInTime = ref('')

const form = reactive({
  content: '',
  mood: '',
  locationName: '',
  latitude: null as number | null,
  longitude: null as number | null
})

const fileList = ref<any[]>([])
const locationLoading = ref(false)
const submitting = ref(false)

// 地点搜索
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const showResults = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const setCurrentTime = () => {
  const now = new Date()
  checkInDate.value = now.toISOString().split('T')[0]
  checkInTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// GPS 自动定位 + 逆地理编码（使用 OSM Nominatim，免费免 Key）
const getLocation = () => {
  if (!navigator.geolocation) {
    ElMessage.error('您的浏览器不支持地理定位')
    return
  }

  locationLoading.value = true
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude

      try {
        const response = await fetch(
          `${NOMINATIM_BASE}/reverse?format=json&lat=${form.latitude}&lon=${form.longitude}&zoom=18&accept-language=zh`,
          { headers: { 'User-Agent': 'TravelCheckInApp/1.0' } }
        )
        const data = await response.json()
        if (data.display_name) {
          // 提取简短地址：取前两个逗号之间的内容
          const parts = data.display_name.split(',')
          form.locationName = parts.slice(0, 3).join(',').trim()
        } else {
          form.locationName = `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
        }
      } catch (e) {
        form.locationName = `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
      }

      searchKeyword.value = form.locationName
      locationLoading.value = false
      ElMessage.success('定位成功')
    },
    (error) => {
      locationLoading.value = false
      let msg = '定位失败'
      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = '定位权限被拒绝，请在浏览器设置中允许定位'
          break
        case error.POSITION_UNAVAILABLE:
          msg = '无法获取位置信息'
          break
        case error.TIMEOUT:
          msg = '定位超时，请重试'
          break
      }
      ElMessage.error(msg)
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

// 地点搜索（防抖，使用 OSM Nominatim，免费免 Key）
const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)

  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    showResults.value = false
    return
  }

  searchTimer = setTimeout(async () => {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(searchKeyword.value)}&limit=8&accept-language=zh`,
        { headers: { 'User-Agent': 'TravelCheckInApp/1.0' } }
      )
      const data = await response.json()
      searchResults.value = data.map((item: any) => ({
        id: item.place_id,
        title: item.display_name.split(',')[0],
        address: item.display_name,
        location: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
      }))
      showResults.value = searchResults.value.length > 0
    } catch (e) {
      console.error(e)
    }
  }, 300)
}

const onSearchFocus = () => {
  if (searchResults.value.length > 0) {
    showResults.value = true
  }
}

// 选择搜索结果
const selectSearchResult = (item: any) => {
  form.locationName = item.title
  form.latitude = item.location.lat
  form.longitude = item.location.lng
  searchKeyword.value = item.title
  searchResults.value = []
  showResults.value = false
}

// 点击页面其他位置关闭下拉
const handleClickOutside = () => {
  showResults.value = false
}

const handleChange = (file: any) => {
  const isImage = file.raw.type.startsWith('image/')
  const isLt10M = file.raw.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }
  return true
}

const handleRemove = () => {}

const handleSubmit = async () => {
  if (!form.content.trim()) {
    ElMessage.warning('请输入打卡内容')
    return
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('content', form.content)
    if (form.mood) formData.append('mood', form.mood)
    if (form.locationName) formData.append('locationName', form.locationName)
    if (form.latitude) formData.append('latitude', form.latitude.toString())
    if (form.longitude) formData.append('longitude', form.longitude.toString())

    if (checkInDate.value && checkInTime.value) {
      formData.append('checkInTime', `${checkInDate.value} ${checkInTime.value}:00`)
    }

    fileList.value.forEach((file) => {
      formData.append('images', file.raw)
    })

    await checkInApi.create(formData)
    ElMessage.success('打卡成功！')

    form.content = ''
    form.mood = ''
    form.locationName = ''
    form.latitude = null
    form.longitude = null
    searchKeyword.value = ''
    checkInDate.value = ''
    checkInTime.value = ''
    fileList.value = []
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.checkin-page {
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
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.header-subtitle {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.form-container {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 250, 248, 0.98) 100%);
  border-radius: 28px;
  padding: 28px;
  margin-top: -16px;
  border: 1px solid rgba(23, 100, 92, 0.06);
  box-shadow: 0 12px 36px rgba(23, 100, 92, 0.06);
  position: relative;
  z-index: 1;
}

.form-section {
  margin-bottom: 24px;
}

.section-label {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  color: #0f3f39;
  margin-bottom: 14px;
}

.label-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #17645c;
}

.datetime-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.picker-item {
  flex: 1;
}

.date-picker-full {
  width: 100%;
}

.current-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background: linear-gradient(135deg, #ad7a2d 0%, #d6a151 100%);
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(173, 122, 45, 0.25);
  transition: all 0.2s;
  flex-shrink: 0;
}

.current-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(173, 122, 45, 0.35);
}

.current-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(173, 122, 45, 0.2);
}

.current-btn-text {
  font-size: 14px;
  color: #fff;
  font-weight: 700;
}

/* ==================== 位置模块 ==================== */

.location-search-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.search-wrapper {
  flex: 1;
  position: relative;
}

/* 搜索结果下拉 */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.99);
  border-radius: 16px;
  margin-top: 6px;
  border: 1px solid rgba(23, 100, 92, 0.1);
  box-shadow: 0 12px 36px rgba(23, 100, 92, 0.1);
  max-height: 320px;
  overflow-y: auto;
  z-index: 100;
}

.search-result-item {
  padding: 14px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(23, 100, 92, 0.04);
  transition: background 0.15s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: rgba(237, 247, 244, 0.8);
}

.result-title {
  display: block;
  font-size: 15px;
  color: #0f3f39;
  font-weight: 700;
  margin-bottom: 4px;
}

.result-address {
  display: block;
  font-size: 12px;
  color: #7d8d89;
}

/* 定位按钮 */
.location-btn {
  border-radius: 999px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(23, 100, 92, 0.2);
  transition: all 0.2s;
  flex-shrink: 0;
}

.location-btn.primary {
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
  color: #fff;
  border: none;
}

.location-btn.primary:hover {
  box-shadow: 0 6px 20px rgba(23, 100, 92, 0.3);
  transform: translateY(-1px);
}

/* 已选位置卡片 */
.location-card {
  margin-top: 12px;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(23, 100, 92, 0.06) 0%, rgba(33, 134, 122, 0.04) 100%);
  border-radius: 14px;
  border: 1px solid rgba(23, 100, 92, 0.12);
}

.location-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.location-pin {
  font-size: 18px;
  color: #17645c;
  flex-shrink: 0;
}

.location-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f3f39;
}

.location-coords {
  font-size: 12px;
  color: #7d8d89;
  padding-left: 26px;
}

.location-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #adb5b2;
}

/* ==================== 心情模块 ==================== */

.mood-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.mood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 22px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s;
  border: 2px solid rgba(23, 100, 92, 0.08);
}

.mood-item:hover {
  background: rgba(237, 247, 244, 0.9);
  transform: translateY(-2px);
}

.mood-item.active {
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
  border-color: transparent;
  box-shadow: 0 6px 20px rgba(23, 100, 92, 0.25);
}

.mood-emoji {
  font-size: 32px;
  margin-bottom: 6px;
}

.mood-label {
  font-size: 13px;
  color: #355f59;
  font-weight: 600;
}

.mood-item.active .mood-label {
  color: #fff;
}

/* ==================== 其他 ==================== */

.content-textarea :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(23, 100, 92, 0.1);
  font-size: 15px;
  color: #0f3f39;
  padding: 16px;
}

.content-textarea :deep(.el-textarea__inner:focus) {
  border-color: #21867a;
}

.submit-btn {
  width: 100%;
  height: 52px;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #17645c 0%, #21867a 100%);
  border: none;
  border-radius: 999px;
  box-shadow: 0 8px 28px rgba(23, 100, 92, 0.3);
  transition: all 0.2s;
  margin-top: 8px;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 36px rgba(23, 100, 92, 0.35);
  opacity: 1;
}

.submit-btn:active {
  transform: translateY(1px);
  box-shadow: 0 4px 12px rgba(23, 100, 92, 0.2);
}

:deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  background: rgba(237, 247, 244, 0.8);
  border: 2px dashed rgba(23, 100, 92, 0.15);
}

:deep(.el-upload-list__item) {
  width: 120px;
  height: 120px;
  border-radius: 16px;
}

:deep(.el-input__wrapper) {
  border-radius: 14px;
  box-shadow: 0 0 0 1px rgba(23, 100, 92, 0.1);
}
</style>
