import asyncio
from curl_cffi import requests
from bs4 import BeautifulSoup

async def debug_indeed():
    print("Fetching Indeed...")
    url = "https://in.indeed.com/jobs"
    params = {"q": "junior software", "l": "India", "sc": "0kf:explvl(ENTRY_LEVEL);", "sort": "date"}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    async with requests.AsyncSession(impersonate="chrome120", timeout=15) as client:
        resp = await client.get(url, params=params, headers=headers)
        print("Status:", resp.status_code)
        soup = BeautifulSoup(resp.text, 'lxml')
        print("Title:", soup.title.text if soup.title else "No Title")
        print("Snippet:", resp.text[:500])

async def debug_naukri():
    print("\nFetching Naukri...")
    url = "https://www.naukri.com/junior-software-jobs-in-india"
    headers = {"appid": "109", "systemid": "109"}
    async with requests.AsyncSession(impersonate="chrome120", timeout=15) as client:
        resp = await client.get(url, headers=headers)
        print("Status:", resp.status_code)
        soup = BeautifulSoup(resp.text, 'lxml')
        print("Title:", soup.title.text if soup.title else "No Title")
        print("Snippet:", resp.text[:500])

if __name__ == "__main__":
    asyncio.run(debug_indeed())
    asyncio.run(debug_naukri())
