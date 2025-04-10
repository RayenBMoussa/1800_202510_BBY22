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

function displayUserInfoFromAuth() {
    const user = firebase.auth().currentUser;

    if (user) {
        const uid = user.uid;

        firebase.firestore().collection("Users").doc(uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    const name = userData.name || "Unknown";
                    const email = user.email || "No email";
                    const firstInitial = name.charAt(0).toUpperCase();

                    document.getElementById("userName_Settings").textContent = firstInitial;
                    document.getElementById("nameInfo").textContent = name;
                    document.getElementById("emailInfo").textContent = email;
                } else {
                    console.log("User data not found in Firestore");
                }
            })
            .catch((error) => {
                console.error("Error fetching user info from Firestore:", error);
            });
    } else {
        console.log("No user is logged in");
    }
}


document.getElementById("logout").addEventListener("click", () => {
    firebase.auth().signOut()
        .then(() => {
            console.log("User signed out.");
            // redirect to login page
            window.location.href = "login.html"; 
        })
        .catch((error) => {
            console.error("Error signing out:", error);
        });
});


firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        displayUserInfoFromAuth();
    } else {
        console.log("No user logged in");
        //redirect to login page
    }
});

