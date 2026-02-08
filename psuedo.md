# Game Store Library - Complete Pseudocode Documentation

## Project Overview
A modern web application for browsing, searching, filtering, and managing video game collections. Users can explore thousands of games, view detailed information, watch trailers, and maintain a personal wishlist using browser localStorage.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   HTML Pages (Frontend)                  │
│  ┌──────────────┬──────────┬──────────┬─────────────┐  │
│  │ index.html   │ game-    │ upcoming │ comparison  │  │
│  │ (Browse)     │ details  │ .html    │ .html       │  │
│  │              │ .html    │          │             │  │
│  └──────────────┴──────────┴──────────┴─────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ (Imports)
┌─────────────────────────────────────────────────────────┐
│              JavaScript Module Layer                     │
│  ┌─────────┬──────┬────────┬──────────┬────────────┐   │
│  │ main.js │ ui.js│ api.js │ filter.js│ wishlist.js│   │
│  │         │      │        │          │            │   │
│  │ + comparison.js, recommendations.js             │   │
│  └─────────┴──────┴────────┴──────────┴────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ (Fetches)
┌─────────────────────────────────────────────────────────┐
│              External APIs & Local Storage               │
│  ┌────────────┬──────────┬──────────────┬────────────┐ │
│  │ RAWG API   │Google    │ YouTube API  │ localStorage│ │
│  │(Game Data) │ IGDB API │ (Trailers)   │(Wishlist)   │ │
│  └────────────┴──────────┴──────────────┴────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Core Modules Pseudocode

### 1. API MODULE (api.js)
**Purpose**: Handle all external API calls with rate limiting and error handling

```pseudocode
CLASS Api:
    PROPERTIES:
        - API_KEY: 'd2663c76d7194a21821130c805530d61'
        - BASE_URL: 'https://api.rawg.io/api'
        - RATE_LIMIT: Track max 40 requests per minute
        - YOUTUBE_API_KEY: For trailer searches
        - PROXY_URL: IGDB proxy for development/production
    
    CONSTRUCTOR():
        Initialize rate limiter timer (runs every 30 seconds)
    
    METHOD fetchWithRateLimit(url):
        WHILE requests in last minute >= MAX_REQUESTS:
            WAIT until oldest request is outside 1-minute window
        END WHILE
        ADD current timestamp to request log
        RETURN fetch(url)
    
    METHOD getPopularGames(pageNumber):
        BUILD_URL = append pageNumber to RAWG API
        RESPONSE = fetchWithRateLimit(URL) with parameters:
            - orderBy: '-rating'
            - platform: '4' (PC)
            - page_size: '20'
        PARSE response JSON
        RETURN games array
    
    METHOD searchGames(searchTerm, pageNumber):
        BUILD_URL = RAWG API search endpoint with searchTerm
        RESPONSE = fetchWithRateLimit(URL)
        RETURN filtered games
    
    METHOD getUpcomingGames():
        CALCULATE dates_gte = TODAY
        CALCULATE dates_lte = TODAY + 180 days
        BUILD_URL with date range parameters
        RESPONSE = fetchWithRateLimit(URL)
        RETURN upcoming games sorted by release date
    
    METHOD getGameDetails(gameId):
        BUILD_URL = RAWG API for specific game
        FETCH game data + screenshots + trailers
        IF IGDB_AVAILABLE:
            FETCH enhanced details from IGDB proxy
        END IF
        RETURN combined game details object
    
    METHOD getGameTrailer(gameName):
        TRY:
            SEARCH YouTube for "gameName trailer"
            IF found:
                RETURN YouTube embed link
            ELSE:
                RETURN fallback search URL
        CATCH error:
            RETURN error fallback
    
    METHOD filterGames(filterParams):
        BUILD_URL with filter parameters:
            - platforms: comma-separated IDs
            - genres: comma-separated IDs
            - ordering: sort field
            - search: search query
        RESPONSE = fetchWithRateLimit(URL)
        RETURN filtered games array
```

---

### 2. MAIN MODULE (main.js)
**Purpose**: Initialize the application and handle page-specific logic

```pseudocode
FUNCTION openTrailer(gameName):
    GET trailer-modal element
    SET modal to active/visible
    SHOW loading state
    
    TRY:
        trailer = api.getGameTrailer(gameName)
        IF trailer source is YouTube:
            EMBED YouTube iframe
        ELSE IF trailer source is RAWG:
            EMBED video player
        ELSE:
            SHOW YouTube search fallback link
    CATCH error:
        SHOW error message + search fallback

FUNCTION closeTrailer():
    HIDE trailer-modal
    CLEAR container content

FUNCTION setActiveNavLink():
    GET current page URL
    FOR each nav link:
        IF link href matches current page:
            ADD 'active' class
        ELSE:
            REMOVE 'active' class
        END IF
    END FOR

EVENT LISTENER: DOMContentLoaded:
    LOAD header partial HTML
    LOAD footer partial HTML
    CREATE Wishlist instance
    INITIALIZE wishlist
    SET active navigation link
    SETUP trailer modal close handlers (click, escape key)
    
    IF current page is index-page:
        CALL initBrowsePage()
    ELSE IF current page is upcoming-page:
        CALL initUpcomingPage()
    ELSE IF current page is game-details-page:
        CALL initGameDetailsPage()
    ELSE IF current page is comparison-page:
        CALL initComparisonPage()
    ELSE IF current page is wishlist-page:
        CALL initWishlistPage()

FUNCTION initBrowsePage():
    CREATE gameFilter instance
    CREATE gameComparison instance
    LOAD initial games (popular, sorted by rating)
    RENDER games grid
    SETUP filter event listeners:
        - Platform checkbox changes
        - Genre checkbox changes
        - Sorting dropdown changes
    SETUP pagination buttons
    SETUP search bar with debounce (300ms)
    SETUP compare button functionality

FUNCTION initUpcomingPage():
    LOAD upcoming games (next 180 days)
    SORT by release date ascending
    RENDER games grid
    SETUP pagination

FUNCTION initGameDetailsPage():
    GET game ID from URL parameters
    LOAD full game details
    RENDER detailed game information:
        - Cover image
        - Title, rating, genres
        - Platforms, release date
        - Description
        - Screenshots gallery
        - Developer/Publisher info
    SETUP wishlist button
    SETUP trailer player

FUNCTION initComparisonPage():
    SETUP comparison slots
    RENDER empty comparison table
    SETUP game search/add functionality
    SETUP comparison controls:
        - Add games to compare
        - Remove games from comparison
        - Update comparison table

FUNCTION initWishlistPage():
    LOAD wishlist from localStorage
    RENDER wishlist items
    SETUP remove from wishlist buttons
    SHOW wishlist statistics
```

---

### 3. UI MODULE (ui.js)
**Purpose**: Render HTML game cards and display components

```pseudocode
FUNCTION renderGames(games, containerId):
    container = GET_ELEMENT(containerId)
    IF games is empty:
        SHOW empty state message
        RETURN
    
    FOR each game in games:
        CREATE game card HTML with:
            - Game cover image (lazy loaded)
            - Game title
            - Release date
            - Rating (5-star display)
            - Platforms
            - Wishlist heart icon
            - View Details button
            - Watch Trailer button
    END FOR
    
    INSERT HTML into container
    CALL updateWishlistHearts()

FUNCTION renderGamesWithDownload(games, containerId):
    SORT games by rating (highest first)
    FOR each game:
        CREATE simplified card with:
            - Game image
            - Title + rating
            - Brief info
            - "Download" button (navigates to details)
    END FOR

FUNCTION renderGameDetails(game):
    container = GET_ELEMENT('game-details-container')
    CREATE detailed layout:
        - Large hero image/banner
        - Title, release date, rating
        - Genres and platforms
        - Full description
        - Developer/Publisher
        - Screenshots gallery (carousel)
        - Wishlist toggle button
    
    INSERT into container
    SETUP image gallery lightbox
    SETUP wishlist button event

FUNCTION renderWishlist(games):
    container = GET_ELEMENT('wishlist-container')
    
    IF games length is 0:
        SHOW empty wishlist message
        RETURN
    
    stats = CALCULATE:
        - Total games in wishlist
        - Most common genre
        - Average rating
    
    DISPLAY stats
    
    FOR each game in games:
        CREATE card with:
            - Game image
            - Title, rating
            - Remove button
            - View details link
    END FOR

FUNCTION updateWishlistHearts():
    FOR each game card on page:
        gameId = GET_ATTRIBUTE('data-id')
        IF gameId is in wishlist:
            ADD 'active' class to heart icon
        ELSE:
            REMOVE 'active' class
        END IF
    END FOR

FUNCTION renderComparisonSlot(game, slotNumber):
    CREATE comparison card for slot
    DISPLAY game details:
        - Image
        - Title
        - Key stats
        - Remove button

FUNCTION renderComparisonTable(games):
    CREATE table with:
        - Rows: comparison attributes (rating, genres, platforms, etc)
        - Columns: each game being compared
    
    POPULATE cells with game data
    HIGHLIGHT differences

FUNCTION renderDeals():
    GET games with special deals/discounts
    DISPLAY deal cards with:
        - Game info
        - Original price
        - Discount percentage
        - Deal expiration

FUNCTION renderRecommendations(games):
    SORT games by:
        - Similar genres to user viewed games
        - Similar rating ranges
    DISPLAY recommendation cards

FUNCTION renderDeals():
    FETCH games with discount info
    DISPLAY prominent deal cards
```

---

### 4. FILTER MODULE (filter.js)
**Purpose**: Manage game filtering logic and parameters

```pseudocode
CLASS GameFilter:
    PROPERTIES:
        - currentFilters: {
            platforms: [],
            genres: [],
            ordering: '-rating',
            search: ''
          }
        - allGames: []
    
    METHOD setFilter(filterType, value):
        IF filterType is array-type (platforms, genres):
            IF value already in array:
                REMOVE value from array
            ELSE:
                ADD value to array
        ELSE:
            SET filterType = value
        END IF
    
    METHOD clearFilters():
        RESET currentFilters to default state
        platforms = []
        genres = []
        ordering = '-rating'
        search = ''
    
    METHOD getFilters():
        RETURN copy of currentFilters
    
    METHOD buildFilterParams():
        params = {}
        
        IF platforms not empty:
            params.platforms = join platforms with comma
        END IF
        
        IF genres not empty:
            params.genres = join genres with comma
        END IF
        
        params.ordering = currentFilters.ordering
        
        IF search not empty:
            params.search = search
        END IF
        
        RETURN params
    
    METHOD applyFilters(games):
        filtered = games
        
        FOR each platform filter:
            filtered = FILTER where game has platform
        END FOR
        
        FOR each genre filter:
            filtered = FILTER where game has genre
        END FOR
        
        IF search query:
            filtered = FILTER where game name contains search
        END IF
        
        SORT by currentFilters.ordering
        
        RETURN filtered

INSTANCE: gameFilter = new GameFilter()
EXPORT: gameFilter
```

---

### 5. WISHLIST MODULE (wishlist.js)
**Purpose**: Manage user's saved games in browser localStorage

```pseudocode
CLASS Wishlist:
    PROPERTIES:
        - key: 'gameLibrary_wishlist'
        - wishlist: array loaded from localStorage
    
    CONSTRUCTOR():
        wishlist = PARSE localStorage[key] or empty array []
    
    METHOD getWishlist():
        RETURN wishlist array
    
    METHOD isInWishlist(gameId):
        FOR each game in wishlist:
            IF game.id == gameId:
                RETURN true
        END FOR
        RETURN false
    
    METHOD addToWishlist(game):
        IF NOT isInWishlist(game.id):
            ADD game object to wishlist array
            SAVE wishlist to localStorage
            CALL updateCount()
            RETURN true
        RETURN false
    
    METHOD removeFromWishlist(gameId):
        wishlist = FILTER games where id != gameId
        SAVE to localStorage
        CALL updateCount()
        RETURN true
    
    METHOD toggleWishlist(game):
        IF game in wishlist:
            CALL removeFromWishlist(game.id)
        ELSE:
            CALL addToWishlist(game)
        END IF
        
        UPDATE wishlist indicators on page
        UPDATE count display
    
    METHOD updateCount():
        countElement = GET_ELEMENT('wishlist-count')
        SET textContent = '(' + wishlist.length + ')'
    
    METHOD updateWishlistIndicators():
        FOR each wishlist heart icon on page:
            IF game in wishlist:
                ADD 'active' class
            ELSE:
                REMOVE 'active' class
            END IF
        END FOR
    
    METHOD init():
        EVENT LISTENER on all wishlist hearts:
            WHEN clicked:
                TOGGLE wishlist for that game
        
        UPDATE all visual indicators

INSTANCE: Create in main.js when page loads
EXPORT: Wishlist class
```

---

### 6. COMPARISON MODULE (comparison.js)
**Purpose**: Allow users to compare multiple games side-by-side

```pseudocode
CLASS GameComparison:
    PROPERTIES:
        - comparisonSlots: [null, null, null, null] (max 4 games)
        - comparisonData: {}
    
    METHOD addGameToComparison(game):
        FOR i = 0 to 3:
            IF comparisonSlots[i] is null:
                comparisonSlots[i] = game
                RENDER updated comparison
                RETURN true
            END IF
        END FOR
        RETURN false (no empty slots)
    
    METHOD removeFromComparison(slotIndex):
        comparisonSlots[slotIndex] = null
        RENDER updated comparison
    
    METHOD buildComparisonData():
        attributes = [
            'rating', 'meta_critic', 'released', 'genres',
            'platforms', 'developers', 'publishers', 'playtime'
        ]
        
        comparisonData = {}
        
        FOR each attribute:
            values = GET attribute values from all games
            comparisonData[attribute] = values
        END FOR
        
        RETURN comparisonData
    
    METHOD renderComparison():
        IF all slots empty:
            SHOW 'Add games to compare' message
            RETURN
        END IF
        
        CALL buildComparisonData()
        RENDER comparison table with:
            - Rows: comparison attributes
            - Columns: each game in slot
            - Cell values: actual game data
            - Highlight differences
    
    METHOD getActiveGames():
        RETURN array of games in non-empty slots

INSTANCE: Create in main.js
EXPORT: GameComparison class
```

---

### 7. RECOMMENDATIONS MODULE (recommendations.js)
**Purpose**: Provide AI/algorithm-based game recommendations

```pseudocode
CLASS RecommendationEngine:
    PROPERTIES:
        - userViewHistory: array of viewed game IDs
        - userWishlist: reference to wishlist instance
    
    METHOD generateRecommendations(baseGames):
        recommendations = []
        
        FOR each baseGame in baseGames:
            similarGames = FIND games with:
                - Similar genres
                - Similar rating (±1 point)
                - Same or similar platforms
                - By same developer
        END FOR
        
        SCORE each game by:
            - Genre match: 40%
            - Rating similarity: 30%
            - Platform availability: 20%
            - Popularity: 10%
        
        SORT by score descending
        REMOVE duplicates
        REMOVE games already in wishlist
        
        RETURN top 20 recommendations
    
    METHOD trackViewedGame(gameId):
        IF gameId NOT in userViewHistory:
            ADD to history (limit to last 50)
        END IF
    
    METHOD getPersonalizedRecommendations():
        IF wishlist empty:
            RETURN trending games
        END IF
        
        recommendations = GENERATE for each wishlist game
        COMBINE and deduplicate
        SORT by aggregate score
        
        RETURN top 25 recommendations

INSTANCE: Create on pages that use recommendations
EXPORT: RecommendationEngine class
```

---

## Page Flow Diagrams

### Browse Page (index.html)
```pseudocode
LOAD index.html
    ↓
INITIALIZE:
    - Load header/footer partials
    - Create filter, comparison, wishlist instances
    - Load first page of popular games
    - Render game grid
    ↓
USER INTERACTIONS:
    
    Filter Change:
        - User selects platform/genre checkbox
        - Filter applied
        - Games re-fetched with new params
        - Render updated grid
    
    Search:
        - User types in search box (debounced 300ms)
        - Filter applied
        - Fetch matching games
        - Render results
    
    Sort Change:
        - User selects sort option
        - Re-sort/re-fetch games
        - Render updated grid
    
    Wishlist Heart Click:
        - Toggle game in wishlist
        - Update heart color
        - Update count
    
    View Details Click:
        - Navigate to game-details.html?id=GAME_ID
    
    Trailer Click:
        - Fetch trailer from API
        - Open modal
        - Display video or fallback
    
    Compare Click:
        - Add game to comparison slots
        - Render comparison interface
    
    Pagination:
        - Load next/prev page
        - Re-render games
```

### Game Details Page (game-details.html)
```pseudocode
LOAD game-details.html?id=GAME_ID
    ↓
INITIALIZE:
    - Extract game ID from URL
    - Fetch full game details from API
    - Fetch alternative data from IGDB (if available)
    - Render detailed view:
        * Large cover image
        * Comprehensive stats
        * Description
        * Screenshots carousel
        * Developer/Publisher info
    ↓
USER INTERACTIONS:
    
    Wishlist Button Click:
        - Toggle game in wishlist
        - Update button appearance
    
    Trailer Click:
        - Fetch trailer
        - Display in modal
    
    Screenshot Click:
        - Open lightbox gallery
        - Navigate between screenshots
    
    Back Button:
        - Return to previous page (index or search)
    
    Similar Games Section:
        - Display recommendations
        - Click navigates to that game's details
```

### Comparison Page (comparison.html)
```pseudocode
LOAD comparison.html
    ↓
INITIALIZE:
    - Create comparison instance
    - Show empty comparison state
    ↓
USER INTERACTIONS:
    
    Search for Game:
        - Type game name in search box
        - Fetch matching games from API
        - Display search results
    
    Click on Game Result:
        - Add game to first available slot
        - Render updated comparison table
    
    Remove Game from Slot:
        - Clear slot
        - Re-render table
    
    View Details:
        - Click game title
        - Navigate to game-details.html?id=GAME_ID
    
    Comparison Table:
        - Shows side-by-side attributes
        - Highlights different values
        - All platforms, genres, stats visible
```

### Wishlist Page (wishlist.html)
```pseudocode
LOAD wishlist.html
    ↓
INITIALIZE:
    - Load wishlist from localStorage
    - RENDER cards for each game:
        * Game image
        * Title, rating
        * Genres, platforms
        * Remove button
        * View Details button
    - Calculate and display stats:
        * Total games
        * Most common genre
        * Average rating
    ↓
USER INTERACTIONS:
    
    Remove from Wishlist:
        - Click remove button
        - Delete from localStorage
        - Update display
        - Update counts
    
    View Details:
        - Click game card
        - Navigate to game-details.html?id=GAME_ID
    
    Sort Wishlist:
        - By rating (highest first)
        - By name (A-Z)
        - By date added
```

### Upcoming Page (upcoming.html)
```pseudocode
LOAD upcoming.html
    ↓
INITIALIZE:
    - Fetch games releasing in next 180 days
    - Filter out already released games
    - Sort by release date (ascending)
    - Render game grid with release dates prominent
    ↓
USER INTERACTIONS:
    
    Same as browse page:
        - Wishlist management
        - View details
        - Watch trailers
        - Compare games
    
    Release Date Filter:
        - Filter by month
        - Filter by quarter
        - Show nearest releases first
```

---

## Event Flow & Event Listeners

```pseudocode
// Navigation
ALL nav links:
    EVENT: click
    ACTION: Highlight active link based on current page

// Wishlist Management
ALL wishlist hearts / wishlist buttons:
    EVENT: click
    ACTION: Toggle game in wishlist
    SIDE EFFECTS: Update UI, update counts

// Game Cards
ALL game card images:
    EVENT: click
    ACTION: Navigate to game-details.html

// Trailer Modal
trailer-modal:
    EVENT: click on background
    ACTION: Close modal

trailer-close button:
    EVENT: click
    ACTION: Close modal

document:
    EVENT: keydown (Escape key)
    ACTION: Close trailer modal if open

// Filter Controls
platform checkboxes:
    EVENT: change
    ACTION: Apply filter, fetch new games, render

genre checkboxes:
    EVENT: change
    ACTION: Apply filter, fetch new games, render

sort dropdown:
    EVENT: change
    ACTION: Re-sort games or fetch new data, render

search input:
    EVENT: input (debounced 300ms)
    ACTION: Fetch matching games, render

// Pagination
pagination buttons (next/prev):
    EVENT: click
    ACTION: Load next/previous page, render new games

// Comparison
compare button:
    EVENT: click
    ACTION: Add game to comparison slots

remove from comparison:
    EVENT: click
    ACTION: Remove game from slot, re-render table
```

---

## Data Models

### Game Object Structure
```pseudocode
GAME = {
    id: integer,                    // Unique identifier
    name: string,                   // Game title
    slug: string,                   // URL-friendly name
    
    // Media
    background_image: string,       // Main cover image URL
    background_image_additional: string,
    screenshots: [],                // Array of screenshot objects
    
    // Ratings & Reviews
    rating: float,                  // Average rating (0-5)
    ratings_count: integer,         // Number of ratings
    metacritic: integer,            // Metacritic score (0-100)
    playtime: integer,              // Average hours played
    
    // Details
    released: date string,          // Release date (YYYY-MM-DD)
    description: string,            // Full description
    description_raw: string,
    
    // Classifications
    genres: [                        // Game genres
        { id, name, slug }
    ],
    platforms: [                     // Playable platforms
        { platform: { id, name } }
    ],
    parent_platforms: [              // Parent platform (PC, Console, Mobile)
        { platform: { id, name } }
    ],
    stores: [],                      // Where to buy
    
    // Credits
    developers: [                    // Development team
        { id, name, slug }
    ],
    publishers: [                    // Publishing companies
        { id, name, slug }
    ],
    
    // Engagement
    user_game: boolean,              // If user owns the game
    user_count: integer              // Number of users who own it
}
```

### Wishlist Item Structure
```pseudocode
WISHLIST_ITEM = {
    id: integer,                    // Game ID
    name: string,                   // Game name
    background_image: string,       // Cover image
    rating: float,                  // Rating
    released: string,               // Release date
    genres: [],                      // Genre array
    platforms: []                    // Platform array
}
```

### Filter Parameters
```pseudocode
FILTER_PARAMS = {
    platforms: string,              // Comma-separated platform IDs
    genres: string,                 // Comma-separated genre IDs
    ordering: string,               // '-rating', 'name', 'released', etc.
    search: string,                 // Search query
    page: integer,                  // Page number for pagination
    page_size: integer              // Items per page (20)
}
```

---

## API Endpoints Used

```pseudocode
// RAWG API Endpoints
GET /api/games                      // List games with filtering
GET /api/games/{id}                 // Get game details
GET /api/games/{id}/screenshots     // Get screenshots
GET /api/games/{id}/movies          // Get trailers
GET /api/games/{id}/stores          // Get store links
GET /api/platforms                  // Get platform list
GET /api/genres                      // Get genre list

// YouTube API
GET /youtube/v3/search              // Search for trailers

// IGDB Proxy (Optional)
POST /igdb/games                    // Get enhanced game data
```

---

## Error Handling Strategy

```pseudocode
TRY-CATCH Pattern:
    TRY:
        FETCH data from API
        PARSE response
        RENDER UI
    CATCH NetworkError:
        SHOW: "Network error. Check connection."
        OFFER: Retry button
    CATCH ParseError:
        LOG: Error to console
        SHOW: "Failed to load data"
        OFFER: Retry or go back
    CATCH RateLimitError:
        WAIT: Display wait time
        RETRY: Automatically retry when ready

Fallback Methods:
    Image not loading:
        USE: Placeholder image
    
    Trailer not found:
        SHOW: YouTube search link
    
    API unavailable:
        SHOW: Cached data if available
        OTHERWISE: Error message with alternatives
    
    Empty results:
        SHOW: "No games found. Try different filters."
    
    Wishlist corrupted:
        RESET: Clear localStorage
        SHOW: Notification to user
```

---

## localStorage Structure

```pseudocode
localStorage:
    gameLibrary_wishlist: JSON.stringify([
        {
            id: integer,
            name: string,
            background_image: string,
            rating: float,
            released: string,
            genres: [],
            platforms: []
        },
        // ... more games
    ])
```

---

## Rate Limiting Implementation

```pseudocode
RATE_LIMIT = {
    MAX_REQUESTS: 40
    PER_MINUTE: 60000  // milliseconds
    lastRequests: []   // timestamps
}

FUNCTION fetchWithRateLimit(url):
    CURRENT_TIME = Date.now()
    
    // Remove old requests outside 1-minute window
    FILTER lastRequests where (CURRENT_TIME - timestamp < 60000)
    
    // Check if at limit
    IF lastRequests.length >= MAX_REQUESTS:
        WAIT_TIME = 60000 - (CURRENT_TIME - firstRequest)
        SLEEP(WAIT_TIME)
    END IF
    
    // Record this request
    lastRequests.PUSH(Date.now())
    
    // Make the request
    RESPONSE = FETCH(url)
    RETURN RESPONSE

// Automatic cleanup
INTERVAL every 30 seconds:
    CLEAN up old timestamps from lastRequests
```

---

## Responsive Design Breakpoints

```pseudocode
CSS Media Queries:
    
    Mobile (< 768px):
        - 1 column game grid
        - Stacked filters
        - Full-width cards
        - Bottom navigation
    
    Tablet (768px - 1024px):
        - 2 column game grid
        - Side filter panel
        - Adjusted spacing
    
    Desktop (> 1024px):
        - 3-4 column game grid
        - Full filter sidebar
        - Hover effects enabled
        - Optimized spacing
```

---

## Key Features Summary

```pseudocode
✓ Browse Games by Rating
  - Load popular games sorted by rating
  - Pagination support
  - Lazy loading images

✓ Search & Filter
  - Search by game name
  - Filter by platforms
  - Filter by genres
  - Sort by rating, release date, name

✓ Game Details
  - Comprehensive game information
  - Screenshots gallery
  - Developer/Publisher info
  - Ratings and reviews
  - Watch trailers

✓ Wishlist Management
  - Add/remove games to wishlist
  - Persistent storage (localStorage)
  - Visual indicators
  - Wishlist count badge

✓ Game Comparison
  - Compare up to 4 games
  - Side-by-side attribute comparison
  - Highlight differences

✓ Trailers
  - YouTube integration
  - RAWG video support
  - Fallback search links

✓ Recommendations
  - Based on browsing history
  - Based on wishlist similarity
  - Personalized suggestions

✓ Responsive Design
  - Mobile, tablet, desktop optimized
  - Touch-friendly interface
  - Progressive enhancement

✓ Performance
  - Rate limiting (40 req/min)
  - Lazy image loading
  - Search debouncing
  - Modal efficiency
```

---

## Future Enhancement Possibilities

```pseudocode
// User Accounts
- Login/logout functionality
- Cloud sync for wishlist
- User profiles and recommendations
- Rating/review history

// Enhanced Features
- Price tracking
- Deal notifications
- Multiplayer game finder
- Game collection management
- Custom lists/categories

// AI Features
- ML-based recommendations
- Natural language search
- Game mood/vibe matching
- Community trend analysis

// Integrations
- Steam library import
- GOG integration
- Epic Games Store
- Social sharing
- Achievement tracking
```

---

## Development & Deployment

```pseudocode
DEVELOPMENT:
    - Vite dev server (fast hot reload)
    - Local development on localhost:5173
    - Mock/real API switching
    - Browser DevTools for debugging

BUILD:
    - npm run build
    - Vite bundles all modules
    - Minifies and optimizes
    - Generates dist/ folder

DEPLOYMENT:
    - Deploy dist/ folder to web server
    - Set VITE_RAWG_API_KEY environment variable
    - Configure IGDB proxy if needed
    - Enable CORS for API requests

TESTING:
    - Manual testing across browsers
    - Mobile device testing
    - API rate limit testing
    - Error condition handling
    - Wishlist persistence
```

---

This pseudocode provides a complete overview of the Game Store Library application architecture, data flow, and functionality. Each module works together to create a seamless game discovery and management experience.
