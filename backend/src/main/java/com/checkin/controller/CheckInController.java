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
            @RequestParam(value = "checkInTime", required = false) String checkInTime,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            HttpServletRequest request) throws IOException {

        Long userId = Long.parseLong(request.getAttribute("userId").toString());
        CheckIn checkIn = checkInService.createCheckIn(userId, content, mood, locationName,
                latitude, longitude, checkInTime, images);

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
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) throws IOException {

        Long userId = Long.parseLong(request.getAttribute("userId").toString());
        Page<CheckIn> checkInPage = checkInService.getCheckInList(userId, page, size, keyword, mood, startDate, endDate);

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
