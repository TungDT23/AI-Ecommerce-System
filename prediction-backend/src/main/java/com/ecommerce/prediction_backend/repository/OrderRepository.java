package com.ecommerce.prediction_backend.repository;

import com.ecommerce.prediction_backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    
    List<Order> findByUser_IdOrderByIdDesc(Integer userId);

    // Câu truy vấn bốc danh mục (category_id) của sản phẩm trong đơn hàng mới nhất của User
    @Query(value = "SELECT p.category_id FROM orders o " +
                   "JOIN order_items oi ON o.id = oi.order_id " +
                   "JOIN products p ON oi.product_id = p.id " +
                   "WHERE o.user_id = :userId AND o.status = 'ĐÃ THANH TOÁN' " +
                   "ORDER BY o.order_date DESC LIMIT 1", nativeQuery = true)
    Optional<Integer> findLastPurchasedCategoryIdByUserId(@Param("userId") Integer userId);
}