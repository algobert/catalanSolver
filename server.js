const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// Statische Dateien
app.use(express.static(path.join(__dirname, 'public')));

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

module.exports = app;