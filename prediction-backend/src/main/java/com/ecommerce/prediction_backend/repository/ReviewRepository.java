package com.ecommerce.prediction_backend.repository;

import com.ecommerce.prediction_backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Integer> {
    // Lấy toàn bộ đánh giá của một sản phẩm
    List<Review> findByProduct_IdOrderByCreatedAtDesc(Integer productId);
}