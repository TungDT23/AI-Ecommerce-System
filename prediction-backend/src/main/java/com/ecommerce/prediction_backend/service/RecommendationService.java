package com.ecommerce.prediction_backend.service;

import com.ecommerce.prediction_backend.dto.InterestScoreDTO;
import com.ecommerce.prediction_backend.entity.UserActivity;
import com.ecommerce.prediction_backend.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    @Autowired
    private UserActivityRepository userActivityRepository;

    // 1. Tính điểm cho một User cụ thể - ĐÃ SỬA LỖI ĐỔI TÊN HÀM REPOSITORY
    public List<InterestScoreDTO> calculateInterestScore(Integer userId) {
        // Gọi chính xác hàm đã tối ưu sort theo thời gian trong Repository
        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByTimestampDesc(userId);
        Map<Integer, Integer> productScores = new HashMap<>();

        for (UserActivity activity : activities) {
            if (activity.getProductId() == null) continue;

            int points = getPointsByAction(activity.getAction());
            productScores.put(
                activity.getProductId(), 
                productScores.getOrDefault(activity.getProductId(), 0) + points
            );
        }

        return productScores.entrySet().stream()
                .map(entry -> new InterestScoreDTO(userId, entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    // 2. Tính ma trận điểm cho TẤT CẢ User (Gửi cho Python AI hoặc bộ lọc Hybrid)
    public List<InterestScoreDTO> calculateAllInterestScores() {
        List<UserActivity> allActivities = userActivityRepository.findAll();
        Map<Integer, Map<Integer, Integer>> matrix = new HashMap<>();

        for (UserActivity activity : allActivities) {
            if (activity.getUserId() == null || activity.getProductId() == null) continue;

            int points = getPointsByAction(activity.getAction());

            matrix.computeIfAbsent(activity.getUserId(), k -> new HashMap<>())
                  .merge(activity.getProductId(), points, Integer::sum);
        }

        List<InterestScoreDTO> result = new ArrayList<>();
        matrix.forEach((uId, productMap) -> {
            productMap.forEach((pId, score) -> {
                result.add(new InterestScoreDTO(uId, pId, score));
            });
        });

        return result;
    }

    // 3. CẬP NHẬT THANG ĐIỂM AI: Ghi nhận chuẩn xác giá trị của hành vi Mua hàng (Purchase)
    private int getPointsByAction(String action) {
        if (action == null) return 0;
        return switch (action) {
            case "view_product" -> 1;
            case "add_to_cart"  -> 3;
            case "purchase"     -> 5; // Mua hàng thể hiện mức độ ưa thích cao nhất (Khớp logic 40 user)
            default -> 0;
        };
    }
}