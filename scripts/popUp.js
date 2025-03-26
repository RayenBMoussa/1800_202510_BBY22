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

// // Function to update the user's document with the joined network's ID
// async function updateUserNetworks(networkId, user) {
//     try {
//       await db.collection("users").doc(user.uid).update({
//         myNetworks: firebase.firestore.FieldValue.arrayUnion(networkId)
//       });
//       console.log("User document updated with network:", networkId);
//     } catch (error) {
//       console.error("Error updating user's networks:", error);
//       alert("An error occurred while updating your networks.");
//     }
//   }

// Function to update the user's document with the joined network's ID
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

// Handle join button click
// joinBtn.addEventListener("click", async () => {
//   // Assume 'firebase' has already been initialized
//   const codeValue = document.getElementById("networkCode").value; // Replace with the actual code value you're searching for

//   firebase
//     .firestore()
//     .collection("networks")
//     .where("code", "==", codeValue)
//     .get()
//     .then((querySnapshot) => {
//       if (querySnapshot.empty) {
//         console.log("No matching documents.");
//         return;
//       }
//       querySnapshot.forEach((doc) => {
//         // Extract the ownerID from the document data
//         const ownerID = doc.data().owner;
//         console.log("OwnerID:", ownerID);
//       });
//     })
//     .catch((error) => {
//       console.error("Error fetching code:", error);
//     });

//   const networkCode = document.getElementById("networkCode").value.trim();

//   if (networkCode === "") {
//     alert("Please enter a network code.");
//     return;
//   }

//   const user = firebase.auth().currentUser;
//   if (!user) {
//     alert("You need to be logged in to create a network.");
//     return;
//   }
// });

// Function to join a network by code and update the network document
// Function to join a network by code and update both the network and user documents
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

// // Updated join button click handler
// joinBtn.addEventListener("click", async () => {
//   const networkCode = document.getElementById("networkCode").value.trim();

//   if (networkCode === "") {
//     alert("Please enter a network code.");
//     return;
//   }

//   const user = firebase.auth().currentUser;
//   if (!user) {
//     alert("You need to be logged in to join a network.");
//     return;
//   }

//   // Call the function to join the network using the code and current user.
//   await joinNetworkWithCode(networkCode, user);
// });

// Updated join button click handler
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
