# Real-Time Chat App

A real-time group chat app built with **React Native (Expo)** on the frontend and **Node.js + Express + Socket.io** on the backend, with messages stored in **MongoDB Atlas**.

- **Live API:** `https://chat-api.bulkform.app`  (health check: `/health`)
- **Backend test page:** `https://chat-api.bulkform.app/test.html`
- **APK:** `https://drive.google.com/file/d/1MXmF6MTXM7mt2y-jHFGugxu8nDo73Uie/view?usp=sharing`
- **Screen recording:** `https://drive.google.com/file/d/1jI_mtDToMy98kWPpPl_03-gNrkZcS5gR/view?usp=sharing`

## Features

**Core**
- Send messages and receive them instantly over Socket.io
- Chat history loads from the database, so it survives app restarts and refreshes
- Timestamps on every message
- Graceful handling of connections, disconnections and errors

**Bonus**
- Username-based login (dummy authentication)
- Typing indicator
- Online/offline user status
- Messages stored in MongoDB
- Backend deployed and publicly reachable over HTTPS

## Tech stack

| Layer | Technology |
|---|---|
| Mobile app | React Native with Expo |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB Atlas (via Mongoose) |
| Hosting | Dokploy (Docker) |
| APK build | EAS Build (Expo cloud builds) |

## Architecture

```
  [ Expo app ] <---- HTTPS (REST) + WebSocket (Socket.io) ---->  [ Node/Express server ]  <---->  [ MongoDB Atlas ]
   on the phone                                                   hosted on Dokploy
```

Messages are sent through a REST call. The server validates and saves the message, then broadcasts it to every connected client over Socket.io. Presence and typing events travel over the socket only.

## Project structure

```
chat-app/
  backend/
    src/
      config/         database connection
      models/         Mongoose Message schema
      controllers/    REST route logic
      routes/         route definitions
      sockets/        Socket.io events (messages, typing, presence)
      app.js          Express app, middleware, error handlers
      server.js       entry point: DB, HTTP server, sockets
    public/test.html  simple browser client for testing the backend
    Dockerfile
    .env.example
  mobile/
    src/
      screens/        LoginScreen, ChatScreen
      components/     MessageBubble, MessageInput
      services/       api.js (REST), socket.js (Socket.io)
      config.js       reads the API URL
    App.js
    app.json
    eas.json
    .env.example
  README.md
```

## Prerequisites

- Node.js (LTS) and npm
- A free MongoDB Atlas cluster (see below)
- For the mobile app: the **Expo Go** app on an Android phone, or an APK built with EAS
- An Expo account (only needed to build the APK)

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `MONGODB_URI` | MongoDB Atlas connection string, including the database name | `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority` |
| `CLIENT_ORIGIN` | Allowed CORS origin (`*` allows any) | `*` |

### Mobile (`mobile/.env`)

| Variable | Description | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the backend, no trailing slash | `https://chat-api.example.com` |

`EXPO_PUBLIC_` variables are baked in at build time. For APK builds, the same variable is set in the `preview` profile of `mobile/eas.json`, because cloud builds do not see the local `.env` file.

## Setup

### 1. Database (MongoDB Atlas)

1. Create a free **M0** cluster.
2. Under **Database Access**, create a user with read/write access. Use a password with only letters and numbers to avoid URL-encoding issues.
3. Under **Network Access**, allow access from `0.0.0.0/0` (needed so both a laptop and the hosted server can connect).
4. Copy the connection string and add a database name (for example `/chatapp`) before the `?`.

### 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env        # on Windows: copy .env.example .env
# edit .env and set MONGODB_URI
npm run dev                 # or: npm start
```

The console should print `MongoDB connected` and `Server running on port 3000`.

Quick checks:
- `http://localhost:3000/health` returns `{"status":"ok"}`
- Open `http://localhost:3000/test.html` in two tabs, join with different usernames, and send messages. They appear in both tabs instantly.

### 3. Run the frontend

```bash
cd mobile
npm install
cp .env.example .env        # on Windows: copy .env.example .env
# edit .env and set EXPO_PUBLIC_API_URL
npx expo start -c
```

Scan the QR code with Expo Go. The phone must be able to reach the API URL. The simplest option is to use the deployed backend URL. To use a local backend instead, set the URL to your computer's LAN address (for example `http://192.168.1.20:3000`), with both devices on the same Wi-Fi.

### 4. Build the APK

```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

The `preview` profile produces an installable `.apk`. EAS prints a download link when the build finishes. Make sure `EXPO_PUBLIC_API_URL` is set in the `preview` profile of `eas.json` first.

### 5. Deploy the backend (Dokploy)

1. Create an **Application** in Dokploy and connect this GitHub repository (branch `main`).
2. Set the build type to **Dockerfile**, with the Dockerfile at `backend/Dockerfile` and the context set to `backend`.
3. Add the environment variables `PORT`, `MONGODB_URI` and `CLIENT_ORIGIN` in the Environment tab.
4. Add a domain, set the container port to `3000`, and enable HTTPS with Let's Encrypt.
5. Deploy and check the logs for `MongoDB connected`.

## API reference

### REST

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/messages?limit=100` | Chat history, oldest first (default 100, max 500) |
| `POST` | `/api/messages` | Save a message and broadcast it. Body: `{ "username": "...", "text": "..." }` |

Errors are returned as JSON, for example `{ "error": "username and text are required" }` with status `400`. Unexpected failures return `500`.

### Message shape

```json
{
  "_id": "6abb76510d15db82fd5af55c",
  "username": "alice",
  "text": "hi",
  "createdAt": "2026-09-29T08:26:57.443Z"
}
```

### Socket.io events

Clients connect with their username: `io(url, { auth: { username } })`.

| Event | Direction | Payload | Description |
|---|---|---|---|
| `new_message` | server -> all | message object | A message was saved |
| `typing` | client -> server, then server -> others | `{ username }` | User started typing |
| `stop_typing` | client -> server, then server -> others | `{ username }` | User stopped typing or sent |
| `online_users` | server -> all | `string[]` | Current list of online usernames |

## Design decisions

- **Send over REST, broadcast over sockets.** The message is validated and saved first, then broadcast, so the database is always the source of truth and a broadcast never contains a message that failed to save. REST also gives a clear success or error response for the sender.
- **Layered backend.** Routes, controllers, models, config and sockets live in separate folders, and Express setup (`app.js`) is separate from server startup (`server.js`). Each file has one job, which keeps it easy to read and extend.
- **Central error handling.** Controllers pass errors to a single Express error handler, which turns validation errors into `400` responses and everything else into a generic `500`, without leaking internals or crashing the server.
- **MongoDB Atlas instead of a self-hosted database.** A managed database removes networking, backup and persistence risks, and the same connection string works for local development and production.
- **Dokploy with a Dockerfile.** Hosting on my own server avoids free-tier sleep and cold starts. Nixpacks could not detect the Node app inside the `backend/` subfolder, so an explicit Dockerfile is more predictable.
- **HTTPS is required.** Release builds of Android apps block plain `http://` traffic by default, so the API is served over HTTPS with a Let's Encrypt certificate.
- **Timestamps stored in UTC, shown in local time.** The server stores UTC, and each device formats it in its own time zone.
- **Duplicate-safe message list.** A sent message can arrive through both the REST response and the socket broadcast, so the app de-duplicates by `_id`.
- **Resilient reconnects.** If the socket drops, the app shows a "Connection lost" banner. On reconnect, it reloads history to pick up anything missed.
- **Presence with connection counting.** The server tracks how many connections each username has, so a user on two devices only goes offline when both disconnect. Typing events are throttled on the client to avoid flooding the server.
- **Expo and EAS.** Expo removes the need for Android Studio and local SDK setup, and EAS builds the APK in the cloud.
- **WebSocket-only transport in the app.** The mobile client connects directly over WebSocket, which avoids long-polling issues behind a reverse proxy.

## Assumptions

- There is a single global chat room shared by all users.
- Login is dummy authentication: a username is enough, with no password. Usernames are not unique, so two people using the same name appear as one online user.
- The username is not saved on the device, so it is asked for again when the app is reopened. Message history still loads from the server.
- Messages are plain text, up to 1000 characters, with usernames up to 30 characters.
- History returns the most recent 100 messages by default.
- MongoDB Atlas is open to all IPs (`0.0.0.0/0`) for simplicity. Access is still protected by the database user and password.
- CORS allows any origin (`*`), since the client is a native app.
- Online status is kept in memory on a single server instance.

## Known limitations and future improvements

- Delivered/read receipts are not implemented.
- No real authentication, rate limiting or message editing and deletion.
- History uses a simple limit rather than pagination.
- Running several server instances would need a shared adapter (for example Socket.io's Redis adapter) so presence and broadcasts work across instances.
- Persisting the username on the device and adding automated tests would be the next steps.