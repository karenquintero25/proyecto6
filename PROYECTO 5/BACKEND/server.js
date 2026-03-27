const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Importante para evitar problemas de CORS en desarrollo si los puertos son distintos
app.use(express.static(path.join(__dirname, '../frontend'))); // Sirve la web automáticamente

// Path hacia los archivos geojson del parent directory (PROYECTO 6)
const geojsonPath = path.join(__dirname, '../GeoJSON.json');
const paraderosPath = path.join(__dirname, '../Paraderos_Zonales_del_SITP.geojson');

// Endpoints (API)
app.get('/api/geojson', (req, res) => {
    fs.readFile(geojsonPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error leyendo GeoJSON.json', err);
            return res.status(500).json({ error: 'Error del servidor al leer el archivo' });
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});

app.get('/api/paraderos', (req, res) => {
    fs.readFile(paraderosPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error leyendo Paraderos_Zonales_del_SITP.geojson', err);
            return res.status(500).json({ error: 'Error del servidor al leer el archivo' });
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});

// Arrancar Servidor
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚗 Servidor SITP Parámetros Iniciado!   `);
    console.log(`🌐 Aplicación visible en: http://localhost:${PORT}`);
    console.log(`========================================`);
});
