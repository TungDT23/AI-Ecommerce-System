package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.User;
import com.ecommerce.prediction_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // 1. Endpoint cũ: Lấy danh sách toàn bộ Users
    @GetMapping
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    // 2. Endpoint: Lấy thông tin chi tiết của 1 User theo ID (Dùng cho popup Hồ Sơ)
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable int id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        } else {
            return ResponseEntity.status(404).body("Không tìm thấy người dùng với ID: " + id);
        }
    }

    // 3. Endpoint: Cập nhật thông tin cá nhân (Đã đồng bộ trường Họ và Tên)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User userDetails) {
        Optional<User> userOpt = userRepository.findById(id);
        
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("Không tìm thấy người dùng để cập nhật!");
        }

        User existingUser = userOpt.get();
        
        // ==========================================================
        // ✨ ĐÃ BỔ SUNG GÁN HỌ VÀ TÊN THỰC TẾ TRƯỚC KHI LƯU VÀO DB
        // ==========================================================
        existingUser.setFullName(userDetails.getFullName());
        
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setAge(userDetails.getAge());
        existingUser.setGender(userDetails.getGender());
        existingUser.setLocation(userDetails.getLocation());
        
        // Lưu lại vào Database thông qua Repository
        User updatedUser = userRepository.save(existingUser);
        
        return ResponseEntity.ok(updatedUser);
    }
}