import pandas as pd
import mysql.connector
import bcrypt
import numpy as np
import sys
import io

# Đảm bảo in Tiếng Việt không bị lỗi font trên Windows
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


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
        # Bỏ qua các ID trùng lặp với tài khoản đặc trưng của sếp
        if c_id in [999, 9001, 9002, 9003]:
            continue
            
        username = f"customer_{c_id}"
        gender_vn = "Nữ" if row['Gender'] == "Female" else "Nam"
        loc = locations_pool[c_id % len(locations_pool)]
        
        user_batch.append((
            c_id, username, f"Khách Hàng {c_id}", f"customer{c_id}@gmail.com",
            hashed_pwd, "USER", int(row['Age']), gender_vn, loc, row['Loyalty Member']
        ))
    
    # BỔ SUNG: 4 tài khoản đặc trưng của sếp
    custom_users = [
        (999, 'adminvip', 'Đặng Thanh Tùng (Admin)', 'tungdang.admin@cellphones.com.vn', hashed_pwd, 'ADMIN', 22, 'Nam', 'Hà Nội', 'No'),
        (9001, 'hoang_khuat', 'Khuất Mạnh Hoàng', 'hoangkm@gmail.com', hashed_pwd, 'USER', 23, 'Nam', 'Hà Nội', 'Yes'),
        (9002, 'linh_tran', 'Trần Tuấn Linh', 'linhtt@gmail.com', hashed_pwd, 'USER', 24, 'Nam', 'TP. Hồ Chí Minh', 'No'),
        (9003, 'long_trinh', 'Trịnh Huy Long', 'longth@gmail.com', hashed_pwd, 'USER', 22, 'Nam', 'Đà Nẵng', 'Yes')
    ]
    user_batch.extend(custom_users)
    
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
        'SKU1002': ('iPad Air 6 M2 11 inch', 3, 'Apple', 'https://i5.walmartimages.com/seo/2024-Apple-11-inch-iPad-Air-M2-Wi-Fi-128GB-Blue_1512612b-3f81-4661-9b5a-b6e30501ff99.2caff370b34b2a95cde52509e02f68b9.jpeg'), # Map thương hiệu tương đối theo tệp
        'SKU1003': ('Sony WH-1000XM5 Premium', 2, 'Sony', 'https://i5.walmartimages.com/seo/Sony-WH-1000XM5-The-Best-Wireless-Noise-Canceling-Headphones-Black_7384c879-1d54-47e8-9876-1d7adadcf0a5.542c245c25d295b30fa5820eacea4450.jpeg'),
        'SKU1004': ('MacBook Air 13 inch M3', 1, 'Apple', 'https://dam.which.co.uk/IC19565-0716-00-front-800x600.jpg'),
        'SKU1005': ('Asus ROG Strix G16 Gaming', 1, 'Other Brands', 'https://www.bluelynxonline.com/30915-thickbox_default/asus-rog-strix-g16-gaming-laptop.jpg'),
        'HDP456': ('Tai nghe Bluetooth Marshall Major IV', 2, 'Other Brands', 'https://tainghe.com.vn/media/product/3560_marshall_major_iv_4_black_chinh_hang_1_1.jpg'),
        'LTP123': ('Laptop HP Pavilion 14 X360', 1, 'HP', 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6428/6428661_rd.jpg'),
        'SMP234': ('Samsung Galaxy S24 Ultra 5G', 4, 'Samsung', 'https://www.phonebot.com.au/image/cache/catalog/refurbished/samsung/galaxy-s24-ultra/samsung-galaxy-s24-ultra-titanium-black-800x800.jpg'),
        'SWT567': ('Apple Watch Series 9 45mm LTE', 5, 'Apple', 'https://cdn.dienthoaigiakho.vn/photos/1694674137075-AW-S9-SS-LTE-Go2.jpg'),
        'TBL345': ('Xiaomi Pad 6 Quốc Tế', 3, 'Other Brands', 'https://chiasetech.com/wp-content/uploads/2023/06/xiaomi-pad-6-2.jpg')
    }
    
    sql_prod = """
        INSERT INTO products (sku, name, category_id, price, brand, image_url)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    prod_batch = []
    sku_to_db_id = {} # Lưu vết để map bảng order_items phía sau
    current_p_id = 1
    
    real_prices = {
        'SKU1004': 23990000.0,
        'SKU1002': 14490000.0,
        'SKU1005': 29490000.0,
        'SKU1001': 24990000.0,
        'SKU1003': 6490000.0,
        'LTP123': 19190000.0,
        'SMP234': 25290000.0,
        'TBL345': 8600000.0,
        'HDP456': 2890000.0,
        'SWT567': 6490000.0
    }
    
    for _, row in unique_skus.iterrows():
        sku_code = str(row['SKU'])
        if sku_code in real_prices:
            price_val = real_prices[sku_code]
        else:
            # Nhân với tỷ giá 25000 để chuyển đổi từ USD sang VND cho hợp lý
            price_val = float(row['Unit Price']) * 25000
        
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
        
        # Chuyển đổi Total Price sang VND
        total_price_vnd = float(row['Total Price']) * 25000
        
        # Đưa vào danh sách nạp bảng orders
        order_batch.append((
            o_id, u_id, total_price_vnd, status_vn,
            str(row['Payment Method']), str(row['Shipping Type']), str(row['Purchase Date'])
        ))
        
        # Đưa vào danh sách nạp bảng chi tiết order_items
        addons = str(row['Add-ons Purchased']) if pd.notna(row['Add-ons Purchased']) else "None"
        unit_price_vnd = float(row['Unit Price']) * 25000
        addon_total_vnd = float(row['Add-on Total']) * 25000
        item_batch.append((
            o_id, p_id, int(row['Quantity']), unit_price_vnd, addons, addon_total_vnd
        ))
        
        # Chỉ sinh log review cho những đơn hàng đã hoàn thành thực tế để logic chặt chẽ
        if row['Order Status'] == "Completed":
            comment_text = f"Sản phẩm dùng rất tốt, đánh giá {row['Rating']} sao cho cửa hàng!"
            review_batch.append((u_id, p_id, int(row['Rating']), comment_text))
            
    # BỔ SUNG: 3 hóa đơn đặc trưng của sếp
    custom_orders = [
        (91001, 9001, 24990000.00, 'ĐÃ THANH TOÁN', 'Credit Card', 'Standard', '2026-05-20 10:30:00'),
        (91002, 9002, 23990000.00, 'ĐÃ THANH TOÁN', 'VNPay Wallet', 'Express', '2026-05-22 14:15:00'),
        (91003, 9003, 6490000.00, 'ĐÃ THANH TOÁN', 'Cash', 'Standard', '2026-05-25 09:00:00')
    ]
    order_batch.extend(custom_orders)

    # Lấy thông tin giá và ID của sản phẩm để map chính xác order_items
    sku_prices = {}
    for _, row in unique_skus.iterrows():
        sc = str(row['SKU'])
        sku_prices[sc] = real_prices.get(sc, float(row['Unit Price']) * 25000)
        
    p_id_1001 = sku_to_db_id.get('SKU1001', 1)
    p_id_1004 = sku_to_db_id.get('SKU1004', 1)
    p_id_567 = sku_to_db_id.get('SWT567', 1)
    
    price_1001 = sku_prices.get('SKU1001', 24990000.00)
    price_1004 = sku_prices.get('SKU1004', 23990000.00)
    price_567 = sku_prices.get('SWT567', 6490000.00)
    
    custom_items = [
        (91001, p_id_1001, 1, price_1001, 'None', 0.00),
        (91002, p_id_1004, 1, price_1004, 'None', 0.00),
        (91003, p_id_567, 1, price_567, 'None', 0.00)
    ]
    item_batch.extend(custom_items)
            
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