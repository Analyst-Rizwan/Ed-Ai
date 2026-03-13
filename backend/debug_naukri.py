import asyncio
import httpx
from bs4 import BeautifulSoup

async def debug_naukri():
    print("Testing Naukri URL path...")
    query = "junior software"
    path = f"{query.replace(' ', '-')}-jobs-in-india"
    url = f"https://www.naukri.com/{path}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Upgrade-Insecure-Requests": "1"
    }
    
    async with httpx.AsyncClient(timeout=10, headers=headers) as client:
        resp = await client.get(url)
        print("Status", resp.status_code)
        
        soup = BeautifulSoup(resp.text, 'lxml')
        print("TITLE:", soup.title.text if soup.title else "No Title")
        jobs = soup.find_all("div", class_="srp-jobtuple-wrapper") or soup.find_all("article", class_="jobTuple")
        print("Jobs found:", len(jobs))
            
if __name__ == "__main__":
    asyncio.run(debug_naukri())
