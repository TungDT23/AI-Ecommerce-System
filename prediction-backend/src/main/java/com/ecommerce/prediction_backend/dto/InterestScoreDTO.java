package com.ecommerce.prediction_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterestScoreDTO {
    private Integer userId;
    private Integer productId;
    private Integer totalScore;
}