// ============================================================
// dashboard.js — Shared utilities and dashboard logic
// College Attendance Management System - Step 1
// ============================================================
// TODO STEP 2: Replace sample data with Google Sheets / backend API calls

'use strict';

// ============================================================
// SAMPLE DATA — Replace with backend/Google Sheets in Step 2
// ============================================================
const SAMPLE_DATA = {
  college: {
    name: 'Greenfield College of Technology',
    adminName: 'Dr. Anita Sharma',
    adminEmail: 'admin@college.edu',
    adminRole: 'Administrator',
    academicYear: '2024–25',
  },

  stats: {
    totalStudents: 248,
    presentToday: 191,
    absentToday: 57,
    attendancePercent: 77.0,
  },

  recentAttendance: [
    { time: '09:00 AM', name: 'Rahul Verma',    rollNo: 'CS2201', email: 'rahul.v@student.edu',  status: 'present' },
    { time: '09:02 AM', name: 'Sneha Patil',    rollNo: 'CS2202', email: 'sneha.p@student.edu',  status: 'present' },
    { time: '09:05 AM', name: 'Arjun Mehta',    rollNo: 'CS2203', email: 'arjun.m@student.edu',  status: 'absent'  },
    { time: '09:08 AM', name: 'Priya Singh',    rollNo: 'CS2204', email: 'priya.s@student.edu',  status: 'present' },
    { time: '09:10 AM', name: 'Dev Kumar',      rollNo: 'CS2205', email: 'dev.k@student.edu',    status: 'present' },
    { time: '09:12 AM', name: 'Kavya Reddy',    rollNo: 'CS2206', email: 'kavya.r@student.edu',  status: 'absent'  },
    { time: '09:15 AM', name: 'Nikhil Joshi',   rollNo: 'CS2207', email: 'nikhil.j@student.edu', status: 'present' },
    { time: '09:18 AM', name: 'Ananya Roy',     rollNo: 'CS2208', email: 'ananya.r@student.edu', status: 'present' },
  ],

  students: [
    { rollNo: 'CS2201', name: 'Rahul Verma',    email: 'rahul.v@student.edu',  attendance: 92, status: 'active' },
    { rollNo: 'CS2202', name: 'Sneha Patil',    email: 'sneha.p@student.edu',  attendance: 88, status: 'active' },
    { rollNo: 'CS2203', name: 'Arjun Mehta',    email: 'arjun.m@student.edu',  attendance: 62, status: 'warning' },
    { rollNo: 'CS2204', name: 'Priya Singh',    email: 'priya.s@student.edu',  attendance: 95, status: 'active' },
    { rollNo: 'CS2205', name: 'Dev Kumar',      email: 'dev.k@student.edu',    attendance: 78, status: 'active' },
    { rollNo: 'CS2206', name: 'Kavya Reddy',    email: 'kavya.r@student.edu',  attendance: 55, status: 'danger' },
    { rollNo: 'CS2207', name: 'Nikhil Joshi',   email: 'nikhil.j@student.edu', attendance: 81, status: 'active' },
    { rollNo: 'CS2208', name: 'Ananya Roy',     email: 'ananya.r@student.edu', attendance: 90, status: 'active' },
    { rollNo: 'CS2209', name: 'Vikram Nair',    email: 'vikram.n@student.edu', attendance: 74, status: 'active' },
    { rollNo: 'CS2210', name: 'Pooja Desai',    email: 'pooja.d@student.edu',  attendance: 68, status: 'warning' },
    { rollNo: 'CS2211', name: 'Siddharth Rao',  email: 'sid.r@student.edu',    attendance: 83, status: 'active' },
    { rollNo: 'CS2212', name: 'Meera Kapoor',   email: 'meera.k@student.edu',  attendance: 97, status: 'active' },
    { rollNo: 'CS2213', name: 'Rishi Agarwal',  email: 'rishi.a@student.edu',  attendance: 45, status: 'danger' },
    { rollNo: 'CS2214', name: 'Tanvi Shah',     email: 'tanvi.s@student.edu',  attendance: 79, status: 'active' },
    { rollNo: 'CS2215', name: 'Karan Malhotra', email: 'karan.m@student.edu',  attendance: 86, status: 'active' },
  ],

  records: [
    { date: '2024-08-15', subject: 'Data Structures',       total: 45, present: 38, absent: 7 },
    { date: '2024-08-15', subject: 'Operating Systems',     total: 45, present: 35, absent: 10 },
    { date: '2024-08-14', subject: 'Web Development',       total: 45, present: 41, absent: 4 },
    { date: '2024-08-14', subject: 'DBMS',                  total: 45, present: 29, absent: 16 },
    { date: '2024-08-13', subject: 'Computer Networks',     total: 45, present: 40, absent: 5 },
    { date: '2024-08-13', subject: 'Software Engineering',  total: 45, present: 33, absent: 12 },
    { date: '2024-08-12', subject: 'Data Structures',       total: 45, present: 37, absent: 8 },
    { date: '2024-08-12', subject: 'Artificial Intelligence', total: 45, present: 42, absent: 3 },
  ],

  subjects: [
    'Data Structures',
    'Operating Systems',
    'Web Development',
    'DBMS',
    'Computer Networks',
    'Software Engineering',
    'Artificial Intelligence',
    'Computer Architecture',
  ],
};

// ============================================================
// AUTH GUARD — Check session before rendering protected pages
// ============================================================
function requireAuth() {
  // TODO STEP 2: Replace with real token verification
  const session = sessionStorage.getItem('cas_admin');
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  try {
    return JSON.parse(session);
  } catch {
    window.location.href = 'index.html';
    return null;
  }
}

// ============================================================
// NAVIGATION HELPERS — Sidebar & Hamburger
// ============================================================
function initNavigation() {
  const sidebar        = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const hamburgerBtn   = document.getElementById('hamburgerBtn');

  if (!sidebar || !sidebarOverlay || !hamburgerBtn) return;

  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    hamburgerBtn.classList.add('open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  sidebarOverlay.addEventListener('click', closeSidebar);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
  });

  // Close sidebar on nav link click (mobile)
  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) closeSidebar();
    });
  });

  // Mark active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPage || href.endsWith(currentPage)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

// ============================================================
// TOPBAR — Date & Profile
// ============================================================
function initTopbar(user) {
  // Update date
  const dateEl = document.getElementById('topbarDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Update profile
  if (user) {
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const profileAvatar = document.getElementById('profileAvatar');

    if (profileName) profileName.textContent = user.name || 'Admin';
    if (profileRole) profileRole.textContent = user.role || 'Administrator';
    if (profileAvatar) profileAvatar.textContent = (user.name || 'A')[0].toUpperCase();
  }
}

// ============================================================
// LOGOUT
// ============================================================
function initLogout() {
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => {
      // TODO STEP 2: Call backend logout endpoint to invalidate session/token
      sessionStorage.removeItem('cas_admin');
      window.location.href = 'index.html';
    });
  });
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const colors = {
    success: 'var(--clr-success)',
    error:   'var(--clr-danger)',
    warning: 'var(--clr-warning)',
    info:    'var(--clr-info)',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span style="color: ${colors[type]}; flex-shrink: 0;">${icons[type] || icons.info}</span>
    <span style="flex: 1;">${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--clr-text-muted);padding:4px;border-radius:4px;flex-shrink:0;" aria-label="Dismiss notification">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      if (toast.isConnected) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
}

// ============================================================
// TABLE HELPERS
// ============================================================

/** Generate avatar initials element */
function avatarHtml(name) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `<span class="student-avatar" aria-hidden="true">${initials}</span>`;
}

/** Format date as human-readable */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Get status badge HTML */
function statusBadge(status) {
  const map = {
    present: { cls: 'badge-success', label: 'Present' },
    absent:  { cls: 'badge-danger',  label: 'Absent'  },
    late:    { cls: 'badge-warning', label: 'Late'    },
    active:  { cls: 'badge-success', label: 'Active'  },
    warning: { cls: 'badge-warning', label: 'At Risk' },
    danger:  { cls: 'badge-danger',  label: 'Critical'},
  };
  const item = map[status] || { cls: 'badge-info', label: status };
  return `<span class="badge ${item.cls}">${item.label}</span>`;
}

// ============================================================
// DASHBOARD PAGE — Main Content
// ============================================================
function initDashboard() {
  const user = requireAuth();
  if (!user) return;

  initTopbar(user);
  initNavigation();
  initLogout();

  const { stats, recentAttendance } = SAMPLE_DATA;

  // Update stat cards
  const el = id => document.getElementById(id);
  if (el('statTotalStudents'))    el('statTotalStudents').textContent    = stats.totalStudents;
  if (el('statPresentToday'))     el('statPresentToday').textContent     = stats.presentToday;
  if (el('statAbsentToday'))      el('statAbsentToday').textContent      = stats.absentToday;
  if (el('statAttendancePct'))    el('statAttendancePct').textContent    = stats.attendancePercent.toFixed(1) + '%';

  // Update attendance progress bar
  const progressFill = document.getElementById('attendanceProgressFill');
  if (progressFill) {
    setTimeout(() => {
      progressFill.style.width = stats.attendancePercent + '%';
    }, 300);
  }

  // Render recent attendance table
  const tableBody = document.getElementById('recentAttendanceBody');
  if (tableBody) {
    if (recentAttendance.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--clr-text-muted); padding: 2rem;">No attendance records today.</td></tr>`;
    } else {
      tableBody.innerHTML = recentAttendance.map(row => `
        <tr>
          <td><span style="color: var(--clr-text-muted); font-size: var(--text-xs);">${row.time}</span></td>
          <td>
            <div class="table-cell-flex">
              ${avatarHtml(row.name)}
              <span class="font-medium">${row.name}</span>
            </div>
          </td>
          <td><code style="background:var(--clr-surface-2); padding:2px 8px; border-radius:4px; font-size:var(--text-xs);">${row.rollNo}</code></td>
          <td class="truncate" style="max-width: 180px;"><a href="mailto:${row.email}" style="color: var(--clr-primary);">${row.email}</a></td>
          <td>${statusBadge(row.status)}</td>
        </tr>
      `).join('');
    }
  }

  // Quick action button
  document.getElementById('quickCreateBtn')?.addEventListener('click', () => {
    window.location.href = 'attendance.html';
  });

  showToast('Dashboard loaded successfully', 'success', 3000);
}

// Export for other pages
window.CAS = {
  SAMPLE_DATA,
  requireAuth,
  initNavigation,
  initTopbar,
  initLogout,
  showToast,
  avatarHtml,
  formatDate,
  statusBadge,
};

// Auto-init if on dashboard
if (document.getElementById('dashboardPage')) {
  document.addEventListener('DOMContentLoaded', initDashboard);
}
