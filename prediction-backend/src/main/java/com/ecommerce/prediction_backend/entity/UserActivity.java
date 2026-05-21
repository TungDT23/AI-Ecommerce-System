package com.ecommerce.prediction_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.Instant;

@Document(collection = "user_activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivity {

    @Id
    private String id; 

    @Field("user_id")
    private Integer userId;

    @Field("product_id")
    private Integer productId;

    // Các action sẽ là: "view_product", "add_to_cart", "purchase"
    private String action; 

    // Dùng Instant để tương thích tuyệt đối với BSON Date trong MongoDB
    @Field("timestamp")
    private Instant timestamp;

    // Loại bỏ 'keyword' và 'session_id' vì tập dữ liệu của mình 
    // tập trung vào hành vi (view/cart/purchase) để tính toán tỉ lệ chốt đơn (Conversion Rate)
}