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
        model_data = joblib.load(MODEL_PATH)
        states = model_data.get("states", [1,2,3,4,5])
        transition_matrix = np.array(model_data.get("transition_matrix", []))
        
        current_state = request.lastPurchasedCategoryId if request.lastPurchasedCategoryId else 4
        if current_state not in states:
            current_state = 4
            
        probabilities = transition_matrix[current_state]
        
        cat_probs = [(i, float(probabilities[i])) for i in range(1, len(probabilities))]
        cat_probs.sort(key=lambda x: x[1], reverse=True)
        
        # Ánh xạ tĩnh từ Category ID -> mảng Product IDs hiện có trong database
        cat_to_prods = {
            1: [1, 3, 6],   # Laptop
            2: [5, 9],      # Headphones
            3: [2, 8],      # Tablet
            4: [4, 7],      # Smartphone
            5: [10],        # Smartwatch
        }
        
        recommendations = []
        for cat_id, base_prob in cat_probs:
            prods = cat_to_prods.get(cat_id, [])
            for prod in prods:
                prob = base_prob
                # Cộng thêm điểm bonus nếu user thuộc price segment hoặc gì đấy (giả lập profile nhẹ)
                prob = min(prob * 1.5, 0.99) if base_prob > 0 else 0.1
                recommendations.append({"productId": prod, "confidenceScore": round(prob, 2)})
                if len(recommendations) >= 5:
                    break
            if len(recommendations) >= 5:
                break
                
        return {"recommendations": recommendations[:5]}

    except Exception as e:
        print(f"Error in /ai/predict: {e}")
        # fallback
        return {
            "recommendations": []
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)