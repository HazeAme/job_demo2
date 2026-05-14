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
