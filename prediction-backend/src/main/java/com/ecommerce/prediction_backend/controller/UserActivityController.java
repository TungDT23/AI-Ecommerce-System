package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.UserActivity;
import com.ecommerce.prediction_backend.repository.UserActivityRepository;
import com.ecommerce.prediction_backend.entity.Product;
import com.ecommerce.prediction_backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; // Đã bổ sung thư viện này
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin("*") // Cho phép Frontend gọi API
public class UserActivityController {

    // 1. GOM TẤT CẢ @AUTOWIRED LÊN TRÊN CÙNG
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserActivityRepository userActivityRepository;

    // ==========================================

    // 2. CÁC HÀM XỬ LÝ (METHODS) BÊN DƯỚI
    
    // API lấy lịch sử giỏ hàng: GET http://localhost:8888/api/activities/cart/{userId}
    @GetMapping("/cart/{userId}")
    public List<Product> getCartHistory(@PathVariable Integer userId) {
        return userActivityRepository.findByUserId(userId).stream()
            .filter(activity -> "add_to_cart".equals(activity.getAction()))
            .map(activity -> productRepository.findById(activity.getProductId()).orElse(null))
            .filter(product -> product != null)
            .distinct() // Loại bỏ các sản phẩm trùng lặp nếu họ click thêm nhiều lần
            .collect(Collectors.toList());
    }

    // API nhận log hành vi từ Frontend: POST http://localhost:8888/api/activities/track
    @PostMapping("/track")
    public UserActivity trackActivity(@RequestBody UserActivity activity) {
        // Tự động gán thời gian hiện tại lúc click
        activity.setTimestamp(new Date()); 
        
        // Lưu thẳng vào DataBase
        return userActivityRepository.save(activity);
    }

    // MỚI: API Xóa sản phẩm khỏi giỏ hàng
    @DeleteMapping("/cart/{userId}/{productId}")
    public ResponseEntity<?> removeProductFromCart(@PathVariable Integer userId, @PathVariable Integer productId) {
        // 1. Tìm tất cả các hành vi "thêm vào giỏ" của User này đối với Sản phẩm này
        List<UserActivity> cartActivities = userActivityRepository.findByUserId(userId).stream()
            .filter(activity -> "add_to_cart".equals(activity.getAction()) && activity.getProductId().equals(productId))
            .collect(Collectors.toList());
        
        // 2. Xóa các hành vi đó đi (Sản phẩm sẽ tự biến mất khỏi giỏ)
        if (!cartActivities.isEmpty()) {
            userActivityRepository.deleteAll(cartActivities);
        }
        
        return ResponseEntity.ok("Đã xóa khỏi giỏ hàng");
    }
}