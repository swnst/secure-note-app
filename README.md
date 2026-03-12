# SecureNote Application

A lightweight, secure full-stack web application for managing text notes. Built with React (Frontend) and Express.js (Backend) to demonstrate client-server architecture, secure communication, and dynamic data routing.

## Features
- **Two-Way Data Routing**: Seamlessly switch between Local File System (Public Mode) and PocketHost API (Instructor Mode).
- **Dynamic Authentication**: Handles multiple authorization contexts securely via backend middleware.
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
- **Authentication Requirement:** For security compliance, all data mutation operations (Create, Update, Delete) strictly require a valid token.
- **Dynamic Token Injection:** - In **Public Mode**, enter your local `SECRET_TOKEN` from the `.env` file into the UI.
  - In **Instructor Mode**, enter the external target database token (e.g., `20260301eink`).
- The Express.js backend acts as a secure proxy, automatically handling the formatting of the `Authorization` header (injecting the `Bearer` prefix) and fulfilling schema requirements before reaching the upstream PocketHost server.