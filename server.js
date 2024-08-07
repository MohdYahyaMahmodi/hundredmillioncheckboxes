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

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.emit('initial state', Array.from(checkedBoxes));

  socket.on('checkbox update', (data) => {
    const { index, checked } = data;
    if (index >= 0 && index < TOTAL_CHECKBOXES) {
      if (checked) {
        checkedBoxes.add(index);
      } else {
        checkedBoxes.delete(index);
      }
      socket.broadcast.emit('checkbox update', data);
    }
  });

  socket.on('request checkboxes', (range) => {
    const { start, end } = range;
    const requestedCheckboxes = Array.from(checkedBoxes).filter(index => index >= start && index < end);
    socket.emit('checkbox range', requestedCheckboxes);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});