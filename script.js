function toggleMenu() {
    document.querySelector("nav ul").classList.toggle("show");
}

/* -------------------------------
   Parcel Data (Mock Database)
-------------------------------- */
const parcels = {
    "ECO123": {
        status: "In Transit",
        driver: "John Silva",
        vehicle: "Van - WP AB 1234",
        time: "45 minutes",
        lat: 6.9271,
        lng: 79.8612
    },
    "ECO456": {
        status: "Out for Delivery",
        driver: "Nimal Perera",
        vehicle: "Bike - WP BC 5678",
        time: "20 minutes",
        lat: 6.9059,
        lng: 79.8603
    },
    "ECO789": {
        status: "Delivered",
        driver: "Kasun Fernando",
        vehicle: "Truck - WP CA 9988",
        time: "Delivered",
        lat: 6.9147,
        lng: 79.9720
    }
};

/* -------------------------------
   Map Variables
-------------------------------- */
let map, parcelMarker, userMarker, routeLine;

/* -------------------------------
   Track Parcel
-------------------------------- */
function trackParcel() {
    const parcelId = document.getElementById("parcelId").value.toUpperCase();
    const result = document.getElementById("result");
    const mapCard = document.getElementById("mapCard");

    if (!parcels[parcelId]) {
        alert("Parcel ID not found!");
        result.style.display = "none";
        mapCard.style.display = "none";
        return;
    }

    const data = parcels[parcelId];

    document.getElementById("status").innerText = data.status;
    document.getElementById("driver").innerText = data.driver;
    document.getElementById("time").innerText = data.time;

    result.style.display = "block";
    mapCard.style.display = "block";

    getUserLocation(data.lat, data.lng);
}

/* -------------------------------
   Get User GPS Location
-------------------------------- */
function getUserLocation(parcelLat, parcelLng) {
    if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            loadMap(parcelLat, parcelLng, userLat, userLng);
        },
        () => {
            document.getElementById("distanceInfo").innerText =
                "⚠ Location access denied. Manual routing required.";
        }
    );
}

/* -------------------------------
   Initialize / Update Map
-------------------------------- */
function loadMap(pLat, pLng, uLat, uLng) {
    if (!map) {
        map = L.map("map").setView([pLat, pLng], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
        }).addTo(map);

        parcelMarker = L.marker([pLat, pLng]).addTo(map)
            .bindPopup("📦 Parcel Location").openPopup();

        userMarker = L.marker([uLat, uLng]).addTo(map)
            .bindPopup("👤 Your Location");
    } else {
        parcelMarker.setLatLng([pLat, pLng]);
        userMarker.setLatLng([uLat, uLng]);
    }

    drawShortestRoute(pLat, pLng, uLat, uLng);
}

/* -------------------------------
   Draw Shortest Road Route (OSRM)
-------------------------------- */
async function drawShortestRoute(pLat, pLng, uLat, uLng) {
    const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${uLng},${uLat}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            throw new Error("No route found");
        }

        const routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

        if (routeLine) {
            map.removeLayer(routeLine);
        }

        routeLine = L.polyline(routeCoords, {
            color: "green",
            weight: 5
        }).addTo(map);

        map.fitBounds(routeLine.getBounds());

        const distanceKm = (data.routes[0].distance / 1000).toFixed(2);
        const durationMin = Math.round(data.routes[0].duration / 60);

        document.getElementById("distanceInfo").innerText =
            `Shortest road distance: ${distanceKm} km | Estimated time: ${durationMin} minutes`;

    } catch (error) {
        document.getElementById("distanceInfo").innerText =
            "⚠ Manual routing required (route service unavailable)";
    }
}
