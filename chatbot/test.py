import httpx
import json

payload = {
    "messages": [
        {"role": "user", "content": "واش راك؟ عندي مشكل في البطاطا"}
    ],
    "language_hint": "ar",
    "api_key": "YOUR_API_KEY"
}

r = httpx.post("http://localhost:9000/chat", json=payload, timeout=10)
print(json.dumps(r.json(), ensure_ascii=False, indent=2))
