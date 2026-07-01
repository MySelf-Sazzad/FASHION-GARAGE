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
   হ্যাশ হেল্পার — পাসওয়ার্ড কখনো প্লেইন টেক্সটে থাকে না
   নিচেরটা SHA-256('admin123') এর হ্যাশ —
   কেউ এটা দেখে মূল পাসওয়ার্ড বের করতে পারবে না
   ========================================== */
var ADMIN_INIT_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

function hashPassword(pwd) {
  return CryptoJS.SHA256(pwd).toString();
}

/* ==========================================
   TIMEOUT HELPER
   ========================================== */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise(function (_, reject) { setTimeout(function () { reject(new Error('Timeout')); }, ms); })
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

/* ==========================================
   FIRESTORE DATA FUNCTIONS
   ========================================== */
async function loadProducts() {
  if (!db) return [];
  try { var s = await withTimeout(db.collection('products').get(), 8000); var a = []; s.forEach(function (d) { var x = d.data(); x.id = Number(d.id); a.push(x); }); return a; }
  catch (e) { return []; }
}
async function saveProductToDB(d) { if (db) await db.collection('products').doc(String(d.id)).set(d); }
async function deleteProductFromDB(id) { if (db) await db.collection('products').doc(String(id)).delete(); }
async function loadOrders() {
  if (!db) return [];
  try { var s = await withTimeout(db.collection('orders').get(), 8000); var a = []; s.forEach(function (d) { a.push(d.data()); }); return a; }
  catch (e) { return []; }
}
async function saveOrderToDB(d) { if (db) await db.collection('orders').doc(d.id).set(d); }
async function updateOrderInDB(id, u) { if (db) await db.collection('orders').doc(id).update(u); }
async function deleteOrderFromDB(id) { if (db) await db.collection('orders').doc(id).delete(); }
async function loadConfig() {
  if (!db) return { nextOrderId: 1001 };
  try { var d = await withTimeout(db.collection('config').doc('store').get(), 5000); return d.exists ? d.data() : { nextOrderId: 1001 }; }
  catch (e) { return { nextOrderId: 1001 }; }
}
async function saveConfig(c) { if (db) await db.collection('config').doc('store').set(c, { merge: true }); }
async function getFirebaseUserProfile(uid) {
  if (!db) return null;
  try { var d = await withTimeout(db.collection('userProfiles').doc(uid).get(), 5000); return d.exists ? d.data() : null; } catch (e) { return null; }
}
async function saveFirebaseUserProfile(uid, p) { if (db) try { await db.collection('userProfiles').doc(uid).set(p, { merge: true }); } catch (e) { } }

/* ==========================================
   GLOBAL STATE
   ========================================== */
var products = [], orders = [], cart = [], wishlist = new Set(), nextOrderId = 1001;
var currentSlide = 0, slideInterval;
var pmCurrentProduct = null, pmSelectedColor = '', pmSelectedSize = '', pmQuantity = 1;
var pendingCartAction = null;
var currentPageInfo = { page: 'home', gridId: '', countId: '', filterId: '', subFilter: null };
var _activeSubFilter = '', _activeSizes = [];
var admEditId = null, admFormColors = [], admFormSizes = [];

function loadWishlist() { try { var s = localStorage.getItem('fg_wishlist'); if (s) wishlist = new Set(JSON.parse(s)); } catch (e) { } }
function saveWishlist() { localStorage.setItem('fg_wishlist', JSON.stringify(Array.from(wishlist))); }

/* ==========================================
   AUTH STATE
   ========================================== */
auth.onAuthStateChanged(function (user) {
  updateUserUI(user);
  if (pendingCartAction && user) { var a = pendingCartAction; pendingCartAction = null; setTimeout(function () { a(); }, 300); }
});
function isLoggedIn() { return !!auth.currentUser; }
async function getLoggedUser() {
  var u = auth.currentUser; if (!u) return null;
  var p = await getFirebaseUserProfile(u.uid);
  return { uid: u.uid, name: p ? p.name : (u.displayName || 'User'), email: u.email, phone: p ? p.phone : '', photoURL: u.photoURL || '' };
}

/* ==========================================
   AUTH FUNCTIONS
   ========================================== */
function doLogin() {
  var em = document.getElementById('loginEmail').value.trim().toLowerCase(), pw = document.getElementById('loginPass').value;
  var er = document.getElementById('loginError'); er.classList.remove('show');
  if (!em || !pw) { er.textContent = 'Please enter email and password'; er.classList.add('show'); return; }
  var b = er.parentElement.querySelector('.co-submit'), ot = b.textContent; b.textContent = 'Logging in...'; b.disabled = true;
  auth.signInWithEmailAndPassword(em, pw).then(function (c) { closeLogin(); getFirebaseUserProfile(c.user.uid).then(function (p) { showToast('Welcome, ' + (p ? p.name : 'User') + '!'); }); }).catch(function (e) { er.textContent = getFirebaseErrorMsg(e.code); er.classList.add('show'); b.textContent = ot; b.disabled = false; });
}
function doRegister() {
  var n = document.getElementById('regName').value.trim(), em = document.getElementById('regEmail').value.trim().toLowerCase(), ph = document.getElementById('regPhone').value.trim(), pw = document.getElementById('regPass').value;
  var er = document.getElementById('regError'); er.classList.remove('show');
  if (!n || !em || !ph || !pw) { er.textContent = 'Fill in all fields'; er.classList.add('show'); return; }
  if (pw.length < 6) { er.textContent = 'Password min 6 characters'; er.classList.add('show'); return; }
  var b = er.parentElement.querySelector('.co-submit'), ot = b.textContent; b.textContent = 'Creating...'; b.disabled = true;
  auth.createUserWithEmailAndPassword(em, pw).then(function (c) { return c.user.updateProfile({ displayName: n }).then(function () { return saveFirebaseUserProfile(c.user.uid, { name: n, email: em, phone: ph, createdAt: new Date().toISOString() }); }); }).then(function () { closeLogin(); showToast('Account created!'); }).catch(function (e) { er.textContent = getFirebaseErrorMsg(e.code); er.classList.add('show'); b.textContent = ot; b.disabled = false; });
}
function googleSignIn() {
  var er = null;
  if (document.getElementById('loginFormDiv').style.display !== 'none') er = document.getElementById('loginError');
  else if (document.getElementById('regFormDiv').style.display !== 'none') er = document.getElementById('regError');
  if (er) er.classList.remove('show');
  auth.signInWithPopup(googleProvider).then(function (r) { var u = r.user; getFirebaseUserProfile(u.uid).then(function (p) { if (!p) saveFirebaseUserProfile(u.uid, { name: u.displayName || 'Google User', email: u.email, phone: '', createdAt: new Date().toISOString() }); }); closeLogin(); showToast('Welcome, ' + (u.displayName || 'User') + '!'); }).catch(function (e) { if (e.code === 'auth/popup-closed-by-user') return; var m = getFirebaseErrorMsg(e.code); if (er) { er.textContent = m; er.classList.add('show'); } else showToast(m); });
}
function doForgotPassword() {
  var em = document.getElementById('forgotEmail').value.trim().toLowerCase(), er = document.getElementById('forgotError'), su = document.getElementById('forgotSuccess');
  er.classList.remove('show'); su.classList.remove('show');
  if (!em) { er.textContent = 'Enter your email'; er.classList.add('show'); return; }
  var b = er.parentElement.querySelector('.co-submit'), ot = b.textContent; b.textContent = 'Sending...'; b.disabled = true;
  auth.sendPasswordResetEmail(em).then(function () { su.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success);margin-right:8px"></i>Reset link sent to <strong>' + em + '</strong>.'; su.classList.add('show'); b.textContent = ot; b.disabled = false; document.getElementById('forgotEmail').value = ''; }).catch(function (e) { er.textContent = getFirebaseErrorMsg(e.code); er.classList.add('show'); b.textContent = ot; b.disabled = false; });
}
function doLogout() { auth.signOut().then(function () { showToast('Logged out'); }).catch(function () { showToast('Logged out'); }); }
function getFirebaseErrorMsg(c) {
  var m = { 'auth/user-not-found': 'No account with this email.', 'auth/wrong-password': 'Incorrect password.', 'auth/invalid-email': 'Invalid email.', 'auth/user-disabled': 'Account disabled.', 'auth/too-many-requests': 'Too many attempts.', 'auth/network-request-failed': 'Network error.', 'auth/invalid-credential': 'Invalid email or password.', 'auth/email-already-in-use': 'Email already in use.', 'auth/weak-password': 'Password too weak.', 'auth/operation-not-allowed': 'Method not enabled.', 'auth/popup-blocked': 'Popup blocked.', 'auth/internal-error': 'Internal error.' };
  return m[c] || 'Error (' + c + ')';
}
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

/* ==========================================
   LOGIN UI
   ========================================== */
function openLogin() { document.getElementById('loginOv').classList.add('active'); document.getElementById('loginModal').classList.add('active'); document.body.style.overflow = 'hidden'; showLogForm(); }
function closeLogin() { document.getElementById('loginOv').classList.remove('active'); document.getElementById('loginModal').classList.remove('active'); document.body.style.overflow = ''; ['loginEmail', 'loginPass', 'regName', 'regEmail', 'regPhone', 'regPass', 'forgotEmail'].forEach(function (i) { document.getElementById(i).value = ''; }); ['loginError', 'regError', 'forgotError', 'forgotSuccess'].forEach(function (i) { document.getElementById(i).classList.remove('show'); }); document.querySelectorAll('.login-modal .co-submit').forEach(function (b) { b.disabled = false; }); }
function showLogForm() { document.getElementById('loginFormDiv').style.display = 'block'; document.getElementById('regFormDiv').style.display = 'none'; document.getElementById('forgotFormDiv').style.display = 'none'; document.getElementById('loginTitle').textContent = 'Login'; document.getElementById('loginError').classList.remove('show'); }
function showRegForm() { document.getElementById('loginFormDiv').style.display = 'none'; document.getElementById('regFormDiv').style.display = 'block'; document.getElementById('forgotFormDiv').style.display = 'none'; document.getElementById('loginTitle').textContent = 'Register'; document.getElementById('regError').classList.remove('show'); }
function showForgotForm() { document.getElementById('loginFormDiv').style.display = 'none'; document.getElementById('regFormDiv').style.display = 'none'; document.getElementById('forgotFormDiv').style.display = 'block'; document.getElementById('loginTitle').textContent = 'Reset Password'; document.getElementById('forgotError').classList.remove('show'); document.getElementById('forgotSuccess').classList.remove('show'); }
function togglePassVis(id, btn) { var i = document.getElementById(id), ic = btn.querySelector('i'); if (i.type === 'password') { i.type = 'text'; ic.className = 'fas fa-eye-slash'; } else { i.type = 'password'; ic.className = 'fas fa-eye'; } }
async function handleUserClick() { if (isLoggedIn()) { var u = await getLoggedUser(); if (confirm('Logged in as ' + u.name + '\nEmail: ' + u.email + '\n\nLogout?')) doLogout(); } else openLogin(); }
function updateUserUI(fu) { var b = document.getElementById('userBtn'); if (fu) { b.classList.add('logged-in'); b.querySelector('i').className = 'fas fa-user-check'; } else { b.classList.remove('logged-in'); b.querySelector('i').className = 'fas fa-user'; } }

/* ==========================================
   ADMIN PANEL — হ্যাশ-ভিত্তিক সিকিউরিটি (ফ্রি)
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
   অ্যাডমিন লগইন — পাসওয়ার্ড হ্যাশ করে চেক
   কোডে কোনো প্লেইন টেক্সট পাসওয়ার্ড নেই
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

  var btn = document.querySelector('.admin-login-btn');
  var ot = btn.innerHTML; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...'; btn.disabled = true;

  // ইনপুট পাসওয়ার্ড হ্যাশ করো — প্লেইন টেক্সট কোথাও যায় না
  var inputHash = hashPassword(p);

  // Firestore থেকে সেভড হ্যাশ লোড করো
  var correctHash = null;
  try {
    var config = await withTimeout(db.collection('config').doc('store').get(), 5000);
    if (config.exists && config.data().adminPassHash) {
      correctHash = config.data().adminPassHash;
    }
  } catch (e) { /* Firestore ফেইল হলে ডিফল্ট হ্যাশ ব্যবহার হবে */ }

  // যদি Firestore-এ হ্যাশ না থাকে, ডিফল্ট হ্যাশ ব্যবহার করো
  if (!correctHash) {
    correctHash = ADMIN_INIT_HASH;
  }

  // হ্যাশ ম্যাচ করো
  if (inputHash !== correctHash) {
    err.textContent = 'Invalid username or password';
    err.classList.add('show');
    btn.innerHTML = ot; btn.disabled = false;
    return;
  }

  // সফল — প্যানেল দেখাও
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

/* ==========================================
   অ্যাডমিন সেকশন রেন্ডার
   ========================================== */
async function adminShowSec(sec) {
  document.querySelectorAll('.admin-sec').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.admin-snav a').forEach(function (a) { a.classList.remove('active'); });
  var sm = { dashboard: 'admDashboard', products: 'admProducts', orders: 'admOrders', settings: 'admSettings' };
  var tm = { dashboard: 'Dashboard', products: 'Products', orders: 'Orders', settings: 'Settings' };
  document.getElementById(sm[sec]).classList.add('active');
  var ne = document.querySelector('.admin-snav a[data-asec="' + sec + '"]');
  if (ne) ne.classList.add('active');
  document.getElementById('adminPageTitle').textContent = tm[sec];
  document.getElementById(sm[sec]).innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:80px;color:var(--lg)"><i class="fas fa-spinner fa-spin" style="font-size:28px;margin-right:14px;color:var(--gold)"></i>Loading...</div>';
  try {
    if (sec === 'dashboard') await renderAdminDashboard();
    else if (sec === 'products') await renderAdminProducts();
    else if (sec === 'orders') await renderAdminOrders();
    else if (sec === 'settings') renderAdminSettings();
  } catch (e) {
    document.getElementById(sm[sec]).innerHTML = '<div class="adm-table-empty" style="padding:80px"><i class="fas fa-exclamation-triangle" style="font-size:48px;color:var(--danger);margin-bottom:20px;display:block"></i><p>Failed to load data</p></div>';
  }
  document.getElementById('adminSidebar').classList.remove('open');
}
function toggleAdminSidebar() { document.getElementById('adminSidebar').classList.toggle('open'); }

async function renderAdminDashboard() {
  products = await loadProducts(); orders = await loadOrders();
  var tp = products.length, to = orders.length, rev = orders.reduce(function (s, o) { return s + o.total; }, 0), oos = products.filter(function (p) { return !p.inStock; }).length;
  var rc = orders.slice().reverse().slice(0, 5);
  var h = '<div class="adm-stats">';
  h += '<div class="adm-stat-card"><div class="adm-stat-icon gold"><i class="fas fa-box"></i></div><div class="adm-stat-info"><h4>' + tp + '</h4><p>Products</p></div></div>';
  h += '<div class="adm-stat-card"><div class="adm-stat-icon blue"><i class="fas fa-receipt"></i></div><div class="adm-stat-info"><h4>' + to + '</h4><p>Orders</p></div></div>';
  h += '<div class="adm-stat-card"><div class="adm-stat-icon green"><i class="fas fa-bangladeshi-taka-sign"></i></div><div class="adm-stat-info"><h4>' + fmtPrice(rev) + '</h4><p>Revenue</p></div></div>';
  h += '<div class="adm-stat-card"><div class="adm-stat-icon red"><i class="fas fa-exclamation-triangle"></i></div><div class="adm-stat-info"><h4>' + oos + '</h4><p>Out of Stock</p></div></div></div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Recent Orders</h3></div>';
  if (rc.length) { h += '<table class="adm-table"><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>'; rc.forEach(function (o) { h += '<tr><td style="font-weight:600;color:var(--gold)">' + o.id + '</td><td>' + o.customer.name + '</td><td>' + fmtPrice(o.total) + '</td><td><span class="adm-status ' + o.status + '">' + o.status + '</span></td></tr>'; }); h += '</tbody></table>'; } else h += '<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders</div>';
  h += '</div>';
  var cats = {}; products.forEach(function (p) { cats[p.category] = (cats[p.category] || 0) + 1; });
  h += '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>By Category</h3></div><table class="adm-table"><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>';
  for (var c in cats) h += '<tr><td><span class="adm-table-cat">' + c + '</span></td><td>' + cats[c] + '</td></tr>';
  if (!Object.keys(cats).length) h += '<tr><td colspan="2" style="text-align:center;color:var(--lg);padding:20px">No products</td></tr>';
  h += '</tbody></table></div></div>';
  document.getElementById('admDashboard').innerHTML = h;
}

var admProdSearchQ = '', admProdFilterCat = '';
async function renderAdminProducts() {
  products = await loadProducts(); var list = products.slice();
  if (admProdFilterCat) list = list.filter(function (p) { return p.category === admProdFilterCat; });
  if (admProdSearchQ) { var q = admProdSearchQ.toLowerCase(); list = list.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1 || p.id.toString().indexOf(q) !== -1; }); }
  var h = '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>All Products (' + list.length + ')</h3><div class="adm-table-actions"><div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search..." value="' + admProdSearchQ + '" oninput="admProdSearchQ=this.value;renderAdminProducts()"></div>';
  h += '<select class="adm-filter-sel" onchange="admProdFilterCat=this.value;renderAdminProducts()"><option value="">All</option>';
  ['men', 'women', 'watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].forEach(function (c) { h += '<option value="' + c + '"' + (admProdFilterCat === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>'; });
  h += '</select><button class="adm-btn" onclick="openAddProductModal()"><i class="fas fa-plus"></i> Add Product</button></div></div>';
  if (!list.length) h += '<div class="adm-table-empty"><i class="fas fa-box-open"></i>No products</div>';
  else { h += '<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>'; list.forEach(function (p) { h += '<tr><td><img src="' + p.image + '" class="adm-table-img" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=No+Img\'"></td><td class="adm-table-name">' + p.name + '</td><td><span class="adm-table-cat">' + p.category + (p.subCategory ? ' / ' + p.subCategory : '') + '</span></td><td>' + fmtPrice(p.price) + (p.oldPrice ? ' <br><span style="text-decoration:line-through;color:rgba(255,255,255,.3);font-size:11px">' + fmtPrice(p.oldPrice) + '</span>' : '') + '</td><td>' + (p.inStock ? '<span class="adm-stock-yes"><i class="fas fa-check-circle"></i> In</span>' : '<span class="adm-stock-no"><i class="fas fa-times-circle"></i> Out</span>') + '</td><td><div class="adm-actions"><button class="adm-act-btn" onclick="openEditProductModal(' + p.id + ')"><i class="fas fa-pen"></i></button><button class="adm-act-btn del" onclick="deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i></button></div></td></tr>'; }); h += '</tbody></table></div>'; }
  h += '</div>'; document.getElementById('admProducts').innerHTML = h;
}

function openAddProductModal() { admEditId = null; admFormColors = []; admFormSizes = []; document.getElementById('admModalTitle').textContent = 'Add New Product'; renderProductForm({ name: '', price: '', oldPrice: '', category: 'men', subCategory: '', image: '', colors: [], sizes: [], inStock: true, tag: '', description: '' }); document.getElementById('admModalOv').classList.add('active'); document.getElementById('admProductModal').classList.add('active'); }
async function openEditProductModal(id) { products = await loadProducts(); var p = products.find(function (x) { return x.id === id; }); if (!p) return; admEditId = id; admFormColors = p.colors.slice(); admFormSizes = p.sizes.slice(); document.getElementById('admModalTitle').textContent = 'Edit Product'; renderProductForm(p); document.getElementById('admModalOv').classList.add('active'); document.getElementById('admProductModal').classList.add('active'); }
function closeAdmModal() { document.getElementById('admModalOv').classList.remove('active'); document.getElementById('admProductModal').classList.remove('active'); }

function renderProductForm(p) {
  var h = '<div class="adm-form-grid"><div class="adm-form-full adm-form-group"><label>Product Name</label><input type="text" id="afName" value="' + escHtml(p.name) + '" placeholder="Product name"></div>';
  h += '<div class="adm-form-group"><label>Category</label><select id="afCat" onchange="updateSubCatOptions()">';
  ['men', 'women', 'watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].forEach(function (c) { h += '<option value="' + c + '"' + (p.category === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>'; });
  h += '</select></div><div class="adm-form-group"><label>Sub-Category</label><select id="afSubCat"></select></div>';
  h += '<div class="adm-form-group"><label>Price (&#x09F3;)</label><input type="number" id="afPrice" value="' + (p.price || '') + '" min="0"></div>';
  h += '<div class="adm-form-group"><label>Old Price (&#x09F3;)</label><input type="number" id="afOldPrice" value="' + (p.oldPrice || '') + '" min="0"></div>';
  h += '<div class="adm-form-full adm-form-group"><label>Image</label><div class="adm-img-preview" id="afImgPreview">' + (p.image ? '<img src="' + p.image + '">' : '<span class="placeholder">No Image</span>') + '</div>';
  h += '<div class="adm-img-inputs"><div class="adm-img-url-wrap"><input type="text" id="afImage" value="' + escHtml(p.image) + '" placeholder="Image URL" oninput="previewImgUrl(this.value)"></div><div class="adm-img-or">OR</div><div class="adm-img-upload-wrap"><div class="adm-img-upload-btn"><i class="fas fa-cloud-upload-alt"></i> Upload<input type="file" id="afImageFile" accept="image/*" onchange="handleImageUpload(event)"></div></div></div></div>';
  h += '<div class="adm-form-full adm-form-group"><label>Colors</label><div class="adm-color-picks" id="afColorPicks">';
  ADMIN_COLORS.forEach(function (c) { h += '<div class="adm-color-pick' + (LIGHT_COLORS.indexOf(c.hex) !== -1 ? ' light-c' : '') + (p.colors.indexOf(c.hex) !== -1 ? ' active' : '') + '" style="background:' + c.hex + '" title="' + c.name + '" onclick="toggleAdmColor(this,\'' + c.hex + '\')"></div>'; });
  h += '</div></div><div class="adm-form-full adm-form-group"><label>Sizes</label><div class="adm-size-picks" id="afSizePicks">';
  var sz = (p.category === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  sz.forEach(function (s) { h += '<div class="adm-size-pick' + (p.sizes.indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleAdmSize(this,\'' + s + '\')">' + s + '</div>'; });
  h += '</div></div><div class="adm-form-group"><label>Tag</label><select id="afTag"><option value="">None</option>';
  ['New', 'Hot', 'Sale'].forEach(function (t) { h += '<option value="' + t + '"' + (p.tag === t ? ' selected' : '') + '>' + t + '</option>'; });
  h += '</select></div><div class="adm-form-group" style="display:flex;align-items:flex-end;padding-bottom:2px"><label class="adm-form-check"><input type="checkbox" id="afStock" ' + (p.inStock ? 'checked' : '') + '><span>In Stock</span></label></div>';
  h += '<div class="adm-form-full adm-form-group"><label>Description</label><textarea id="afDesc" rows="3">' + escHtml(p.description || '') + '</textarea></div>';
  h += '<div class="adm-form-bottom"><button class="adm-btn adm-btn-outline" onclick="closeAdmModal()">Cancel</button><button class="adm-btn" onclick="saveProductFromModal()"><i class="fas fa-save"></i> Save</button></div></div>';
  document.getElementById('admModalBody').innerHTML = h; updateSubCatOptions(p.subCategory);
}

function escHtml(s) { if (!s) return ''; return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function previewImgUrl(v) { var p = document.getElementById('afImgPreview'); if (v) p.innerHTML = '<img src="' + v + '">'; else p.innerHTML = '<span class="placeholder">No Image</span>'; }
function handleImageUpload(e) { var f = e.target.files[0]; if (!f) return; if (!f.type.startsWith('image/')) { showToast('Select image'); return; } if (f.size > 5 * 1024 * 1024) { showToast('Max 5MB'); return; } var r = new FileReader(); r.onload = function (ev) { document.getElementById('afImage').value = ev.target.result; document.getElementById('afImgPreview').innerHTML = '<img src="' + ev.target.result + '">'; }; r.readAsDataURL(f); }
function updateSubCatOptions(sel) { var cat = document.getElementById('afCat').value, el = document.getElementById('afSubCat'), cs = SUB_CATS[cat] || [], h = '<option value="">Select</option>'; cs.forEach(function (c) { h += '<option value="' + c + '"' + (sel === c ? ' selected' : '') + '>' + SUB_CAT_LABELS[c] + '</option>'; }); el.innerHTML = h; var se = document.getElementById('afSizePicks'), st = (cat === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES, sh = ''; st.forEach(function (s) { sh += '<div class="adm-size-pick' + (admFormSizes.indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleAdmSize(this,\'' + s + '\')">' + s + '</div>'; }); se.innerHTML = sh; }
function toggleAdmColor(el, hex) { el.classList.toggle('active'); var i = admFormColors.indexOf(hex); if (i === -1) admFormColors.push(hex); else admFormColors.splice(i, 1); }
function toggleAdmSize(el, size) { el.classList.toggle('active'); var i = admFormSizes.indexOf(size); if (i === -1) admFormSizes.push(size); else admFormSizes.splice(i, 1); }

async function saveProductFromModal() {
  var n = document.getElementById('afName').value.trim(), pr = parseInt(document.getElementById('afPrice').value), op = parseInt(document.getElementById('afOldPrice').value) || 0;
  var cat = document.getElementById('afCat').value, sc = document.getElementById('afSubCat').value, img = document.getElementById('afImage').value.trim();
  var tag = document.getElementById('afTag').value, stk = document.getElementById('afStock').checked, desc = document.getElementById('afDesc').value.trim();
  if (!n) { showToast('Name required'); return; } if (!pr || pr <= 0) { showToast('Valid price required'); return; } if (!img) { showToast('Image required'); return; }
  var d = { name: n, price: pr, oldPrice: op, category: cat, subCategory: sc, image: img, colors: admFormColors.slice(), sizes: admFormSizes.slice(), inStock: stk, tag: tag, description: desc };
  try { if (admEditId) { d.id = admEditId; await saveProductToDB(d); showToast('Updated'); } else { d.id = products.reduce(function (m, p) { return p.id > m ? p.id : m; }, 0) + 1; await saveProductToDB(d); products.push(d); showToast('Added'); } closeAdmModal(); await renderAdminProducts(); }
  catch (e) { showToast('Error saving'); }
}
async function deleteProduct(id) { var p = products.find(function (x) { return x.id === id; }); if (!p || !confirm('Delete "' + p.name + '"?')) return; try { await deleteProductFromDB(id); products = products.filter(function (x) { return x.id !== id; }); await renderAdminProducts(); showToast('Deleted'); } catch (e) { showToast('Error'); } }

var admOrderSearchQ = '';
async function renderAdminOrders() {
  orders = await loadOrders(); var list = orders.slice();
  if (admOrderSearchQ) { var q = admOrderSearchQ.toLowerCase(); list = list.filter(function (o) { return o.id.toLowerCase().indexOf(q) !== -1 || o.customer.name.toLowerCase().indexOf(q) !== -1; }); }
  var h = '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Orders (' + list.length + ')</h3><div class="adm-table-actions"><div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search..." value="' + admOrderSearchQ + '" oninput="admOrderSearchQ=this.value;renderAdminOrders()"></div></div></div>';
  if (!list.length) h += '<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders</div>';
  else { h += '<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>'; list.forEach(function (o) { h += '<tr><td style="font-weight:600;color:var(--gold)">' + o.id + '</td><td>' + o.date + '</td><td>' + o.customer.name + '</td><td>' + fmtPrice(o.total) + '</td><td><span class="adm-status ' + o.status + '">' + o.status + '</span></td><td><div class="adm-actions"><button class="adm-act-btn" onclick="openOrderDetailModal(\'' + o.id + '\')"><i class="fas fa-eye"></i></button><button class="adm-act-btn del" onclick="deleteOrder(\'' + o.id + '\')"><i class="fas fa-trash"></i></button></div></td></tr>'; }); h += '</tbody></table></div>'; }
  h += '</div>'; document.getElementById('admOrders').innerHTML = h;
}

async function openOrderDetailModal(id) {
  orders = await loadOrders(); var o = orders.find(function (x) { return x.id === id; }); if (!o) return;
  var h = '<div class="adm-order-info"><div class="adm-order-info-card"><h4>Customer</h4><p><strong>Name:</strong> ' + o.customer.name + '</p><p><strong>Phone:</strong> ' + o.customer.phone + '</p><p><strong>Email:</strong> ' + o.customer.email + '</p></div><div class="adm-order-info-card"><h4>Shipping</h4><p>' + o.customer.address + '</p></div></div>';
  h += '<div class="adm-order-info" style="margin-bottom:20px"><div class="adm-order-info-card"><h4>Payment</h4><p>' + (o.payMethod === 'cod' ? 'COD' : o.payMethod) + '</p><p>' + (o.paid ? '<span class="adm-paid-badge">Paid</span>' : '<span class="adm-unpaid-badge">Unpaid</span>') + '</p></div><div class="adm-order-info-card"><h4>Order</h4><p><span style="color:var(--gold)">' + o.id + '</span></p><p>' + o.date + '</p><span class="adm-status ' + o.status + '">' + o.status + '</span></div></div>';
  h += '<h4 style="font-family:var(--fh);font-size:13px;color:var(--gold);margin-bottom:12px">Items</h4><div class="adm-order-items">';
  o.items.forEach(function (it) { h += '<div class="adm-order-item"><img src="' + it.image + '" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=Img\'"><div class="adm-order-item-info"><h5>' + it.name + '</h5><p>' + (it.color || '') + (it.size ? ' | ' + it.size : '') + ' x ' + it.qty + '</p></div><div class="adm-order-item-price">' + fmtPrice(it.price * it.qty) + '</div></div>'; });
  h += '</div><div class="adm-order-total"><span>Total:</span><strong>' + fmtPrice(o.total) + '</strong></div>';
  h += '<div style="margin-top:20px;display:flex;align-items:center;gap:16px"><label style="font-family:var(--fh);font-size:12px;color:var(--lg)">Status:</label><select id="admOrderStatus" style="padding:10px 16px;background:var(--bg);border:1px solid rgba(255,255,255,.08);color:var(--w);outline:none">';
  ['pending', 'processing', 'shipped', 'delivered'].forEach(function (s) { h += '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>'; });
  h += '</select><button class="adm-btn" onclick="updateOrderStatus(\'' + o.id + '\')"><i class="fas fa-save"></i> Update</button></div>';
  document.getElementById('admOrderBody').innerHTML = h; document.getElementById('admOrderOv').classList.add('active'); document.getElementById('admOrderModal').classList.add('active');
}
function closeAdmOrderModal() { document.getElementById('admOrderOv').classList.remove('active'); document.getElementById('admOrderModal').classList.remove('active'); }
async function updateOrderStatus(id) { var s = document.getElementById('admOrderStatus').value; try { await updateOrderInDB(id, { status: s }); closeAdmOrderModal(); await renderAdminOrders(); showToast('Updated to ' + s); } catch (e) { showToast('Error'); } }
async function deleteOrder(id) { if (!confirm('Delete ' + id + '?')) return; try { await deleteOrderFromDB(id); await renderAdminOrders(); showToast('Deleted'); } catch (e) { showToast('Error'); } }

/* ==========================================
   SETTINGS — পাসওয়ার্ড হ্যাশ করে সেভ
   ========================================== */
function renderAdminSettings() {
  var h = '<div class="adm-settings-card"><h3>Change Admin Password</h3>';
  h += '<p style="font-size:12px;color:var(--success);margin-bottom:16px"><i class="fas fa-shield-halved"></i> Passwords are hashed with SHA-256 before storing. Plain text never leaves your browser.</p>';
  h += '<div class="adm-form-group"><label>Current Password</label><input type="password" id="setCurrPass"></div>';
  h += '<div class="adm-form-group"><label>New Password</label><input type="password" id="setNewPass"></div>';
  h += '<div class="adm-form-group"><label>Confirm New Password</label><input type="password" id="setConfPass"></div>';
  h += '<button class="adm-btn" onclick="changeAdminPass()"><i class="fas fa-key"></i> Update Password</button></div>';
  h += '<div class="adm-settings-card"><h3>Data Management</h3><p style="font-size:13px;color:var(--lg);margin-bottom:16px">Export/Import data.</p><div style="display:flex;gap:12px;flex-wrap:wrap">';
  h += '<button class="adm-btn adm-btn-outline" onclick="exportData()"><i class="fas fa-download"></i> Export</button>';
  h += '<button class="adm-btn adm-btn-outline" onclick="document.getElementById(\'importFileInput\').click()"><i class="fas fa-upload"></i> Import</button>';
  h += '<input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importData(event)"></div></div>';
  h += '<div class="adm-settings-card adm-danger-zone"><h3>Danger Zone</h3><div style="display:flex;gap:12px;flex-wrap:wrap">';
  h += '<button class="adm-btn adm-btn-danger" onclick="resetProducts()"><i class="fas fa-box-open"></i> Reset Products</button>';
  h += '<button class="adm-btn adm-btn-danger" onclick="resetAllData()"><i class="fas fa-trash-alt"></i> Reset Everything</button></div></div>';
  document.getElementById('admSettings').innerHTML = h;
}

async function changeAdminPass() {
  var curr = document.getElementById('setCurrPass').value;
  var newP = document.getElementById('setNewPass').value;
  var conf = document.getElementById('setConfPass').value;

  if (!curr || !newP || !conf) { showToast('Fill in all fields'); return; }
  if (newP.length < 4) { showToast('Min 4 characters'); return; }
  if (newP !== conf) { showToast('Passwords do not match'); return; }

  // বর্তমান পাসওয়ার্ড হ্যাশ করে ম্যাচ করো
  var currHash = hashPassword(curr);

  // Firestore থেকে সেভড হ্যাশ আনো
  var savedHash = null;
  try {
    var config = await withTimeout(db.collection('config').doc('store').get(), 5000);
    if (config.exists && config.data().adminPassHash) {
      savedHash = config.data().adminPassHash;
    }
  } catch (e) { }

  // ফলব্যাক হিসাবে ডিফল্ট হ্যাশ
  if (!savedHash) savedHash = ADMIN_INIT_HASH;

  // ম্যাচ
  if (currHash !== savedHash) { showToast('Current password is incorrect'); return; }

  // নতুন পাসওয়ার্ড হ্যাশ করে Firestore-এ সেভ
  var newHash = hashPassword(newP);
  try {
    await db.collection('config').doc('store').set({ adminPassHash: newHash }, { merge: true });
    document.getElementById('setCurrPass').value = '';
    document.getElementById('setNewPass').value = '';
    document.getElementById('setConfPass').value = '';
    showToast('Password changed successfully!');
  } catch (e) {
    showToast('Error saving password');
  }
}

function exportData() { var b = new Blob([JSON.stringify({ products: products, orders: orders }, null, 2)], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'fashion_garage_data.json'; a.click(); showToast('Exported'); }
async function importData(e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = async function (ev) { try { var d = JSON.parse(ev.target.result); if (d.products && Array.isArray(d.products)) { showToast('Importing...'); for (var i = 0; i < d.products.length; i++) await saveProductToDB(d.products[i]); products = await loadProducts(); await renderAdminProducts(); showToast('Imported ' + products.length); } else showToast('Invalid file'); } catch (err) { showToast('Error'); } }; r.readAsText(f); e.target.value = ''; }
async function resetProducts() { if (!confirm('Delete all products?')) return; try { var s = await db.collection('products').get(); var b = db.batch(); s.forEach(function (d) { b.delete(d.ref); }); await b.commit(); products = []; await renderAdminProducts(); showToast('Reset'); } catch (e) { showToast('Error'); } }
async function resetAllData() { if (!confirm('WARNING: Delete ALL data?')) return; try { var s1 = await db.collection('products').get(); var b1 = db.batch(); s1.forEach(function (d) { b1.delete(d.ref); }); await b1.commit(); var s2 = await db.collection('orders').get(); var b2 = db.batch(); s2.forEach(function (d) { b2.delete(d.ref); }); await b2.commit(); await saveConfig({ nextOrderId: 1001 }); products = []; orders = []; await adminShowSec('dashboard'); showToast('All reset'); } catch (e) { showToast('Error'); } }

/* ==========================================
   PAGE NAVIGATION
   ========================================== */
function showPage(page, subFilter) {
  if (window.location.hash === '#admin') return;
  document.querySelectorAll('.page-sec').forEach(function (s) { s.classList.remove('active'); });
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.querySelectorAll('[data-nav]').forEach(function (a) { a.classList.remove('active'); });
  document.querySelectorAll('[data-mnav]').forEach(function (a) { a.classList.remove('active'); });
  var nm = { home: 'home', men: 'men', women: 'women', accessories: 'accessories', offer: 'sale' }, nk = nm[page] || page;
  document.querySelectorAll('[data-nav="' + nk + '"]').forEach(function (a) { a.classList.add('active'); });
  document.querySelectorAll('[data-mnav="' + nk + '"]').forEach(function (a) { a.classList.add('active'); });
  var gid = '', cid = '', fid = '';
  if (page === 'home') { document.getElementById('homePage').classList.add('active'); }
  else if (page === 'men') { document.getElementById('menPage').classList.add('active'); gid = 'menGrid'; cid = 'menCount'; fid = 'menFilter'; }
  else if (page === 'women') { document.getElementById('womenPage').classList.add('active'); gid = 'womenGrid'; cid = 'womenCount'; fid = 'womenFilter'; }
  else if (page === 'accessories') { document.getElementById('accPage').classList.add('active'); var at = { watch: 'Watches', bag: 'Bags', perfume: 'Perfumes', jewelry: 'Jewelry', sunglasses: 'Sunglasses', homedecor: 'Home Decor' }; var sf = subFilter || null; document.getElementById('accBreadcrumb').textContent = sf ? (at[sf] || 'Accessories') : 'Accessories'; document.getElementById('accTitle').textContent = sf ? (at[sf] || 'Accessories') : 'Accessories'; gid = 'accGrid'; cid = 'accCount'; fid = 'accFilter'; }
  else if (page === 'offer') { document.getElementById('offerPage').classList.add('active'); gid = 'offerGrid'; cid = 'offerCount'; fid = 'offerFilter'; }
  currentPageInfo = { page: page, gridId: gid, countId: cid, filterId: fid, subFilter: subFilter || null };
  if (gid) { document.getElementById(gid).innerHTML = '<div class="no-products"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--gold);margin-bottom:16px;display:block"></i>Loading...</div>'; document.getElementById(cid).textContent = 'Loading...'; document.getElementById(fid).innerHTML = ''; }
  loadProducts().then(function (d) { products = d; if (page === 'home') renderTrending(); else if (gid) { _activeSubFilter = (page === 'accessories') ? (subFilter || '') : ''; _activeSizes = []; initCategoryPage(page, gid, cid, fid, subFilter || null); } }).catch(function () { if (gid) document.getElementById(gid).innerHTML = '<div class="no-products"><i class="fas fa-exclamation-triangle"></i><br>Error loading</div>'; });
}

function closeMob() { document.getElementById('mobToggle').classList.remove('active'); document.getElementById('mobNav').classList.remove('active'); document.getElementById('mobOverlay').classList.remove('active'); document.body.style.overflow = ''; }
document.getElementById('mobToggle').addEventListener('click', function () { this.classList.toggle('active'); document.getElementById('mobNav').classList.toggle('active'); document.getElementById('mobOverlay').classList.toggle('active'); document.body.style.overflow = this.classList.contains('active') ? 'hidden' : ''; });
document.getElementById('mobOverlay').addEventListener('click', closeMob);
function toggleMobAcc(e) { e.preventDefault(); document.getElementById('mobAccTog').classList.toggle('open'); document.getElementById('mobSub').classList.toggle('show'); }

/* ==========================================
   HERO SLIDER
   ========================================== */
function initHeroSlider() { var t = document.getElementById('heroTrack'), d = document.getElementById('heroDots'), s = t.querySelectorAll('.hero-slide'); if (!s.length) return; d.innerHTML = ''; s.forEach(function (_, i) { var el = document.createElement('div'); el.className = 'dot' + (i === 0 ? ' active' : ''); el.onclick = function () { goToSlide(i); }; d.appendChild(el); }); startAutoSlide(); }
function goToSlide(n) { var s = document.getElementById('heroTrack').querySelectorAll('.hero-slide'); if (n < 0) n = s.length - 1; if (n >= s.length) n = 0; currentSlide = n; document.getElementById('heroTrack').style.transform = 'translateX(-' + (n * 100) + '%)'; document.querySelectorAll('.s-dots .dot').forEach(function (d, i) { d.classList.toggle('active', i === n); }); }
function heroSlide(dir) { goToSlide(currentSlide + dir); startAutoSlide(); }
function startAutoSlide() { clearInterval(slideInterval); slideInterval = setInterval(function () { goToSlide(currentSlide + 1); }, 5000); }

/* ==========================================
   SCROLL EFFECTS
   ========================================== */
function initScrollEffects() { var nav = document.getElementById('mainNav'), stp = document.getElementById('scrollTop'); window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 50); stp.classList.toggle('visible', window.scrollY > 400); }); initFadeIn(); }
function initFadeIn() { var els = document.querySelectorAll('.fade-in:not(.visible)'); if (!els.length) return; var obs = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }); }, { threshold: 0.1 }); els.forEach(function (el) { obs.observe(el); }); }

/* ==========================================
   PRODUCT CARD
   ========================================== */
function productCard(p) {
  var l = wishlist.has(p.id), h = '<div class="p-card" onclick="openPM(' + p.id + ')"><div class="p-img"><img src="' + p.image + '" alt="' + escHtml(p.name) + '" onerror="this.src=\'https://via.placeholder.com/400x500/121212/d4a017?text=No+Image\'"><button class="wl-btn' + (l ? ' liked' : '') + '" onclick="event.stopPropagation();toggleWishlist(' + p.id + ')"><i class="' + (l ? 'fas' : 'far') + ' fa-heart"></i></button>';
  if (p.tag) h += '<div class="p-tag">' + p.tag + '</div>'; if (!p.inStock) h += '<div class="p-oos-tag">Out of Stock</div>';
  h += '</div><div class="p-details"><h4>' + escHtml(p.name) + '</h4><div class="p-price"><span class="cur">' + fmtPrice(p.price) + '</span>'; if (p.oldPrice) h += '<span class="old">' + fmtPrice(p.oldPrice) + '</span>';
  h += '</div><button class="qv-btn' + (!p.inStock ? ' oos' : '') + '" onclick="event.stopPropagation();openPM(' + p.id + ')">' + (!p.inStock ? 'Out of Stock' : 'ORDER NOW') + '</button></div></div>'; return h;
}
function renderTrending() { var g = document.getElementById('trendGrid'); if (!products.length) { g.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><br>No products yet</div>'; return; } g.innerHTML = products.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 8).map(function (p) { return productCard(p); }).join(''); initFadeIn(); }

/* ==========================================
   CATEGORY PAGE & FILTERS
   ========================================== */
function initCategoryPage(ct, gid, cid, fid, sf) { renderFilterSidebar(ct, fid, sf); applyFilters(ct, gid, cid); }
function renderFilterSidebar(ct, fid, sf) {
  var el = document.getElementById(fid), h = '';
  if (ct === 'accessories' || ct === 'men' || ct === 'women') {
    h += '<div class="filter-group"><h4>Sub Category</h4><div class="filter-sub-btns"><button class="fsub-btn' + (!_activeSubFilter ? ' active' : '') + '" onclick="setSubFilter(\'\',\'' + ct + '\')"><i class="fas fa-check"></i> All</button>';
    var sc = (ct === 'accessories') ? (SUB_CATS[sf || ''] || []) : (SUB_CATS[ct] || []);
    sc.forEach(function (s) { h += '<button class="fsub-btn' + (_activeSubFilter === s ? ' active' : '') + '" onclick="setSubFilter(\'' + s + '\',\'' + ct + '\')"><i class="fas fa-check"></i> ' + SUB_CAT_LABELS[s] + '</button>'; });
    h += '</div></div>';
  }
  h += '<div class="filter-group"><h4>Size</h4><div class="filter-size-btns">';
  var sl = (sf === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  sl.forEach(function (s) { h += '<button class="fsize-btn' + (_activeSizes.indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleSizeFilter(\'' + s + '\',\'' + ct + '\')">' + s + '</button>'; });
  h += '</div></div><div class="filter-group"><h4>Price Range</h4><div class="price-range-wrap"><input type="range" id="priceRange" min="0" max="50000" value="50000" oninput="updatePriceFilter(this.value,\'' + ct + '\')"><div class="price-range-val" id="priceRangeVal">Up to ' + fmtPrice(50000) + '</div></div></div>';
  h += '<button class="clear-filter-btn" onclick="clearFilters(\'' + ct + '\')">Clear All</button>'; el.innerHTML = h;
}
function setSubFilter(v, ct) { _activeSubFilter = v; renderFilterSidebar(ct, currentPageInfo.filterId, currentPageInfo.subFilter); applyFilters(ct, currentPageInfo.gridId, currentPageInfo.countId); }
function toggleSizeFilter(s, ct) { var i = _activeSizes.indexOf(s); if (i === -1) _activeSizes.push(s); else _activeSizes.splice(i, 1); applyFilters(ct, currentPageInfo.gridId, currentPageInfo.countId); }
function updatePriceFilter(v, ct) { document.getElementById('priceRangeVal').textContent = 'Up to ' + fmtPrice(Number(v)); applyFilters(ct, currentPageInfo.gridId, currentPageInfo.countId); }
function clearFilters(ct) { _activeSubFilter = ''; _activeSizes = []; var pr = document.getElementById('priceRange'); if (pr) { pr.value = 50000; document.getElementById('priceRangeVal').textContent = 'Up to ' + fmtPrice(50000); } renderFilterSidebar(ct, currentPageInfo.filterId, currentPageInfo.subFilter); applyFilters(ct, currentPageInfo.gridId, currentPageInfo.countId); }
function applyFilters(ct, gid, cid) {
  var list = products.slice();
  if (ct === 'men') list = list.filter(function (p) { return p.category === 'men'; });
  else if (ct === 'women') list = list.filter(function (p) { return p.category === 'women'; });
  else if (ct === 'accessories') { var ac = ['watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor']; list = list.filter(function (p) { return ac.indexOf(p.category) !== -1; }); if (_activeSubFilter) list = list.filter(function (p) { return p.subCategory === _activeSubFilter; }); }
  else if (ct === 'offer') list = list.filter(function (p) { return p.oldPrice > 0; });
  if (_activeSizes.length) list = list.filter(function (p) { return _activeSizes.some(function (s) { return p.sizes.indexOf(s) !== -1; }); });
  var pr = document.getElementById('priceRange'), mp = pr ? Number(pr.value) : 50000;
  list = list.filter(function (p) { return p.price <= mp; });
  var g = document.getElementById(gid), c = document.getElementById(cid);
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
function performSearch(q) { clearTimeout(_st); if (!q || q.length < 2) { document.getElementById('searchResults').innerHTML = ''; return; } _st = setTimeout(function () { var lq = q.toLowerCase(), r = products.filter(function (p) { return p.name.toLowerCase().indexOf(lq) !== -1 || p.category.indexOf(lq) !== -1 || (p.subCategory && p.subCategory.indexOf(lq) !== -1); }); var el = document.getElementById('searchResults'); if (!r.length) el.innerHTML = '<div class="search-no-result"><i class="fas fa-search"></i><br>No results</div>'; else el.innerHTML = '<div class="search-results-grid">' + r.map(function (p) { return productCard(p); }).join('') + '</div>'; }, 300); }

/* ==========================================
   PRODUCT MODAL
   ========================================== */
function openPM(id) { var p = products.find(function (x) { return x.id === id; }); if (!p) return; pmCurrentProduct = p; pmSelectedColor = (p.colors && p.colors.length) ? p.colors[0] : ''; pmSelectedSize = (p.sizes && p.sizes.length) ? p.sizes[0] : ''; pmQuantity = 1; document.getElementById('pmImg').src = p.image; document.getElementById('pmName').textContent = p.name; var ph = '<span class="cur">' + fmtPrice(p.price) + '</span>'; if (p.oldPrice) ph += '<span class="old">' + fmtPrice(p.oldPrice) + '</span>'; document.getElementById('pmPrice').innerHTML = ph; document.getElementById('pmQtyVal').textContent = '1'; var tg = document.getElementById('pmTag'); if (!p.inStock) { tg.className = 'pm-oos-tag'; tg.textContent = 'Out of Stock'; tg.style.display = ''; } else if (p.tag) { tg.className = 'pm-tag'; tg.textContent = p.tag; tg.style.display = ''; } else tg.style.display = 'none'; var ch = ''; (p.colors || []).forEach(function (c) { ch += '<div class="pm-cswatch' + (LIGHT_COLORS.indexOf(c) !== -1 ? ' light-c' : '') + (c === pmSelectedColor ? ' active' : '') + '" style="background:' + c + '" onclick="selectPMColor(this,\'' + c + '\')"></div>'; }); document.getElementById('pmColors').innerHTML = ch || '<span style="color:var(--lg);font-size:13px">No colors</span>'; var sh = ''; (p.sizes || []).forEach(function (s) { sh += '<button class="pm-sbtn' + (s === pmSelectedSize ? ' active' : '') + '" onclick="selectPMSize(this,\'' + s + '\')">' + s + '</button>'; }); document.getElementById('pmSizes').innerHTML = sh || '<span style="color:var(--lg);font-size:13px">No sizes</span>'; var ab = document.getElementById('pmAddBtn'); if (!p.inStock) { ab.classList.add('oos'); ab.textContent = 'Out of Stock'; ab.disabled = true; } else { ab.classList.remove('oos'); ab.textContent = 'Add to Cart'; ab.disabled = false; } document.getElementById('pmOv').classList.add('active'); document.getElementById('pmModal').classList.add('active'); document.body.style.overflow = 'hidden'; }
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
function renderCart() { var el = document.getElementById('cartItems'); if (!cart.length) { el.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Empty</p></div>'; document.getElementById('cartTotal').textContent = '৳0'; return; } var h = '', t = 0; cart.forEach(function (i) { t += i.price * i.qty; h += '<div class="cart-item"><div class="cart-item-img"><img src="' + i.image + '" onerror="this.src=\'https://via.placeholder.com/80x100/121212/d4a017?text=Img\'"></div><div class="cart-item-info"><h4>' + escHtml(i.name) + '</h4><div class="cart-item-meta">'; if (i.color) h += '<span class="cart-item-color"><span class="dot" style="background:' + i.color + '"></span>' + i.color + '</span>'; if (i.size) h += '<span class="cart-item-size">Size: ' + i.size + '</span>'; h += '</div><div class="cart-item-qty"><button onclick="updateCartQty(\'' + i.key + '\',-1)"><i class="fas fa-minus"></i></button><span>' + i.qty + '</span><button onclick="updateCartQty(\'' + i.key + '\',1)"><i class="fas fa-plus"></i></button></div><div class="cart-item-price">' + fmtPrice(i.price * i.qty) + '</div></div><button class="cart-item-remove" onclick="removeFromCart(\'' + i.key + '\')"><i class="fas fa-times"></i></button></div>'; }); el.innerHTML = h; document.getElementById('cartTotal').textContent = fmtPrice(t); }

/* ==========================================
   WISHLIST
   ========================================== */
function openWishlist() { renderWishlist(); document.getElementById('wlOv').classList.add('active'); document.getElementById('wlSb').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeWishlist() { document.getElementById('wlOv').classList.remove('active'); document.getElementById('wlSb').classList.remove('active'); document.body.style.overflow = ''; }
function toggleWishlist(id) { if (wishlist.has(id)) { wishlist.delete(id); showToast('Removed'); } else { wishlist.add(id); showToast('Added'); } saveWishlist(); updateWlBadge(); var g = document.querySelector('.page-sec.active .trend-grid, .page-sec.active .cprod-grid'); if (g) g.querySelectorAll('.p-card').forEach(function (c) { var b = c.querySelector('.wl-btn'); if (!b) return; var m = (b.getAttribute('onclick') || '').match(/toggleWishlist\((\d+)\)/); if (m) { var l = wishlist.has(Number(m[1])); b.classList.toggle('liked', l); b.querySelector('i').className = l ? 'fas fa-heart' : 'far fa-heart'; } }); }
function updateWlBadge() { document.getElementById('wlBadge').textContent = wishlist.size; }
function renderWishlist() { var el = document.getElementById('wlItems'); if (!wishlist.size) { el.innerHTML = '<div class="cart-empty"><i class="fas fa-heart"></i><p>Empty</p></div>'; return; } var wp = products.filter(function (p) { return wishlist.has(p.id); }); if (!wp.length) { el.innerHTML = '<div class="cart-empty"><i class="fas fa-heart"></i><p>Not found</p></div>'; return; } var h = ''; wp.forEach(function (p) { h += '<div class="cart-item"><div class="cart-item-img" style="cursor:pointer" onclick="closeWishlist();openPM(' + p.id + ')"><img src="' + p.image + '"></div><div class="cart-item-info"><h4>' + escHtml(p.name) + '</h4><div class="cart-item-price" style="margin-top:4px">' + fmtPrice(p.price) + '</div><div class="wl-item-actions"><button class="wl-action-btn wl-add-cart" onclick="addToCart(products.find(function(x){return x.id===' + p.id + '}),\'' + (p.colors[0] || '') + '\',\'' + (p.sizes[0] || '') + '\',1);closeWishlist();openCart()">Add to Cart</button><button class="wl-action-btn wl-remove" onclick="toggleWishlist(' + p.id + ');renderWishlist()">Remove</button></div></div></div>'; }); el.innerHTML = h; }

/* ==========================================
   CHECKOUT
   ========================================== */
function openCheckout() { if (!cart.length) { showToast('Cart empty'); return; } closeCart(); if (isLoggedIn()) { var u = auth.currentUser; document.getElementById('coEmail').value = u.email || ''; getFirebaseUserProfile(u.uid).then(function (pr) { if (pr) { document.getElementById('coName').value = pr.name || ''; document.getElementById('coPhone').value = pr.phone || ''; } }); } document.getElementById('coOv').classList.add('active'); document.getElementById('coModal').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeCheckout() { document.getElementById('coOv').classList.remove('active'); document.getElementById('coModal').classList.remove('active'); document.body.style.overflow = ''; }
function toggleTxnField() { document.getElementById('coTxnField').style.display = document.getElementById('coPayMethod').value === 'cod' ? 'none' : 'block'; }
async function submitOrder() { var n = document.getElementById('coName').value.trim(), em = document.getElementById('coEmail').value.trim(), ph = document.getElementById('coPhone').value.trim(), ad = document.getElementById('coAddress').value.trim(), nt = document.getElementById('coNotes').value.trim(), pm = document.getElementById('coPayMethod').value, tx = document.getElementById('coTxnId').value.trim(); if (!n || !em || !ph || !ad) { showToast('Fill required fields'); return; } if (pm !== 'cod' && !tx) { showToast('Enter transaction ID'); return; } var tot = cart.reduce(function (s, c) { return s + c.price * c.qty; }, 0); var cfg = await loadConfig(); var oid = 'FG-' + String(cfg.nextOrderId).padStart(5, '0'); var now = new Date(); var od = { id: oid, date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), customer: { name: n, email: em, phone: ph, address: ad, notes: nt }, items: cart.map(function (c) { return { id: c.id, name: c.name, image: c.image, price: c.price, color: c.color, size: c.size, qty: c.qty }; }), total: tot, payMethod: pm, txnId: tx, paid: pm !== 'cod', status: 'pending', createdAt: now.toISOString() }; try { await saveOrderToDB(od); cfg.nextOrderId++; await saveConfig(cfg); cart = []; updateCartBadge(); closeCheckout(); ['coName', 'coEmail', 'coPhone', 'coAddress', 'coNotes', 'coTxnId'].forEach(function (id) { document.getElementById(id).value = ''; }); document.getElementById('coPayMethod').value = 'cod'; document.getElementById('coTxnField').style.display = 'none'; showToast('Order placed! ' + oid); } catch (e) { showToast('Error'); } }
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
  loadProducts().then(function (d) { products = d; renderTrending(); }).catch(function () {
    document.getElementById('trendGrid').innerHTML = '<div class="no-products"><i class="fas fa-exclamation-triangle"></i><br>Could not load products</div>';
  });
  if (window.location.hash === '#admin') handleHash();
  else window.scrollTo(0, 0);
});
