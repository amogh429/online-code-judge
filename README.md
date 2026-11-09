# Online Code Judge System (MERN)

A starter full-stack Online Code Judge built with React + Vite, Express, MongoDB, Redis/BullMQ, JWT authentication, Monaco Editor, and Judge0-compatible execution API.

## Features
- Register/login with JWT
- Problem list and problem details
- Monaco code editor with language selector
- Run code against sample input
- Submit code and save submission history
- Background submission queue with BullMQ/Redis
- Testcase verdicts and leaderboard endpoint
- Responsive dark UI

## Architecture
React -> Express API -> MongoDB
                    -> Redis/BullMQ worker -> Judge0 API

**Security:** never run untrusted submitted code with Node's `child_process` on your own API server. This starter sends code to Judge0-compatible API. Configure a trusted execution service and keep its key on the backend.

## Requirements
- Node.js 20+
- MongoDB Atlas or local MongoDB
- Redis (local/WSL or hosted)
- Judge0-compatible API credentials (RapidAPI Judge0 or self-hosted instance)

## Setup
### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```
On Windows PowerShell, copy env with:
```powershell
Copy-Item .env.example .env
```
Fill in `MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`, `JUDGE0_BASE_URL`, and optional `JUDGE0_API_KEY` / `JUDGE0_API_HOST`.

### 2. Worker
Open another terminal:
```bash
cd backend
npm run worker
```
The worker consumes queued submissions. Keep it running during local development.

### 3. Frontend
Open a third terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open the local Vite URL shown in the terminal (usually http://localhost:5173).

## API routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/problems`
- `GET /api/problems/:id`
- `POST /api/submissions/run` (sample input; synchronous Judge0 request)
- `POST /api/submissions` (queue a saved submission)
- `GET /api/submissions/mine`
- `GET /api/submissions/:id`
- `GET /api/leaderboard`
- `GET /api/health`

## Deploy
- Frontend: deploy `frontend` to Vercel; set `VITE_API_URL` to the deployed backend URL.
- Backend API: deploy `backend` to Render or another Node host; configure all backend environment variables.
- Worker: deploy as a separate background worker service using `npm run worker`, with the same backend environment variables.
- MongoDB: MongoDB Atlas.
- Redis: hosted Redis compatible with BullMQ (TLS URLs may be needed).
- Judge0: use a trusted hosted provider or self-host in a properly isolated environment.

Do not deploy without setting strong secrets, restricting CORS to your frontend origin, and configuring the worker and execution provider.
