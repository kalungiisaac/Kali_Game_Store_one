// comparison.js - Game comparison logic and display
import api from './api.js';

class GameComparison {
    constructor() {
        this.slots = [null, null, null];
        this.maxSlots = 4;
    }

    // Add game to comparison
    addGame(game) {
        const emptySlot = this.slots.findIndex(s => s === null);
        if (emptySlot === -1) {
            return { success: false, message: 'All comparison slots are full' };
        }
        
        // Check if game already added
        if (this.slots.some(s => s && s.id === game.id)) {
            return { success: false, message: 'Game already in comparison' };
        }
        
        this.slots[emptySlot] = game;
        return { success: true, slot: emptySlot };
    }

    // Remove game from comparison
    removeGame(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.maxSlots) {
            this.slots[slotIndex] = null;
            return true;
        }
        return false;
    }

    // Get all games in comparison
    getGames() {
        return [...this.slots];
    }

    // Get game in specific slot
    getGame(slotIndex) {
        return this.slots[slotIndex];
    }

    // Clear all slots
    clearAll() {
        this.slots = [null, null, null];
    }

    // Get comparison data
    getComparisonData() {
        const games = this.slots.filter(g => g !== null);
        if (games.length < 2) {
            return null;
        }

        return {
            games,
            attributes: this.buildAttributeComparison(games)
        };
    }

    // Build attribute comparison
    buildAttributeComparison(games) {
        const attributes = [
            {
                name: 'Rating',
                key: 'rating',
                format: (val) => val ? `⭐ ${val.toFixed(2)}/5` : 'N/A',
                highlight: 'max'
            },
            {
                name: 'Metacritic',
                key: 'metacritic',
                format: (val) => val ? `${val}/100` : 'N/A',
                highlight: 'max'
            },
            {
                name: 'Release Date',
                key: 'released',
                format: (val) => val ? new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA',
                highlight: null
            },
            {
                name: 'Genres',
                key: 'genres',
                format: (val) => val?.map(g => g.name).join(', ') || 'N/A',
                highlight: null
            },
            {
                name: 'Platforms',
                key: 'parent_platforms',
                format: (val) => val?.map(p => p.platform.name).join(', ') || 'N/A',
                highlight: null
            },
            {
                name: 'Playtime',
                key: 'playtime',
                format: (val) => val ? `${val} hours` : 'N/A',
                highlight: null
            },
            {
                name: 'ESRB Rating',
                key: 'esrb_rating',
                format: (val) => val?.name || 'Not Rated',
                highlight: null
            },
            {
                name: 'Achievements',
                key: 'achievements_count',
                format: (val) => val ? `${val} achievements` : 'N/A',
                highlight: 'max'
            }
        ];

        return attributes.map(attr => {
            const values = games.map(game => game[attr.key]);
            const formattedValues = values.map(val => attr.format(val));
            
            // Determine which value to highlight
            let highlightIndex = null;
            if (attr.highlight === 'max') {
                const numericValues = values.map(v => typeof v === 'number' ? v : 0);
                const maxVal = Math.max(...numericValues);
                if (maxVal > 0) {
                    highlightIndex = numericValues.indexOf(maxVal);
                }
            }

            return {
                name: attr.name,
                values: formattedValues,
                highlightIndex
            };
        });
    }

    // Get winner for each attribute
    getWinners() {
        const comparison = this.getComparisonData();
        if (!comparison) return null;

        const winners = {};
        comparison.attributes.forEach(attr => {
            if (attr.highlightIndex !== null) {
                const winnerGame = comparison.games[attr.highlightIndex];
                winners[attr.name] = winnerGame ? winnerGame.name : null;
            }
        });

        return winners;
    }

    // Save comparison to localStorage
    saveComparison() {
        const data = this.slots.map(s => s ? { id: s.id, name: s.name } : null);
        localStorage.setItem('gameComparison', JSON.stringify(data));
    }

    // Load comparison from localStorage
    async loadComparison() {
        const saved = localStorage.getItem('gameComparison');
        if (!saved) return;

        try {
            const data = JSON.parse(saved);
            for (let i = 0; i < data.length; i++) {
                if (data[i] && data[i].id) {
                    const game = await api.getGameDetails(data[i].id);
                    if (game) {
                        this.slots[i] = game;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load comparison:', error);
        }
    }
}

// Export singleton instance
export const gameComparison = new GameComparison();
export default gameComparison;
