export class header{
    constructor(){
        this.container = document.querySelector('.header');
        if (this.container) {
            this.render();
        }
    }

    render(){
        if (!this.container) return;
        this.container.innerHTML = `
         <div class="container header-container">
        <a href="index.html" class="logo">
            <span class="logo-icon"><img src="https://i.pinimg.com/736x/bb/9a/d2/bb9ad2a97b7d12fb381c6f61b91d5e11.jpg" alt="KALI Game Store Logo" width="40" height="40" decoding="async" fetchpriority="low" loading="lazy"></span>
            <span class="logo-text">KALI GAME STORE</span>
        </a>
        <nav class="main-nav" id="main-nav">
            <a href="index.html" class="nav-link">Browse</a>
            <a href="upcoming.html" class="nav-link">Upcoming</a>
            <a href="wishlist.html" class="nav-link">Wishlist <span id="wishlist-count-nav" class="wishlist-count-badge">(0)</span></a>
            <a href="comparison.html" class="nav-link">Compare</a>
        </nav>
        <div class="header-right">
            <div class="search-container">
                <input type="text" id="search-input" placeholder="Search for games...">
                <button id="search-btn" aria-label="Search">🔍</button>
            </div>
            <div class="header-icons">
            </div>
            <!-- Hamburger menu button for mobile -->
            <button class="hamburger" id="hamburger-btn" aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </div>
        `
    }

};



