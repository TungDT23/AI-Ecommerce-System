package com.ecommerce.prediction_backend.repository;

import com.ecommerce.prediction_backend.entity.Product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    // JpaRepository đã cung cấp sẵn các hàm như findAll(), findById(), save()... 
    // Hàm hỗ trợ Cold Start: Lấy 5 sản phẩm mới nhất
    List<Product> findTop5ByOrderByIdDesc();
}