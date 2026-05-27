import pandas as pd
import mysql.connector
import bcrypt
import numpy as np

# 1. CẤU HÌNH KẾT NỐI DATABASE MYSQL CỦA SẾP
db_config = {
    'host': 'localhost',
    'user': 'root',          # Sửa lại user nếu sếp dùng tài khoản khác
    'password': 'Tung_135790',      # Thay mật khẩu MySQL Workbench của sếp vào đây
    'database': 'ecommerce_prediction',
    'port': 3306
}

def clean_and_import_data():
    print("[INFO] Đang nạp tệp dữ liệu gốc 20.000 dòng từ Kaggle...")
    # Đọc dữ liệu từ file CSV
    df = pd.read_csv("data/Electronic_sales_Sep2023-Sep2024.csv")
    
    # Kết nối tới MySQL
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # Tắt kiểm tra khóa ngoại tạm thời để làm sạch dữ liệu cũ
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    cursor.execute("TRUNCATE TABLE reviews;")
    cursor.execute("TRUNCATE TABLE order_items;")
    cursor.execute("TRUNCATE TABLE orders;")
    cursor.execute("TRUNCATE TABLE products;")
    cursor.execute("TRUNCATE TABLE users;")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()
    
    # ----------------=======================================----------------
    # 2. CHUẨN HÓA VÀ NẠP BẢNG USERS
    # ----------------=======================================----------------
    print("[INFO] Đang chuẩn hóa và nạp dữ liệu bảng 'users'...")
    unique_users = df[['Customer ID', 'Age', 'Gender', 'Loyalty Member']].drop_duplicates(subset=['Customer ID'])
    
    # Tạo sẵn một chuỗi Bcrypt Hash cho mật khẩu '123456' để dùng chung (tiết kiệm thời gian chạy vòng lặp)
    hashed_pwd = bcrypt.hashpw(b"123456", bcrypt.gensalt()).decode('utf-8')
    
    sql_user = """
        INSERT INTO users (id, username, full_name, email, password, role, age, gender, location, loyalty_member)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    locations_pool = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Tây Ninh', 'Vũng Tàu', 'Cần Thơ', 'Hải Dương']
    user_batch = []
    
    for _, row in unique_users.iterrows():
        c_id = int(row['Customer ID'])
        username = f"customer_{c_id}"
        gender_vn = "Nữ" if row['Gender'] == "Female" else "Nam"
        loc = locations_pool[c_id % len(locations_pool)]
        
        user_batch.append((
            c_id, username, f"Khách Hàng {c_id}", f"customer{c_id}@gmail.com",
            hashed_pwd, "USER", int(row['Age']), gender_vn, loc, row['Loyalty Member']
        ))
    
    cursor.executemany(sql_user, user_batch)
    conn.commit()
    print(f"[SUCCESS] Đã nạp thành công {len(user_batch)} tài khoản người dùng xịn vào MySQL.")

    # ----------------=======================================----------------
    # 3. CHUẨN HÓA VÀ NẠP BẢNG PRODUCTS (DANH MỤC THỰC TẾ)
    # ----------------=======================================----------------
    print("[INFO] Đang ánh xạ danh mục sản phẩm công nghệ...")
    unique_skus = df[['SKU', 'Product Type', 'Unit Price']].drop_duplicates(subset=['SKU'])
    
    # Định nghĩa Bản đồ sản phẩm tiếng Việt cho các SKU có sẵn trong file
    sku_name_mapping = {
        'SKU1001': ('iPhone 15 Pro Max 256GB', 4, 'Apple', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png'),
        'SKU1002': ('iPad Air 6 M2 11 inch', 3, 'Samsung', 'https://cdn2.cellphones.com.vn/images/product/tablet/ipad-air-6.png'), # Map thương hiệu tương đối theo tệp
        'SKU1003': ('Sony WH-1000XM5 Premium', 2, 'Sony', 'https://cdn2.cellphones.com.vn/images/product/accessories/sony-wh-1000xm5.png'),
        'SKU1004': ('MacBook Air 13 inch M3', 1, 'HP', 'https://cdn2.cellphones.com.vn/images/product/laptop/macbook-air-m3.png'),
        'SKU1005': ('Asus ROG Strix G16 Gaming', 1, 'Other Brands', 'https://cdn2.cellphones.com.vn/images/product/laptop/asus-rog.png'),
        'HDP456': ('Tai nghe Bluetooth Marshall Major IV', 2, 'Other Brands', 'https://cdn2.cellphones.com.vn/images/product/accessories/marshall-major-4.png'),
        'LTP123': ('Laptop HP Pavilion 14 X360', 1, 'HP', 'https://cdn2.cellphones.com.vn/images/product/laptop/hp-pavilion.png'),
        'SMP234': ('Samsung Galaxy S24 Ultra 5G', 4, 'Samsung', 'https://cdn2.cellphones.com.vn/images/product/mobile/samsung-s24.png'),
        'SWT567': ('Apple Watch Series 9 45mm LTE', 5, 'Other Brands', 'https://cdn2.cellphones.com.vn/images/product/watch/apple-watch-9.png'),
        'TBL345': ('Xiaomi Pad 6 Quốc Tế', 3, 'Other Brands', 'https://cdn2.cellphones.com.vn/images/product/tablet/xiaomi-pad-6.png')
    }
    
    sql_prod = """
        INSERT INTO products (sku, name, category_id, price, brand, image_url)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    prod_batch = []
    sku_to_db_id = {} # Lưu vết để map bảng order_items phía sau
    current_p_id = 1
    
    for _, row in unique_skus.iterrows():
        sku_code = str(row['SKU'])
        price_val = float(row['Unit Price'])
        
        if sku_code in sku_name_mapping:
            p_name, cat_id, brand, img = sku_name_mapping[sku_code]
        else:
            p_name = f"Thiết bị Công nghệ {sku_code}"
            cat_id = 4 # mặc định là smartphone
            brand = "Other Brands"
            img = "https://cellphones.com.vn/media/catalog/product/default.png"
            
        prod_batch.append((sku_code, p_name, cat_id, price_val, brand, img))
        sku_to_db_id[sku_code] = current_p_id
        current_p_id += 1
        
    cursor.executemany(sql_prod, prod_batch)
    conn.commit()
    print(f"[SUCCESS] Đã tạo danh mục sản phẩm công nghệ ({len(prod_batch)} dòng sản phẩm).")

    # ----------------=======================================----------------
    # 4. NẠP HÓA ĐƠN ĐỘNG (ORDERS, ORDER_ITEMS, REVIEWS)
    # ----------------=======================================----------------
    print("[INFO] Đang thiết lập luồng hóa đơn giao dịch lớn (20.000 dòng)...")
    
    sql_order = """
        INSERT INTO orders (id, user_id, total_amount, status, payment_method, shipping_type, order_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    sql_item = """
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, addons_purchased, addon_total)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    sql_review = """
        INSERT INTO reviews (user_id, product_id, rating, comment)
        VALUES (%s, %s, %s, %s)
    """
    
    order_batch = []
    item_batch = []
    review_batch = []
    
    # Sử dụng index chạy từ 1 làm mã hóa đơn (Order ID) tự tăng
    for idx, row in df.iterrows():
        o_id = idx + 1
        u_id = int(row['Customer ID'])
        sku_code = str(row['SKU'])
        p_id = sku_to_db_id.get(sku_code, 1)
        
        # Đồng bộ trạng thái hóa đơn tiếng Việt
        status_vn = "HỦY ĐƠN" if row['Order Status'] == "Cancelled" else "ĐÃ THANH TOÁN"
        
        # Đưa vào danh sách nạp bảng orders
        order_batch.append((
            o_id, u_id, float(row['Total Price']), status_vn,
            str(row['Payment Method']), str(row['Shipping Type']), str(row['Purchase Date'])
        ))
        
        # Đưa vào danh sách nạp bảng chi tiết order_items
        addons = str(row['Add-ons Purchased']) if pd.notna(row['Add-ons Purchased']) else "None"
        item_batch.append((
            o_id, p_id, int(row['Quantity']), float(row['Unit Price']), addons, float(row['Add-on Total'])
        ))
        
        # Chỉ sinh log review cho những đơn hàng đã hoàn thành thực tế để logic chặt chẽ
        if row['Order Status'] == "Completed":
            comment_text = f"Sản phẩm dùng rất tốt, đánh giá {row['Rating']} sao cho cửa hàng!"
            review_batch.append((u_id, p_id, int(row['Rating']), comment_text))
            
    # Tiến hành bơm dữ liệu lớn theo lô (Batches) để tối ưu tốc độ RAM
    cursor.executemany(sql_order, order_batch)
    cursor.executemany(sql_item, item_batch)
    cursor.executemany(sql_review, review_batch)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("---------------------------------------------------------")
    print(f"[FINISH] QUY TRÌNH PIPELINE HOÀN TẤT MỸ MÃN!")
    print(f"- Tổng số hóa đơn nạp vào bảng 'orders': {len(order_batch)} đơn.")
    print(f"- Tổng số chi tiết nạp vào bảng 'order_items': {len(item_batch)} bản ghi.")
    print(f"- Tổng số đánh giá nạp vào bảng 'reviews': {len(review_batch)} tương tác thực.")

if __name__ == "__main__":
    clean_and_import_data()