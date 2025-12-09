# hao-backprop-test

test project for backprop integration. Do not touch!

## Requirements

- **Node.js**: Version 18.x or higher (tested with v20.19.6)
- **npm**: Version 7.x or higher

## Dependencies

This project uses the following dependencies:

- **Express.js** (v5.2.1) - Web framework for Node.js

## Installation

Clone the repository and install the dependencies:

```bash
npm install
```

This will install Express.js and all required dependencies.

## Usage

Start the server using one of the following commands:

```bash
# Using npm start script
npm start

# Or directly with Node.js
node server.js
```

The server will start and listen on `http://127.0.0.1:3000`.

You should see the following message in the console:

```
Server running at http://127.0.0.1:3000/
```

## API Reference

### Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/` | GET | Hello World greeting | `Hello, World!` |
| `/evening` | GET | Evening greeting | `Good evening` |

### GET /

Returns a "Hello, World!" greeting.

**Request:**
```bash
curl http://127.0.0.1:3000/
```

**Response:**
```
Hello, World!
```

### GET /evening

Returns a "Good evening" greeting.

**Request:**
```bash
curl http://127.0.0.1:3000/evening
```

**Response:**
```
Good evening
```

## License

This is a test project for internal use.
