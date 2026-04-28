package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.OrderItem;
import com.ecommerce.prediction_backend.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order-items")
@CrossOrigin("*")
public class OrderItemController {
    @Autowired
    private OrderItemRepository orderItemRepository;

    @GetMapping
    public List<OrderItem> getAllOrderItems() {
        return orderItemRepository.findAll();
    }
}