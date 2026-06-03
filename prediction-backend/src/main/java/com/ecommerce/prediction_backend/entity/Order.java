package com.ecommerce.prediction_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders") 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Liên kết Many-to-One với bảng User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 50)
    private String status;

    // BỔ SUNG 1: Khớp trường phương thức thanh toán (Credit Card, PayPal, Cash...)
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    // BỔ SUNG 2: Khớp trường hình thức vận chuyển (Standard, Express, Overnight...)
    @Column(name = "shipping_type", length = 50)
    private String shippingType;

    @Column(name = "order_date", updatable = false)
    private LocalDateTime orderDate = LocalDateTime.now();
}