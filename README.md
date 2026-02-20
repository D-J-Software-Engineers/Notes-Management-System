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

## 🚀 Deployment Options

Choose the deployment method that fits your environment. **Option A (Docker)** is recommended for the easiest setup.

### Option A: The Pure Docker Way (Recommended)

The easiest way to fire up the server is using a single Docker command.

1. **Install Prerequisites (If needed)**:
   On Ubuntu/Debian:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   ```

2. **Start the System**:
   Open a terminal in the folder and run:
   ```bash
   docker compose up --build -d
   ```

   This will automatically:
   - **Build & Link**: Set up the database and the server together.
   - **Environment**: Use secure default settings automatically.
   - **Auto-Seed**: Create the Admin account (**Email**: `admin@school.com`, **Password**: `Admin@123`).

3. **Access App**:
   Open [http://localhost:5000](http://localhost:5000) on the server.

---

### Option B: Manual Setup (ICT Lab Edition)

Use this if you prefer to run Node.js and PostgreSQL directly on your Server PC.

#### 1. Prerequisites
- **Node.js**: Installed on the Server PC (v20 recommended).
- **PostgreSQL**: Installed and running on the Server PC.
- **Network**: All computers must be connected to the same Router/Switch.

#### 2. Installation
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Database**:
   - Create a database named `notes_management`.
   - Ensure your `.env` file matches your DB credentials (see `.env.example`).
3. **Seed Admin Account**:
   ```bash
   npm run seed
   ```
4. **Start the System**:
   ```bash
   npm start
   ```

---

## 🌐 Connecting Students (LAN)

Regardless of the installation method:

1. **Find Server IP**:
   - Run `hostname -I` (Linux) or `ipconfig` (Windows).
   - Locate the IPv4 Address (e.g., `192.168.1.100`).

2. **Accessing from other PCs**:
   - Students open a browser and go to: `http://<SERVER_IP>:5000`

3. **Offline Installation (PWA)**:
   - On Chrome/Edge, click the **Install** icon in the address bar to add the system to your desktop or phone for offline use.

---

## 📂 Project Structure

- `client/`: Frontend (HTML/CSS/JS)
- `server/`: Backend (Node.js API)
- `uploads/`: Stores note files (Ensure this folder is backed up!)
- `ecosystem.config.js`: Configuration for keeping the server alive (Manual setup).

---

## ⚙️ Management & Security

- **Stop System (Docker)**: `docker compose down`
- **View Logs (Docker)**: `docker compose logs -f`
- **Security**: 
  - Admin registration is **disabled** for public users.
  - File uploads are validated to prevent malicious scripts.
  - CSP and Helmet headers are enabled for production safety.
