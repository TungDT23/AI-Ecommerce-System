package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.UserActivity;
import com.ecommerce.prediction_backend.dto.UserFeatureVector;
import com.ecommerce.prediction_backend.entity.Product;
import com.ecommerce.prediction_backend.repository.UserActivityRepository;
import com.ecommerce.prediction_backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin("*")
public class UserActivityController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserActivityRepository userActivityRepository;

    @Autowired
    private com.ecommerce.prediction_backend.service.DataAggregationService dataAggregationService;

    // 1. API LẤY GIỎ HÀNG: Đã sửa lỗi gọi đúng hàm Custom Query của Repository
    @GetMapping("/cart/{userId}")
    public List<Product> getCartHistory(@PathVariable Integer userId) {
        // Chỉ lấy các hành vi add_to_cart thực sự còn hiệu lực trong DB
        return userActivityRepository.findCartItemsByUserId(userId).stream()
            .map(activity -> productRepository.findById(activity.getProductId()).orElse(null))
            .filter(Objects::nonNull)
            .distinct() 
            .collect(Collectors.toList());
    }

    // 2. API TRACKING HÀNH VI: Giữ nguyên chuẩn Instant sạch sẽ
    @PostMapping("/track")
    public UserActivity trackActivity(@RequestBody UserActivity activity) {
        activity.setTimestamp(Instant.now()); 
        return userActivityRepository.save(activity);
    }

    // 3. API XÓA KHỎI GIỎ: Sử dụng hàm lấy danh sách theo thời gian mới nhất để lọc xóa
    @DeleteMapping("/cart/{userId}/{productId}")
    public ResponseEntity<?> removeProductFromCart(@PathVariable Integer userId, @PathVariable Integer productId) {
        // Dùng hàm chuẩn đã khai báo trong Repository để check
        List<UserActivity> cartActivities = userActivityRepository.findByUserIdOrderByTimestampDesc(userId).stream()
            .filter(activity -> "add_to_cart".equals(activity.getAction()) 
                             && activity.getProductId().equals(productId))
            .collect(Collectors.toList());
        
        if (!cartActivities.isEmpty()) {
            userActivityRepository.deleteAll(cartActivities);
            return ResponseEntity.ok("Đã xóa khỏi giỏ hàng");
        }
        return ResponseEntity.notFound().build();
    }

    // 4. API Xuất ma trận 15 đặc trưng: GET http://localhost:8888/api/activities/ai-features
    @GetMapping("/ai-features")
    public ResponseEntity<List<UserFeatureVector>> getAiFeaturesMatrix() {
        return ResponseEntity.ok(dataAggregationService.aggregateAllUsersFeatures());
    }
}