# TabBar 图标

## 需要创建的图标文件（6个）

尺寸要求：81px × 81px，PNG格式

### 图标列表：

1. **icon_checkin.png** - 打卡未选中
2. **icon_checkin_selected.png** - 打卡选中
3. **icon_history.png** - 历史未选中
4. **icon_history_selected.png** - 历史选中
5. **icon_statistics.png** - 统计未选中
6. **icon_statistics_selected.png** - 统计选中

## 在线生成工具

### 方案1：使用阿里图标库（推荐）
1. 访问 https://www.iconfont.cn/
2. 搜索关键词：打卡、历史、统计、图表
3. 选择喜欢的图标，下载PNG格式
4. 调整尺寸为 81×81 像素

### 方案2：使用在线图标生成器
- https://www.zhaozi.cn/ （找字网图标生成）
- https://www.fontawesome.com/ （FontAwesome图标）

### 方案3：使用微信小程序自带图标
如果不想用图片，可以改用文字图标：

在 app.json 中移除 iconPath，直接使用文字：
```json
{
  "pagePath": "pages/checkin/checkin",
  "text": "打卡"
}
```

但这样就没有图标了，只有文字。

## 快速方案：使用 Emoji 作为图标

创建一个简单的文本图标（不推荐用于生产环境）：

可以用截图工具截取以下 Emoji，保存为 81×81 的PNG：
- 打卡：📍 或 ✏️
- 历史：📋 或 📝
- 统计：📊 或 📈

## 推荐图标样式

**未选中状态**：
- 颜色：灰色 (#999999)
- 线条：细线

**选中状态**：
- 颜色：主题色 (#667eea)
- 线条：粗线或填充

## 图标资源网站

1. **Iconfont** - https://www.iconfont.cn/
2. **IconPark** - https://iconpark.oceanengine.com/
3. **Flaticon** - https://www.flaticon.com/
4. **Icons8** - https://icons8.com/

## 临时解决方案

如果暂时不想制作图标，可以在开发者工具中：
1. 右键点击项目 → 新建文件夹 → images
2. 随便找3张图片，复制成6份，重命名为上述文件名
3. 先让tabBar显示出来，后续再替换为正式图标
