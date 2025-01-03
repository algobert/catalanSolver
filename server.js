const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// Statische Dateien aus dem public Ordner servieren
app.use(express.static('public'));

// Root Route für main.html als Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Game Route
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// GML Dateien Route
app.get('/gml-files', (req, res) => {
    const gmlDir = path.join(__dirname, 'public', 'gml-files');
    fs.readdir(gmlDir, (err, files) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        const gmlFiles = files.filter(file => file.endsWith('.gml'));
        res.json(gmlFiles);
    });
});

app.get('/gml-files/:file', (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, 'public', 'gml-files', fileName);
    res.sendFile(filePath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});