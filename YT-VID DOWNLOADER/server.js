const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/download', async (req, res) => {
    const { url } = req.body;
    
    try {
        // Get video info
        const videoInfo = await ytdl.getInfo(url);
        
        // Get highest quality format with both video and audio
        const format = ytdl.chooseFormat(videoInfo.formats, { 
            quality: 'highest',
            filter: 'audioandvideo' 
        });

        // Set headers for download
        res.header('Content-Disposition', `attachment; filename="${videoInfo.videoDetails.title}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        // Stream the video directly to response
        ytdl(url, {
            format: format
        }).pipe(res);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
