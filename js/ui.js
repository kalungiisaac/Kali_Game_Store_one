// ui.js

// Render games grid (standard view — with buttons)
export function renderGames(games, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!games || games.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No games found</h3>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = games.map(game => `
        <article class="game-card" 
                 data-id="${game.id}" 
                 data-name="${game.name}" 
                 data-image="${game.background_image || ''}">
            <div class="wishlist-icon">
                <span class="heart" title="Add to Wishlist">♥</span>
            </div>
            <div class="card-image-wrapper">
                <button class="watch-trailer-btn" onclick="event.stopPropagation(); window.openTrailer('${(game.name || '').replace(/'/g, "\\'")}')">
                    ▶ Trailer
                </button>
                <img src="${game.background_image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${game.name || 'Game'}" 
                     class="game-cover"
                     loading="lazy"
                     onclick="window.location.href='game-details.html?id=${game.id}'">
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.name || 'Unknown'}</h3>
                <div class="game-meta">
                    <span class="release-date">${game.released ? new Date(game.released).toLocaleDateString() : 'TBA'}</span>
                    <span class="rating">${game.rating ? `⭐ ${game.rating.toFixed(1)}` : 'No rating'}</span>
                </div>
                <div class="platforms">
                    ${(game.parent_platforms || []).slice(0, 3).map(p => 
                        `<span class="platform">${p?.platform?.name || ''}</span>`
                    ).join('')}
                </div>
                <button class="btn download-btn" onclick="event.stopPropagation(); window.location.href='game-details.html?id=${game.id}'">
                    VIEW DETAILS
                </button>
            </div>
        </article>
    `).join('');
    
    // Update wishlist indicators after rendering
    updateWishlistHearts();
}

// Render games with download button (wireframe style)
export function renderGamesWithDownload(games, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!games || games.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No games found</h3>
                <p>Check back later for new games</p>
            </div>
        `;
        return;
    }
    
    // Sort by rating (most interesting first)
    const sortedGames = [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    container.innerHTML = sortedGames.map(game => {
        return `
            <article class="game-card wireframe-card" 
                     data-id="${game.id}" 
                     data-name="${game.name}" 
                     data-image="${game.background_image || ''}">
                <div class="card-image">
                    <button class="watch-trailer-btn" data-game-name="${game.name}" onclick="event.stopPropagation(); window.openTrailer('${game.name.replace(/'/g, "\\'")}')">
                        ▶ Trailer
                    </button>
                    <img src="${game.background_image || 'https://via.placeholder.com/200x150?text=No+Image'}" 
                         alt="${game.name}" 
                         class="game-cover"
                         loading="lazy"
                         onclick="window.location.href='game-details.html?id=${game.id}'">
                </div>
                <div class="card-content">
                    <h4 class="card-title">${game.name}</h4>
                    <p class="card-platform">${game.parent_platforms?.[0]?.platform?.name || 'Multi-Platform'} ⭐ ${game.rating?.toFixed(1) || 'N/A'}</p>
                    <p class="card-meta">${game.released ? new Date(game.released).toLocaleDateString() : 'TBA'}${game.metacritic ? ` | Metacritic: ${game.metacritic}` : ''}</p>
                    <button class="btn download-btn" onclick="event.stopPropagation(); window.location.href='game-details.html?id=${game.id}'">
                        VIEW DETAILS
                    </button>
                </div>
            </article>
        `;
    }).join('');
    
    updateWishlistHearts();
}

// Update wishlist heart icons
function updateWishlistHearts() {
    const wishlistData = JSON.parse(localStorage.getItem('gameLibrary_wishlist') || '[]');
    document.querySelectorAll('.game-card').forEach(card => {
        const gameId = parseInt(card.dataset.id);
        const heart = card.querySelector('.heart');
        if (heart && wishlistData.some(g => g.id === gameId)) {
            heart.classList.add('active');
        }
    });
}

// Render wishlist page
export function renderWishlist(wishlistItems) {
    const container = document.getElementById('wishlist-container');
    if (!container) return;
    
    if (!wishlistItems || wishlistItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state" id="empty-wishlist">
                <h3>Your wishlist is empty</h3>
                <p>Browse games and add them to your wishlist!</p>
                <a href="index.html" class="btn">Browse Games</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="games-grid wishlist-grid">
            ${wishlistItems.map(game => `
                <article class="game-card" 
                         data-id="${game.id}" 
                         data-name="${game.name}" 
                         data-image="${game.background_image || ''}"
                         onclick="window.location.href='game-details.html?id=${game.id}'">
                    <div class="wishlist-icon">
                        <span class="heart active" title="Remove from Wishlist">♥</span>
                    </div>
                    <img src="${game.background_image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                         alt="${game.name}" 
                         class="game-cover"
                         loading="lazy">
                    <div class="game-info">
                        <h3 class="game-title">${game.name}</h3>
                        <button class="btn btn-secondary remove-btn" 
                                data-id="${game.id}"
                                onclick="event.stopPropagation();">
                            Remove
                        </button>
                    </div>
                </article>
            `).join('')}
        </div>
    `;
    
    // Add remove button handlers
    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameId = parseInt(btn.dataset.id);
            let wishlist = JSON.parse(localStorage.getItem('gameLibrary_wishlist') || '[]');
            wishlist = wishlist.filter(g => g.id !== gameId);
            localStorage.setItem('gameLibrary_wishlist', JSON.stringify(wishlist));
            renderWishlist(wishlist);
            
            // Update count
            const countEl = document.getElementById('wishlist-count');
            if (countEl) countEl.textContent = `(${wishlist.length})`;
        });
    });
}

export function renderGameDetails(game) {
    if (!game) {
        const mainContent = document.querySelector('.game-detail');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-container">
                    <h2>Game Not Found</h2>
                    <p>We couldn't load the game details. Please try again later.</p>
                    <a href="index.html" class="btn">Return to Browse</a>
                </div>
            `;
        }
        return;
    }

    // Update game title
    const titleEl = document.getElementById('game-title');
    if (titleEl) titleEl.textContent = game.name;
    
    // Update developer/publisher info
    const developerEl = document.getElementById('developer');
    const publisherEl = document.getElementById('publisher');
    if (developerEl) {
        developerEl.textContent = game.developers?.[0]?.name || 'Unknown Studio';
    }
    if (publisherEl) {
        publisherEl.textContent = game.publishers?.[0]?.name || 'Unknown Publisher';
    }
    
    // Update description
    const descEl = document.getElementById('game-description');
    if (descEl) {
        const shortDesc = game.description_raw?.substring(0, 200) || 'No description available.';
        descEl.innerHTML = `<p>${shortDesc}...</p>`;
    }
    
    // Update overview
    const overviewEl = document.getElementById('game-overview');
    if (overviewEl) {
        overviewEl.textContent = game.description_raw?.substring(0, 300) || 'No overview available.';
    }
    
    // Update cover/hero image
    const coverEl = document.getElementById('game-cover');
    if (coverEl) {
        coverEl.src = game.background_image || 'https://via.placeholder.com/600x300?text=No+Image';
    }
    
    // Update game size using playtime data
    const sizeEl = document.getElementById('game-size');
    if (sizeEl) {
        sizeEl.textContent = game.playtime ? `${game.playtime}h playtime` : '--';
    }
    
    // Update genres
    const genresEl = document.getElementById('genres');
    if (genresEl) {
        genresEl.textContent = game.genres?.map(g => g.name).join(', ') || 'N/A';
    }
    
    // Update release date
    const releaseDateEl = document.getElementById('release-date');
    if (releaseDateEl) {
        releaseDateEl.textContent = game.released ? 
            new Date(game.released).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
            'TBA';
    }
    
    // Update platforms
    const platformsEl = document.getElementById('platforms');
    if (platformsEl) {
        const platforms = game.platforms?.map(p => p.platform?.name || p.name).join(', ') || 
                         game.parent_platforms?.map(p => p.platform.name).join(', ') || 
                         'N/A';
        platformsEl.textContent = platforms;
    }
    
    // Update rating
    const ratingEl = document.getElementById('rating');
    if (ratingEl) {
        ratingEl.textContent = game.rating ? `${game.rating.toFixed(1)}/5 ⭐` : 'N/A';
    }

    // Update screenshots
    renderScreenshots(game);
}

function renderScreenshots(game) {
    const container = document.getElementById('screenshots-container');
    if (!container) return;
    
    // Handle both IGDB screenshots and RAWG short_screenshots
    const screenshots = game.screenshots || game.short_screenshots || [];
    
    if (screenshots.length === 0) {
        container.innerHTML = '<p>No screenshots available</p>';
        return;
    }
    
    container.innerHTML = screenshots.slice(0, 5).map(screenshot => {
        // Handle different data structures from IGDB vs RAWG
        const imgUrl = screenshot.url 
            ? screenshot.url.replace('t_screenshot', 't_1080p')
            : screenshot.image || screenshot;
        return `
            <div class="screenshot-item">
                <img src="${imgUrl}" 
                     alt="Game screenshot"
                     loading="lazy">
            </div>
        `;
    }).join('');
}

function renderVideos(game) {
    const videoContainer = document.getElementById('video-container');
    if (!videoContainer || !game.videos || game.videos.length === 0) return;
    
    videoContainer.style.display = 'block';
    videoContainer.innerHTML = game.videos.slice(0, 2).map(video => `
        <div class="video-item">
            <iframe width="100%" height="315" 
                    src="https://www.youtube.com/embed/${video.id}"
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
            <h4>${video.name || 'Game Trailer'}</h4>
        </div>
    `).join('');
}

// ==========================================
// DEALS RENDERING
// ==========================================

export function renderDeals(deals, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!deals || deals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No deals found</h3>
                <p>Check back later for new deals!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = deals.map(deal => {
        const savings = Math.round(parseFloat(deal.savings));
        const normalPrice = parseFloat(deal.normalPrice).toFixed(2);
        const salePrice = parseFloat(deal.salePrice).toFixed(2);
        
        return `
            <article class="deal-card">
                <div class="deal-image">
                    <img src="${deal.thumb}" 
                         alt="${deal.title}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x150?text=No+Image'">
                    ${savings > 0 ? `<span class="deal-badge">-${savings}%</span>` : ''}
                </div>
                <div class="deal-info">
                    <h3 class="deal-title">${deal.title}</h3>
                    <div class="deal-prices">
                        ${savings > 0 ? `<span class="original-price">$${normalPrice}</span>` : ''}
                        <span class="sale-price">${salePrice === '0.00' ? 'FREE' : `$${salePrice}`}</span>
                    </div>
                    <div class="deal-meta">
                        <span class="deal-rating">⭐ ${deal.dealRating || 'N/A'}</span>
                        <span class="metacritic">${deal.metacriticScore ? `Metacritic: ${deal.metacriticScore}` : ''}</span>
                    </div>
                    <a href="https://www.cheapshark.com/redirect?dealID=${deal.dealID}" 
                       target="_blank" 
                       class="btn btn-secondary deal-btn">
                        Get Deal
                    </a>
                </div>
            </article>
        `;
    }).join('');
}

// ==========================================
// FREE GAMES RENDERING
// ==========================================

export function renderFreeGames(games, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!games || games.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No free games found</h3>
                <p>Try a different category</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = games.map(game => `
        <article class="game-card free-game-card">
            <div class="free-badge">FREE</div>
            <img src="${game.thumbnail}" 
                 alt="${game.title}" 
                 class="game-cover"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <div class="game-meta">
                    <span class="genre">${game.genre}</span>
                    <span class="platform">${game.platform}</span>
                </div>
                <p class="game-desc">${game.short_description?.substring(0, 100) || ''}...</p>
                <a href="${game.game_url}" 
                   target="_blank" 
                   class="btn btn-secondary">
                    Play Now
                </a>
            </div>
        </article>
    `).join('');
}

// ==========================================
// RECOMMENDATIONS RENDERING
// ==========================================

export function renderRecommendations(games, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!games || games.length === 0) {
        container.innerHTML = '<p>No recommendations available</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="recommendations-grid">
            ${games.map(game => `
                <div class="recommendation-card" onclick="window.location.href='game-details.html?id=${game.id}'">
                    <img src="${game.background_image || 'https://via.placeholder.com/150x100'}" 
                         alt="${game.name}"
                         loading="lazy">
                    <div class="rec-info">
                        <h4>${game.name}</h4>
                        <span class="rec-rating">⭐ ${game.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ==========================================
// COMPARISON RENDERING
// ==========================================

export function renderComparisonSlot(game, slotIndex) {
    const slot = document.getElementById(`slot-${slotIndex + 1}`);
    if (!slot) return;
    
    slot.innerHTML = `
        <div class="slot-filled">
            <button class="remove-game" title="Remove">&times;</button>
            <img src="${game.background_image || 'https://via.placeholder.com/200x120'}" 
                 alt="${game.name}">
            <h4>${game.name}</h4>
            <p class="slot-rating">⭐ ${game.rating?.toFixed(2) || 'N/A'}</p>
        </div>
    `;
    
    // Update column header
    const colHeader = document.getElementById(`col-${slotIndex + 1}`);
    if (colHeader) {
        colHeader.textContent = game.name.length > 20 ? game.name.substring(0, 20) + '...' : game.name;
    }
}

export function renderComparisonTable(comparisonData) {
    const tbody = document.getElementById('comparison-body');
    if (!tbody) return;
    
    tbody.innerHTML = comparisonData.attributes.map(attr => `
        <tr>
            <td class="attr-name">${attr.name}</td>
            ${attr.values.map((val, idx) => `
                <td class="${attr.highlightIndex === idx ? 'highlight-winner' : ''}">${val}</td>
            `).join('')}
            ${attr.values.length < 3 ? '<td>-</td>'.repeat(3 - attr.values.length) : ''}
        </tr>
    `).join('');
}
