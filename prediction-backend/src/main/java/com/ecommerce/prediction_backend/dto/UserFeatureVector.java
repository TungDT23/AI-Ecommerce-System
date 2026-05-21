package com.ecommerce.prediction_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFeatureVector {
    // Nhóm 1: Thông tin tĩnh từ MySQL
    private Integer userId;
    private Integer age;
    private String gender;
    private String location;
    
    // Nhóm 2: Tương tác động ngắn hạn (Đếm từ MongoDB)
    private Integer viewCount;
    private Integer cartItemCount; // Số món còn ngâm trong giỏ
    
    // Nhóm 3: Hệ sinh thái & Định vị brand
    private String favoriteBrand;
    private String priceSegment;
    private Integer isValueForMoney; // 1: Đúng gu săn đồ hời, 0: Không
    
    // Nhóm 4: Chu kỳ thời gian & Chỉ số tích lũy lịch sử chốt đơn
    private Integer lastPurchasedCategoryId;
    private Integer daysSinceLastPurchase;
    private Integer totalPurchases;       // Tổng số hóa đơn/đơn hàng
    private Integer totalItemsPurchased;  // Tổng số lượng sản phẩm nguyên vẹn đã mua
    private Double userConversionRate;    // Tỷ lệ chuyển đổi: totalItemsPurchased / (totalItemsPurchased + cartItemCount)
    
    // Nhóm 5: Nhãn mục tiêu đầu ra (Target)
    private Integer targetNextProductId;  // ID sản phẩm lõi mua tiếp theo
}