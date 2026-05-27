package com.ecommerce.prediction_backend.dto;

public class PredictionRequest {
    private int userId;
    private int lastPurchasedCategoryId;

    public PredictionRequest() {}
    public PredictionRequest(int userId, int lastPurchasedCategoryId) {
        this.userId = userId;
        this.lastPurchasedCategoryId = lastPurchasedCategoryId;
    }
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    public int getLastPurchasedCategoryId() { return lastPurchasedCategoryId; }
    public void setLastPurchasedCategoryId(int lastPurchasedCategoryId) { this.lastPurchasedCategoryId = lastPurchasedCategoryId; }
}