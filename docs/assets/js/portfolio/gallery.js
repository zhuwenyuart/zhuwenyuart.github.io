document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const { validateArtworks } = window.ArtworkData;
    const portfolioContainer = document.querySelector('.grid .row');
    const pcFilters = document.querySelector('.pc-filter');
    const mobileFilters = document.querySelector('.mobile-filter');
    const items = new WeakMap();
    const filterValues = new Map([['*', null]]);
    let allArtworks = [];
    let $grid;
    let currentFilterType = 'category';
    let currentFilter = '*';

    function valuesFor(type) {
        const values = [...new Set(allArtworks.map(artwork => artwork[type]))];
        if (type === 'time') values.sort((a, b) => Number(b) - Number(a));
        return values;
    }

    function filterToken(type, value) {
        // Opaque values never contain user-provided CSS selector syntax.
        return `${type}-${valuesFor(type).indexOf(value)}`;
    }

    function generateFilters() {
        pcFilters.replaceChildren();
        mobileFilters.replaceChildren();
        for (const type of ['category', 'time']) {
            const group = document.createElement('div');
            group.className = `filter-group ${type}-group`;
            const mobileGroup = document.createElement('div');
            mobileGroup.className = `mobile-filter-group ${type}-group`;
            const select = document.createElement('select');
            select.setAttribute('aria-label', type === 'category' ? '按系列筛选作品' : '按年份筛选作品');
            const filters = [{ token: '*', label: '全部作品' }];
            for (const value of valuesFor(type)) {
                const token = filterToken(type, value);
                filterValues.set(token, { type, value });
                filters.push({ token, label: value });
            }
            for (const { token, label } of filters) {
                const button = document.createElement('button');
                button.type = 'button';
                button.dataset.filter = token;
                button.classList.toggle('active', token === '*');
                button.textContent = label;
                button.addEventListener('click', () => applyFilter(token));
                group.appendChild(button);
                const option = document.createElement('option');
                option.value = token;
                option.textContent = label;
                select.appendChild(option);
            }
            select.addEventListener('change', () => applyFilter(select.value));
            mobileGroup.appendChild(select);
            group.style.display = type === currentFilterType ? 'block' : 'none';
            mobileGroup.style.display = type === currentFilterType ? 'block' : 'none';
            pcFilters.appendChild(group);
            mobileFilters.appendChild(mobileGroup);
        }
    }

    function applyFilter(token) {
        const selected = filterValues.get(token);
        if (selected === undefined) return;
        currentFilter = token;
        if ($grid) {
            $grid.isotope({
                filter: function () {
                    const artwork = items.get(this);
                    return !selected || artwork[selected.type] === selected.value;
                },
            });
        }
        for (const button of pcFilters.querySelectorAll('button')) {
            button.classList.toggle('active', button.dataset.filter === token || (token === '*' && button.dataset.filter === '*'));
        }
        for (const select of mobileFilters.querySelectorAll('select')) select.value = token;
    }

    function toggleFilter(type) {
        currentFilterType = type;
        for (const group of pcFilters.querySelectorAll('.filter-group')) {
            group.style.display = group.classList.contains(`${type}-group`) ? 'block' : 'none';
        }
        for (const group of mobileFilters.querySelectorAll('.mobile-filter-group')) {
            group.style.display = group.classList.contains(`${type}-group`) ? 'block' : 'none';
        }
        applyFilter('*');
    }

    function setMeta(selector, label, value) {
        const element = document.querySelector(selector);
        const title = document.createElement('strong');
        title.textContent = label;
        element.replaceChildren(title, document.createTextNode(' ' + value));
    }

    function openModal(artwork) {
        document.querySelector('.modal-image').setAttribute('src', artwork.path);
        document.querySelector('.artwork-title').textContent = artwork.name;
        setMeta('.artwork-time', '创作时间:', artwork.time);
        setMeta('.artwork-material', '材料:', artwork.material);
        setMeta('.artwork-size', '尺寸:', artwork.size);
        const description = document.querySelector('.artwork-description');
        if (description) description.textContent = artwork.des || '暂无描述';
        document.querySelector('.art-modal').classList.add('active');
    }

    function generatePortfolioItems() {
        portfolioContainer.replaceChildren();
        for (const artwork of allArtworks) {
            const item = document.createElement('div');
            item.className = 'col-lg-6 col-md-6 col-xs-12 grid-item';
            items.set(item, artwork);
            const portfolio = document.createElement('div');
            portfolio.className = 'portfolio hover-style-4';
            const image = document.createElement('img');
            image.setAttribute('src', artwork.path);
            image.alt = artwork.name;
            image.loading = 'lazy';
            image.addEventListener('load', () => { if ($grid) $grid.isotope('layout'); });
            const title = document.createElement('div');
            title.className = 'portfolio-title3';
            const heading = document.createElement('h3');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = artwork.name;
            heading.appendChild(link);
            title.appendChild(heading);
            portfolio.append(image, title);
            item.appendChild(portfolio);
            item.addEventListener('click', event => {
                event.preventDefault();
                openModal(artwork);
            });
            portfolioContainer.appendChild(item);
        }
    }

    function initModal() {
        const modal = document.querySelector('.art-modal');
        document.querySelector('.close-modal').addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', event => { if (event.target === modal) modal.classList.remove('active'); });
        document.addEventListener('keyup', event => { if (event.key === 'Escape') modal.classList.remove('active'); });
    }

    async function initialize() {
        try {
            const response = await fetch('../artwork.json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            allArtworks = validateArtworks(await response.json());
            generateFilters();
            generatePortfolioItems();
            initModal();
            // Initialize filtering before lazy images finish loading. Each image
            // load and imagesLoaded progress relayout the masonry independently.
            $grid = window.jQuery('.grid').isotope({
                itemSelector: '.grid-item',
                percentPosition: true,
                masonry: { columnWidth: '.grid-item' },
            });
            window.jQuery('.grid').imagesLoaded().progress(() => $grid.isotope('layout'));
            applyFilter(currentFilter);
            document.querySelector('.filter-toggle').addEventListener('change', function () {
                toggleFilter(this.checked ? 'time' : 'category');
            });
        } catch (error) {
            const message = document.createElement('p');
            message.setAttribute('role', 'alert');
            message.textContent = '作品暂时无法加载，请稍后刷新重试。';
            portfolioContainer.replaceChildren(message);
            console.error('Artwork loading failed:', error);
        }
    }

    initialize();
});
