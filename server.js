const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// Statische Dateien aus dem public Ordner servieren
app.use(express.static('public'));
// GML Dateien servieren
app.use('/gml-files', express.static('gml-files'));

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

app.listen(3000, () => {
    console.log('Server läuft auf Port 3000');
});