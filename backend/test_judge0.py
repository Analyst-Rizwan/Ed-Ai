import httpx
import base64

API_KEY = "b70156edd3mshcb4aebae990f1624fp1f7570jsn959807739cc8"
HOST = "judge0-ce.p.rapidapi.com"

headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": API_KEY,
    "X-RapidAPI-Host": HOST,
}

src = 'print("hello")'
payload = {
    "source_code": base64.b64encode(src.encode()).decode(),
    "language_id": 71,
    "stdin": base64.b64encode(b"").decode(),
    "base64_encoded": True,
}

try:
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"https://{HOST}/submissions",
            json=payload,
            headers=headers,
            params={"wait": "true", "base64_encoded": "true", "fields": "*"},
        )
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            stdout_b64 = data.get("stdout", "")
            if stdout_b64:
                print(f"Output: {base64.b64decode(stdout_b64).decode()}")
            print(f"Status desc: {data.get('status', {}).get('description')}")
            print(f"Time: {data.get('time')}s, Memory: {data.get('memory')} KB")
        else:
            print(f"Error: {resp.text[:500]}")
except Exception as e:
    print(f"Connection Error: {e}")
