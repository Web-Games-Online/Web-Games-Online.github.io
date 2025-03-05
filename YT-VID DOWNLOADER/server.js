const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/download', async (req, res) => {
    const { url, quality } = req.body;
    
    try {
        // Validate URL
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Get video info
        const info = await ytdl.getInfo(url);
        const videoTitle = info.videoDetails.title;
        const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '_');

        // Set response headers
        res.header('Content-Disposition', `attachment; filename="${sanitizedTitle}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        // Download with specified quality
        const videoStream = ytdl(url, {
            quality: quality,
            filter: 'videoandaudio'
        });

        // Handle download events
        videoStream.on('progress', (chunkLength, downloaded, total) => {
            const progress = (downloaded / total) * 100;
            console.log(`Download Progress: ${progress.toFixed(2)}%`);
        });

        // Pipe the video stream to response
        videoStream.pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
