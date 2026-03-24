# Whispr API

REST API and real-time messaging backend for Whispr, built with Express, Prisma, and Socket.IO.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL via Prisma ORM
- **Real-time:** Socket.IO
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **File uploads:** Multer + Cloudinary
- **Rate limiting:** express-rate-limit

> **Frontend repo:** [https://github.com/ELE-00/messenger-app](https://github.com/ELE-00/messenger-app)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Cloudinary account

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Allowed CORS origin (e.g. `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: `3000`) |

### Database Setup

```bash
npx prisma migrate dev
```

### Run

```bash
node server.js
```

## API Endpoints

All routes except `/auth/*` require a `Authorization: Bearer <token>` header.

### Auth — `/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Log in, returns JWT |

Rate limited to 20 requests per 15 minutes.

**POST /auth/signup** body:
```json
{ "username": "string (3–30 chars)", "password": "string (min 6 chars)", "confirmPassword": "string" }
```

**POST /auth/login** body:
```json
{ "username": "string", "password": "string" }
```

### Conversations — `/conversations`

| Method | Path | Description |
|---|---|---|
| GET | `/conversations` | Get all conversations for logged-in user |
| POST | `/conversations` | Create a new conversation |
| GET | `/conversations/users` | Get all users (id, name, username, profilepic only) |
| GET | `/conversations/:id` | Get messages for a conversation |
| POST | `/conversations/:id` | Send a message via HTTP (backup; prefer Socket.IO) |

**POST /conversations** body (multipart/form-data):
```
participants: JSON array of user IDs
name: string (for group chats)
groupprofilepic: image file (optional, max 5MB)
```

### Users — `/users`

| Method | Path | Description |
|---|---|---|
| GET | `/users` | Get logged-in user's profile |
| POST | `/users` | Update bio |
| POST | `/users/profilepic` | Upload profile picture (max 5MB) |

## Socket.IO Events

The socket connection requires a valid JWT passed via handshake auth:

```js
socket.auth = { token: "<jwt>" };
socket.connect();
```

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `user-online` | — | Mark user as online, broadcast to all clients |
| `user-offline` | — | Mark user as offline, broadcast to all clients |
| `send-message` | `{ chatId, content }` | Send a message to a conversation |
| `typing` | `{ chatId }` | Notify other participants user is typing |
| `stop-typing` | `{ chatId }` | Notify other participants user stopped typing |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `online-users` | `userId[]` | Updated list of online user IDs |
| `new-message` | message object | New message received in a conversation |
| `user-typing` | `{ userId }` | A user started typing |
| `user-stop-typing` | `{ userId }` | A user stopped typing |

## Testing

```bash
npm test
```

Runs Jest with coverage. Tests live in `tests/` and cover auth, conversations, users, and socket events.
