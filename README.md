# SecureNote Application

A lightweight, secure full-stack web application for managing text notes. Built with React (Frontend) and Express.js (Backend) to demonstrate client-server architecture, secure communication, and dynamic data routing.

## Features
- **Two-Way Data Routing**: Seamlessly switch between Local File System (Public Mode) and PocketHost API (Instructor Mode).
- **Secure Operations**: Create, update, and delete actions are protected by a Secret Token.
- **Modern UI/UX**: Features Dark Mode, Grid Layout, Markdown support, and Optimistic UI updates.

## Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm or yarn

## 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add your configuration:
   ```env
   PORT=3000
   SECRET_TOKEN=your_secret_password_here
   ```
   *(Note: Never commit the `.env` file to version control)*
4. Start the server:
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:3000`.

## 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:3000/api/notes
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and go to the local URL provided by Vite (usually `http://localhost:5173`).

## Usage
- The application features **Two-Way Data Routing**: Public Mode (Local FS) and Instructor Mode (PocketHost API).
- **Authentication Requirement:** For security compliance, all data mutation operations (Create, Update, Delete) in **BOTH** modes strictly require the `SECRET_TOKEN`.
- You must enter the valid `SECRET_TOKEN` in the UI context to unlock the ability to submit the form or modify existing records. Reading notes (GET) remains publicly accessible without a token across all modes.