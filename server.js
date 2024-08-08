const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;
const TOTAL_CHECKBOXES = 1000000;

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
    socket.emit('initial state', Array.from(checkedBoxes));
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
      socket.broadcast.emit('checkbox update', data);
    }
  });

  socket.on('request checkboxes', (range) => {
    const { start, end } = range;
    const requestedCheckboxes = Array.from(checkedBoxes).filter(index => index >= start && index < end);
    socket.emit('checkbox range', requestedCheckboxes);
  });

  socket.on('chat message', (message) => {
    const userId = users.get(socket.id);
    socket.broadcast.emit('chat message', { userId, message });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    users.delete(socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});