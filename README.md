# SecureNote Application

A full-stack web application demonstrating client-server architecture, secure communication, and local data persistence.

## Prerequisites
- Node.js installed on your system.
- npm (Node Package Manager).

## Backend Setup & Execution
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory (do not commit this file) with the following variables:
   ```env
   PORT=3000
   SECRET_TOKEN=your_custom_secret_token
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   The server will run on `http://localhost:3000`.

## Frontend Setup & Execution
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).