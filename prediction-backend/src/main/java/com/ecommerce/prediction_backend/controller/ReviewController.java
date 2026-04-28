package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.*;
import com.ecommerce.prediction_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin("*")
public class ReviewController {

    @Autowired private ReviewRepository reviewRepository;

    // API: Gửi đánh giá mới
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review review) {
        return ResponseEntity.ok(reviewRepository.save(review));
    }

    // API: Lấy danh sách đánh giá theo ID sản phẩm
    @GetMapping("/product/{productId}")
    public List<Review> getProductReviews(@PathVariable Integer productId) {
        return reviewRepository.findByProduct_IdOrderByCreatedAtDesc(productId);
    }
}