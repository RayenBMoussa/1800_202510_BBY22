var firebaseConfig = {
    apiKey: "AIzaSyBajFZOzlOmtXWlmYlioZ2eoWZhU4IcRqE",
    authDomain: "bby22-9f867.firebaseapp.com",
    projectId: "bby22-9f867",
    storageBucket: "bby22-9f867.appspot.com",
    messagingSenderId: "538587405788",
    appId: "1:538587405788:web:8fe69a84f0e8767f138319",
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Firebase services
var auth = firebase.auth();
var db = firebase.firestore();
const userMarkers = {}; // Key: userId, Value: { marker, interest }

function showMap(userId) {
    let defaultCoords = { lat: 49.26504440741209, lng: -123.11540318587558 };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                let userCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Save the location in Firestore
                updateUserLocation(userId, userCoords);

                // Initialize the map with the user's coordinates
                initializeMap(userCoords, userId);
            },
            (error) => {
                console.warn("Geolocation error:", error);
                initializeMap(defaultCoords, userId);
            }
        );
    } else {
        console.error("Geolocation is not supported.");
        initializeMap(defaultCoords);
    }

    function initializeMap(coords, userId) {
        mapboxgl.accessToken = 'pk.eyJ1IjoidG9ueXhjaGVuIiwiYSI6ImNtOGdjMGYydTBsdjcyaW9pa2xqNWw3ODUifQ.zNywMAWcRkug0iD3Aej6hw';
        
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [coords.lng, coords.lat],
            zoom: 10
        });
    
        // Store the map globally
        window.globalMap = map;
    
        // Load users
        loadUsersFromConnectedNetworks(map, userId);
    }
    
}

// Function to update the user's location in Firestore
function updateUserLocation(userId, coords) {
    const db = firebase.firestore();
    db.collection("Users").doc(userId).set(
        {
            geoLocation: {
                lat: coords.lat,
                lng: coords.lng
            }
        },
        { merge: true } // This keeps existing user data and updates only the location
    ).then(() => {
        console.log("Location updated successfully.");
    }).catch((error) => {
        console.error("Error updating location: ", error);
    });
}

async function loadUsersFromConnectedNetworks(map, currentUserId) {
    const db = firebase.firestore();

    try {
        // Step 1: Always get current user data
        const userDoc = await db.collection("Users").doc(currentUserId).get();
        if (!userDoc.exists) {
            console.log("User document not found");
            return;
        }

        const currentUserData = userDoc.data();

        // Always show current user
        if (currentUserData.geoLocation) {
            new mapboxgl.Marker({ color: "blue" })
                .setLngLat([currentUserData.geoLocation.lng, currentUserData.geoLocation.lat])
                .setPopup(new mapboxgl.Popup().setText("You"))
                .addTo(map);
        }

        // Step 2: Get all networks where this user is a member
        const networksSnapshot = await db.collection("networks").get();
        const connectedNetworkIds = [];

        for (const doc of networksSnapshot.docs) {
            const membersRef = db.collection("networks").doc(doc.id).collection("members");
            const memberDoc = await membersRef.doc(currentUserId).get();
            if (memberDoc.exists) {
                connectedNetworkIds.push(doc.id);
            }
        }

        if (connectedNetworkIds.length === 0) {
            console.log("User is not part of any network");
            return;
        }

        // Step 3: Get all member IDs from those networks
        const allUserIds = new Set([currentUserId]); // Start with the current user

        for (const networkId of connectedNetworkIds) {
            const membersSnapshot = await db
                .collection("networks")
                .doc(networkId)
                .collection("members")
                .get();

            membersSnapshot.forEach((doc) => {
                allUserIds.add(doc.id);
            });
        }

        // Step 4: Batch fetch user data and show markers
        const allUserIdArray = Array.from(allUserIds);
        const batchSize = 10;

        for (let i = 0; i < allUserIdArray.length; i += batchSize) {
            const batch = allUserIdArray.slice(i, i + batchSize);
            const usersSnapshot = await db
                .collection("Users")
                .where(firebase.firestore.FieldPath.documentId(), "in", batch)
                .get();

                usersSnapshot.forEach((doc) => {
                    const userData = doc.data();
                    // Access interest inside preferences
                    const interest = (userData.preferences && userData.preferences.interest) || "unknown";
                    
                    console.log(`User ${doc.id} interest: ${interest}`); // Check if it's being correctly fetched
                
                    if (userData.geoLocation && doc.id !== currentUserId) {
                        const popupText = userData.name || `User ${doc.id.slice(0, 6)}`;
                        const marker = new mapboxgl.Marker({ color: "red" })
                            .setLngLat([userData.geoLocation.lng, userData.geoLocation.lat])
                            .setPopup(new mapboxgl.Popup().setText(`${popupText} (${interest})`))
                            .addTo(map);
                
                        userMarkers[doc.id] = { marker, interest };
                    }
                });
                
        }

    } catch (error) {
        console.error("Error loading connected users:", error);
    }
}





firebase.auth().onAuthStateChanged(user => {
    if (user) {
        showMap(user.uid);
        document.getElementById("interestFilter").addEventListener("change", function () {
            const selectedInterest = this.value;
        
            for (const userId in userMarkers) {
                const { marker, interest } = userMarkers[userId];
                console.log(`Filter: "${selectedInterest}", User: "${interest}"`);

                // Determine color based on interest match
                const isMatch = selectedInterest === "all" || interest === selectedInterest;
        
                // Remove and re-add marker with updated color
                const lngLat = marker.getLngLat();
                marker.remove();
        
                const newMarker = new mapboxgl.Marker({ color: isMatch ? "red" : "gray" })
                    .setLngLat(lngLat)
                    .setPopup(marker.getPopup()) // reuse the popup
                    .addTo(window.globalMap);
                // Update reference
                userMarkers[userId].marker = newMarker;
            }
        });
        
    }
});

