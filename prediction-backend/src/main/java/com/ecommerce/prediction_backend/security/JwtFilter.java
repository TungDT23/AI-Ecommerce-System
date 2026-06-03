package com.ecommerce.prediction_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // 🔥 CẢI TIẾN 1: HÀNG RÀO NÉ PUBLIC PATH
        // Nếu khách truy cập vào các link Đăng nhập/Đăng ký hoặc API gợi ý AI, 
        // Cho phép đi thẳng tuột vào Controller, không cần tốn thời gian kiểm tra, giải mã Token làm gì cho lỗi!
        if (path.startsWith("/api/auth/") || path.startsWith("/api/recommendation/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authorizationHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        // 🔥 CẢI TIẾN 2: BỌC TRY-CATCH CHỐNG SẬP BẪY TOKEN CŨ/HẾT HẠN
        try {
            // Kiểm tra xem Header có chứa vé Bearer JWT không
            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                jwt = authorizationHeader.substring(7); // Cắt bỏ chữ "Bearer "
                username = jwtUtil.extractUsername(jwt);
            }

            // Nếu có tên user và chưa được xác thực trong luồng hiện tại
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.customUserDetailsService.loadUserByUsername(username);

                // Validate mã token, nếu chuẩn thì đóng dấu cho qua
                if (jwtUtil.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    usernamePasswordAuthenticationToken
                            .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                }
            }
        } catch (Exception e) {
            // Nếu dính Token rác, Token hết hạn hoặc User bị xóa trong DB -> Chỉ in log cảnh báo, không làm sập luồng!
            System.out.println(">>> [LOG JWT] Token cũ/lỗi hoặc hết hạn, bỏ qua xác thực: " + e.getMessage());
        }
        
        // Cho phép request tiếp tục đi vào các tầng Controller xử lý logic
        filterChain.doFilter(request, response);
    }
}