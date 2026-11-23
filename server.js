const http = require('http');

const DEFAULT_PORT = 3000;
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const HOST = '127.0.0.1';

const ROUTES = Object.freeze([
  Object.freeze({ method: 'GET', path: '/hello', handler: handleHello }),
]);

let server;
let port;
let shuttingDown = false;

function resolvePort(rawValue) {
  if (rawValue === undefined) {
    return { port: DEFAULT_PORT };
  }

  const invalidMessage =
    `Invalid PORT value "${rawValue}". PORT must be an integer between ${MIN_PORT} and ${MAX_PORT}.`;
  const trimmed = rawValue.trim();

  // Number('') is 0 and Number('3e3') is 3000, so the digits-only test has to run first:
  // a set-but-empty PORT must be rejected rather than converted into a port.
  if (!/^\d+$/.test(trimmed)) {
    return { error: invalidMessage };
  }

  const candidate = Number(trimmed);
  if (!Number.isInteger(candidate) || candidate < MIN_PORT || candidate > MAX_PORT) {
    return { error: invalidMessage };
  }

  return { port: candidate };
}

function logRequest(req) {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
}

function sendText(res, statusCode, body) {
  // A response that was already completed must not be written twice; this guard is what
  // lets the generic 500 fallback run even after a handler has begun its own response.
  if (res.writableEnded) {
    return;
  }

  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  res.end(body);
}

function handleHello(req, res) {
  sendText(res, 200, 'Hello world');
}

function handleNotFound(req, res) {
  sendText(res, 404, 'Not Found');
}

function matchRoute(method, pathname) {
  return ROUTES.find((route) => route.method === method && route.path === pathname);
}

function handleRequest(req, res) {
  logRequest(req);

  try {
    // Matching reads the parsed pathname rather than req.url, which may arrive as an
    // absolute-form target or carry a query string that no route path contains.
    const url = new URL(req.url, 'http://127.0.0.1');
    const route = matchRoute(req.method, url.pathname);

    if (route) {
      route.handler(req, res);
      return;
    }

    handleNotFound(req, res);
  } catch (error) {
    // Failure details stay on the server: the client is told only that the request failed.
    console.error(`Request handling failed: ${error.message}`);
    sendText(res, 500, 'Internal Server Error');
  }
}

function onListening() {
  console.log(`Server listening on port ${port}`);
}

function onServerError(error) {
  if (error.code === 'EADDRINUSE') {
    console.error(`Failed to start server: port ${port} is already in use (EADDRINUSE).`);
  } else {
    console.error(`Failed to start server: ${error.message}`);
  }

  process.exit(1);
}

function onSigint() {
  // Trapping SIGINT replaces Node's default exit, and a second CTRL+C must not close the
  // server twice or print a second shutdown line.
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log('Server shutting down');
  server.close(() => process.exit(0));

  // Idle keep-alive sockets would otherwise hold the 'close' event, and this exit, open
  // for keepAliveTimeout. The method arrived in Node 18.2.0 while the floor is 18.0.0.
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }
}

function start() {
  const resolved = resolvePort(process.env.PORT);

  if (resolved.error) {
    console.error(resolved.error);
    process.exit(1);
  }

  port = resolved.port;
  server = http.createServer(handleRequest);

  // A bind failure is reported asynchronously through an 'error' event, so the listener has
  // to be attached before listen(): without it the failure is an uncaught exception.
  server.on('error', onServerError);
  process.on('SIGINT', onSigint);
  server.listen(port, HOST, onListening);
}

start();
