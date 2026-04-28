package com.ecommerce.prediction_backend.service;

import com.ecommerce.prediction_backend.entity.Product;
import com.ecommerce.prediction_backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Hàm lấy toàn bộ danh sách sản phẩm
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
}