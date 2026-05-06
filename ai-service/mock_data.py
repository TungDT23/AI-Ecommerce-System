import random
from datetime import datetime, timedelta
from pymongo import MongoClient

print("Đang kết nối tới MongoDB...")
# Kết nối MongoDB (chạy localhost)
client = MongoClient("mongodb://localhost:27017/")
db = client["ecommerce_behavior"]
collection = db["user_activities"]

# Xóa sạch dữ liệu cũ để tránh rác
print("Đang dọn dẹp bộ nhớ cũ...")
collection.delete_many({})

# Phân loại ID theo 4 Hệ sinh thái (Khớp 100% với 30 sản phẩm MySQL)
# Cấu trúc: [Thiết bị chính 1, Thiết bị chính 2, Phụ kiện 1, Phụ kiện 2, Phụ kiện 3...]
ecosystems = [
    [1, 2, 3, 4, 5, 6, 7],         # Apple (iPhone 15 -> Ốp lưng, Sạc, AirPods...)
    [8, 9, 10, 11, 12, 13],        # Samsung (S24 Ultra -> Ốp, Sạc, Buds, Watch...)
    [14, 15, 16, 17, 18, 19, 20],  # Gaming (Laptop Asus/Acer -> Chuột, Phím, Màn hình...)
    [21, 22, 23, 24, 25, 26, 27]   # Văn phòng (MacBook/Dell -> Chuột MX, Phím, Hub...)
]

activities = []
# Lùi thời gian về 30 ngày trước để giả lập Data thật
start_time = datetime.now() - timedelta(days=30)

print("Đang giả lập hành vi cho 50 User...")
# Giả lập 50 User (ID từ 1 đến 50)
for user_id in range(1, 51):
    # Mỗi User vào web 2 đến 6 lần (2-6 sessions)
    for _ in range(random.randint(2, 6)):
        # Random thời điểm vào web
        current_time = start_time + timedelta(days=random.randint(0, 29), hours=random.randint(0, 23))
        
        # Chọn ngẫu nhiên 1 Hệ sinh thái mà khách này thích
        eco = random.choice(ecosystems)
        
        # --- BẮT ĐẦU CHUỖI MARKOV ---
        
        # 1. Khách hàng xem Thiết bị chính (Điện thoại / Laptop)
        main_device = eco[0] if random.random() > 0.4 else eco[1]
        activities.append({"user_id": user_id, "product_id": main_device, "action": "view_product", "timestamp": current_time})
        current_time += timedelta(minutes=random.randint(1, 3))
        
        # 2. Xem xong thiết bị chính -> Click sang xem Phụ kiện liên quan (Điểm "ăn tiền" của Markov)
        accessory = random.choice(eco[2:])
        activities.append({"user_id": user_id, "product_id": accessory, "action": "view_product", "timestamp": current_time})
        current_time += timedelta(minutes=random.randint(1, 3))
        
        # 3. Xem xong phụ kiện -> 60% khả năng sẽ Thêm vào giỏ hàng
        if random.random() > 0.4:
            activities.append({"user_id": user_id, "product_id": accessory, "action": "add_to_cart", "timestamp": current_time})
            current_time += timedelta(minutes=1)
            
            # 4. Thêm vào giỏ -> 50% khả năng sẽ Thanh toán (Purchase)
            if random.random() > 0.5:
                activities.append({"user_id": user_id, "product_id": accessory, "action": "purchase", "timestamp": current_time})

# Bơm toàn bộ mảng dữ liệu ảo vào MongoDB trong 1 nốt nhạc
collection.insert_many(activities)
print(f"🎉 THÀNH CÔNG! Đã bơm {len(activities)} bản ghi hành vi nối tiếp vào Database.")
print("👉 Việc tiếp theo: Mở Postman hoặc Terminal gọi lệnh POST 'http://localhost:5000/api/ai/retrain' để AI học bài!")