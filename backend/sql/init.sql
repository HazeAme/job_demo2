-- 创建数据库
CREATE DATABASE IF NOT EXISTS job_demo2
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE job_demo2;

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
