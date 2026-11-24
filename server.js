const http = require('http');

const DEFAULT_PORT = 3000;
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const HOST = '127.0.0.1';
const SHUTDOWN_GRACE_MS = 1000;

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

  // Control characters are escaped so a rejected value still prints exactly one stderr line.
  const received = rawValue.replace(
    /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
  const invalidMessage =
    `Invalid PORT value "${received}". PORT must be an integer between ${MIN_PORT} and ${MAX_PORT}.`;
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
  if (res.writableEnded || res.headersSent) {
    return;
  }

  res.writeHead(statusCode, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(body) });
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
    console.error(`Request handling failed: ${error.message}`);

    if (res.writableEnded) {
      return;
    }

    // A response whose headers are already sent cannot carry a 500 any more, and leaving it
    // unterminated would hold its socket, so the begun exchange is torn down instead.
    if (res.headersSent) {
      res.destroy();
      return;
    }

    sendText(res, 500, 'Internal Server Error');
  }
}

function onListening() {
  console.log(`Server listening on port ${port}`);
}

function onServerError(error) {
  const message =
    error.code === 'EADDRINUSE'
      ? `Failed to start server: port ${port} is already in use (EADDRINUSE).`
      : `Failed to start server: ${error.message}`;

  console.error(message);
  process.exitCode = 1;
}

function onShutdownComplete() {
  // A completed shutdown must not clear a failure status reported earlier, so 0 is assigned
  // only when neither onServerError nor start has already written an exit code.
  if (process.exitCode === undefined) {
    process.exitCode = 0;
  }
}

function onShutdownGraceExpired() {
  // close() stops accepting but keeps open connections, and it also removes the
  // headersTimeout that would otherwise drop a connection whose request head never
  // arrived, so ending them here is what keeps the exit from waiting forever.
  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }
}

function onSigint() {
  // Trapping SIGINT replaces Node's default exit, and a second CTRL+C must not close the
  // server twice or print a second shutdown line.
  if (shuttingDown) {
    return;
  }

  console.log('Server shutting down');
  shuttingDown = true;
  server.close(onShutdownComplete);

  // Idle keep-alive sockets would otherwise hold the 'close' event, and this exit, open
  // for keepAliveTimeout. The method arrived in Node 18.2.0 while the floor is 18.0.0.
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }

  // Requests already being answered get this long to finish; whatever is still open after
  // it is ended, so a client that never completes a request cannot hold the exit. The
  // timer must not keep the process alive by itself.
  const graceTimer = setTimeout(onShutdownGraceExpired, SHUTDOWN_GRACE_MS);
  graceTimer.unref();
}

function start() {
  const resolved = resolvePort(process.env.PORT);

  if (resolved.error) {
    console.error(resolved.error);
    process.exitCode = 1;
    return;
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
