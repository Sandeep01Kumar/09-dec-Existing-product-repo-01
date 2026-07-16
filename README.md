# hao-backprop-test

A minimal Node.js tutorial server built with Express.

## Prerequisites

- Node.js
- npm

## Install

```
npm install
```

## Run

```
npm start
```

The server listens on http://127.0.0.1:3000/.

## Endpoints

| Method | Path            | Response (text/plain)                   |
| ------ | --------------- | --------------------------------------- |
| GET    | `/`             | `Hello, World!` (with trailing newline) |
| GET    | `/good-evening` | `Good evening`                          |

Requests to unmatched paths return Express's default `404 Not Found`.
