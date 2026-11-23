# hao-backprop-test
test project for backprop integration. Do not touch!

## Purpose

This project is a small Node.js HTTP server you can read from top to bottom in a few minutes. The whole application is `server.js`, and it uses only the `http` module that ships with Node.js: no framework, no router, no packages.

The server:

- answers `GET /hello` with the plain-text body `Hello world`;
- answers every request that matches no route with status `404` and the plain-text body `Not Found`;
- prints one line in the terminal for every request it handles;
- reads its port from the `PORT` environment variable, defaulting to `3000` when `PORT` is not set;
- shuts down cleanly when you press CTRL+C.

It is a tutorial, not a production template: it has no database, no authentication and no external services.

## Prerequisites

Node.js 18.0.0 or newer. Check the version in your terminal:

```bash
node --version
```

If it prints `v18.0.0` or higher, such as `v22.23.5`, you can continue. Otherwise install Node.js 18 or newer first.

## Installation

Nothing needs to be installed. `package.json` declares no dependencies, so there is no `npm install` step and no `node_modules` directory. Copying the project files into a directory is the whole setup.

## Execution

From the project directory, start the server:

```bash
node server.js
```

`npm start` runs the same command, because `package.json` maps the `start` script to `node server.js`:

```bash
npm start
```

npm prints the script it runs before the server starts:

```text
> nodejs-tutorial-hello-world@1.0.0 start
> node server.js

Server listening on port 3000
```

The server keeps running in that terminal until you stop it (see Shutdown). Leave it running and open a second terminal for the commands in the next section.

## Testing

These commands use `curl` (or an equivalent HTTP client), which this section needs and the server itself does not. It ships with macOS, most Linux distributions and Windows 10 and later; if it is missing, the `curl` package installs from your system package manager. With the server running on port 3000, run each one in a second terminal. The `-i` flag makes curl print the response status line and headers as well as the body.

Request the one route the server implements:

```bash
curl -i http://localhost:3000/hello
```

Expect `HTTP/1.1 200 OK`, the header `Content-Type: text/plain`, a blank line, and the body `Hello world`.

Request a path the server does not know:

```bash
curl -i http://localhost:3000/invalid
```

Expect `HTTP/1.1 404 Not Found` and the body `Not Found`.

Send a different method to the same path:

```bash
curl -i -X POST http://localhost:3000/hello
```

This is also a `404 Not Found` with the body `Not Found`: a request matches a route only when both the method and the path match.

These three requests show the matching rules in practice:

```bash
curl -i 'http://localhost:3000/hello?x=1'   # 200 OK, Hello world: the query string is ignored
curl -i http://localhost:3000/hello/        # 404 Not Found: the trailing slash is significant
curl -i http://localhost:3000/Hello         # 404 Not Found: path matching is case-sensitive
```

Run the server on another port by setting `PORT`:

```bash
PORT=4000 node server.js
```

The startup line then reads `Server listening on port 4000`, and the same routes answer at `http://localhost:4000/hello`. Stop that instance with CTRL+C in its own terminal.

Finally, try to start a second server on a port that is already in use (the first server is still on 3000):

```bash
node server.js
```

The second process prints one line on stderr and exits with status 1:

```text
Failed to start server: port 3000 is already in use (EADDRINUSE).
```

## Expected Output

When the server starts, it prints one line on stdout:

```text
Server listening on port 3000
```

Every request the handler receives adds one more line, written before the request is answered:

```text
2026-11-23T10:53:10.957Z GET /hello
2026-11-23T10:53:10.969Z GET /invalid
2026-11-23T10:53:10.975Z POST /hello
```

A request Node.js rejects while parsing it — an unrecognised method token, a malformed request line, or a header block larger than Node.js's 16 KB limit — is answered by Node.js itself with `400 Bad Request` or `431 Request Header Fields Too Large`, never reaches the handler, and adds no line.

The parts of a request line are, in order: the time of the request as an ISO-8601 UTC timestamp with milliseconds (produced by `new Date().toISOString()`), the HTTP method, and the request path exactly as the client sent it, query string included.

`GET /hello` returns:

```text
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 11
Date: Mon, 23 Nov 2026 10:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Hello world
```

Every request that matches no route returns:

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain
Content-Length: 9
Date: Mon, 23 Nov 2026 10:53:10 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Not Found
```

A request whose target cannot be parsed as a URL is the one case that does not follow that rule: it is answered `500 Internal Server Error` with the plain-text body `Internal Server Error` and no detail, and the reason is reported to the operator by the `Request handling failed:` line listed below.

The status, the `Content-Type: text/plain` and `Content-Length` headers and the body are what the application guarantees. `Date`, `Connection` and `Keep-Alive` are added by Node.js and can differ between responses.

These are all the lines the server can print:

- `Server listening on port <PORT>`: stdout, once, after the port is bound.
- `<ISO-8601 timestamp> <METHOD> <request path>`: stdout, once per request the handler receives, before the response.
- `Server shutting down`: stdout, once, when you press CTRL+C.
- `Invalid PORT value "<value>". PORT must be an integer between 1024 and 65535.`: stderr, when the `PORT` value is rejected; the process then exits with status 1.
- `Failed to start server: port <PORT> is already in use (EADDRINUSE).`: stderr, when the port is taken; the process then exits with status 1.
- `Failed to start server: <error message>`: stderr, when the port cannot be bound for any reason other than a port already in use; the process then exits with status 1.
- `Request handling failed: <error message>`: stderr, when handling a request throws; the process keeps serving, and the client is answered `500 Internal Server Error` containing none of the message. The 500 is only possible before any of the response has been sent: a throw that happens after a response has begun writes nothing further to it and closes the unfinished connection instead.

## Shutdown

Press CTRL+C in the terminal where the server is running. The server prints:

```text
Server shutting down
```

then closes its connections and exits with status 0. Requests already being answered finish first, and no new connections are accepted once shutdown has begun. A connection that never sends a complete request cannot hold the exit either: anything still open about a second after shutdown begins is closed.

If you started the server in the background, capture its process id when you start it:

```bash
node server.js &        # start the server in the background
SERVER_PID=$!           # capture the process id it was given
```

Later, still in that terminal, send that process the same signal:

```bash
kill -INT "$SERVER_PID"   # prints Server shutting down, then exits with status 0
```

If you did not capture the id when you started it, `pgrep -f "node server.js"` finds it on Linux and macOS.

The shutdown line and the exit status 0 are the same as with CTRL+C.

## PORT Configuration

The port comes from the `PORT` environment variable and defaults to `3000` when the variable is not set:

```bash
PORT=8080 node server.js   # Server listening on port 8080
node server.js             # Server listening on port 3000
```

Rules for the value:

- It must be an integer from 1024 to 65535. Ports below 1024 are refused, so the server never asks for a privileged port.
- Surrounding spaces are trimmed, so `PORT=" 3000 "` is accepted as 3000.
- After trimming, the value must contain digits only. `abc`, `3000.0`, `3e3`, `0x1F90` and `+3000` are all rejected.
- An empty value is rejected rather than defaulted. `PORT=` is a mistake in your setup, so the server stops and tells you instead of quietly using 3000.

A rejected value produces a single line on stderr and exit status 1, before any server is created:

```text
Invalid PORT value "abc". PORT must be an integer between 1024 and 65535.
```

The quoted part is the value exactly as it was received, so `PORT=80` reports `Invalid PORT value "80".` and `PORT=` reports `Invalid PORT value "".`. Control characters in the value are printed as escapes such as `\u000a`, so a value containing a line break still produces exactly one line on stderr.

If the port is already in use, the server prints a single line on stderr and exits with status 1:

```text
Failed to start server: port 3000 is already in use (EADDRINUSE).
```

Either stop the process that is using the port or choose another one, such as `PORT=8080 node server.js`.
