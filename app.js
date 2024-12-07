const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize the app
const app = express();
const PORT = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize SQLite database
const db = new sqlite3.Database('./files.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');

        // Create the files table if it doesn't exist
        db.run(
            `CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                mimetype TEXT NOT NULL,
                size INTEGER NOT NULL,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            (err) => {
                if (err) {
                    console.error('Error creating table:', err.message);
                } else {
                    console.log('Files table is ready.');
                }
            }
        );
    }
});

// Middleware for parsing JSON requests
app.use(express.json());

// Serve static files for frontend
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to upload files
app.post('/upload', upload.single('file'), (req, res) => {
    const { originalname, mimetype, size } = req.file;

    // Insert file metadata into the database
    db.run(
        'INSERT INTO files (filename, mimetype, size) VALUES (?, ?, ?)',
        [originalname, mimetype, size],
        function (err) {
            if (err) {
                console.error('Error inserting file metadata:', err.message);
                return res.status(500).send('Error saving file metadata.');
            }
            res.send('File uploaded successfully.');
        }
    );
});

// Endpoint to search for files by metadata
app.get('/search', (req, res) => {
    const { query } = req.query;

    db.all(
        'SELECT * FROM files WHERE filename LIKE ?',
        [`%${query}%`],
        (err, rows) => {
            if (err) {
                console.error('Error searching files:', err.message);
                return res.status(500).send('Error searching for files.');
            }
            res.json(rows);
        }
    );
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});