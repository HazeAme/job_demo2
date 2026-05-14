# 高德地图API配置指南

## 问题说明

小程序中的地图位置搜索功能需要调用高德地图API，这需要：
1. 申请高德地图API Key
2. 配置Key的权限
3. 配置服务器域名（小程序后台）

## 申请高德地图API Key

### 1. 注册高德开放平台账号

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 点击右上角「注册/登录」
3. 完成账号注册和实名认证

### 2. 创建应用

1. 登录后进入「控制台」
2. 左侧菜单「应用管理」→「我的应用」
3. 点击「创建新应用」
4. 填写应用信息：
   - 应用名称：旅行打卡小程序
   - 应用类型：出行

### 3. 添加Key

1. 在应用详情页点击「添加Key」
2. 填写Key信息：
   - Key名称：小程序搜索
   - 服务平台：**Web服务**
   - 域名白名单：留空（不限制）或填写你的服务器域名

3. 点击「提交」，复制生成的Key

### 4. 配置Key权限

确保Key有以下API权限：
- ✅ 地理编码 API
- ✅ 逆地理编码 API
- ✅ 搜索POI API
- ✅ 静态地图 API

如果没有，在Key详情页「权限设置」中开启。

## 配置小程序

### 1. 修改代码中的Key

打开 `miniprogram/pages/checkin/checkin.js`，替换Key：

```javascript
const AMAP_KEY = '你申请的高德地图Key'
```

### 2. 配置服务器域名

在 [微信公众平台](https://mp.weixin.qq.com/)：

1. 登录小程序后台
2. 「开发」→「开发管理」→「开发设置」→「服务器域名」
3. 在「request合法域名」中添加：
   ```
   https://restapi.amap.com
   ```

4. 在「downloadFile合法域名」中添加：
   ```
   https://restapi.amap.com
   ```

### 3. 开发者工具配置

在微信开发者工具中：

1. 点击右上角「详情」
2. 勾选「不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书」
   - ⚠️ 仅用于开发调试，发布前必须配置真实域名

## 测试搜索功能

1. 重新编译小程序
2. 进入打卡页面
3. 在搜索框输入「肯德基」或「地铁站」
4. 查看是否能显示搜索结果

## 常见问题

### 1. 提示 "USERKEY_PLAT_NOMATCH"

**原因：** Key的平台类型不正确

**解决：**
- 确保申请的是「Web服务」类型的Key
- 不是「Android」、「iOS」或「微信小程序」类型

### 2. 提示 "USERKEY_NOT_EXIST"

**原因：** Key不存在或填写错误

**解决：**
- 检查Key是否复制完整
- 确认Key已提交审核通过

### 3. 提示 "DAILY_QUERY_OVER_LIMIT"

**原因：** 超过每日免费调用次数

**解决：**
- 个人开发者：每日5000次免费额度
- 企业开发者：每日30万次免费额度
- 或购买更高额度

### 4. 搜索结果为空

**原因：** 
- 关键词太冷门
- 当前城市无相关POI

**解决：**
- 尝试搜索「麦当劳」、「星巴克」等常见地点
- 检查网络连接

### 5. 小程序提示 "request:fail"

**原因：** 未配置服务器域名

**解决：**
- 在小程序后台添加 `https://restapi.amap.com`
- 或在开发者工具中开启「不校验合法域名」

## 备用方案（如果高德API无法使用）

如果暂时无法申请高德Key，可以使用微信小程序自带的地图选点功能：

```javascript
// 在 checkin.js 中替换 openMap 函数
openMap() {
  wx.chooseLocation({
    success: (res) => {
      this.setData({
        'location.name': res.name || res.address,
        'location.latitude': res.latitude,
        'location.longitude': res.longitude
      })
    }
  })
}
```

这样用户可以通过地图直接选点，不需要搜索。

## 参考文档

- [高德地图Web服务API](https://lbs.amap.com/api/webservice/summary)
- [微信小程序地理位置API](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.chooseLocation.html)
