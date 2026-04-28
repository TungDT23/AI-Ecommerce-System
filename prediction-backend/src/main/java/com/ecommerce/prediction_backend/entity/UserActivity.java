package com.ecommerce.prediction_backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.util.Date;

@Document(collection = "user_activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserActivity {

    @Id
    private String id; 

    @Field("user_id")
    private Integer userId;

    private String action; 

    @Field("product_id")
    private Integer productId;

    private String keyword;

    private Date timestamp;

    @Field("session_id")
    private String sessionId;
}