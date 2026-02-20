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

## 🚀 How to Run (ICT Lab Edition)

### 1. Prerequisites (Installation)

Run these commands to install **Docker** and **Node.js** (Ubuntu/Debian):

```bash
# Install Docker and Compose
sudo apt update && sudo apt install -y docker.io docker-compose-v2

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Start the System (One Command)

Clone the repository, open a terminal in the folder, and run:

```bash
npm run setup
```

This will automatically:

- Configure the environment (`.env`).
- Start the database and the server.
- **Seed the Admin account** (Email: `admin@school.com`, Password: `Admin@123`).

### 3. Connect Students (LAN)

1. **Find Server IP**: Run `hostname -I` (Linux) or `ipconfig` (Windows).
2. **Access App**: Students browse to `http://<SERVER_IP>:5000`.

---

## 📂 Project Structure

- `client/`: Frontend (HTML/CSS/JS)
- `server/`: Backend (Node.js API)
- `uploads/`: Stores note files (Ensure this folder is backed up!)

## 🛠️ Management

- **Stop**: `docker compose down`
- **View Logs**: `docker compose logs -f`
