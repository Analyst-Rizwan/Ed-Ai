import asyncio
from playwright.async_api import async_playwright

async def debug_pw():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        print("Fetching Indeed...")
        await page.goto("https://in.indeed.com/jobs?q=junior+software&l=India&sc=0kf%3Aexplvl%28ENTRY_LEVEL%29%3B&sort=date", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        print("INDEED TITLE:", await page.title())
        content = await page.content()
        print("Snippet:", content[:500])
        
        print("\nFetching Naukri...")
        await page.goto("https://www.naukri.com/junior-software-jobs-in-india?jobAge=7", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        print("NAUKRI TITLE:", await page.title())
        content2 = await page.content()
        print("Snippet:", content2[:500])
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_pw())
