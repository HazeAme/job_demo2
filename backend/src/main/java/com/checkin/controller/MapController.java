package com.checkin.controller;

import com.checkin.dto.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 地图服务控制器 - 代理高德地图API
 * 解决小程序直接调用高德API的跨域和Key类型限制问题
 */
@RestController
@RequestMapping("/api/map")
public class MapController {

    @Value("${amap.key:c52a9a34f9f0a883bff97437d4163ed7}")
    private String amapKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String AMAP_BASE_URL = "https://restapi.amap.com/v3";

    /**
     * 地点搜索
     * @param keywords 搜索关键词
     * @param city 城市（可选）
     * @return 地点列表
     */
    @GetMapping("/search")
    public Result<Map<String, Object>> searchLocation(
            @RequestParam String keywords,
            @RequestParam(required = false) String city) {

        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(AMAP_BASE_URL + "/place/text")
                    .queryParam("key", amapKey)
                    .queryParam("keywords", keywords)
                    .queryParam("city", city != null ? city : "")
                    .queryParam("citylimit", city != null && !city.isEmpty() ? "true" : "false")
                    .queryParam("offset", 20)
                    .queryParam("page", 1)
                    .queryParam("extensions", "all")
                    .toUriString();

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body == null) {
                return Result.error("搜索服务无响应");
            }

            String status = String.valueOf(body.get("status"));
            if (!"1".equals(status)) {
                String info = String.valueOf(body.get("info"));
                return Result.error("搜索失败: " + info);
            }

            // 解析结果
            List<Map<String, Object>> pois = (List<Map<String, Object>>) body.get("pois");
            if (pois == null || pois.isEmpty()) {
                return Result.success(Map.of("list", List.of(), "total", 0));
            }

            // 格式化结果
            List<Map<String, Object>> results = pois.stream().map(poi -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", poi.get("id"));
                item.put("name", poi.get("name"));
                item.put("address", poi.get("address"));
                item.put("cityname", poi.get("cityname"));
                item.put("adname", poi.get("adname"));

                // 解析经纬度
                String location = String.valueOf(poi.get("location"));
                if (location != null && location.contains(",")) {
                    String[] coords = location.split(",");
                    item.put("longitude", Double.parseDouble(coords[0]));
                    item.put("latitude", Double.parseDouble(coords[1]));
                }

                item.put("distance", poi.get("distance"));
                item.put("type", poi.get("type"));
                return item;
            }).toList();

            Map<String, Object> result = new HashMap<>();
            result.put("list", results);
            result.put("total", results.size());

            return Result.success(result);

        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("搜索服务异常: " + e.getMessage());
        }
    }

    /**
     * 逆地理编码 - 根据经纬度获取地址
     * @param longitude 经度
     * @param latitude 纬度
     * @return 地址信息
     */
    @GetMapping("/regeo")
    public Result<Map<String, Object>> reverseGeocode(
            @RequestParam Double longitude,
            @RequestParam Double latitude) {

        try {
            String location = longitude + "," + latitude;
            String url = UriComponentsBuilder
                    .fromHttpUrl(AMAP_BASE_URL + "/geocode/regeo")
                    .queryParam("key", amapKey)
                    .queryParam("location", location)
                    .queryParam("extensions", "all")
                    .queryParam("radius", 1000)
                    .toUriString();

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body == null) {
                return Result.error("地理编码服务无响应");
            }

            String status = String.valueOf(body.get("status"));
            if (!"1".equals(status)) {
                String info = String.valueOf(body.get("info"));
                return Result.error("地理编码失败: " + info);
            }

            Map<String, Object> regeocode = (Map<String, Object>) body.get("regeocode");
            if (regeocode == null) {
                return Result.error("无法解析该坐标");
            }

            Map<String, Object> result = new HashMap<>();

            // 获取POI列表
            List<Map<String, Object>> pois = (List<Map<String, Object>>) regeocode.get("pois");
            if (pois != null && !pois.isEmpty()) {
                // 按距离排序
                pois.sort((a, b) -> {
                    String distA = String.valueOf(a.getOrDefault("distance", "0"));
                    String distB = String.valueOf(b.getOrDefault("distance", "0"));
                    return Integer.parseInt(distA) - Integer.parseInt(distB);
                });
                result.put("pois", pois);
            }

            // 地址组件
            Map<String, Object> addressComponent = (Map<String, Object>) regeocode.get("addressComponent");
            if (addressComponent != null) {
                result.put("addressComponent", addressComponent);
            }

            // 格式化地址
            result.put("formattedAddress", regeocode.get("formatted_address"));

            return Result.success(result);

        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("地理编码服务异常: " + e.getMessage());
        }
    }

    /**
     * 获取静态地图图片URL
     * @param longitude 经度
     * @param latitude 纬度
     * @param zoom 缩放级别
     * @return 图片URL
     */
    @GetMapping("/staticmap")
    public Result<Map<String, String>> getStaticMapUrl(
            @RequestParam Double longitude,
            @RequestParam Double latitude,
            @RequestParam(defaultValue = "16") Integer zoom) {

        String url = UriComponentsBuilder
                .fromHttpUrl("https://restapi.amap.com/v3/staticmap")
                .queryParam("key", amapKey)
                .queryParam("location", longitude + "," + latitude)
                .queryParam("zoom", zoom)
                .queryParam("size", "750*300")
                .queryParam("markers", "mid,," + longitude + "," + latitude)
                .toUriString();

        return Result.success(Map.of("url", url));
    }
}
