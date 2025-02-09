const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

function rewriteLinks(html, baseUrl) {
    const $ = cheerio.load(html);
    
    $('a').each((i, link) => {
        const href = $(link).attr('href');
        if (href) {
            const absoluteUrl = url.resolve(baseUrl, href);
            $(link).attr('href', `/proxy?url=${encodeURIComponent(absoluteUrl)}`);
        }
    });

    $('form').each((i, form) => {
        const action = $(form).attr('action');
        if (action) {
            const absoluteUrl = url.resolve(baseUrl, action);
            $(form).attr('action', `/proxy?url=${encodeURIComponent(absoluteUrl)}`);
        }
    });

    return $.html();
}

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    
    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const modifiedHtml = rewriteLinks(response.data, targetUrl);
        res.send(modifiedHtml);
    } catch (error) {
        res.status(500).send('Error fetching URL');
    }
});

app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
});
