import os
import pandas as pd
import numpy as np
import joblib

def build_advanced_hybrid_model():
    dataset_path = "data/ecommerce_ai_dataset.csv"
    
    if not os.path.exists(dataset_path):
        print(f"[ERROR] Không tìm thấy file dữ liệu tại {dataset_path}! Hãy kiểm tra lại.")
        return

    # Đọc dataset
    df = pd.read_csv(dataset_path)
    print(f"[SUCCESS] Đã nạp thành công {len(df)} dòng dữ liệu từ file CSV.")

    # =================================================================
    # TẦNG 1: MA TRẬN CHUỖI XÍCH MARKOV BẬC 1 (Transition Matrix)
    # =================================================================
    # Đóng khung 6 danh mục (1-6) và 30 sản phẩm gốc từ MySQL
    categories = list(range(1, 7))
    products = list(range(1, 31))
    
    # Khởi tạo ma trận xác suất trống
    markov_matrix = {int(cat): {int(prod): 0.0 for prod in products} for cat in categories}
    cat_totals = {int(cat): 0 for cat in categories}

    for _, row in df.iterrows():
        cat = int(row['last_purchased_category_id'])
        target_prod = int(row['target_next_product_id'])
        
        if cat in markov_matrix and target_prod in markov_matrix[cat]:
            markov_matrix[cat][target_prod] += 1
            cat_totals[cat] += 1

    # Chuẩn hóa tần suất thô sang xác suất toán học thuộc khoảng [0, 1]
    for cat in markov_matrix:
        total = cat_totals[cat]
        for prod in markov_matrix[cat]:
            if total > 0:
                markov_matrix[cat][prod] = markov_matrix[cat][prod] / total
            else:
                # Nếu một danh mục chưa có lịch sử dịch chuyển, chia đều xác suất ngẫu nhiên
                markov_matrix[cat][prod] = 1.0 / len(products)

    # =================================================================
    # TẦNG 2: BỘ LỌC HEURISTIC PROFILE (Thương hiệu & Phân khúc chi tiêu)
    # =================================================================
    # Gom cụm các sản phẩm mục tiêu xuất hiện theo gu của người dùng
    brand_profile = df.groupby('favourite_brand')['target_next_product_id'].apply(lambda x: list(set(x))).to_dict()
    segment_profile = df.groupby('price_segment')['target_next_product_id'].apply(lambda x: list(set(x))).to_dict()
    global_popular = df['target_next_product_id'].value_counts().index.tolist()

    # Đóng gói mô hình lai và xuất file vật lý .pkl vào folder models/
    os.makedirs("models", exist_ok=True)
    model_artifacts = {
        "markov_matrix": markov_matrix,
        "brand_profile": brand_profile,
        "segment_profile": segment_profile,
        "global_popular": global_popular
    }

    joblib.dump(model_artifacts, "models/hybrid_markov_model.pkl")
    print("[SUCCESS] Đã tạo và đóng gói mô hình 'models/hybrid_markov_model.pkl'!")

if __name__ == "__main__":
    build_advanced_hybrid_model()