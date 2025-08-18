// public/client.js (UPDATED)

// Determine Web
//  protocol and construct URL
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsURL = `${wsProtocol}//${window.location.host}`;
const socket = 
new WebSocket(wsURL);

// Get DOM elements
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const roomDisplay = document.getElementById('room-display');
const changeRoomBtn = document.getElementById('change-room-btn');

let currentRoom = null;
let myId = null; // Variable to store our own unique ID

// --- Function to join a room ---
function joinRoom() {
    const roomId = prompt("Please enter a Room ID:", "general");

    if (roomId) {
        currentRoom = roomId;
        roomDisplay.textContent = currentRoom;
        
        messagesContainer.innerHTML = ''; 
        addSystemMessage(`You joined Room: ${currentRoom}`);

        socket.send(JSON.stringify({ type: 'join_room', roomId: currentRoom }));

        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// --- NEW: Updated function to add messages to the UI ---
function addMessage(data) {
    const { text, senderId, timestamp } = data;
    
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper';

    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    const textElement = document.createElement('div');
    textElement.textContent = text;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'timestamp';
    // Format timestamp to a readable local time string (e.g., 1:30 PM)
    timeElement.textContent = new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    // Check if the message is from me or someone else
    if (senderId === myId) {
        messageWrapper.classList.add('my-message');
        messageElement.appendChild(textElement);
        messageElement.appendChild(timeElement);
    } else {
        messageWrapper.classList.add('other-message');
        messageElement.appendChild(textElement);
        messageElement.appendChild(timeElement);
    }
    
    messageWrapper.appendChild(messageElement);
    messagesContainer.appendChild(messageWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(text) {
    const systemMessage = document.createElement('div');
    systemMessage.style.textAlign = 'center';
    systemMessage.style.fontStyle = 'italic';
    systemMessage.style.color = '#888';
    systemMessage.style.margin = '10px 0';
    systemMessage.textContent = text;
    messagesContainer.appendChild(systemMessage);
}

// --- Function to send a message ---
function sendMessage() {
    const text = messageInput.value.trim();
    if (text !== '' && currentRoom) {
        socket.send(JSON.stringify({ type: 'message', text: text }));
        messageInput.value = '';
    }
}

// --- WebSocket Event Listeners ---
socket.addEventListener('open', () => {
    // We don't join a room immediately, we wait for our ID first.
    console.log("Connected to server. Waiting for ID.");
});

socket.addEventListener('message', event => {
    try {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'assign_id':
                myId = data.id; // Store our unique ID
                console.log(`Assigned ID: ${myId}`);
                joinRoom(); // Now we can join a room
                break;
            case 'message':
                addMessage(data); // Call the new addMessage function
                break;
        }
    } catch (e) {
        console.error('Error parsing message from server:', e);
    }
});

// --- DOM Event Listeners ---
changeRoomBtn.addEventListener('click', joinRoom);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});