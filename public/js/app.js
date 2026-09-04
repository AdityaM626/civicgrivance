/**
 * P20 Municipal Civic Complaint & Grievance Management System
 * Single-Page Application (SPA) Client Engine
 */

const API_BASE = '/api/v1';

// Global App State
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  departments: [],
  currentView: 'public',
  myComplaints: [],
  officerQueue: [],
  activeComplaint: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  updateAuthUI();
  await loadDepartments();
  setupEventListeners();

  // Handle URL hash or default tab
  const hash = window.location.hash.replace('#', '') || 'public';
  switchView(hash);
}

// --- Auth Utilities ---
function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateAuthUI();
}

function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  switchView('public');
  showToast('Logged out successfully', 'info');
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  return headers;
}

function updateAuthUI() {
  const guestActions = document.getElementById('guest-actions');
  const userActions = document.getElementById('user-actions');
  const userNameEl = document.getElementById('user-name-display');
  const userRoleEl = document.getElementById('user-role-display');

  const citizenTab = document.getElementById('tab-citizen');
  const officerTab = document.getElementById('tab-officer');
  const adminTab = document.getElementById('tab-admin');

  if (state.user && state.token) {
    guestActions.classList.add('hidden');
    userActions.classList.remove('hidden');
    userActions.classList.add('flex');
    userNameEl.textContent = state.user.name;
    userRoleEl.textContent = state.user.role;

    citizenTab.classList.remove('hidden');
    
    if (['OFFICER', 'ADMIN'].includes(state.user.role)) {
      officerTab.classList.remove('hidden');
    } else {
      officerTab.classList.add('hidden');
    }

    if (state.user.role === 'ADMIN') {
      adminTab.classList.remove('hidden');
    } else {
      adminTab.classList.add('hidden');
    }
  } else {
    guestActions.classList.remove('hidden');
    userActions.classList.add('hidden');
    userActions.classList.remove('flex');
    
    citizenTab.classList.add('hidden');
    officerTab.classList.add('hidden');
    adminTab.classList.add('hidden');
  }
}

// --- View Router ---
function switchView(viewName) {
  state.currentView = viewName;
  window.location.hash = viewName;

  // Hide all view sections
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
  
  // Reset tab active styles
  document.querySelectorAll('.nav-tab').forEach(el => {
    el.classList.remove('border-blue-600', 'text-blue-600');
    el.classList.add('border-transparent', 'text-gray-500');
  });

  const activeTab = document.getElementById(`tab-${viewName}`);
  if (activeTab) {
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    activeTab.classList.add('border-blue-600', 'text-blue-600');
  }

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  // Load view-specific data
  if (viewName === 'citizen' && state.user) {
    loadMyComplaints();
  } else if (viewName === 'officer' && state.user) {
    loadOfficerQueue();
  } else if (viewName === 'admin' && state.user) {
    loadAdminDashboard();
  }
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// --- Department Fetcher ---
async function loadDepartments() {
  try {
    const res = await fetch(`${API_BASE}/departments`);
    const data = await res.json();
    if (data.success) {
      state.departments = data.data;
      populateDepartmentSelects();
    }
  } catch (err) {
    console.error('Failed to load departments', err);
  }
}

function populateDepartmentSelects() {
  const deptSelect = document.getElementById('complaint-dept-select');
  const catSelect = document.getElementById('complaint-category-select');

  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">-- Auto Route by Category --</option>';
    state.departments.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d._id;
      opt.textContent = `${d.name} (${d.code})`;
      deptSelect.appendChild(opt);
    });
  }

  if (catSelect && state.departments.length) {
    catSelect.innerHTML = '<option value="">-- Select Pre-defined Category --</option>';
    state.departments.forEach(d => {
      if (d.categories && Array.isArray(d.categories)) {
        const group = document.createElement('optgroup');
        group.label = d.name;
        d.categories.forEach(c => {
          if (c.isActive) {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = `${c.name} (${c.slaHours}h SLA)`;
            group.appendChild(opt);
          }
        });
        catSelect.appendChild(group);
      }
    });
  }
}

// --- 1. Public Complaint Lookup ---
async function performPublicLookup(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('public-search-code').value.trim();
  if (!input) return showToast('Please enter a complaint reference code', 'error');

  const resultContainer = document.getElementById('public-lookup-result');
  resultContainer.innerHTML = `<div class="p-8 text-center text-gray-500">Searching...</div>`;

  try {
    const res = await fetch(`${API_BASE}/public/complaints/${encodeURIComponent(input)}`);
    const data = await res.json();

    if (!data.success) {
      resultContainer.innerHTML = `
        <div class="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">
          <p class="font-semibold">${data.message || 'Complaint code not found'}</p>
        </div>`;
      return;
    }

    renderPublicComplaintDetails(data.data, resultContainer);
  } catch (err) {
    showToast('Failed to connect to server', 'error');
  }
}

function renderPublicComplaintDetails(c, container) {
  const timelineHTML = (c.timeline || []).map((t, idx) => `
    <div class="relative flex items-start gap-4 pb-6">
      ${idx < c.timeline.length - 1 ? '<div class="timeline-line"></div>' : ''}
      <div class="timeline-dot ${idx === 0 ? 'active' : ''} mt-1"></div>
      <div>
        <span class="px-2 py-0.5 text-xs font-medium rounded badge-${t.status}">${t.statusLabel}</span>
        <p class="text-sm font-medium text-gray-900 mt-1">${t.note || t.statusDescription}</p>
        <p class="text-xs text-gray-400">${new Date(t.timestamp).toLocaleString()}</p>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <span class="text-xs font-semibold text-blue-600 uppercase tracking-wider">Public Track</span>
          <h2 class="text-2xl font-bold text-gray-900">${c.referenceCode}</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-sm font-semibold badge-${c.status}">${c.statusLabel}</span>
          <span class="px-3 py-1 rounded-full text-xs font-medium badge-priority-${c.priority}">${c.priority} Priority</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
        <div><span class="text-gray-500">Category:</span> <p class="font-semibold">${c.category}</p></div>
        <div><span class="text-gray-500">Department:</span> <p class="font-semibold">${c.department?.name || 'Unassigned'}</p></div>
        <div><span class="text-gray-500">Ward:</span> <p class="font-semibold">${c.ward}</p></div>
      </div>

      <div>
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Status Timeline</p>
        <div class="pl-2 pt-2">${timelineHTML || '<p class="text-sm text-gray-500">No timeline entries.</p>'}</div>
      </div>
    </div>`;
}

// --- 2. Auth Actions ---
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      saveSession(data.data.token, data.data.user);
      closeModal('auth-modal');
      showToast(`Welcome back, ${data.data.user.name}!`, 'success');
      switchView(data.data.user.role === 'CITIZEN' ? 'citizen' : 'officer');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error during login', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const phone = document.getElementById('reg-phone').value.trim();
  const role = document.getElementById('reg-role').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, role })
    });
    const data = await res.json();

    if (data.success) {
      saveSession(data.data.token, data.data.user);
      closeModal('auth-modal');
      showToast('Account registered successfully!', 'success');
      switchView('citizen');
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Network error during registration', 'error');
  }
}

// --- 3. Citizen Actions ---
async function handleFileComplaint(e) {
  e.preventDefault();
  const selectedCat = document.getElementById('complaint-category-select')?.value;
  const inputCat = document.getElementById('complaint-category')?.value?.trim();
  const category = selectedCat || inputCat;
  
  if (!category) {
    return showToast('Please select or type a complaint category', 'error');
  }
  const description = document.getElementById('complaint-desc').value.trim();
  const ward = document.getElementById('complaint-ward').value;
  const area = document.getElementById('complaint-area')?.value?.trim() || ward;
  const priority = document.getElementById('complaint-priority').value;
  const address = document.getElementById('complaint-address').value.trim();
  const departmentId = document.getElementById('complaint-dept-select').value;

  if (description.length < 10) {
    return showToast('Description must be at least 10 characters long', 'error');
  }

  const payload = { 
    category, 
    description, 
    ward, 
    area, 
    priority, 
    location: { address } 
  };
  if (departmentId) payload.departmentId = departmentId;

  try {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      const refCode = data.data?.complaint?.referenceCode || data.data?.referenceCode || 'Submitted';
      showToast(`Complaint filed! Ref: ${refCode}`, 'success');
      e.target.reset();
      loadMyComplaints();
    } else {
      let errMsg = data.message || 'Failed to file complaint';
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errMsg = data.errors.map(err => err.msg || err.message).join(' | ');
      }
      showToast(errMsg, 'error');
    }
  } catch (err) {
    showToast('Network error while filing complaint', 'error');
  }
}

async function loadMyComplaints() {
  const container = document.getElementById('my-complaints-list');
  container.innerHTML = '<p class="text-center py-6 text-gray-500">Loading complaints...</p>';

  try {
    const res = await fetch(`${API_BASE}/complaints/my`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      const list = data.data?.complaints || data.data || [];
      state.myComplaints = list;
      renderMyComplaintsList(list, container);
    } else {
      container.innerHTML = `<p class="text-red-500 p-4">${data.message}</p>`;
    }
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 p-4">Error loading complaints.</p>`;
  }
}

function renderMyComplaintsList(list, container) {
  if (!list.length) {
    container.innerHTML = `
      <div class="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-100">
        You have not filed any grievances yet. Use the form above to submit one.
      </div>`;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <span class="text-xs font-bold text-gray-400 uppercase">REF: ${c.referenceCode}</span>
          <h3 class="text-lg font-bold text-gray-900">${c.category}</h3>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-semibold badge-${c.status}">${c.status}</span>
          <span class="px-2 py-0.5 rounded text-xs badge-priority-${c.priority}">${c.priority}</span>
        </div>
      </div>
      <p class="text-sm text-gray-700">${c.description}</p>
      <div class="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2">
        <span>Ward: <strong>${c.ward}</strong> | Dept: <strong>${c.department?.name || 'Routed'}</strong></span>
        <span>Filed: ${new Date(c.createdAt).toLocaleDateString()}</span>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-2 pt-2 border-t border-gray-100">
        ${c.status === 'RESOLVED' ? `
          <button onclick="openFeedbackModal('${c._id}')" class="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-medium text-xs rounded-lg transition">Submit Feedback</button>
          <button onclick="openReopenModal('${c._id}')" class="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium text-xs rounded-lg transition">Reopen Issue</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// --- 4. Officer Actions ---
async function loadOfficerQueue() {
  const container = document.getElementById('officer-queue-list');
  container.innerHTML = '<p class="text-center py-6 text-gray-500">Loading department queue...</p>';

  try {
    const res = await fetch(`${API_BASE}/complaints/department/queue`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      state.officerQueue = data.data;
      renderOfficerQueue(data.data, container);
    }
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 p-4">Error loading queue.</p>`;
  }
}

function renderOfficerQueue(list, container) {
  if (!list.length) {
    container.innerHTML = `<div class="bg-white p-6 rounded-xl text-center text-gray-500">No assigned complaints in queue.</div>`;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-mono text-gray-500">${c.referenceCode}</span>
        <span class="px-2.5 py-0.5 rounded text-xs font-semibold badge-${c.status}">${c.status}</span>
      </div>
      <h4 class="font-bold text-gray-900">${c.category} (Ward: ${c.ward})</h4>
      <p class="text-sm text-gray-600">${c.description}</p>
      
      <div class="flex gap-2 pt-2">
        ${c.status === 'ASSIGNED' ? `
          <button onclick="updateComplaintStatus('${c._id}', 'IN_PROGRESS')" class="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md">Start Progress</button>
        ` : ''}
        ${['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(c.status) ? `
          <button onclick="openResolveModal('${c._id}')" class="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-md">Submit Resolution</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

async function updateComplaintStatus(complaintId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus, note: `Status changed to ${newStatus}` })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Complaint status updated to ${newStatus}`, 'success');
      loadOfficerQueue();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to update status', 'error');
  }
}

// --- 5. Admin Dashboard Actions ---
async function loadAdminDashboard() {
  try {
    const res = await fetch(`${API_BASE}/reports/overview`, { headers: getAuthHeaders() });
    const data = await res.json();

    if (data.success) {
      const stats = data.data;
      document.getElementById('stat-total').textContent = stats.totalComplaints || 0;
      document.getElementById('stat-resolved').textContent = stats.statusBreakdown?.RESOLVED || 0;
      document.getElementById('stat-pending').textContent = (stats.statusBreakdown?.FILED || 0) + (stats.statusBreakdown?.IN_PROGRESS || 0);
      document.getElementById('stat-breached').textContent = stats.slaBreachedCount || 0;
    }
  } catch (err) {
    console.error('Failed to load admin stats', err);
  }
}

// --- Modals ---
function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function openResolveModal(id) {
  state.activeComplaintId = id;
  openModal('resolve-modal');
}

function openFeedbackModal(id) {
  state.activeComplaintId = id;
  openModal('feedback-modal');
}

function openReopenModal(id) {
  state.activeComplaintId = id;
  openModal('reopen-modal');
}

async function submitResolution(e) {
  e.preventDefault();
  const notes = document.getElementById('resolve-notes').value.trim();
  const photos = document.getElementById('resolve-photos').value.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const res = await fetch(`${API_BASE}/complaints/${state.activeComplaintId}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes, proofPhotos: photos })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Resolution proof submitted cleanly!', 'success');
      closeModal('resolve-modal');
      loadOfficerQueue();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to submit resolution', 'error');
  }
}

async function submitFeedbackForm(e) {
  e.preventDefault();
  const rating = parseInt(document.getElementById('feedback-rating').value);
  const comment = document.getElementById('feedback-comment').value.trim();

  try {
    const res = await fetch(`${API_BASE}/complaints/${state.activeComplaintId}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating, comment })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Thank you for your feedback!', 'success');
      closeModal('feedback-modal');
      loadMyComplaints();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to submit feedback', 'error');
  }
}

async function submitReopenForm(e) {
  e.preventDefault();
  const reason = document.getElementById('reopen-reason').value.trim();

  try {
    const res = await fetch(`${API_BASE}/complaints/${state.activeComplaintId}/reopen`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Complaint reopened successfully', 'success');
      closeModal('reopen-modal');
      loadMyComplaints();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to reopen complaint', 'error');
  }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  document.getElementById('form-public-search')?.addEventListener('submit', performPublicLookup);
  document.getElementById('form-login')?.addEventListener('submit', handleLogin);
  document.getElementById('form-register')?.addEventListener('submit', handleRegister);
  document.getElementById('form-file-complaint')?.addEventListener('submit', handleFileComplaint);
  document.getElementById('form-resolve')?.addEventListener('submit', submitResolution);
  document.getElementById('form-feedback')?.addEventListener('submit', submitFeedbackForm);
  document.getElementById('form-reopen')?.addEventListener('submit', submitReopenForm);

  // Tab switching links
  document.getElementById('tab-public')?.addEventListener('click', () => switchView('public'));
  document.getElementById('tab-citizen')?.addEventListener('click', () => switchView('citizen'));
  document.getElementById('tab-officer')?.addEventListener('click', () => switchView('officer'));
  document.getElementById('tab-admin')?.addEventListener('click', () => switchView('admin'));

  document.getElementById('btn-open-login')?.addEventListener('click', () => openModal('auth-modal'));
  document.getElementById('btn-logout')?.addEventListener('click', clearSession);
}
