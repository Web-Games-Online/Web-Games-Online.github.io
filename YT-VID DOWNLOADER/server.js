const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// YouTube API Configuration
const API_KEY = 'AIzaSyA6CSQ_T_iq-2bY_gtToIGB1XtUgDvbbWQ';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get video details using YouTube API
app.get('/video-info/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    const url = `${YOUTUBE_API_URL}/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

app.post('/download', async (req, res) => {
    const { url, quality } = req.body;
    
    try {
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const videoTitle = info.videoDetails.title;
        const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '_');

        res.header('Content-Disposition', `attachment; filename="${sanitizedTitle}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        const videoStream = ytdl(url, {
            quality: quality,
            filter: 'videoandaudio'
        });

        videoStream.on('progress', (chunkLength, downloaded, total) => {
            const progress = (downloaded / total) * 100;
            console.log(`Download Progress: ${progress.toFixed(2)}%`);
        });

        videoStream.pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('YouTube API Key configured successfully');
});
