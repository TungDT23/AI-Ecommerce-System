package com.ecommerce.prediction_backend.dto;

public class PredictionResponse {
    private int userId;
    private int currentCategoryId;
    private int predictedNextCategoryId;
    private double probability;
    private int suggestedProductId; // Thuộc tính cốt lõi nhận từ Python

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    public int getCurrentCategoryId() { return currentCategoryId; }
    public void setCurrentCategoryId(int currentCategoryId) { this.currentCategoryId = currentCategoryId; }
    public int getPredictedNextCategoryId() { return predictedNextCategoryId; }
    public void setPredictedNextCategoryId(int predictedNextCategoryId) { this.predictedNextCategoryId = predictedNextCategoryId; }
    public double getProbability() { return probability; }
    public void setProbability(double probability) { this.probability = probability; }
    public int getSuggestedProductId() { return suggestedProductId; }
    public void setSuggestedProductId(int suggestedProductId) { this.suggestedProductId = suggestedProductId; }
}