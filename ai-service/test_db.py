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
cursor.execute("SELECT id, name, price FROM products LIMIT 5;")
for row in cursor.fetchall():
    print(row)
cursor.close()
conn.close()
