const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Configuration constants
const PORT = process.env.PORT || 3001;
const TOTAL_CHECKBOXES = 100000000; // 100 million
const MAX_MESSAGE_LENGTH = 100;
const CHUNK_SIZE = 1000000; // 1 million checkboxes per chunk

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Data structures to store application state
const checkedBoxes = new Set(); // Store checked box indices
const users = new Map(); // Store user IDs for connected sockets

/**
 * Generate a random 4-character uppercase user ID
 * @returns {string} A random user ID
 */
function generateUserId() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  const userId = generateUserId();
  users.set(socket.id, userId);

  // Send initial state to newly connected client
  socket.on('get initial state', () => {
    socket.emit('initial state', {
      totalChecked: checkedBoxes.size,
      totalCheckboxes: TOTAL_CHECKBOXES,
      checkedBoxes: Array.from(checkedBoxes)
    });
  });

  // Send a chunk of checkbox states to the client
  socket.on('request checkbox chunk', (chunkIndex) => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min((chunkIndex + 1) * CHUNK_SIZE, TOTAL_CHECKBOXES);
    const chunkCheckedBoxes = Array.from(checkedBoxes).filter(index => index >= start && index < end);
    socket.emit('checkbox chunk', { chunkIndex, checkedBoxes: chunkCheckedBoxes });
  });

  // Handle checkbox state updates from clients
  socket.on('checkbox update', (data) => {
    const { index, checked } = data;
    if (index >= 0 && index < TOTAL_CHECKBOXES) {
      if (checked) {
        checkedBoxes.add(index);
      } else {
        checkedBoxes.delete(index);
      }
      io.emit('checkbox update', { index, checked, totalChecked: checkedBoxes.size });
    }
  });

  // Handle chat messages from clients
  socket.on('chat message', (message) => {
    if (message.length <= MAX_MESSAGE_LENGTH) {
      const userId = users.get(socket.id);
      socket.broadcast.emit('chat message', { userId, message });
    } else {
      socket.emit('chat error', 'Message exceeds maximum length of 100 characters');
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    users.delete(socket.id);
  });
});

// Start the server
http.listen(PORT, () => {
  // Server is now running
});