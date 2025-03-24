import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";

import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
const successMsg = localStorage.getItem("msg");
const msgHolder = document.getElementById("successMsg");
const email = document.getElementById("email");

if (successMsg) {
  msgHolder.innerHTML = successMsg;
  localStorage.removeItem("msg"); // Remove message immediately to prevent persistence

  setTimeout(() => {
    msgHolder.style.display = "none"; // Hide message after 5 seconds
  }, 5000);
} else {
  msgHolder.style.display = "none"; // Hide the message container if there's no message
}

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

const submit = document.getElementById("submit");
submit.addEventListener("click", function (event) {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const auth = getAuth();
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      window.location.href = "index.html"
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(error)
    });
})
