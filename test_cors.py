import urllib.request
import urllib.error

url = 'https://ed-ai-backend.onrender.com/api/roadmaps/generate'
headers = {
    'Origin': 'https://eduaiajk.in',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'authorization,content-type'
}

req = urllib.request.Request(url, headers=headers, method='OPTIONS')
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Headers-----------")
        print(response.headers)
except urllib.error.HTTPError as e:
    print("HTTPError Status:", e.code)
    print("HTTPError Headers:", e.headers)
    print("HTTPError Body:", e.read().decode())
except Exception as e:
    print("Other Error:", e)
