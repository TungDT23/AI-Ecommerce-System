package com.ecommerce.prediction_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token; // Mã thông hành JWT
    private Integer userId; // Trả về ID để React biết ai đang đăng nhập
    private String role; // Trả về Quyền để phân biệt Admin/User
    
    // ✨ ĐỘ THÊM TRƯỜNG NÀY: Trả về thẳng Họ tên thật từ DB khi vừa đăng nhập xong!
    @JsonProperty("fullName")
    private String fullName;
}