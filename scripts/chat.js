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

// Store chatId and userId in localStorage before navigating away
function storeChatInfo(chatId, userId) {
    localStorage.setItem('chatId', chatId);
    localStorage.setItem('userId', userId);
}

// Retrieve chatId and userId when you return to the chat page
function getStoredChatInfo() {
    return {
        chatId: localStorage.getItem('chatId'),
        userId: localStorage.getItem('userId')
    };
}

auth.onAuthStateChanged(user => {
    if (user) {
        // User is authenticated
        const senderId = user.uid;  // Set senderId to authenticated user's uid
        console.log("Authenticated user:", senderId);

        // Now, call the createChatGroup or sendMessage function that needs senderId
        const { chatId } = getParamsFromUrl();

        if (chatId) {
            listenForMessages(chatId); // Listen to messages if we're in an existing chat
        } else {
            // If not in a chat, create the chat group
            createChatGroup(senderId, selectedUsers, selectedInterest); // Pass senderId here
        }

        // Ensure the sendMessage function is not set multiple times
        if (!document.getElementById("sendMessageBtn").hasAttribute("data-listener-set")) {
            document.getElementById("sendMessageBtn").setAttribute("data-listener-set", "true"); // Mark that the listener has been set
            document.getElementById("sendMessageBtn").onclick = () => {
                const text = document.getElementById("chatInput").value.trim();
                if (text) {
                    sendMessage(chatId, senderId, text); // Pass senderId correctly
                    document.getElementById("chatInput").value = ""; // Clear input field after sending
                }
            };
        }
    } else {
        // User is not authenticated, handle accordingly
        console.log("User not authenticated");
    }
});


async function createChatGroup(senderId, selectedUsers, selectedInterest) {
    try {
        const chatRef = await db.collection("chats").add({
            name: `Group for ${selectedInterest}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        const membersRef = chatRef.collection("members");

        // Ensure the current user is also added to the group
        selectedUsers.push(senderId); // Add the current user to the members list

        // Add all members, ensure this is awaited correctly
        const memberPromises = selectedUsers.map(async (memberId) => {
            await membersRef.doc(memberId).set({
                userId: memberId,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await Promise.all(memberPromises); // Wait for all members to be added

        console.log("Chat group created successfully");

        // Store chatId and senderId in localStorage
        storeChatInfo(chatRef.id, senderId);

        // Show chat UI
        document.getElementById("chatContainer").style.display = "block";

        // Listen to messages
        listenForMessages(chatRef.id);

        // Navigate to chat page with chatId in URL
        window.location.href = `chat.html?chatId=${chatRef.id}`;

    } catch (error) {
        console.error("Error creating chat group:", error);
    }
}

function sendMessage(chatId, senderId, text) {
    const db = firebase.firestore();

    // Fetch the username before sending the message
    db.collection("Users").doc(senderId).get().then(doc => {
        const senderUsername = doc.data().name;

        const message = {
            senderId,
            senderUsername, // Include the username in the message
            text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: "text"
        };

        db.collection("chats").doc(chatId).collection("messages").add(message)
            .then(() => {
                console.log("Message sent successfully!");
            })
            .catch((error) => {
                console.error("Error sending message:", error);
            });
    });
}

function listenForMessages(chatId) {
    const messagesDiv = document.getElementById("chatMessages");

    firebase.firestore()
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .orderBy("timestamp")
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    const message = change.doc.data();
                    const msgElem = document.createElement("div");
                    msgElem.textContent = `${message.senderUsername}: ${message.text}`;
                    messagesDiv.appendChild(msgElem);

                    // Auto scroll to bottom
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            });
        });
}

function getParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
        userId: params.get("userId"),
        selectedUsers: JSON.parse(decodeURIComponent(params.get("selectedUsers") || "[]")),
        selectedInterest: params.get("interest"),
        chatId: params.get("chatId")
    };
}

const { userId, selectedUsers, selectedInterest, chatId } = getParamsFromUrl();

// Check if we have a stored chatId, and userId, and selectedUsers to create a new chat group or continue with an existing one
if (!chatId && userId && selectedUsers.length > 0 && selectedInterest) {
    // Create the group only if it's not already created
    createChatGroup(userId, selectedUsers, selectedInterest);
} else if (chatId) {
    // Retrieve chatId and userId from localStorage when navigating back to the chat page
    const { chatId, userId } = getStoredChatInfo();
    if (chatId && userId) {
        document.getElementById("chatContainer").style.display = "block";
        // Already in chat, listen for messages
        listenForMessages(chatId);
    } else {
        console.error("No chatId or userId found in localStorage");
    }
}
