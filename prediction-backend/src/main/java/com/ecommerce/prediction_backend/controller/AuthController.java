package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.dto.AuthRequest;
import com.ecommerce.prediction_backend.dto.AuthResponse;
import com.ecommerce.prediction_backend.entity.User;
import com.ecommerce.prediction_backend.repository.UserRepository;
import com.ecommerce.prediction_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // API Đăng nhập: POST https://ecom-backend-api-ijgl.onrender.com/api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        // 1. Tìm user trong Database
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // 2. Kiểm tra mật khẩu (Hiện tại đang so sánh chuỗi thô, bước sau sẽ mã hóa bảo mật)
            if (user.getPassword().equals(request.getPassword())) {
                
                // 3. In vé VIP (JWT Token)
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                
                // 4. Trả về cho React
                return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getRole()));
            }
        }
        // Nếu sai tài khoản hoặc mật khẩu
        return ResponseEntity.status(401).body("Sai tài khoản hoặc mật khẩu!");
    }
}