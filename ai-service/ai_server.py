import os
import pandas as pd
from pymongo import MongoClient
from flask import Flask, jsonify
import threading

app = Flask(__name__)

# --- BỘ NHỚ RAM CỦA AI ---
transition_matrix = {}   # Ma trận xác suất Markov
popular_items = []       # Top đồ bán chạy (Dành cho người mới - Cold Start)
user_latest_item = {}    # Lưu vết món đồ cuối cùng mỗi user vừa xem

def train_markov_model():
    """Hàm huấn luyện mô hình dự đoán theo trình tự thời gian"""
    global transition_matrix, popular_items, user_latest_item
    print("🔄 Bắt đầu huấn luyện mô hình Next Purchase (Markov Chain)...")
    
    # 1. Kết nối MongoDB
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(mongo_uri)
    db = client["ecommerce_behavior"]
    collection = db["user_activities"]

    # 2. LẤY DỮ LIỆU THEO DÒNG THỜI GIAN
    # Mẹo: Sắp xếp theo _id tăng dần chính là sắp xếp theo thời gian tạo trong MongoDB
    data = list(collection.find({}, {"_id": 1, "user_id": 1, "product_id": 1}).sort("_id", 1))
    df = pd.DataFrame(data)

    if df.empty:
        print("⚠️ Database trống. AI đang trong trạng thái chờ...")
        return

    # Lưu lại món đồ cuối cùng mà từng User đã tương tác để làm "điểm neo" dự đoán
    user_latest_item = df.groupby('user_id').last()['product_id'].to_dict()

    # Tính các món phổ biến nhất đề phòng khách hàng mới tinh (Cold Start)
    popular_items = df['product_id'].value_counts().head(4).index.tolist()

    # 3. TẠO CÁC CẶP HÀNH VI NỐI TIẾP (A -> B)
    # Lấy món đồ tiếp theo (shift -1) của CHÍNH user đó
    df['next_product_id'] = df.groupby('user_id')['product_id'].shift(-1)

    # Loại bỏ các dòng cuối cùng của mỗi user (vì không có món tiếp theo)
    # Loại bỏ các hành vi spam (Click liên tục vào cùng 1 món A -> A)
    transitions = df.dropna()
    transitions = transitions[transitions['product_id'] != transitions['next_product_id']]

    if transitions.empty:
        print("⚠️ Chưa có chuỗi hành vi nối tiếp nào. Cần khách hàng thao tác thêm.")
        return

    # 4. TÍNH TOÁN MA TRẬN XÁC SUẤT (MARKOV TRANSITION MATRIX)
    transition_counts = transitions.groupby(['product_id', 'next_product_id']).size().reset_index(name='count')
    
    new_matrix = {}
    for current_item, group in transition_counts.groupby('product_id'):
        total_transitions = group['count'].sum()
        next_items = {}
        
        for _, row in group.iterrows():
            # Công thức xác suất P(B|A)
            prob = row['count'] / total_transitions
            next_items[int(row['next_product_id'])] = round(prob, 2)
            
        # Sắp xếp các món có xác suất mua tiếp theo cao nhất lên đầu
        sorted_next = dict(sorted(next_items.items(), key=lambda item: item[1], reverse=True))
        new_matrix[int(current_item)] = sorted_next

    transition_matrix = new_matrix
    print("✅ Đã huấn luyện xong! Sẵn sàng dự đoán Next Purchase.")

def get_recommendations(user_id, top_n=4):
    """Lấy dự đoán Next Purchase cho một User cụ thể"""
    global transition_matrix, popular_items, user_latest_item

    # 1. Tìm món đồ VỪA XONG mà user này tương tác
    last_item = user_latest_item.get(user_id)

    recommendations = []
    
    # 2. Suy luận: Nếu vừa xem món A -> Nhìn vào ma trận xem món B, C nào có xác suất nối tiếp cao nhất
    if last_item and last_item in transition_matrix:
        next_items_dict = transition_matrix[last_item]
        for item_id, prob in list(next_items_dict.items())[:top_n]:
            recommendations.append({"productId": item_id, "confidenceScore": prob})

    # 3. LUẬT COLD START (Dự phòng)
    # Nếu User này mới toanh, hoặc chưa gom đủ số lượng gợi ý -> Bù thêm đồ Hot Trend
    if len(recommendations) < top_n:
        current_rec_ids = [r['productId'] for r in recommendations]
        for pop_item in popular_items:
            if pop_item not in current_rec_ids and pop_item != last_item:
                recommendations.append({"productId": int(pop_item), "confidenceScore": 0.01})
            if len(recommendations) >= top_n:
                break

    return recommendations

# --- CÁC ENDPOINT API ---

@app.route('/api/ai/recommend/<int:user_id>', methods=['GET'])
def recommend_for_user(user_id):
    try:
        result = get_recommendations(user_id)
        return jsonify({"recommendations": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/retrain', methods=['POST'])
def retrain_endpoint():
    # Đẩy tác vụ huấn luyện vào một luồng ngầm (Background Thread) để không làm treo API
    thread = threading.Thread(target=train_markov_model)
    thread.start()
    return jsonify({"message": "Đang tiến hành huấn luyện lại mô hình ngầm với Data mới nhất..."}), 200

if __name__ == '__main__':
    print("🚀 Đang khởi động hệ thống AI Server...")
    # Huấn luyện lần đầu tiên khi bật Server
    train_markov_model() 
    # use_reloader=False để tránh việc Flask chạy code 2 lần khi bật chế độ debug
    app.run(port=5000, debug=True, use_reloader=False)