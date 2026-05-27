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

    /**
     * 1. CHỐT ĐƠN: Nhận giỏ hàng từ Frontend và tạo Hóa đơn
     * (Đã bổ sung gán giá trị mặc định cho Vận chuyển, Thanh toán, Đồ mua kèm để khớp DB mới)
     */
    @PostMapping("/checkout/{userId}")
    public ResponseEntity<?> checkout(@PathVariable Integer userId, @RequestBody List<Product> cartItems) {
        if (cartItems.isEmpty()) return ResponseEntity.badRequest().body("Giỏ hàng trống!");

        BigDecimal total = BigDecimal.ZERO;
        for (Product p : cartItems) {
            total = total.add(p.getPrice());
        }

        // Tạo Đơn hàng gốc
        Order order = new Order();
        User userRef = new User();
        userRef.setId(userId);
        order.setUser(userRef); 
        order.setTotalAmount(total);
        order.setStatus("CHỜ THANH TOÁN"); 
        
        // BỔ SUNG CHO DATASET MỚI: Đặt giá trị mặc định ban đầu cho phương thức thanh toán và ship
        // Frontend sau này có thể truyền thêm dữ liệu này lên nếu sếp làm thêm ô chọn (Select Box)
        order.setPaymentMethod("Credit Card"); // Mặc định khớp với tệp Kaggle
        order.setShippingType("Standard");     // Mặc định khớp với tệp Kaggle
        
        Order savedOrder = orderRepository.save(order);

        // Lưu chi tiết từng món vào OrderItem
        for (Product p : cartItems) {
            OrderItem item = new OrderItem();
            item.setOrder(savedOrder); 
            item.setProduct(p);        
            item.setPriceAtPurchase(p.getPrice());
            item.setQuantity(1);       
            
            // BỔ SUNG CHO DATASET MỚI: Gán mặc định không mua kèm phụ kiện đặc biệt lúc chốt đơn lẻ
            item.setAddonsPurchased("None");
            item.setAddonTotal(BigDecimal.ZERO);
            
            orderItemRepository.save(item);
        }
        
        return ResponseEntity.ok(savedOrder);
    }

    // 2. KHÁCH HÀNG: Xem Lịch sử mua hàng (Giữ nguyên luồng chuẩn của sếp)
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable Integer userId) {
        List<Order> orders = orderRepository.findByUser_IdOrderByIdDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for(Order o : orders) {
            Map<String, Object> map = new HashMap<>();
            map.put("order", o);
            map.put("items", orderItemRepository.findByOrder_Id(o.getId())); 
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    // 3. ADMIN: Lấy danh sách toàn bộ đơn hàng
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        orders.sort((a, b) -> b.getId().compareTo(a.getId())); 
        return ResponseEntity.ok(orders);
    }

    // 4. ADMIN: Cập nhật trạng thái
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

    /**
     * 5. VNPAY CONFIRM: Cập nhật trạng thái dựa trên mã phản hồi từ VNPay
     * ĐỂ NEO LUỒNG AI: Khi chuyển thành 'ĐÃ THANH TOÁN', lập tức đơn hàng này trở thành dữ liệu đầu vào cho AI Markov gợi ý sản phẩm tiếp theo!
     */
    @PutMapping("/payment-confirm/{orderId}")
    public ResponseEntity<?> confirmPayment(@PathVariable Integer orderId, @RequestParam String responseCode) {
        Optional<Order> opt = orderRepository.findById(orderId);
        if (opt.isPresent()) {
            Order order = opt.get();
            // Mã "00" là giao dịch thành công theo chuẩn VNPay
            if ("00".equals(responseCode)) {
                order.setStatus("ĐÃ THANH TOÁN");
                
                // Sếp có thể tùy biến cập nhật thêm hình thức thanh toán khi dùng VNPay thực tế:
                order.setPaymentMethod("VNPay Wallet/Credit Card");
            } else {
                order.setStatus("THANH TOÁN THẤT BẠI");
            }
            return ResponseEntity.ok(orderRepository.save(order));
        }
        return ResponseEntity.notFound().build();
    }
}