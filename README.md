# College Attendance Management System

A modern, mobile-first College Attendance System featuring dynamic 20-second temporary QR codes, automated Google Form publish/unpublish lifecycle control via Google Apps Script Web App API, and Replay Protection to prevent old QR screenshot reuse.

---

## 🌟 Key Features

* **Admin/Teacher Dashboard**: Create attendance sessions, select subjects, and monitor active sessions.
* **20-Second Temporary QR Code Generator**: Generates unique, scannable QR codes valid for a configurable 20 seconds (`QR_SESSION_DURATION = 20`).
* **Automated Google Form Lifecycle**:
  * **On Generate QR**: Automatically calls Google Apps Script API (`action=publish`) to open the Google Form for responses.
  * **On Expiry / End Attendance**: Automatically calls Google Apps Script API (`action=unpublish`) to close the Google Form.
* **Replay Protection & Screenshot Security**:
  * Encodes dynamic session tokens (`student.html?sid=ATT-XXXXX`).
  * Old QR codes and screenshots automatically expire after 20 seconds.
  * Scanning an expired QR code displays an explicit error message:  
    > ❌ **QR EXPIRED — Please scan the latest classroom QR code.**
* **Student Verification Portal**: Mobile-optimized verification screen that auto-directs valid student scans to the official Google Form.

---

## 📁 Project Structure

```
college-attendance/
├── index.html         # Admin Login Portal
├── dashboard.html     # Main Overview Dashboard
├── attendance.html    # Create Attendance & QR Code Screen
├── student.html       # Student Verification Portal (Replay Protection)
├── records.html       # Attendance Records & Filterable Table
├── server.js          # Local HTTP development server
├── css/
│   └── style.css      # Design System CSS tokens & Responsive styles
└── js/
    ├── dashboard.js   # Shared utilities, auth guard, topbar & navigation
    ├── attendance.js  # QR lifecycle, timer countdown & Apps Script API calls
    ├── student.js     # Student QR session verification logic
    ├── records.js     # Attendance records filtering & pagination
    └── students.js    # Student management logic
```

---

## ⚙️ Production Configurations

The following endpoints are pre-configured in `js/attendance.js` and `js/student.js`:

| Setting | Value |
| :--- | :--- |
| **Google Form Responder URL** | `https://docs.google.com/forms/d/e/1FAIpQLSd3-5CYQf2Kf0704JPohMNo-287C4Xc4HxpXGFSk9ejPZFKkQ/viewform` |
| **Google Apps Script Web App API** | `https://script.google.com/macros/s/AKfycbz6_E2kZ0s2MWoki8TMf7Be0d_vBj9HVtj4l-kJx60tGN5L6yW8Svua_UhaEsIKTRq2/exec` |
| **QR Session Duration** | `20` seconds (Configurable via `QR_SESSION_DURATION` in `js/attendance.js`) |

---

## 🚀 How to Run Locally

1. Open your terminal in the project directory:
   ```bash
   node server.js
   ```
2. Open your browser to:
   ```
   http://localhost:8000/attendance.html
   ```

---

## 🌐 Production Deployment Steps

### Option 1: Deploying to Vercel (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Prepare College Attendance System for production"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/college-attendance.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Click **Import** next to your `college-attendance` GitHub repository.
   - **Framework Preset**: Select **Other** (Static HTML).
   - **Root Directory**: `./` (leave default).
   - Click **Deploy**.

3. **Verify Production Site**:
   - Vercel provides a live URL (e.g. `https://college-attendance.vercel.app`).
   - Open `https://college-attendance.vercel.app/attendance.html`.
   - Dynamic QR URL generation automatically detects your production domain!

---

### Option 2: Deploying to GitHub Pages

1. Go to your GitHub repository on `github.com`.
2. Click **Settings** → **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` / `/ (root)` and click **Save**.
4. Your application will be live at:
   ```
   https://YOUR_USERNAME.github.io/college-attendance/
   ```

---

## 🔒 Security & Architecture Notes

* **No Hardcoded Localhost URLs**: QR URLs dynamically construct target links using `window.location.origin`, making the deployment domain-agnostic.
* **Double-Layer Expiry Enforcement**:
  1. Client-side timestamp verification (`student.html`).
  2. Server-side Google Form unpublish via Apps Script Web App (`action=unpublish`).
* **Environment Variables**: Static frontend deployments do not require build-time environment variables, as the pre-configured Apps Script API endpoint handles secure form state toggling.
