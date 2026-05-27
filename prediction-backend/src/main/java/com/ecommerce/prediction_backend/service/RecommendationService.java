package com.ecommerce.prediction_backend.service;

import com.ecommerce.prediction_backend.dto.PredictionRequest;
import com.ecommerce.prediction_backend.dto.PredictionResponse;
import com.ecommerce.prediction_backend.entity.Product;
import com.ecommerce.prediction_backend.repository.OrderRepository;
import com.ecommerce.prediction_backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RecommendationService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

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
}