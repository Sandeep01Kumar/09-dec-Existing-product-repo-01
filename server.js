const express = require('express');

const hostname = '127.0.0.1';
const port = 3000;

const app = express();

app.get('/', (req, res) => {
  res.type('text/plain').send('Hello, World!\n');
});

app.get('/good-evening', (req, res) => {
  res.type('text/plain').send('Good evening');
});

app.listen(port, hostname, (err) => {
  if (err) {
    // Express 5 invokes this callback with the error on a failed bind
    // (e.g. EADDRINUSE). Surface a concise failure, signal a non-zero exit,
    // and return before logging success so a bind failure is never reported
    // as a successful startup.
    console.error(`Failed to start server: ${err.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Server running at http://${hostname}:${port}/`);
});
