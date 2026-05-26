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

    // 1. API ĐĂNG NHẬP (ĐÃ SỬA LỖI TRUYỀN THIẾU THAM SỐ)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(request.getPassword())) {
                
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getRole(), user.getFullName()));
            }
        }
        return ResponseEntity.status(401).body("Sai tài khoản hoặc mật khẩu!");
    }


    // 2. API ĐĂNG KÝ MỚI (CẬP NHẬT ĐỂ ĐỒNG BỘ FULL_NAME)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Tên tài khoản đã tồn tại, vui lòng chọn tên khác!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email này đã được sử dụng!");
        }

        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        newUser.setFullName(request.getFullName());
        newUser.setAge(request.getAge());
        newUser.setGender(request.getGender());
        newUser.setLocation(request.getLocation());
        
        newUser.setFullName(request.getUsername());
        
        newUser.setPassword(request.getPassword()); 
        
        newUser.setRole("ROLE_USER");

        userRepository.save(newUser);

        return ResponseEntity.ok("Đăng ký tài khoản thành công!");
    }

    // 3. DTO HỨNG DỮ LIỆU ĐĂNG KÝ TỪ REACT
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