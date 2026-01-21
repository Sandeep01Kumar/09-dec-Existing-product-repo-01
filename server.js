const express = require('express');

const hostname = '127.0.0.1';
const port = 3000;
const app = express();

// Route: Root - Returns "Hello, World!"
app.get('/', (req, res) => {
  res.type('text/plain').send('Hello, World!\n');
});

// Route: Evening - Returns "Good evening"
app.get('/evening', (req, res) => {
  res.type('text/plain').send('Good evening\n');
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
