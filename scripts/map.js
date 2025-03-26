function showMap() {
    // mapboxgl.accessToken = 'pk.eyJ1IjoidG9ueXhjaGVuIiwiYSI6ImNtOGdjMGYydTBsdjcyaW9pa2xqNWw3ODUifQ.zNywMAWcRkug0iD3Aej6hw';

    // Default location (YVR city hall) 49.26504440741209, -123.11540318587558
    let defaultCoords = { lat: 49.26504440741209, lng: -123.11540318587558};

    // FIRST, Find out where the user is 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // User allowed location access
                let userCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                initializeMap(userCoords);
            },
            (error) => {
                console.warn("Geolocation error:", error);
                initializeMap(defaultCoords); // Load with default location
            }
        );
    } else {
        console.error("Geolocation is not supported.");
        initializeMap(defaultCoords); // Load with default location
    }

    // NEXT load the map
    function initializeMap(coords) {
        // Create a new Mapbox map
        mapboxgl.accessToken = 'pk.eyJ1IjoidG9ueXhjaGVuIiwiYSI6ImNtOGdjMGYydTBsdjcyaW9pa2xqNWw3ODUifQ.zNywMAWcRkug0iD3Aej6hw';
        const map = new mapboxgl.Map({
            container: 'map', // The ID of the div
            style: 'mapbox://styles/mapbox/streets-v11', // Map style
            center: [coords.lng, coords.lat], // Center at user's location
            zoom: 12 // Zoom level
        });

        // Add a marker at the user's location
        new mapboxgl.Marker()
            .setLngLat([coords.lng, coords.lat])
            .setPopup(new mapboxgl.Popup().setText("You are here")) // Popup message
            .addTo(map);
    }
}
showMap();