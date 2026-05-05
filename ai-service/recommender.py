import requests
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

# 1. Kéo dữ liệu từ cổng API Spring Boot của bạn
url = "https://ecom-backend-api-ijgl.onrender.com/api/recommendation/matrix"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    
    # 2. Đưa dữ liệu vào Pandas DataFrame
    df = pd.DataFrame(data)
    print("=== DỮ LIỆU THÔ TỪ BACKEND ===")
    print(df)
    print("\n")

    # 3. Biến đổi thành Ma trận tương tác User-Item (User-Item Interaction Matrix)
    # Những sản phẩm user chưa tương tác sẽ được điền số 0
    user_item_matrix = df.pivot_table(index='userId', columns='productId', values='totalScore', fill_value=0)
    print("=== MA TRẬN USER-ITEM ===")
    print(user_item_matrix)
    print("\n")

    # 4. Dùng Scikit-learn để tính độ tương đồng giữa các User (Cosine Similarity)
    user_similarity = cosine_similarity(user_item_matrix)
    similarity_df = pd.DataFrame(user_similarity, index=user_item_matrix.index, columns=user_item_matrix.index)
    
    print("=== ĐỘ TƯƠNG ĐỒNG GIỮA CÁC USER (Từ 0 đến 1) ===")
    print(similarity_df)

else:
    print(f"Lỗi kết nối API. Mã lỗi: {response.status_code}")

# ... (Giữ nguyên toàn bộ code cũ ở phía trên) ...

print("=== KẾT QUẢ GỢI Ý SẢN PHẨM ===")

def get_recommendations(target_user_id, user_item_matrix, similarity_df, top_n=2):
    # 1. Lấy danh sách các user có độ tương đồng > 0 với user mục tiêu, xếp giảm dần
    similar_users = similarity_df[target_user_id].drop(target_user_id).sort_values(ascending=False)
    similar_users = similar_users[similar_users > 0]
    
    # 2. Lấy các sản phẩm mà target_user ĐÃ tương tác (để loại trừ, không gợi ý lại đồ đã mua)
    target_user_interacted = user_item_matrix.loc[target_user_id]
    interacted_items = target_user_interacted[target_user_interacted > 0].index.tolist()
    
    recommendations = {}
    
    # 3. Duyệt qua các user giống mình để "học lỏm" sở thích
    for similar_user, similarity_score in similar_users.items():
        similar_user_items = user_item_matrix.loc[similar_user]
        
        for item_id, score in similar_user_items.items():
            # Nếu người giống mình thích item này, và mình CHƯA từng tương tác với nó
            if score > 0 and item_id not in interacted_items:
                # Trọng số gợi ý = Điểm của người kia * Độ tương đồng giữa 2 người
                predicted_score = score * similarity_score
                
                if item_id in recommendations:
                    recommendations[item_id] += predicted_score
                else:
                    recommendations[item_id] = predicted_score
                    
    # 4. Sắp xếp kết quả gợi ý từ cao xuống thấp và trả về top N
    sorted_recommendations = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
    return sorted_recommendations[:top_n]

# Thử nghiệm thực tế: Yêu cầu AI gợi ý đồ cho User 2
target_user = 2
recs = get_recommendations(target_user, user_item_matrix, similarity_df)

if recs:
    print(f"\n=> AI ĐANG GỢI Ý CHO USER {target_user}:")
    for item_id, score in recs:
        print(f"  + Nên bán Sản phẩm ID {item_id} (Điểm tin cậy: {score:.2f})")
else:
    print(f"\n=> Chưa có đủ dữ liệu chéo để gợi ý cho User {target_user}")