/* ==========================================
   FIREBASE CONFIGURATION
   ========================================== */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAt3CUfExpQKEsPMqqy-ky_A1lJqKAebXU",
  authDomain: "fashion-garage-c8058.firebaseapp.com",
  projectId: "fashion-garage-c8058",
  storageBucket: "fashion-garage-c8058.firebasestorage.app",
  messagingSenderId: "900366120245",
  appId: "1:900366120245:web:b2ea2bf8aceda339f8087c",
  measurementId: "G-LFPD2EV5FG"
};

firebase.initializeApp(FIREBASE_CONFIG);
var auth = firebase.auth();
var googleProvider = new firebase.auth.GoogleAuthProvider();
var db = null;
try { db = firebase.firestore(); } catch (e) { console.error('Firestore init failed:', e); }

/* ==========================================
   TIMEOUT HELPER — Firebase hang রোধ করে
   ========================================== */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('Timeout after ' + ms + 'ms')); }, ms);
    })
  ]);
}

/* ==========================================
   CONSTANTS
   ========================================== */
var ADMIN_COLORS = [
  { hex: '#000000', name: 'Black', light: false }, { hex: '#ffffff', name: 'White', light: true },
  { hex: '#1a237e', name: 'Navy', light: false }, { hex: '#5d4037', name: 'Brown', light: false },
  { hex: '#757575', name: 'Gray', light: false }, { hex: '#d4c5a9', name: 'Beige', light: true },
  { hex: '#c62828', name: 'Red', light: false }, { hex: '#1565c0', name: 'Blue', light: false },
  { hex: '#2e7d32', name: 'Green', light: false }, { hex: '#d4a017', name: 'Gold', light: false },
  { hex: '#e91e63', name: 'Pink', light: false }, { hex: '#556b2f', name: 'Olive', light: false },
  { hex: '#800000', name: 'Maroon', light: false }, { hex: '#008080', name: 'Teal', light: false },
  { hex: '#722F37', name: 'Burgundy', light: false }, { hex: '#FF7F50', name: 'Coral', light: false },
  { hex: '#D2B48C', name: 'Tan', light: false }, { hex: '#36454F', name: 'Charcoal', light: false },
  { hex: '#8E4585', name: 'Plum', light: false }, { hex: '#F5F5DC', name: 'Cream', light: true },
  { hex: '#E6E6FA', name: 'Lavender', light: true }, { hex: '#FFD700', name: 'Yellow', light: false },
  { hex: '#4A0E0E', name: 'Dark Red', light: false }, { hex: '#2F4F4F', name: 'Dark Slate', light: false }
];
var ADMIN_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
var PERFUME_SIZES = ['30ml', '50ml', '100ml'];
var SUB_CATS = {
  men: ['jacket', 'shirt', 'trousers', 'sweater', 'polo'],
  women: ['dress', 'top', 'skirt', 'coat', 'blouse'],
  watch: ['chronograph', 'minimalist', 'diver', 'smart'],
  bag: ['tote', 'crossbody', 'backpack', 'clutch'],
  perfume: ['oud', 'floral', 'citrus', 'musk'],
  jewelry: ['necklace', 'earrings', 'bracelet', 'ring'],
  sunglasses: ['aviator', 'wayfarer', 'round', 'sport'],
  homedecor: ['vase', 'candle', 'frame', 'sculpture']
};
var SUB_CAT_LABELS = {
  jacket: 'Jacket', shirt: 'Shirt', trousers: 'Trousers', sweater: 'Sweater', polo: 'Polo',
  dress: 'Dress', top: 'Top', skirt: 'Skirt', coat: 'Coat', blouse: 'Blouse',
  chronograph: 'Chronograph', minimalist: 'Minimalist', diver: 'Diver', smart: 'Smart Watch',
  tote: 'Tote', crossbody: 'Crossbody', backpack: 'Backpack', clutch: 'Clutch',
  oud: 'Oud', floral: 'Floral', citrus: 'Citrus', musk: 'Musk',
  necklace: 'Necklace', earrings: 'Earrings', bracelet: 'Bracelet', ring: 'Ring',
  aviator: 'Aviator', wayfarer: 'Wayfarer', round: 'Round', sport: 'Sport',
  vase: 'Vase', candle: 'Candle', frame: 'Frame', sculpture: 'Sculpture'
};
var LIGHT_COLORS = ['#ffffff', '#d4c5a9', '#f5e6cc', '#e8d5b7', '#f0e68c', '#F5F5DC', '#E6E6FA', '#FFD700'];
var ADMIN_DEFAULT_USER = 'admin';
var ADMIN_DEFAULT_PASS = 'admin123';

/* ==========================================
   FIRESTORE DATA FUNCTIONS
   ========================================== */
async function loadProducts() {
  if (!db) return [];
  try {
    var snapshot = await withTimeout(db.collection('products').get(), 8000);
    var arr = [];
    snapshot.forEach(function (doc) { var d = doc.data(); d.id = Number(doc.id); arr.push(d); });
    return arr;
  } catch (e) { console.error('loadProducts:', e); return []; }
}

async function saveProductToDB(productData) {
  if (!db) return;
  await db.collection('products').doc(String(productData.id)).set(productData);
}

async function deleteProductFromDB(id) {
  if (!db) return;
  await db.collection('products').doc(String(id)).delete();
}

async function loadOrders() {
  if (!db) return [];
  try {
    var snapshot = await withTimeout(db.collection('orders').get(), 8000);
    var arr = [];
    snapshot.forEach(function (doc) { arr.push(doc.data()); });
    return arr;
  } catch (e) { console.error('loadOrders:', e); return []; }
}

async function saveOrderToDB(orderData) {
  if (!db) return;
  await db.collection('orders').doc(orderData.id).set(orderData);
}

async function updateOrderInDB(orderId, updates) {
  if (!db) return;
  await db.collection('orders').doc(orderId).update(updates);
}

async function deleteOrderFromDB(orderId) {
  if (!db) return;
  await db.collection('orders').doc(orderId).delete();
}

async function loadConfig() {
  if (!db) return { adminPass: ADMIN_DEFAULT_PASS, nextOrderId: 1001 };
  try {
    var doc = await withTimeout(db.collection('config').doc('store').get(), 5000);
    if (doc.exists) return doc.data();
    return { adminPass: ADMIN_DEFAULT_PASS, nextOrderId: 1001 };
  } catch (e) {
    console.error('loadConfig:', e);
    return { adminPass: ADMIN_DEFAULT_PASS, nextOrderId: 1001 };
  }
}

async function saveConfig(config) {
  if (!db) return;
  await db.collection('config').doc('store').set(config, { merge: true });
}

async function getFirebaseUserProfile(uid) {
  if (!db) return null;
  try {
    var doc = await withTimeout(db.collection('userProfiles').doc(uid).get(), 5000);
    return doc.exists ? doc.data() : null;
  } catch (e) { return null; }
}

async function saveFirebaseUserProfile(uid, profile) {
  if (!db) return;
  try { await db.collection('userProfiles').doc(uid).set(profile, { merge: true }); } catch (e) { }
}

/* ==========================================
   GLOBAL STATE
   ========================================== */
var products = [];
var orders = [];
var cart = [];
var wishlist = new Set();
var nextOrderId = 1001;
var currentSlide = 0;
var slideInterval;
var pmCurrentProduct = null;
var pmSelectedColor = '';
var pmSelectedSize = '';
var pmQuantity = 1;
var pendingCartAction = null;
var currentPageInfo = { page: 'home', gridId: '', countId: '', filterId: '', subFilter: null };
var _activeSubFilter = '';
var _activeSizes = [];
var admEditId = null;
var admFormColors = [];
var admFormSizes = [];

/* ==========================================
   WISHLIST (per-device localStorage)
   ========================================== */
function loadWishlist() {
  try { var s = localStorage.getItem('fg_wishlist'); if (s) wishlist = new Set(JSON.parse(s)); } catch (e) { }
}
function saveWishlist() { localStorage.setItem('fg_wishlist', JSON.stringify(Array.from(wishlist))); }

/* ==========================================
   AUTH STATE
   ========================================== */
auth.onAuthStateChanged(function (user) {
  updateUserUI(user);
  if (pendingCartAction && user) {
    var action = pendingCartAction;
    pendingCartAction = null;
    setTimeout(function () { action(); }, 300);
  }
});

function isLoggedIn() { return !!auth.currentUser; }

async function getLoggedUser() {
  var user = auth.currentUser;
  if (!user) return null;
  var profile = await getFirebaseUserProfile(user.uid);
  return {
    uid: user.uid,
    name: profile ? profile.name : (user.displayName || 'User'),
    email: user.email,
    phone: profile ? profile.phone : '',
    photoURL: user.photoURL || ''
  };
}

/* ==========================================
   AUTH FUNCTIONS
   ========================================== */
function doLogin() {
  var email = document.getElementById('loginEmail').value.trim().toLowerCase();
  var password = document.getElementById('loginPass').value;
  var errEl = document.getElementById('loginError');
  errEl.classList.remove('show');
  if (!email || !password) { errEl.textContent = 'Please enter email and password'; errEl.classList.add('show'); return; }
  var btn = errEl.parentElement.querySelector('.co-submit');
  var ot = btn.textContent; btn.textContent = 'Logging in...'; btn.disabled = true;
  auth.signInWithEmailAndPassword(email, password)
    .then(function (cred) {
      closeLogin();
      getFirebaseUserProfile(cred.user.uid).then(function (p) {
        showToast('Welcome back, ' + (p ? p.name : cred.user.displayName || 'User') + '!');
      });
    })
    .catch(function (err) {
      errEl.textContent = getFirebaseErrorMsg(err.code); errEl.classList.add('show');
      btn.textContent = ot; btn.disabled = false;
    });
}

function doRegister() {
  var name = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim().toLowerCase();
  var phone = document.getElementById('regPhone').value.trim();
  var password = document.getElementById('regPass').value;
  var errEl = document.getElementById('regError');
  errEl.classList.remove('show');
  if (!name || !email || !phone || !password) { errEl.textContent = 'Please fill in all fields'; errEl.classList.add('show'); return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; errEl.classList.add('show'); return; }
  if (!isValidEmail(email)) { errEl.textContent = 'Please enter a valid email address'; errEl.classList.add('show'); return; }
  var btn = errEl.parentElement.querySelector('.co-submit');
  var ot = btn.textContent; btn.textContent = 'Creating Account...'; btn.disabled = true;
  auth.createUserWithEmailAndPassword(email, password)
    .then(function (cred) {
      return cred.user.updateProfile({ displayName: name }).then(function () {
        return saveFirebaseUserProfile(cred.user.uid, { name: name, email: email, phone: phone, createdAt: new Date().toISOString() });
      });
    })
    .then(function () { closeLogin(); showToast('Account created! Welcome!'); })
    .catch(function (err) {
      errEl.textContent = getFirebaseErrorMsg(err.code); errEl.classList.add('show');
      btn.textContent = ot; btn.disabled = false;
    });
}

function googleSignIn() {
  var errEl = null;
  if (document.getElementById('loginFormDiv').style.display !== 'none') errEl = document.getElementById('loginError');
  else if (document.getElementById('regFormDiv').style.display !== 'none') errEl = document.getElementById('regError');
  if (errEl) errEl.classList.remove('show');
  auth.signInWithPopup(googleProvider)
    .then(function (result) {
      var user = result.user;
      getFirebaseUserProfile(user.uid).then(function (profile) {
        if (!profile) saveFirebaseUserProfile(user.uid, { name: user.displayName || 'Google User', email: user.email, phone: '', photoURL: user.photoURL || '', createdAt: new Date().toISOString() });
      });
      closeLogin();
      showToast('Welcome, ' + (user.displayName || 'User') + '!');
    })
    .catch(function (err) {
      if (err.code === 'auth/popup-closed-by-user') return;
      var msg = getFirebaseErrorMsg(err.code);
      if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); } else showToast(msg);
    });
}

function doForgotPassword() {
  var email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  var errEl = document.getElementById('forgotError');
  var succEl = document.getElementById('forgotSuccess');
  errEl.classList.remove('show'); succEl.classList.remove('show');
  if (!email) { errEl.textContent = 'Please enter your email address'; errEl.classList.add('show'); return; }
  var btn = errEl.parentElement.querySelector('.co-submit');
  var ot = btn.textContent; btn.textContent = 'Sending...'; btn.disabled = true;
  auth.sendPasswordResetEmail(email)
    .then(function () {
      succEl.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success);margin-right:8px"></i> Reset link sent to <strong>' + email + '</strong>.';
      succEl.classList.add('show'); btn.textContent = ot; btn.disabled = false;
      document.getElementById('forgotEmail').value = '';
    })
    .catch(function (err) {
      errEl.textContent = getFirebaseErrorMsg(err.code); errEl.classList.add('show');
      btn.textContent = ot; btn.disabled = false;
    });
}

function doLogout() { auth.signOut().then(function () { showToast('Logged out'); }).catch(function () { showToast('Logged out'); }); }

function getFirebaseErrorMsg(code) {
  var m = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many attempts. Try later.',
    'auth/network-request-failed': 'Network error. Check internet.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Min 6 characters.',
    'auth/operation-not-allowed': 'Sign-in method not enabled.',
    'auth/popup-blocked': 'Popup blocked. Allow popups.',
    'auth/internal-error': 'Internal error. Try again.'
  };
  return m[code] || 'Error (' + code + '). Try again.';
}
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

/* ==========================================
   LOGIN / REGISTER UI
   ========================================== */
function openLogin() {
  document.getElementById('loginOv').classList.add('active');
  document.getElementById('loginModal').classList.add('active');
  document.body.style.overflow = 'hidden'; showLogForm();
}
function closeLogin() {
  document.getElementById('loginOv').classList.remove('active');
  document.getElementById('loginModal').classList.remove('active');
  document.body.style.overflow = '';
  ['loginEmail', 'loginPass', 'regName', 'regEmail', 'regPhone', 'regPass', 'forgotEmail'].forEach(function (id) { document.getElementById(id).value = ''; });
  ['loginError', 'regError', 'forgotError', 'forgotSuccess'].forEach(function (id) { document.getElementById(id).classList.remove('show'); });
  document.querySelectorAll('.login-modal .co-submit').forEach(function (b) { b.disabled = false; });
}
function showLogForm() {
  document.getElementById('loginFormDiv').style.display = 'block';
  document.getElementById('regFormDiv').style.display = 'none';
  document.getElementById('forgotFormDiv').style.display = 'none';
  document.getElementById('loginTitle').textContent = 'Login';
  document.getElementById('loginError').classList.remove('show');
}
function showRegForm() {
  document.getElementById('loginFormDiv').style.display = 'none';
  document.getElementById('regFormDiv').style.display = 'block';
  document.getElementById('forgotFormDiv').style.display = 'none';
  document.getElementById('loginTitle').textContent = 'Register';
  document.getElementById('regError').classList.remove('show');
}
function showForgotForm() {
  document.getElementById('loginFormDiv').style.display = 'none';
  document.getElementById('regFormDiv').style.display = 'none';
  document.getElementById('forgotFormDiv').style.display = 'block';
  document.getElementById('loginTitle').textContent = 'Reset Password';
  document.getElementById('forgotError').classList.remove('show');
  document.getElementById('forgotSuccess').classList.remove('show');
}
function togglePassVis(inputId, btn) {
  var input = document.getElementById(inputId);
  var icon = btn.querySelector('i');
  if (input.type === 'password') { input.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { input.type = 'password'; icon.className = 'fas fa-eye'; }
}
async function handleUserClick() {
  if (isLoggedIn()) {
    var user = await getLoggedUser();
    if (confirm('Logged in as ' + user.name + '\nEmail: ' + user.email + '\n\nLogout?')) doLogout();
  } else openLogin();
}
function updateUserUI(firebaseUser) {
  var btn = document.getElementById('userBtn');
  if (firebaseUser) { btn.classList.add('logged-in'); btn.querySelector('i').className = 'fas fa-user-check'; }
  else { btn.classList.remove('logged-in'); btn.querySelector('i').className = 'fas fa-user'; }
}

/* ==========================================
   ADMIN PANEL
   ========================================== */
function handleHash() { if (window.location.hash === '#admin') showAdminLogin(); else hideAdmin(); }
window.addEventListener('hashchange', handleHash);

function showAdminLogin() {
  document.getElementById('storeWrapper').style.display = 'none';
  document.querySelector('.main-nav').style.display = 'none';
  document.getElementById('adminLoginOv').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('adminLoginError').classList.remove('show');
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  document.body.style.overflow = 'hidden';
}
function hideAdmin() {
  document.getElementById('storeWrapper').style.display = '';
  document.querySelector('.main-nav').style.display = '';
  document.getElementById('adminLoginOv').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'none';
  document.body.style.overflow = '';
}
async function adminGoBack() {
  window.location.hash = ''; hideAdmin();
  await refreshStoreData(); showPage('home');
}
async function refreshStoreData() {
  try { products = await loadProducts(); } catch (e) { products = []; }
  try { orders = await loadOrders(); } catch (e) { orders = []; }
}

/* ==========================================
   ADMIN LOGIN — Firebase এ আটকবে না
   ========================================== */
async function adminDoLogin() {
  var u = document.getElementById('adminUser').value.trim();
  var p = document.getElementById('adminPass').value;
  var err = document.getElementById('adminLoginError');
  err.classList.remove('show');

  if (!u || !p) {
    err.textContent = 'Please enter username and password';
    err.classList.add('show'); return;
  }

  // ইউজারনেম চেক — এটা কোনো ডাটাবেস লাগে না
  if (u !== ADMIN_DEFAULT_USER) {
    err.textContent = 'Invalid username or password';
    err.classList.add('show'); return;
  }

  // Firebase থেকে পাসওয়ার্ড চেক — ৫ সেকেন্ড টাইমআউট
  // ফেইল হলে ডিফল্ট পাসওয়ার্ড ব্যবহার হবে
  var correctPass = ADMIN_DEFAULT_PASS;
  try {
    var config = await withTimeout(loadConfig(), 5000);
    if (config && config.adminPass) correctPass = config.adminPass;
  } catch (e) {
    // Firebase অপরিচিত — ডিফল্ট পাসওয়ার্ড দিয়ে চলবে
    console.warn('Firebase config load failed, using default password');
  }

  // পাসওয়ার্ড চেক
  if (p !== correctPass) {
    err.textContent = 'Invalid username or password';
    err.classList.add('show'); return;
  }

  // ✅ লগইন সফল — প্যানেল তারপর ডাটা লোড
  document.body.style.overflow = 'auto';
  document.getElementById('adminLoginOv').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'flex';
  document.getElementById('adminUserDisp').textContent = 'Admin';

  adminShowSec('dashboard');
}

async function adminDoLogout() {
  window.location.hash = ''; hideAdmin();
  await refreshStoreData(); showPage('home'); showToast('Admin logged out');
}

async function adminShowSec(sec) {
  document.querySelectorAll('.admin-sec').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.admin-snav a').forEach(function (a) { a.classList.remove('active'); });
  var secMap = { dashboard: 'admDashboard', products: 'admProducts', orders: 'admOrders', settings: 'admSettings' };
  var titleMap = { dashboard: 'Dashboard', products: 'Products', orders: 'Orders', settings: 'Settings' };
  document.getElementById(secMap[sec]).classList.add('active');
  var navEl = document.querySelector('.admin-snav a[data-asec="' + sec + '"]');
  if (navEl) navEl.classList.add('active');
  document.getElementById('adminPageTitle').textContent = titleMap[sec];

  // লোডিং স্পিনার দেখাও
  document.getElementById(secMap[sec]).innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:80px;color:var(--lg)"><i class="fas fa-spinner fa-spin" style="font-size:28px;margin-right:14px;color:var(--gold)"></i> Loading data from server...</div>';

  try {
    if (sec === 'dashboard') await renderAdminDashboard();
    else if (sec === 'products') await renderAdminProducts();
    else if (sec === 'orders') await renderAdminOrders();
    else if (sec === 'settings') renderAdminSettings();
  } catch (e) {
    console.error('Admin section error:', e);
    document.getElementById(secMap[sec]).innerHTML =
      '<div class="adm-table-empty" style="padding:80px">' +
      '<i class="fas fa-exclamation-triangle" style="font-size:48px;color:var(--danger);margin-bottom:20px;display:block"></i>' +
      '<p style="font-size:16px;color:var(--w);margin-bottom:8px">Failed to load data</p>' +
      '<p style="font-size:13px;color:var(--lg)">Check your internet connection.<br>Make sure Firestore Database is created and enabled in Firebase Console.<br><br><strong>Default login:</strong> admin / admin123</p></div>';
  }
  document.getElementById('adminSidebar').classList.remove('open');
}

function toggleAdminSidebar() { document.getElementById('adminSidebar').classList.toggle('open'); }

async function renderAdminDashboard() {
  products = await loadProducts();
  orders = await loadOrders();
  var tp = products.length, to = orders.length;
  var rev = orders.reduce(function (s, o) { return s + o.total; }, 0);
  var oos = products.filter(function (p) { return !p.inStock; }).length;
  var recent = orders.slice().reverse().slice(0, 5);
  var html = '<div class="adm-stats">';
  html += '<div class="adm-stat-card"><div class="adm-stat-icon gold"><i class="fas fa-box"></i></div><div class="adm-stat-info"><h4>' + tp + '</h4><p>Total Products</p></div></div>';
  html += '<div class="adm-stat-card"><div class="adm-stat-icon blue"><i class="fas fa-receipt"></i></div><div class="adm-stat-info"><h4>' + to + '</h4><p>Total Orders</p></div></div>';
  html += '<div class="adm-stat-card"><div class="adm-stat-icon green"><i class="fas fa-bangladeshi-taka-sign"></i></div><div class="adm-stat-info"><h4>' + fmtPrice(rev) + '</h4><p>Total Revenue</p></div></div>';
  html += '<div class="adm-stat-card"><div class="adm-stat-icon red"><i class="fas fa-exclamation-triangle"></i></div><div class="adm-stat-info"><h4>' + oos + '</h4><p>Out of Stock</p></div></div>';
  html += '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
  html += '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Recent Orders</h3></div>';
  if (recent.length) {
    html += '<table class="adm-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>';
    recent.forEach(function (o) {
      html += '<tr><td style="font-weight:600;color:var(--gold)">' + o.id + '</td><td>' + o.customer.name + '</td><td>' + fmtPrice(o.total) + '</td><td><span class="adm-status ' + o.status + '">' + o.status + '</span></td></tr>';
    });
    html += '</tbody></table>';
  } else html += '<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders yet</div>';
  html += '</div>';
  var cats = {};
  products.forEach(function (p) { cats[p.category] = (cats[p.category] || 0) + 1; });
  html += '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Products by Category</h3></div>';
  html += '<table class="adm-table"><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>';
  for (var c in cats) html += '<tr><td><span class="adm-table-cat">' + c + '</span></td><td>' + cats[c] + '</td></tr>';
  if (!Object.keys(cats).length) html += '<tr><td colspan="2" style="text-align:center;color:var(--lg);padding:20px">No products</td></tr>';
  html += '</tbody></table></div></div>';
  document.getElementById('admDashboard').innerHTML = html;
}

var admProdSearchQ = '';
var admProdFilterCat = '';
async function renderAdminProducts() {
  products = await loadProducts();
  var list = products.slice();
  if (admProdFilterCat) list = list.filter(function (p) { return p.category === admProdFilterCat; });
  if (admProdSearchQ) { var q = admProdSearchQ.toLowerCase(); list = list.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1 || p.id.toString().indexOf(q) !== -1; }); }
  var html = '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>All Products (' + list.length + ')</h3><div class="adm-table-actions">';
  html += '<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search..." value="' + admProdSearchQ + '" oninput="admProdSearchQ=this.value;renderAdminProducts()"></div>';
  html += '<select class="adm-filter-sel" onchange="admProdFilterCat=this.value;renderAdminProducts()"><option value="">All Categories</option>';
  ['men', 'women', 'watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].forEach(function (c) { html += '<option value="' + c + '"' + (admProdFilterCat === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>'; });
  html += '</select><button class="adm-btn" onclick="openAddProductModal()"><i class="fas fa-plus"></i> Add Product</button></div></div>';
  if (!list.length) html += '<div class="adm-table-empty"><i class="fas fa-box-open"></i>No products found</div>';
  else {
    html += '<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function (p) {
      html += '<tr><td><img src="' + p.image + '" class="adm-table-img" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=No+Img\'"></td>';
      html += '<td class="adm-table-name">' + p.name + '</td>';
      html += '<td><span class="adm-table-cat">' + p.category + (p.subCategory ? ' / ' + p.subCategory : '') + '</span></td>';
      html += '<td>' + fmtPrice(p.price) + (p.oldPrice ? ' <br><span style="text-decoration:line-through;color:rgba(255,255,255,.3);font-size:11px">' + fmtPrice(p.oldPrice) + '</span>' : '') + '</td>';
      html += '<td>' + (p.inStock ? '<span class="adm-stock-yes"><i class="fas fa-check-circle"></i> In Stock</span>' : '<span class="adm-stock-no"><i class="fas fa-times-circle"></i> Out</span>') + '</td>';
      html += '<td><div class="adm-actions"><button class="adm-act-btn" title="Edit" onclick="openEditProductModal(' + p.id + ')"><i class="fas fa-pen"></i></button><button class="adm-act-btn del" title="Delete" onclick="deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i></button></div></td></tr>';
    });
    html += '</tbody></table></div>';
  }
  html += '</div>';
  document.getElementById('admProducts').innerHTML = html;
}

function openAddProductModal() {
  admEditId = null; admFormColors = []; admFormSizes = [];
  document.getElementById('admModalTitle').textContent = 'Add New Product';
  renderProductForm({ name: '', price: '', oldPrice: '', category: 'men', subCategory: '', image: '', colors: [], sizes: [], inStock: true, tag: '', description: '' });
  document.getElementById('admModalOv').classList.add('active');
  document.getElementById('admProductModal').classList.add('active');
}
async function openEditProductModal(id) {
  products = await loadProducts();
  var p = products.find(function (x) { return x.id === id; });
  if (!p) return;
  admEditId = id; admFormColors = p.colors.slice(); admFormSizes = p.sizes.slice();
  document.getElementById('admModalTitle').textContent = 'Edit Product';
  renderProductForm(p);
  document.getElementById('admModalOv').classList.add('active');
  document.getElementById('admProductModal').classList.add('active');
}
function closeAdmModal() { document.getElementById('admModalOv').classList.remove('active'); document.getElementById('admProductModal').classList.remove('active'); }

function renderProductForm(p) {
  var html = '<div class="adm-form-grid">';
  html += '<div class="adm-form-full adm-form-group"><label>Product Name</label><input type="text" id="afName" value="' + escHtml(p.name) + '" placeholder="Enter product name"></div>';
  html += '<div class="adm-form-group"><label>Category</label><select id="afCat" onchange="updateSubCatOptions()">';
  ['men', 'women', 'watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].forEach(function (c) { html += '<option value="' + c + '"' + (p.category === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>'; });
  html += '</select></div><div class="adm-form-group"><label>Sub-Category</label><select id="afSubCat"></select></div>';
  html += '<div class="adm-form-group"><label>Current Price (&#x09F3;)</label><input type="number" id="afPrice" value="' + (p.price || '') + '" placeholder="0" min="0"></div>';
  html += '<div class="adm-form-group"><label>Old Price (&#x09F3;) [Optional]</label><input type="number" id="afOldPrice" value="' + (p.oldPrice || '') + '" placeholder="0" min="0"></div>';
  html += '<div class="adm-form-full adm-form-group"><label>Product Image</label>';
  html += '<div class="adm-img-preview" id="afImgPreview">' + (p.image ? '<img src="' + p.image + '">' : '<span class="placeholder">No Image</span>') + '</div>';
  html += '<div class="adm-img-inputs"><div class="adm-img-url-wrap"><input type="text" id="afImage" value="' + escHtml(p.image) + '" placeholder="Paste image URL" oninput="previewImgUrl(this.value)"></div>';
  html += '<div class="adm-img-or">&mdash; OR &mdash;</div>';
  html += '<div class="adm-img-upload-wrap"><div class="adm-img-upload-btn"><i class="fas fa-cloud-upload-alt"></i> Upload Image<input type="file" id="afImageFile" accept="image/*" onchange="handleImageUpload(event)"></div></div></div></div>';
  html += '<div class="adm-form-full adm-form-group"><label>Colors</label><div class="adm-color-picks" id="afColorPicks">';
  ADMIN_COLORS.forEach(function (c) {
    html += '<div class="adm-color-pick' + (LIGHT_COLORS.indexOf(c.hex) !== -1 ? ' light-c' : '') + (p.colors.indexOf(c.hex) !== -1 ? ' active' : '') + '" style="background:' + c.hex + '" title="' + c.name + '" onclick="toggleAdmColor(this,\'' + c.hex + '\')"></div>';
  });
  html += '</div></div><div class="adm-form-full adm-form-group"><label>Sizes</label><div class="adm-size-picks" id="afSizePicks">';
  var sz = (p.category === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  sz.forEach(function (s) { html += '<div class="adm-size-pick' + (p.sizes.indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleAdmSize(this,\'' + s + '\')">' + s + '</div>'; });
  html += '</div></div>';
  html += '<div class="adm-form-group"><label>Tag</label><select id="afTag"><option value="">None</option>';
  ['New', 'Hot', 'Sale'].forEach(function (t) { html += '<option value="' + t + '"' + (p.tag === t ? ' selected' : '') + '>' + t + '</option>'; });
  html += '</select></div>';
  html += '<div class="adm-form-group" style="display:flex;align-items:flex-end;padding-bottom:2px"><label class="adm-form-check"><input type="checkbox" id="afStock" ' + (p.inStock ? 'checked' : '') + '><span>In Stock</span></label></div>';
  html += '<div class="adm-form-full adm-form-group"><label>Description</label><textarea id="afDesc" rows="3" placeholder="Product description">' + escHtml(p.description || '') + '</textarea></div>';
  html += '<div class="adm-form-bottom"><button class="adm-btn adm-btn-outline" type="button" onclick="closeAdmModal()">Cancel</button><button class="adm-btn" type="button" onclick="saveProductFromModal()"><i class="fas fa-save"></i> Save Product</button></div></div>';
  document.getElementById('admModalBody').innerHTML = html;
  updateSubCatOptions(p.subCategory);
}

function escHtml(s) { if (!s) return ''; return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function previewImgUrl(val) { var p = document.getElementById('afImgPreview'); if (val) p.innerHTML = '<img src="' + val + '">'; else p.innerHTML = '<span class="placeholder">No Image</span>'; }
function handleImageUpload(e) {
  var f = e.target.files[0]; if (!f) return;
  if (!f.type.startsWith('image/')) { showToast('Select an image file'); return; }
  if (f.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB'); return; }
  var r = new FileReader();
  r.onload = function (ev) { document.getElementById('afImage').value = ev.target.result; document.getElementById('afImgPreview').innerHTML = '<img src="' + ev.target.result + '">'; };
  r.readAsDataURL(f);
}
function updateSubCatOptions(sel) {
  var cat = document.getElementById('afCat').value, el = document.getElementById('afSubCat'), cs = SUB_CATS[cat] || [];
  var h = '<option value="">Select Sub-Category</option>';
  cs.forEach(function (c) { h += '<option value="' + c + '"' + (sel === c ? ' selected' : '') + '>' + SUB_CAT_LABELS[c] + '</option>'; });
  el.innerHTML = h;
  var se = document.getElementById('afSizePicks'), st = (cat === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES, sh = '';
  st.forEach(function (s) { sh += '<div class="adm-size-pick' + (admFormSizes.indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleAdmSize(this,\'' + s + '\')">' + s + '</div>'; });
  se.innerHTML = sh;
}
function toggleAdmColor(el, hex) { el.classList.toggle('active'); var i = admFormColors.indexOf(hex); if (i === -1) admFormColors.push(hex); else admFormColors.splice(i, 1); }
function toggleAdmSize(el, size) { el.classList.toggle('active'); var i = admFormSizes.indexOf(size); if (i === -1) admFormSizes.push(size); else admFormSizes.splice(i, 1); }

async function saveProductFromModal() {
  var name = document.getElementById('afName').value.trim();
  var price = parseInt(document.getElementById('afPrice').value);
  var oldPrice = parseInt(document.getElementById('afOldPrice').value) || 0;
  var category = document.getElementById('afCat').value;
  var subCategory = document.getElementById('afSubCat').value;
  var image = document.getElementById('afImage').value.trim();
  var tag = document.getElementById('afTag').value;
  var inStock = document.getElementById('afStock').checked;
  var description = document.getElementById('afDesc').value.trim();
  if (!name) { showToast('Product name is required'); return; }
  if (!price || price <= 0) { showToast('Valid price is required'); return; }
  if (!image) { showToast('Image is required'); return; }
  var d = { name: name, price: price, oldPrice: oldPrice, category: category, subCategory: subCategory, image: image, colors: admFormColors.slice(), sizes: admFormSizes.slice(), inStock: inStock, tag: tag, description: description };
  try {
    if (admEditId) { d.id = admEditId; await saveProductToDB(d); showToast('Product updated'); }
    else { var mx = products.reduce(function (m, p) { return p.id > m ? p.id : m; }, 0); d.id = mx + 1; await saveProductToDB(d); products.push(d); showToast('Product added'); }
    closeAdmModal(); await renderAdminProducts();
  } catch (e) { console.error(e); showToast('Error saving product — check Firebase connection'); }
}

async function deleteProduct(id) {
  var p = products.find(function (x) { return x.id === id; });
  if (!p) return; if (!confirm('Delete "' + p.name + '"?')) return;
  try { await deleteProductFromDB(id); products = products.filter(function (x) { return x.id !== id; }); await renderAdminProducts(); showToast('Product deleted'); }
  catch (e) { showToast('Error deleting product'); }
}

var admOrderSearchQ = '';
async function renderAdminOrders() {
  orders = await loadOrders();
  var list = orders.slice();
  if (admOrderSearchQ) { var q = admOrderSearchQ.toLowerCase(); list = list.filter(function (o) { return o.id.toLowerCase().indexOf(q) !== -1 || o.customer.name.toLowerCase().indexOf(q) !== -1; }); }
  var html = '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>All Orders (' + list.length + ')</h3><div class="adm-table-actions">';
  html += '<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search..." value="' + admOrderSearchQ + '" oninput="admOrderSearchQ=this.value;renderAdminOrders()"></div></div></div>';
  if (!list.length) html += '<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders found</div>';
  else {
    html += '<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function (o) {
      html += '<tr><td style="font-weight:600;color:var(--gold)">' + o.id + '</td><td>' + o.date + '</td><td>' + o.customer.name + '</td><td>' + fmtPrice(o.total) + '</td>';
      html += '<td><span class="adm-status ' + o.status + '">' + o.status + '</span></td>';
      html += '<td><div class="adm-actions"><button class="adm-act-btn" onclick="openOrderDetailModal(\'' + o.id + '\')"><i class="fas fa-eye"></i></button><button class="adm-act-btn del" onclick="deleteOrder(\'' + o.id + '\')"><i class="fas fa-trash"></i></button></div></td></tr>';
    });
    html += '</tbody></table></div>';
  }
  html += '</div>';
  document.getElementById('admOrders').innerHTML = html;
}

async function openOrderDetailModal(id) {
  orders = await loadOrders();
  var o = orders.find(function (x) { return x.id === id; }); if (!o) return;
  var html = '<div class="adm-order-info"><div class="adm-order-info-card"><h4>Customer</h4><p><strong>Name:</strong> ' + o.customer.name + '</p><p><strong>Phone:</strong> ' + o.customer.phone + '</p><p><strong>Email:</strong> ' + o.customer.email + '</p></div>';
  html += '<div class="adm-order-info-card"><h4>Shipping</h4><p>' + o.customer.address + '</p>' + (o.customer.notes ? '<p><strong>Notes:</strong> ' + o.customer.notes + '</p>' : '') + '</div></div>';
  html += '<div class="adm-order-info" style="margin-bottom:20px"><div class="adm-order-info-card"><h4>Payment</h4><p><strong>Method:</strong> ' + (o.payMethod === 'cod' ? 'COD' : o.payMethod === 'bkash' ? 'bKash' : 'Nagad') + '</p><p>' + (o.paid ? '<span class="adm-paid-badge">Paid</span>' : '<span class="adm-unpaid-badge">Unpaid</span>') + '</p>' + (o.txnId ? '<p><strong>Txn:</strong> ' + o.txnId + '</p>' : '') + '</div>';
  html += '<div class="adm-order-info-card"><h4>Order</h4><p><strong>ID:</strong> <span style="color:var(--gold)">' + o.id + '</span></p><p><strong>Date:</strong> ' + o.date + '</p><p><span class="adm-status ' + o.status + '">' + o.status + '</span></p></div></div>';
  html += '<h4 style="font-family:var(--fh);font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:12px">Items</h4><div class="adm-order-items">';
  o.items.forEach(function (it) { html += '<div class="adm-order-item"><img src="' + it.image + '" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=Img\'"><div class="adm-order-item-info"><h5>' + it.name + '</h5><p>' + (it.color ? it.color : '') + (it.size ? ' | ' + it.size : '') + ' x ' + it.qty + '</p></div><div class="adm-order-item-price">' + fmtPrice(it.price * it.qty) + '</div></div>'; });
  html += '</div><div class="adm-order-total"><span>Total:</span><strong>' + fmtPrice(o.total) + '</strong></div>';
  html += '<div style="margin-top:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap"><label style="font-family:var(--fh);font-size:12px;color:var(--lg)">Status:</label>';
  html += '<select id="admOrderStatus" style="padding:10px 16px;background:var(--bg);border:1px solid rgba(255,255,255,.08);color:var(--w);outline:none;cursor:pointer">';
  ['pending', 'processing', 'shipped', 'delivered'].forEach(function (s) { html += '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>'; });
  html += '</select><button class="adm-btn" onclick="updateOrderStatus(\'' + o.id + '\')"><i class="fas fa-save"></i> Update</button></div>';
  document.getElementById('admOrderBody').innerHTML = html;
  document.getElementById('admOrderOv').classList.add('active');
  document.getElementById('admOrderModal').classList.add('active');
}
function closeAdmOrderModal() { document.getElementById('admOrderOv').classList.remove('active'); document.getElementById('admOrderModal').classList.remove('active'); }

async function updateOrderStatus(id) {
  var s = document.getElementById('admOrderStatus').value;
  try { await updateOrderInDB(id, { status: s }); closeAdmOrderModal(); await renderAdminOrders(); showToast('Updated to ' + s); } catch (e) { showToast('Error updating'); }
}
async function deleteOrder(id) {
  if (!confirm('Delete order ' + id + '?')) return;
  try { await deleteOrderFromDB(id); await renderAdminOrders(); showToast('Deleted'); } catch (e) { showToast('Error deleting'); }
}

function renderAdminSettings() {
  var html = '<div class="adm-settings-card"><h3>Change Admin Password</h3>';
  html += '<div class="adm-form-group"><label>Current Password</label><input type="password" id="setCurrPass"></div>';
  html += '<div class="adm-form-group"><label>New Password</label><input type="password" id="setNewPass"></div>';
  html += '<div class="adm-form-group"><label>Confirm New Password</label><input type="password" id="setConfPass"></div>';
  html += '<button class="adm-btn" onclick="changeAdminPass()"><i class="fas fa-key"></i> Update Password</button></div>';
  html += '<div class="adm-settings-card"><h3>Data Management</h3><p style="font-size:13px;color:var(--lg);margin-bottom:16px">Export/Import data.</p><div style="display:flex;gap:12px;flex-wrap:wrap">';
  html += '<button class="adm-btn adm-btn-outline" onclick="exportData()"><i class="fas fa-download"></i> Export</button>';
  html += '<button class="adm-btn adm-btn-outline" onclick="document.getElementById(\'importFileInput\').click()"><i class="fas fa-upload"></i> Import</button>';
  html += '<input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importData(event)"></div></div>';
  html += '<div class="adm-settings-card adm-danger-zone"><h3>Danger Zone</h3><div style="display:flex;gap:12px;flex-wrap:wrap">';
  html += '<button class="adm-btn adm-btn-danger" onclick="resetProducts()"><i class="fas fa-box-open"></i> Reset Products</button>';
  html += '<button class="adm-btn adm-btn-danger" onclick="resetAllData()"><i class="fas fa-trash-alt"></i> Reset Everything</button></div></div>';
  document.getElementById('admSettings').innerHTML = html;
}

async function changeAdminPass() {
  var curr = document.getElementById('setCurrPass').value;
  var newP = document.getElementById('setNewPass').value;
  var conf = document.getElementById('setConfPass').value;
  var config = await loadConfig();
  if (curr !== config.adminPass) { showToast('Current password incorrect'); return; }
  if (!newP || newP.length < 4) { showToast('Min 4 characters'); return; }
  if (newP !== conf) { showToast('Passwords do not match'); return; }
  config.adminPass = newP; await saveConfig(config);
  document.getElementById('setCurrPass').value = ''; document.getElementById('setNewPass').value = ''; document.getElementById('setConfPass').value = '';
  showToast('Password changed');
}

function exportData() {
  var blob = new Blob([JSON.stringify({ products: products, orders: orders }, null, 2)], { type: 'application/json' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fashion_garage_data.json'; a.click();
  showToast('Exported');
}

async function importData(e) {
  var f = e.target.files[0]; if (!f) return;
  var r = new FileReader();
  r.onload = async function (ev) {
    try {
      var d = JSON.parse(ev.target.result);
      if (d.products && Array.isArray(d.products)) {
        showToast('Importing ' + d.products.length + ' products...');
        for (var i = 0; i < d.products.length; i++) await saveProductToDB(d.products[i]);
        products = await loadProducts(); await renderAdminProducts(); showToast('Imported ' + products.length + ' products');
      } else showToast('Invalid file');
    } catch (err) { showToast('Error reading file'); }
  };
  r.readAsText(f); e.target.value = '';
}

async function resetProducts() {
  if (!confirm('Delete all products?')) return;
  try { var s = await db.collection('products').get(); var b = db.batch(); s.forEach(function (d) { b.delete(d.ref); }); await b.commit(); products = []; await renderAdminProducts(); showToast('Reset done'); } catch (e) { showToast('Error'); }
}

async function resetAllData() {
  if (!confirm('WARNING: Delete ALL data?')) return;
  try {
    var s1 = await db.collection('products').get(); var b1 = db.batch(); s1.forEach(function (d) { b1.delete(d.ref); }); await b1.commit();
    var s2 = await db.collection('orders').get(); var b2 = db.batch(); s2.forEach(function (d) { b2.delete(d.ref); }); await b2.commit();
    await saveConfig({ adminPass: ADMIN_DEFAULT_PASS, nextOrderId: 1001 });
    products = []; orders = []; await adminShowSec('dashboard'); showToast('All data reset');
  } catch (e) { showToast('Error'); }
}

/* ==========================================
   PAGE NAVIGATION
   ========================================== */
function showPage(page, subFilter) {
  if (window.location.hash === '#admin') return;
  document.querySelectorAll('.page-sec').forEach(function (s) { s.classList.remove('active'); });
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.querySelectorAll('[data-nav]').forEach(function (a) { a.classList.remove('active'); });
  document.querySelectorAll('[data-mnav]').forEach(function (a) { a.classList.remove('active'); });
  var navMap = { home: 'home', men: 'men', women: 'women', accessories: 'accessories', offer: 'sale' };
  var nk = navMap[page] || page;
  document.querySelectorAll('[data-nav="' + nk + '"]').forEach(function (a) { a.classList.add('active'); });
  document.querySelectorAll('[data-mnav="' + nk + '"]').forEach(function (a) { a.classList.add('active'); });

  var gridId = '', countId = '', filterId = '';
  if (page === 'home') { document.getElementById('homePage').classList.add('active'); }
  else if (page === 'men') { document.getElementById('menPage').classList.add('active'); gridId = 'menGrid'; countId = 'menCount'; filterId = 'menFilter'; }
  else if (page === 'women') { document.getElementById('womenPage').classList.add('active'); gridId = 'womenGrid'; countId = 'womenCount'; filterId = 'womenFilter'; }
  else if (page === 'accessories') {
    document.getElementById('accPage').classList.add('active');
    var at = { watch: 'Watches', bag: 'Bags', perfume: 'Perfumes', jewelry: 'Jewelry', sunglasses: 'Sunglasses', homedecor: 'Home Decor' };
    var sf = subFilter || null;
    document.getElementById('accBreadcrumb').textContent = sf ? (at[sf] || 'Accessories') : 'Accessories';
    document.getElementById('accTitle').textContent = sf ? (at[sf] || 'Accessories') : 'Accessories';
    gridId = 'accGrid'; countId = 'accCount'; filterId = 'accFilter';
  }
  else if (page === 'offer') { document.getElementById('offerPage').classList.add('active'); gridId = 'offerGrid'; countId = 'offerCount'; filterId = 'offerFilter'; }

  currentPageInfo = { page: page, gridId: gridId, countId: countId, filterId: filterId, subFilter: subFilter || null };

  if (gridId) {
    document.getElementById(gridId).innerHTML = '<div class="no-products"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--gold);margin-bottom:16px;display:block"></i>Loading...</div>';
    document.getElementById(countId).textContent = 'Loading...';
    document.getElementById(filterId).innerHTML = '';
  }

  loadProducts().then(function (data) {
    products = data;
    if (page === 'home') renderTrending();
    else if (gridId) { _activeSubFilter = (page === 'accessories') ? (subFilter || '') : ''; _activeSizes = []; initCategoryPage(page, gridId, countId, filterId, subFilter || null); }
  }).catch(function () {
    if (gridId) document.getElementById(gridId).innerHTML = '<div class="no-products"><i class="fas fa-exclamation-triangle"></i><br>Error loading products</div>';
  });
}

function closeMob() { document.getElementById('mobToggle').classList.remove('active'); document.getElementById('mobNav').classList.remove('active'); document.getElementById('mobOverlay').classList.remove('active'); document.body.style.overflow = ''; }
document.getElementById('mobToggle').addEventListener('click', function () { this.classList.toggle('active'); document.getElementById('mobNav').classList.toggle('active'); document.getElementById('mobOverlay').classList.toggle('active'); document.body.style.overflow = this.classList.contains('active') ? 'hidden' : ''; });
document.getElementById('mobOverlay').addEventListener('click', closeMob);
function toggleMobAcc(e) { e.preventDefault(); document.getElementById('mobAccTog').classList.toggle('open'); document.getElementById('mobSub').classList.toggle('show'); }

/* ==========================================
   HERO SLIDER
   ========================================== */
function initHeroSlider() {
  var t = document.getElementById('heroTrack'), d = document.getElementById('heroDots'), s = t.querySelectorAll('.hero-slide');
  if (!s.length) return; d.innerHTML = '';
  s.forEach(function (_, i) { var el = document.createElement('div'); el.className = 'dot' + (i === 0 ? ' active' : ''); el.onclick = function () { goToSlide(i); }; d.appendChild(el); });
  startAutoSlide();
}
function goToSlide(n) { var s = document.getElementById('heroTrack').querySelectorAll('.hero-slide'); if (n < 0) n = s.length - 1; if (n >= s.length) n = 0; currentSlide = n; document.getElementById('heroTrack').style.transform = 'translateX(-' + (n * 100) + '%)'; document.querySelectorAll('.s-dots .dot').forEach(function (d, i) { d.classList.toggle('active', i === n); }); }
function heroSlide(dir) { goToSlide(currentSlide + dir); startAutoSlide(); }
function startAutoSlide() { clearInterval(slideInterval); slideInterval = setInterval(function () { goToSlide(currentSlide + 1); }, 5000); }

/* ==========================================
   SCROLL EFFECTS
   ========================================== */
function initScrollEffects() {
  var nav = document.getElementById('mainNav'), stp = document.getElementById('scrollTop');
  window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 50); stp.classList.toggle('visible', window.scrollY > 400); });
  initFadeIn();
}
function initFadeIn() {
  var els = document.querySelectorAll('.fade-in:not(.visible)'); if (!els.length) return;
  var obs = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }); }, { threshold: 0.1 });
  els.forEach(function (el) { obs.observe(el); });
}

/* ==========================================
   PRODUCT CARD
   ========================================== */
function productCard(p) {
  var liked = wishlist.has(p.id);
  var h = '<div class="p-card" onclick="openPM(' + p.id + ')"><div class="p-img"><img src="' + p.image + '" alt="' + escHtml(p.name) + '" onerror="this.src=\'https://via.placeholder.com/400x500/121212/d4a017?text=No+Image\'">';
  h += '<button class="wl-btn' + (liked ? ' liked' : '') + '" onclick="event.stopPropagation();toggleWishlist(' + p.id + ')"><i class="' + (liked ? 'fas' : 'far') + ' fa-heart"></i></button>';
  if (p.tag) h += '<div class="p-tag">' + p.tag + '</div>';
  if (!p.inStock) h += '<div class="p-oos-tag">Out of Stock</div>';
  h += '</div><div class="p-details"><h4>' + escHtml(p.name) + '</h4><div class="p-price"><span class="cur">' + fmtPrice(p.price) + '</span>';
  if (p.oldPrice) h += '<span class="old">' + fmtPrice(p.oldPrice) + '</span>';
  h += '</div><button class="qv-btn' + (!p.inStock ? ' oos' : '') + '" onclick="event.stopPropagation();openPM(' + p.id + ')">' + (!p.inStock ? 'Out of Stock' : 'ORDER NOW') + '</button></div></div>';
  return h;
}

function renderTrending() {
  var g = document.getElementById('trendGrid');
  if (!products.length) { g.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><br>No products yet</div>'; return; }
  g.innerHTML = products.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 8).map(function (p) { return productCard(p); }).join('');
  initFadeIn();
}

/* ==========================================
   CATEGORY PAGE & FILTERS
   ========================================== */
function initCategoryPage(catType, gridId, countId, filterId, subFilter) {
  renderFilterSidebar(catType, filterId, subFilter);
  applyFilters(catType, gridId, countId);
}

function renderFilterSidebar(catType, filterId, subFilter) {
  var el = document.getElementById(filterId), h = '';
  if (catType === 'accessories' || catType === 'men' || catType === 'women') {
    h += '<div class="filter-group"><h4>Sub Category</h4><div class="filter-sub-btns">';
    h += '<button class="fsub-btn' + (!_activeSubFilter ? ' active' : '') + '" onclick="setSubFilter(\'\',\'' + catType + '\')"><i class="fas fa-check"></i> All</button>';
    var sc = (catType === 'accessories') ? (SUB_CATS[subFilter || ''] || []) : (SUB_CATS[catType] || []);
    sc.forEach(function (s) { h += '<button class="fsub-btn' + (_activeSubFilter === s ? ' active' : '') + '" onclick="setSubFilter(\'' + s + '\',\'' + catType + '\')"><i class="fas fa-check"></i> ' + SUB_CAT_LABELS[s] + '</button>'; });
    h += '</div></div>';
  }
  h += '<div class="filter-group"><h4>Size</h4><div class="filter-size-btns">';
  var sl = (subFilter === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  sl.forEach(function (s) { h += '<button class="fsize-btn' + (_activeSizes.indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleSizeFilter(\'' + s + '\',\'' + catType + '\')">' + s + '</button>'; });
  h += '</div></div>';
  h += '<div class="filter-group"><h4>Price Range</h4><div class="price-range-wrap"><input type="range" id="priceRange" min="0" max="50000" value="50000" oninput="updatePriceFilter(this.value,\'' + catType + '\')"><div class="price-range-val" id="priceRangeVal">Up to ' + fmtPrice(50000) + '</div></div></div>';
  h += '<button class="clear-filter-btn" onclick="clearFilters(\'' + catType + '\')">Clear All Filters</button>';
  el.innerHTML = h;
}

function setSubFilter(v, ct) { _activeSubFilter = v; renderFilterSidebar(ct, currentPageInfo.filterId, currentPageInfo.subFilter); applyFilters(ct, currentPageInfo.gridId, currentPageInfo.countId); }
function toggleSizeFilter(s, ct) { var i = _activeSizes.indexOf(s); if (i === -1) _activeSizes.push(s); else _activeSizes.splice(i, 1); applyFilters(ct, currentPageInfo.gridId, currentPageInfo.countId); }
function updatePriceFilter(v, ct) { document.getElementById('priceRangeVal').textContent = 'Up to ' + fmtPrice(Number(v)); applyFilters(ct, currentPageInfo.gridId, currentPageInfo.countId); }
function clearFilters(ct) { _activeSubFilter = ''; _activeSizes = []; var pr = document.getElementById('priceRange'); if (pr) { pr.value = 50000; document.getElementById('priceRangeVal').textContent = 'Up to ' + fmtPrice(50000); } renderFilterSidebar(ct, currentPageInfo.filterId, currentPageInfo.subFilter); applyFilters(ct, currentPageInfo.gridId, currentPageInfo.countId); }

function applyFilters(catType, gridId, countId) {
  var list = products.slice();
  if (catType === 'men') list = list.filter(function (p) { return p.category === 'men'; });
  else if (catType === 'women') list = list.filter(function (p) { return p.category === 'women'; });
  else if (catType === 'accessories') {
    var ac = ['watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'];
    list = list.filter(function (p) { return ac.indexOf(p.category) !== -1; });
    if (_activeSubFilter) list = list.filter(function (p) { return p.subCategory === _activeSubFilter; });
  } else if (catType === 'offer') list = list.filter(function (p) { return p.oldPrice > 0; });
  if (_activeSizes.length) list = list.filter(function (p) { return _activeSizes.some(function (s) { return p.sizes.indexOf(s) !== -1; }); });
  var pr = document.getElementById('priceRange'), mp = pr ? Number(pr.value) : 50000;
  list = list.filter(function (p) { return p.price <= mp; });
  var g = document.getElementById(gridId), c = document.getElementById(countId);
  c.textContent = 'Showing ' + list.length + ' product' + (list.length !== 1 ? 's' : '');
  if (!list.length) { g.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><br>No products found</div>'; return; }
  g.innerHTML = list.map(function (p) { return productCard(p); }).join('');
}

/* ==========================================
   SEARCH
   ========================================== */
var _st = null;
function openSearch() { document.getElementById('searchOv').classList.add('active'); document.body.style.overflow = 'hidden'; setTimeout(function () { document.getElementById('searchInput').focus(); }, 200); }
function closeSearch() { document.getElementById('searchOv').classList.remove('active'); document.body.style.overflow = ''; document.getElementById('searchInput').value = ''; document.getElementById('searchResults').innerHTML = ''; }
function performSearch(q) {
  clearTimeout(_st); if (!q || q.length < 2) { document.getElementById('searchResults').innerHTML = ''; return; }
  _st = setTimeout(function () {
    var lq = q.toLowerCase(), r = products.filter(function (p) { return p.name.toLowerCase().indexOf(lq) !== -1 || p.category.indexOf(lq) !== -1 || (p.subCategory && p.subCategory.indexOf(lq) !== -1); });
    var el = document.getElementById('searchResults');
    if (!r.length) el.innerHTML = '<div class="search-no-result"><i class="fas fa-search"></i><br>No results</div>';
    else el.innerHTML = '<div class="search-results-grid">' + r.map(function (p) { return productCard(p); }).join('') + '</div>';
  }, 300);
}

/* ==========================================
   PRODUCT MODAL
   ========================================== */
function openPM(id) {
  var p = products.find(function (x) { return x.id === id; }); if (!p) return;
  pmCurrentProduct = p; pmSelectedColor = (p.colors && p.colors.length) ? p.colors[0] : ''; pmSelectedSize = (p.sizes && p.sizes.length) ? p.sizes[0] : ''; pmQuantity = 1;
  document.getElementById('pmImg').src = p.image;
  document.getElementById('pmName').textContent = p.name;
  var ph = '<span class="cur">' + fmtPrice(p.price) + '</span>'; if (p.oldPrice) ph += '<span class="old">' + fmtPrice(p.oldPrice) + '</span>';
  document.getElementById('pmPrice').innerHTML = ph; document.getElementById('pmQtyVal').textContent = '1';
  var tg = document.getElementById('pmTag');
  if (!p.inStock) { tg.className = 'pm-oos-tag'; tg.textContent = 'Out of Stock'; tg.style.display = ''; }
  else if (p.tag) { tg.className = 'pm-tag'; tg.textContent = p.tag; tg.style.display = ''; }
  else tg.style.display = 'none';
  var ch = ''; (p.colors || []).forEach(function (c) { ch += '<div class="pm-cswatch' + (LIGHT_COLORS.indexOf(c) !== -1 ? ' light-c' : '') + (c === pmSelectedColor ? ' active' : '') + '" style="background:' + c + '" onclick="selectPMColor(this,\'' + c + '\')"></div>'; });
  document.getElementById('pmColors').innerHTML = ch || '<span style="color:var(--lg);font-size:13px">No colors</span>';
  var sh = ''; (p.sizes || []).forEach(function (s) { sh += '<button class="pm-sbtn' + (s === pmSelectedSize ? ' active' : '') + '" onclick="selectPMSize(this,\'' + s + '\')">' + s + '</button>'; });
  document.getElementById('pmSizes').innerHTML = sh || '<span style="color:var(--lg);font-size:13px">No sizes</span>';
  var ab = document.getElementById('pmAddBtn');
  if (!p.inStock) { ab.classList.add('oos'); ab.textContent = 'Out of Stock'; ab.disabled = true; }
  else { ab.classList.remove('oos'); ab.textContent = 'Add to Cart'; ab.disabled = false; }
  document.getElementById('pmOv').classList.add('active'); document.getElementById('pmModal').classList.add('active'); document.body.style.overflow = 'hidden';
}
function closePM() { document.getElementById('pmOv').classList.remove('active'); document.getElementById('pmModal').classList.remove('active'); document.body.style.overflow = ''; }
function selectPMColor(el, c) { document.querySelectorAll('.pm-cswatch').forEach(function (s) { s.classList.remove('active'); }); el.classList.add('active'); pmSelectedColor = c; }
function selectPMSize(el, s) { document.querySelectorAll('.pm-sbtn').forEach(function (b) { b.classList.remove('active'); }); el.classList.add('active'); pmSelectedSize = s; }
function pmQty(d) { pmQuantity = Math.max(1, pmQuantity + d); document.getElementById('pmQtyVal').textContent = pmQuantity; }
function pmAddToCart() { if (!pmCurrentProduct || !pmCurrentProduct.inStock) return; addToCart(pmCurrentProduct, pmSelectedColor, pmSelectedSize, pmQuantity); closePM(); }

/* ==========================================
   CART
   ========================================== */
function addToCart(p, c, s, q) { var k = p.id + '_' + c + '_' + s, e = cart.find(function (x) { return x.key === k; }); if (e) e.qty += q; else cart.push({ key: k, id: p.id, name: p.name, image: p.image, price: p.price, color: c, size: s, qty: q }); updateCartBadge(); renderCart(); showToast('Added to cart'); }
function removeFromCart(k) { cart = cart.filter(function (x) { return x.key !== k; }); updateCartBadge(); renderCart(); }
function updateCartQty(k, d) { var i = cart.find(function (x) { return x.key === k; }); if (!i) return; i.qty = Math.max(1, i.qty + d); updateCartBadge(); renderCart(); }
function updateCartBadge() { document.getElementById('cartBadge').textContent = cart.reduce(function (s, c) { return s + c.qty; }, 0); }
function openCart() { renderCart(); document.getElementById('cartOv').classList.add('active'); document.getElementById('cartSb').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeCart() { document.getElementById('cartOv').classList.remove('active'); document.getElementById('cartSb').classList.remove('active'); document.body.style.overflow = ''; }
function renderCart() {
  var el = document.getElementById('cartItems');
  if (!cart.length) { el.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your bag is empty</p></div>'; document.getElementById('cartTotal').textContent = '৳0'; return; }
  var h = '', t = 0;
  cart.forEach(function (i) {
    t += i.price * i.qty;
    h += '<div class="cart-item"><div class="cart-item-img"><img src="' + i.image + '" onerror="this.src=\'https://via.placeholder.com/80x100/121212/d4a017?text=Img\'"></div><div class="cart-item-info"><h4>' + escHtml(i.name) + '</h4><div class="cart-item-meta">';
    if (i.color) h += '<span class="cart-item-color"><span class="dot" style="background:' + i.color + '"></span>' + i.color + '</span>';
    if (i.size) h += '<span class="cart-item-size">Size: ' + i.size + '</span>';
    h += '</div><div class="cart-item-qty"><button onclick="updateCartQty(\'' + i.key + '\',-1)"><i class="fas fa-minus"></i></button><span>' + i.qty + '</span><button onclick="updateCartQty(\'' + i.key + '\',1)"><i class="fas fa-plus"></i></button></div>';
    h += '<div class="cart-item-price">' + fmtPrice(i.price * i.qty) + '</div></div><button class="cart-item-remove" onclick="removeFromCart(\'' + i.key + '\')"><i class="fas fa-times"></i></button></div>';
  });
  el.innerHTML = h; document.getElementById('cartTotal').textContent = fmtPrice(t);
}

/* ==========================================
   WISHLIST
   ========================================== */
function openWishlist() { renderWishlist(); document.getElementById('wlOv').classList.add('active'); document.getElementById('wlSb').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeWishlist() { document.getElementById('wlOv').classList.remove('active'); document.getElementById('wlSb').classList.remove('active'); document.body.style.overflow = ''; }
function toggleWishlist(id) {
  if (wishlist.has(id)) { wishlist.delete(id); showToast('Removed from wishlist'); } else { wishlist.add(id); showToast('Added to wishlist'); }
  saveWishlist(); updateWlBadge();
  var g = document.querySelector('.page-sec.active .trend-grid, .page-sec.active .cprod-grid');
  if (g) g.querySelectorAll('.p-card').forEach(function (c) {
    var b = c.querySelector('.wl-btn'); if (!b) return;
    var m = (b.getAttribute('onclick') || '').match(/toggleWishlist\((\d+)\)/);
    if (m) { var l = wishlist.has(Number(m[1])); b.classList.toggle('liked', l); b.querySelector('i').className = l ? 'fas fa-heart' : 'far fa-heart'; }
  });
}
function updateWlBadge() { document.getElementById('wlBadge').textContent = wishlist.size; }
function renderWishlist() {
  var el = document.getElementById('wlItems');
  if (!wishlist.size) { el.innerHTML = '<div class="cart-empty"><i class="fas fa-heart"></i><p>Your wishlist is empty</p></div>'; return; }
  var wp = products.filter(function (p) { return wishlist.has(p.id); });
  if (!wp.length) { el.innerHTML = '<div class="cart-empty"><i class="fas fa-heart"></i><p>Products not found</p></div>'; return; }
  var h = '';
  wp.forEach(function (p) {
    h += '<div class="cart-item"><div class="cart-item-img" style="cursor:pointer" onclick="closeWishlist();openPM(' + p.id + ')"><img src="' + p.image + '"></div><div class="cart-item-info"><h4>' + escHtml(p.name) + '</h4><div class="cart-item-price" style="margin-top:4px">' + fmtPrice(p.price) + '</div>';
    h += '<div class="wl-item-actions"><button class="wl-action-btn wl-add-cart" onclick="addToCart(products.find(function(x){return x.id===' + p.id + '}),\'' + (p.colors[0] || '') + '\',\'' + (p.sizes[0] || '') + '\',1);closeWishlist();openCart()">Add to Cart</button>';
    h += '<button class="wl-action-btn wl-remove" onclick="toggleWishlist(' + p.id + ');renderWishlist()">Remove</button></div></div></div>';
  });
  el.innerHTML = h;
}

/* ==========================================
   CHECKOUT
   ========================================== */
function openCheckout() {
  if (!cart.length) { showToast('Cart is empty'); return; } closeCart();
  if (isLoggedIn()) {
    var u = auth.currentUser; document.getElementById('coEmail').value = u.email || '';
    getFirebaseUserProfile(u.uid).then(function (pr) { if (pr) { document.getElementById('coName').value = pr.name || ''; document.getElementById('coPhone').value = pr.phone || ''; } });
  }
  document.getElementById('coOv').classList.add('active'); document.getElementById('coModal').classList.add('active'); document.body.style.overflow = 'hidden';
}
function closeCheckout() { document.getElementById('coOv').classList.remove('active'); document.getElementById('coModal').classList.remove('active'); document.body.style.overflow = ''; }
function toggleTxnField() { document.getElementById('coTxnField').style.display = document.getElementById('coPayMethod').value === 'cod' ? 'none' : 'block'; }

async function submitOrder() {
  var n = document.getElementById('coName').value.trim(), em = document.getElementById('coEmail').value.trim(), ph = document.getElementById('coPhone').value.trim();
  var ad = document.getElementById('coAddress').value.trim(), nt = document.getElementById('coNotes').value.trim();
  var pm = document.getElementById('coPayMethod').value, tx = document.getElementById('coTxnId').value.trim();
  if (!n || !em || !ph || !ad) { showToast('Fill in all required fields'); return; }
  if (pm !== 'cod' && !tx) { showToast('Enter transaction ID'); return; }
  var tot = cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0);
  var config = await loadConfig();
  var oid = 'FG-' + String(config.nextOrderId).padStart(5, '0');
  var now = new Date();
  var od = { id: oid, date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), customer: { name: n, email: em, phone: ph, address: ad, notes: nt }, items: cart.map(function (c) { return { id: c.id, name: c.name, image: c.image, price: c.price, color: c.color, size: c.size, qty: c.qty }; }), total: tot, payMethod: pm, txnId: tx, paid: pm !== 'cod', status: 'pending', createdAt: now.toISOString() };
  try {
    await saveOrderToDB(od); config.nextOrderId++; await saveConfig(config); nextOrderId = config.nextOrderId;
    cart = []; updateCartBadge(); closeCheckout();
    ['coName', 'coEmail', 'coPhone', 'coAddress', 'coNotes', 'coTxnId'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('coPayMethod').value = 'cod'; document.getElementById('coTxnField').style.display = 'none';
    showToast('Order placed! ID: ' + oid);
  } catch (e) { console.error(e); showToast('Error placing order'); }
}

function subscribeNL(e) { e.preventDefault(); var i = e.target.querySelector('input'); if (i.value) { showToast('Subscribed!'); i.value = ''; } return false; }

/* ==========================================
   UTILITIES
   ========================================== */
function fmtPrice(n) { return '৳' + Number(n).toLocaleString('en-BD'); }
var _tt = null;
function showToast(msg) { var el = document.getElementById('toast'); document.getElementById('toastMsg').textContent = msg; el.classList.add('show'); clearTimeout(_tt); _tt = setTimeout(function () { el.classList.remove('show'); }, 3000); }

/* ==========================================
   INIT
   ========================================== */
document.addEventListener('DOMContentLoaded', function () {
  loadWishlist(); updateWlBadge(); updateCartBadge(); initHeroSlider(); initScrollEffects();
  loadProducts().then(function (data) { products = data; renderTrending(); }).catch(function () {
    document.getElementById('trendGrid').innerHTML = '<div class="no-products"><i class="fas fa-exclamation-triangle"></i><br>Could not load products.<br><span style="font-size:12px">Check Firebase Firestore setup.</span></div>';
  });
  if (window.location.hash === '#admin') handleHash(); else window.scrollTo(0, 0);
});
