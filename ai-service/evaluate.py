import os
import pandas as pd
import joblib

def evaluate_hybrid_model():
    # ĐỌC TRÊN TẬP TEST ĐỘC LẬP THAY VÌ TẬP DATA GỐC
    dataset_path = "data/test_ecommerce_data.csv"
    model_path = "models/hybrid_markov_model.pkl"

    if not os.path.exists(dataset_path) or not os.path.exists(model_path):
        print("[ERROR] Thiếu file data test hoặc file model pkl. Hãy chạy train.py trước!")
        return

    df = pd.read_csv(dataset_path)
    artifacts = joblib.load(model_path)
    markov_matrix = artifacts["markov_matrix"]
    brand_profile = artifacts["brand_profile"]
    segment_profile = artifacts["segment_profile"]
    global_popular = artifacts.get("global_popular", [])

    hits = 0
    total_records = len(df)

    for _, row in df.iterrows():
        cat_state = int(row['last_purchased_category_id'])
        brand_state = str(row['favourite_brand'])
        segment_state = str(row['price_segment'])
        actual_target = int(row['target_next_product_id'])

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
        
        # Tiên đoán sản phẩm có xác suất cao nhất
        predicted = sorted_scores[0][0] if sorted_scores else (global_popular[0] if global_popular else -1)
        
        if predicted == actual_target:
            hits += 1

    hit_rate = (hits / total_records) * 100 if total_records > 0 else 0
    print("\n================ THẨM ĐỊNH HIỆU NĂNG TOÁN HỌC MARKOV LAI ================")
    print(f"Tổng số bản ghi TẬP THỬ NGHIỆM ĐỘC LẬP (Unseen Data): {total_records}")
    print(f"Số lần thuật toán đoán MÙ chính xác sản phẩm mua tiếp theo: {hits}")
    print(f"Chỉ số Hit Rate thực tế (Real-world accuracy) đạt được: {hit_rate:.2f}%")
    print("==========================================================================")

if __name__ == "__main__":
    evaluate_hybrid_model()
