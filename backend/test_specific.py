import asyncio
from app.services.job_scraper.scrapers import naukri, indeed

async def test():
    print("Testing Naukri...")
    jobs = await naukri.fetch("junior software")
    print(f"Naukri jobs: {len(jobs)}")
    
    print("Testing Indeed...")
    jobs2 = await indeed.fetch("junior software")
    print(f"Indeed jobs: {len(jobs2)}")

if __name__ == "__main__":
    asyncio.run(test())
