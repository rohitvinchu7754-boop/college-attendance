// ============================================================
// student.js — Student Attendance Verification & Replay Protection
// College Attendance Management System
// ============================================================

'use strict';

(function () {
  const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd3-5CYQf2Kf0704JPohMNo-287C4Xc4HxpXGFSk9ejPZFKkQ/viewform";

  document.addEventListener('DOMContentLoaded', function () {
    const loadingState    = document.getElementById('loadingState');
    const validState      = document.getElementById('validState');
    const expiredState    = document.getElementById('expiredState');
    const sessionSubject  = document.getElementById('sessionSubject');
    const sessionLecture  = document.getElementById('sessionLecture');
    const displaySessionId = document.getElementById('displaySessionId');
    const proceedFormBtn  = document.getElementById('proceedFormBtn');
    const expiredMsgText  = document.getElementById('expiredMsgText');

    // Parse URL parameter ?sid=ATT-XXXXX
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('sid');

    // Simulate verification delay (300ms)
    setTimeout(() => {
      if (loadingState) loadingState.classList.add('hidden');

      if (!sid) {
        showExpired('No attendance session ID provided. Please scan a valid classroom QR code.');
        return;
      }

      // Check session validity from localStorage
      let session = null;
      try {
        const activeRaw = localStorage.getItem('cas_current_session');
        if (activeRaw) {
          const parsed = JSON.parse(activeRaw);
          if (parsed.sessionId === sid) {
            session = parsed;
          }
        }

        // If not in active, check historical registry
        if (!session) {
          const registryRaw = localStorage.getItem('cas_sessions_registry');
          if (registryRaw) {
            const registry = JSON.parse(registryRaw);
            session = registry.find(s => s.sessionId === sid);
          }
        }
      } catch (err) {
        console.error('Error reading session storage:', err);
      }

      const now = new Date();

      if (!session) {
        showExpired('Attendance session not found or has been removed by teacher.');
        return;
      }

      const expiresAtDate = new Date(session.expiresAt);

      // Verify expiration timestamp and status
      if (session.status !== 'active' || now >= expiresAtDate) {
        showExpired('This attendance QR code has expired. Old QR codes and screenshots cannot be reused.');
        return;
      }

      // SESSION IS VALID!
      if (sessionSubject) sessionSubject.textContent = session.subject || 'Lecture Session';
      if (sessionLecture) sessionLecture.textContent = session.lectureName || 'Classroom Attendance';
      if (displaySessionId) displaySessionId.textContent = session.sessionId;

      if (proceedFormBtn) {
        proceedFormBtn.href = GOOGLE_FORM_URL;
      }

      if (validState) validState.classList.remove('hidden');

      // Auto-redirect to Google Form after 1.5 seconds for seamless student experience
      setTimeout(() => {
        if (validState && !validState.classList.contains('hidden')) {
          window.location.href = GOOGLE_FORM_URL;
        }
      }, 1500);

    }, 300);

    function showExpired(msg) {
      if (expiredMsgText) expiredMsgText.textContent = msg;
      if (expiredState) expiredState.classList.remove('hidden');
    }
  });

})();
