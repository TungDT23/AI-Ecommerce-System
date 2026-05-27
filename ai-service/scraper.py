import requests
import csv
import os

# Ví dụ: ID sản phẩm iPhone 15 Pro Max trên Thế giới di động là 311058
PRODUCT_ID = 363398 

def scrape_tgdd_reviews(product_id, max_pages=10):
    os.makedirs("data_raw", exist_ok=True)
    file_path = f"data_raw/tgdd_reviews_{product_id}.csv"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    with open(file_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["username", "comment_time", "rating_star", "model_name"])
        
        collected = 0
        for page in range(1, max_pages + 1):
            # API công khai, không bảo mật phức tạp của TGDD
            api_url = f"https://www.thegioididong.com/api/Product/GetCommentIsOrder?productId={product_id}&pageIndex={page}&pageSize=20&score=0"
            
            try:
                response = requests.get(api_url, headers=headers).json()
                comments = response.get("results", [])
                
                if not comments:
                    print(f"[INFO] Đã hết dữ liệu ở trang {page}. Dừng cào.")
                    break
                    
                for c in comments:
                    username = c.get("Fullname", "Khách hàng")
                    # Lấy ngày mua (định dạng dạng chuỗi: "2025-10-15T...")
                    comment_time = c.get("CreatedDateString", "")
                    rating_star = c.get("Rating", 5)
                    
                    # Lấy thông tin phiên bản người ta mua (Ví dụ: Titan Tự Nhiên)
                    model_name = c.get("ProductName", "Mặc định")
                    
                    writer.writerow([username, comment_time, rating_star, model_name])
                    collected += 1
                    
                print(f"[SUCCESS] Đã cào xong trang {page}, tổng cộng thu thập được {collected} review thật...")
            except Exception as e:
                print(f"[ERROR] Lỗi khi cào trang {page}: {e}")
                break
                
    print(f"[FINISH] Đã xuất file thành công: {file_path}")

if __name__ == "__main__":
    scrape_tgdd_reviews(PRODUCT_ID)