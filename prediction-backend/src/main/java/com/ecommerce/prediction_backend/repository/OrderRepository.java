package com.ecommerce.prediction_backend.repository;

import com.ecommerce.prediction_backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUser_IdOrderByIdDesc(Integer userId);
}