# 📚 Nsoma DigLibs - Digital Library & Notes Management System

**Nsoma DigLibs** is a premium, multi-tenant digital library and academic management platform designed for schools. It provides a secure, isolated environment for institutions to share learning materials, track student performance, and manage subscriptions.

---

## 🌟 Key Features

- **🔐 Secure Multi-Tenancy:** Data isolation via unique School Invite Codes.
- **📁 Digital Library:** Upload and manage Notes, Quizzes, and external Resources.
- **👥 User Management:** Unified portal for Super Admins, School Admins, Teachers, and Students.
- **💰 Financial Tracking:** Super Admin dashboard for tracking school revenue and student subscriptions.
- **🛡️ Subscription Engine:** Direct activation and license management for institutions.
- **🗣️ Virtual Classroom:** Integrated discussion and meeting management.
- **🔔 Automated Notifications:** Smart alerts for students when new relevant content is posted.

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (v18+)
- **npm** or **yarn**
- **SQLite** (for local development) or **Postgres** (for production)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/D-J-Software-Engineers/Notes-Management-System.git
cd Notes-Management-System

# Install dependencies
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and add the following:

```env
PORT=5000
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=your_secret_key
SUPER_ADMIN_EMAIL=admin@nsoma.ug
SUPER_ADMIN_PASSWORD=admin1234
CLIENT_URL=http://localhost:3000
```

### 4. Run the Application

```bash
# Start the development server
npm run dev
```

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JS, HTML5, CSS3 (Glassmorphism UI)
- **Backend:** Node.js, Express
- **Database:** Sequelize ORM (supporting SQLite/Postgres)
- **Security:** JWT Authentication, Role-Based Access Control (RBAC)

---

## 📂 Project Structure

```text
├── client/              # Frontend assets and logic
│   ├── public/          # Static files, styles, and core JS
│   └── pages/           # Individual dashboard pages
├── server/              # Backend source code
│   ├── controllers/     # Business logic
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth and security guards
│   └── utils/           # Helper services (Notifications, Seeding)
├── uploads/             # User-uploaded files (Ignored by Git)
├── SYSTEM_DOCUMENTATION.md # Full user guide & manual
└── ARCHITECTURE.md      # Technical design & diagrams
```

---

## 📄 Documentation

For detailed information on how to use the system, please refer to:

- 📖 **[User Guide & System Documentation](file:///home/coder/Desktop/dero/Notes-Management-System/SYSTEM_DOCUMENTATION.md)**
- 🏗️ **[Architectural Design & Flowcharts](file:///home/coder/Desktop/dero/Notes-Management-System/ARCHITECTURE.md)**

---

## 🛡️ License

© 2026 Nsoma DigLibs. All rights reserved.
