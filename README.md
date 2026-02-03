# Notes Management System

A web-based **Notes Management System** designed for Ugandan schools following the **UNEB curriculum**.  
Admins manage and upload notes, while students securely access and download study materials.

---

## 📌 Overview

This system enables:

- **Admins (Teachers/Staff)** to upload, update, organize, and delete notes
- **Students** to browse and download notes (read-only access)

It supports both:
- **O-Level** (S1–S4)
- **A-Level** (S5–S6, UNEB subject combinations)

The application is built as a **web application / Progressive Web App (PWA)**, allowing it to run on **Android and Windows** from a single codebase.

---

## 🎓 Supported Education Levels

### O-Level
- Classes: **S1, S2, S3, S4**
- Subjects: Mathematics, English, Physics, Chemistry, Biology, History, Geography, CRE/IRE, Literature, and others.

### A-Level
- Classes: **S5, S6**
- UNEB subject combinations: PCM, BCG, HEG, PCB, HEL, MEG, and others.

---

## ✨ Key Features

### Admin
- Upload notes (PDF, DOC/DOCX, PPT/PPTX)
- Edit and delete notes
- Organize notes by level, class, and subject
- Manage student accounts
- View download statistics

### Student
- Browse notes by level and subject
- Download notes
- Search and filter notes
- Bookmark notes
- Offline access (PWA support)

---

## 🛠️ Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap 5

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Security
- JWT authentication
- Password hashing with bcrypt
- Role-based access control


## 📁 Project Structure (Folders and Files)

```
notes-management-system/
│
├── 📄 README.md                          ← You are here!
├── 📄 package.json                       ← Lists all dependencies
├── 📄 .gitignore                         ← Files Git should ignore
├── 📄 .env                               ← Secret settings (passwords, API keys)
│
├── 📁 client/                            ← FRONTEND (Everything users see)
│   │
│   ├── 📁 public/
│   │   ├── 📄 index.html                ← Homepage/Landing page
│   │   ├── 📄 favicon.ico               ← Website icon in browser tab
│   │   │
│   │   └── 📁 assets/
│   │       │
│   │       ├── 📁 css/                  ← Styling files
│   │       │   ├── 📄 styles.css        ← Main styles
│   │       │   ├── 📄 admin.css         ← Admin dashboard styles
│   │       │   ├── 📄 student.css       ← Student dashboard styles
│   │       │   └── 📄 responsive.css    ← Mobile/tablet styles
│   │       │
│   │       ├── 📁 js/                   ← JavaScript files
│   │       │   ├── 📄 main.js           ← Common functions
│   │       │   ├── 📄 admin.js          ← Admin functionality
│   │       │   ├── 📄 student.js        ← Student functionality
│   │       │   ├── 📄 auth.js           ← Login/logout logic
│   │       │   ├── 📄 upload.js         ← File upload handling
│   │       │   ├── 📄 search.js         ← Search functionality
│   │       │   └── 📄 utils.js          ← Helper functions
│   │       │
│   │       └── 📁 images/
│   │           ├── 📄 logo.png
│   │           └── 📄 default-avatar.png
│   │
│   └── 📁 pages/                         ← HTML pages
│       ├── 📄 login.html                ← Login page
│       ├── 📄 register.html             ← Student signup
│       ├── 📄 admin-dashboard.html      ← Admin home
│       ├── 📄 student-dashboard.html    ← Student home
│       ├── 📄 upload-notes.html         ← Upload form (admin only)
│       ├── 📄 edit-notes.html           ← Edit notes (admin only)
│       ├── 📄 view-notes.html           ← Browse all notes
│       ├── 📄 note-detail.html          ← Single note view
│       └── 📄 profile.html              ← User profile
│
├── 📁 server/                            ← BACKEND (The brain/logic)
│   │
│   ├── 📁 config/                        ← Configuration
│   │   ├── 📄 db.js                     ← MongoDB connection
│   │   ├── 📄 config.js                 ← App settings
│   │   └── 📄 subjects.js               ← UNEB subject combinations
│   │
│   ├── 📁 models/                        ← Database schemas
│   │   ├── 📄 User.js                   ← User data structure
│   │   ├── 📄 Note.js                   ← Note data structure
│   │   ├── 📄 Subject.js                ← Subject data structure
│   │   └── 📄 Class.js                  ← Class data structure
│   │
│   ├── 📁 routes/                        ← API endpoints (URLs)
│   │   ├── 📄 authRoutes.js             ← /api/auth/* (login, register)
│   │   ├── 📄 noteRoutes.js             ← /api/notes/* (CRUD for notes)
│   │   ├── 📄 userRoutes.js             ← /api/users/* (user management)
│   │   └── 📄 subjectRoutes.js          ← /api/subjects/*
│   │
│   ├── 📁 controllers/                   ← Business logic
│   │   ├── 📄 authController.js         ← Login/register functions
│   │   ├── 📄 noteController.js         ← Note CRUD functions
│   │   ├── 📄 userController.js         ← User management
│   │   └── 📄 subjectController.js      ← Subject handling
│   │
│   ├── 📁 middleware/                    ← Functions that run between requests
│   │   ├── 📄 auth.js                   ← Check if user logged in
│   │   ├── 📄 roleCheck.js              ← Check if user is admin
│   │   ├── 📄 upload.js                 ← Handle file uploads
│   │   └── 📄 errorHandler.js           ← Handle errors nicely
│   │
│   ├── 📁 utils/                         ← Helper functions
│   │   ├── 📄 validation.js             ← Validate user inputs
│   │   ├── 📄 fileHandler.js            ← File operations
│   │   └── 📄 seedDatabase.js           ← Create initial data
│   │
│   └── 📄 server.js                      ← MAIN FILE - Starts everything!
│
├── 📁 uploads/                           ← Uploaded files (NOT tracked by Git)
│   │
│   └── 📁 notes/
│       │
│       ├── 📁 o-level/
│       │   ├── 📁 s1/
│       │   │   ├── 📁 mathematics/      ← Math notes for S1
│       │   │   ├── 📁 english/
│       │   │   ├── 📁 physics/
│       │   │   └── ...
│       │   ├── 📁 s2/
│       │   ├── 📁 s3/
│       │   └── 📁 s4/
│       │
│       └── 📁 a-level/
│           ├── 📁 s5/
│           │   ├── 📁 pcm/              ← Physics, Chem, Math combo
│           │   ├── 📁 bcg/              ← Biology, Chem, Geo combo
│           │   ├── 📁 heg/              ← History, Econ, Geo combo
│           │   └── ...
│           └── 📁 s6/
│
└── 📁 docs/                              ← Documentation
    ├── 📄 API.md                         ← API documentation
    ├── 📄 DATABASE.md                    ← Database structure
    └── 📄 DEPLOYMENT.md                  ← How to deploy
```

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- MongoDB (local or Atlas)
- Git

### Installation

```bash
git clone https://github.com/D-J-Software-Engineers/Notes-Management-System.git
cd Notes-Management-System
npm install