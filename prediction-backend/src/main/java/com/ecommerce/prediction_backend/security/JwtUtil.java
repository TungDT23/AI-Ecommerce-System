package com.ecommerce.prediction_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    // Đây là "Con dấu mộc đỏ" của riêng hệ thống bạn (Phải giữ bí mật trong thực tế)
    // Cần một chuỗi ký tự đủ dài để thuật toán HS256 mã hóa
    private static final String SECRET = "PTIT_Ecom_AI_Project_Secret_Key_Must_Be_Long_Enough_2026";
    
    // Vé VIP có hạn sử dụng là 24 giờ (tính bằng mili-giây)
    private static final long EXPIRATION_TIME = 86400000; 

    private Key getSignKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    // 1. Hàm tạo vé VIP (Token) dựa trên thông tin người dùng
    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role); // Gắn thêm chức vụ (Quyền) vào vé
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username) // Tên người dùng
                .setIssuedAt(new Date(System.currentTimeMillis())) // Thời gian in vé
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // Thời gian hết hạn
                .signWith(getSignKey(), SignatureAlgorithm.HS256) // Đóng dấu bảo mật
                .compact();
    }

    // 2. Trích xuất tên người dùng từ vé
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 3. Kiểm tra xem vé còn hạn không và có đúng của người này không
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token).getBody();
        return claimsResolver.apply(claims);
    }
}