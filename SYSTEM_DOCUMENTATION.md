# 📚 Nsoma DigLibs - Official Documentation

Welcome to the **Nsoma DigLibs** documentation. This guide covers everything from platform-level administration to student registration.

---

## 🚀 1. Getting Started (Super Admin)

The **Super Admin** is the master account responsible for managing the entire platform and onboarding new schools.

### 🏫 Creating a New School

1. Log in with your Super Admin credentials.
2. Navigate to the **🏫 Schools (Platform)** tab in the sidebar.
3. Click the **"+ Onboard New School"** button.
4. Fill in the school details:
   - **School Name**: The full name of the institution.
   - **Slug/Domain**: a unique short-name (e.g., `midland-high`).
   - **Initial License**: Choose the starting duration (1, 2, or 3 years).
5. Click **"Onboard School"**.
6. **Important:** Once created, the system will automatically generate a unique **Invite Code** for that school. You will see this in the Schools table.

### 🛡️ Activating / Extending School Licenses

If a school's license is expiring:

1. Go to the **🛡️ System Activation** tab.
2. Select the school from the **"Select School"** dropdown.
3. Choose the **License Duration** (1, 2, or 3 years).
4. Click **"Activate / Extend License"**.
   - _The School Admin will instantly see their updated expiration date on their dashboard._

---

## 🏫 2. School Administration (School Admin)

The **School Admin** manages the specific day-to-day operations of their school.

### 👥 Approving New Students

When a student registers using your school's Invite Code, they are placed in a **Pending** state for security.

1. Go to the **👥 Students / Staff** tab.
2. Change the filter to **"Pending Approval"**.
3. You will see a list of students waiting for access.
4. Click the green **"Confirm"** button next to each student to grant them access.

### 📖 Managing Subjects & Streams

- **Streams:** Define class sections (e.g., "S1 A", "S1 B") in the **📁 Streams** tab.
- **Subjects:** Create or edit subjects in the **📖 Subjects** tab. Note: Most standard subjects are auto-seeded when the school is created.

### 🔑 Resetting User Passwords

If a student or teacher forgets their password:

1. Check the **🔑 Reset Requests** tab for any incoming requests.
2. Alternatively, find the user in the **Students / Staff** tab and click **"View"** to set a new password for them.

### 📅 Tracking Subscription Status

1. Check the **🛡️ System Activation** tab to see your license expiration date.
2. If you see a **Yellow Banner** on your dashboard, it means your license is expiring soon (within 30 days). Contact the Super Admin to renew.

---

## 📝 3. Content Management (Teachers)

Teachers are responsible for providing learning materials.

### 📝 Uploading Notes

1. Navigate to the **📝 Notes** tab.
2. Click **"+ Upload New Note"**.
3. Select the **Subject**, **Class**, and upload the file (PDF, Docx, etc.).
4. Add a description and click **"Upload"**.

### ❓ Creating Quizzes & Activities

1. Navigate to the **❓ Activity/Quizzes** tab.
2. Click **"+ Add Activity/Quiz"**.
3. Provide the title, subject, and upload the activity file.

---

## 🎓 4. Student Registration Flow

Students do not need an account created for them; they register themselves using a secure code.

### 📝 Step-by-Step Registration

1. Go to the **Register** page.
2. **Enter Invite Code:** Enter the 6-character code provided by your school admin (e.g., `XY7890`).
3. Fill in your Name, Email, and Password.
4. **Select Level:**
   - **O-Level:** Select your Class and Stream.
   - **A-Level:** Select your Stream (Arts/Science) and pick your **3 Principal Subjects** and **1 Subsidiary**.
5. Click **"Create Account"**.
6. **Wait for Approval:** You will see a message saying your account is pending. You cannot login until your School Admin approves you.

---

## 🔒 5. Security & Invite Codes

The system uses a **Closed-Registration Model** to ensure data privacy between schools.

- **Invite Codes are Private:** Each school has one unique code. If a school's code is compromised, it can be updated in the database.
- **Automatic Multi-Tenancy:** The system automatically ensures that notes uploaded by "School A" are never visible to students of "School B".
- **Super Admin Oversight:** The Super Admin can see all schools and users but cannot see private notes unless specifically authorized.

---

---

## 💰 6. Financial Oversight (Super Admin Only)

The platform provides a basic revenue tracking system to help you manage the business side of Nsoma DigLibs.

### 💰 Revenue Tracking

1. Navigate to the **💰 Financials / Revenue** tab.
2. You will see a list of all onboarded schools.
3. **Metrics:**
   - **Students (Confirmed/Total):** See how many students have actually been approved by the school.
   - **Fee Per Student:** The agreed-upon rate for that specific institution.
   - **Expected Revenue:** Automatically calculated as `Student Count * Fee Per Student`.
   - **Total Platform Revenue:** The sum of expected revenue from all active schools.

### 💸 Updating Fees

1. If you need to change the fee for a school, go to the **🏫 Schools (Platform)** tab.
2. Click **"View/Edit"** on a school to update their per-student rate.

---

## 🔑 7. System Access & Credentials

### 🔑 Master System Admin (Super Admin)

To access the system for the first time and create your first school, use the master credentials defined in your server's `.env` file.

- **Default Email:** `admin@nsoma.ug` (or whatever is in `SUPER_ADMIN_EMAIL`)
- **Default Password:** `admin1234` (or whatever is in `SUPER_ADMIN_PASSWORD`)

### 🖥️ Unified Admin Portal

Both the **Super Admin** and **School Admins** use the same login page and dashboard interface. However, the system uses "Role-Based Access Control" (RBAC) to dynamically show or hide features:

- **School Admins** only see data related to their own school.
- **Super Admins** see global platform tools (Revenue, School Management, Global Stats) that are hidden from regular admins.

> [!CAUTION]
> Protect these credentials carefully. The Super Admin has the power to deactivate any school or delete any user on the platform.

---

## 🔔 8. Automated Student Notifications

The system includes a smart notification engine that keeps students informed whenever new academic content is posted.

### 🔔 How it Works

Notifications are triggered automatically in the background when a Teacher or Admin uploads new content. The system intelligently filters recipients so that only relevant students are notified.

### 📬 Who Gets Notified?

- **O-Level:** Students in the specific **Class** (e.g., S1) and **Stream** associated with the content.
- **A-Level:** Students matching the **Academic Stream** (Arts/Sciences) or specific **Subject Combinations**.
- **General:** If content is marked for all streams, the entire class receives a notification.

### 📑 Types of Notifications

- **📝 New Notes:** Notifies students when a reading material or pamphlet is uploaded.
- **❓ New Activity/Quiz:** Alerts students to new assessment tasks.
- **🔗 New Resource:** Links to external videos or websites.
- **🗣️ New Discussion:** Invites students to join a live meeting or discussion topic.

### 📱 Viewing Notifications

Students will see a red notification badge on their dashboard. Clicking the notification will take them directly to the relevant tab (e.g., the Notes tab) to view the new content.

---

## 🛠️ Technical Support

For technical issues or to report bugs, please contact the **Master System Administrator** at the email provided during setup.
