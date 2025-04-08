// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js"; // ✅ added setDoc and doc

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBajFZOzlOmtXWlmYlioZ2eoWZhU4IcRqE",
  authDomain: "bby22-9f867.firebaseapp.com",
  projectId: "bby22-9f867",
  storageBucket: "bby22-9f867.firebasestorage.app",
  messagingSenderId: "538587405788",
  appId: "1:538587405788:web:8fe69a84f0e8767f138319"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("submit").addEventListener("click", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const fullName = document.getElementById("fullname").value;
  const selectedInterest = document.getElementById("interestSelect").value;

  if (!selectedInterest) {
    alert("Please choose an interest.");
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            const user = userCredential.user;

            return setDoc(doc(db, "Users", user.uid), {
              email: user.email,
              name: fullName,
              geoLocation: {
                lat: lat,
                lng: lng
              },
              preferences: {
                interest: selectedInterest
              },
              status: "active",
              myNetwork: null,
              networks: []
            });
          })
          .then(() => {
            localStorage.setItem("msg", "Account created successfully!!!");
            window.location.href = "login.html";
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
