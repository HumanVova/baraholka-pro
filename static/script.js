document.addEventListener('DOMContentLoaded', function () {

    const CATEGORIES = [
        { id: '180', name: 'Компьютеры', emoji: '🖥️', subs: [
            { id: '285', name: 'Процессоры' }, { id: '286', name: 'Видеокарты' },
            { id: '1676', name: 'Оперативная память' }, { id: '184', name: 'SSD / HDD' },
            { id: '181', name: 'Корпуса / БП' }, { id: '185', name: 'Мониторы' },
            { id: '212', name: 'Клавиатуры / Мыши' }, { id: '186', name: 'Принтеры / МФУ' },
        ]},
        { id: '2', name: 'Телефоны', emoji: '📱', subs: [
            { id: '643', name: 'Apple / iPhone' }, { id: '38', name: 'Аксессуары' }, { id: '1131', name: 'Ремонт' },
        ]},
        { id: '63', name: 'Ноутбуки', emoji: '💻', subs: [
            { id: '405', name: 'Планшеты' }, { id: '621', name: 'Запчасти' }, { id: '1178', name: 'Ремонт' },
        ]},
        { id: '560', name: 'Велосипеды', emoji: '🚲', subs: [
            { id: '1306', name: 'Запчасти' }, { id: '1305', name: 'Аксессуары' }, { id: '556', name: 'Детские' },
        ]},
        { id: '21', name: 'Авто', emoji: '🚗', subs: [
            { id: '213', name: 'Шины и диски' }, { id: '283', name: 'Магнитолы' },
            { id: '282', name: 'Мотоциклы' }, { id: '617', name: 'Кузов' },
        ]},
        { id: '606', name: 'Приставки', emoji: '🎮', subs: [{ id: '191', name: 'Игры и аксессуары' }] },
        { id: '288', name: 'Телевизоры', emoji: '📺', subs: [{ id: '605', name: 'ТВ-приставки' }, { id: '287', name: 'Видеокамеры' }] },
        { id: '45', name: 'Аудио', emoji: '🎧', subs: [{ id: '189', name: 'Беспроводные колонки' }] },
        { id: '30', name: 'Фото', emoji: '📷', subs: [{ id: '355', name: 'Объективы' }] },
        { id: '134', name: 'Бытовая техника', emoji: '🏠', subs: [
            { id: '1682', name: 'Кухонная техника' }, { id: '1679', name: 'Уборка' }, { id: '588', name: 'Стиралки' },
        ]},
        { id: '206', name: 'Спорт', emoji: '⚽', subs: [
            { id: '602', name: 'Тренажёры' }, { id: '1677', name: 'Зимний спорт' }, { id: '240', name: 'Рыбалка' },
        ]},
        { id: '237', name: 'Музыка', emoji: '🎸', subs: [] },
        { id: '255', name: 'Одежда', emoji: '👗', subs: [
            { id: '671', name: 'Женская' }, { id: '690', name: 'Мужская' }, { id: '258', name: 'Детская' },
        ]},
        { id: '554', name: 'Детские товары', emoji: '🧸', subs: [
            { id: '553', name: 'Автокресла' }, { id: '558', name: 'Игрушки' }, { id: '557', name: 'Мебель' },
        ]},
        { id: '607', name: 'Животные', emoji: '🐾', subs: [
            { id: '607', name: 'Кошки' }, { id: '608', name: 'Собаки' }, { id: '208', name: 'Товары' },
        ]},
        { id: '580', name: 'Недвижимость', emoji: '🏢', subs: [
            { id: '580', name: 'Продажа квартир' }, { id: '62', name: 'Аренда' }, { id: '584', name: 'Дома' },
        ]},
    ];

    const CITIES = ['Вся Беларусь', 'Минск', 'Брест', 'Витебск', 'Гомель', 'Гродно', 'Могилёв'];
    const HOST = 'http://127.0.0.1:5005';
    const USER_ID = '3959631';

    let state = { cat: '180', subcat: '', priceFrom: '', priceTo: '', city: '', query: '', page: 1 };
    let pendingState = { ...state };

    // ===== КАТЕГОРИИ =====
    const catGrid = document.getElementById('catGrid');
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-item';
        btn.dataset.id = cat.id;
        btn.innerHTML = `<span class="emoji">${cat.emoji}</span>${cat.name}`;
        btn.onclick = () => selectCat(cat.id);
        catGrid.appendChild(btn);
    });

    const cityGrid = document.getElementById('cityGrid');
    CITIES.forEach(city => {
        const btn = document.createElement('button');
        btn.className = 'city-item';
        btn.textContent = city;
        btn.onclick = () => {
            document.querySelectorAll('.city-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            pendingState.city = city === 'Вся Беларусь' ? '' : city;
        };
        cityGrid.appendChild(btn);
    });

    function selectCat(id) {
        pendingState.cat = id;
        pendingState.subcat = '';
        document.querySelectorAll('.cat-item').forEach(b => b.classList.remove('active'));
        document.querySelector(`.cat-item[data-id="${id}"]`)?.classList.add('active');
        const catData = CATEGORIES.find(c => c.id === id);
        const subcatSection = document.getElementById('subcatSection');
        const subcatGrid = document.getElementById('subcatGrid');
        subcatGrid.innerHTML = '';
        if (catData && catData.subs.length > 0) {
            subcatSection.classList.add('show');
            catData.subs.forEach(sub => {
                const btn = document.createElement('button');
                btn.className = 'subcat-item';
                btn.dataset.id = sub.id;
                btn.textContent = sub.name;
                btn.onclick = () => {
                    document.querySelectorAll('.subcat-item').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    pendingState.subcat = sub.id;
                };
                subcatGrid.appendChild(btn);
            });
        } else {
            subcatSection.classList.remove('show');
        }
    }

    // ===== DRAWER =====
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');

    function openDrawer() {
        pendingState = { ...state };
        document.querySelectorAll('.cat-item').forEach(b => b.classList.remove('active'));
        document.querySelector(`.cat-item[data-id="${pendingState.cat}"]`)?.classList.add('active');
        selectCat(pendingState.cat);
        document.querySelectorAll('.city-item').forEach(b => {
            b.classList.toggle('active', (!pendingState.city && b.textContent === 'Вся Беларусь') || pendingState.city === b.textContent);
        });
        document.getElementById('priceFrom').value = pendingState.priceFrom;
        document.getElementById('priceTo').value = pendingState.priceTo;
        drawer.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    document.getElementById('openFilter').onclick = openDrawer;
    document.getElementById('closeFilter').onclick = closeDrawer;
    overlay.onclick = closeDrawer;

    document.getElementById('applyBtn').onclick = () => {
        pendingState.priceFrom = document.getElementById('priceFrom').value;
        pendingState.priceTo = document.getElementById('priceTo').value;
        state = { ...pendingState, page: 1 };
        closeDrawer();
        updateActiveFilters();
        loadItems();
    };

    document.getElementById('resetBtn').onclick = () => {
        pendingState = { cat: '180', subcat: '', priceFrom: '', priceTo: '', city: '', query: '', page: 1 };
        document.getElementById('priceFrom').value = '';
        document.getElementById('priceTo').value = '';
        document.querySelectorAll('.cat-item').forEach(b => b.classList.remove('active'));
        document.querySelector('.cat-item[data-id="180"]')?.classList.add('active');
        selectCat('180');
        document.querySelectorAll('.city-item').forEach(b => b.classList.toggle('active', b.textContent === 'Вся Беларусь'));
    };

    // ===== АКТИВНЫЕ ФИЛЬТРЫ =====
    function updateActiveFilters() {
        const bar = document.getElementById('activeFilters');
        const badge = document.getElementById('filterBadge');
        bar.innerHTML = '';
        let count = 0;
        if (state.cat) {
            const catData = CATEGORIES.find(c => c.id === state.cat);
            if (catData) { addTag(bar, `${catData.emoji} ${catData.name}`, () => { state.cat = '180'; state.subcat = ''; state.page = 1; updateActiveFilters(); loadItems(); }); count++; }
        }
        if (state.subcat) {
            let subName = '';
            CATEGORIES.forEach(c => { const s = c.subs.find(s => s.id === state.subcat); if (s) subName = s.name; });
            if (subName) { addTag(bar, subName, () => { state.subcat = ''; state.page = 1; updateActiveFilters(); loadItems(); }); count++; }
        }
        if (state.priceFrom || state.priceTo) {
            addTag(bar, `${state.priceFrom || '0'} — ${state.priceTo || '∞'} р.`, () => { state.priceFrom = ''; state.priceTo = ''; state.page = 1; updateActiveFilters(); loadItems(); });
            count++;
        }
        if (state.city) {
            addTag(bar, `📍 ${state.city}`, () => { state.city = ''; state.page = 1; updateActiveFilters(); loadItems(); });
            count++;
        }
        bar.classList.toggle('show', count > 0);
        badge.textContent = count;
        badge.classList.toggle('show', count > 0);
    }

    function addTag(bar, text, onRemove) {
        const tag = document.createElement('div');
        tag.className = 'af-tag';
        tag.innerHTML = `${text} <button>✕</button>`;
        tag.querySelector('button').onclick = onRemove;
        bar.appendChild(tag);
    }

    // ===== РЕНДЕР КАРТОЧЕК =====
    function renderCards(items, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="status">НИЧЕГО НЕ НАЙДЕНО.</div>';
            return;
        }
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => window.open(item.url, '_blank');
            const imgPath = item.img
                ? `${HOST}/proxy_img?url=${encodeURIComponent(item.img)}`
                : 'https://placehold.co/300x130?text=Нет+фото';
            card.innerHTML = `
                <img src="${imgPath}" onerror="this.src='https://placehold.co/300x130?text=Нет+фото'">
                <div class="card-body">
                    <div class="card-t">${item.t}</div>
                    <div>
                        <p class="card-p">${item.p}</p>
                        <div class="card-l">📍 ${item.l}</div>
                    </div>
                </div>`;
            container.appendChild(card);
        });
    }

    // ===== ПАГИНАЦИЯ =====
    function renderPagination(page, hasNext) {
        let pag = document.getElementById('pagination');
        if (!pag) {
            pag = document.createElement('div');
            pag.id = 'pagination';
            pag.style.cssText = 'display:flex;gap:10px;padding:12px 10px 20px;align-items:center;justify-content:center;';
            document.getElementById('page-feed').appendChild(pag);
        }
        pag.innerHTML = '';

        if (page > 1) {
            const prev = document.createElement('button');
            prev.textContent = '← Назад';
            prev.style.cssText = 'flex:1;background:#1e3a8a;color:white;border:none;border-radius:12px;padding:13px;font-family:Manrope,sans-serif;font-weight:700;font-size:13px;cursor:pointer;';
            prev.onclick = () => { state.page = page - 1; loadItems(); window.scrollTo(0,0); };
            pag.appendChild(prev);
        }

        const info = document.createElement('span');
        info.textContent = `Стр. ${page}`;
        info.style.cssText = 'font-size:12px;font-weight:700;color:#999;white-space:nowrap;';
        pag.appendChild(info);

        if (hasNext) {
            const next = document.createElement('button');
            next.textContent = 'Вперёд →';
            next.style.cssText = 'flex:1;background:#1e3a8a;color:white;border:none;border-radius:12px;padding:13px;font-family:Manrope,sans-serif;font-weight:700;font-size:13px;cursor:pointer;';
            next.onclick = () => { state.page = page + 1; loadItems(); window.scrollTo(0,0); };
            pag.appendChild(next);
        }
    }

    // ===== ЗАГРУЗКА ЛЕНТЫ =====
    function loadItems() {
        const container = document.getElementById('items-container');
        container.innerHTML = '<div class="status">ПОИСК НА ONLINER...</div>';
        const pag = document.getElementById('pagination');
        if (pag) pag.innerHTML = '';

        const catId = state.subcat || state.cat;
        const q = state.query || document.getElementById('searchInput').value;
        const url = `${HOST}/api/items?q=${encodeURIComponent(q)}&cat=${catId}&priceFrom=${state.priceFrom}&priceTo=${state.priceTo}&city=${encodeURIComponent(state.city)}&page=${state.page}`;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                renderCards(data.items || [], 'items-container');
                renderPagination(data.page || 1, data.has_next || false);
            })
            .catch(() => { container.innerHTML = '<div class="status" style="color:red">СЕРВЕР НЕ ОТВЕЧАЕТ</div>'; });
    }

    // ===== ЗАГРУЗКА ПРОФИЛЯ =====
    function loadProfile() {
        const container = document.getElementById('profile-container');
        container.innerHTML = '<div class="status">Загрузка объявлений...</div>';
        fetch(`${HOST}/api/user_items?id=${USER_ID}`)
            .then(r => r.json())
            .then(data => {
                if (data.error === 'auth') {
                    container.innerHTML = '<div class="status">⚠️ Требуется авторизация на Onliner.<br><br>Войдите в браузере на baraholka.onliner.by и перезапустите сервер.</div>';
                    return;
                }
                if (data.username) document.getElementById('profileName').textContent = data.username.toUpperCase();
                const items = data.items || [];
                document.getElementById('profileCount').textContent = items.length;
                document.getElementById('myAdsCount').textContent = items.length > 0 ? `${items.length} шт.` : '';
                renderCards(items, 'profile-container');
            })
            .catch(() => { container.innerHTML = '<div class="status" style="color:red">СЕРВЕР НЕ ОТВЕЧАЕТ</div>'; });
    }

    // ===== ПОИСК =====
    document.getElementById('goBtn').onclick = () => { state.query = document.getElementById('searchInput').value; state.page = 1; loadItems(); };
    document.getElementById('searchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') { state.query = document.getElementById('searchInput').value; state.page = 1; loadItems(); }
    });

    // ===== НАВИГАЦИЯ =====
    let profileLoaded = false;
    window.switchPage = function(name) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('page-' + name).classList.add('active');
        document.getElementById('nav-' + name).classList.add('active');
        const header = document.querySelector('header');
        const activeFilters = document.getElementById('activeFilters');
        if (name === 'feed') {
            header.style.display = '';
            if (activeFilters.classList.contains('show')) activeFilters.style.display = 'flex';
        } else {
            header.style.display = 'none';
            activeFilters.style.display = 'none';
        }
        if (name === 'profile' && !profileLoaded) {
            profileLoaded = true;
            loadProfile();
        }
    };

    // ===== СТАРТ =====
    selectCat('180');
    document.querySelector('.cat-item[data-id="180"]')?.classList.add('active');
    document.querySelector('.city-item')?.classList.add('active');
    loadItems();
});