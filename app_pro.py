import os, re, requests, threading, time
from flask import Flask, jsonify, send_file, request, Response
from flask_cors import CORS
import cloudscraper
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

scraper = cloudscraper.create_scraper(
    browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True}
)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Accept-Language': 'ru-BY,ru;q=0.9,en;q=0.7',
    'Referer': 'https://baraholka.onliner.by/',
}

# Куки из браузера для авторизации
AUTH_COOKIES = {
    'ouid': 'snyBDmmLHVCIvN+dClVnAg==',
    'fingerprint': 'c8e59a49-743a-4e97-9807-e221a7c0e93a',
    'oss': 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozOTU5NjMxLCJ1c2VyX3R5cGUiOiJ1c2VyIiwiZmluZ2VycHJpbnQiOiI5MjZjNzhlODlkMmRkNGFiM2ViZWZjZTZmZWFjMGFiZiIsImV4cCI6MjA4NzIyNDM2MywiaWF0IjoxNzcxODY0MzYzfQ.tlXfCen24zWasGHt8SXKMZ8V-o18w9b7D5rmThsUEsi8WJaAsEsRLJNfPvN7By6rq3r70kgqHNxCE0dyzEd7ww',
    'logged_in': '1',
}

@app.after_request
def disable_csp(response):
    response.headers['Content-Security-Policy'] = ""
    response.headers['Access-Control-Allow-Origin'] = "*"
    return response

@app.route('/')
def home():
    return send_file(os.path.join(os.path.dirname(__file__), 'index.html'))

@app.route('/proxy_img')
def proxy_img():
    url = request.args.get('url')
    if not url:
        return Response(status=400)
    try:
        res = requests.get(url, stream=True, timeout=5, headers=HEADERS)
        return Response(res.content, content_type=res.headers.get('content-type'))
    except Exception as e:
        print(f"[proxy_img ERROR] {e}")
        return Response(status=404)


def price_to_float(price_text):
    """Конвертирует '3 000,00 р.' → 3000.0"""
    # Ищем число вида 1234,56 или 1234.56
    m = re.search(r'([\d\s]+)[,.]?(\d{0,2})\s*р', price_text)
    if not m:
        return None
    # Убираем пробелы из целой части, берём дробную
    integer_part = m.group(1).replace(' ', '').replace('\xa0', '')
    decimal_part = m.group(2)
    num_str = integer_part + ('.' + decimal_part if decimal_part else '')
    try:
        return float(num_str)
    except:
        return None


def parse_rows(soup, price_from='', price_to='', city_filter=''):
    domain = "https://baraholka.onliner.by"
    results = []
    seen = set()

    for row in soup.select('tr'):
        link_tag = row.select_one('h2.wraptxt a[href*="viewtopic.php?t="]')
        if not link_tag:
            continue

        href = link_tag.get('href', '')
        match = re.search(r't=(\d+)', href)
        topic_id = match.group(1) if match else None
        if not topic_id or topic_id in seen:
            continue

        title = link_tag.get_text(strip=True)

        # Город
        city_tag = row.select_one('p.ba-signature strong')
        city = city_tag.get_text(strip=True) if city_tag else "Беларусь"
        if city_filter and city_filter not in city.lower():
            continue

        # Цена из правильного места
        price_tag = row.select_one('td.cost div.price-primary')
        price_display = price_tag.get_text(strip=True) if price_tag else "---"

        # Фильтр по цене
        if price_from or price_to:
            price_val = price_to_float(price_display) if price_tag else None
            # Объявления без цены пропускаем если задан фильтр
            if price_val is None:
                continue
            try:
                if price_from and price_val < float(price_from):
                    continue
                if price_to and price_val > float(price_to):
                    continue
            except:
                pass

        # Фото
        img_tag = row.select_one('td.ph img')
        img = img_tag.get('src') if img_tag and img_tag.get('src') else f"https://content.onliner.by/baraholka/icon/{topic_id}"

        item_url = domain + "/" + href.lstrip("./")
        results.append({"t": title, "p": price_display, "img": img, "l": city, "url": item_url})
        seen.add(topic_id)

    return results


def build_url(query, cat, start):
    domain = "https://baraholka.onliner.by"
    if query:
        return f"{domain}/search.php?q={query}&start={start}"
    elif cat:
        return f"{domain}/viewforum.php?f={cat}&start={start}"
    else:
        return f"{domain}/viewforum.php?f=180&start={start}"


@app.route('/api/items')
def get_items():
    query       = request.args.get('q', '').strip()
    cat         = request.args.get('cat', '').strip()
    price_from  = request.args.get('priceFrom', '').strip()
    price_to    = request.args.get('priceTo', '').strip()
    city_filter = request.args.get('city', '').strip().lower()
    page        = int(request.args.get('page', 1))
    using_price_filter = bool(price_from or price_to)

    try:
        if using_price_filter:
            # При фильтре по цене сканируем несколько страниц
            results = []
            seen_ids = set()
            scan_page = page
            has_next = False

            for i in range(8):
                start = (scan_page - 1) * 40
                url = build_url(query, cat, start)
                r = scraper.get(url, headers=HEADERS, timeout=15)
                r.encoding = 'utf-8'
                soup = BeautifulSoup(r.text, 'html.parser')
                page_results = parse_rows(soup, price_from, price_to, city_filter)

                for item in page_results:
                    import re as _re
                    tid = _re.search(r't=(\d+)', item['url'])
                    key = tid.group(1) if tid else item['url']
                    if key not in seen_ids:
                        seen_ids.add(key)
                        results.append(item)

                has_next = bool(soup.select_one('li.page-next a'))
                if not has_next or len(results) >= 40:
                    break
                scan_page += 1

            print(f"[get_items+price] {len(results)} шт. за {price_from}-{price_to} р.")
            return jsonify({"items": results[:40], "page": page, "has_next": has_next})

        else:
            start = (page - 1) * 40
            url = build_url(query, cat, start)
            r = scraper.get(url, headers=HEADERS, timeout=15)
            r.encoding = 'utf-8'
            soup = BeautifulSoup(r.text, 'html.parser')
            results = parse_rows(soup, '', '', city_filter)
            has_next = bool(soup.select_one('li.page-next a'))
            print(f"[get_items] стр.{page} → {len(results)} | f={cat} q={query}")
            return jsonify({"items": results, "page": page, "has_next": has_next})

    except Exception as e:
        print(f"[get_items ERROR] {e}")
        return jsonify({"items": [], "page": page, "has_next": False})


@app.route('/api/user_items')
def get_user_items():
    user_id = request.args.get('id', '3959631').strip()
    domain = "https://baraholka.onliner.by"
    url = f"{domain}/search.php?type=ufleamarket&id={user_id}"
    try:
        # Используем куки авторизации
        r = scraper.get(url, headers=HEADERS, cookies=AUTH_COOKIES, timeout=15)
        r.encoding = 'utf-8'
        soup = BeautifulSoup(r.text, 'html.parser')

        print(f"[user_items] HTML длина: {len(r.text)}")

        if len(r.text) < 5000:
            return jsonify({"error": "auth", "username": "", "items": []})

        # Имя пользователя
        username_tag = soup.select_one('h1, .ba-username, .nickname')
        username = username_tag.get_text(strip=True) if username_tag else f"Пользователь #{user_id}"

        results = parse_rows(soup)
        print(f"[user_items] {len(results)} объявлений")
        return jsonify({"username": username, "items": results})
    except Exception as e:
        print(f"[user_items ERROR] {e}")
        return jsonify({"error": str(e), "username": "", "items": []})


@app.route('/ping')
def ping():
    return 'ok'

def keep_alive():
    """Пингует сервер каждые 10 минут чтобы не засыпал на Render"""
    time.sleep(30)  # Ждём пока сервер запустится
    url = os.environ.get('RENDER_EXTERNAL_URL', '')
    if not url:
        return  # Локально не пингуем
    while True:
        try:
            requests.get(f"{url}/ping", timeout=10)
            print("[keep_alive] ping OK")
        except Exception as e:
            print(f"[keep_alive] ERROR: {e}")
        time.sleep(600)  # Каждые 10 минут

if __name__ == "__main__":
    # Запускаем автопинг в фоне
    t = threading.Thread(target=keep_alive, daemon=True)
    t.start()
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port)