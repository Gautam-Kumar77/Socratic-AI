# Socratic AI

This is the codebase for Socratic AI, a full-stack chat interface for AI tutoring and session management. 

It is split into a Next.js frontend and an Express/Node.js backend.

## Features

- Authentication: Standard JWT-based login and registration.
- Account Management: Users can update their username, upload avatars, and delete their accounts.
- Password Recovery: Reset passwords using security questions.
- Chat Interface: Routes for sending messages to the AI tutor and managing chat sessions.
- UI: Built with TailwindCSS, includes dark mode support via next-themes.

## Tech Stack

Frontend (/frontend)
- Next.js (App Router)
- React 19
- TailwindCSS v4
- react-hook-form and zod (form validation)
- lucide-react (icons)
- TypeScript

Backend (/backend)
- Node.js and Express
- MongoDB and Mongoose
- JWT (jsonwebtoken) and bcrypt
- multer (for avatar uploads)

## Architecture

This is a standard decoupled client-server setup.

1. Frontend: Handles the UI, client-side state, and routing. It talks to the backend via HTTP requests. It is responsible for keeping track of the JWT for authenticated routes.
2. Backend: Handles the business logic, database operations, and authentication. It exposes a REST API (/api/auth, /api/tutor, /api/session).
3. Auth Flow: The client sends credentials to /api/auth/login. The server verifies them against MongoDB and returns a JWT. The client saves this token and attaches it to the Authorization header for any protected API calls.

## Getting Started

### Prerequisites
- Node.js (v18+)
- A MongoDB instance (local or Atlas)

### Setup

1. Install root dependencies:
   ```bash
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

### Environment Variables

In the backend directory, create a .env file:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

(Optional) In the frontend directory, create a .env file if you need to point to a different API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### Running the App

You can start everything from the root directory.

Run both frontend and backend (Recommended):
```bash
npm run both
```
Eg. C:\AI assist\Socratic-AI> npm run both

Run them separately:
- Frontend only: npm run frontend (or npm run dev in the frontend/ folder)
Eg. C:\AI assist\Socratic-AI\frontend> npm run dev 

- Backend only: npm run backend (or npm start in the backend/ folder)
Eg. C:\AI assist\Socratic-AI\backend> npm run start
Local URLs:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
