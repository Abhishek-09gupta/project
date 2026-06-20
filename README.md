# CodeArena | Online Judge & AI coding Copilot Platform

CodeArena is a premium, high-aesthetic competitive programming platform featuring a sandboxed code execution engine, real-time grading, dynamic dashboards, global leaderboards, tournaments/contests, and Gemini AI-powered code diagnostics.

---

## ✨ Features

### 🌌 Visual Design & Layout
* **Glassmorphism Theme**: Futuristic dark mode theme styled with curated color schemes (`#080c14`), smooth borders, and responsive grid layouts.
* **Animated Elements**: Interactive hover states, pulsing indicators, and custom glowing elements.

### 💻 Split Coding Arena
* **Monaco Editor Integration**: Fully featured code editor (based on VS Code's editor) loaded with template code adapters for **C++**, **Java**, and **Python**.
* **Live Compilation Engine**: Custom test input console executing code locally on the host, rendering compile traces, run speeds, memory usages, and grading results.
* **Execution Status Polling**: Asynchronous queue manager polling backend worker states to show real-time evaluation steps (`Pending` ➡️ `Processing` ➡️ `Verdict`).

### 🧠 Gemini AI Assistant
* **Complexity Forecaster**: Queries Gemini models (falling back to heuristic rules if no API key is set) to display runtime and spatial complexity analyses ($O(N)$, $O(1)$) with logic explainers.
* **Logic Guidance Hints**: Prompts helper guidance bubbles pointing you in the right direction without dumping direct code solutions.

### 🏆 Gamification & Contests
* **User Streaks & Scores**: Tracks user submission dates to maintain continuous study streaks 🔥 and adds profile rank scores 🏆 based on challenge difficulty points.
* **Global Leaderboards**: Highlights top programmers on custom 3D Gold, Silver, and Bronze podium cards, followed by a searchable ranked contestant table.
* **Tournament Lobby**: Displays Live 🔴 (with ticking countdowns), Upcoming, and Ended contests. Automatically locks/unlocks problems based on exact time ranges.

### 📊 Admin Analytics Console
* **Custom SVG Interactive Charts**:
  * **Difficulty Rings**: Segmented donut SVG showing easy, medium, and hard problem distributions.
  * **Submission Rates**: Wave line path chart mapping submission frequency over the last 7 days.
  * **Language Splits**: Responsive bar dividers illustrating language usage shares (Python vs. C++ vs. Java).
* **Problem & Contest Planners**: Complete admin forms to add, edit, or delete problem inputs, constraints, test cases, and scheduled contest dates.

---

## 🛠️ Technology Stack

### Frontend Client
* **React** (v19)
* **Vite** (Build Tool)
* **Tailwind CSS** (v4) with custom components
* **Monaco Editor React** (Editor)
* **Lucide React** (Icons)
* **React Router Dom** (Routing & guards)

### Backend API Server
* **Node.js / Express** (API Server)
* **JWT** (Token auth) & **bcryptjs** (Password hashing)
* **Child Process Spawns** (Compiling and local code execution)
* **Google Generative AI SDK** (Gemini interface)
* **Custom JSON Collection DB** (Local file-based lightweight database)

---

## 🚀 Setup & Execution Guide

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (Required to run Python challenges)
3. *(Optional)* **G++ Compiler** and **JDK**: Required if you wish to run C++ and Java code executions locally.

---

### Step-by-Step Run Instructions

#### 1. Setup Backend Server
Open a terminal window and run:
```bash
# Go to backend folder
cd backend

# Install dependencies
npm install

# Run database seeder & start express API server
npm run dev
```
*This mounts the database locally under `backend/data` (JSON files) and runs the server on `http://localhost:5000`.*

#### 2. Setup Frontend Client
Open a second terminal window and run:
```bash
# Go to frontend folder
cd frontend

# Install client packages
npm install --legacy-peer-deps

# Start Vite client dev environment
npm run dev
```
*This boots the browser portal on `http://localhost:5173`.*

#### 3. Log In & Explore
* Access the interface in your browser: [http://localhost:5173](http://localhost:5173).
* Log in as the default Administrator to check out charts and manage problems:
  * **Email**: `admin@codejudge.com`
  * **Password**: `admin123`
* Or sign up as a new user to test compilation runs and solve coding challenges!

---

## 📁 Repository Structure
```text
project/
├── backend/
│   ├── controllers/      # Route logic (Auth, Problems, Submissions, Contests)
│   ├── data/             # Local database storage (.json files)
│   ├── temp_runs/        # Execution folders created during compiler spawns
│   ├── server.js         # Express main entrypoint
│   ├── db.js             # Local Collection-based DB adapter
│   └── judge.js          # Spawns compiler child processes
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared Layout blocks (Navbar, Footer)
│   │   ├── context/      # AuthContext providers
│   │   ├── pages/        # Dashboard, ProblemArena, Admin, Leaderboard, Contests
│   │   ├── utils/        # api.js fetch client configuration
│   │   ├── App.jsx       # Routing entries
│   │   └── index.css     # Tailwind v4 directives and styling
│   └── index.html        # App entry document
└── README.md             # Project roadmap & instructions
```
