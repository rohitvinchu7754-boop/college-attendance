// ============================================================
// records.js — Attendance Records Page Logic
// College Attendance Management System - Step 1
// ============================================================
// TODO STEP 2: Fetch records from Google Sheets API / backend
// TODO STEP 2: Implement real date range filtering with backend query

'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () {

    const user = window.CAS.requireAuth();
    if (!user) return;

    window.CAS.initTopbar(user);
    window.CAS.initNavigation();
    window.CAS.initLogout();

    const { records, subjects } = window.CAS.SAMPLE_DATA;

    // --------------------------------------------------------
    // Populate subject filter dropdown
    // --------------------------------------------------------
    const subjectFilter = document.getElementById('subjectFilter');
    if (subjectFilter) {
      subjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        subjectFilter.appendChild(opt);
      });
    }

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------
    let filteredRecords = [...records];
    let currentPage     = 1;
    const perPage       = 6;

    // --------------------------------------------------------
    // Render Table
    // --------------------------------------------------------
    function renderTable(data) {
      const tbody = document.getElementById('recordsTableBody');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="padding: 3rem 1rem;">
              <div class="empty-state" style="padding: 1rem 0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" style="width:48px;height:48px;color:var(--clr-text-muted);margin-bottom:1rem;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <h3>No Records Found</h3>
                <p>No attendance records match your current filters.</p>
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

      tbody.innerHTML = page.map(record => {
        const pct = ((record.present / record.total) * 100).toFixed(1);
        const pctNum = parseFloat(pct);
        const pctClass = pctNum >= 75 ? 'badge-success' : pctNum >= 60 ? 'badge-warning' : 'badge-danger';
        return `
          <tr>
            <td>${window.CAS.formatDate(record.date)}</td>
            <td><span class="font-medium">${record.subject}</span></td>
            <td>${record.total}</td>
            <td><span style="color: var(--clr-success); font-weight: 600;">${record.present}</span></td>
            <td><span style="color: var(--clr-danger); font-weight: 600;">${record.absent}</span></td>
            <td><span class="badge ${pctClass}">${pct}%</span></td>
          </tr>
        `;
      }).join('');

      updatePagination(data.length);
    }

    // --------------------------------------------------------
    // Pagination
    // --------------------------------------------------------
    function updatePagination(total) {
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const info   = document.getElementById('paginationInfo');
      const controls = document.getElementById('paginationControls');

      if (info) {
        const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
        const end   = Math.min(currentPage * perPage, total);
        info.textContent = `Showing ${start}–${end} of ${total} records`;
      }

      if (controls) {
        controls.innerHTML = '';

        // Prev button
        const prev = document.createElement('button');
        prev.className = 'page-btn';
        prev.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>`;
        prev.setAttribute('aria-label', 'Previous page');
        prev.disabled = currentPage <= 1;
        prev.addEventListener('click', () => { currentPage--; renderTable(filteredRecords); });
        controls.appendChild(prev);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
          const btn = document.createElement('button');
          btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
          btn.textContent = i;
          btn.setAttribute('aria-label', `Page ${i}`);
          if (i === currentPage) btn.setAttribute('aria-current', 'page');
          btn.addEventListener('click', () => { currentPage = i; renderTable(filteredRecords); });
          controls.appendChild(btn);
        }

        // Next button
        const next = document.createElement('button');
        next.className = 'page-btn';
        next.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
        next.setAttribute('aria-label', 'Next page');
        next.disabled = currentPage >= totalPages;
        next.addEventListener('click', () => { currentPage++; renderTable(filteredRecords); });
        controls.appendChild(next);
      }
    }

    // --------------------------------------------------------
    // Filter Logic
    // --------------------------------------------------------
    function applyFilters() {
      const searchVal  = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
      const subjectVal = document.getElementById('subjectFilter')?.value || '';
      const dateFrom   = document.getElementById('dateFrom')?.value || '';
      const dateTo     = document.getElementById('dateTo')?.value || '';

      filteredRecords = records.filter(r => {
        const matchSearch  = !searchVal || r.subject.toLowerCase().includes(searchVal);
        const matchSubject = !subjectVal || r.subject === subjectVal;
        const matchFrom    = !dateFrom || r.date >= dateFrom;
        const matchTo      = !dateTo   || r.date <= dateTo;
        return matchSearch && matchSubject && matchFrom && matchTo;
      });

      currentPage = 1;
      renderTable(filteredRecords);
    }

    // Attach filter listeners
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('subjectFilter')?.addEventListener('change', applyFilters);
    document.getElementById('dateFrom')?.addEventListener('change', applyFilters);
    document.getElementById('dateTo')?.addEventListener('change', applyFilters);

    // Clear filters
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
      document.getElementById('searchInput').value  = '';
      document.getElementById('subjectFilter').value = '';
      document.getElementById('dateFrom').value      = '';
      document.getElementById('dateTo').value        = '';
      applyFilters();
      window.CAS.showToast('Filters cleared', 'info', 2000);
    });

    // --------------------------------------------------------
    // Export (placeholder)
    // TODO STEP 2: Implement real CSV/Excel export
    // --------------------------------------------------------
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      window.CAS.showToast('Export feature coming in Step 2', 'info');
    });

    // Initial render
    renderTable(filteredRecords);

  });
})();
