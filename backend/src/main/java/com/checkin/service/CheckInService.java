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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
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
                                  String checkInTimeStr, List<MultipartFile> images) throws IOException {
        CheckIn checkIn = new CheckIn();
        checkIn.setUserId(userId);
        checkIn.setContent(content);
        checkIn.setMood(mood);
        checkIn.setLocationName(locationName);
        checkIn.setLatitude(latitude);
        checkIn.setLongitude(longitude);

        // 解析自定义打卡时间，如果没有则使用当前时间
        if (checkInTimeStr != null && !checkInTimeStr.isEmpty()) {
            try {
                checkIn.setCheckInTime(LocalDateTime.parse(checkInTimeStr.replace(" ", "T")));
            } catch (Exception e) {
                checkIn.setCheckInTime(LocalDateTime.now());
            }
        } else {
            checkIn.setCheckInTime(LocalDateTime.now());
        }

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

    public Page<CheckIn> getCheckInList(Long userId, Integer page, Integer size,
                                         String keyword, String mood,
                                         String startDate, String endDate) {
        QueryWrapper<CheckIn> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);

        // 关键词搜索（内容或地点）
        if (keyword != null && !keyword.trim().isEmpty()) {
            wrapper.and(w -> w.like("content", keyword).or().like("location_name", keyword));
        }

        // 心情筛选
        if (mood != null && !mood.isEmpty()) {
            wrapper.eq("mood", mood);
        }

        // 日期范围筛选
        if (startDate != null && !startDate.isEmpty()) {
            LocalDate start = LocalDate.parse(startDate);
            wrapper.ge("check_in_time", start.atStartOfDay());
        }
        if (endDate != null && !endDate.isEmpty()) {
            LocalDate end = LocalDate.parse(endDate);
            wrapper.le("check_in_time", end.atTime(LocalTime.MAX));
        }

        wrapper.orderByDesc("check_in_time");
        Page<CheckIn> result = checkInMapper.selectPage(new Page<>(page, size), wrapper);
        System.out.println("查询参数 - userId: " + userId + ", keyword: " + keyword + ", mood: " + mood + ", startDate: " + startDate + ", endDate: " + endDate);
        System.out.println("查询结果条数: " + result.getRecords().size());
        return result;
    }

    // 保留旧方法兼容
    public Page<CheckIn> getCheckInList(Long userId, Integer page, Integer size) {
        return getCheckInList(userId, page, size, null, null, null, null);
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
