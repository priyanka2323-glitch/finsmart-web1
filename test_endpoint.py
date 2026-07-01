import requests
import json

token = "test_token"  # Replace with valid token
headers = {"Authorization": f"Bearer {token}"}

try:
    resp = requests.get("http://localhost:8000/reports/anomalies/", headers=headers, timeout=5)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
