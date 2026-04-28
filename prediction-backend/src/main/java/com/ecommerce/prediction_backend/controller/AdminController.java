package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.UserActivity;
import com.ecommerce.prediction_backend.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin("*")
public class AdminController {

    @Autowired
    private UserActivityRepository userActivityRepository;

    // API lấy toàn bộ log dữ liệu lớn (Big Data) để AI học
    // Cổng này đã được bảo vệ ngầm bởi SecurityConfig (Chỉ ADMIN mới qua được)
    @GetMapping("/activities")
    public List<UserActivity> getAllActivities() {
        // Trong thực tế sẽ dùng phân trang, nhưng đồ án test chúng ta cứ lấy hết ra xem cho "đã"
        return userActivityRepository.findAll();
    }
}