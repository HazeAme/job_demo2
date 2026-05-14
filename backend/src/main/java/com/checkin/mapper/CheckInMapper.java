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

    @Select("SELECT location_name, COUNT(*) as count FROM check_in " +
            "WHERE user_id = #{userId} AND location_name IS NOT NULL " +
            "GROUP BY location_name ORDER BY count DESC LIMIT 1")
    Map<String, Object> selectFavoriteLocation(@Param("userId") Long userId);
}
