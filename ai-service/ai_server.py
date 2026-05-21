from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib
import uvicorn

app = FastAPI(title="Lõi Dự Đoán Chuỗi Dịch Chuyển Hybrid Markov")

# Load model ... (giữ nguyên cấu trúc trên RAM)

# CẬP NHẬT ĐỂ NHẬN CẢ CAMELCASE TỪ JAVA VÀ SNAKE_CASE TỪ CSV
class UserFeaturesInput(BaseModel):
    user_id: int = Field(..., alias="userId")
    age: int
    gender: str
    location: str
    view_count: int = Field(..., alias="viewCount")
    cart_item_count: int = Field(..., alias="cartItemCount")
    favourite_brand: str = Field(..., alias="favoriteBrand") # Cân cả chữ 'u' của CSV và Java
    price_segment: str = Field(..., alias="priceSegment")
    is_value_for_money: int = Field(..., alias="isValueForMoney")
    last_purchased_category_id: int = Field(..., alias="lastPurchasedCategoryId")
    days_since_last_purchase: int = Field(..., alias="daysSinceLastPurchase")
    total_purchases: int = Field(..., alias="totalPurchases")
    total_items_purchased: int = Field(..., alias="totalItemsPurchased")
    user_conversion_rate: float = Field(..., alias="userConversionRate")

    # Cấu hình này giúp Pydantic hiểu và chấp nhận cả tên gốc lẫn tên alias từ Java gửi sang
    class Config:
        populate_by_name = True

@app.post("/ai/predict")
def predict_next_products(data: UserFeaturesInput):
    # Toàn bộ logic thuật toán bên dưới sếp GIỮ NGUYÊN HOÀN TOÀN, không cần sửa một chữ nào!
    cat_state = int(data.last_purchased_category_id)
    brand_state = str(data.favourite_brand)
    segment_state = str(data.price_segment)
    # ... (giữ nguyên phần code thuật toán lai xử lý)