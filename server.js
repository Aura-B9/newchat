// server.js (UPDATED)

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto'); // Make sure to add this line

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = new Map();

wss.on('connection', ws => {
    console.log('Client connected');
    // Assign a unique ID to each client
    ws.id = crypto.randomUUID();
    ws.roomId = null;

    // Send the unique ID to the client
    ws.send(JSON.stringify({ type: 'assign_id', id: ws.id }));

    ws.on('message', message => {
        const messageString = message.toString();
        try {
            const data = JSON.parse(messageString);
            console.log('Received data:', data);

            switch (data.type) {
                case 'join_room':
                    if (ws.roomId && rooms.has(ws.roomId)) {
                        rooms.get(ws.roomId).delete(ws);
                        if (rooms.get(ws.roomId).size === 0) {
                            rooms.delete(ws.roomId);
                        }
                    }
                    const roomId = data.roomId;
                    if (!rooms.has(roomId)) {
                        rooms.set(roomId, new Set());
                    }
                    rooms.get(roomId).add(ws);
                    ws.roomId = roomId;
                    console.log(`Client ${ws.id} joined room: ${roomId}`);
                    break;

                case 'message':
                    if (ws.roomId && rooms.has(ws.roomId)) {
                        const room = rooms.get(ws.roomId);
                        // Broadcast the message with sender's ID and timestamp
                        const messageToSend = {
                            type: 'message',
                            text: data.text,
                            senderId: ws.id, // Include the sender's unique ID
                            timestamp: new Date() // Add a server-side timestamp
                        };
                        room.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(messageToSend));
                            }
                        });
                    }
                    break;
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    ws.on('close', () => {
        console.log(`Client ${ws.id} has disconnected`);
        if (ws.roomId && rooms.has(ws.roomId)) {
            rooms.get(ws.roomId).delete(ws);
            if (rooms.get(ws.roomId).size === 0) {
                rooms.delete(ws.roomId);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});