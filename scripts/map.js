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
                initializeMap(userCoords,userId);
            },
            (error) => {
                console.warn("Geolocation error:", error);
                initializeMap(defaultCoords,userId);
            }
        );
    } else {
        console.error("Geolocation is not supported.");
        initializeMap(defaultCoords);
    }

    function initializeMap(coords,userId) {
        mapboxgl.accessToken = 'pk.eyJ1IjoidG9ueXhjaGVuIiwiYSI6ImNtOGdjMGYydTBsdjcyaW9pa2xqNWw3ODUifQ.zNywMAWcRkug0iD3Aej6hw';
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [coords.lng, coords.lat],
            zoom: 10
        });
        

        // Load all user locations from Firestore and display them on the map
        loadUsersOnMap(map,userId);
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

async function loadUsersOnMap(map, currentUserId) {
    const db = firebase.firestore();

    try {
        // 1. Get the current user's document
        const userDoc = await db.collection("Users").doc(currentUserId).get();
        
        if (!userDoc.exists) {
            console.log("User document doesn't exist");
            return;
        }

        const userData = userDoc.data();

        // 2. Check if user has a network
        if (!userData.myNetwork) {
            console.log("User is not part of any network");
            return;
        }

        const networkId = userData.myNetwork;

        // 3. Get all members of this network
        const membersSnapshot = await db.collection("networks")
            .doc(networkId)
            .collection("members")
            .get();

        // 4. Collect all member IDs
        const memberIds = membersSnapshot.docs.map(doc => doc.id);
        memberIds.push(currentUserId); // Always include current user

        // 5. Get locations for all members
        const usersSnapshot = await db.collection("Users")
            .where(firebase.firestore.FieldPath.documentId(), 'in', memberIds)
            .get();

        // 6. Add markers to map
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.geoLocation) {
                const isCurrentUser = doc.id === currentUserId;
                const markerColor = isCurrentUser ? "blue" : "red";
                const popupText = isCurrentUser ? "You" : 
                    userData.name || `User ${doc.id.substring(0, 5)}`;

                new mapboxgl.Marker({ color: markerColor })
                    .setLngLat([userData.geoLocation.lng, userData.geoLocation.lat])
                    .setPopup(new mapboxgl.Popup().setText(popupText))
                    .addTo(map);
            }
        });

    } catch (error) {
        console.error("Error loading network users:", error);
    }
}


firebase.auth().onAuthStateChanged(user => {
    if (user) {
        showMap(user.uid);
    }
});