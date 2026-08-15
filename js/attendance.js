// ============================================================
// attendance.js — Create Attendance Page Logic & 20-Second QR System
// College Attendance Management System
// ============================================================

'use strict';

// ============================================================
// CONFIGURATION CONSTANTS
// Change QR_SESSION_DURATION here to 20, 30, 60, etc.
// ============================================================
const QR_SESSION_DURATION = 20; // Default session expiry duration in seconds

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd3-5CYQf2Kf0704JPohMNo-287C4Xc4HxpXGFSk9ejPZFKkQ/viewform";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6_E2kZ0s2MWoki8TMf7Be0d_vBj9HVtj4l-kJx60tGN5L6yW8Svua_UhaEsIKTRq2/exec";

(function () {
  let timerInterval = null;
  let currentSession = null;
  let remainingSeconds = QR_SESSION_DURATION;

  document.addEventListener('DOMContentLoaded', function () {

    // Auth Guard
    const user = window.CAS.requireAuth();
    if (!user) return;

    window.CAS.initTopbar(user);
    window.CAS.initNavigation();
    window.CAS.initLogout();

    const { subjects } = window.CAS.SAMPLE_DATA;

    // --------------------------------------------------------
    // Populate Subject Dropdown
    // --------------------------------------------------------
    const subjectSelect = document.getElementById('subjectSelect');
    if (subjectSelect) {
      subjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        subjectSelect.appendChild(opt);
      });
    }

    // Elements
    const form             = document.getElementById('attendanceForm');
    const generateBtn      = document.getElementById('generateQrBtn');
    const qrSection        = document.getElementById('qrSection');
    const qrBadge          = document.getElementById('qrBadge');
    const qrcodeContainer  = document.getElementById('qrcode');
    const qrExpiredOverlay = document.getElementById('qrExpiredOverlay');
    const qrExpiredBadge   = document.getElementById('qrExpiredBadge');
    const qrExpiredMessage = document.getElementById('qrExpiredMessage');
    const qrSessionInfo    = document.getElementById('qrSessionInfo');
    const countdownBox     = document.getElementById('countdownBox');
    const countdownNumber  = document.getElementById('countdownNumber');
    const countdownLabel   = document.getElementById('countdownLabel');
    const timerProgressBar = document.getElementById('timerProgressBar');
    const endAttendanceBtn = document.getElementById('endAttendanceBtn');
    const generateNewQrBtn = document.getElementById('generateNewQrBtn');
    const copyLinkBtn      = document.getElementById('copyLinkBtn');
    const resetFormBtn     = document.getElementById('resetFormBtn');

    // --------------------------------------------------------
    // Helper: Generate Unique Session ID
    // Format: ATT-YYYYMMDD-HHMMSS-RAND
    // --------------------------------------------------------
    function generateSessionId() {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const rand = Math.floor(100 + Math.random() * 900);
      return `ATT-${yyyy}${mm}${dd}-${hh}${min}${ss}-${rand}`;
    }

    // --------------------------------------------------------
    // Helper: Construct Target URL for QR Code (Replay Protection)
    // Encodes student verification portal link with session ID
    // --------------------------------------------------------
    function getTargetUrl(sessionId) {
      const base = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      return `${base}student.html?sid=${encodeURIComponent(sessionId)}`;
    }

    // --------------------------------------------------------
    // Apps Script API: Publish Form (Open for responses)
    // --------------------------------------------------------
    async function publishForm() {
      try {
        console.log('Publishing Google Form via Apps Script API...');
        await fetch(`${APPS_SCRIPT_URL}?action=publish&_t=${Date.now()}`, { mode: 'no-cors' });
        console.log('Apps Script Publish API request dispatched successfully.');
        return true;
      } catch (err) {
        console.warn('Network fetch failed, attempting image ping fallback for publish:', err);
        const img = new Image();
        img.src = `${APPS_SCRIPT_URL}?action=publish&_t=${Date.now()}`;
      }
      return true;
    }

    // --------------------------------------------------------
    // Apps Script API: Unpublish Form (Close responses)
    // --------------------------------------------------------
    async function unpublishForm() {
      try {
        console.log('Unpublishing Google Form via Apps Script API...');
        await fetch(`${APPS_SCRIPT_URL}?action=unpublish&_t=${Date.now()}`, { mode: 'no-cors' });
        console.log('Apps Script Unpublish API request dispatched successfully.');
        return true;
      } catch (err) {
        console.warn('Network fetch failed, attempting image ping fallback for unpublish:', err);
        const img = new Image();
        img.src = `${APPS_SCRIPT_URL}?action=unpublish&_t=${Date.now()}`;
      }
      return true;
    }

    // --------------------------------------------------------
    // Render Scannable QR Code
    // --------------------------------------------------------
    function renderQrCode(targetUrl) {
      if (!qrcodeContainer) return;
      qrcodeContainer.innerHTML = '';

      if (typeof QRCode !== 'undefined') {
        try {
          new QRCode(qrcodeContainer, {
            text: targetUrl,
            width: 220,
            height: 220,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
          return;
        } catch (err) {
          console.warn('QRCode library failed, using fallback img:', err);
        }
      }

      // Fallback QR Image API
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`;
      img.alt = 'Attendance QR Code';
      img.style.width = '220px';
      img.style.height = '220px';
      qrcodeContainer.appendChild(img);
    }

    // --------------------------------------------------------
    // Countdown Timer (Configurable: QR_SESSION_DURATION)
    // --------------------------------------------------------
    function startCountdown() {
      if (timerInterval) clearInterval(timerInterval);

      remainingSeconds = QR_SESSION_DURATION;

      // Reset UI
      if (countdownNumber)  countdownNumber.textContent = String(QR_SESSION_DURATION);
      if (countdownLabel)   countdownLabel.textContent = 'Seconds Remaining';
      if (timerProgressBar) {
        timerProgressBar.style.width = '100%';
        timerProgressBar.classList.remove('critical');
      }
      if (countdownBox)     countdownBox.classList.remove('critical');
      if (qrExpiredOverlay) qrExpiredOverlay.classList.add('hidden');

      if (qrBadge) {
        qrBadge.className = 'badge badge-success';
        qrBadge.textContent = 'Active Session';
      }

      if (endAttendanceBtn) endAttendanceBtn.classList.remove('hidden');
      if (generateNewQrBtn) generateNewQrBtn.classList.add('hidden');

      const totalSeconds = QR_SESSION_DURATION;

      timerInterval = setInterval(() => {
        remainingSeconds--;

        if (countdownNumber) countdownNumber.textContent = String(Math.max(0, remainingSeconds));

        const pct = Math.max(0, (remainingSeconds / totalSeconds) * 100);
        if (timerProgressBar) timerProgressBar.style.width = `${pct}%`;

        // Warning state for final 5 seconds
        if (remainingSeconds <= 5 && remainingSeconds > 0) {
          if (countdownBox)     countdownBox.classList.add('critical');
          if (timerProgressBar) timerProgressBar.classList.add('critical');
        }

        if (remainingSeconds <= 0) {
          expireSession('timer');
        }
      }, 1000);
    }

    // --------------------------------------------------------
    // Expire / End Session
    // --------------------------------------------------------
    async function expireSession(reason = 'timer') {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      if (currentSession) {
        currentSession.status = (reason === 'ended' ? 'ended' : 'expired');
        currentSession.expiresAt = new Date().toISOString();
        
        // Save active session state
        localStorage.setItem('cas_current_session', JSON.stringify(currentSession));

        // Update registry
        try {
          const registryRaw = localStorage.getItem('cas_sessions_registry');
          let registry = registryRaw ? JSON.parse(registryRaw) : [];
          const idx = registry.findIndex(s => s.sessionId === currentSession.sessionId);
          if (idx !== -1) {
            registry[idx] = currentSession;
          } else {
            registry.push(currentSession);
          }
          localStorage.setItem('cas_sessions_registry', JSON.stringify(registry));
        } catch (e) {
          console.error('Error updating registry:', e);
        }
      }

      // Automatically call Apps Script API to unpublish the Google Form
      unpublishForm();

      // Update Timer UI
      if (countdownNumber)  countdownNumber.textContent = '0';
      if (countdownLabel)   countdownLabel.textContent = reason === 'ended' ? 'Session Stopped' : 'QR Expired';
      if (timerProgressBar) {
        timerProgressBar.style.width = '0%';
        timerProgressBar.classList.remove('critical');
      }
      if (countdownBox)     countdownBox.classList.remove('critical');

      // Update Badge
      if (qrBadge) {
        qrBadge.className = 'badge badge-danger';
        qrBadge.textContent = reason === 'ended' ? 'Attendance Ended' : 'QR Expired';
      }

      // Show Overlay over QR code
      if (qrExpiredOverlay) {
        qrExpiredOverlay.classList.remove('hidden');
        if (qrExpiredBadge) {
          qrExpiredBadge.textContent = reason === 'ended' ? 'ATTENDANCE ENDED' : 'QR EXPIRED';
        }
        if (qrExpiredMessage) {
          qrExpiredMessage.textContent = reason === 'ended'
            ? 'Attendance session was stopped by teacher.'
            : `This attendance QR is no longer valid (${QR_SESSION_DURATION}s limit reached).`;
        }
      }

      // Swap Buttons
      if (endAttendanceBtn) endAttendanceBtn.classList.add('hidden');
      if (generateNewQrBtn) generateNewQrBtn.classList.remove('hidden');

      // Notify
      const msg = reason === 'ended' ? 'Attendance session ended manually. Google Form unpublished.' : `QR Code expired after ${QR_SESSION_DURATION} seconds. Google Form unpublished.`;
      window.CAS.showToast(msg, reason === 'ended' ? 'info' : 'warning');
    }

    // --------------------------------------------------------
    // FORM SUBMIT — Generate QR
    // --------------------------------------------------------
    form?.addEventListener('submit', async function (e) {
      e.preventDefault();

      const subject = document.getElementById('subjectSelect').value.trim();
      const lecture = document.getElementById('lectureName').value.trim();

      // Validation
      if (!subject) {
        window.CAS.showToast('Please select a subject.', 'warning');
        document.getElementById('subjectSelect').focus();
        return;
      }
      if (!lecture) {
        window.CAS.showToast('Please enter a lecture / session name.', 'warning');
        document.getElementById('lectureName').focus();
        return;
      }

      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="spinner"></span> Generating & Publishing Form...';

      // 1. Automatically call Apps Script API to publish form
      await publishForm();

      generateBtn.disabled = false;
      generateBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
        Generate QR Code`;

      // 2. Generate unique session details
      const sessionId = generateSessionId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (QR_SESSION_DURATION * 1000));
      const targetUrl = getTargetUrl(sessionId);

      // 3. Create Session Object
      currentSession = {
        sessionId,
        subject,
        lectureName: lecture,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active',
        targetUrl,
        formUrl: GOOGLE_FORM_URL
      };

      localStorage.setItem('cas_current_session', JSON.stringify(currentSession));

      // Append to registry
      try {
        const registryRaw = localStorage.getItem('cas_sessions_registry');
        let registry = registryRaw ? JSON.parse(registryRaw) : [];
        registry.push(currentSession);
        localStorage.setItem('cas_sessions_registry', JSON.stringify(registry));
      } catch (err) {
        console.error('Error saving registry:', err);
      }

      // Update Session Info Display
      const formattedDate = window.CAS.formatDate(now.toISOString().split('T')[0]);
      const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (qrSessionInfo) {
        qrSessionInfo.innerHTML = `
          <div style="display:flex; flex-direction:column; gap: 0.5rem; font-size: var(--text-sm); color: var(--clr-text-secondary);">
            <div><strong style="color:var(--clr-text-primary);">Session ID:</strong> <code style="background:var(--clr-surface-2); padding:2px 6px; border-radius:4px; font-weight:600; color:var(--clr-primary);">${sessionId}</code></div>
            <div><strong style="color:var(--clr-text-primary);">Subject:</strong> ${subject}</div>
            <div><strong style="color:var(--clr-text-primary);">Lecture:</strong> ${lecture}</div>
            <div><strong style="color:var(--clr-text-primary);">Created:</strong> ${formattedDate} at ${formattedTime}</div>
            <div><strong style="color:var(--clr-text-primary);">Form Status:</strong> <span class="badge badge-success">FORM PUBLISHED</span></div>
            <div><strong style="color:var(--clr-text-primary);">QR URL:</strong> <span style="word-break:break-all; color:var(--clr-primary); font-size:var(--text-xs);">${targetUrl}</span></div>
          </div>
        `;
      }

      // Render real QR Code
      renderQrCode(targetUrl);

      // Show QR section
      if (qrSection) qrSection.classList.remove('hidden');

      // Start countdown
      startCountdown();

      window.CAS.showToast(`Attendance QR generated & Form published! Valid for ${QR_SESSION_DURATION} seconds.`, 'success');

      // Scroll to QR Section
      qrSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // --------------------------------------------------------
    // END ATTENDANCE BUTTON
    // --------------------------------------------------------
    endAttendanceBtn?.addEventListener('click', function () {
      expireSession('ended');
    });

    // --------------------------------------------------------
    // GENERATE NEW QR BUTTON
    // --------------------------------------------------------
    generateNewQrBtn?.addEventListener('click', function () {
      if (form.checkValidity()) {
        form.requestSubmit();
      } else {
        document.getElementById('lectureName').focus();
        window.CAS.showToast('Please enter session details and click Generate QR Code.', 'info');
      }
    });

    // --------------------------------------------------------
    // RESET FORM
    // --------------------------------------------------------
    resetFormBtn?.addEventListener('click', function () {
      form.reset();
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      if (qrSection) qrSection.classList.add('hidden');
      currentSession = null;
      localStorage.removeItem('cas_current_session');
      window.CAS.showToast('Form reset.', 'info');
    });

    // --------------------------------------------------------
    // COPY QR LINK
    // --------------------------------------------------------
    copyLinkBtn?.addEventListener('click', function () {
      if (!currentSession || !currentSession.targetUrl) {
        window.CAS.showToast('No active QR code generated yet.', 'warning');
        return;
      }

      navigator.clipboard?.writeText(currentSession.targetUrl).then(() => {
        window.CAS.showToast('QR Link copied to clipboard!', 'success');
      }).catch(() => {
        window.CAS.showToast('Could not copy link automatically.', 'info');
      });
    });

  });

  // Export current session helper & config for global access
  window.CAS_CONFIG = {
    QR_SESSION_DURATION,
    GOOGLE_FORM_URL,
    APPS_SCRIPT_URL,
    getCurrentSession: () => currentSession
  };

})();
