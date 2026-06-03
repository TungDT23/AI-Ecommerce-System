import requests

payload = {
    "userId": 9003,
    "lastPurchasedCategoryId": 4
}
res = requests.post("http://localhost:8000/ai/predict", json=payload)
print(res.status_code, res.text)
