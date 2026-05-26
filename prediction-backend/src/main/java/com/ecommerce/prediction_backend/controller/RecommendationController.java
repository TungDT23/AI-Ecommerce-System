package com.ecommerce.prediction_backend.controller;

import com.ecommerce.prediction_backend.dto.InterestScoreDTO;
import com.ecommerce.prediction_backend.dto.ProductRecommendationDTO;
import com.ecommerce.prediction_backend.service.AIIntegrationService;
import com.ecommerce.prediction_backend.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendation")
@CrossOrigin("*") 
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private AIIntegrationService aiIntegrationService;

    @GetMapping("/interest/{userId}")
    public List<InterestScoreDTO> getInterestScore(@PathVariable Integer userId) {
        return recommendationService.calculateInterestScore(userId);
    }

    @GetMapping("/matrix")
    public List<InterestScoreDTO> getAllInterestScores() {
        return recommendationService.calculateAllInterestScores();
    }

    @GetMapping("/display/{userId}")
    public List<ProductRecommendationDTO> getRecommendationsForFrontend(@PathVariable Integer userId) {
        return aiIntegrationService.getEnrichedRecommendations(userId);
    }
}