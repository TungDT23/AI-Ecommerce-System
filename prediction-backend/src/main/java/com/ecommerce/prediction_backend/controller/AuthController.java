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
    // 1. API ĐĂNG NHẬP (ĐÃ SỬA LỖI TRUYỀN THIẾU THAM SỐ)
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
                
                // 4. FIX LỖI 500: Truyền thêm tham số thứ 4 "user.getFullName()" để khớp với DTO AuthResponse mới
                return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getRole(), user.getFullName()));
            }
        }
        // Nếu sai tài khoản hoặc mật khẩu
        return ResponseEntity.status(401).body("Sai tài khoản hoặc mật khẩu!");
    }

    // ========================================================
    // 2. API ĐĂNG KÝ MỚI (CẬP NHẬT ĐỂ ĐỒNG BỘ FULL_NAME)
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
        newUser.setFullName(request.getFullName());
        newUser.setAge(request.getAge());
        newUser.setGender(request.getGender());
        newUser.setLocation(request.getLocation());
        
        // Gán luôn Họ tên mặc định bằng chính Username khi mới đăng ký để không bị trống DB
        newUser.setFullName(request.getUsername());
        
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
        private String fullName;
        private Integer age;
        private String gender;
        private String location;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }

        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
    }
}