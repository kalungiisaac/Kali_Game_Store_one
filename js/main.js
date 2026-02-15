// main.js
import { Wishlist } from './wishlist.js';
import { renderGames, renderGamesWithDownload, renderWishlist, renderGameDetails, renderDeals, renderFreeGames, renderRecommendations, renderComparisonSlot, renderComparisonTable } from './ui.js';
// renderDeals and renderFreeGames are now also used on the home page
import api from './api.js';
import { gameFilter } from './filter.js';
import { gameComparison } from './comparison.js';
import { recommendationEngine } from './recommendations.js';
import {footer} from './footer.js'
import {header} from './header.js'

// Global trailer function — plays in modal, never redirects
window.openTrailer = async function(gameId, gameName) {
    const modal = document.getElementById('trailer-modal')
    const container = document.getElementById('trailer-container');
    const titleEl = document.getElementById('trailer-title');
    
    if (!modal || !container) return;
    
    // Show modal with loading state
    modal.classList.add('active');
    titleEl.textContent = `${gameName} - Loading Trailer...`;
    container.innerHTML = '<div class="trailer-fallback"><div class="trailer-spinner"></div><p>🎬 Searching for trailer...</p></div>';
    
    try {
        const trailer = await api.getGameTrailer(gameId, gameName);
        
        if (trailer && trailer.source === 'rawg') {
            // RAWG has a direct MP4 video — play natively
            titleEl.textContent = `${gameName} - Official Trailer`;
            container.innerHTML = `<video controls autoplay playsinline><source src="${trailer.videoUrl}" type="video/mp4">Your browser does not support video.</video>`;
        } else if (trailer && trailer.source === 'youtube') {
            // Embedded YouTube player
            titleEl.textContent = `${gameName} - Official Trailer`;
            container.innerHTML = `<iframe src="${trailer.embedUrl}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
        } else {
            // Fallback show link but do NOT auto-open
            titleEl.textContent = `${gameName} - Trailer`;
            const searchUrl = trailer?.searchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' official game trailer')}`;
            container.innerHTML = `
                <div class="trailer-fallback">
                    <p>😕 Could not find an embeddable trailer.</p>
                    <a href="${searchUrl}" target="_blank" class="trailer-yt-btn">▶ Search on YouTube</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Trailer error:', error);
        titleEl.textContent = `${gameName} - Trailer`;
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' official game trailer')}`;
        container.innerHTML = `
            <div class="trailer-fallback">
                <p>😕 Something went wrong loading the trailer.</p>
                <a href="${searchUrl}" target="_blank" class="trailer-yt-btn">▶ Search on YouTube</a>
            </div>
        `;
    }
};

// Close trailer modal — stops any playing video/iframe
window.closeTrailer = function() {
    const modal = document.getElementById('trailer-modal');
    const container = document.getElementById('trailer-container');
    if (modal) modal.classList.remove('active');
    // Clear innerHTML to stop playback (iframes & videos)
    if (container) container.innerHTML = '';
};

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize header and footer
    try {
        new header();
        new footer();
    } catch (e) {
        console.error('Error initializing header/footer:', e);
    }
    
    // Initialize wishlist and update counts
    const wishlist = new Wishlist();
    wishlist.init();
    
    // Set active navigation link
    setActiveNavLink();

    // Setup hamburger menu toggle
    setupHamburgerMenu();
    
    // Setup trailer modal close handlers
    const trailerModal = document.getElementById('trailer-modal');
    const trailerClose = document.getElementById('trailer-close');
    
    if (trailerClose) {
        trailerClose.addEventListener('click', window.closeTrailer);
    }
    if (trailerModal) {
        trailerModal.addEventListener('click', (e) => {
            if (e.target === trailerModal) window.closeTrailer();
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeTrailer();
    });
    
    // Page-specific initialization
    if (document.body.id === 'index-page') {
        await initBrowsePage();
    } else if (document.body.id === 'detail-page') {
        await initDetailPage();
    } else if (document.body.id === 'wishlist-page') {
        initWishlistPage();
    } else if (document.body.id === 'upcoming-page') {
        await initUpcomingPage();
    } else if (document.body.id === 'deals-page') {
        await initDealsPage();
    } else if (document.body.id === 'free-games-page') {
        await initFreeGamesPage();
    } else if (document.body.id === 'comparison-page') {
        await initComparisonPage();
    }
});

// Load partial content
async function loadPartial(name, placeholderId) {
    try {
        const response = await fetch(`partials/${name}.html`);
        if (!response.ok) throw new Error(`Failed to load ${name}`);
        
        const html = await response.text();
        document.getElementById(placeholderId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading ${name}:`, error);
        document.getElementById(placeholderId).innerHTML = 
            `<div class="error">Failed to load ${name}. Please refresh.</div>`;
    }
}

// Set active navigation link
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Setup hamburger menu for mobile
function setupHamburgerMenu() {
    const btn = document.getElementById('hamburger-btn');
    const nav = document.getElementById('main-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        nav.classList.toggle('open');
    });

    // Close menu when a nav link is clicked, then navigate
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            btn.classList.remove('active');
            nav.classList.remove('open');
            // Small delay so the user sees the menu close, then navigate
            setTimeout(() => {
                window.location.href = href;
            }, 200);
        });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !nav.contains(e.target)) {
            btn.classList.remove('active');
            nav.classList.remove('open');
        }
    });
}

// Helper: show loading spinner inside a container
function showLoading(containerId, message = 'Loading...') {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="loading"><div class="spinner"></div><p>${message}</p></div>`;
}

// Helper: show error inside a container
function showError(containerId, error) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `
        <div class="error-container error-section">
            <p>⚠️ Could not load this section</p>
            <button class="btn" onclick="location.reload()">🔄 Retry</button>
        </div>`;
}

// Helper: safely load a section — fetches data, renders, shows error on failure
async function loadSection(containerId, fetchFn, renderFn) {
    showLoading(containerId);
    try {
        const data = await fetchFn();
        if (data && data.length > 0) {
            renderFn(data, containerId);
        } else {
            const el = document.getElementById(containerId);
            if (el) el.innerHTML = `
                <div class="empty-state empty-section">
                    <p>No games found for this section right now.</p>
                    <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
                </div>`;
        }
    } catch (err) {
        console.error(`Section ${containerId} failed:`, err);
        showError(containerId, err);
    }
}

// Browse page initialization
async function initBrowsePage() {
    document.body.id = 'index-page';
    
    const platformIds = '4,18,187,1,186,7,3,21';
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    const todayStr = today.toISOString().split('T')[0];
    const threeMonthsFuture = new Date();
    threeMonthsFuture.setMonth(today.getMonth() + 3);
    const futureStr = threeMonthsFuture.toISOString().split('T')[0];

    // Show loading states
    showLoading('games-container', 'Loading popular games...');
    showLoading('upcoming-container', 'Loading upcoming releases...');

    // ── FEATURED CAROUSEL ──
    try {
        const featuredData = await api.fetchGames({ 
            page_size: 15, 
            ordering: '-metacritic',
            metacritic: '85,100',
            platforms: platformIds
        });
        const featuredGames = (featuredData.results || []).filter(g => g.background_image);
        featuredGames.sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0));
        
        if (featuredGames.length > 0) {
            let currentIndex = 0;
            const featuredSection = document.getElementById('featured-game');
            const dots = featuredGames.slice(0, 10);
            featuredSection.insertAdjacentHTML('beforeend',
                `<div class="slide-indicator">${dots.map((_, i) => 
                    `<span class="slide-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
                ).join('')}</div>`);
            
            function updateFeaturedGame(index) {
                const f = featuredGames[index];
                const bgEl = document.getElementById('featured-bg');
                const contentEl = document.querySelector('.featured-content');
                if (bgEl) bgEl.style.opacity = '0';
                if (contentEl) contentEl.style.opacity = '0';
                setTimeout(() => {
                    const titleEl = document.getElementById('featured-title');
                    const platformsEl = document.getElementById('featured-platforms');
                    const linkEl = document.getElementById('featured-link');
                    const trailerBtn = document.getElementById('featured-trailer');
                    if (titleEl) titleEl.textContent = f.name;
                    if (platformsEl) platformsEl.textContent = `Available on ${f.parent_platforms?.map(p => p.platform.name).join(', ') || 'Multiple Platforms'}`;
                    if (linkEl) linkEl.href = `game-details.html?id=${f.id}`;
                    if (bgEl && f.background_image) bgEl.style.backgroundImage = `url('${f.background_image}')`;
                    if (trailerBtn) trailerBtn.onclick = () => window.openTrailer(f.id, f.name);
                    document.querySelectorAll('.slide-dot').forEach((d, i) => d.classList.toggle('active', i === index));
                    if (bgEl) bgEl.style.opacity = '1';
                    if (contentEl) contentEl.style.opacity = '1';
                }, 400);
            }
            updateFeaturedGame(0);
            setInterval(() => { currentIndex = (currentIndex + 1) % Math.min(featuredGames.length, 10); updateFeaturedGame(currentIndex); }, 5000);
            document.querySelectorAll('.slide-dot').forEach(dot => dot.addEventListener('click', (e) => { currentIndex = parseInt(e.target.dataset.index); updateFeaturedGame(currentIndex); }));
        }
    } catch (e) { console.error('Featured carousel error:', e); }

    // ── PAGINATION STATE ──
    let currentPage = 1;
    const gamesPerPage = 21; // 7 rows × 3 columns
    let totalGames = 0;
    let totalPages = 1;
    
    // Function to load games for a specific page
    async function loadGamesPage(page) {
        currentPage = page;
        showLoading('games-container', 'Loading games...');
        
        try {
            const data = await api.fetchGames({ 
                ordering: '-metacritic,-rating,-added', 
                page_size: gamesPerPage,
                page: page,
                platforms: platformIds
            });
            
            totalGames = data.count || 0;
            totalPages = Math.ceil(totalGames / gamesPerPage);
            
            if (data.results && data.results.length > 0) {
                renderGames(data.results, 'games-container');
                updatePagination();
                
                // Update games count
                const countEl = document.getElementById('games-count');
                if (countEl) {
                    const start = (currentPage - 1) * gamesPerPage + 1;
                    const end = Math.min(currentPage * gamesPerPage, totalGames);
                    countEl.textContent = `Showing ${start}-${end} of ${totalGames.toLocaleString()} games`;
                }
                
                // Scroll to games section
                if (page > 1) {
                    document.getElementById('games-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        } catch (err) {
            console.error('Failed to load games:', err);
            showError('games-container', err);
        }
    }
    
    // Update pagination UI
    function updatePagination() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageNumbers = document.getElementById('page-numbers');
        
        if (!prevBtn || !nextBtn || !pageNumbers) return;
        
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
        
        // Generate page numbers
        let pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= Math.min(totalPages, 10); i++) pages.push(i);
        } else {
            pages.push(1);
            
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            
            if (currentPage <= 3) {
                end = Math.min(totalPages - 1, 4);
            } else if (currentPage >= totalPages - 2) {
                start = Math.max(2, totalPages - 3);
            }
            
            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            
            pages.push(totalPages);
        }
        
        pageNumbers.innerHTML = pages.map(p => {
            if (p === '...') {
                return '<span class="page-ellipsis">...</span>';
            }
            return `<button class="page-num ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }).join('');
        
        pageNumbers.querySelectorAll('.page-num').forEach(btn => {
            btn.addEventListener('click', () => {
                loadGamesPage(parseInt(btn.dataset.page));
            });
        });
    }
    
    // Setup pagination buttons
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) loadGamesPage(currentPage - 1);
    });
    
    document.getElementById('next-page')?.addEventListener('click', () => {
        if (currentPage < totalPages) loadGamesPage(currentPage + 1);
    });
    
    // ── LOAD INITIAL DATA ──
    await Promise.allSettled([
        loadGamesPage(1),

        // New Releases (upcoming games)
        loadSection('upcoming-container', async () => {
            const data = await api.fetchGames({
                dates: `${todayStr},${futureStr}`,
                ordering: 'released',
                page_size: 4,
                platforms: platformIds
            });
            return data.results || [];
        }, renderGames),

        // Limited Time Deals (highly rated recent indie games)
        loadSection('deals-container', async () => {
            const data = await api.fetchGames({
                ordering: '-rating',
                page_size: 4,
                genres: '51',
                metacritic: '70,100',
                platforms: platformIds
            });
            return data.results || [];
        }, renderGames)
    ]);
    
    // Setup search
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleSearch();
        });
        // Clear search when input is emptied
        searchInput.addEventListener('input', e => {
            if (e.target.value.trim() === '') {
                // Reset to initial games
                loadInitialGames();
            }
        });
    }
    
    // Load filters
    loadPlatformFilters();
    loadGenreFilters();
    
    // Setup filter buttons
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    applyFiltersBtn?.addEventListener('click', applyFilters);
    clearFiltersBtn?.addEventListener('click', clearFilters);
}

// Apply URL parameters for "See All" links and deep links
async function applyUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const sortParam = params.get('sort');
    const genreParam = params.get('genre');
    const genreIdParam = params.get('genreId');
    const searchParam = params.get('search');

    if (!sortParam && !genreParam && !genreIdParam && !searchParam) return;

    if (searchParam) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = searchParam;
            await handleSearch();
            document.getElementById('games-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
    }

    const sortMap = {
        rating: '-rating',
        popular: '-added',
        newest: '-released',
        released: '-released',
        name: 'name'
    };

    if (sortParam) {
        const sortValue = sortMap[sortParam] || sortParam;
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) sortFilter.value = sortValue;
    }

    let genreId = null;
    if (genreIdParam && !Number.isNaN(parseInt(genreIdParam, 10))) {
        genreId = parseInt(genreIdParam, 10);
    }

    const genreMap = {
        action: 4,
        rpg: 5,
        'role-playing-games-rpg': 5,
        indie: 51,
        strategy: 10,
        shooter: 2
    };

    if (!genreId && genreParam) {
        const normalized = genreParam.toLowerCase();
        genreId = genreMap[normalized] || null;
    }

    if (genreId) {
        const genreCheckbox = document.querySelector(`#genre-filters input[data-genre="${genreId}"]`);
        if (genreCheckbox) genreCheckbox.checked = true;
    }

    if (sortParam || genreId) {
        await applyFilters();
        document.getElementById('games-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Apply filters
async function applyFilters() {
    const container = document.getElementById('games-container');
    container.innerHTML = '<div class="loading"><p>Applying filters...</p></div>';
    
    // Clear existing filters first
    gameFilter.clearFilters();
    
    // Get selected platforms
    document.querySelectorAll('#platform-filters input:checked').forEach(input => {
        gameFilter.currentFilters.platforms.push(input.dataset.platform);
    });
    
    // Get selected genres
    document.querySelectorAll('#genre-filters input:checked').forEach(input => {
        gameFilter.currentFilters.genres.push(input.dataset.genre);
    });
    
    // Get sort option
    const sortValue = document.getElementById('sort-filter')?.value || '';
    if (sortValue) {
        gameFilter.currentFilters.ordering = sortValue;
    }
    
    try {
        // Fetch filtered games
        const data = await gameFilter.fetchFilteredGames();
        
        if (data.results && data.results.length > 0) {
            renderGames(data.results, 'games-container');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No games found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to apply filters:', error);
        container.innerHTML = `
            <div class="error-container">
                <h3>Failed to load filtered games</h3>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Clear all filters
async function clearFilters() {
    // Uncheck all checkboxes
    document.querySelectorAll('#platform-filters input, #genre-filters input').forEach(input => {
        input.checked = false;
    });
    
    // Reset sort
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) sortFilter.value = '';
    
    // Clear filter module
    gameFilter.clearFilters();
    
    // Reload initial games
    const container = document.getElementById('games-container');
    container.innerHTML = '<div class="loading"><p>Loading games...</p></div>';
    
    try {
        const data = await api.fetchGames();
        renderGames(data.results, 'games-container');
    } catch (error) {
        console.error('Failed to reload games:', error);
    }
}

// Detail page initialization
async function initDetailPage() {
    document.body.id = 'detail-page';
    
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    
    if (!gameId) {
        document.querySelector('.game-detail').innerHTML = `
            <div class="error-container">
                <h2>Game Not Found</h2>
                <p>Invalid game ID. Please return to <a href="index.html">browse page</a></p>
            </div>
        `;
        return;
    }
    
    // Show loading state
    const titleEl = document.getElementById('game-title');
    if (titleEl) titleEl.textContent = 'Loading...';
    
    try {
        const game = await api.getGameDetails(gameId);
        if (!game) {
            document.querySelector('.game-detail').innerHTML = `
                <div class="error-container">
                    <h2>Game Not Found</h2>
                    <p>We couldn't find the requested game. Please return to <a href="index.html">browse page</a></p>
                </div>
            `;
            return;
        }
        
        renderGameDetails(game);
        updateWishlistButton(game);
        
        // Load screenshots from API
        try {
            const screenshots = await api.getGameScreenshots(gameId);
            if (screenshots.length > 0) {
                const container = document.getElementById('screenshots-container');
                if (container) {
                    container.innerHTML = screenshots.slice(0, 5).map((s, index) => `
                        <div class="screenshot-item" data-index="${index}" data-full="${s.image}">
                            <img src="${s.image}" alt="Game screenshot" loading="lazy">
                        </div>
                    `).join('');
                    
                    // Setup screenshot modal
                    setupScreenshotModal(screenshots.slice(0, 5));
                }
            }
        } catch (ssError) {
            console.warn('Screenshots not available:', ssError);
        }
        
        // Load similar game recommendations
        await loadRecommendations(game);
    } catch (error) {
        console.error('Failed to load game details:', error);
        document.querySelector('.game-detail').innerHTML = `
            <div class="error-container">
                <h2>❌ Failed to Load Game</h2>
                <p>${error.message || 'Network error. Please try again.'}</p>
                <a href="index.html" class="btn">Return to Browse</a>
                <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Setup screenshot modal for viewing full-size screenshots
function setupScreenshotModal(screenshots) {
    const modal = document.getElementById('screenshot-modal');
    const modalImg = document.getElementById('modal-screenshot');
    const closeBtn = document.getElementById('screenshot-close');
    const prevBtn = document.getElementById('modal-prev');
    const nextBtn = document.getElementById('modal-next');
    const currentSpan = document.getElementById('screenshot-current');
    const totalSpan = document.getElementById('screenshot-total');
    
    if (!modal || !modalImg) return;
    
    let currentIndex = 0;
    totalSpan.textContent = screenshots.length;
    
    function showScreenshot(index) {
        currentIndex = index;
        if (currentIndex < 0) currentIndex = screenshots.length - 1;
        if (currentIndex >= screenshots.length) currentIndex = 0;
        
        modalImg.src = screenshots[currentIndex].image;
        currentSpan.textContent = currentIndex + 1;
    }
    
    function openModal(index) {
        showScreenshot(index);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Click on screenshot thumbnails
    document.querySelectorAll('.screenshot-item').forEach((item, index) => {
        item.addEventListener('click', () => openModal(index));
    });
    
    // Also allow clicking the main hero image
    const heroImg = document.getElementById('game-cover');
    if (heroImg && screenshots.length > 0) {
        heroImg.style.cursor = 'pointer';
        heroImg.addEventListener('click', () => openModal(0));
    }
    
    // Navigation
    prevBtn?.addEventListener('click', () => showScreenshot(currentIndex - 1));
    nextBtn?.addEventListener('click', () => showScreenshot(currentIndex + 1));
    
    // Close modal
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') showScreenshot(currentIndex - 1);
        if (e.key === 'ArrowRight') showScreenshot(currentIndex + 1);
    });
}

// Load similar game recommendations
async function loadRecommendations(game) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    try {
        // Use the full game object for better recommendations
        const similarGames = await recommendationEngine.getSimilarGames(game);
        
        if (similarGames && similarGames.length > 0) {
            renderRecommendations(similarGames, 'recommendations-container');
        } else {
            document.getElementById('recommendations-section').style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load recommendations:', error);
        document.getElementById('recommendations-section').style.display = 'none';
    }
}

// Wishlist page initialization
function initWishlistPage() {
    document.body.id = 'wishlist-page';
    const wishlist = new Wishlist();
    renderWishlist(wishlist.getWishlist());
}

// Upcoming page initialization
async function initUpcomingPage() {
    document.body.id = 'upcoming-page';
    
    const container = document.getElementById('games-container');
    if (container) container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading upcoming games...</p></div>';
    
    try {
        // Get upcoming games (next 6 months)
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 6);
        
        const params = {
            dates: `${today.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`,
            ordering: 'released',
            page_size: 20
        };
        
        const data = await api.fetchGames(params);
        renderGames(data.results, 'games-container');
        
        // Add "No upcoming games" message if empty
        if (!data.results || data.results.length === 0) {
            document.getElementById('games-container').innerHTML = `
                <div class="empty-state">
                    <h3>No upcoming releases found</h3>
                    <p>Check back later for new announcements</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load upcoming games:', error);
        const container = document.getElementById('games-container');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <h3>❌ Failed to load upcoming games</h3>
                    <p>${error.message || 'Please try again later.'}</p>
                    <button class="btn" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }
}

// Search handler
async function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    try {
        const data = await api.searchGames(query);
        renderGames(data.results, 'games-container');
        
        // Show "no results" message
        if (!data.results || data.results.length === 0) {
            document.getElementById('games-container').innerHTML = `
                <div class="empty-state">
                    <h3>No games found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
        }
        
        // Scroll to results
        setTimeout(() => {
            const gamesContainer = document.getElementById('games-container');
            if (gamesContainer) {
                gamesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    } catch (error) {
        console.error('Search failed:', error);
        document.getElementById('games-container').innerHTML = `
            <div class="error-container">
                <h3>Search failed</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// Load initial games (reset search)
async function loadInitialGames() {
    currentPage = 1;
    await loadGamesPage(1);
}

// Update wishlist button state
function updateWishlistButton(game) {
    const wishlist = new Wishlist();
    const btn = document.getElementById('wishlist-btn');
    
    if (!btn) return;
    
    if (wishlist.isInWishlist(game.id)) {
        btn.classList.add('active');
        btn.innerHTML = '<span>❤️</span> Added to Wishlist';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span>❤️</span> Add to Wishlist';
    }
    
    btn.dataset.gameId = game.id;
    btn.dataset.gameName = game.name;
    btn.dataset.gameImage = game.background_image || '';
}

// Filter loading functions (simplified)
function loadPlatformFilters() {
    const platforms = [
        { id: 1, name: 'PC' },
        { id: 2, name: 'PlayStation' },
        { id: 3, name: 'Xbox' },
        { id: 4, name: 'Nintendo' },
        { id: 5, name: 'Mobile' }
    ];
    
    const container = document.getElementById('platform-filters');
    if (!container) return;
    
    container.innerHTML = platforms.map(p => `
        <label>
            <input type="checkbox" data-platform="${p.id}"> ${p.name}
        </label>
    `).join('');
}

function loadGenreFilters() {
    const genres = [
        { id: 4, name: 'Action' },
        { id: 5, name: 'RPG' },
        { id: 10, name: 'Strategy' },
        { id: 2, name: 'Shooter' },
        { id: 51, name: 'Indie' }
    ];
    
    const container = document.getElementById('genre-filters');
    if (!container) return;
    
    container.innerHTML = genres.map(g => `
        <label>
            <input type="checkbox" data-genre="${g.id}"> ${g.name}
        </label>
    `).join('');
}

// ==========================================
// DEALS PAGE
// ==========================================
async function initDealsPage() {
    const container = document.getElementById('deals-container');
    const storeFilter = document.getElementById('store-filter');
    
    if (container) container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading deals...</p></div>';
    
    // Load stores for filter
    try {
        const stores = await api.getStores();
        if (storeFilter && stores.length > 0) {
            storeFilter.innerHTML = '<option value="">All Stores</option>' + 
                stores.map(s => `<option value="${s.storeID}">${s.storeName}</option>`).join('');
        }
    } catch (e) {
        console.warn('Could not load stores:', e);
    }
    
    // Load initial deals
    await loadDeals();
    
    // Setup filter listeners
    storeFilter?.addEventListener('change', loadDeals);
    document.getElementById('sort-filter')?.addEventListener('change', loadDeals);
}

async function loadDeals() {
    const container = document.getElementById('deals-container');
    const storeFilter = document.getElementById('store-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading deals...</p></div>';
    
    try {
        const storeID = storeFilter?.value || null;
        let deals = await api.getCurrentDeals(storeID);
        
        // Sort deals
        const sortBy = sortFilter?.value || 'deal';
        if (sortBy === 'price') {
            deals.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
        } else if (sortBy === 'savings') {
            deals.sort((a, b) => parseFloat(b.savings) - parseFloat(a.savings));
        }
        
        renderDeals(deals, 'deals-container');
    } catch (error) {
        console.error('Failed to load deals:', error);
        container.innerHTML = `
            <div class="error-container">
                <h3>❌ Failed to load deals</h3>
                <p>${error.message || 'Please try again later.'}</p>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// ==========================================
// FREE GAMES PAGE
// ==========================================
async function initFreeGamesPage() {
    // Load initial free games
    await loadFreeGames();
    
    // Setup category filter listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            await loadFreeGames(category);
        });
    });
}

async function loadFreeGames(category = null) {
    const container = document.getElementById('free-games-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading free games...</p></div>';
    
    try {
        const games = await api.getFreeToPlayGames(category);
        renderFreeGames(games, 'free-games-container');
    } catch (error) {
        console.error('Failed to load free games:', error);
        container.innerHTML = `
            <div class="error-container">
                <h3>❌ Failed to load free games</h3>
                <p>${error.message || 'Please try again later.'}</p>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// ==========================================
// COMPARISON PAGE
// ==========================================
async function initComparisonPage() {
    // Setup search functionality
    const searchInput = document.getElementById('compare-search');
    const searchBtn = document.getElementById('compare-search-btn');
    const searchResults = document.getElementById('search-results');
    
    searchBtn?.addEventListener('click', async () => {
        const query = searchInput?.value.trim();
        if (!query) return;
        
        searchResults.innerHTML = '<p>Searching...</p>';
        
        try {
            const data = await api.searchGames(query);
            if (data.results && data.results.length > 0) {
                searchResults.innerHTML = data.results.slice(0, 5).map(game => `
                    <div class="search-result-item" data-game-id="${game.id}">
                        <img src="${game.background_image || 'https://via.placeholder.com/50x50'}" alt="${game.name}">
                        <span>${game.name}</span>
                        <button class="btn-small add-to-compare">Add</button>
                    </div>
                `).join('');
                
                // Add click handlers
                searchResults.querySelectorAll('.add-to-compare').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const item = e.target.closest('.search-result-item');
                        const gameId = item.dataset.gameId;
                        const game = await api.getGameDetails(gameId);
                        
                        const result = gameComparison.addGame(game);
                        if (result.success) {
                            renderComparisonSlot(game, result.slot);
                            updateComparisonTable();
                            searchResults.innerHTML = '';
                            searchInput.value = '';
                        } else {
                            alert(result.message);
                        }
                    });
                });
            } else {
                searchResults.innerHTML = '<p>No games found</p>';
            }
        } catch (error) {
            searchResults.innerHTML = '<p>Search failed. Try again.</p>';
        }
    });
    
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn?.click();
    });
    
    // Setup slot removal handlers
    document.querySelectorAll('.comparison-slot').forEach((slot, index) => {
        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-game')) {
                gameComparison.removeGame(index);
                slot.innerHTML = `
                    <div class="slot-empty">
                        <span>+</span>
                        <p>Add Game</p>
                    </div>
                `;
                updateComparisonTable();
            }
        });
    });
}

function updateComparisonTable() {
    const tableWrapper = document.getElementById('comparison-table');
    const comparisonData = gameComparison.getComparisonData();
    
    if (!comparisonData || comparisonData.games.length < 2) {
        tableWrapper.style.display = 'none';
        return;
    }
    
    tableWrapper.style.display = 'block';
    renderComparisonTable(comparisonData);
}
