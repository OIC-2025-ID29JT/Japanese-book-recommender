// 1. Credentials from the Rakuten Developer Portal
const APP_ID = 'a3d6b19e-ca16-429d-8c22-1884ec8fcfc1'; 
const ACCESS_KEY = 'pk_53YVJeQjIn1OaMlgzlG1Ol4zZaUIcW4iNZT1v28oOpB'; 
const AFFILIATE_ID = '55bee456.0eb34bc2.55bee457.684e0d45'; 

// 2. Bilingual Translation Dictionary
const TRANSLATIONS = {
    ja: {
        logoText: "Kitchen4Soul",
        heroTitle: "あなたにぴったりの一冊を",
        heroSubtitle: "楽天ブックスの膨大なデータからおすすめの和書を探す",
        wishlistTitle: "マイリスト",
        wishlistSubtitle: "後で読みたい保存した本",
        labelGenre: "ジャンル",
        labelKeyword: "キーワード",
        labelSort: "並び順",
        searchBtn: "本を検索する",
        loading: "書籍を読み込み中...",
        noResults: "該当する書籍が見つかりませんでした。",
        noWishlist: "マイリストが空です。本を探して保存しましょう！",
        author: "著者",
        reviews: "件のレビュー",
        noReviews: "レビューなし",
        viewDetails: "詳細を楽天で見る",
        share: "シェア",
        copied: "コピーしました！",
        showSynopsis: "あらすじを読む",
        hideSynopsis: "閉じる",
        translatePage: "英語に翻訳して見る",
        themeLightTitle: "テーマ: ライト (クリックで切替)",
        themeDarkTitle: "テーマ: ダーク (クリックで切替)",
        themeAutoTitle: "テーマ: 自動 (クリックで切替)"
    },
    en: {
        logoText: "Kitchen4Soul",
        heroTitle: "Find Your Next Read",
        heroSubtitle: "Explore top Japanese books curated directly from Rakuten Books",
        wishlistTitle: "My Wishlist",
        wishlistSubtitle: "Your saved books to read later",
        labelGenre: "Genre",
        labelKeyword: "Keyword",
        labelSort: "Sort By",
        searchBtn: "Search Books",
        loading: "Loading books...",
        noResults: "No books found for this search.",
        noWishlist: "Your wishlist is empty. Discover books and add them here!",
        author: "Author",
        reviews: "reviews",
        noReviews: "No reviews",
        viewDetails: "View on Rakuten",
        share: "Share",
        copied: "Copied!",
        showSynopsis: "Read Synopsis",
        hideSynopsis: "Close",
        translatePage: "Translate page to English",
        themeLightTitle: "Theme: Light (click to change)",
        themeDarkTitle: "Theme: Dark (click to change)",
        themeAutoTitle: "Theme: Auto (click to change)"
    }
};

// 3. UI States
let currentLang = localStorage.getItem('lang') || 'ja';
let activeTab = 'discover';
let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

// 4. Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initTheme();
    updateUIForLanguage();
    updateWishlistCount();
    
    // Perform initial automatic search to populate the homepage
    searchBooks();
});

// 5. Setup Listeners
function setupEventListeners() {
    // Language Toggle
    const langBtn = document.getElementById('langToggle');
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ja' ? 'en' : 'ja';
        localStorage.setItem('lang', currentLang);
        updateUIForLanguage();
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => toggleTheme());
    }

    // Tab Switching
    document.getElementById('tabDiscover').addEventListener('click', (e) => switchTab('discover'));
    document.getElementById('tabWishlist').addEventListener('click', (e) => switchTab('wishlist'));

    // Search Trigger
    document.getElementById('searchBtn').addEventListener('click', () => searchBooks());

    // Auto-refresh search when dropdown selection changes
    document.getElementById('genreSelect').addEventListener('change', () => searchBooks());
    document.getElementById('sortSelect').addEventListener('change', () => searchBooks());
}

// 6. Translate / Update Labels
function updateUIForLanguage() {
    const lang = TRANSLATIONS[currentLang];
    
    // Header & Toggle
    document.getElementById('langToggle').innerText = currentLang === 'ja' ? 'EN' : '日本語';
    document.getElementById('logoText').innerText = lang.logoText;
    
    // Labels & Buttons
    document.getElementById('labelGenre').innerText = lang.labelGenre;
    document.getElementById('labelKeyword').innerText = lang.labelKeyword;
    document.getElementById('labelSort').innerText = lang.labelSort;
    document.getElementById('searchBtn').innerText = lang.searchBtn;
    
    // Hero titles
    document.getElementById('heroTitle').innerText = lang.heroTitle;
    document.getElementById('heroSubtitle').innerText = lang.heroSubtitle;
    document.getElementById('wishlistTitle').innerText = lang.wishlistTitle;
    document.getElementById('wishlistSubtitle').innerText = lang.wishlistSubtitle;

    // Dropdown selects
    updateDropdownOptions('genreSelect');
    updateDropdownOptions('sortSelect');

    // Update keyword placeholder
    document.getElementById('keywordInput').placeholder = currentLang === 'ja' ? '書籍名、著者名など...' : 'Search title, author...';

    // Rerender theme button to apply correct language to title attribute
    applyTheme(localStorage.getItem('theme') || 'auto');

    // Rerender book lists to apply card-level translations (e.g. Buttons labels)
    if (activeTab === 'wishlist') {
        renderWishlist();
    }
}

function updateDropdownOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    Array.from(select.options).forEach(option => {
        const jaText = option.getAttribute('data-ja');
        const enText = option.getAttribute('data-en');
        if (currentLang === 'ja') {
            option.text = `${jaText} (${enText})`;
        } else {
            option.text = `${enText} (${jaText})`;
        }
    });
}

// 7. Tab Switch Router
function switchTab(tabName) {
    activeTab = tabName;
    
    const discoverBtn = document.getElementById('tabDiscover');
    const wishlistBtn = document.getElementById('tabWishlist');
    const discoverView = document.getElementById('viewDiscover');
    const wishlistView = document.getElementById('viewWishlist');

    if (tabName === 'discover') {
        discoverBtn.classList.add('active');
        wishlistBtn.classList.remove('active');
        discoverView.classList.remove('hidden');
        wishlistView.classList.add('hidden');
    } else {
        discoverBtn.classList.remove('active');
        wishlistBtn.classList.add('active');
        discoverView.classList.add('hidden');
        wishlistView.classList.remove('hidden');
        renderWishlist();
    }
}

// 8. Call API & Render Search Results
async function searchBooks() {
    const genreId = document.getElementById('genreSelect').value;
    const keyword = document.getElementById('keywordInput').value.trim();
    const sort = document.getElementById('sortSelect').value;
    const resultsDiv = document.getElementById('results');
    const lang = TRANSLATIONS[currentLang];

    resultsDiv.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">${lang.loading}</p>`;

    // Build URL Parameters
    let url = `https://openapi.rakuten.co.jp/services/api/BooksTotal/Search/20170404?applicationId=${encodeURIComponent(APP_ID)}&accessKey=${encodeURIComponent(ACCESS_KEY)}&affiliateId=${encodeURIComponent(AFFILIATE_ID)}&booksGenreId=${encodeURIComponent(genreId)}&hits=12&format=json`;
    
    if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
    }
    
    if (sort !== 'standard') {
        url += `&sort=${encodeURIComponent(sort)}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        resultsDiv.innerHTML = '';

        console.log("Rakuten API URL:", url);
        console.log("Rakuten API Response:", data);

        if (data.errors) {
            const errMsg = data.errors.errorMessage || (data.errors[0] && data.errors[0].message) || "Unknown API Error";
            console.error("Rakuten API Error:", errMsg, data.errors);
            resultsDiv.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--danger-color);">API Error: ${errMsg}</p>`;
            return;
        }

        if (data.Items && data.Items.length > 0) {
            data.Items.forEach(item => {
                const book = item.Item;
                const card = createBookCard(book);
                resultsDiv.appendChild(card);
            });
        } else {
            resultsDiv.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">${lang.noResults}</p>`;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        resultsDiv.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--danger-color);">API Query Failed. Please check console.</p>`;
    }
}

// 9. Card Builder HTML
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const lang = TRANSLATIONS[currentLang];
    
    // Ratings stars mapping
    const reviewAverage = parseFloat(book.reviewAverage) || 0;
    const reviewCount = parseInt(book.reviewCount) || 0;
    const starsHtml = getStarsHtml(reviewAverage);
    const ratingLabel = reviewCount > 0 ? `${reviewAverage} (${reviewCount} ${lang.reviews})` : lang.noReviews;

    // Check if book is already in wishlist
    const isSaved = wishlist.some(item => item.isbn === book.isbn);
    const wishlistClass = isSaved ? 'wishlist-btn active' : 'wishlist-btn';

    // Format itemCaption for synopsis
    const synopsisText = book.itemCaption ? book.itemCaption.replace(/\n/g, '<br>') : '';

    // Create a short preview/intro text (teaser) to display directly
    const cleanCaption = book.itemCaption ? book.itemCaption.replace(/\s+/g, ' ').trim() : '';
    const introText = cleanCaption 
        ? (cleanCaption.length > 70 ? cleanCaption.substring(0, 70) + '...' : cleanCaption)
        : (currentLang === 'ja' ? '紹介文はありません。' : 'No description available.');

    card.innerHTML = `
        <div class="card-media">
            <img src="${book.mediumImageUrl || 'https://via.placeholder.com/120x160?text=No+Cover'}" alt="${book.title}" loading="lazy">
        </div>
        <div class="card-rating">
            <span class="stars">${starsHtml}</span>
            <span class="rating-count">${ratingLabel}</span>
        </div>
        <h3>${book.title}</h3>
        <p class="card-author">${lang.author}: ${book.author || '---'}</p>
        <p class="card-intro" title="${cleanCaption.replace(/"/g, '&quot;')}">${introText}</p>
        
        ${synopsisText ? `
            <button class="synopsis-toggle-btn"><span>▶</span> ${lang.showSynopsis}</button>
            <div class="synopsis-content">${synopsisText}</div>
        ` : ''}

        <div class="card-actions">
            <a href="${book.itemUrl}" target="_blank" class="card-btn card-btn-primary">${lang.viewDetails}</a>
            <button class="card-btn card-btn-secondary share-btn">${lang.share}</button>
            <button class="${wishlistClass}" title="Wishlist">❤️</button>
        </div>
    `;

    // 10. Card Sub-Interactions Event Listeners
    
    // Expand/Collapse Synopsis
    const toggleBtn = card.querySelector('.synopsis-toggle-btn');
    const contentDiv = card.querySelector('.synopsis-content');
    if (toggleBtn && contentDiv) {
        toggleBtn.addEventListener('click', () => {
            const isExpanded = contentDiv.classList.toggle('expanded');
            toggleBtn.querySelector('span').innerText = isExpanded ? '▼' : '▶';
            toggleBtn.querySelector('span').nextSibling.textContent = ` ${isExpanded ? lang.hideSynopsis : lang.showSynopsis}`;
        });
    }

    // Share Book details
    const shareBtn = card.querySelector('.share-btn');
    shareBtn.addEventListener('click', () => {
        const text = `📖 Recommend: "${book.title}" by ${book.author || 'Unknown'} - ${book.itemUrl}`;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = shareBtn.innerText;
            shareBtn.innerText = lang.copied;
            shareBtn.style.color = '#10B981'; // Green accent
            setTimeout(() => {
                shareBtn.innerText = originalText;
                shareBtn.style.color = '';
            }, 2000);
        });
    });

    // Wishlist Toggle button
    const wishBtn = card.querySelector('.wishlist-btn');
    wishBtn.addEventListener('click', () => {
        toggleWishlist(book, wishBtn);
    });

    return card;
}

// 11. Stars Rating Helper
function getStarsHtml(rating) {
    const fullStars = Math.round(rating);
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += i <= fullStars ? '★' : '☆';
    }
    return starsHtml;
}

// 12. Wishlist Business Logic
function toggleWishlist(book, buttonElement) {
    const index = wishlist.findIndex(item => item.isbn === book.isbn);
    
    if (index === -1) {
        // Save complete book structure to storage
        wishlist.push(book);
        buttonElement.classList.add('active');
    } else {
        wishlist.splice(index, 1);
        buttonElement.classList.remove('active');
        if (activeTab === 'wishlist') {
            renderWishlist(); // Live remove if inside wishlist tab
        }
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
}

function updateWishlistCount() {
    const badge = document.getElementById('wishlistCount');
    if (badge) {
        badge.innerText = wishlist.length;
        badge.style.display = wishlist.length > 0 ? 'inline-block' : 'none';
    }
}

function renderWishlist() {
    const container = document.getElementById('wishlistResults');
    const lang = TRANSLATIONS[currentLang];
    
    container.innerHTML = '';
    
    if (wishlist.length > 0) {
        wishlist.forEach(book => {
            const card = createBookCard(book);
            container.appendChild(card);
        });
    } else {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); margin-top: 40px;">${lang.noWishlist}</p>`;
    }
}

// 13. Theme Business Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const body = document.body;
    let isDark = true;
    
    if (theme === 'dark') {
        isDark = true;
    } else if (theme === 'light') {
        isDark = false;
    } else { // auto
        const hour = new Date().getHours();
        isDark = (hour < 6 || hour >= 18);
    }
    
    if (isDark) {
        body.classList.remove('light-theme');
    } else {
        body.classList.add('light-theme');
    }
    
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        const lang = TRANSLATIONS[currentLang];
        if (theme === 'light') {
            themeBtn.innerText = '☀️';
            themeBtn.title = lang.themeLightTitle || 'Theme: Light (click to change)';
        } else if (theme === 'dark') {
            themeBtn.innerText = '🌙';
            themeBtn.title = lang.themeDarkTitle || 'Theme: Dark (click to change)';
        } else {
            themeBtn.innerText = '🌓';
            themeBtn.title = lang.themeAutoTitle || 'Theme: Auto (click to change)';
        }
    }
}

function toggleTheme() {
    let currentTheme = localStorage.getItem('theme') || 'auto';
    let nextTheme = 'auto';
    
    if (currentTheme === 'auto') {
        nextTheme = 'light';
    } else if (currentTheme === 'light') {
        nextTheme = 'dark';
    } else {
        nextTheme = 'auto';
    }
    
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
}