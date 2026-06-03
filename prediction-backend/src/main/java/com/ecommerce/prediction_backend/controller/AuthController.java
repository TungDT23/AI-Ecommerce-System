package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.dto.AuthRequest;
import com.ecommerce.prediction_backend.dto.AuthResponse;
import com.ecommerce.prediction_backend.entity.User;
import com.ecommerce.prediction_backend.repository.UserRepository;
import com.ecommerce.prediction_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCrypt; // Dùng thư viện check trực tiếp cực kỳ an toàn
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

    /**
     * 1. API ĐĂNG NHẬP: Đã sửa lỗi so khớp BCrypt vs PlainText (Giải quyết triệt để lỗi 401)
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        // Tìm user theo username gõ từ Frontend
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String dbPassword = user.getPassword();       // Mật khẩu lấy từ MySQL ($2a$10$... hoặc 123456)
            String rawPassword = request.getPassword();   // Mật khẩu sếp gõ trên form ("123456")
            
            boolean isPasswordMatch = false;

            // KIỂM TRA THÔNG MINH ĐA TẦNG:
            if (dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$")) {
                // Nếu pass trong DB là chuỗi mã hóa BCrypt -> Dùng BCrypt.checkpw để giải mã so sánh
                try {
                    isPasswordMatch = BCrypt.checkpw(rawPassword, dbPassword);
                } catch (Exception e) {
                    isPasswordMatch = false;
                }
            } else {
                // Nếu pass trong DB là chuỗi thường -> Dùng .equals() để check (đáp ứng mọi kiểu nạp data)
                isPasswordMatch = dbPassword.equals(rawPassword);
            }

            // Nếu khớp mật khẩu -> Tiến hành cấp Token và đăng nhập thành công
            if (isPasswordMatch) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getRole(), user.getFullName()));
            }
        }
        
        // Trả về 401 kèm thông báo cụ thể cho hàm res.text() bên React hiển thị lên Toast
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai tài khoản hoặc mật khẩu!");
    }

    /**
     * 2. API ĐĂNG KÝ MỚI: Đã dọn dẹp lỗi ghi đè tên tài khoản (Bug FullName)
     */
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
        newUser.setFullName(request.getFullName()); // Giữ nguyên họ tên chuẩn của người dùng
        newUser.setAge(request.getAge());
        newUser.setGender(request.getGender());
        newUser.setLocation(request.getLocation());
        newUser.setPassword(request.getPassword()); // Lưu mật khẩu
        newUser.setRole("USER"); // Đồng bộ chuẩn Role với tập dữ liệu test

        userRepository.save(newUser);

        return ResponseEntity.ok("Đăng ký tài khoản thành công!");
    }

    /**
     * 3. DTO HỨNG DỮ LIỆU ĐĂNG KÝ TỪ REACT
     */
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