import pandas as pd
from pymongo import MongoClient

print("Đang tải dữ liệu từ MongoDB để kiểm thử...")
client = MongoClient("mongodb://localhost:27017/")
db = client["ecommerce_behavior"]
collection = db["user_activities"]

data = list(collection.find({}, {"_id": 1, "user_id": 1, "product_id": 1}).sort("_id", 1))
df = pd.DataFrame(data)

if df.empty:
    print("⚠️ Dữ liệu trống!")
    exit()

# ==========================================
# BƯỚC "ĂN TIỀN": GỘP CÁC HÀNH VI LẶP LẠI (LỌC NHIỄU)
# Tránh việc bắt AI đi dự đoán [Mua Sản phẩm A] nối tiếp [Xem Sản phẩm A]
# ==========================================
df['prev_product_id'] = df.groupby('user_id')['product_id'].shift(1)
df_cleaned = df[df['product_id'] != df['prev_product_id']].copy()
df_cleaned.drop(columns=['prev_product_id'], inplace=True)

# ==========================================
# 1. TÁCH TẬP TRAIN VÀ TẬP TEST
# ==========================================
print("Đang chia tập dữ liệu (Train/Test Split)...")
train_data = []
test_data = []

grouped = df_cleaned.groupby('user_id')
for user_id, group in grouped:
    # Sau khi lọc nhiễu, user nào còn >= 2 chặng mua sắm mới đủ điều kiện Test
    if len(group) >= 2:
        user_actions = group.to_dict('records')
        test_data.append(user_actions[-1])         
        train_data.extend(user_actions[:-1])       

train_df = pd.DataFrame(train_data)
test_df = pd.DataFrame(test_data)

print(f"Tổng số dữ liệu Train: {len(train_df)} bản ghi")
print(f"Tổng số dữ liệu Test: {len(test_df)} bản ghi (Tương ứng {len(test_df)} User)")

# ==========================================
# 2. XÂY DỰNG MÔ HÌNH TRÊN TẬP TRAIN
# ==========================================
print("\nĐang huấn luyện mô hình Markov Chain trên tập Train...")
train_df['next_product'] = train_df.groupby('user_id')['product_id'].shift(-1)
transitions = train_df.dropna()
# Không cần lệnh lọc != nữa vì đã xử lý sạch ở trên

transition_matrix = {}
if not transitions.empty:
    counts = transitions.groupby(['product_id', 'next_product']).size().reset_index(name='count')
    for current_item, group in counts.groupby('product_id'):
        total = group['count'].sum()
        next_items = {int(row['next_product']): row['count']/total for _, row in group.iterrows()}
        transition_matrix[int(current_item)] = dict(sorted(next_items.items(), key=lambda x: x[1], reverse=True))

# ==========================================
# 3. ĐÁNH GIÁ TRÊN TẬP TEST
# ==========================================
print("\nĐang tiến hành làm bài thi (Testing)...")
hits = 0
total_tests = len(test_df)

for _, test_row in test_df.iterrows():
    user = test_row['user_id']
    actual_next_item = test_row['product_id'] 
    
    user_train_history = train_df[train_df['user_id'] == user]
    if not user_train_history.empty:
        last_seen_item = int(user_train_history.iloc[-1]['product_id'])
        
        predictions = []
        if last_seen_item in transition_matrix:
            predictions = list(transition_matrix[last_seen_item].keys())[:4]
            
        if actual_next_item in predictions:
            hits += 1

# ==========================================
# 4. IN KẾT QUẢ CUỐI CÙNG
# ==========================================
hit_rate = (hits / total_tests) * 100 if total_tests > 0 else 0
print("\n=========================================")
print(f"🎯 KẾT QUẢ ĐÁNH GIÁ MÔ HÌNH (HIT RATE @ 4)")
print("=========================================")
print(f"- Phương pháp kiểm thử: Leave-One-Out (Đã lọc nhiễu)")
print(f"- Tổng số bài test (Users): {total_tests}")
print(f"- Số lần AI đoán trúng:     {hits}")
print(f"- Độ chính xác (Hit Rate):  {hit_rate:.2f}%")
print("=========================================")