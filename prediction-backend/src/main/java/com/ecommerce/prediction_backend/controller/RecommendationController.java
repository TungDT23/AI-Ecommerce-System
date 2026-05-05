package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.dto.InterestScoreDTO;
import com.ecommerce.prediction_backend.dto.ProductRecommendationDTO;
import com.ecommerce.prediction_backend.service.AIIntegrationService;
import com.ecommerce.prediction_backend.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendation")
@CrossOrigin("*") // Cho phép Frontend gọi API mà không bị chặn (CORS)
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private AIIntegrationService aiIntegrationService;

    /**
     * 1. API Lấy điểm quan tâm của một User cụ thể từ MongoDB
     * URL: https://ecom-backend-api-ijgl.onrender.com/api/recommendation/interest/{userId}
     */
    @GetMapping("/interest/{userId}")
    public List<InterestScoreDTO> getInterestScore(@PathVariable Integer userId) {
        return recommendationService.calculateInterestScore(userId);
    }

    /**
     * 2. API Xuất toàn bộ ma trận điểm số của hệ thống cho Python AI
     * URL: https://ecom-backend-api-ijgl.onrender.com/api/recommendation/matrix
     */
    @GetMapping("/matrix")
    public List<InterestScoreDTO> getAllInterestScores() {
        return recommendationService.calculateAllInterestScores();
    }

    /**
     * 3. API CHÍNH CHO FRONTEND: Lấy danh sách gợi ý đã được làm đẹp (Full thông tin SP + Điểm tin cậy)
     * URL: https://ecom-backend-api-ijgl.onrender.com/api/recommendation/display/{userId}
     * Luồng: Gọi sang Python (cổng 5000) -> Lấy ID -> Truy vấn MySQL -> Trả về kết quả
     */
    @GetMapping("/display/{userId}")
    public List<ProductRecommendationDTO> getRecommendationsForFrontend(@PathVariable Integer userId) {
        return aiIntegrationService.getEnrichedRecommendations(userId);
    }
}