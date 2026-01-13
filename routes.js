function toggleMenu() {
    document.querySelector("nav ul").classList.toggle("show");
}
let map, shortLine, ecoLine;

async function findRoute(event) {
    event.preventDefault();

    const pickup = document.getElementById("pickup").value;
    const delivery = document.getElementById("delivery").value;

    try {
        const start = await getCoordinates(pickup);
        const end = await getCoordinates(delivery);

        if (!start || !end) throw "Location not found";

        const routes = await fetchRoutes(start, end);

        // Cache successful routes
        localStorage.setItem("cachedRoutes", JSON.stringify({ routes, start, end }));

        processRoutes(routes, start, end);
    } catch (error) {
        console.warn("API failed, using cache...", error);
        useCachedRoutes();
    }
}

async function getCoordinates(place) {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: data[0].lat, lon: data[0].lon };
}

async function fetchRoutes(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?alternatives=true&overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw "Routing API failed";
    const data = await res.json();
    return data.routes;
}

function processRoutes(routes, start, end) {
    let shortest = routes[0];
    let eco = routes[0];

    routes.forEach(route => {
        if (route.distance < shortest.distance) {
            shortest = route;
        }

        // CO₂ estimation
        const speed = route.distance / route.duration;
        route.co2 = route.distance * 0.00012 * (speed > 15 ? 1.3 : 1);

        if (!eco.co2 || route.co2 < eco.co2) {
            eco = route;
        }
    });

    displayResults(shortest, eco);
    drawMap(shortest.geometry.coordinates, eco.geometry.coordinates, start, end);
}

function displayResults(shortest, eco) {
    document.getElementById("shortDistance").innerText =
        (shortest.distance / 1000).toFixed(2) + " km";

    document.getElementById("shortTime").innerText =
        (shortest.duration / 60).toFixed(0) + " min";

    document.getElementById("ecoDistance").innerText =
        (eco.distance / 1000).toFixed(2) + " km";

    document.getElementById("ecoTime").innerText =
        (eco.duration / 60).toFixed(0) + " min";

    document.getElementById("ecoCO2").innerText =
        eco.co2.toFixed(2) + " kg";

    document.getElementById("fallbackMsg").style.display = "none";
    document.getElementById("routeResult").style.display = "block";
}

function useCachedRoutes() {
    const cache = localStorage.getItem("cachedRoutes");
    if (!cache) {
        document.getElementById("fallbackMsg").style.display = "block";
        document.getElementById("routeResult").style.display = "block";
        return;
    }

    const { routes, start, end } = JSON.parse(cache);
    processRoutes(routes, start, end);
    document.getElementById("fallbackMsg").style.display = "block";
}

function drawMap(shortCoords, ecoCoords, start, end) {
    if (!map) {
        map = L.map("map").setView([start.lat, start.lon], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
        }).addTo(map);
    }

    if (shortLine) map.removeLayer(shortLine);
    if (ecoLine) map.removeLayer(ecoLine);

    shortLine = L.polyline(
        shortCoords.map(c => [c[1], c[0]]),
        { color: "red" }
    ).addTo(map);

    ecoLine = L.polyline(
        ecoCoords.map(c => [c[1], c[0]]),
        { color: "green" }
    ).addTo(map);

    L.marker([start.lat, start.lon]).addTo(map).bindPopup("Pickup");
    L.marker([end.lat, end.lon]).addTo(map).bindPopup("Delivery");

    map.fitBounds(shortLine.getBounds());
}
