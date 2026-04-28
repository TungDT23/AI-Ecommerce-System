package com.ecommerce.prediction_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token; // Mã thông hành JWT
    private Integer userId; // Trả về ID để React biết ai đang đăng nhập
    private String role; // Trả về Quyền để React biết đường mở trang Admin hay trang Mua sắm
}