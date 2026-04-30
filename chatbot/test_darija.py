import httpx, json, sys

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

API_KEY = "YOUR_API_KEY"

tests = [
    {
        "name": "TEST 1: Darija (Arabic script) — should reply in Algerian Darija",
        "payload": {
            "messages": [{"role": "user", "content": "واش راك؟ عندي مشكل في البطاطا، الأوراق ولات صفراء"}],
            "language_hint": "ar",
            "api_key": API_KEY,
        },
    },
    {
        "name": "TEST 2: French — should reply ONLY in French",
        "payload": {
            "messages": [{"role": "user", "content": "Comment traiter le mildiou sur les tomates?"}],
            "language_hint": "fr",
            "api_key": API_KEY,
        },
    },
    {
        "name": "TEST 3: English — should reply ONLY in English",
        "payload": {
            "messages": [{"role": "user", "content": "How do I improve soil quality for wheat in Biskra?"}],
            "language_hint": "en",
            "api_key": API_KEY,
        },
    },
]

for t in tests:
    print(f"\n{'='*60}")
    print(t["name"])
    print('='*60)
    r = httpx.post("http://localhost:9000/chat", json=t["payload"], timeout=15)
    data = r.json()
    print(data.get("reply", data))
    print()
