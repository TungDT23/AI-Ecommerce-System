package com.ecommerce.prediction_backend.repository;

import com.ecommerce.prediction_backend.entity.UserActivity;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserActivityRepository extends MongoRepository<UserActivity, String> {
    //Thêm dòng này để Spring Boot tự động viết câu lệnh truy vấn tìm theo userId
    List<UserActivity> findByUserId(Integer userId);
}