// Initialize the map
const map = L.map("map").setView([54.9701, -1.6066], 14); // Set initial view to a known coordinate

// Set up the map tiles (this example uses OpenStreetMap)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Add the "Locate Me" button control
L.control
    .locate({
        position: "topleft", // Controls the position (like the zoom buttons)
        follow: true, // Center map on the user's location when it changes
        setView: true, // Automatically zooms in when the location is found
        keepCurrentZoomLevel: true, // Don't zoom out when moving to the location
        icon: "fa fa-location-arrow", // Icon for the locate button
        iconLoading: "fa fa-spinner fa-spin", // Icon when locating
        showPopup: false, // Optional: display popup with the location
    })
    .addTo(map);

// Request user's location and add a blue circle marker
function addUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords = [
                    position.coords.latitude,
                    position.coords.longitude,
                ];

                // Add a blue circle marker for the user
                L.circleMarker(userCoords, {
                    color: "blue", // Border color
                    fillColor: "blue", // Fill color
                    fillOpacity: 0.5,
                    radius: 5, // Adjust size of the circle
                }).addTo(map);

                // Center the map on the user's location
                map.setView(userCoords, 14);
            },
            (error) => {
                console.error("Error getting user location:", error.message);
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

// Call function to request location
addUserLocation();

// Function to calculate seconds ago since data was received
function secondsAgo(timestamp) {
    const now = new Date();
    const dataTime = new Date(timestamp);

    // Check if the timestamp is valid
    if (isNaN(dataTime)) {
        return "Invalid timestamp"; // Handle invalid timestamps
    }

    const diff = now - dataTime; // Time difference in milliseconds
    return Math.floor(diff / 1000); // Convert milliseconds to seconds
}

function getOperatorName(operatorRef) {
    switch ((operatorRef || "").trim().toUpperCase()) {
        case "ANEA":
        case "ANUM":
            return "Arriva";
        case "SCNE":
            return "Stagecoach";
        case "GNEL":
            return "Go North East";
        default:
            return "Unknown";
    }
}

function getOperatorCode(operatorRef) {
    switch ((operatorRef || "").trim().toUpperCase()) {
        case "ANEA":
        case "ANUM":
            return "arriva";
        case "SCNE":
            return "stagecoach";
        case "GNEL":
            return "GNE";
        default:
            return "unknown";
    }
}

function makeFleetKey(operatorCode, fleetNumber) {
    return `${operatorCode}|${fleetNumber}`;
}

function isOperatorSelected(operatorCode) {
    const arrivaChecked = document.getElementById("arrivaCheckbox")?.checked ?? true;
    const gneChecked = document.getElementById("gneCheckbox")?.checked ?? true;
    const stagecoachChecked = document.getElementById("stagecoachCheckbox")?.checked ?? true;

    if (operatorCode === "arriva") return arrivaChecked;
    if (operatorCode === "GNE") return gneChecked;
    if (operatorCode === "stagecoach") return stagecoachChecked;

    return false;
}

function isRequirementVehicle(fleetKey) {
    return (
        rReqIconFleetNumbers.has(fleetKey) ||
        kReqIconFleetNumbers.has(fleetKey) ||
        bothReqIconFleetNumbers.has(fleetKey)
    );
}

// Function to create custom rectangle icons with fleet numbers
function createVehicleIcon(line, fleetKey) {
    const html = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%;">${line}</div>
  `;

    let iconClass = "newicon";

    if (rReqIconFleetNumbers.has(fleetKey)) {
        iconClass = "r-reqicon";
    } else if (kReqIconFleetNumbers.has(fleetKey)) {
        iconClass = "k-reqicon";
    } else if (bothReqIconFleetNumbers.has(fleetKey)) {
        iconClass = "bothreqicon";
    }

    return L.divIcon({
        iconSize: [32, 13],
        html: html,
        className: iconClass,
        popupAnchor: [0, -5],
    });
}

/// Function to get fleet number (removes depot code if present)
function getFleetNumber(vehicleRef, operatorCode) {
    const cleanRef = (vehicleRef || "").trim().replace(/_/g, "");

    // Stagecoach refs come through like SCNE-12345
    if (operatorCode === "stagecoach") {
        return cleanRef.replace(/^SCNE-/i, "");
    }

    const parts = cleanRef.split(" ");
    return parts[parts.length - 1];
}

function getVehicleType(operatorCode, fleetNumber) {

    // ===== SPECIAL NON-NUMERIC FLEET NUMBERS =====

    // Arriva specials
    if (operatorCode === "arriva") {

        // MD-01
        if (fleetNumber === "MD-01") {
            return "ADL E400EV";
        }

        // T04-NE → T08-NE
        if (
            [
                "T04-NE",
                "T05-NE",
                "T06-NE",
                "T07-NE",
                "T08-NE"
            ].includes(fleetNumber.toUpperCase())
        ) {
            return "Mercedes Citaro";
        }
    }

    // ===== NUMERIC FLEET NUMBERS =====

    const num = parseInt(fleetNumber, 10);
    if (Number.isNaN(num)) return "Unknown";
	
    // Arriva
    if (operatorCode === "arriva") {
        if (num >= 1368 && num <= 1533) return "VDL SB200 Pulsar";
        if (num === 1534) return "VDL SB200 Centro";
        if (num >= 1537 && num <= 1543) return "VDL SB200 Pulsar";
        if (num >= 1550 && num <= 1614) return "Wright Streetlite DF";
        if (num >= 2701 && num <= 2714) return "ADL E200MMC";
        if (num >= 3051 && num <= 3053) return "Optare Solo SR";
        if (num >= 4501 && num <= 4510) return "B8RLE Evora";
        if (num >= 7401 && num <= 7406) return "Volvo B9TL G2";
        if (num >= 7501 && num <= 7540) return "ADL E400";
        if (num >= 7541 && num <= 7552) return "ADL E400MMC";
        if (num >= 7553 && num <= 7562) return "ADL E400";
        if (num >= 7563 && num <= 7599) return "ADL E400MMC";
        if (num >= 7601 && num <= 7637) return "VDL DB300 Gemini 2";
        if (num === 9992) return "DAF SB200 Commander";
        if (num === 9999) return "ADL E400EV";
        return "Unknown";
    }

    // Stagecoach
    if (operatorCode === "stagecoach") {
        if (num === 10000) return "ADL E400";
        if (num >= 10467 && num <= 11780) return "ADL E400MMC";
        if (num >= 19385 && num <= 19683) return "ADL E400";
        if (num >= 22883 && num <= 24122) return "MAN E300";
        if (num >= 26063 && num <= 26293) return "ADL E200MMC";
        if (num >= 27157 && num <= 27884) return "ADL E300";
        if (num >= 28001 && num <= 28024) return "Scania E300 Gas";
        if (num >= 36081 && num <= 37319) return "ADL E200";
        if (num >= 44005 && num <= 44017) return "Mercedes Sprinter";
        if (num >= 44031 && num <= 44053) return "EVM Sprinter";
        if (num >= 73053 && num <= 73190) return "Yutong E12";
        if (num === 80000) return "ADL E400EV";
        if (num === 83000) return "Yutong U11DD";
        return "Unknown";
    }

    // Go North East
    if (operatorCode === "GNE") {
        if (num >= 641 && num <= 728) return "Optare Solo SR";
        if (num >= 5358 && num <= 5368) return "Mercedes Citaro";
        if (num >= 5369 && num <= 5376) return "Wright Streetlite DF";
        if (num >= 5377 && num <= 5390) return "Optare Versa";
        if (num >= 5391 && num <= 5480) return "Wright Streetlite DF";
        if (num >= 5488 && num <= 5498) return "ADL E200MMC";
        if (num >= 5499 && num <= 5500) return "Yutong CB12";
        if (num >= 5522 && num <= 5537) return "Wright Streetlite DF";
        if (num >= 5801 && num <= 5809) return "Yutong E12";
        if (num >= 6001 && num <= 6231) return "Volvo B9TL Gemini";
        if (num >= 6301 && num <= 6307) return "Wright Streetdeck";
		if (num >= 6308 && num <= 6314) return "Volvo B5TL G3";
		if (num >= 6315 && num <= 6333) return "Wright Streetdeck HEV";
		if (num >= 6336 && num <= 6355) return "ADL E400MMC";
		if (num >= 6356 && num <= 6377) return "Wright Streetdeck HEV";
		if (num >= 6378 && num <= 6400) return "Wright Streetdeck";
		if (num >= 6801 && num <= 6825) return "Wright Streetdeck EV";
		if (num >= 6945 && num <= 6996) return "ADL E400";
		if (num >= 6993 && num <= 6994) return "Scania E400";
		if (num >= 6995 && num <= 6996) return "Volvo B9TL G2 OT";
		if (num >= 8314 && num <= 8328) return "Optare Versa";
		if (num >= 8339 && num <= 8354) return "Wright Streetlite DF";
        if (num >= 8801 && num <= 8809) return "Yutong E10";
        return "Unknown";
    }

    return "Unknown";
}

const vehicleMarkers = new Map();
let lastOpenedFleetNumber = null; // Store last opened popup's fleet number
let popupWasOpen = false; // Track if a popup was open before refresh

// Function to fetch and display vehicle locations
async function fetchVehicleData() {
  try {
    const feedUrls = [
      "https://global.ross4122-ff0.workers.dev/operator/ANUM",
      "https://global.ross4122-ff0.workers.dev/operator/ANEA",
      "https://global.ross4122-ff0.workers.dev/operator/SCNE",
      "https://global.ross4122-ff0.workers.dev/operator/GNEL"
    ];

    // Fetch all feeds
    const responses = await Promise.all(feedUrls.map(url => fetch(url)));
    const xmlTexts = await Promise.all(
      responses.map(res => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
        return res.text();
      })
    );

    // Parse XML from all feeds
    const parser = new DOMParser();
    const allVehicleActivities = [];

    for (const xmlText of xmlTexts) {
      const xml = parser.parseFromString(xmlText, "application/xml");
      const activities = Array.from(xml.getElementsByTagName("VehicleActivity"));
      allVehicleActivities.push(...activities);
    }

    const showRequirementsOnly = document.getElementById("requirementsCheckbox").checked;

        // Cleanup markers that no longer match the current filters
        vehicleMarkers.forEach((marker, vehicleRef) => {
            const markerFleetKey = marker.options.fleetKey;
            const markerOperatorCode = marker.options.operatorCode;
            const matchesOperator = isOperatorSelected(markerOperatorCode);
            const isReqVehicle = isRequirementVehicle(markerFleetKey);

            const shouldShow =
                matchesOperator &&
                (!showRequirementsOnly || isReqVehicle);

            if (!shouldShow) {
                marker.remove();
                vehicleMarkers.delete(vehicleRef);
            }
        });

        popupWasOpen = !!map._popup;

         allVehicleActivities.forEach((activity) => {
            const line = activity.querySelector("PublishedLineName")?.textContent || "";
            let vehicleRef = activity.querySelector("VehicleRef")?.textContent || "";
            vehicleRef = vehicleRef.replace(/_/g, "");

            const operatorRef = activity.querySelector("OperatorRef")?.textContent || "";
            const operatorName = getOperatorName(operatorRef);
            const operatorCode = getOperatorCode(operatorRef);

            const recordedAtTimeStr = activity.querySelector("RecordedAtTime")?.textContent || "";
            const destination = (activity.querySelector("DestinationName")?.textContent || "").replace(/_/g, " ");

            const lat = parseFloat(activity.querySelector("VehicleLocation > Latitude")?.textContent);
            const lon = parseFloat(activity.querySelector("VehicleLocation > Longitude")?.textContent);

            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

            let fleet_number = getFleetNumber(vehicleRef, operatorCode);
            let vehicleType = getVehicleType(operatorCode, fleet_number);

            const fleetKey = makeFleetKey(operatorCode, fleet_number);

            const recordedAt = new Date(recordedAtTimeStr);
            const now = new Date();
            const timeSinceLastFix = Math.floor((now - recordedAt) / 1000);

            if (timeSinceLastFix > 900) return;

            const operatorSelected = isOperatorSelected(operatorCode);
            const requirementVehicle = isRequirementVehicle(fleetKey);

            if (!operatorSelected) return;
            if (showRequirementsOnly && !requirementVehicle) return;

            let timeAgo = timeSinceLastFix < 60 ?
                `${timeSinceLastFix} seconds ago` :
                timeSinceLastFix < 120 ?
                "1 minute ago" :
                `${Math.floor(timeSinceLastFix / 60)} minutes ago`;

            let popupText = line && destination ?
                `<b>${line}</b> to <b>${destination}</b>` :
                line ?
                `<b>${line}</b>` :
                "Not in Service";

            const popupHtml = `
    ${popupText}<br>
	<b>${operatorName}</b><br>
    <b>${fleet_number}</b> – ${vehicleType}<br>
    <small>${timeAgo}</small>
  `;

            if (vehicleMarkers.has(vehicleRef)) {
                const marker = vehicleMarkers.get(vehicleRef);
                marker.setLatLng([lat, lon]);
                marker.setIcon(createVehicleIcon(line, fleetKey));
                marker.setPopupContent(popupHtml);
                marker.options.fleetKey = fleetKey;
				marker.options.operatorCode = operatorCode;
            } else {
                const marker = L.marker([lat, lon], {
                    icon: createVehicleIcon(line, fleetKey),
                    fleetKey: fleetKey,
                    operatorCode: operatorCode,
                }).addTo(map);

                marker.bindPopup(popupHtml);

                vehicleMarkers.set(vehicleRef, marker);

                marker.on("popupopen", () => {
                    lastOpenedFleetNumber = vehicleRef;
                    popupWasOpen = true;
                });

                marker.on("popupclose", () => {
                    lastOpenedFleetNumber = null;
                    popupWasOpen = false;
                });
            }
        });

        if (
            popupWasOpen &&
            lastOpenedFleetNumber &&
            vehicleMarkers.has(lastOpenedFleetNumber)
        ) {
            vehicleMarkers.get(lastOpenedFleetNumber).openPopup();
        }
    } catch (error) {
        console.error("Error fetching vehicle data:", error);
    }
}

document
    .getElementById("requirementsCheckbox")
    .addEventListener("change", fetchVehicleData);

document
    .getElementById("arrivaCheckbox")
    .addEventListener("change", fetchVehicleData);

document
    .getElementById("gneCheckbox")
    .addEventListener("change", fetchVehicleData);

document
    .getElementById("stagecoachCheckbox")
    .addEventListener("change", fetchVehicleData);

// Initial fetch of vehicle locations
fetchVehicleData();

// Poll for updates every 10 seconds
setInterval(fetchVehicleData, 10000);

let fetchTimeout;

// Fetch data after the user stops moving the map for 1 second
map.on("moveend", () => {
    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(fetchVehicleData, 1000);
});