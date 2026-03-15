import asyncio
from app.services.job_scraper.aggregator import get_jobs

async def test_scrapers():
    print("Testing scrapers...")
    jobs = await get_jobs("software", force_refresh=True)
    
    platforms = {}
    for j in jobs:
        platforms[j.platform] = platforms.get(j.platform, 0) + 1
        
    print(f"\nTotal jobs found: {len(jobs)}")
    for platform, count in platforms.items():
        print(f"  - {platform}: {count} jobs")

if __name__ == "__main__":
    asyncio.run(test_scrapers())
