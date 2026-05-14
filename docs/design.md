# 旅游打卡小程序 - 系统设计文档

## 一、项目概述

### 1.1 项目背景
本项目为售前专员实习生面试题目，实现一个旅游打卡功能的小程序/ Web 应用。

### 1.2 核心功能
- 用户注册/登录（JWT认证）
- GPS定位获取当前位置
- 图片上传（本地存储）
- 记录心情和文字内容
- 查看历史打卡记录
- 打卡数据统计分析

### 1.3 技术栈
- **前端**: Vue3 + TypeScript + Element Plus + Vite
- **后端**: Java Spring Boot 2.7.x + MyBatis-Plus
- **数据库**: MySQL 8.0
- **缓存**: Redis 6.x
- **部署**: 内网穿透（cpolar）

---

## 二、系统架构

### 2.1 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Vue3)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ 登录页面  │  │ 打卡页面  │  │ 历史记录  │  │ 统计页面  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端层 (Spring Boot)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Controller  │  │   Service    │  │    Mapper    │       │
│  │   (API接口)   │  │  (业务逻辑)   │  │  (数据访问)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  JWT认证拦截  │  │  文件上传处理  │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│        MySQL            │    │        Redis            │
│  ┌───────┐  ┌────────┐  │    │  ┌──────────────┐       │
│  │ 用户表 │  │ 打卡表  │  │    │  │   Token缓存   │       │
│  └───────┘  └────────┘  │    │  └──────────────┘       │
└─────────────────────────┘    └─────────────────────────┘
```

### 2.2 模块划分

| 模块 | 职责 | 技术点 |
|------|------|--------|
| 用户模块 | 注册、登录、JWT认证 | Spring Security + JWT |
| 打卡模块 | 创建、查询、列表 | 文件上传、分页查询 |
| 统计模块 | 数据分析、可视化 | 聚合查询、图表展示 |
| 文件模块 | 图片上传、存储 | 本地文件系统 |

---

## 三、数据库设计

### 3.1 用户表 (user)
```sql
CREATE TABLE `user` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '加密密码',
  `avatar` VARCHAR(255) COMMENT '头像URL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 3.2 打卡记录表 (check_in)
```sql
CREATE TABLE `check_in` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '打卡ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `content` TEXT COMMENT '打卡内容',
  `mood` VARCHAR(20) COMMENT '心情（happy/excited/relaxed/tired等）',
  `location_name` VARCHAR(200) COMMENT '位置名称',
  `latitude` DECIMAL(10, 8) COMMENT '纬度',
  `longitude` DECIMAL(11, 8) COMMENT '经度',
  `images` JSON COMMENT '图片URL数组',
  `check_in_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_check_in_time` (`check_in_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打卡记录表';
```

---

## 四、API 接口设计

### 4.1 用户模块

#### 注册
```
POST /api/user/register
Content-Type: application/json

Request:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "test",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 登录
```
POST /api/user/login
Content-Type: application/json

Request:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "test",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 4.2 打卡模块

#### 创建打卡
```
POST /api/check-in
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
- content: "string" (打卡内容)
- mood: "string" (心情)
- locationName: "string" (位置名称)
- latitude: "number" (纬度)
- longitude: "number" (经度)
- images: File[] (图片文件数组)

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "content": "今天去了西湖...",
    "mood": "happy",
    "locationName": "杭州西湖",
    "images": ["/uploads/xxx.jpg"],
    "checkInTime": "2024-01-15 14:30:00"
  }
}
```

#### 查询打卡列表
```
GET /api/check-in/list?page=1&size=10
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 100,
    "list": [
      {
        "id": 1,
        "content": "...",
        "mood": "happy",
        "locationName": "...",
        "images": [...],
        "checkInTime": "..."
      }
    ]
  }
}
```

#### 获取打卡详情
```
GET /api/check-in/{id}
Authorization: Bearer {token}
```

### 4.3 统计模块

#### 获取统计数据
```
GET /api/statistics
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "totalCheckIns": 50,           // 总打卡次数
    "thisMonthCheckIns": 10,       // 本月打卡次数
    "favoriteMood": "happy",       // 最常出现的心情
    "favoriteLocation": "杭州",     // 最常打卡的城市
    "recentTrend": [               // 近7天打卡趋势
      {"date": "01-09", "count": 2},
      {"date": "01-10", "count": 1}
    ],
    "moodDistribution": [          // 心情分布
      {"mood": "happy", "count": 30},
      {"mood": "excited", "count": 15}
    ]
  }
}
```

---

## 五、前端页面设计

### 5.1 页面结构
```
/src
├── views/
│   ├── Login.vue           # 登录/注册页
│   ├── CheckIn.vue         # 打卡页（核心页面）
│   ├── History.vue         # 历史记录页
│   ├── Statistics.vue      # 统计页
│   └── Layout.vue          # 布局组件
├── components/
│   ├── CheckInCard.vue     # 打卡卡片组件
│   ├── ImageUploader.vue   # 图片上传组件
│   ├── MoodSelector.vue    # 心情选择组件
│   └── StatChart.vue       # 统计图表组件
├── api/
│   └── index.ts            # API请求封装
├── stores/
│   └── user.ts             # 用户状态管理
└── utils/
    └── request.ts          # Axios封装
```

### 5.2 视觉设计方向

**整体风格**：清新旅行风
- **主色调**：#4CAF50（清新绿）+ #FF9800（活力橙）
- **背景**：渐变色或旅行风景背景
- **卡片设计**：圆角、阴影、毛玻璃效果
- **动画**：流畅的过渡动画，增强交互感

**关键页面效果**：
1. **登录页**：全屏背景图 + 居中毛玻璃卡片
2. **打卡页**：地图定位 + 图片预览网格 + 心情表情选择
3. **历史页**：瀑布流/时间轴布局
4. **统计页**：ECharts图表 + 数据卡片

---

## 六、部署方案

### 6.1 本地开发环境
- JDK 1.8+
- Maven 3.6+
- MySQL 8.0
- Redis 6.x
- Node.js 16+

### 6.2 部署步骤

#### 后端部署
1. 打包：`mvn clean package`
2. 运行：`java -jar target/checkin-0.0.1-SNAPSHOT.jar`
3. 服务运行在 `http://localhost:8080`

#### 前端部署
1. 打包：`npm run build`
2. 预览：`npm run preview` 或部署到Nginx
3. 服务运行在 `http://localhost:5173`

#### 内网穿透
1. 安装cpolar：`npm install -g cpolar`
2. 启动穿透：`cpolar http 5173`（前端端口）
3. 获得公网链接，分享给HR

---

## 七、项目亮点

1. **完整的技术栈**：Vue3 + Spring Boot + MySQL + Redis
2. **JWT认证**：安全的用户身份验证机制
3. **文件上传**：支持多图片上传和预览
4. **数据可视化**：ECharts统计图表展示
5. **响应式设计**：适配移动端和PC端
6. **精美UI**：Element Plus + 自定义样式
