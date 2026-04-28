package com.ecommerce.prediction_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Đã thêm unique = true để dùng làm tài khoản đăng nhập không bị trùng
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // =========================================
    // THÊM 2 CỘT NÀY PHỤC VỤ BẢO MẬT & PHÂN QUYỀN
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // Sẽ nhận giá trị: "ROLE_USER" hoặc "ROLE_ADMIN"
    // =========================================

    private Integer age;

    @Column(length = 10)
    private String gender;

    @Column(length = 100)
    private String location;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}