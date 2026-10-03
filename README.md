# NLSQL-Converter: AI Database Assistant

A secure AI assistant that allows authorized users to ask questions about their company's existing database in normal English and receive answers without manually writing SQL.

---

## 🔐 Authentication Module Overview

This repository includes a complete, end-to-end authentication module matching the UI and system architecture:

1. **Frontend (React 19 + TypeScript + Vite + Tailwind CSS)**:
   - **Login Page** (Screen 1): Split-screen with marketing graphics on the left and login credentials on the right (Email, Password with show/hide toggle, Remember Me, Forgot Password, Sign in with Google, Sign Up link, and 1-click demo filler).
   - **Register Page**: Dual-pane signup with Full Name, Email, Password, Role selector (`Manager`, `Data Analyst`, `Administrator`, `Viewer`), and Confirm Password.
   - **Forgot / Reset Password**: Token-based password recovery flow.
   - **Dashboard Page** (Screen 2): Protected view showing user greetings, statistics (Databases, Queries, Active users), connected databases, recent queries, and logout.
   - **Auth Context & Guards**: JWT token management in localStorage, Axios authorization interceptor, route guards (`ProtectedRoute`, `PublicRoute`).

2. **Backend (FastAPI + PyMongo / MongoDB + Argon2 + JWT)**:
   - **MongoDB Storage**: Automatically indexes and stores user documents in the `users` collection.
   - **Argon2 Password Hashing**: Safe, cryptographic password hashing via `pwdlib`.
   - **JWT Tokens**: Secure HS256 tokens carrying user claims and configurable expiration.
   - **Resilience / Fallback**: Connects to live MongoDB via `MONGODB_URI` (local or MongoDB Atlas). If MongoDB is temporarily unreachable during development, automatically activates an in-memory `mongomock` instance with zero downtime.
   - **Seed Demo User**: Automatically seeds the demo account `john@company.com` / `password123`.

---

## 🚀 Quick Start

### 1. Start the Backend
Open a terminal in the root directory:
```powershell
.\start-backend.ps1
```
Or manually:
```powershell
cd backend
.\venv\Scripts\python.exe run.py
```
Backend API server starts at: `http://127.0.0.1:8000`  
Interactive Swagger API docs at: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend
Open a second terminal in the root directory:
```powershell
.\start-frontend.ps1
```
Or manually:
```powershell
cd frontend
npm run dev
```
Frontend application opens at: `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Manager** | `john@company.com` | `password123` |

*(You can also click the **"Fill Demo"** button on the Login page to autofill these credentials instantly)*

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate with email and password, returns JWT |
| `POST` | `/api/auth/register` | Register new user in MongoDB |
| `POST` | `/api/auth/google` | Google OAuth sign-in / registration |
| `GET` | `/api/auth/me` | Fetch authenticated user profile (Requires Bearer token) |
| `PUT` | `/api/auth/profile` | Update profile information |
| `POST` | `/api/auth/change-password` | Change user password |
| `POST` | `/api/auth/forgot-password` | Request password reset token |
| `POST` | `/api/auth/reset-password` | Confirm reset with token and new password |
| `GET` | `/api/auth/db-status` | Check MongoDB connection status |
| `POST` | `/api/auth/seed-demo` | Seed demo user `john@company.com` |
| `GET` | `/api/health` | Service health status |

---

## ⚙️ Configuration (`backend/.env`)

Edit `backend/.env` to configure your MongoDB connection:
```env
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017

# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority

MONGODB_DB_NAME=nlsql_db
JWT_SECRET=nlsql_jwt_secret_key_super_secure_2026_demo_key_xyz987
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```
