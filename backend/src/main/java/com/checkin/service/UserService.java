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
