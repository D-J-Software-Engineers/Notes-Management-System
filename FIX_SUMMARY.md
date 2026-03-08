# Fix: "No subjects found for this stream" Error During A-Level Registration

## Problem
When students try to register for A-Level (S.5/S.6), the registration form shows the error:
> "No subjects found for this stream."

This occurs because A-Level subjects are not seeded in the database.

## Root Cause
The `seedDatabase.js` only created an admin user but didn't populate the Subject table with A-Level subjects for the "science" and "arts" streams.

## Solution Implemented
Updated `server/utils/seedDatabase.js` to:
1. Automatically seed O-Level subjects (S1-S4) for all curriculum subjects
2. Automatically seed A-Level subjects (S5-S6) for science and arts streams
3. Categorize subjects by stream:
   - **Science stream**: Physics, Chemistry, Biology, Mathematics (both), Geography (both)
   - **Arts stream**: History, Economics, Literature, Divinity, Arabic, Kiswahili, Religious Education, Mathematics (both), Geography (both)
   - **Both**: Mathematics, Geography

## How to Apply the Fix

### Step 1: Stop the Application
- Close the running Nsoma-DigLibs application (if running as Electron app)
- Or stop the Node.js server (`Ctrl+C` in terminal)

### Step 2: Delete the Old Database
```powershell
cd "c:\Users\Jimtechs Ug\Notes-Management-System-main"
Remove-Item database.sqlite -Force
```

### Step 3: Restart the Application
- Start the server: `npm start`
- Or run the Electron app: `npm run electron:start`

The server will automatically:
- Recreate the database schema
- Seed the admin user
- Seed all O-Level and A-Level subjects

### Step 4: Test the Fix
1. Go to the registration page
2. Select Level: "A-Level"
3. Select Class: "S5"
4. Select Stream: "Science" or "Arts"
5. The subjects should now load successfully with options like:
   - **Science**: Physics, Chemistry, Biology, Mathematics, Geography
   - **Arts**: History, Economics, Literature, Arabic, Kiswahili, Religious Education, etc.

## Subjects Available

### A-Level Science Stream (S5/S6)
- Physics
- Chemistry  
- Biology
- Mathematics
- Geography

### A-Level Arts Stream (S5/S6)
- History
- Economics
- Literature
- Divinity
- Arabic
- Kiswahili
- Religious Education
- Mathematics
- Geography

### O-Level Subjects (S1-S4)
- Mathematics
- English
- Physics
- Chemistry
- Biology
- History
- Geography
- CRE
- Agriculture
- Commerce

## Files Modified
- `server/utils/seedDatabase.js` - Added subject seeding functions

## Verification
After restarting, check the database has subjects:
```powershell
# If using SQLite CLI
sqlite3 database.sqlite "SELECT COUNT(*) as subject_count FROM subjects;"

# Expected output: subject_count >= 100 (13 A-Level subjects × 2 classes × varies by stream + 10 O-Level subjects × 4 classes = ~100+)
```
