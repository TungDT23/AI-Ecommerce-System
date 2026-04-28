package com.ecommerce.prediction_backend.repository;

import com.ecommerce.prediction_backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    //Tìm chi tiết các món hàng theo ID của đơn hàng (Lưu ý chữ Order_Id do dùng @ManyToOne)
    List<OrderItem> findByOrder_Id(Integer orderId);
}