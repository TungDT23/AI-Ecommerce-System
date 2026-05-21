from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib
import uvicorn

app = FastAPI(title="Lõi Dự Đoán Chuỗi Dịch Chuyển Hybrid Markov")

model_path = "models/hybrid_markov_model.pkl"
try:
    artifacts = joblib.load(model_path)
    markov_matrix = artifacts["markov_matrix"]
    brand_profile = artifacts["brand_profile"]
    segment_profile = artifacts["segment_profile"]
    global_popular = artifacts.get("global_popular", [])
except Exception as e:
    markov_matrix, brand_profile, segment_profile, global_popular = {}, {}, {}, []

class UserFeaturesInput(BaseModel):
    user_id: int = Field(..., alias="userId")
    age: int
    gender: str
    location: str
    view_count: int = Field(..., alias="viewCount")
    cart_item_count: int = Field(..., alias="cartItemCount")
    favourite_brand: str = Field(..., alias="favoriteBrand")
    price_segment: str = Field(..., alias="priceSegment")
    is_value_for_money: int = Field(..., alias="isValueForMoney")
    last_purchased_category_id: int = Field(..., alias="lastPurchasedCategoryId")
    days_since_last_purchase: int = Field(..., alias="daysSinceLastPurchase")
    total_purchases: int = Field(..., alias="totalPurchases")
    total_items_purchased: int = Field(..., alias="totalItemsPurchased")
    user_conversion_rate: float = Field(..., alias="userConversionRate")

    class Config:
        populate_by_name = True

@app.post("/ai/predict")
def predict_next_products(data: UserFeaturesInput):
    cat_state = int(data.last_purchased_category_id)
    brand_state = str(data.favourite_brand)
    segment_state = str(data.price_segment)
    
    if not markov_matrix:
        return {"recommendations": []}

    if cat_state not in markov_matrix:
        cat_state = 4
    
    scores = {prod: prob for prod, prob in markov_matrix.get(cat_state, {}).items()}

    if brand_state in brand_profile:
        for prod in brand_profile[brand_state]:
            if prod in scores: scores[prod] += 0.25

    if segment_state in segment_profile:
        for prod in segment_profile[segment_state]:
            if prod in scores: scores[prod] += 0.20

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    recommendations = []
    for prod, prob in sorted_scores[:4]:
        recommendations.append({"productId": prod, "confidenceScore": round(min(prob, 1.0), 2)})
        
    if len(recommendations) < 4:
         for pop in global_popular:
             if len(recommendations) >= 4:
                 break
             if not any(r["productId"] == pop for r in recommendations):
                 recommendations.append({"productId": int(pop), "confidenceScore": 0.01})
                 
    return {"recommendations": recommendations}

if __name__ == '__main__':
    uvicorn.run("ai_server:app", host="0.0.0.0", port=8000, reload=True)
