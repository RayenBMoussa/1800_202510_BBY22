// Initialize Firebase
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
const createNetworkButton = document.querySelector("#createNetwork");
const createBtn = document.getElementById("createBtn");
const cancelBtn = document.getElementById("cancelBtn");
const popupJoin = document.getElementById("popupJoin");
const joinNetworkButton = document.querySelector("#JoinNetwork");
const joinBtn = document.getElementById("joinBtn");
const cancelJoinBtn = document.getElementById("cancelJoinBtn");


// Uncomment and restore these popup event listeners
createNetworkButton.addEventListener("click", () => {
  popup.style.display = "flex";
});

cancelBtn.addEventListener("click", () => {
  popup.style.display = "none";
});

joinNetworkButton.addEventListener("click", () => {
  popupJoin.style.display = "flex";
});

cancelJoinBtn.addEventListener("click", () => {
  popupJoin.style.display = "none";
});


async function checkUserNetwork() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  try {
    const querySnapshot = await db.collection("networks")
      .where("owner", "==", user.uid)
      .get();

    if (!querySnapshot.empty) {
      querySnapshot.forEach((docSnapshot) => {
        const networkData = docSnapshot.data();
        const networkCode = networkData.code;
        document.querySelector("#numberNetworks span:first-child").textContent = networkCode;
      });

      const popupTriggers = document.querySelectorAll("#createNetwork");
      popupTriggers.forEach((element) => {
        element.style.pointerEvents = "none";
        element.style.opacity = "0.5";
        element.style.cursor = "not-allowed";
      });

      createNetworkButton.disabled = true;
      createNetworkButton.textContent = "Network Created";
    }
  } catch (error) {
    console.error("Error checking user network:", error);
  }
}

// NEW: Add loading state management
const networkUI = document.getElementById("networkUI"); // You'll need to add this container in your HTML
const loadingSpinner = document.getElementById("loadingSpinner"); // Add this element too

// NEW: Initialize UI in loading state
function initUI() {
  if (networkUI) networkUI.style.display = "none";
  if (loadingSpinner) loadingSpinner.style.display = "block";
  createBtn.disabled = true;
  createNetworkButton.disabled = true;
}

// NEW: Show UI when ready
function showUI() {
  if (loadingSpinner) loadingSpinner.style.display = "none";
  if (networkUI) networkUI.style.display = "block";
}

// Initialize UI state
initUI();

// MAIN AUTH STATE LISTENER - This is the core fix
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    try {
      await checkNetworkStatus();
      await checkUserNetwork();
    } catch (error) {
      console.error("Error checking network status:", error);
    }
  }
  showUI();
});

// IMPROVED Network Status Check
async function checkNetworkStatus() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  try {
    const localStorageHasNetwork = localStorage.getItem("networkCreated") === "true";
    let hasNetwork = false;

    if (localStorageHasNetwork) {
      const querySnapshot = await db.collection("networks")
        .where("owner", "==", user.uid)
        .get();

      hasNetwork = !querySnapshot.empty;

      if (hasNetwork) {
        const networkData = querySnapshot.docs[0].data();
        localStorage.setItem("networkCode", networkData.code || "");
        document.querySelector("#numberNetworks span:first-child").textContent = networkData.code || "";
      } else {
        // Clean up localStorage if it's out of sync
        localStorage.removeItem("networkCreated");
        localStorage.removeItem("networkCode");
      }
    }

    // Update button states
    createBtn.disabled = hasNetwork;
    createNetworkButton.disabled = hasNetwork;

    if (hasNetwork) {
      createNetworkButton.textContent = "Network Created";
      createNetworkButton.style.pointerEvents = "none";
      createNetworkButton.style.opacity = "0.5";
    }
  } catch (error) {
    console.error("Error checking network status:", error);
    // Fail safely by allowing network creation
    createBtn.disabled = false;
    createNetworkButton.disabled = false;
  }
}

// Rest of your existing functions remain the same, but I'll include the important ones:

// Create Network Button Click Handler
createBtn.addEventListener("click", async () => {
  const networkName = document.getElementById("networkName").value.trim();

  if (!networkName) {
    alert("Please enter a network name.");
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("You need to be logged in to create a network.");
    return;
  }

  try {
    // Verify again right before creation
    const querySnapshot = await db.collection("networks")
      .where("owner", "==", user.uid)
      .get();

    if (!querySnapshot.empty) {
      createBtn.disabled = true;
      createNetworkButton.disabled = true;
      localStorage.setItem("networkCreated", "true");
      alert("You can only create one personal network.");
      return;
    }

    const networkCode = generateRandomCode(6);
    const networkRef = await db.collection("networks").add({
      name: networkName,
      owner: user.uid,
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      code: networkCode,
    });

    // Update all necessary data
    await db.collection("Users").doc(user.uid).update({
      myNetwork: networkRef.id
    });

    await networkRef.collection("members").doc(user.uid).set({
      name: user.displayName || "Unknown",
      email: user.email,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Update UI and storage
    localStorage.setItem("networkCreated", "true");
    localStorage.setItem("networkCode", networkCode);
    document.querySelector("#numberNetworks span:first-child").textContent = networkCode;

    alert(`Network "${networkName}" created successfully!`);
    createBtn.disabled = true;
    createNetworkButton.disabled = true;
    createNetworkButton.textContent = "Network Created";
    if (popup) popup.style.display = "none";
  } catch (error) {
    console.error("Error creating network:", error);
    alert("An error occurred while creating the network.");
  }
});

// Rest of your existing functions (joinNetworkWithCode, generateRandomCode, sendEmail, etc.)
// ... keep them exactly as they were ...

// Rest of your existing functions (joinNetworkWithCode, generateRandomCode, sendEmail, etc.)
// ... keep them exactly as they were ...
async function updateUserNetworks(networkId, user) {
  try {
    // Using set with merge:true ensures that the document is created if it doesn't exist,
    // and the 'myNetworks' field is added (or updated) using arrayUnion.
    await db.collection("Users").doc(user.uid).set(
      {
        myNetworks: firebase.firestore.FieldValue.arrayUnion(networkId)
      },
      { merge: true }
    );
    console.log("User document updated with network ID:", networkId);
  } catch (error) {
    console.error("Error updating user's networks:", error);
    alert("An error occurred while updating your networks.");
  }
}

async function joinNetworkWithCode(networkCode, user) {
  try {
    // Query the networks collection where the code matches the input
    const querySnapshot = await db
      .collection("networks")
      .where("code", "==", networkCode)
      .get();

    if (querySnapshot.empty) {
      alert("No network found with the provided code.");
      return;
    }

    // For each matching network (usually there is only one), update the network and user documents.
    querySnapshot.forEach(async (docSnapshot) => {
      // Update the network document by adding the user's UID to the memberIds array.
      await db.collection("networks").doc(docSnapshot.id).update({
        memberIds: firebase.firestore.FieldValue.arrayUnion(user.uid),
      });

      // Optionally, add the joiner to the network's members subcollection with additional info.
      await db
        .collection("networks")
        .doc(docSnapshot.id)
        .collection("members")
        .doc(user.uid)
        .set({
          name: user.displayName || "Unknown",
          email: user.email,
          joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      // Update the user's document: add this network's document ID to the myNetworks field.
      await updateUserNetworks(docSnapshot.id, user);

      alert("Joined network successfully!");
      popupJoin.style.display = "none";
    });
  } catch (error) {
    console.error("Error joining network:", error);
    alert("An error occurred while joining the network.");
  }
}

joinBtn.addEventListener("click", async () => {
  const networkCode = document.getElementById("networkCode").value.trim();

  if (networkCode === "") {
    alert("Please enter a network code.");
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("You need to be logged in to join a network.");
    return;
  }

  // Call the join network function
  await joinNetworkWithCode(networkCode, user);
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













// // Show the popup when clicking "Create a network"
// createNetworkButton.addEventListener("click", () => {
//   popup.style.display = "flex";
// });

// // Close popup on cancel
// cancelBtn.addEventListener("click", () => {
//   popup.style.display = "none";
// });
//   // Show the popup when clicking "Create a network"
//   joinNetworkButton.addEventListener("click", () => {
//     popupJoin.style.display = "flex";
//   });

//   // Close popup on cancel
//   cancelJoinBtn.addEventListener("click", () => {
//     popupJoin.style.display = "none";
//   });