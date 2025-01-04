const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const setCustomCacheControl = (res, path) => {
    if (path.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
};

// Statische Dateien
app.use(express.static('public', {
    maxAge: '1h',
    etag: true,
    setHeaders: setCustomCacheControl
}));

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Etwas ist schiefgelaufen!');
});

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Game Route
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// GML Files Route
app.get('/gml-files', (req, res) => {
    const gmlDir = path.join(__dirname, 'public', 'gml-files');
    try {
        const files = fs.readdirSync(gmlDir);
        const gmlFiles = files.filter(file => file.endsWith('.gml'));
        res.json(gmlFiles);
    } catch (err) {
        console.error('Fehler beim Lesen des GML-Verzeichnisses:', err);
        res.status(500).send('Fehler beim Laden der GML-Dateien');
    }
});

// Einzelne GML File Route
app.get('/gml-files/:file', (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, 'public', 'gml-files', fileName);

    if (!fs.existsSync(filePath)) {
        res.status(404).send('Datei nicht gefunden');
        return;
    }
    res.sendFile(filePath);
});

// Nur für lokale Entwicklung
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server läuft auf Port ${port}`);
        console.log(`Server gestartet: http://localhost:${port}`);
    });
}

// Für Vercel
module.exports = app;