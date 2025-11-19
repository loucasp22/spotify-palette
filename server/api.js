const express = require('express');
const axios = require('axios');
const Vibrant = require('node-vibrant');
const router = express.Router();

// Helper to fetch all pages of liked songs
async function fetchAllLikedSongs(accessToken) {
    let tracks = [];
    let url = 'https://api.spotify.com/v1/me/tracks?limit=50';
    let total = 0;

    while (url) {
        try {
            const response = await axios.get(url, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            });
            tracks = tracks.concat(response.data.items);
            total += response.data.total;
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

// Helper to send SSE
const sendEvent = (res, event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

router.get('/songs-stream', async (req, res) => {
    const accessToken = req.query.access_token;

    if (!accessToken) {
        return res.status(400).json({ error: 'Missing access_token' });
    }

    // SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        console.log('Starting stream...');

        // 1. Fetching Songs
        let tracks = [];
        let url = 'https://api.spotify.com/v1/me/tracks?limit=50';

        while (url) {
            try {
                const response = await axios.get(url, {
                    headers: { 'Authorization': 'Bearer ' + accessToken }
                });

                const newTracks = response.data.items;
                tracks = tracks.concat(newTracks);
                url = response.data.next;

                // Send progress
                sendEvent(res, 'progress', {
                    stage: 'fetching',
                    current: tracks.length,
                    total: response.data.total
                });

            } catch (error) {
                console.error('Error fetching page:', error.message);
                break;
            }
        }

        console.log(`Fetched ${tracks.length} songs. Starting analysis...`);

        // 2. Processing Colors
        const BATCH_SIZE = 20;
        const processedSongs = [];

        for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
            const batch = tracks.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(batch.map(async (item) => {
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

            processedSongs.push(...batchResults);

            // Send progress
            sendEvent(res, 'progress', {
                stage: 'processing',
                current: processedSongs.length,
                total: tracks.length
            });
        }

        // 3. Complete
        sendEvent(res, 'complete', processedSongs);
        res.end();

    } catch (error) {
        console.error('Error in /songs-stream:', error);
        sendEvent(res, 'error', { message: 'Internal Server Error' });
        res.end();
    }
});

router.get('/songs', async (req, res) => {
    const accessToken = req.query.access_token;

    if (!accessToken) {
        return res.status(400).json({ error: 'Missing access_token' });
    }

    try {
        console.log('Fetching liked songs...');
        const items = await fetchAllLikedSongs(accessToken);
        console.log(`Fetched ${items.length} songs. Starting color analysis...`);

        // Process items in batches to avoid overwhelming the server/rate limits
        const BATCH_SIZE = 20;
        const processedSongs = [];

        console.log(`Starting analysis of ${items.length} songs in batches of ${BATCH_SIZE}...`);

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}...`);

            const batchResults = await Promise.all(batch.map(async (item) => {
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

            processedSongs.push(...batchResults);
        }

        res.json(processedSongs);
    } catch (error) {
        console.error('Error in /songs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
