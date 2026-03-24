const API_BASE = 'https://subscription-cleaner-production.up.railway.app';

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerBtn = document.getElementById('register-btn');
const authMessage = document.getElementById('auth-message');
const listEl = document.getElementById('subscription-list');
const filterInput = document.getElementById('filter');
const scanEmailBtn = document.getElementById('scan-email');
const emptyState = document.getElementById('empty-state');

let token = localStorage.getItem('token');

const toastEl = document.createElement('div');
toastEl.id = 'toast';
document.body.appendChild(toastEl);

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 1900);
}

function showAuth() {
  authSection.style.display = 'block';
  appSection.style.display = 'none';
}

function showApp() {
  authSection.style.display = 'none';
  appSection.style.display = 'block';
  loadSubscriptions();
}

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API error');
  }
  return response.json();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    token = data.token;
    localStorage.setItem('token', token);
    showToast('Inloggad!');
    showApp();
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

registerBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!email || !password) {
    authMessage.textContent = 'Fyll i email och lösenord';
    return;
  }
  try {
    await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    showToast('Konto skapat! Logga in nu.');
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

async function loadSubscriptions() {
  try {
    const subscriptions = await apiCall('/subscriptions');
    renderSubscriptions(subscriptions);
  } catch (err) {
    showToast('Kunde inte ladda prenumerationer');
  }
}

function renderSubscriptions(subscriptions) {
  listEl.innerHTML = '';
  if (subscriptions.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  subscriptions.forEach((sub) => {
    const card = document.createElement('article');
    card.className = 'card';

    const title = document.createElement('h2');
    title.innerText = sub.service_info.name;

    const meta = document.createElement('p');
    meta.innerText = `${sub.service_info.category} • Status: ${sub.status}`;

    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const openBtn = document.createElement('button');
    openBtn.className = 'open';
    openBtn.innerText = 'Öppna sida';
    openBtn.addEventListener('click', () => window.open(sub.service_info.cancel_url, '_blank'));

    const unsubBtn = document.createElement('button');
    unsubBtn.className = 'unsubscribe';
    unsubBtn.innerText = 'Avsluta';
    unsubBtn.addEventListener('click', () => {
      window.open(sub.service_info.cancel_url, '_blank');
      showToast(`Öppnar avprenumeration för ${sub.service_info.name}`);
    });

    buttons.append(openBtn, unsubBtn);
    card.append(title, meta, buttons);
    listEl.appendChild(card);
  });
}

scanEmailBtn.addEventListener('click', async () => {
  try {
    await apiCall('/scan/email', { method: 'POST' });
    showToast('Email-skanning startad');
  } catch (err) {
    showToast('Kunde inte starta skanning');
  }
});

filterInput.addEventListener('input', () => {
  // TODO: Filter subscriptions
});

if (token) {
  showApp();
} else {
  showAuth();
}
