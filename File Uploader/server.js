const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Initialize multer with the storage configuration
const upload = multer({ storage });

// Serve static files (e.g., uploaded files)
app.use(express.static('uploads'));

// POST route for file upload
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
        res.json({ fileUrl });
    } else {
        res.status(400).send('No file uploaded.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
