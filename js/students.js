// ============================================================
// students.js — Students Page Logic
// College Attendance Management System - Step 1
// ============================================================
// TODO STEP 2: Fetch student list from Google Sheets / backend
// TODO STEP 2: Add/Edit/Delete students via backend API

'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () {

    const user = window.CAS.requireAuth();
    if (!user) return;

    window.CAS.initTopbar(user);
    window.CAS.initNavigation();
    window.CAS.initLogout();

    const { students } = window.CAS.SAMPLE_DATA;

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------
    let filteredStudents = [...students];
    let currentPage      = 1;
    const perPage        = 8;
    let sortKey          = 'rollNo';
    let sortDir          = 'asc';

    // --------------------------------------------------------
    // Render Table
    // --------------------------------------------------------
    function renderTable(data) {
      const tbody = document.getElementById('studentsTableBody');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="padding: 3rem 1rem;">
              <div class="empty-state" style="padding: 1rem 0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" style="width:48px;height:48px;color:var(--clr-text-muted);margin-bottom:1rem;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <h3>No Students Found</h3>
                <p>No students match your search query.</p>
              </div>
            </td>
          </tr>
        `;
        updatePagination(0);
        return;
      }

      const start = (currentPage - 1) * perPage;
      const end   = start + perPage;
      const page  = data.slice(start, end);

      tbody.innerHTML = page.map(s => {
        const pctClass = s.attendance >= 75 ? 'badge-success' : s.attendance >= 60 ? 'badge-warning' : 'badge-danger';
        return `
          <tr>
            <td><code style="background:var(--clr-surface-2); padding:2px 8px; border-radius:4px; font-size:var(--text-xs);">${s.rollNo}</code></td>
            <td>
              <div class="table-cell-flex">
                ${window.CAS.avatarHtml(s.name)}
                <div>
                  <p class="font-medium">${s.name}</p>
                </div>
              </div>
            </td>
            <td><a href="mailto:${s.email}" style="color: var(--clr-primary); font-size: var(--text-sm);">${s.email}</a></td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 120px;">
                <div class="progress-bar" style="flex: 1;" role="progressbar" aria-valuenow="${s.attendance}" aria-valuemin="0" aria-valuemax="100" aria-label="${s.attendance}% attendance">
                  <div class="progress-fill" style="width: ${s.attendance}%; background: ${s.attendance >= 75 ? 'var(--clr-success)' : s.attendance >= 60 ? 'var(--clr-warning)' : 'var(--clr-danger)'};"></div>
                </div>
                <span class="badge ${pctClass}" style="min-width: 52px; justify-content: center;">${s.attendance}%</span>
              </div>
            </td>
            <td>${window.CAS.statusBadge(s.status)}</td>
          </tr>
        `;
      }).join('');

      updatePagination(data.length);
    }

    // --------------------------------------------------------
    // Pagination
    // --------------------------------------------------------
    function updatePagination(total) {
      const totalPages  = Math.max(1, Math.ceil(total / perPage));
      const info        = document.getElementById('paginationInfo');
      const controls    = document.getElementById('paginationControls');

      if (info) {
        const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
        const end   = Math.min(currentPage * perPage, total);
        info.textContent = `Showing ${start}–${end} of ${total} students`;
      }

      if (controls) {
        controls.innerHTML = '';

        const prev = document.createElement('button');
        prev.className = 'page-btn';
        prev.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>`;
        prev.setAttribute('aria-label', 'Previous page');
        prev.disabled = currentPage <= 1;
        prev.addEventListener('click', () => { currentPage--; renderTable(filteredStudents); });
        controls.appendChild(prev);

        for (let i = 1; i <= totalPages; i++) {
          const btn = document.createElement('button');
          btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
          btn.textContent = i;
          btn.setAttribute('aria-label', `Page ${i}`);
          if (i === currentPage) btn.setAttribute('aria-current', 'page');
          btn.addEventListener('click', () => { currentPage = i; renderTable(filteredStudents); });
          controls.appendChild(btn);
        }

        const next = document.createElement('button');
        next.className = 'page-btn';
        next.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
        next.setAttribute('aria-label', 'Next page');
        next.disabled = currentPage >= totalPages;
        next.addEventListener('click', () => { currentPage++; renderTable(filteredStudents); });
        controls.appendChild(next);
      }
    }

    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------
    function applySearch() {
      const query       = (document.getElementById('studentSearch')?.value || '').toLowerCase().trim();
      const statusFilter = document.getElementById('statusFilter')?.value || '';

      filteredStudents = students.filter(s => {
        const matchQuery  = !query || s.name.toLowerCase().includes(query) || s.rollNo.toLowerCase().includes(query) || s.email.toLowerCase().includes(query);
        const matchStatus = !statusFilter || s.status === statusFilter;
        return matchQuery && matchStatus;
      });

      // Sort
      filteredStudents.sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      currentPage = 1;
      renderTable(filteredStudents);

      // Update count badge
      const countBadge = document.getElementById('studentCount');
      if (countBadge) countBadge.textContent = filteredStudents.length;
    }

    document.getElementById('studentSearch')?.addEventListener('input', applySearch);
    document.getElementById('statusFilter')?.addEventListener('change', applySearch);

    // --------------------------------------------------------
    // Sort (column headers)
    // --------------------------------------------------------
    document.querySelectorAll('[data-sort]').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (sortKey === key) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = key;
          sortDir = 'asc';
        }
        // Update sort indicators
        document.querySelectorAll('[data-sort]').forEach(el => {
          el.querySelector('.sort-icon')?.remove();
        });
        const icon = document.createElement('span');
        icon.className = 'sort-icon';
        icon.style.marginLeft = '4px';
        icon.textContent = sortDir === 'asc' ? '↑' : '↓';
        th.appendChild(icon);
        applySearch();
      });
    });

    // --------------------------------------------------------
    // Add Student (placeholder modal)
    // --------------------------------------------------------
    const addStudentBtn    = document.getElementById('addStudentBtn');
    const addStudentModal  = document.getElementById('addStudentModal');
    const closeModalBtn    = document.getElementById('closeModalBtn');
    const cancelModalBtn   = document.getElementById('cancelModalBtn');
    const addStudentForm   = document.getElementById('addStudentForm');

    function openModal() {
      addStudentModal?.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.getElementById('newStudentName')?.focus();
    }

    function closeModal() {
      addStudentModal?.classList.remove('active');
      document.body.style.overflow = '';
      addStudentForm?.reset();
    }

    addStudentBtn?.addEventListener('click', openModal);
    closeModalBtn?.addEventListener('click', closeModal);
    cancelModalBtn?.addEventListener('click', closeModal);

    addStudentModal?.addEventListener('click', e => {
      if (e.target === addStudentModal) closeModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && addStudentModal?.classList.contains('active')) closeModal();
    });

    addStudentForm?.addEventListener('submit', e => {
      e.preventDefault();
      // TODO STEP 2: POST to backend/Google Sheets to add student
      window.CAS.showToast('Student addition will be implemented in Step 2 with backend integration.', 'info');
      closeModal();
    });

    // --------------------------------------------------------
    // Export (placeholder)
    // TODO STEP 2: Real CSV export
    // --------------------------------------------------------
    document.getElementById('exportStudentsBtn')?.addEventListener('click', () => {
      window.CAS.showToast('Export feature coming in Step 2', 'info');
    });

    // Initial render
    applySearch();

  });
})();
