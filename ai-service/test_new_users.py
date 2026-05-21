import joblib

def predict_next_products(user_data, artifacts):
    markov_matrix = artifacts["markov_matrix"]
    brand_profile = artifacts["brand_profile"]
    segment_profile = artifacts["segment_profile"]
    global_popular = artifacts.get("global_popular", [])

    cat_state = int(user_data['last_purchased_category_id'])
    brand_state = str(user_data['favourite_brand'])
    segment_state = str(user_data['price_segment'])
    
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
                 
    return recommendations

if __name__ == "__main__":
    print("Đang nạp mô hình đã train bằng 100% dữ liệu...")
    artifacts = joblib.load("models/hybrid_markov_model.pkl")
    
    # TẠO 3 USER MỚI TOANH CÓ PROFILE KHÁC NHAU ĐỂ KIỂM CHỨNG
    test_users = [
        {
            "user_id": 1001,
            "name": "Khách hàng sinh viên (Giá rẻ, Đồ phụ kiện di động)",
            "last_purchased_category_id": 1, # Vừa mua Điện thoại
            "favourite_brand": "Samsung",
            "price_segment": "LOW"
        },
        {
            "user_id": 1002,
            "name": "Nữ khách hàng VIP (Cao cấp, Thích làm đẹp)",
            "last_purchased_category_id": 5, # Vừa mua Đồ điện gia dụng / Làm đẹp
            "favourite_brand": "Apple",
            "price_segment": "HIGH"
        },
        {
            "user_id": 1003,
            "name": "Nam game thủ (Tầm trung, Thích vi tính)",
            "last_purchased_category_id": 2, # Vừa mua Laptop/Máy tính
            "favourite_brand": "Asus",
            "price_segment": "MEDIUM"
        }
    ]

    print("\n============= KẾT QUẢ DỰ ĐOÁN CHO 3 USER MỚI =============")
    for user in test_users:
        recs = predict_next_products(user, artifacts)
        print(f"👤 {user['name']}\n   (Brand: {user['favourite_brand']} | Phân khúc giá: {user['price_segment']} | Bắt nguồn từ danh mục: {user['last_purchased_category_id']})")
        print(f"   => Sản phẩm AI chắt lọc:")
        for rec in recs:
            print(f"       • Cân nhắc sản phẩm ID: {rec['productId']:<2} - Xác suất chốt đơn: {rec['confidenceScore']*100:.0f}%")
        print("-" * 65)
