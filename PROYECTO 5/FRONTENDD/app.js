// Initialize the map, default center on Bogota
const map = L.map('map', {
    zoomControl: false // Move zoom control to bottom right for better UX
}).setView([4.6097, -74.0817], 12);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Add OpenStreetMap tiles, with a beautiful dark mode filter
const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
}).addTo(map);

// DOM Elements
const infoPanel = document.getElementById('info-panel');
const loadingOverlay = document.getElementById('loading');
const paraderosBadge = document.getElementById('paraderos-count');

// Custom marker icon for SITP
const sitpIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Update Sidebar Info 
function displayStationInfo(feature) {
    const props = feature.properties;
    
    // Check if it's the SITP GeoJSON or the generic one
    if (props.nombre || props.cenefa) {
        // Render SITP Paradero Sidebar
        infoPanel.innerHTML = `
            <div class="detail-card">
                <div class="detail-row">
                    <span class="detail-label">Nombre del Paradero</span>
                    <span class="detail-value highlight-value">${props.nombre || 'Desconocido'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Localidad / Zona</span>
                    <span class="detail-value">${props.localidad || 'N/A'} - Zona ${props.zona_sitp || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Dirección / Vía principal</span>
                    <span class="detail-value">${props.direccion_bandera || props.via || 'No registrada'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Cenefa / Código</span>
                    <span class="detail-value" style="font-family: monospace;">${props.cenefa || 'N/A'}</span>
                </div>
            </div>
        `;
    } else if (props.CONFIG_POPUP) {
        // Render Generic GeoJSON Sidebar
        const config = props.CONFIG_POPUP;
        infoPanel.innerHTML = `
            <div class="detail-card">
                <div class="detail-row">
                    <span class="detail-label">Dirección</span>
                    <span class="detail-value highlight-value">${config['Direcci&oacute;n encontrada'] || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Coordenadas</span>
                    <span class="detail-value">${config.Latitud}, ${config.Longitud}</span>
                </div>
            </div>
        `;
    } else {
        infoPanel.innerHTML = `
            <div class="detail-card">
                <p>Información no disponible para este marcador.</p>
            </div>
        `;
    }
}

// Custom layer configuration
const geoJsonOptions = {
    pointToLayer: function (feature, latlng) {
        const marker = L.marker(latlng, { icon: sitpIcon });
        return marker;
    },
    onEachFeature: function (feature, layer) {
        // Popup simple on the map
        const title = feature.properties.nombre || feature.properties.cenefa || "Ubicación Geográfica";
        layer.bindPopup(`<h3>${title}</h3><p>Click para ver detalles.</p>`);
        
        // Detailed info in sidebar on click
        layer.on('click', () => {
             displayStationInfo(feature);
        });
    }
};

let totalFeatures = 0;

// Async function to load datas
async function loadGeoData() {
    try {
        // Fetch arrays in parallel
        const [geojsonRes, paraderosRes] = await Promise.all([
            fetch('/api/geojson').catch(e => null),
            fetch('/api/paraderos').catch(e => null)
        ]);

        const featuresArray = [];
        
        // Parse and add first geojson
        if (geojsonRes && geojsonRes.ok) {
            const geodata = await geojsonRes.json();
            const layer = L.geoJSON(geodata, geoJsonOptions).addTo(map);
            totalFeatures += geodata.features ? geodata.features.length : 1;
            featuresArray.push(layer);
        }

        // Parse and add paraderos
        if (paraderosRes && paraderosRes.ok) {
            const paraderosData = await paraderosRes.json();
            const layer = L.geoJSON(paraderosData, geoJsonOptions).addTo(map);
            totalFeatures += paraderosData.features ? paraderosData.features.length : 1;
            featuresArray.push(layer);
        }

        // Adjust bounds to fit all markers
        if (featuresArray.length > 0) {
            const group = L.featureGroup(featuresArray);
            map.fitBounds(group.getBounds().pad(0.1));
        }

        // Hide loading
        loadingOverlay.classList.add('hidden');
        paraderosBadge.textContent = `${totalFeatures} Paraderos`;

    } catch (error) {
        console.error("Error global de carga de datos:", error);
        loadingOverlay.innerHTML = `<div class="empty-icon">⚠️</div><p>Lo sentimos, ha ocurrido un error cargando el mapa.</p>`;
    }
}

// Start sequence
loadGeoData();