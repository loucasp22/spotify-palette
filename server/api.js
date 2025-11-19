const express = require('express');
const axios = require('axios');
const Vibrant = require('node-vibrant');
const router = express.Router();

// Helper to fetch all pages of liked songs
async function fetchAllLikedSongs(accessToken) {
    let tracks = [];
    let url = 'https://api.spotify.com/v1/me/tracks?limit=50';

    while (url) {
        try {
            const response = await axios.get(url, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            });
            tracks = tracks.concat(response.data.items);
            url = response.data.next;
        } catch (error) {
            console.error('Error fetching tracks:', error.response ? error.response.data : error.message);
            break;
        }
    }
    return tracks;
}

// Helper to extract color from image URL
async function extractColor(imageUrl) {
    try {
        const palette = await Vibrant.from(imageUrl).getPalette();
        // Use Vibrant swatch, fallback to others
        const swatch = palette.Vibrant || palette.Muted || palette.DarkVibrant;
        if (swatch) {
            return {
                r: swatch.r,
                g: swatch.g,
                b: swatch.b,
                hex: swatch.getHex(),
                hsl: swatch.getHsl() // [h, s, l]
            };
        }
        return null;
    } catch (error) {
        console.error('Error extracting color:', error.message);
        return null;
    }
}

router.get('/songs', async (req, res) => {
    const accessToken = req.query.access_token;

    if (!accessToken) {
        return res.status(400).json({ error: 'Missing access_token' });
    }

    try {
        console.log('Fetching liked songs...');
        const items = await fetchAllLikedSongs(accessToken);
        console.log(`Fetched ${items.length} songs. Starting color analysis...`);

        // Process items to extract necessary data and colors
        // Limit to first 50 for now to avoid timeout/rate limits during dev
        // TODO: Implement batch processing or queue for full library
        const processedSongs = await Promise.all(items.slice(0, 50).map(async (item) => {
            const track = item.track;
            const album = track.album;
            const imageUrl = album.images[0] ? album.images[0].url : null;

            let colorData = null;
            if (imageUrl) {
                colorData = await extractColor(imageUrl);
            }

            return {
                id: track.id,
                name: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                album: album.name,
                imageUrl: imageUrl,
                color: colorData,
                added_at: item.added_at
            };
        }));

        res.json(processedSongs);
    } catch (error) {
        console.error('Error in /songs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
