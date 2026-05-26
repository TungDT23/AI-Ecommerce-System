package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.entity.*;
import com.ecommerce.prediction_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin("*")
public class OrderController {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository; 

    // 1. CHỐT ĐƠN
    @PostMapping("/checkout/{userId}")
    public ResponseEntity<?> checkout(@PathVariable Integer userId, @RequestBody List<Product> cartItems) {
        if (cartItems.isEmpty()) return ResponseEntity.badRequest().body("Giỏ hàng trống!");

        BigDecimal total = BigDecimal.ZERO;
        for (Product p : cartItems) {
            total = total.add(p.getPrice());
        }

        Order order = new Order();
        User userRef = new User();
        userRef.setId(userId);
        order.setUser(userRef); 
        order.setTotalAmount(total);
        order.setStatus("CHỜ THANH TOÁN");
        Order savedOrder = orderRepository.save(order);

        for (Product p : cartItems) {
            OrderItem item = new OrderItem();
            item.setOrder(savedOrder); 
            item.setProduct(p);        
            item.setPriceAtPurchase(p.getPrice());
            item.setQuantity(1);       
            orderItemRepository.save(item);
        }
        
        return ResponseEntity.ok(savedOrder);
    }

    // 2. KHÁCH HÀNG
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable Integer userId) {
        List<Order> orders = orderRepository.findByUser_IdOrderByIdDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for(Order o : orders) {
            Map<String, Object> map = new HashMap<>();
            map.put("order", o);
            // Dùng hàm mới của OrderItemRepository
            map.put("items", orderItemRepository.findByOrder_Id(o.getId())); 
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    // 3. ADMIN
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        orders.sort((a, b) -> b.getId().compareTo(a.getId())); 
        return ResponseEntity.ok(orders);
    }

    // 4. ADMIN
    @PutMapping("/admin/{orderId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer orderId, @RequestParam String status) {
        Optional<Order> opt = orderRepository.findById(orderId);
        if(opt.isPresent()){
            Order o = opt.get();
            o.setStatus(status);
            return ResponseEntity.ok(orderRepository.save(o));
        }
        return ResponseEntity.notFound().build();
    }

    // 5. VNPAY CONFIRM
    @PutMapping("/payment-confirm/{orderId}")
    public ResponseEntity<?> confirmPayment(@PathVariable Integer orderId, @RequestParam String responseCode) {
        Optional<Order> opt = orderRepository.findById(orderId);
        if (opt.isPresent()) {
            Order order = opt.get();
            // Mã "00" là giao dịch thành công theo chuẩn VNPay
            if ("00".equals(responseCode)) {
                order.setStatus("ĐÃ THANH TOÁN");
            } else {
                order.setStatus("THANH TOÁN THẤT BẠI");
            }
            return ResponseEntity.ok(orderRepository.save(order));
        }
        return ResponseEntity.notFound().build();
    }
}