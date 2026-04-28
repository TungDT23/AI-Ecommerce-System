package com.ecommerce.prediction_backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Tắt CSRF vì chúng ta dùng JWT
            .cors(cors -> cors.configurationSource(request -> {
                // Cấu hình cho phép React ở cổng 5173 gọi API
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
                config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(Arrays.asList("*"));
                return config;
            }))
            .authorizeHttpRequests(auth -> auth
                // Mở cửa tự do cho Đăng nhập
                .requestMatchers("/api/auth/**").permitAll()
                
                // Mở cửa tự do cho các API mua sắm (Gợi ý, Lưu lịch sử...) 
                // (Để test luồng mua hàng cũ không bị lỗi)
                .requestMatchers("/api/recommendation/**", "/api/activities/**").permitAll()
                
                // KHU VỰC CẤM: Chỉ ADMIN mới được vào
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                
                // Các request khác tạm thời cho phép
                .anyRequest().permitAll()
            )
            // Không lưu trạng thái phiên làm việc (Stateless) vì đã dùng JWT
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // Nhét "Bác bảo vệ" (JwtFilter) lên tuyến đầu
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Tạm thời bỏ qua mã hóa mật khẩu để test dễ dàng hơn (Lên Production sẽ đổi sang BCrypt)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}