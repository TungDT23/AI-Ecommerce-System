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

    // ========================================================
    // 1. API ĐĂNG NHẬP (Giữ nguyên logic của sếp)
    // ========================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        // 1. Tìm user trong Database
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // 2. Kiểm tra mật khẩu (So sánh chuỗi thô để khớp form Đăng ký)
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

    // ========================================================
    // 2. API ĐĂNG KÝ MỚI
    // ========================================================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Kiểm tra xem Username đã có ai dùng chưa
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Tên tài khoản đã tồn tại, vui lòng chọn tên khác!");
        }

        // Kiểm tra xem Email đã đăng ký chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email này đã được sử dụng!");
        }

        // Tạo User mới
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        
        // Lưu mật khẩu dạng thô (plain-text) để khớp với hàm Login ở trên
        newUser.setPassword(request.getPassword()); 
        
        // Mặc định ai đăng ký cũng là Khách hàng (User)
        newUser.setRole("ROLE_USER");

        // Lưu vào Database
        userRepository.save(newUser);

        return ResponseEntity.ok("Đăng ký tài khoản thành công!");
    }

    // ========================================================
    // 3. DTO HỨNG DỮ LIỆU ĐĂNG KÝ TỪ REACT
    // ========================================================
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}