package com.ecommerce.prediction_backend.repository;

import com.ecommerce.prediction_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    
    // THÊM 2 DÒNG NÀY ĐỂ CHECK TRÙNG LÚC ĐĂNG KÝ
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}