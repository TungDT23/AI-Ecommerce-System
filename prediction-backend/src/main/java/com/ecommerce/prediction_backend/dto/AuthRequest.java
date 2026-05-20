package com.ecommerce.prediction_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AuthRequest {
    
    // ✨ BỔ SUNG ANNOTATION NÀY ĐỂ XÓA BỎ LỖI 401, GIÚP SPRING BOOT ĐỌC ĐƯỢC TÀI KHOẢN
    @JsonProperty("username")
    private String username;
    
    private String password;
}