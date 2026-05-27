from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import joblib
import numpy as np
import os

app = FastAPI(title="CellphoneS Next Purchase Prediction API")

# 1. ĐƯỜNG DẪN ĐẾN FILE MODEL VỪA TRAIN
MODEL_PATH = "models/hybrid_markov_model.pkl"

# Định nghĩa cấu trúc dữ liệu Java Spring Boot sẽ bắn sang
class PredictionRequest(BaseModel):
    user_id: int = Field(alias="userId", default=0)
    last_purchased_category_id: int = Field(alias="lastPurchasedCategoryId", default=4)

    class Config:
        populate_by_name = True

class AIPredictRequest(BaseModel):
    userId: Optional[int] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    viewCount: Optional[int] = None
    cartItemCount: Optional[int] = None
    favoriteBrand: Optional[str] = None
    priceSegment: Optional[str] = None
    isValueForMoney: Optional[int] = None
    lastPurchasedCategoryId: Optional[int] = 4
    daysSinceLastPurchase: Optional[int] = None
    totalPurchases: Optional[int] = None
    totalItemsPurchased: Optional[int] = None
    userConversionRate: Optional[float] = None
    targetNextProductId: Optional[int] = None

@app.post("/predict")
def predict_next_product(request: PredictionRequest):
    # Kiểm tra xem file model đã tồn tại chưa
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=500, detail="Model file not found. Please run train.py first.")
    
    try:
        # 2. TẢI BỘ NÃO AI MARKOV LÊN
        model_data = joblib.load(MODEL_PATH)
        states = model_data["states"]
        transition_matrix = np.array(model_data["transition_matrix"])
        
        current_state = request.last_purchased_category_id
        
        # Kiểm tra tính hợp lệ của ID danh mục (phải từ 1 đến 5)
        if current_state not in states:
            raise HTTPException(status_code=400, detail=f"Invalid category_id. Must be in {states}")
        
        # 3. TRÍCH XUẤT DÒNG XÁC SUẤT CỦA TRẠNG THÁI HIỆN TẠI
        probabilities = transition_matrix[current_state]
        
        # Tìm danh mục tiếp theo có xác suất dịch chuyển cao nhất (bỏ qua phần tử 0 do ID tính từ 1)
        next_category_predicted = int(np.argmax(probabilities[1:]) + 1)
        highest_prob = float(probabilities[next_category_predicted])
        
        # 4. LOGIC MÌ ĂN LIỀN: Trả về mã sản phẩm (Product ID gợi ý) nằm trong danh mục đó
        # Để khớp với bảng products trong MySQL sếp vừa nạp (ví dụ danh mục Laptop có id sản phẩm từ 3-5,...)
        # Ta sẽ trả về một Product ID đại diện hoặc phân phối ngẫu nhiên theo danh mục đó
        # Ví dụ: nếu đoán mua tiếp Laptop (1) -> gợi ý luôn sản phẩm ID 3 (MacBook Air)
        category_to_product_sample = {
            1: 4,  # Laptop -> Gợi ý MacBook Air 13 inch M3
            2: 3,  # Headphones -> Gợi ý Sony WH-1000XM5 Premium
            3: 2,  # Tablet -> Gợi ý iPad Air 6 M2 11 inch
            4: 1,  # Smartphone -> Gợi ý iPhone 15 Pro Max 256GB
            5: 9   # Smartwatch -> Gợi ý Apple Watch Series 9 45mm LTE
        }
        
        suggested_product_id = category_to_product_sample.get(next_category_predicted, 1)
        
        return {
            "user_id": request.user_id,
            "current_category_id": current_state,
            "predicted_next_category_id": next_category_predicted,
            "probability": round(highest_prob, 4),
            "suggested_product_id": suggested_product_id  # Trả về ID này để Java bốc ra giao diện Web!
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/ai/predict")
def predict_next_products_ai(request: AIPredictRequest):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=500, detail="Model file not found. Please run train.py first.")
        
    try:
        artifacts = joblib.load(MODEL_PATH)
        # Using same logic as test_new_users.py
        markov_matrix = artifacts.get("markov_matrix", {})
        brand_profile = artifacts.get("brand_profile", {})
        segment_profile = artifacts.get("segment_profile", {})
        global_popular = artifacts.get("global_popular", [])
        
        cat_state = request.lastPurchasedCategoryId if request.lastPurchasedCategoryId else 4
        brand_state = request.favoriteBrand if request.favoriteBrand else "Unknown"
        segment_state = request.priceSegment if request.priceSegment else "MEDIUM"
        
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
                if not any(r["productId"] == int(pop) for r in recommendations):
                    recommendations.append({"productId": int(pop), "confidenceScore": 0.01})
                    
        return {"recommendations": recommendations}

    except Exception as e:
        print(f"Error in /ai/predict: {e}")
        # fallback
        return {
            "recommendations": [
                {"productId": 1, "confidenceScore": 0.5},
                {"productId": 2, "confidenceScore": 0.4}
            ]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)