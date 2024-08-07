const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;
const CHECKBOX_COUNT = 1000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Store the state of checkboxes
const checkboxes = new Array(CHECKBOX_COUNT).fill(false);

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send initial state to the client
  socket.emit('initial state', checkboxes);

  // Handle checkbox updates
  socket.on('checkbox update', (data) => {
    const { index, checked } = data;
    if (index >= 0 && index < CHECKBOX_COUNT) {
      checkboxes[index] = checked;
      
      // Broadcast the update to all clients
      io.emit('checkbox updated', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});