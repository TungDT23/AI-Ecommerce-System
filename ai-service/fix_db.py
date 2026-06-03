import mysql.connector

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Tung_135790',
    'database': 'ecommerce_prediction',
    'port': 3306
}

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()
cursor.execute("ALTER TABLE orders MODIFY total_amount DECIMAL(15,2);")
cursor.execute("ALTER TABLE order_items MODIFY price_at_purchase DECIMAL(15,2);")
cursor.execute("ALTER TABLE order_items MODIFY addon_total DECIMAL(15,2);")
cursor.execute("ALTER TABLE products MODIFY price DECIMAL(15,2);")
conn.commit()
cursor.close()
conn.close()
print("Success")
