const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// Middleware für JSON-Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien mit Cache-Control
app.use(express.static('public', {
    maxAge: '1h',
    etag: true
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

// GML Files Route mit Error Handling
app.get('/gml-files', (req, res) => {
    const gmlDir = path.join(__dirname, 'public', 'gml-files');
    fs.readdir(gmlDir, (err, files) => {
        if (err) {
            console.error('Fehler beim Lesen des GML-Verzeichnisses:', err);
            res.status(500).send('Fehler beim Laden der GML-Dateien');
            return;
        }
        const gmlFiles = files.filter(file => file.endsWith('.gml'));
        res.json(gmlFiles);
    });
});

app.get('/gml-files/:file', (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, 'public', 'gml-files', fileName);

    // Überprüfen Sie, ob die Datei existiert
    if (!fs.existsSync(filePath)) {
        res.status(404).send('Datei nicht gefunden');
        return;
    }
    res.sendFile(filePath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
    console.log(`Server gestartet: http://localhost:${port}`);
});