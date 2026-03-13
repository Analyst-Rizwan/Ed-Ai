import asyncio
from curl_cffi import requests
from bs4 import BeautifulSoup

url = 'https://in.indeed.com/jobs'
params = {'q': 'software', 'l': 'India', 'sc': '0kf:explvl(ENTRY_LEVEL);'}
async def f():
    client = requests.AsyncSession(impersonate='chrome120', timeout=15)
    r = await client.get(url, params=params)
    soup = BeautifulSoup(r.text, 'lxml')
    print("INDEED TITLE:", soup.title.text if soup.title else "No Title")
    print("INDEED JOBS:", len(soup.select('.job_seen_beacon')))
    
    url_naukri = "https://www.naukri.com/software-entry-level-jobs-in-india"
    r2 = await client.get(url_naukri, headers={"appid": "109", "systemid": "109"})
    soup2 = BeautifulSoup(r2.text, 'lxml')
    jobs = soup2.find_all("div", class_="srp-jobtuple-wrapper") or soup2.find_all("article", class_="jobTuple")
    print("NAUKRI TITLE:", soup2.title.text if soup2.title else "No Title")
    print("NAUKRI JOBS:", len(jobs))

asyncio.run(f())
