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

    @Column(name = "username", nullable = false, unique = true, length = 50)
    @JsonProperty("username") 
    private String username;

    @Column(name = "full_name", nullable = false, length = 100)
    @JsonProperty("fullName")
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // Sẽ nhận giá trị: "ROLE_USER" hoặc "ROLE_ADMIN"

    private Integer age;

    @Column(length = 10)
    private String gender;

    @Column(length = 100)
    private String location;

    @Column(name = "created_at", insertable = false, updatable = false)
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
}