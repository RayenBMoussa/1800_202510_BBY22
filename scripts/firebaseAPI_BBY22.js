//----------------------------------------
//  Your web app's Firebase configuration
//----------------------------------------
var firebaseConfig = {
    apiKey: "AIzaSyDWbmtHH6121gYgOqinbsz7_1IP-0xNp5Y",
    authDomain: "intimo-fb628.firebaseapp.com",
    projectId: "intimo-fb628",
    storageBucket: "intimo-fb628.firebasestorage.app",
    messagingSenderId: "196750217072",
    appId: "1:196750217072:web:fa8489a2b001e8891509b5",
    measurementId: "G-PK0V0ZV3WC"
};

//--------------------------------------------
// initialize the Firebase app
// initialize Firestore database if using it
//--------------------------------------------
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();