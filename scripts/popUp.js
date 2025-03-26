var firebaseConfig = {
  apiKey: "AIzaSyBajFZOzlOmtXWlmYlioZ2eoWZhU4IcRqE",
  authDomain: "bby22-9f867.firebaseapp.com",
  projectId: "bby22-9f867",
  storageBucket: "bby22-9f867.firebasestorage.app",
  messagingSenderId: "538587405788",
  appId: "1:538587405788:web:8fe69a84f0e8767f138319",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firebase services
var auth = firebase.auth();
var db = firebase.firestore();

// Get elements
const popup = document.getElementById("popup");
const createNetworkButton = document.querySelector("#createNetwork"); // Target "Create a network"
const createBtn = document.getElementById("createBtn");
const cancelBtn = document.getElementById("cancelBtn");

// Show the popup when clicking "Create a network"
createNetworkButton.addEventListener("click", () => {
  popup.style.display = "flex";
});

// Close popup on cancel
cancelBtn.addEventListener("click", () => {
  popup.style.display = "none";
});

// Get elements
const popupJoin = document.getElementById("popupJoin");
const joinNetworkButton = document.querySelector("#JoinNetwork"); // Target "Create a network"
const joinBtn = document.getElementById("joinBtn");
const cancelJoinBtn = document.getElementById("cancelJoinBtn");

// Show the popup when clicking "Create a network"
joinNetworkButton.addEventListener("click", () => {
  popupJoin.style.display = "flex";
});

// Close popup on cancel
cancelJoinBtn.addEventListener("click", () => {
  popupJoin.style.display = "none";
});

// Handle create button click
createBtn.addEventListener("click", async () => {
  const networkName = document.getElementById("networkName").value.trim();

  if (networkName === "") {
    alert("Please enter a network name.");
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("You need to be logged in to create a network.");
    return;
  }

  const networkCode = generateRandomCode(6);

  try {
    // Create a new network in Firestore
    const networkRef = await db.collection("networks").add({
      name: networkName,
      owner: user.uid,
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      code: networkCode,
    });

    // Add the creator as the first member
    await networkRef
      .collection("members")
      .doc(user.uid)
      .set({
        name: user.displayName || "Unknown",
        email: user.email,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    // Send Email with the Network Code
    sendEmail(user.email, networkName, networkCode);

    alert(
      `Network "${networkName}" created successfully! Check your email for the network code.`
    );
    popup.style.display = "none";
  } catch (error) {
    console.error("Error creating network:", error);
    alert("An error occurred while creating the network.");
  }
});

// Handle join button click
joinBtn.addEventListener("click", async () => {
  // Assume 'firebase' has already been initialized
  const codeValue = document.getElementById("networkCode").value; // Replace with the actual code value you're searching for

  firebase
    .firestore()
    .collection("networks")
    .where("code", "==", codeValue)
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        console.log("No matching documents.");
        return;
      }
      querySnapshot.forEach((doc) => {
        // Extract the ownerID from the document data
        const ownerID = doc.data().owner;
        console.log("OwnerID:", ownerID);
      });
    })
    .catch((error) => {
      console.error("Error fetching code:", error);
    });

  const networkCode = document.getElementById("networkCode").value.trim();

  if (networkCode === "") {
    alert("Please enter a network code.");
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("You need to be logged in to create a network.");
    return;
  }
});

//function that generates a random code
function generateRandomCode(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

//send Email function
function sendEmail(userEmail, networkName, networkCode) {
  emailjs.init("vc4dNF6JlEHb94drI");

  const emailParams = {
    to_email: userEmail,
    subject: "Your Network Code",
    message: `Hello, your network "${networkName}" has been created successfully! Your network code is: ${networkCode}`,
  };

  emailjs
    .send("service_c3wkddt", "template_6ar3clv", emailParams)
    .then((response) => {
      console.log("Email sent successfully:", response);
    })
    .catch((error) => {
      console.error("Email sending failed:", error);
    });
}
