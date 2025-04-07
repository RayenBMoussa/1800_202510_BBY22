// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
// Your web app's Firebase configuration
// Your Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyBajFZOzlOmtXWlmYlioZ2eoWZhU4IcRqE",
  authDomain: "bby22-9f867.firebaseapp.com",
  projectId: "bby22-9f867",
  storageBucket: "bby22-9f867.firebasestorage.app",
  messagingSenderId: "538587405788",
  appId: "1:538587405788:web:8fe69a84f0e8767f138319"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firebase services
var auth = firebase.auth();
var db = firebase.firestore();

var ui = new firebaseui.auth.AuthUI(auth);

document.getElementById("submit").addEventListener("click", function (event) {
  event.preventDefault(); // Prevent form submission

  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  var fullName = document.getElementById("fullname").value;

  // user's geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // user creation with Firebase Auth
        auth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
            const user = userCredential.user;

            // Save user data to Firestore
            return db.collection("Users").doc(user.uid).set({
              email: user.email,
              name: fullName,
              geoLocation: {
                lat: lat,
                lng: lng
              },
              preferences: {}, // Placeholder for future use
              status: "active", // Default status
              myNetwork: null, // Will be updated when the user joins a group
              networks: []
            });
          })
          .then(() => {
            localStorage.setItem("msg", "Account created successfully!!!");
            window.location.href = "login.html"; // Redirect to login page
          })
          .catch((error) => {
            console.log("Error signing up:", error.message);
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not retrieve location. Please enable location services.");
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

