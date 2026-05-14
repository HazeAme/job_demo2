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
        Map<String, Object> locationResult = checkInMapper.selectFavoriteLocation(userId);
        String favoriteLocation = locationResult == null ? null : (String) locationResult.get("location_name");
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
