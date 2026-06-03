package com.ecommerce.prediction_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Liên kết với Đơn hàng
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    // Liên kết với Sản phẩm
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    private Integer quantity = 1;

    @Column(name = "price_at_purchase", precision = 15, scale = 2)
    private BigDecimal priceAtPurchase;

    // BỔ SUNG 1: Khớp trường lưu danh sách phụ kiện mua kèm (Accessories, Extended Warranty...) từ Dataset xịn
    @Column(name = "addons_purchased", length = 255)
    private String addonsPurchased;

    // BỔ SUNG 2: Khớp trường tổng tiền của phụ kiện mua kèm theo đơn hàng
    @Column(name = "addon_total", precision = 15, scale = 2)
    private BigDecimal addonTotal;
}