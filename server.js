/**
 * Express.js Server
 * 
 * A simple Node.js server using Express.js framework that hosts two endpoints:
 * - GET / : Returns "Hello, World!" response
 * - GET /evening : Returns "Good evening" response
 * 
 * This server is bound to localhost (127.0.0.1) on port 3000 for security isolation.
 */

// Express.js web framework for routing and middleware capabilities
const express = require('express');

// Server configuration constants - preserved from original implementation
const hostname = '127.0.0.1';
const port = 3000;

// Create Express application instance
const app = express();

/**
 * Hello World Route Handler
 * GET / - Returns the original "Hello, World!" response
 * Preserves exact response format including newline character
 */
app.get('/', (req, res) => {
  res.send('Hello, World!\n');
});

/**
 * Good Evening Route Handler
 * GET /evening - Returns "Good evening" response
 * New endpoint added per feature requirements
 */
app.get('/evening', (req, res) => {
  res.send('Good evening');
});

// Start the server and bind to configured hostname and port
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
