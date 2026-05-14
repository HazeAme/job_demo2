# 小程序位置模块重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构小程序打卡页面的位置功能，使用腾讯地图SDK实现内嵌实时小地图、GPS定位、逆地理编码和地点搜索。

**Architecture:** 使用微信小程序原生map组件展示地图，腾讯位置服务SDK提供逆地理编码和POI搜索功能，所有地图操作内嵌在打卡页面中。

**Tech Stack:** 微信小程序原生API、腾讯位置服务SDK(qqmap-wx-jssdk)、map组件

---

## 文件结构

| 文件 | 职责 |
|-----|------|
| `miniprogram/libs/qqmap-wx-jssdk.min.js` | 腾讯地图SDK（第三方库） |
| `miniprogram/pages/checkin/checkin.js` | 位置功能逻辑（修改） |
| `miniprogram/pages/checkin/checkin.wxml` | 地图组件和UI（修改） |
| `miniprogram/pages/checkin/checkin.wxss` | 地图样式（修改） |
| `miniprogram/app.json` | 配置服务器域名（修改） |

---

## Task 1: 下载腾讯地图SDK

**Files:**
- Create: `miniprogram/libs/qqmap-wx-jssdk.min.js`

- [ ] **Step 1: 下载SDK文件**

从腾讯位置服务官网下载微信小程序SDK：
```bash
# 手动下载地址：https://lbs.qq.com/miniProgram/jsSdk/jsSdkGuide/jsSdkOverview
# 或使用wget/curl下载（如果URL可用）
```

将下载的 `qqmap-wx-jssdk.min.js` 放入 `miniprogram/libs/` 目录。

- [ ] **Step 2: 验证SDK文件**

检查文件是否存在且内容正确：
```bash
ls -la miniprogram/libs/qqmap-wx-jssdk.min.js
# 文件大小应该约20-30KB
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/libs/qqmap-wx-jssdk.min.js
git commit -m "chore: add Tencent Map SDK"
```

---

## Task 2: 配置小程序服务器域名

**Files:**
- Modify: `miniprogram/app.json`（已存在，需确认配置）

- [ ] **Step 1: 更新app.json配置**

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于小程序位置接口的效果展示"
    }
  },
  "requiredPrivateInfos": ["getLocation", "chooseLocation"],
  "requiredBackgroundModes": ["location"],
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 2: 在小程序后台配置服务器域名**

登录 [微信公众平台](https://mp.weixin.qq.com/)：
1. 「开发」→「开发管理」→「开发设置」→「服务器域名」
2. 在「request合法域名」中添加：
   ```
   https://apis.map.qq.com
   ```

- [ ] **Step 3: 开发者工具设置**

在开发者工具中：
1. 点击右上角「详情」
2. 「本地设置」→ 勾选「不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书」（仅开发时使用）

- [ ] **Step 4: Commit**

```bash
git commit -m "docs: update server domain config for Tencent Map"
```

---

## Task 3: 重构 checkin.js - 初始化SDK和核心方法

**Files:**
- Modify: `miniprogram/pages/checkin/checkin.js`

- [ ] **Step 1: 引入SDK并初始化**

在文件顶部添加：
```javascript
const api = require('../../utils/api.js')
const app = getApp()

// 引入腾讯地图SDK
const QQMapWX = require('../../libs/qqmap-wx-jssdk.min.js')
const qqmapsdk = new QQMapWX({
  key: 'IPVBZ-PC46Z-BWFXB-T2RJ3-ADPZZ-EOBWC'
})
```

- [ ] **Step 2: 更新data数据结构**

```javascript
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
  mapScale: 16
}
```

- [ ] **Step 3: 添加onReady生命周期初始化地图**

```javascript
onReady() {
  // 获取地图上下文
  this.mapCtx = wx.createMapContext('locationMap')
}
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/checkin/checkin.js
git commit -m "feat: init Tencent Map SDK in checkin page"
```

---

## Task 4: 实现GPS定位和逆地理编码

**Files:**
- Modify: `miniprogram/pages/checkin/checkin.js`

- [ ] **Step 1: 实现getLocation方法**

```javascript
// 获取当前位置
getLocation() {
  this.setData({ locationLoading: true })

  wx.getSetting({
    success: (res) => {
      if (!res.authSetting['scope.userLocation']) {
        wx.authorize({
          scope: 'scope.userLocation',
          success: () => {
            this.doGetLocation()
          },
          fail: () => {
            wx.showModal({
              title: '提示',
              content: '需要获取位置权限才能打卡',
              confirmText: '去设置',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting()
                }
              }
            })
            this.setData({ locationLoading: false })
          }
        })
      } else {
        this.doGetLocation()
      }
    }
  })
}
```

- [ ] **Step 2: 实现doGetLocation方法**

```javascript
// 执行定位
 doGetLocation() {
  wx.getLocation({
    type: 'gcj02',
    isHighAccuracy: true,
    highAccuracyExpireTime: 5000,
    success: (res) => {
      const { latitude, longitude } = res
      console.log('GPS定位成功:', latitude, longitude)
      
      // 更新地图中心
      this.setMapCenter(latitude, longitude)
      
      // 逆地理编码获取地址
      this.reverseGeocode(latitude, longitude)
    },
    fail: (err) => {
      console.error('定位失败', err)
      wx.showToast({ title: '定位失败，请检查权限', icon: 'none' })
      this.setData({ locationLoading: false })
    }
  })
}
```

- [ ] **Step 3: 实现reverseGeocode方法**

```javascript
// 逆地理编码
reverseGeocode(latitude, longitude) {
  qqmapsdk.reverseGeocoder({
    location: {
      latitude: latitude,
      longitude: longitude
    },
    get_poi: 1,
    poi_options: 'policy=2;radius=1000;page_size=20;page_index=1',
    success: (res) => {
      console.log('逆地理编码结果:', res)
      
      let locationName = ''
      const result = res.result
      
      // 优先获取最近的POI
      if (result.pois && result.pois.length > 0) {
        // 按距离排序，取最近的
        const sortedPois = result.pois.sort((a, b) => {
          return (a._distance || 0) - (b._distance || 0)
        })
        locationName = sortedPois[0].title
      }
      // 其次使用地标
      else if (result.landmark && result.landmark.title) {
        locationName = result.landmark.title
      }
      // 最后使用地址
      else {
        locationName = result.address
      }

      this.updateLocation(latitude, longitude, locationName, result.address)
      wx.showToast({ title: '定位成功', icon: 'success' })
    },
    fail: (err) => {
      console.error('逆地理编码失败:', err)
      // 降级处理：使用坐标
      this.updateLocation(latitude, longitude, 
        `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, '')
      wx.showToast({ title: '定位成功', icon: 'success' })
    }
  })
}
```

- [ ] **Step 4: 实现updateLocation方法**

```javascript
// 更新位置信息
updateLocation(latitude, longitude, name, address = '') {
  const marker = {
    id: 1,
    latitude: latitude,
    longitude: longitude,
    title: name,
    iconPath: '/images/marker.png',
    width: 30,
    height: 30,
    anchor: { x: 0.5, y: 1 }
  }

  this.setData({
    'location.latitude': latitude,
    'location.longitude': longitude,
    'location.name': name,
    'location.address': address,
    markers: [marker],
    locationLoading: false
  })
}

// 设置地图中心
setMapCenter(latitude, longitude) {
  this.setData({
    'location.latitude': latitude,
    'location.longitude': longitude
  })
}
```

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/checkin/checkin.js
git commit -m "feat: implement GPS location and reverse geocoding"
```

---

## Task 5: 实现地点搜索功能

**Files:**
- Modify: `miniprogram/pages/checkin/checkin.js`

- [ ] **Step 1: 实现searchLocation方法**

```javascript
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
}
```

- [ ] **Step 2: 修改selectLocation方法**

```javascript
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
}
```

- [ ] **Step 3: 添加地图选点功能**

```javascript
// 点击地图选择位置
onMapTap(e) {
  const { latitude, longitude } = e.detail
  console.log('地图点击:', latitude, longitude)
  
  // 逆地理编码获取地址
  this.reverseGeocode(latitude, longitude)
}

// 地图视野变化结束
onRegionChange(e) {
  if (e.type === 'end') {
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
}
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/checkin/checkin.js
git commit -m "feat: implement location search and map interaction"
```

---

## Task 6: 重构 checkin.wxml - 添加地图组件

**Files:**
- Modify: `miniprogram/pages/checkin/checkin.wxml`

- [ ] **Step 1: 重构位置区域布局**

替换原有的位置区域为：
```xml
  <!-- 位置 -->
  <view class="form-item">
    <view class="label">
      <text class="label-icon">📍</text>
      <text>位置</text>
    </view>

    <!-- 地图区域 -->
    <view class="map-container">
      <map
        id="locationMap"
        class="location-map"
        longitude="{{location.longitude}}"
        latitude="{{location.latitude}}"
        scale="{{mapScale}}"
        show-location
        markers="{{markers}}"
        bindtap="onMapTap"
        bindregionchange="onRegionChange"
        show-compass
        enable-zoom
        enable-scroll
        enable-rotate
      />
      
      <!-- 地图遮罩提示 -->
      <view wx:if="{{!location.latitude}}" class="map-placeholder">
        <text class="placeholder-text">点击获取位置后显示地图</text>
      </view>
    </view>

    <!-- 位置信息 -->
    <view wx:if="{{location.name}}" class="location-info">
      <text class="location-name">{{location.name}}</text>
      <text wx:if="{{location.address}}" class="location-address">{{location.address}}</text>
    </view>

    <!-- 操作按钮 -->
    <view class="location-actions">
      <view class="location-btn primary" bindtap="getLocation">
        <text class="btn-icon">📍</text>
        <text>{{locationLoading ? '定位中...' : '获取当前位置'}}</text>
      </view>
      <view class="location-btn secondary" bindtap="openMapPicker">
        <text class="btn-icon">🗺️</text>
        <text>地图选点</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-box">
      <input
        class="search-input"
        placeholder="搜索地点、商铺..."
        value="{{searchKeyword}}"
        bindinput="onSearchInput"
        bindconfirm="searchLocation"
      />
      <view class="search-btn" bindtap="searchLocation">🔍</view>
    </view>

    <!-- 搜索结果 -->
    <view wx:if="{{searchResults.length > 0}}" class="search-results">
      <view
        wx:for="{{searchResults}}"
        wx:key="id"
        class="result-item"
        bindtap="selectLocation"
        data-item="{{item}}"
      >
        <text class="result-name">{{item.title}}</text>
        <text class="result-address">{{item.address}}</text>
      </view>
    </view>
  </view>
```

- [ ] **Step 2: Commit**

```bash
git add miniprogram/pages/checkin/checkin.wxml
git commit -m "feat: add map component to checkin page"
```

---

## Task 7: 添加地图样式

**Files:**
- Modify: `miniprogram/pages/checkin/checkin.wxss`

- [ ] **Step 1: 添加地图相关样式**

```css
/* 地图容器 */
.map-container {
  position: relative;
  width: 100%;
  height: 400rpx;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  background: #f5f7fa;
}

.location-map {
  width: 100%;
  height: 100%;
}

/* 地图占位提示 */
.map-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.placeholder-text {
  font-size: 28rpx;
  color: #999;
}

/* 位置信息 */
.location-info {
  background: #f0f9ff;
  border: 2rpx solid #667eea;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
}

.location-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.location-address {
  display: block;
  font-size: 26rpx;
  color: #666;
}

/* 操作按钮组 */
.location-actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.location-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 20rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
}

.location-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.location-btn.secondary {
  background: #f5f7fa;
  color: #667eea;
  border: 2rpx solid #667eea;
}

.btn-icon {
  margin-right: 10rpx;
  font-size: 32rpx;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
}

.search-input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.search-btn {
  font-size: 36rpx;
  padding: 0 20rpx;
}

/* 搜索结果 */
.search-results {
  background: #fff;
  border-radius: 16rpx;
  max-height: 400rpx;
  overflow-y: auto;
  margin-top: 20rpx;
  border: 2rpx solid #eee;
}

.result-item {
  padding: 20rpx 30rpx;
  border-bottom: 2rpx solid #f5f5f5;
  display: flex;
  flex-direction: column;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:active {
  background: #f5f7fa;
}

.result-name {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 6rpx;
}

.result-address {
  font-size: 24rpx;
  color: #999;
}
```

- [ ] **Step 2: Commit**

```bash
git add miniprogram/pages/checkin/checkin.wxss
git commit -m "style: add map component styles"
```

---

## Task 8: 创建地图标记图标

**Files:**
- Create: `miniprogram/images/marker.png`

- [ ] **Step 1: 创建标记图标**

需要一个30x30像素的标记图标。可以使用：
1. 在线图标生成工具
2. 或者使用文字替代（临时方案）

临时方案：修改代码不使用图标，使用默认标记：
```javascript
// 在updateLocation中，如果不传iconPath，会使用默认标记
const marker = {
  id: 1,
  latitude: latitude,
  longitude: longitude,
  title: name
  // 不设置iconPath，使用默认标记
}
```

- [ ] **Step 2: Commit**

```bash
git add miniprogram/images/marker.png  # 如果创建了图标
git commit -m "asset: add map marker icon"
```

---

## Task 9: 测试和调试

**Files:**
- 无需修改文件，纯测试步骤

- [ ] **Step 1: 测试GPS定位**

1. 编译小程序
2. 点击「获取当前位置」按钮
3. 检查是否弹出权限申请
4. 授权后查看是否显示地图和位置名称

预期结果：
- 地图显示当前位置
- 标记点显示在地图中心
- 位置名称显示最近POI

- [ ] **Step 2: 测试地图交互**

1. 拖动地图
2. 点击地图空白处
3. 检查是否触发位置更新

- [ ] **Step 3: 测试搜索功能**

1. 在搜索框输入「肯德基」
2. 点击搜索按钮
3. 选择搜索结果
4. 检查地图是否跳转到选中位置

- [ ] **Step 4: 测试错误处理**

1. 拒绝定位权限，检查提示
2. 搜索不存在的关键词，检查提示
3. 断开网络，检查错误处理

- [ ] **Step 5: Commit**

```bash
git commit -m "test: verify location module functionality"
```

---

## Task 10: 清理旧代码

**Files:**
- Modify: `miniprogram/pages/checkin/checkin.js`
- Delete: 旧的高德API相关代码

- [ ] **Step 1: 移除高德API相关代码**

删除以下内容：
1. 高德SDK的require（如果有）
2. 高德Key常量
3. 旧的getAddressFromLocation方法（使用高德API的版本）
4. 旧的searchLocation方法（使用高德API的版本）

- [ ] **Step 2: 更新openMapPicker方法**

保留作为备用方案：
```javascript
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
}
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/checkin/checkin.js
git commit -m "refactor: remove old AMap API code"
```

---

## 验证清单

功能验证：
- [ ] GPS定位获取当前位置
- [ ] 逆地理编码显示最近POI名称
- [ ] 内嵌地图显示当前位置
- [ ] 地图标记正确显示
- [ ] 搜索地点功能正常
- [ ] 选择搜索结果后地图跳转
- [ ] 位置信息正确保存到打卡记录

错误处理验证：
- [ ] 定位权限被拒绝有提示
- [ ] 网络错误有提示
- [ ] 搜索无结果有提示

---

## 注意事项

1. **腾讯Key需要开启WebService API**：
   - 访问 https://lbs.qq.com/dev/console/application/mine
   - 在Key管理中找到你的Key
   - 点击「设置」→ 勾选「WebServiceAPI」

2. **小程序后台配置**：
   - 必须配置 `https://apis.map.qq.com` 到request合法域名

3. **真机调试**：
   - 开发者工具的地图组件可能有差异，建议在真机上测试

4. **坐标系**：
   - 使用gcj02坐标系（国测局坐标），这是微信小程序标准坐标系
