# Socratic-AI Project Report

## 1. Project Overview
**Name:** Socratic-AI
**Purpose:** An AI-powered educational platform designed to act as a personal tutor. It helps students learn various subjects (like Physics, Chemistry, Math, Biology) through interactive study sessions, tracks their study time, monitors their focus streak, and calculates concept mastery.

## 2. Architecture & Tech Stack
The project follows a standard decoupled Client-Server architecture.

### Frontend (Client)
*   **Framework:** Next.js (v16.2.1) using the App Router (`src/app`).
*   **UI Library:** React (v19.2)
*   **Styling:** Tailwind CSS (v4) with PostCSS.
*   **Icons:** Lucide-React.
*   **State Management & Forms:** React Hook Form + Zod for validation.
*   **Theming:** `next-themes` for seamless Light/Dark mode toggling.

### Backend (Server)
*   **Environment:** Node.js
*   **Framework:** Express.js (v5)
*   **Database:** MongoDB with Mongoose (v9).
*   **Authentication:** JSON Web Tokens (JWT) & Bcrypt for secure password hashing.
*   **File Handling:** Multer (used for avatar uploads).
*   **CORS:** Enabled for cross-origin requests from the frontend.

## 3. Directory Structure
```text
Socratic-AI/
├── backend/
│   ├── config/ & db/        # Database connection and Mongoose Models (User, Session, etc.)
│   ├── src/
│   │   ├── controller/      # Core logic (Auth, Session, Tutor, User controllers)
│   │   ├── middleware/      # Authentication and validation middlewares
│   │   └── app.js           # Server application initialization
│   ├── routes/              # API Route definitions
│   ├── public/              # Static files (e.g., uploaded avatars)
│   └── server.js            # Entry point for the backend
└── frontend/
    ├── public/              # Static assets (images, vector graphics, etc.)
    └── src/
        ├── app/             # Next.js App Router (Dashboard, Login, Session, Progress, Settings)
        ├── components/      # Reusable React components (SessionTimer, ChatBubble, ProfileForm)
        ├── context/         # React Contexts (FocusModeContext)
        ├── hooks/           # Custom React hooks (useSessionTimer)
        └── lib/             # Utility functions and API helpers
```

## 4. Key Features
*   **Intelligent Tutor Interface:** Interactive conversational UX allowing students to dive deep into subjects.
*   **Comprehensive Student Dashboard:** Tracks weekly study hours, total sessions, and mastered concepts.
*   **Progress Tracking & Streaks:** Visualizes learning streak, weekly study patterns (dynamic bar charts), and profile completion.
*   **Settings & Customization:** Secure credential management, dynamic avatar uploads, and UI theme toggling.
*   **Study Timers:** Real-time tracking of active study sessions using custom hooks (`useSessionTimer`).

## 5. Setup & Installation
### Prerequisites
*   Node.js (v20+)
*   MongoDB Instance (Local or Atlas)

### Running the Backend
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Set up your `.env` file (Database URI, JWT Secret, Port).
4. Run the server: `npm run dev` (Runs on `http://localhost:5000` by default).

### Running the Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev` (Runs on `http://localhost:3000`).

## 6. Recent Improvements
*   **Dynamic Analytics:** Weekly study patterns accurately reflect minute-to-hour study conversions without rounding down small study bursts.
*   **Streak Mechanics:** Fixed UI bugs related to streak visualizations (e.g., correct `🔥` representation).
*   **Responsive Headers:** Dashboard headers properly align icons and handle varying screen sizes using flexbox layouts.
*   **Accurate Account Details:** Profile settings dynamically extract real database timestamps (`createdAt`) for account joining details instead of hardcoded placeholders.
