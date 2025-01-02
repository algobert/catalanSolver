const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// Statische Dateien aus dem public Ordner servieren
app.use(express.static('public'));

// Route für das Success-GIF
app.get('/success-gif', (req, res) => {
    const gifPath = path.join(__dirname, 'private', 'suc.gif');
    res.sendFile(gifPath);
});

// GML Dateien Route
app.get('/gml-files', (req, res) => {
    const gmlDir = path.join(__dirname, 'gml-files');
    fs.readdir(gmlDir, (err, files) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        const gmlFiles = files.filter(file => file.endsWith('.gml'));
        res.json(gmlFiles);
    });
});

// Route für einzelne GML-Dateien
app.get('/gml-files/:file', (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, 'gml-files', fileName);
    res.sendFile(filePath);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});