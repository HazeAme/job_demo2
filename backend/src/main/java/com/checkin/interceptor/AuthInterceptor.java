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
