# Game Store Library

A modern web application for browsing, searching, and managing your video game collection and wishlist.

## Features

- **Browse Games**: Explore thousands of games from the RAWG database
- **Search**: Find games by name
- **Upcoming Releases**: See games releasing in the next 6 months
- **Wishlist**: Save games to your personal wishlist
- **Game Details**: View comprehensive information about each game
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Build Tool**: Vite
- **APIs**: 
  - RAWG API (primary data source)
  - IGDB API (enhanced game details - optional)
- **Styling**: Custom CSS with CSS variables

## Prerequisites

- Node.js (v16 or higher)
- npm
- A RAWG API key (get one free at https://rawg.io/apidocs)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd final
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```
   VITE_RAWG_API_KEY=rawg_api
   ```

4. **(Optional) Setup IGDB proxy server**
   
   If you want enhanced game details from IGDB:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your Twitch/IGDB credentials
   ```

## Running the Application

### Development Mode

Start only the frontend:
```bash
npm run dev
```

Start with IGDB proxy server (for enhanced details):
```bash
npm start
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
├── index.html          # Browse games page
├── game-details.html   # Individual game details page
├── upcoming.html       # Upcoming releases page
├── wishlist.html       # User's wishlist page
├── css/
│   ├── styles.css      # Main styles
│   └── responsive.css  # Media queries
├── js/
│   ├── api.js          # API integration (RAWG & IGDB)
│   ├── main.js         # Main application logic
│   ├── ui.js           # UI rendering functions
│   └── wishlist.js     # Wishlist management
├── partials/
│   ├── header.html     # Shared header component
│   └── footer.html     # Shared footer component
├── server/
│   ├── igdb-proxy.js   # IGDB proxy server
│   └── package.json    # Server dependencies
└── vite.config.js      # Vite configuration
```

## API Information

### RAWG API
- Free tier available
- Rate limited to 40 requests per minute
- Get your API key at: https://rawg.io/apidocs

### IGDB API (Optional)
- Requires Twitch developer account
- Provides additional game details like storyline and trailers
- Get credentials at: https://api.igdb.com

## License

MIT License
