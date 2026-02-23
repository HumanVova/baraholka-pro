import re, cloudscraper
from bs4 import BeautifulSoup

scraper = cloudscraper.create_scraper(browser={'browser':'chrome','platform':'windows','desktop':True})
HEADERS = {'User-Agent': 'Mozilla/5.0','Referer': 'https://baraholka.onliner.by/'}

r = scraper.get('https://baraholka.onliner.by/viewforum.php?f=180', headers=HEADERS, timeout=15)
r.encoding = 'utf-8'
soup = BeautifulSoup(r.text, 'html.parser')

for row in soup.select('tr'):
    link = row.select_one('h2.wraptxt a[href*="viewtopic.php?t="]')
    price_tag = row.select_one('td.cost div.price-primary')
    if link:
        price_text = price_tag.get_text(strip=True) if price_tag else "НЕТ ЦЕНЫ"
        # Чистим число
        clean = re.sub(r'[^\d,.]', '', price_text).replace(',', '.')
        print(f'"{price_text}" → "{clean}"')