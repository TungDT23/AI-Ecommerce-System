from pydantic import BaseModel
from typing import Optional

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
    lastPurchasedCategoryId: Optional[int] = None
    daysSinceLastPurchase: Optional[int] = None
    totalPurchases: Optional[int] = None
    totalItemsPurchased: Optional[int] = None
    userConversionRate: Optional[float] = None
    targetNextProductId: Optional[int] = None

