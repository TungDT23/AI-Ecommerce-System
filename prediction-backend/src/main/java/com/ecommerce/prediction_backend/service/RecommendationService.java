package com.ecommerce.prediction_backend.service;

import com.ecommerce.prediction_backend.dto.InterestScoreDTO;
import com.ecommerce.prediction_backend.dto.PredictionRequest;
import com.ecommerce.prediction_backend.dto.PredictionResponse;
import com.ecommerce.prediction_backend.entity.Product;
import com.ecommerce.prediction_backend.entity.UserActivity;
import com.ecommerce.prediction_backend.repository.OrderRepository;
import com.ecommerce.prediction_backend.repository.ProductRepository;
import com.ecommerce.prediction_backend.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserActivityRepository userActivityRepository;

    // URL của Server FastAPI Python sếp đang bật chạy nền ở cổng 8000
    private final String PYTHON_API_URL = "http://127.0.0.1:8000/predict";
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Gợi ý sản phẩm tiếp theo cho một User cụ thể dựa trên chuỗi Markov từ Python AI
     */
    public Product getNextProductRecommendation(Integer userId) {
        // 1. Tìm danh mục sản phẩm mua gần đây nhất của User này từ DB MySQL
        // Nếu là User mới tinh chưa mua gì bao giờ, mặc định gán là danh mục 4 (Smartphone) để gửi sang AI học tiếp
        Integer lastCategoryId = orderRepository.findLastPurchasedCategoryIdByUserId(userId).orElse(4);

        try {
            // 2. Đóng gói dữ liệu yêu cầu bắn sang Python AI Server
            PredictionRequest requestPayload = new PredictionRequest(userId, lastCategoryId);
            HttpEntity<PredictionRequest> entity = new HttpEntity<>(requestPayload);

            // 3. Thực hiện lệnh gọi HTTP POST sang Server Python
            ResponseEntity<PredictionResponse> response = restTemplate.postForEntity(
                    PYTHON_API_URL, entity, PredictionResponse.class
            );

            // 4. Nếu AI Server trả về kết quả thành công, bốc lấy suggestedProductId để map ra sản phẩm
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                int suggestedProductId = response.getBody().getSuggestedProductId();
                
                // Tìm thông tin sản phẩm công nghệ xịn trong MySQL để render lên giao diện
                return productRepository.findById(suggestedProductId).orElse(null);
            }
        } catch (Exception e) {
            System.err.println("[AI ERROR] Không kết nối được tới AI Server, dùng hàng dự phòng: " + e.getMessage());
        }

        // BIỆN PHÁP DỰ PHÒNG: Nếu AI sập hoặc lỗi kết nối, trả về sản phẩm ID = 1 (iPhone 15) để web không trống
        return productRepository.findById(1).orElse(null);
    }

    // 1. Tính điểm cho một User cụ thể - ĐÃ SỬA LỖI ĐỔI TÊN HÀM REPOSITORY
    public List<InterestScoreDTO> calculateInterestScore(Integer userId) {
        // Gọi chính xác hàm đã tối ưu sort theo thời gian trong Repository
        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByTimestampDesc(userId);
        Map<Integer, Integer> productScores = new HashMap<>();

        for (UserActivity activity : activities) {
            if (activity.getProductId() != null) {
                int points = getPointsByAction(activity.getAction());
                productScores.merge(activity.getProductId(), points, Integer::sum);
            }
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