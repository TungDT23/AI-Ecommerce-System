package com.ecommerce.prediction_backend.repository;

import com.ecommerce.prediction_backend.entity.UserActivity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserActivityRepository extends MongoRepository<UserActivity, String> {
    
    // Tìm toàn bộ log của 1 user sắp xếp theo thời gian mới nhất (cực kỳ quan trọng để bắt trend hành vi)
    List<UserActivity> findByUserIdOrderByTimestampDesc(Integer userId);

    // Đếm nhanh số lượng hành động cụ thể (Sếp dùng để tính view_count, total_purchases mà không cần lọc thủ công)
    long countByUserIdAndAction(Integer userId, String action);

    // Tìm các món đồ đang nằm trong giỏ (giúp sếp tính cart_item_count chính xác 100%)
    @Query("{ 'user_id' : ?0, 'action' : 'add_to_cart' }")
    List<UserActivity> findCartItemsByUserId(Integer userId);
}