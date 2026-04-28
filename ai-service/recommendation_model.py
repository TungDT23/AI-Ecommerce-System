import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
import numpy as np

print("Đang kết nối Database...")
client = MongoClient("mongodb://localhost:27017/") 

# SỬA 1: Trỏ đúng vào tên Database trong ảnh của bạn
db = client["ecommerce_behavior"] 

# SỬA 2: Trỏ đúng vào tên Bảng (Collection)
collection = db["user_activities"] 

# SỬA 3: Lấy đúng tên các cột (user_id, product_id có dấu gạch dưới)
data = list(collection.find({}, {"_id": 0, "user_id": 1, "product_id": 1, "action": 1}))
df = pd.DataFrame(data)

# Khởi tạo ma trận rỗng để chống lỗi
user_similarity_df = pd.DataFrame()
df_grouped = pd.DataFrame(columns=['user_id', 'product_id', 'score'])

if df.empty:
    print("⚠️ Chưa có dữ liệu hành vi để AI học! Hệ thống sẽ trả về rỗng để Java kích hoạt Cold Start.")
else:
    print(f"✅ Đã tải {len(df)} dòng dữ liệu hành vi. Bắt đầu huấn luyện AI...")
    action_weights = {
        'view_product': 1,
        'add_to_cart': 3,
        'purchase': 5
    }
    df['score'] = df['action'].map(action_weights)
    
    # Nhóm theo đúng tên cột mới sửa
    df_grouped = df.groupby(['user_id', 'product_id'])['score'].sum().reset_index()
    
    user_item_matrix = df_grouped.pivot(index='user_id', columns='product_id', values='score').fillna(0)
    user_similarity = cosine_similarity(user_item_matrix)
    user_similarity_df = pd.DataFrame(user_similarity, index=user_item_matrix.index, columns=user_item_matrix.index)

def get_recommendations(target_user_id, num_recommendations=4):
    # NẾU DATA RỖNG HOẶC USER MỚI TINH -> TRẢ VỀ RỖNG (Để Java gọi Cold Start)
    if user_similarity_df.empty or target_user_id not in user_similarity_df.index:
        return []

    similar_users = user_similarity_df[target_user_id].sort_values(ascending=False)[1:]
    user_interacted_items = set(df_grouped[df_grouped['user_id'] == target_user_id]['product_id'])
    
    recommendations = {}
    for similar_user, similarity_score in similar_users.items():
        if similarity_score <= 0:
            continue 
        similar_user_items = df_grouped[df_grouped['user_id'] == similar_user]
        for _, row in similar_user_items.iterrows():
            item = int(row['product_id'])
            if item not in user_interacted_items:
                if item not in recommendations:
                    recommendations[item] = 0
                recommendations[item] += similarity_score * row['score']
                
    top_items = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)[:num_recommendations]
    
    # QUAN TRỌNG: Dù trong database là product_id, ta vẫn phải trả về chữ "productId" 
    # để khớp với cái Java (AIIntegrationService) đang mong chờ!
    return [{"productId": item, "confidenceScore": round(score, 2)} for item, score in top_items]