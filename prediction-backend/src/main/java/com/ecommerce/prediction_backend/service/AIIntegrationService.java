package com.ecommerce.prediction_backend.service;

import com.ecommerce.prediction_backend.dto.ProductRecommendationDTO;
import com.ecommerce.prediction_backend.entity.Product;
import com.ecommerce.prediction_backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AIIntegrationService {

    @Autowired
    private ProductRepository productRepository;

    public List<ProductRecommendationDTO> getEnrichedRecommendations(Integer userId) {
        RestTemplate restTemplate = new RestTemplate();
        String pythonApiUrl = "http://localhost:5000/api/ai/recommend/" + userId;
        
        List<ProductRecommendationDTO> result = new ArrayList<>();

        try {
            // 1. Gõ cửa AI lấy dữ liệu
            Map<String, Object> response = restTemplate.getForObject(pythonApiUrl, Map.class);

            if (response != null && response.containsKey("recommendations")) {
                List<Map<String, Object>> recs = (List<Map<String, Object>>) response.get("recommendations");

                for (Map<String, Object> rec : recs) {
                    Number productIdNum = (Number) rec.get("productId");
                    Number scoreNum = (Number) rec.get("confidenceScore");
                    
                    Integer productId = productIdNum.intValue();
                    Double score = scoreNum.doubleValue();

                    Product product = productRepository.findById(productId).orElse(null);
                    if (product != null) {
                        result.add(new ProductRecommendationDTO(product, score));
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("Server AI đang bận hoặc mất kết nối: " + e.getMessage());
        }

        // ==========================================
        // 2. XỬ LÝ COLD START (KHỞI ĐỘNG LẠNH)
        // ==========================================
        if (result.isEmpty()) {
            System.out.println(">>> Kích hoạt Cold Start cho User ID: " + userId);
            
            // Lấy 5 sản phẩm mới nhất từ kho làm mặc định
            List<Product> defaultProducts = productRepository.findTop5ByOrderByIdDesc();
            
            for (Product p : defaultProducts) {
                // Đặt điểm tin cậy là 0.0 để Frontend biết đây là hàng gợi ý mặc định
                result.add(new ProductRecommendationDTO(p, 0.0)); 
            }
        }

        return result;
    }
}