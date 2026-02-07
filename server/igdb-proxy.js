require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IGDB Configuration
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
let IGDB_ACCESS_TOKEN = null;
let TOKEN_EXPIRES_AT = 0;

// Get IGDB access token
async function getAccessToken() {
    try {
        if (IGDB_ACCESS_TOKEN && Date.now() < TOKEN_EXPIRES_AT) {
            return IGDB_ACCESS_TOKEN;
        }

        const response = await axios.post('https://id.twitch.tv/oauth2/token', {
            client_id: IGDB_CLIENT_ID,
            client_secret: IGDB_CLIENT_SECRET,
            grant_type: 'client_credentials'
        });

        IGDB_ACCESS_TOKEN = response.data.access_token;
        TOKEN_EXPIRES_AT = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min before expiry
        return IGDB_ACCESS_TOKEN;
    } catch (error) {
        console.error('IGDB token error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with IGDB');
    }
}

// IGDB API proxy endpoint
app.post('/igdb', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const token = await getAccessToken();
        const response = await axios.post(
            'https://api.igdb.com/v4/games',
            query,
            {
                headers: {
                    'Client-ID': IGDB_CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('IGDB request failed:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'IGDB API request failed',
            details: error.response?.data?.message || error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        igdb: IGDB_ACCESS_TOKEN ? 'authenticated' : 'unauthenticated',
        serverTime: new Date().toISOString()
    });
});

// ── FreeToGame proxy (avoids browser CORS) ──
app.get('/api/freetogame/games', async (req, res) => {
    try {
        const { platform, category } = req.query;
        let url = `https://www.freetogame.com/api/games?platform=${platform || 'all'}`;
        if (category) url += `&category=${category}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('FreeToGame proxy error:', error.message);
        res.status(500).json({ error: 'FreeToGame API request failed' });
    }
});

app.get('/api/freetogame/game', async (req, res) => {
    try {
        const { id } = req.query;
        const response = await axios.get(`https://www.freetogame.com/api/game?id=${id}`);
        res.json(response.data);
    } catch (error) {
        console.error('FreeToGame game detail error:', error.message);
        res.status(500).json({ error: 'FreeToGame detail request failed' });
    }
});

// Serve static frontend in production (Vite build output)
const path = require('path');
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for any route not matched above
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Game Store Server running on http://localhost:${PORT}`);
    console.log(`Serving static files from ${distPath}`);
});
