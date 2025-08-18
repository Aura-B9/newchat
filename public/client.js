// public/client.js

// Determine WebSocket protocol and construct URL
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsURL = `${wsProtocol}//${window.location.host}`;
let socket = null;

// Get DOM elements
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const roomDisplay = document.getElementById('room-display');
const changeRoomBtn = document.getElementById('change-room-btn');
const statusDisplay = document.getElementById('status-display'); // Assuming you add a status element in your HTML

let currentRoom = null;
let myId = null;

// --- WebSocket Connection Management ---
function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        return; // Already connected
    }

    socket = new WebSocket(wsURL);

    // Event listeners
    socket.addEventListener('open', () => {
        console.log("Connected to server. Waiting for ID.");
        statusDisplay.textContent = 'Status: Connected';
        // The server should now send the 'assign_id' message
    });

    socket.addEventListener('message', event => {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'assign_id':
                    myId = data.id;
                    console.log(`Assigned ID: ${myId}`);
                    // Join a room immediately after getting the ID
                    joinRoom();
                    break;
                case 'message':
                    addMessage(data);
                    break;
                case 'user_count':
                    // You can add logic here to display the user count
                    console.log(`Current users in room: ${data.count}`);
                    break;
            }
        } catch (e) {
            console.error('Error parsing message from server:', e);
        }
    });

    socket.addEventListener('close', (event) => {
        console.warn(`Connection closed. Reason: ${event.reason || 'Unknown'}`);
        statusDisplay.textContent = 'Status: Disconnected. Reconnecting...';
        // Attempt to reconnect after a short delay
        setTimeout(connectWebSocket, 3000);
    });

    socket.addEventListener('error', (error) => {
        console.error("WebSocket Error:", error);
        statusDisplay.textContent = 'Status: Error. Reconnecting...';
        socket.close(); // Close the connection to trigger the 'close' event and reconnection logic
    });
}

// --- Function to join a room ---
function joinRoom() {
    // Only prompt for a room if we don't have one or are explicitly changing rooms
    if (!currentRoom || confirm("Are you sure you want to change rooms?")) {
        const roomId = prompt("Please enter a Room ID:", "general");
        if (roomId) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                // Inform the server about the new room
                socket.send(JSON.stringify({ type: 'join_room', roomId: roomId }));
                
                // Update client-side state
                currentRoom = roomId;
                roomDisplay.textContent = currentRoom;
                messagesContainer.innerHTML = '';
                addSystemMessage(`You joined Room: ${currentRoom}`);
                
                // Enable UI elements
                messageInput.disabled = false;
                sendButton.disabled = false;
                messageInput.focus();
            } else {
                console.error("WebSocket is not open. Cannot join room.");
            }
        }
    }
}

// --- Function to send a message ---
function sendMessage() {
    const text = messageInput.value.trim();
    if (text !== '' && currentRoom && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'message', text: text }));
        messageInput.value = '';
    }
}

// --- UI Utility Functions ---
function addMessage(data) {
    const { text, senderId, timestamp } = data;
    const messageWrapper = document.createElement('div');
    messageWrapper.className = senderId === myId ? 'my-message' : 'other-message';

    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    const textElement = document.createElement('div');
    textElement.textContent = text;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'timestamp';
    timeElement.textContent = new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    messageElement.appendChild(textElement);
    messageElement.appendChild(timeElement);
    messageWrapper.appendChild(messageElement);
    messagesContainer.appendChild(messageWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(text) {
    const systemMessage = document.createElement('div');
    systemMessage.className = 'system-message'; // Using a class for better styling
    systemMessage.textContent = text;
    messagesContainer.appendChild(systemMessage);
}

// --- DOM Event Listeners ---
changeRoomBtn.addEventListener('click', joinRoom);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Initial connection
connectWebSocket();
