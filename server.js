const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;
const TOTAL_CHECKBOXES = 100000000; // 100 million
const MAX_MESSAGE_LENGTH = 100;
const CHUNK_SIZE = 1000000; // 1 million checkboxes per chunk

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const checkedBoxes = new Set();
const users = new Map();

function generateUserId() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('A user connected');
  const userId = generateUserId();
  users.set(socket.id, userId);

  socket.on('get initial state', () => {
    console.log('Sending initial state');
    socket.emit('initial state', {
      totalChecked: checkedBoxes.size,
      totalCheckboxes: TOTAL_CHECKBOXES,
      checkedBoxes: Array.from(checkedBoxes)
    });
  });

  socket.on('request checkbox chunk', (chunkIndex) => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min((chunkIndex + 1) * CHUNK_SIZE, TOTAL_CHECKBOXES);
    const chunkCheckedBoxes = Array.from(checkedBoxes).filter(index => index >= start && index < end);
    socket.emit('checkbox chunk', { chunkIndex, checkedBoxes: chunkCheckedBoxes });
  });

  socket.on('checkbox update', (data) => {
    const { index, checked } = data;
    if (index >= 0 && index < TOTAL_CHECKBOXES) {
      if (checked) {
        checkedBoxes.add(index);
      } else {
        checkedBoxes.delete(index);
      }
      console.log(`Checkbox ${index} ${checked ? 'checked' : 'unchecked'}`);
      io.emit('checkbox update', { index, checked, totalChecked: checkedBoxes.size });
    }
  });

  socket.on('chat message', (message) => {
    if (message.length <= MAX_MESSAGE_LENGTH) {
      const userId = users.get(socket.id);
      socket.broadcast.emit('chat message', { userId, message });
    } else {
      socket.emit('chat error', 'Message exceeds maximum length of 100 characters');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    users.delete(socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});