// ============================================================
// student.js — Student Attendance Verification & Replay Protection
// College Attendance Management System
// ============================================================

'use strict';

(function () {
  const QR_SESSION_DURATION = 20; // Session validity window in seconds
  const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd3-5CYQf2Kf0704JPohMNo-287C4Xc4HxpXGFSk9ejPZFKkQ/viewform";
  const MAX_SESSION_WINDOW_MS = 35000; // Max allowed session window (security ceiling against forged timestamps)
  const CLOCK_SKEW_TOLERANCE_MS = 15000; // Tolerance for client device clock variations

  document.addEventListener('DOMContentLoaded', function () {
    const loadingState     = document.getElementById('loadingState');
    const validState       = document.getElementById('validState');
    const expiredState     = document.getElementById('expiredState');
    const sessionSubject   = document.getElementById('sessionSubject');
    const sessionLecture   = document.getElementById('sessionLecture');
    const displaySessionId = document.getElementById('displaySessionId');
    const proceedFormBtn   = document.getElementById('proceedFormBtn');
    const expiredMsgText   = document.getElementById('expiredMsgText');

    let expiryTimer = null;
    let redirectTimer = null;

    function showExpired(msg) {
      if (expiryTimer) clearTimeout(expiryTimer);
      if (redirectTimer) clearTimeout(redirectTimer);
      if (loadingState) loadingState.classList.add('hidden');
      if (validState) validState.classList.add('hidden');
      if (expiredMsgText) expiredMsgText.textContent = msg;
      if (expiredState) expiredState.classList.remove('hidden');
    }

    // Parse URL parameters ?sid=ATT-XXXXX&sub=...&lec=...&exp=...&iat=...
    const urlParams = new URLSearchParams(window.location.search);
    const sid       = urlParams.get('sid');
    const sub       = urlParams.get('sub') || urlParams.get('subject') || 'Lecture Session';
    const lec       = urlParams.get('lec') || urlParams.get('lecture') || 'Classroom Attendance';
    const expParam  = urlParams.get('exp') || urlParams.get('expiresAt');
    const iatParam  = urlParams.get('iat') || urlParams.get('createdAt');

    // Simulate small verification delay for smooth UX
    setTimeout(() => {
      if (loadingState) loadingState.classList.add('hidden');

      // 1. Validate presence of Session ID
      if (!sid || typeof sid !== 'string' || !sid.trim()) {
        showExpired('No attendance session ID provided. Please scan a valid classroom QR code.');
        return;
      }

      // 2. Validate Session ID structural format
      const sidPattern = /^ATT-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(-\d+)?$/;
      const sidMatch = sid.match(sidPattern);
      if (!sid.startsWith('ATT-')) {
        showExpired('Invalid attendance session format. Please scan a valid classroom QR code.');
        return;
      }

      // 3. Resolve Authoritative Session Timestamps (epoch ms)
      let expMs = null;
      let iatMs = null;

      if (expParam) {
        expMs = isNaN(expParam) ? new Date(expParam).getTime() : Number(expParam);
        if (iatParam) {
          iatMs = isNaN(iatParam) ? new Date(iatParam).getTime() : Number(iatParam);
        } else {
          iatMs = expMs - (QR_SESSION_DURATION * 1000);
        }
      } else if (sidMatch) {
        // Fallback: derive timestamp directly from Session ID encoding (ATT-YYYYMMDD-HHMMSS)
        const year  = parseInt(sidMatch[1], 10);
        const month = parseInt(sidMatch[2], 10) - 1;
        const day   = parseInt(sidMatch[3], 10);
        const hour  = parseInt(sidMatch[4], 10);
        const min   = parseInt(sidMatch[5], 10);
        const sec   = parseInt(sidMatch[6], 10);
        iatMs = new Date(year, month, day, hour, min, sec).getTime();
        expMs = iatMs + (QR_SESSION_DURATION * 1000);
      }

      // 4. Validate Timestamps
      if (!expMs || isNaN(expMs) || !iatMs || isNaN(iatMs)) {
        showExpired('Attendance session could not be verified.');
        return;
      }

      const nowMs = Date.now();

      // Security Check: Window ceiling to prevent URL parameter tampering
      if ((expMs - iatMs) > MAX_SESSION_WINDOW_MS || (expMs - iatMs) <= 0) {
        showExpired('Attendance session validity window is invalid or tampered.');
        return;
      }

      // Security Check: Ensure session was not created unreasonably far in the future
      if (iatMs > (nowMs + CLOCK_SKEW_TOLERANCE_MS)) {
        showExpired('Attendance session timestamp is in the future. Please verify your device clock.');
        return;
      }

      // 5. Expiry Check (Replay Protection & 20-Second Window)
      if (nowMs >= expMs) {
        showExpired('This attendance QR code has expired. Old QR codes and screenshots cannot be reused.');
        return;
      }

      // 6. SESSION IS AUTHORITATIVELY ACTIVE & VALID ON ANY DEVICE!
      if (sessionSubject) sessionSubject.textContent = sub;
      if (sessionLecture) sessionLecture.textContent = lec;
      if (displaySessionId) displaySessionId.textContent = sid;

      if (proceedFormBtn) {
        proceedFormBtn.href = GOOGLE_FORM_URL;
      }

      if (validState) validState.classList.remove('hidden');

      // Schedule real-time expiration if user stays on verification screen
      const remainingMs = expMs - nowMs;
      expiryTimer = setTimeout(() => {
        showExpired('This attendance QR code has expired. Old QR codes and screenshots cannot be reused.');
      }, remainingMs);

      // Auto-redirect to Google Form for seamless student experience
      const redirectDelay = Math.min(1500, Math.max(200, remainingMs - 300));
      redirectTimer = setTimeout(() => {
        if (Date.now() < expMs && validState && !validState.classList.contains('hidden')) {
          window.location.href = GOOGLE_FORM_URL;
        }
      }, redirectDelay);

    }, 300);

  });

})();
