package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.Product;
import com.ecommerce.prediction_backend.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/recommendation")
@CrossOrigin("*") // Cho phép Frontend gọi API mà không bị chặn (CORS)
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    /**
     * API CHÍNH CHO FRONTEND: Lấy sản phẩm gợi ý tối ưu dựa trên chuỗi hành vi Markov
     * URL thực tế: http://localhost:8888/api/recommendation/display/{userId}
     * Luồng chạy: Bốc danh mục mua gần nhất -> Gọi sang Python (cổng 8000) -> Nhận ID -> Truy vấn MySQL -> Trả về Frontend
     */
    @GetMapping("/display/{userId}")
    public ResponseEntity<List<Product>> getRecommendationsForFrontend(@PathVariable Integer userId) {
        // 1. Gọi Service liên kết phân hệ AI để lấy ra đối tượng Sản phẩm gợi ý chuẩn xác nhất
        Product recommendedProduct = recommendationService.getNextProductRecommendation(userId);
        
        // 2. MẸO XỬ LÝ GIAO DIỆN: Vì ở code cũ sếp đang trả về một DANH SÁCH (List<...>)
        // Nên ở đây tôi tự động bọc sản phẩm tối ưu này vào inside một List (Mảng chứa 1 phần tử).
        // Việc này giúp Frontend (React dùng .map() hoặc Thymeleaf dùng th:each) không bị gãy giao diện hoặc lỗi crash khi render.
        if (recommendedProduct != null) {
            return ResponseEntity.ok(List.of(recommendedProduct));
        }
        
        // Trả về mảng rỗng nếu không tìm thấy sản phẩm nào dự phòng
        return ResponseEntity.ok(Collections.emptyList());
    }
}