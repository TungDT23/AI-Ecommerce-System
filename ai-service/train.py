import pandas as pd
import numpy as np
import joblib
import os

def train_markov_model():
    print("[INFO] Đang nạp tệp dữ liệu 20.000 dòng để huấn luyện AI...")
    
    # 1. Đọc file dữ liệu gốc (Sửa đường dẫn nếu sếp để trong thư mục data/)
    file_path = "data/Electronic_sales_Sep2023-Sep2024.csv"
    if not os.path.exists(file_path):
        file_path = "Electronic_sales_Sep2023-Sep2024.csv"
        
    df = pd.read_csv(file_path)
    
    # 2. Chuẩn hóa thời gian và sắp xếp theo chuỗi hành vi của từng khách hàng
    df['Purchase Date'] = pd.to_datetime(df['Purchase Date'])
    df = df.sort_values(by=['Customer ID', 'Purchase Date']).reset_index(drop=True)
    
    # 3. Ánh xạ danh mục sản phẩm từ chữ sang ID số khớp 100% với MySQL vừa nạp
    # (1: Laptop, 2: Headphones, 3: Tablet, 4: Smartphone, 5: Smartwatch)
    cat_mapping = {
        'Laptop': 1,
        'Headphones': 2,
        'Tablet': 3,
        'Smartphone': 4,
        'Smartwatch': 5
    }
    df['category_id'] = df['Product Type'].map(cat_mapping)
    
    print("[INFO] Đang xây dựng Ma trận xác suất dịch chuyển trạng thái Markov...")
    
    # Lấy danh sách các danh mục hợp lệ (từ 1 đến 5)
    states = [1, 2, 3, 4, 5]
    n_states = len(states)
    
    # Khởi tạo ma trận đếm số lần dịch chuyển chuyển trạng thái (ví dụ: đang ở 4 mua tiếp sang 2)
    transition_counts = np.zeros((n_states + 1, n_states + 1)) # Dùng n_states+1 để khớp trực tiếp với ID từ 1-5
    
    # Quét qua lịch sử mua hàng tuần tự của từng User để đếm lượt dịch chuyển
    grouped = df.groupby('Customer ID')
    for customer_id, group in grouped:
        if len(group) > 1:
            categories = group['category_id'].tolist()
            for i in range(len(categories) - 1):
                current_state = categories[i]
                next_state = categories[i+1]
                transition_counts[current_state][next_state] += 1
                
    # Chuyển đổi ma trận đếm thành Ma trận xác suất (Tổng mỗi hàng bằng 1)
    transition_matrix = np.zeros((n_states + 1, n_states + 1))
    for r in states:
        row_sum = np.sum(transition_counts[r])
        if row_sum > 0:
            transition_matrix[r] = transition_counts[r] / row_sum
        else:
            # Nếu một danh mục chưa có chuỗi dịch chuyển, đặt xác suất đều nhau
            transition_matrix[r] = 0.2
            
    # 4. Đóng gói ma trận xác suất Markov vào file model (.pkl)
    os.makedirs("models", exist_ok=True)
    model_data = {
        "states": states,
        "transition_matrix": transition_matrix.tolist(),
        "cat_mapping": cat_mapping
    }
    
    joblib.dump(model_data, "models/hybrid_markov_model.pkl")
    print("---------------------------------------------------------")
    print("[SUCCESS] BỘ NÃO AI ĐÃ HỌC XONG 20.000 DÒNG HÀNH VI QUAN HỆ MARKOV!")
    print("[SUCCESS] Đã đóng gói thành công file: models/hybrid_markov_model.pkl")

if __name__ == "__main__":
    train_markov_model()