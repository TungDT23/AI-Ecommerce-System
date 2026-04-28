package com.ecommerce.prediction_backend.dto;

import com.ecommerce.prediction_backend.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRecommendationDTO {
    private Product product; // Chứa toàn bộ tên, giá, hình ảnh từ MySQL
    private Double confidenceScore; // Điểm tin cậy do Python tính toán
}