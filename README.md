# NexHire - AI Recruitment & ATS Platform

NexHire is a modern, AI-powered Applicant Tracking System (ATS) and Recruitment dashboard built with React (Vite), TailwindCSS, FastAPI, and PostgreSQL. It leverages LLMs to automatically score resumes, generate candidate summaries, and manage HR workflows.

## Architecture

- **Frontend:** React 18, Vite, TailwindCSS, Lucide Icons
- **Backend:** FastAPI, Python 3.10+, SQLAlchemy (PostgreSQL)
- **AI Integrations:** Groq (Llama-3.3-70b), OpenRouter
- **Authentication:** JWT (JSON Web Tokens) & Firebase Admin (for Social Login)

---

## 🔒 Authentication & Environment Variables Setup

This project uses environment variables (`.env` files) to securely store API keys and database credentials. **These files are private and are strictly ignored by `.gitignore` to prevent accidentally leaking credentials.**

You will need to create two `.env` files based on the provided templates: one for the frontend and one for the backend.

### 1. Backend Environment Setup
1. Navigate to the `backend` folder.
2. Create a new file named `.env`.
3. Copy the contents of `backend.env.example` into `backend/.env`.
4. Update the values with your actual database and API credentials.

Key configurations in `backend/.env`:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `SECRET_KEY`: A long, random string used to securely sign JWT tokens.
- `GROQ_API_KEY`: Your Groq API key for the AI engine.
- `FIREBASE_KEY_PATH`: Path to your downloaded Firebase Service Account JSON file (used to verify Google login tokens).

### 2. Frontend Environment Setup
1. Navigate to the `hreasy` folder (frontend).
2. Create a new file named `.env`.
3. Copy the contents of `frontend.env.example` into `hreasy/.env`.
4. Update the `VITE_FIREBASE_*` variables with your Firebase project config if you are using Google Social Login.

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (running locally or remotely)

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```cmd
   cd backend
   ```
2. Create and activate a virtual environment:
   ```cmd
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```cmd
   pip install -r requirements.txt
   ```
4. Create the Database & Seed Demo Data:
   ```cmd
   python create_db.py
   python seed.py
   ```
   *Note: This creates tables and populates demo users.*
5. Start the FastAPI server:
   ```cmd
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```cmd
   cd hreasy
   ```
2. Install dependencies:
   ```cmd
   npm install
   ```
3. Start the Vite development server:
   ```cmd
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

---

## 👥 Demo Login Credentials

The database seeder automatically creates the following demo accounts. The default password for all demo accounts is **`password`**.

| Email | Role |
|-------|------|
| `hr@enterprise.com` | HR Manager |
| `lead@enterprise.com` | Team Lead |
| `employee@enterprise.com` | Regular Employee |
| `candidate@enterprise.com` | Job Candidate |

You can use the **Quick Login** buttons on the sign-in page to instantly test these roles.
