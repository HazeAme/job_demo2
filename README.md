# 旅行打卡小程序

> 一个精美的旅游打卡Web应用，支持定位、图片上传、心情记录、数据统计等功能。

## 功能特性

- 用户注册/登录（JWT认证）
- GPS定位获取当前位置
- 图片上传（支持多图）
- 记录心情和文字内容
- 查看历史打卡记录（时间轴展示）
- 数据统计分析（打卡趋势、心情分布）

## 技术栈

### 后端
- Java Spring Boot 2.7.x
- MyBatis-Plus（ORM）
- MySQL 8.0（数据库）
- Redis 6.x（缓存）
- JWT（认证）

### 前端
- Vue3 + TypeScript
- Element Plus（UI组件库）
- Pinia（状态管理）
- Axios（HTTP请求）
- ECharts（图表）

## 项目结构

```
job_demo2/
├── backend/                    # Spring Boot后端
│   ├── src/main/java/com/checkin/
│   │   ├── config/            # 配置类
│   │   ├── controller/        # API控制器
│   │   ├── service/           # 业务逻辑
│   │   ├── mapper/            # MyBatis映射
│   │   ├── entity/            # 实体类
│   │   ├── dto/               # 数据传输对象
│   │   ├── utils/             # 工具类
│   │   └── interceptor/       # 拦截器
│   ├── src/main/resources/
│   │   └── application.yml    # 配置文件
│   ├── sql/
│   │   └── init.sql           # 数据库初始化脚本
│   └── pom.xml                # Maven配置
├── frontend/                   # Vue3前端
│   ├── src/
│   │   ├── views/             # 页面组件
│   │   ├── components/        # 公共组件
│   │   ├── api/               # API请求
│   │   ├── stores/            # Pinia状态管理
│   │   ├── utils/             # 工具函数
│   │   ├── router/            # 路由配置
│   │   └── App.vue            # 根组件
│   ├── package.json
│   └── vite.config.ts
└── uploads/                    # 图片上传目录
```

## 环境要求

- JDK 1.8+
- Maven 3.6+
- MySQL 8.0
- Redis 6.x
- Node.js 16+

## 快速开始

### 1. 初始化数据库

```bash
# 登录MySQL
mysql -u root -p

# 执行初始化脚本
source backend/sql/init.sql
```

### 2. 启动后端服务

```bash
cd backend

# 编译
mvn clean package

# 运行
mvn spring-boot:run
```

后端服务将运行在 `http://localhost:8080`

### 3. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev
```

前端服务将运行在 `http://localhost:5173`

### 4. 部署到公网（内网穿透）

安装 cpolar：
```bash
npm install -g cpolar
```

启动内网穿透：
```bash
# 穿透前端端口
cpolar http 5173
```


## API接口文档

### 用户模块

| 接口 | 方法 | 描述 |
|------|------|------|
| /api/user/register | POST | 用户注册 |
| /api/user/login | POST | 用户登录 |

### 打卡模块

| 接口 | 方法 | 描述 |
|------|------|------|
| /api/check-in | POST | 创建打卡 |
| /api/check-in/list | GET | 查询打卡列表 |
| /api/check-in/{id} | GET | 获取打卡详情 |

### 统计模块

| 接口 | 方法 | 描述 |
|------|------|------|
| /api/statistics | GET | 获取统计数据 |

## 部署说明

### 生产环境部署

1. **后端打包**
```bash
cd backend
mvn clean package -DskipTests
```

2. **前端打包**
```bash
cd frontend
npm run build
```

3. **部署到服务器**
- 上传 `backend/target/*.jar` 到服务器
- 上传 `frontend/dist/` 到服务器
- 配置Nginx反向代理

### 内网穿透部署

1. 本地启动前后端服务
2. 使用 cpolar 穿透前端端口



## 项目亮点

1. 完整的技术栈：Vue3 + Spring Boot + MySQL + Redis
2. JWT认证机制，安全可靠
3. 支持多图片上传和预览
4. 精美的UI设计，渐变背景+毛玻璃效果
5. 数据可视化，ECharts图表展示
6. 响应式设计，适配移动端和PC端
