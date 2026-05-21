package com.ecommerce.prediction_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 1. Chỉ định rõ tên cột trong MySQL là "user_name" và tên thuộc tính trả về JSON là "username"
    @Column(name = "username", nullable = false, unique = true, length = 50)
    @JsonProperty("username") 
    private String username;

    // 2. Chỉ định rõ tên cột trong MySQL là "full_name" và tên thuộc tính trả về JSON là "fullName"
    @Column(name = "full_name", nullable = false, length = 100)
    @JsonProperty("fullName")
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "full_name", length = 100)
    private String fullName;

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

    @Column(name = "created_at", insertable = false, updatable = false)
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
}