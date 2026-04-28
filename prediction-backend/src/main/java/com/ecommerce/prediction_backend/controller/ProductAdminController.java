package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.Product;
import com.ecommerce.prediction_backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@CrossOrigin("*")
public class ProductAdminController {

    @Autowired
    private ProductRepository productRepository;

    // 1. Lấy danh sách toàn bộ sản phẩm (READ)
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // 2. Thêm sản phẩm mới (CREATE)
    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    // 3. Cập nhật thông tin sản phẩm (UPDATE)
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Integer id, @RequestBody Product productDetails) {
        return productRepository.findById(id).map(product -> {
            product.setName(productDetails.getName());
            product.setPrice(productDetails.getPrice());
            product.setBrand(productDetails.getBrand());
            return ResponseEntity.ok(productRepository.save(product));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 4. Xóa sản phẩm (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Integer id) {
        return productRepository.findById(id).map(product -> {
            productRepository.delete(product);
            return ResponseEntity.ok().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}