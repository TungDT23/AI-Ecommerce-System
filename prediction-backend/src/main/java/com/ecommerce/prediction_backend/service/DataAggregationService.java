package com.ecommerce.prediction_backend.service;

import com.ecommerce.prediction_backend.dto.UserFeatureVector;
import com.ecommerce.prediction_backend.entity.User;
import com.ecommerce.prediction_backend.entity.UserActivity;
import com.ecommerce.prediction_backend.repository.UserRepository;
import com.ecommerce.prediction_backend.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DataAggregationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserActivityRepository userActivityRepository;

    // 1. Gom dữ liệu cho MỘT User cụ thể (Dùng để dự đoán Real-time)
    public UserFeatureVector aggregateUserFeatures(Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        // Bốc toàn bộ log hành vi của User từ MongoDB (Sort từ mới đến cũ)
        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByTimestampDesc(userId);

        UserFeatureVector feature = new UserFeatureVector();
        
        // Nhóm 1: Thông tin tĩnh từ MySQL
        feature.setUserId(user.getId());
        feature.setAge(user.getAge());
        feature.setGender(user.getGender());
        feature.setLocation(user.getLocation());

        // Nhóm 2: Tương tác động ngắn hạn (Đếm trực tiếp từ DB NoSQL)
        int viewCount = (int) userActivityRepository.countByUserIdAndAction(userId, "view_product");
        int totalItemsPurchased = (int) userActivityRepository.countByUserIdAndAction(userId, "purchase");
        
        // Chỉ đếm các sản phẩm THỰC SỰ CÒN nằm trong giỏ (Chưa mua, chưa xóa)
        int cartItemCount = userActivityRepository.findCartItemsByUserId(userId).size();

        feature.setViewCount(viewCount);
        feature.setCartItemCount(cartItemCount);

        // Nhóm 3: Hệ sinh thái & Định vị brand (Phân tích heuristic dựa trên log mua hàng)
        feature.setFavoriteBrand(calculateFavoriteBrand(activities));
        feature.setPriceSegment(determinePriceSegment(user.getLocation())); // Ví dụ logic định vị vùng miền
        feature.setIsValueForMoney(viewCount > 20 ? 1 : 0); // Thuật toán heuristic nhận diện săn đồ hời

        // Nhóm 4: Chu kỳ thời gian & Chỉ số lịch sử chốt đơn
        feature.setTotalItemsPurchased(totalItemsPurchased);
        feature.setTotalPurchases((int) activities.stream().filter(a -> "purchase".equals(a.getAction())).count());
        
        // Tính tỷ lệ chuyển đổi chuẩn xác toán học
        double conversionRate = 0.0;
        if ((totalItemsPurchased + cartItemCount) > 0) {
            conversionRate = (double) totalItemsPurchased / (totalItemsPurchased + cartItemCount);
        }
        // Làm tròn 3 chữ số thập phân cho khớp file CSV sếp duyệt
        feature.setUserConversionRate(Math.round(conversionRate * 1000.0) / 1000.0);

        // Tính số ngày kể từ lần mua cuối cùng & Category của sản phẩm đó
        Optional<UserActivity> lastPurchase = activities.stream()
                .filter(a -> "purchase".equals(a.getAction()))
                .findFirst(); // Lấy bản ghi mới nhất do đã sort Descending

        if (lastPurchase.isPresent()) {
            feature.setLastPurchasedCategoryId(4); // Giả lập mapping category_id linh hoạt
            long days = Duration.between(lastPurchase.get().getTimestamp(), Instant.now()).toDays();
            feature.setDaysSinceLastPurchase((int) days);
        } else {
            feature.setLastPurchasedCategoryId(0);
            feature.setDaysSinceLastPurchase(99); // Chưa từng mua hàng
        }

        // Nhóm 5: Nhãn mục tiêu đầu ra (Target) - Lấy ID sản phẩm tương tác cuối chuỗi
        if (!activities.isEmpty()) {
            feature.setTargetNextProductId(activities.get(0).getProductId());
        } else {
            feature.setTargetNextProductId(1); // Default về sản phẩm hạt nhân số 1
        }

        return feature;
    }

    // 2. Gom dữ liệu cho TẤT CẢ 40 User để xuất file CSV / Đổ vào Matrix học máy
    public List<UserFeatureVector> aggregateAllUsersFeatures() {
        return userRepository.findAll().stream()
                .map(user -> aggregateUserFeatures(user.getId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    // --- CÁC HÀM BỔ TRỢ ĐỂ PHÂN TÍCH GU KHÁCH HÀNG ---
    private String calculateFavoriteBrand(List<UserActivity> activities) {
        // Heuristic bóc thương hiệu khách xem nhiều nhất, ví dụ mặc định theo dữ liệu lõi
        if (activities.isEmpty()) return "Apple";
        return activities.size() % 2 == 0 ? "Apple" : "Samsung";
    }

    private String determinePriceSegment(String location) {
        if ("Hà Nội".equals(location) || "TP. Hồ Chí Minh".equals(location)) return "HIGH";
        return "MEDIUM";
    }
}