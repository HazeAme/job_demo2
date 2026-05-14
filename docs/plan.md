# 旅游打卡小程序 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个完整的旅游打卡Web应用，包含用户认证、打卡记录、图片上传、数据统计功能

**Architecture:** 前后端分离架构，Spring Boot提供REST API，Vue3构建SPA，MySQL持久化数据，Redis缓存Token

**Tech Stack:** Java Spring Boot, Vue3 + TypeScript + Element Plus, MySQL, Redis

---

## 文件结构规划

```
job_demo2/
├── backend/                          # Spring Boot后端
│   ├── src/main/java/com/checkin/
│   │   ├── config/                   # 配置类
│   │   ├── controller/               # API控制器
│   │   ├── service/                  # 业务逻辑
│   │   ├── mapper/                   # MyBatis映射
│   │   ├── entity/                   # 实体类
│   │   ├── dto/                      # 数据传输对象
│   │   ├── vo/                       # 视图对象
│   │   ├── utils/                    # 工具类
│   │   └── interceptor/              # 拦截器
│   ├── src/main/resources/
│   │   ├── application.yml           # 配置文件
│   │   └── mapper/                   # XML映射文件
│   └── pom.xml                       # Maven配置
├── frontend/                         # Vue3前端
│   ├── src/
│   │   ├── views/                    # 页面组件
│   │   ├── components/               # 公共组件
│   │   ├── api/                      # API请求
│   │   ├── stores/                   # Pinia状态管理
│   │   ├── utils/                    # 工具函数
│   │   ├── assets/                   # 静态资源
│   │   ├── router/                   # 路由配置
│   │   └── App.vue                   # 根组件
│   ├── package.json
│   └── vite.config.ts
├── uploads/                          # 图片上传目录
└── docs/
    ├── design.md                     # 设计文档
    └── 功能分析与实现思路.docx        # 交付文档
```

---

## Task 1: 初始化Spring Boot项目

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/checkin/CheckinApplication.java`

- [ ] **Step 1: 创建pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.14</version>
        <relativePath/>
    </parent>
    <groupId>com.checkin</groupId>
    <artifactId>travel-checkin</artifactId>
    <version>1.0.0</version>
    <name>travel-checkin</name>
    <description>旅游打卡小程序后端</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.33</version>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>3.5.3.1</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt</artifactId>
            <version>0.9.1</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: 创建application.yml**

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/travel_checkin?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 100MB
  redis:
    host: localhost
    port: 6379
    database: 0

mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  mapper-locations: classpath:/mapper/**/*.xml
  type-aliases-package: com.checkin.entity

upload:
  path: ./uploads/
  access-url: /uploads/

jwt:
  secret: travelCheckinSecretKey2024
  expiration: 86400000
```

- [ ] **Step 3: 创建启动类**

```java
package com.checkin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CheckinApplication {
    public static void main(String[] args) {
        SpringApplication.run(CheckinApplication.class, args);
    }
}
```

---

## Task 2: 创建数据库表

**Files:**
- Create: `backend/sql/init.sql`

- [ ] **Step 1: 创建SQL文件**

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS travel_checkin 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE travel_checkin;

-- 用户表
CREATE TABLE `user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '加密密码',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 打卡记录表
CREATE TABLE `check_in` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '打卡ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `content` TEXT COMMENT '打卡内容',
  `mood` VARCHAR(20) DEFAULT NULL COMMENT '心情',
  `location_name` VARCHAR(200) DEFAULT NULL COMMENT '位置名称',
  `latitude` DECIMAL(10, 8) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(11, 8) DEFAULT NULL COMMENT '经度',
  `images` JSON DEFAULT NULL COMMENT '图片URL数组',
  `check_in_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_check_in_time` (`check_in_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打卡记录表';
```

---

## Task 3: 实现实体类和DTO

**Files:**
- Create: `backend/src/main/java/com/checkin/entity/User.java`
- Create: `backend/src/main/java/com/checkin/entity/CheckIn.java`
- Create: `backend/src/main/java/com/checkin/dto/Result.java`

- [ ] **Step 1: 创建User实体**

```java
package com.checkin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String avatar;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 2: 创建CheckIn实体**

```java
package com.checkin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("check_in")
public class CheckIn {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String content;
    private String mood;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private String images;
    private LocalDateTime checkInTime;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 3: 创建统一返回结果**

```java
package com.checkin.dto;

import lombok.Data;

@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(String message) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMessage(message);
        return result;
    }

    public static <T> Result<T> error(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }
}
```

---

## Task 4: 实现JWT工具类

**Files:**
- Create: `backend/src/main/java/com/checkin/utils/JwtUtil.java`

- [ ] **Step 1: 创建JWT工具类**

```java
package com.checkin.utils;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.annotation.PostConstruct;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration}")
    private Long expiration;
    
    private static String STATIC_SECRET;
    private static Long STATIC_EXPIRATION;
    
    @PostConstruct
    public void init() {
        STATIC_SECRET = secret;
        STATIC_EXPIRATION = expiration;
    }
    
    public static String generateToken(Long userId, String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + STATIC_EXPIRATION);
        
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("username", username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, STATIC_SECRET)
                .compact();
    }
    
    public static Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }
    
    public static String getUsernameFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("username", String.class);
    }
    
    public static Claims parseToken(String token) {
        return Jwts.parser()
                .setSigningKey(STATIC_SECRET)
                .parseClaimsJws(token)
                .getBody();
    }
    
    public static boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(STATIC_SECRET).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

---

## Task 5: 实现登录拦截器

**Files:**
- Create: `backend/src/main/java/com/checkin/interceptor/AuthInterceptor.java`
- Create: `backend/src/main/java/com/checkin/config/WebConfig.java`

- [ ] **Step 1: 创建认证拦截器**

```java
package com.checkin.interceptor;

import com.checkin.utils.JwtUtil;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private final StringRedisTemplate redisTemplate;
    
    public AuthInterceptor(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader("Authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            response.setStatus(401);
            return false;
        }
        token = token.substring(7);
        
        if (!JwtUtil.validateToken(token)) {
            response.setStatus(401);
            return false;
        }
        
        String userId = JwtUtil.getUserIdFromToken(token).toString();
        String cachedToken = redisTemplate.opsForValue().get("token:" + userId);
        if (cachedToken == null || !cachedToken.equals(token)) {
            response.setStatus(401);
            return false;
        }
        
        request.setAttribute("userId", userId);
        return true;
    }
}
```

- [ ] **Step 2: 注册拦截器**

```java
package com.checkin.config;

import com.checkin.interceptor.AuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final AuthInterceptor authInterceptor;
    
    public WebConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/user/login", "/api/user/register", "/uploads/**");
    }
}
```

---

## Task 6: 实现用户模块

**Files:**
- Create: `backend/src/main/java/com/checkin/mapper/UserMapper.java`
- Create: `backend/src/main/java/com/checkin/service/UserService.java`
- Create: `backend/src/main/java/com/checkin/controller/UserController.java`

- [ ] **Step 1: 创建UserMapper**

```java
package com.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.checkin.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
```

- [ ] **Step 2: 创建UserService**

```java
package com.checkin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.checkin.entity.User;
import com.checkin.mapper.UserMapper;
import com.checkin.utils.JwtUtil;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class UserService {
    private final UserMapper userMapper;
    private final StringRedisTemplate redisTemplate;
    
    public UserService(UserMapper userMapper, StringRedisTemplate redisTemplate) {
        this.userMapper = userMapper;
        this.redisTemplate = redisTemplate;
    }
    
    public Map<String, Object> register(String username, String password) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", username);
        if (userMapper.selectCount(wrapper) > 0) {
            throw new RuntimeException("用户名已存在");
        }
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(encryptPassword(password));
        userMapper.insert(user);
        
        String token = JwtUtil.generateToken(user.getId(), username);
        redisTemplate.opsForValue().set("token:" + user.getId(), token, 1, TimeUnit.DAYS);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("token", token);
        return result;
    }
    
    public Map<String, Object> login(String username, String password) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", username);
        User user = userMapper.selectOne(wrapper);
        
        if (user == null || !user.getPassword().equals(encryptPassword(password))) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        String token = JwtUtil.generateToken(user.getId(), username);
        redisTemplate.opsForValue().set("token:" + user.getId(), token, 1, TimeUnit.DAYS);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("token", token);
        return result;
    }
    
    private String encryptPassword(String password) {
        return DigestUtils.md5DigestAsHex(password.getBytes(StandardCharsets.UTF_8));
    }
}
```

- [ ] **Step 3: 创建UserController**

```java
package com.checkin.controller;

import com.checkin.dto.Result;
import com.checkin.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @PostMapping("/register")
    public Result<Map<String, Object>> register(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        if (username == null || password == null) {
            return Result.error("用户名和密码不能为空");
        }
        try {
            return Result.success(userService.register(username, password));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        if (username == null || password == null) {
            return Result.error("用户名和密码不能为空");
        }
        try {
            return Result.success(userService.login(username, password));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
```

---

## Task 7: 实现打卡模块

**Files:**
- Create: `backend/src/main/java/com/checkin/mapper/CheckInMapper.java`
- Create: `backend/src/main/java/com/checkin/service/CheckInService.java`
- Create: `backend/src/main/java/com/checkin/controller/CheckInController.java`

- [ ] **Step 1: 创建CheckInMapper**

```java
package com.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.checkin.entity.CheckIn;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;
import java.util.Map;

@Mapper
public interface CheckInMapper extends BaseMapper<CheckIn> {
    @Select("SELECT mood, COUNT(*) as count FROM check_in WHERE user_id = #{userId} GROUP BY mood")
    List<Map<String, Object>> selectMoodDistribution(@Param("userId") Long userId);
    
    @Select("SELECT DATE(check_in_time) as date, COUNT(*) as count FROM check_in " +
            "WHERE user_id = #{userId} AND check_in_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
            "GROUP BY DATE(check_in_time) ORDER BY date")
    List<Map<String, Object>> selectRecentTrend(@Param("userId") Long userId);
}
```

- [ ] **Step 2: 创建CheckInService**

```java
package com.checkin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.checkin.entity.CheckIn;
import com.checkin.mapper.CheckInMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CheckInService {
    private final CheckInMapper checkInMapper;
    private final ObjectMapper objectMapper;
    
    @Value("${upload.path}")
    private String uploadPath;
    
    @Value("${upload.access-url}")
    private String accessUrl;
    
    public CheckInService(CheckInMapper checkInMapper, ObjectMapper objectMapper) {
        this.checkInMapper = checkInMapper;
        this.objectMapper = objectMapper;
    }
    
    public CheckIn createCheckIn(Long userId, String content, String mood, 
                                  String locationName, Double latitude, Double longitude,
                                  List<MultipartFile> images) throws IOException {
        CheckIn checkIn = new CheckIn();
        checkIn.setUserId(userId);
        checkIn.setContent(content);
        checkIn.setMood(mood);
        checkIn.setLocationName(locationName);
        checkIn.setLatitude(latitude);
        checkIn.setLongitude(longitude);
        checkIn.setCheckInTime(LocalDateTime.now());
        
        List<String> imageUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
            
            for (MultipartFile image : images) {
                String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
                Path filePath = Paths.get(uploadPath, fileName);
                image.transferTo(filePath);
                imageUrls.add(accessUrl + fileName);
            }
        }
        checkIn.setImages(objectMapper.writeValueAsString(imageUrls));
        
        checkInMapper.insert(checkIn);
        return checkIn;
    }
    
    public Page<CheckIn> getCheckInList(Long userId, Integer page, Integer size) {
        QueryWrapper<CheckIn> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).orderByDesc("check_in_time");
        return checkInMapper.selectPage(new Page<>(page, size), wrapper);
    }
    
    public CheckIn getCheckInDetail(Long id, Long userId) {
        QueryWrapper<CheckIn> wrapper = new QueryWrapper<>();
        wrapper.eq("id", id).eq("user_id", userId);
        return checkInMapper.selectOne(wrapper);
    }
    
    public List<String> getImages(Long checkInId) throws IOException {
        CheckIn checkIn = checkInMapper.selectById(checkInId);
        if (checkIn == null || checkIn.getImages() == null) {
            return new ArrayList<>();
        }
        return objectMapper.readValue(checkIn.getImages(), new TypeReference<List<String>>() {});
    }
}
```

- [ ] **Step 3: 创建CheckInController**

```java
package com.checkin.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.checkin.dto.Result;
import com.checkin.entity.CheckIn;
import com.checkin.service.CheckInService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/check-in")
public class CheckInController {
    private final CheckInService checkInService;
    private final ObjectMapper objectMapper;
    
    public CheckInController(CheckInService checkInService, ObjectMapper objectMapper) {
        this.checkInService = checkInService;
        this.objectMapper = objectMapper;
    }
    
    @PostMapping
    public Result<Map<String, Object>> createCheckIn(
            @RequestParam("content") String content,
            @RequestParam(value = "mood", required = false) String mood,
            @RequestParam(value = "locationName", required = false) String locationName,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            HttpServletRequest request) throws IOException {
        
        Long userId = Long.parseLong(request.getAttribute("userId").toString());
        CheckIn checkIn = checkInService.createCheckIn(userId, content, mood, locationName, 
                                                        latitude, longitude, images);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", checkIn.getId());
        result.put("content", checkIn.getContent());
        result.put("mood", checkIn.getMood());
        result.put("locationName", checkIn.getLocationName());
        result.put("images", objectMapper.readValue(checkIn.getImages(), new TypeReference<List<String>>() {}));
        result.put("checkInTime", checkIn.getCheckInTime());
        
        return Result.success(result);
    }
    
    @GetMapping("/list")
    public Result<Map<String, Object>> getCheckInList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            HttpServletRequest request) throws IOException {
        
        Long userId = Long.parseLong(request.getAttribute("userId").toString());
        Page<CheckIn> checkInPage = checkInService.getCheckInList(userId, page, size);
        
        List<Map<String, Object>> list = new java.util.ArrayList<>();
        for (CheckIn checkIn : checkInPage.getRecords()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", checkIn.getId());
            item.put("content", checkIn.getContent());
            item.put("mood", checkIn.getMood());
            item.put("locationName", checkIn.getLocationName());
            item.put("latitude", checkIn.getLatitude());
            item.put("longitude", checkIn.getLongitude());
            item.put("images", objectMapper.readValue(checkIn.getImages(), new TypeReference<List<String>>() {}));
            item.put("checkInTime", checkIn.getCheckInTime());
            list.add(item);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("total", checkInPage.getTotal());
        result.put("list", list);
        
        return Result.success(result);
    }
    
    @GetMapping("/{id}")
    public Result<Map<String, Object>> getCheckInDetail(@PathVariable Long id, HttpServletRequest request) throws IOException {
        Long userId = Long.parseLong(request.getAttribute("userId").toString());
        CheckIn checkIn = checkInService.getCheckInDetail(id, userId);
        
        if (checkIn == null) {
            return Result.error("打卡记录不存在");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", checkIn.getId());
        result.put("content", checkIn.getContent());
        result.put("mood", checkIn.getMood());
        result.put("locationName", checkIn.getLocationName());
        result.put("latitude", checkIn.getLatitude());
        result.put("longitude", checkIn.getLongitude());
        result.put("images", objectMapper.readValue(checkIn.getImages(), new TypeReference<List<String>>() {}));
        result.put("checkInTime", checkIn.getCheckInTime());
        
        return Result.success(result);
    }
}
```

---

## Task 8: 实现统计模块

**Files:**
- Create: `backend/src/main/java/com/checkin/service/StatisticsService.java`
- Create: `backend/src/main/java/com/checkin/controller/StatisticsController.java`

- [ ] **Step 1: 创建StatisticsService**

```java
package com.checkin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.checkin.entity.CheckIn;
import com.checkin.mapper.CheckInMapper;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class StatisticsService {
    private final CheckInMapper checkInMapper;
    
    public StatisticsService(CheckInMapper checkInMapper) {
        this.checkInMapper = checkInMapper;
    }
    
    public Map<String, Object> getStatistics(Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        // 总打卡次数
        QueryWrapper<CheckIn> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        Long totalCheckIns = checkInMapper.selectCount(wrapper);
        result.put("totalCheckIns", totalCheckIns);
        
        // 本月打卡次数
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime firstDayOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        QueryWrapper<CheckIn> monthWrapper = new QueryWrapper<>();
        monthWrapper.eq("user_id", userId).ge("check_in_time", firstDayOfMonth);
        Long thisMonthCheckIns = checkInMapper.selectCount(monthWrapper);
        result.put("thisMonthCheckIns", thisMonthCheckIns);
        
        // 心情分布
        List<Map<String, Object>> moodDistribution = checkInMapper.selectMoodDistribution(userId);
        result.put("moodDistribution", moodDistribution);
        
        // 最常出现的心情
        String favoriteMood = moodDistribution.stream()
                .max(Comparator.comparing(m -> (Long) m.get("count")))
                .map(m -> (String) m.get("mood"))
                .orElse(null);
        result.put("favoriteMood", favoriteMood);
        
        // 近7天趋势
        List<Map<String, Object>> recentTrend = checkInMapper.selectRecentTrend(userId);
        // 补齐没有数据的日期
        List<Map<String, Object>> filledTrend = fillMissingDates(recentTrend);
        result.put("recentTrend", filledTrend);
        
        // 最常打卡的地点
        QueryWrapper<CheckIn> locationWrapper = new QueryWrapper<>();
        locationWrapper.eq("user_id", userId)
                .isNotNull("location_name")
                .groupBy("location_name")
                .orderByDesc("count(*)")
                .last("LIMIT 1");
        List<Map<String, Object>> locationResult = checkInMapper.selectMaps(locationWrapper);
        String favoriteLocation = locationResult.isEmpty() ? null : (String) locationResult.get(0).get("location_name");
        result.put("favoriteLocation", favoriteLocation);
        
        return result;
    }
    
    private List<Map<String, Object>> fillMissingDates(List<Map<String, Object>> trend) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 6; i >= 0; i--) {
            LocalDateTime date = now.minusDays(i);
            String dateStr = date.format(formatter);
            
            Map<String, Object> dayData = trend.stream()
                    .filter(m -> {
                        Object dateObj = m.get("date");
                        if (dateObj instanceof java.sql.Date) {
                            return ((java.sql.Date) dateObj).toLocalDate().format(DateTimeFormatter.ofPattern("MM-dd")).equals(dateStr);
                        }
                        return false;
                    })
                    .findFirst()
                    .orElse(null);
            
            Map<String, Object> item = new HashMap<>();
            item.put("date", dateStr);
            item.put("count", dayData != null ? dayData.get("count") : 0);
            result.add(item);
        }
        
        return result;
    }
}
```

- [ ] **Step 2: 创建StatisticsController**

```java
package com.checkin.controller;

import com.checkin.dto.Result;
import com.checkin.service.StatisticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {
    private final StatisticsService statisticsService;
    
    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }
    
    @GetMapping
    public Result<Map<String, Object>> getStatistics(HttpServletRequest request) {
        Long userId = Long.parseLong(request.getAttribute("userId").toString());
        return Result.success(statisticsService.getStatistics(userId));
    }
}
```

---

## Task 9: 配置MyBatis-Plus分页

**Files:**
- Create: `backend/src/main/java/com/checkin/config/MyBatisPlusConfig.java`

- [ ] **Step 1: 创建分页配置**

```java
package com.checkin.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MyBatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

---

## Task 10: 配置静态资源映射

**Files:**
- Modify: `backend/src/main/java/com/checkin/config/WebConfig.java`

- [ ] **Step 1: 添加静态资源映射**

```java
package com.checkin.config;

import com.checkin.interceptor.AuthInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final AuthInterceptor authInterceptor;
    
    @Value("${upload.path}")
    private String uploadPath;
    
    public WebConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/user/login", "/api/user/register", "/uploads/**");
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath);
    }
}
```

---

## Task 11: 初始化Vue3项目

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`

- [ ] **Step 1: 创建package.json**

```json
{
  "name": "travel-checkin-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.4",
    "vue-router": "^4.2.4",
    "pinia": "^2.1.6",
    "element-plus": "^2.3.14",
    "axios": "^1.5.0",
    "@element-plus/icons-vue": "^2.1.0",
    "echarts": "^5.4.3",
    "vue-echarts": "^6.6.1"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.3.4",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "vue-tsc": "^1.8.5"
  }
}
```

- [ ] **Step 2: 创建vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 3: 创建tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>旅行打卡 - 记录美好旅程</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## Task 12: 创建Vue3入口文件

**Files:**
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/vite-env.d.ts`

- [ ] **Step 1: 创建main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
```

- [ ] **Step 2: 创建App.vue**

```vue
<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style>
```

- [ ] **Step 3: 创建vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

---

## Task 13: 创建路由配置

**Files:**
- Create: `frontend/src/router/index.ts`

- [ ] **Step 1: 创建路由**

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/views/Layout.vue'),
      redirect: '/checkin',
      children: [
        {
          path: '/checkin',
          name: 'CheckIn',
          component: () => import('@/views/CheckIn.vue'),
          meta: { title: '打卡' }
        },
        {
          path: '/history',
          name: 'History',
          component: () => import('@/views/History.vue'),
          meta: { title: '历史记录' }
        },
        {
          path: '/statistics',
          name: 'Statistics',
          component: () => import('@/views/Statistics.vue'),
          meta: { title: '数据统计' }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (!to.meta.public && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router
```

---

## Task 14: 创建用户状态管理

**Files:**
- Create: `frontend/src/stores/user.ts`

- [ ] **Step 1: 创建Pinia Store**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info: any) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    logout
  }
})
```

---

## Task 15: 创建API请求封装

**Files:**
- Create: `frontend/src/utils/request.ts`
- Create: `frontend/src/api/index.ts`

- [ ] **Step 1: 创建request.ts**

```typescript
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: '',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const { code, message } = response.data
    if (code !== 200) {
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message))
    }
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
```

- [ ] **Step 2: 创建api/index.ts**

```typescript
import request from '@/utils/request'

export const userApi = {
  register: (data: { username: string; password: string }) =>
    request.post('/api/user/register', data),
  login: (data: { username: string; password: string }) =>
    request.post('/api/user/login', data)
}

export const checkInApi = {
  create: (data: FormData) =>
    request.post('/api/check-in', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  list: (params: { page?: number; size?: number }) =>
    request.get('/api/check-in/list', { params }),
  detail: (id: number) =>
    request.get(`/api/check-in/${id}`)
}

export const statisticsApi = {
  get: () =>
    request.get('/api/statistics')
}
```

---

## Task 16: 创建登录页面

**Files:**
- Create: `frontend/src/views/Login.vue`

- [ ] **Step 1: 创建登录页**

```vue
<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon class="logo-icon"><Compass /></el-icon>
        <h1>旅行打卡</h1>
        <p>记录你的每一次旅程</p>
      </div>
      
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
            <el-form-item prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              class="submit-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" :rules="rules" ref="registerFormRef">
            <el-form-item prop="username">
              <el-input 
                v-model="registerForm.username" 
                placeholder="用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input 
                v-model="registerForm.password" 
                type="password" 
                placeholder="密码"
                :prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input 
                v-model="registerForm.confirmPassword" 
                type="password" 
                placeholder="确认密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              class="submit-btn"
              :loading="loading"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Compass } from '@element-plus/icons-vue'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('login')
const loading = ref(false)
const loginFormRef = ref()
const registerFormRef = ref()

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate()
  
  loading.value = true
  try {
    const res: any = await userApi.login({
      username: loginForm.username,
      password: loginForm.password
    })
    userStore.setToken(res.data.token)
    userStore.setUserInfo({
      id: res.data.id,
      username: res.data.username
    })
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate()
  
  loading.value = true
  try {
    const res: any = await userApi.register({
      username: registerForm.username,
      password: registerForm.password
    })
    userStore.setToken(res.data.token)
    userStore.setUserInfo({
      id: res.data.id,
      username: res.data.username
    })
    ElMessage.success('注册成功')
    router.push('/')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 60px;
  color: #667eea;
  margin-bottom: 15px;
}

.login-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-tabs :deep(.el-tabs__nav) {
  width: 100%;
}

.login-tabs :deep(.el-tabs__item) {
  width: 50%;
  text-align: center;
  font-size: 16px;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  height: 44px;
  font-size: 16px;
}

.submit-btn:hover {
  opacity: 0.9;
}
</style>
```

---

## Task 17: 创建布局组件

**Files:**
- Create: `frontend/src/views/Layout.vue`

- [ ] **Step 1: 创建布局组件**

```vue
<template>
  <div class="layout-container">
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="logo"><Compass /></el-icon>
          <span class="title">旅行打卡</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-container class="main-container">
        <el-aside width="200px" class="layout-aside">
          <el-menu
            :default-active="$route.path"
            router
            class="layout-menu"
            background-color="transparent"
            text-color="#fff"
            active-text-color="#ffd04b"
          >
            <el-menu-item index="/checkin">
              <el-icon><EditPen /></el-icon>
              <span>打卡</span>
            </el-menu-item>
            <el-menu-item index="/history">
              <el-icon><Clock /></el-icon>
              <span>历史记录</span>
            </el-menu-item>
            <el-menu-item index="/statistics">
              <el-icon><TrendCharts /></el-icon>
              <span>数据统计</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <el-main class="layout-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Compass, UserFilled, ArrowDown, SwitchButton,
  EditPen, Clock, TrendCharts 
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const handleCommand = (command: string) => {
  if (command === 'logout') {
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
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.layout-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left .logo {
  font-size: 28px;
  color: #fff;
}

.header-left .title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #fff;
  padding: 5px 10px;
  border-radius: 20px;
  transition: background 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.username {
  font-size: 14px;
}

.main-container {
  height: calc(100vh - 60px);
}

.layout-aside {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.layout-menu {
  border-right: none;
  background: transparent !important;
}

.layout-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  font-size: 15px;
}

.layout-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

.layout-main {
  padding: 20px;
  overflow-y: auto;
}
</style>
```

---

## Task 18: 创建打卡页面

**Files:**
- Create: `frontend/src/views/CheckIn.vue`

- [ ] **Step 1: 创建打卡页**

```vue
<template>
  <div class="checkin-page">
    <el-card class="checkin-card">
      <template #header>
        <div class="card-header">
          <el-icon><EditPen /></el-icon>
          <span>记录新旅程</span>
        </div>
      </template>
      
      <el-form :model="form" label-position="top">
        <el-form-item label="位置">
          <div class="location-input">
            <el-input 
              v-model="form.locationName" 
              placeholder="点击获取当前位置"
              :prefix-icon="Location"
              readonly
              @click="getLocation"
            />
            <el-button 
              type="primary" 
              :icon="MapLocation"
              :loading="locationLoading"
              @click="getLocation"
            >
              定位
            </el-button>
          </div>
          <div v-if="form.latitude && form.longitude" class="coordinates">
            经纬度: {{ form.latitude.toFixed(6) }}, {{ form.longitude.toFixed(6) }}
          </div>
        </el-form-item>
        
        <el-form-item label="心情">
          <div class="mood-selector">
            <div
              v-for="mood in moods"
              :key="mood.value"
              class="mood-item"
              :class="{ active: form.mood === mood.value }"
              @click="form.mood = mood.value"
            >
              <span class="mood-emoji">{{ mood.emoji }}</span>
              <span class="mood-label">{{ mood.label }}</span>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="分享你的旅行故事..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="照片">
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
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="submitting"
            @click="handleSubmit"
          >
            <el-icon><Check /></el-icon>
            发布打卡
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Location, MapLocation, Plus, Check } from '@element-plus/icons-vue'
import { checkInApi } from '@/api'

const moods = [
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'excited', emoji: '🤩', label: '兴奋' },
  { value: 'relaxed', emoji: '😌', label: '放松' },
  { value: 'tired', emoji: '😴', label: '疲惫' },
  { value: 'surprised', emoji: '😲', label: '惊喜' }
]

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
      
      // 使用逆地理编码获取地址名称
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${form.latitude}&lon=${form.longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'zh-CN' } }
        )
        const data = await response.json()
        form.locationName = data.display_name || '未知位置'
      } catch (e) {
        form.locationName = `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
      }
      
      locationLoading.value = false
      ElMessage.success('定位成功')
    },
    (error) => {
      locationLoading.value = false
      ElMessage.error('定位失败: ' + error.message)
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
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

const handleRemove = () => {
  // 文件移除时自动更新fileList
}

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
    
    fileList.value.forEach((file) => {
      formData.append('images', file.raw)
    })
    
    await checkInApi.create(formData)
    ElMessage.success('打卡成功！')
    
    // 重置表单
    form.content = ''
    form.mood = ''
    form.locationName = ''
    form.latitude = null
    form.longitude = null
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

.checkin-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  border: none;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.location-input {
  display: flex;
  gap: 10px;
}

.location-input .el-input {
  flex: 1;
}

.coordinates {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.mood-selector {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.mood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: #f5f7fa;
  border: 2px solid transparent;
}

.mood-item:hover {
  background: #e4e7ed;
}

.mood-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.mood-emoji {
  font-size: 32px;
  margin-bottom: 5px;
}

.mood-label {
  font-size: 14px;
  color: #606266;
}

.mood-item.active .mood-label {
  color: #409eff;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.submit-btn:hover {
  opacity: 0.9;
}

:deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
}

:deep(.el-upload-list__item) {
  width: 120px;
  height: 120px;
}
</style>
```

---

## Task 19: 创建历史记录页面

**Files:**
- Create: `frontend/src/views/History.vue`

- [ ] **Step 1: 创建历史记录页**

```vue
<template>
  <div class="history-page">
    <div class="page-header">
      <h2>打卡历史</h2>
      <p>共 {{ total }} 条记录</p>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="checkInList.length === 0" class="empty-container">
      <el-empty description="还没有打卡记录，快去记录你的第一次旅程吧！">
        <el-button type="primary" @click="$router.push('/checkin')">
          去打卡
        </el-button>
      </el-empty>
    </div>
    
    <div v-else class="timeline-container">
      <el-timeline>
        <el-timeline-item
          v-for="item in checkInList"
          :key="item.id"
          :timestamp="formatTime(item.checkInTime)"
          placement="top"
        >
          <el-card class="checkin-item">
            <div class="item-header">
              <div class="location">
                <el-icon><Location /></el-icon>
                <span>{{ item.locationName || '未知位置' }}</span>
              </div>
              <div v-if="item.mood" class="mood">
                {{ getMoodEmoji(item.mood) }}
              </div>
            </div>
            
            <p class="content">{{ item.content }}</p>
            
            <div v-if="item.images && item.images.length > 0" class="images">
              <el-image
                v-for="(img, index) in item.images"
                :key="index"
                :src="img"
                :preview-src-list="item.images"
                fit="cover"
                class="checkin-image"
              />
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <div class="pagination">
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
import { ref, onMounted } from 'vue'
import { Location } from '@element-plus/icons-vue'
import { checkInApi } from '@/api'

const checkInList = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)

const moodMap: Record<string, string> = {
  happy: '😊',
  excited: '🤩',
  relaxed: '😌',
  tired: '😴',
  surprised: '😲'
}

const getMoodEmoji = (mood: string) => moodMap[mood] || mood

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await checkInApi.list({
      page: page.value,
      size: size.value
    })
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
  margin-bottom: 30px;
  color: #fff;
}

.page-header h2 {
  font-size: 24px;
  margin-bottom: 5px;
}

.page-header p {
  opacity: 0.8;
}

.loading-container,
.empty-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
}

.checkin-item {
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.location {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.mood {
  font-size: 24px;
}

.content {
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.images {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.checkin-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
}

.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

:deep(.el-timeline-item__timestamp) {
  color: #fff;
  font-size: 14px;
}

:deep(.el-timeline-item__node) {
  background: #ffd04b;
}
</style>
```

---

## Task 20: 创建统计页面

**Files:**
- Create: `frontend/src/views/Statistics.vue`

- [ ] **Step 1: 创建统计页**

```vue
<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2>数据统计</h2>
      <p>你的旅行足迹分析</p>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else class="stats-container">
      <!-- 数据卡片 -->
      <div class="stats-cards">
        <el-card class="stat-card">
          <div class="stat-icon total">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalCheckIns }}</div>
            <div class="stat-label">总打卡次数</div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-icon month">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.thisMonthCheckIns }}</div>
            <div class="stat-label">本月打卡</div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-icon mood">
            <el-icon><Smile /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getMoodLabel(stats.favoriteMood) || '-' }}</div>
            <div class="stat-label">最常心情</div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-icon location">
            <el-icon><Location /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.favoriteLocation || '-' }}</div>
            <div class="stat-label">最爱地点</div>
          </div>
        </el-card>
      </div>
      
      <!-- 图表区域 -->
      <div class="charts-container">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <el-icon><TrendCharts /></el-icon>
              <span>近7天打卡趋势</span>
            </div>
          </template>
          <div ref="trendChartRef" class="chart"></div>
        </el-card>
        
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <el-icon><PieChart /></el-icon>
              <span>心情分布</span>
            </div>
          </template>
          <div ref="moodChartRef" class="chart"></div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { 
  Collection, Calendar, Smile, Location, 
  TrendCharts, PieChart 
} from '@element-plus/icons-vue'
import { statisticsApi } from '@/api'

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
  happy: '开心',
  excited: '兴奋',
  relaxed: '放松',
  tired: '疲惫',
  surprised: '惊喜'
}

const getMoodLabel = (mood: string) => moodLabels[mood] || mood

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
          { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
          { offset: 1, color: 'rgba(102, 126, 234, 0.1)' }
        ])
      },
      lineStyle: { color: '#667eea', width: 3 },
      itemStyle: { color: '#667eea' }
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
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: data.length > 0 ? data : [{ name: '暂无数据', value: 1 }],
      color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']
    }]
  })
  
  return chart
}

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await statisticsApi.get()
    stats.value = res.data
    
    await nextTick()
    const trendChart = initTrendChart()
    const moodChart = initMoodChart()
    
    window.addEventListener('resize', () => {
      trendChart?.resize()
      moodChart?.resize()
    })
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
.statistics-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  color: #fff;
}

.page-header h2 {
  font-size: 24px;
  margin-bottom: 5px;
}

.page-header p {
  opacity: 0.8;
}

.loading-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-right: 20px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-icon.month {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-icon.mood {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-icon.location {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.chart {
  height: 300px;
}
</style>
```

---

## Task 21: 安装依赖并测试

**Files:**
- Commands to run

- [ ] **Step 1: 安装后端依赖并运行**

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

- [ ] **Step 2: 安装前端依赖并运行**

```bash
cd frontend
npm install
npm run dev
```

---

## Task 22: 编写Word文档

**Files:**
- Create: `docs/功能分析与实现思路.docx`

- [ ] **Step 1: 编写交付文档**

文档内容包含：
1. 项目概述
2. 功能需求分析
3. 技术架构设计
4. 数据库设计
5. API接口设计
6. 前端页面设计
7. 部署说明
8. 在线体验链接

---

## 自我检查

### 1. Spec覆盖检查
- ✓ 用户注册/登录（JWT认证）- Task 6
- ✓ 定位获取当前位置 - Task 18
- ✓ 图片上传 - Task 7, 18
- ✓ 记录心情和文字 - Task 7, 18
- ✓ 查看历史打卡记录 - Task 19
- ✓ 打卡数据统计 - Task 8, 20
- ✓ 精美UI设计 - Task 16-20

### 2. Placeholder扫描
- 无TBD/TODO
- 所有代码已完整提供
- 所有配置已完整提供

### 3. 类型一致性检查
- User实体与数据库表一致
- CheckIn实体与数据库表一致
- API返回类型前后端一致
