from flask import Flask, jsonify
from recommendation_model import get_recommendations

app = Flask(__name__)

# Đã sửa lại đường dẫn URL cho khớp 100% với file Java
@app.route('/api/ai/recommend/<int:user_id>', methods=['GET'])
def recommend_for_user(user_id):
    try:
        # Gọi mô hình AI tính toán
        result = get_recommendations(target_user_id=user_id)
        
        # Bọc kết quả vào trong key "recommendations" để Java đọc được bằng Map
        return jsonify({
            "recommendations": result
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 AI Service đang chạy tại cổng 5000...")
    app.run(port=5000, debug=True)