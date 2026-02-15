# Notes Management System (LAN Edition)

A web-based **Notes Management System** designed for Ugandan schools (O-Level & A-Level).
Optimized for **ICT Lab Deployment** and **Offline Access (PWA)**.

## 📌 Features

- **Admins (Teachers)**: Upload, edit, and manage notes.
- **Students**: Browse and download notes (Read-only).
- **LAN Access**: Accessible by all computers in the lab via Wi-Fi/Ethernet.
- **PWA Support**: Installable on Android & Windows. Works offline.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla) + Service Worker (PWA)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Security**: Helmet, Rate Limiting, UUIDs for files

---

## 🚀 How to Run in the ICT Lab

### 1. Prerequisites

- **Server PC**: The teacher's computer or a dedicated server.
- **Node.js**: Installed on the Server PC.
- **PostgreSQL**: Installed and running on the Server PC.
- **Network**: All computers must be connected to the same Router/Switch.

### 2. Installation (Server PC)

1.  **Clone/Copy** the project folder to the Desktop.
2.  Open a terminal in the folder and install dependencies:
    ```bash
    npm install
    # This installs all libraries including pm2 for stability
    ```
3.  **Configure Database**:
    - Ensure PostgreSQL is running.
    - Create a database named `notes_management`.
    - Check `.env` (create it if missing) to match your DB credentials:
      ```env
      DB_NAME=notes_management
      DB_USER=postgres
      DB_PASSWORD=your_password
      DB_HOST=localhost
      JWT_SECRET=some_secret_key_here
      ```
4.  **Seed Admin Account**:
    ```bash
    npm run seed
    ```
    _This creates the initial Admin account._

### 3. Starting the System

To start the system and keep it running (even if you close the terminal):

```bash
npm start
```

- Information: This uses `pm2` to manage the server.
- To stop the server: `npm run stop`
- To check status: `npm run monitor`

### 4. Connecting Students (LAN)

1.  Find the **Server's IP Address**:
    - Open Command Prompt/Terminal on the Server.
    - Run `ipconfig` (Windows) or `hostname -I` (Linux/Mac).
    - Look for the IPv4 Address (e.g., `192.168.1.100`).

2.  **On Student Computers / Phones**:
    - Open Chrome or Edge.
    - Type the Server IP and Port 5000:
      `http://192.168.1.100:5000` (Replace with your actual IP)

3.  **Install App**:
    - Click the "Install" icon in the address bar to install it as a native app on Windows or Android.

---

## 📂 Project Structure

- `client/`: Frontend (HTML/CSS/JS)
- `server/`: Backend (Node.js API)
- `uploads/`: Stores note files (Ensure this folder is backed up!)
- `ecosystem.config.js`: Configuration for keeping the server alive.

## ⚠️ Security Notes

- Admin registration is **disabled** for public users. Create admins via database or seed script.
- File uploads are validated to prevent viruses/scripts.
