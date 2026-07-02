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
   হ্যাশ হেল্পার
   ========================================== */
var ADMIN_INIT_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

function hashPassword(pwd) {
  return CryptoJS.SHA256(pwd).toString();
}

var BKASH_NUMBER = "01631650688";
var NAGAD_NUMBER = "01631650688";
var DELIVERY_INSIDE_DHAKA = 80;
var DELIVERY_OUTSIDE_DHAKA = 120;

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
  try {
    var s = await withTimeout(db.collection('products').get(), 8000);
    var a = [];
    s.forEach(function (d) { var x = d.data(); x.id = Number(d.id); a.push(x); });
    return a;
  } catch (e) { return []; }
}
async function saveProductToDB(d) { if (db) await db.collection('products').doc(String(d.id)).set(d); }
async function deleteProductFromDB(id) { if (db) await db.collection('products').doc(String(id)).delete(); }
async function loadOrders() {
  if (!db) return [];
  try {
    var s = await withTimeout(db.collection('orders').get(), 8000);
    var a = [];
    s.forEach(function (d) { a.push(d.data()); });
    return a;
  } catch (e) { return []; }
}
async function saveOrderToDB(d) { if (db) await db.collection('orders').doc(d.id).set(d); }
async function updateOrderInDB(id, u) { if (db) await db.collection('orders').doc(id).update(u); }
async function deleteOrderFromDB(id) { if (db) await db.collection('orders').doc(id).delete(); }
async function loadConfig() {
  if (!db) return { nextOrderId: 1001 };
  try {
    var d = await withTimeout(db.collection('config').doc('store').get(), 5000);
    return d.exists ? d.data() : { nextOrderId: 1001 };
  } catch (e) { return { nextOrderId: 1001 }; }
}
async function saveConfig(c) { if (db) await db.collection('config').doc('store').set(c, { merge: true }); }
async function getFirebaseUserProfile(uid) {
  if (!db) return null;
  try {
    var d = await withTimeout(db.collection('userProfiles').doc(uid).get(), 5000);
    return d.exists ? d.data() : null;
  } catch (e) { return null; }
}
async function saveFirebaseUserProfile(uid, p) {
  if (db) try { await db.collection('userProfiles').doc(uid).set(p, { merge: true }); } catch (e) { }
}

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

function loadWishlist() {
  try { var s = localStorage.getItem('fg_wishlist'); if (s) wishlist = new Set(JSON.parse(s)); } catch (e) { }
}
function saveWishlist() {
  localStorage.setItem('fg_wishlist', JSON.stringify(Array.from(wishlist)));
}

/* ==========================================
   FORMAT PRICE
   ========================================== */
function fmtPrice(n) {
  return '\u09F3' + Number(n || 0).toLocaleString('en-IN');
}

/* ==========================================
   TOAST
   ========================================== */
var _toastTimer = null;
function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3000);
}

/* ==========================================
   ESCAPE HTML
   ========================================== */
function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ==========================================
   AUTH STATE
   ========================================== */
auth.onAuthStateChanged(function (user) {
  updateUserUI(user);
  if (pendingCartAction && user) {
    var a = pendingCartAction;
    pendingCartAction = null;
    setTimeout(function () { a(); }, 300);
  }
});

function isLoggedIn() { return !!auth.currentUser; }

async function getLoggedUser() {
  var u = auth.currentUser;
  if (!u) return null;
  var p = await getFirebaseUserProfile(u.uid);
  return {
    uid: u.uid,
    name: p ? p.name : (u.displayName || 'User'),
    email: u.email,
    phone: p ? p.phone : '',
    photoURL: u.photoURL || ''
  };
}

/* ==========================================
   AUTH FUNCTIONS
   ========================================== */
function doLogin() {
  var em = document.getElementById('loginEmail').value.trim().toLowerCase();
  var pw = document.getElementById('loginPass').value;
  var er = document.getElementById('loginError');
  er.classList.remove('show');
  if (!em || !pw) { er.textContent = 'Please enter email and password'; er.classList.add('show'); return; }
  var b = er.parentElement.querySelector('.co-submit');
  var ot = b.textContent;
  b.textContent = 'Logging in...';
  b.disabled = true;
  auth.signInWithEmailAndPassword(em, pw).then(function (c) {
    closeLogin();
    getFirebaseUserProfile(c.user.uid).then(function (p) {
      showToast('Welcome, ' + (p ? p.name : 'User') + '!');
    });
  }).catch(function (e) {
    er.textContent = getFirebaseErrorMsg(e.code);
    er.classList.add('show');
    b.textContent = ot;
    b.disabled = false;
  });
}

function doRegister() {
  var n = document.getElementById('regName').value.trim();
  var em = document.getElementById('regEmail').value.trim().toLowerCase();
  var ph = document.getElementById('regPhone').value.trim();
  var pw = document.getElementById('regPass').value;
  var er = document.getElementById('regError');
  er.classList.remove('show');
  if (!n || !em || !ph || !pw) { er.textContent = 'Fill in all fields'; er.classList.add('show'); return; }
  if (pw.length < 6) { er.textContent = 'Password min 6 characters'; er.classList.add('show'); return; }
  var b = er.parentElement.querySelector('.co-submit');
  var ot = b.textContent;
  b.textContent = 'Creating...';
  b.disabled = true;
  auth.createUserWithEmailAndPassword(em, pw).then(function (c) {
    return c.user.updateProfile({ displayName: n }).then(function () {
      return saveFirebaseUserProfile(c.user.uid, {
        name: n, email: em, phone: ph, createdAt: new Date().toISOString()
      });
    });
  }).then(function () {
    closeLogin();
    showToast('Account created!');
  }).catch(function (e) {
    er.textContent = getFirebaseErrorMsg(e.code);
    er.classList.add('show');
    b.textContent = ot;
    b.disabled = false;
  });
}

function googleSignIn() {
  var er = null;
  if (document.getElementById('loginFormDiv').style.display !== 'none') er = document.getElementById('loginError');
  else if (document.getElementById('regFormDiv').style.display !== 'none') er = document.getElementById('regError');
  if (er) er.classList.remove('show');
  auth.signInWithPopup(googleProvider).then(function (r) {
    var u = r.user;
    getFirebaseUserProfile(u.uid).then(function (p) {
      if (!p) saveFirebaseUserProfile(u.uid, {
        name: u.displayName || 'Google User', email: u.email, phone: '', createdAt: new Date().toISOString()
      });
    });
    closeLogin();
    showToast('Welcome, ' + (u.displayName || 'User') + '!');
  }).catch(function (e) {
    if (e.code === 'auth/popup-closed-by-user') return;
    var m = getFirebaseErrorMsg(e.code);
    if (er) { er.textContent = m; er.classList.add('show'); }
    else showToast(m);
  });
}

function doForgotPassword() {
  var em = document.getElementById('forgotEmail').value.trim().toLowerCase();
  var er = document.getElementById('forgotError');
  var su = document.getElementById('forgotSuccess');
  er.classList.remove('show');
  su.classList.remove('show');
  if (!em) { er.textContent = 'Enter your email'; er.classList.add('show'); return; }
  var b = er.parentElement.querySelector('.co-submit');
  var ot = b.textContent;
  b.textContent = 'Sending...';
  b.disabled = true;
  auth.sendPasswordResetEmail(em).then(function () {
    su.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success);margin-right:8px"></i>Reset link sent to <strong>' + em + '</strong>.';
    su.classList.add('show');
    b.textContent = ot;
    b.disabled = false;
    document.getElementById('forgotEmail').value = '';
  }).catch(function (e) {
    er.textContent = getFirebaseErrorMsg(e.code);
    er.classList.add('show');
    b.textContent = ot;
    b.disabled = false;
  });
}

function doLogout() {
  auth.signOut().then(function () { showToast('Logged out'); }).catch(function () { showToast('Logged out'); });
}

function getFirebaseErrorMsg(c) {
  var m = {
    'auth/user-not-found': 'No account with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email.',
    'auth/user-disabled': 'Account disabled.',
    'auth/too-many-requests': 'Too many attempts.',
    'auth/network-request-failed': 'Network error.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'Email already in use.',
    'auth/weak-password': 'Password too weak.',
    'auth/operation-not-allowed': 'Method not enabled.',
    'auth/popup-blocked': 'Popup blocked.',
    'auth/internal-error': 'Internal error.'
  };
  return m[c] || 'Error (' + c + ')';
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

/* ==========================================
   LOGIN UI
   ========================================== */
function openLogin() {
  document.getElementById('loginOv').classList.add('active');
  document.getElementById('loginModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  showLogForm();
}

function closeLogin() {
  document.getElementById('loginOv').classList.remove('active');
  document.getElementById('loginModal').classList.remove('active');
  var isOtherOpen = document.querySelector('.pm-ov.active, .cart-ov.active, .wl-ov.active, .co-ov.active, .search-ov.active');
  if (!isOtherOpen) document.body.style.overflow = '';
  ['loginEmail', 'loginPass', 'regName', 'regEmail', 'regPhone', 'regPass', 'forgotEmail'].forEach(function (i) {
    var el = document.getElementById(i);
    if (el) el.value = '';
  });
  ['loginError', 'regError', 'forgotError', 'forgotSuccess'].forEach(function (i) {
    var el = document.getElementById(i);
    if (el) el.classList.remove('show');
  });
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
  var su = document.getElementById('forgotSuccess');
  if (su) su.classList.remove('show');
}

function togglePassVis(id, btn) {
  var i = document.getElementById(id);
  var ic = btn.querySelector('i');
  if (i.type === 'password') { i.type = 'text'; ic.className = 'fas fa-eye-slash'; }
  else { i.type = 'password'; ic.className = 'fas fa-eye'; }
}

async function handleUserClick() {
  if (isLoggedIn()) {
    var u = await getLoggedUser();
    if (confirm('Logged in as ' + u.name + '\nEmail: ' + u.email + '\n\nLogout?')) doLogout();
  } else openLogin();
}

function updateUserUI(fu) {
  var b = document.getElementById('userBtn');
  if (!b) return;
  if (fu) { b.classList.add('logged-in'); b.querySelector('i').className = 'fas fa-user-check'; }
  else { b.classList.remove('logged-in'); b.querySelector('i').className = 'fas fa-user'; }
}

/* ==========================================
   PRODUCT CARD
   ========================================== */
function productCard(p) {
  var l = wishlist.has(p.id);
  var h = '<div class="p-card" onclick="openPM(' + p.id + ')"><div class="p-img">';
  h += '<img src="' + p.image + '" alt="' + escHtml(p.name) + '" onerror="this.src=\'https://via.placeholder.com/400x500/121212/d4a017?text=No+Image\'">';
  h += '<button class="wl-btn' + (l ? ' liked' : '') + '" onclick="event.stopPropagation();toggleWishlist(' + p.id + ')"><i class="' + (l ? 'fas' : 'far') + ' fa-heart"></i></button>';
  if (p.tag) h += '<div class="p-tag">' + escHtml(p.tag) + '</div>';
  if (!p.inStock) h += '<div class="p-oos-tag">Out of Stock</div>';
  h += '</div><div class="p-details"><h4>' + escHtml(p.name) + '</h4>';
  h += '<div class="p-price"><span class="cur">' + fmtPrice(p.price) + '</span>';
  if (p.oldPrice) h += '<span class="old">' + fmtPrice(p.oldPrice) + '</span>';
  h += '</div>';
  if (p.inStock) {
    h += '<button class="qv-btn" onclick="event.stopPropagation();openPM(' + p.id + ')">Quick View</button>';
  } else {
    h += '<button class="qv-btn oos" disabled>Out of Stock</button>';
  }
  h += '</div></div>';
  return h;
}

/* ==========================================
   SEARCH
   ========================================== */
function openSearch() {
  document.getElementById('searchOv').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(function () { document.getElementById('searchInput').focus(); }, 100);
}

function closeSearch() {
  document.getElementById('searchOv').classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
}

function performSearch(q) {
  var r = document.getElementById('searchResults');
  if (!q || q.length < 2) { r.innerHTML = ''; return; }
  var ql = q.toLowerCase();
  var found = products.filter(function (p) {
    return p.name.toLowerCase().indexOf(ql) !== -1 ||
      (p.category && p.category.toLowerCase().indexOf(ql) !== -1) ||
      (p.subCategory && p.subCategory.toLowerCase().indexOf(ql) !== -1);
  });
  if (!found.length) {
    r.innerHTML = '<div class="search-no-result"><i class="fas fa-search"></i>No products found for "' + escHtml(q) + '"</div>';
    return;
  }
  var h = '<div class="search-results-grid">';
  found.forEach(function (p) { h += productCard(p); });
  h += '</div>';
  r.innerHTML = h;
}

/* ==========================================
   CART
   ========================================== */
function openCart() {
  renderCart();
  document.getElementById('cartOv').classList.add('active');
  document.getElementById('cartSb').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartOv').classList.remove('active');
  document.getElementById('cartSb').classList.remove('active');
  var isOtherOpen = document.querySelector('.login-ov.active, .co-ov.active, .pm-ov.active, .wl-ov.active, .search-ov.active');
  if (!isOtherOpen) document.body.style.overflow = '';
}

function renderCart() {
  var el = document.getElementById('cartItems');
  if (!cart.length) {
    el.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-bag"></i>Your bag is empty</div>';
    document.getElementById('cartTotal').textContent = fmtPrice(0);
    updateCartBadge();
    return;
  }
  var h = '';
  var total = 0;
  cart.forEach(function (item, i) {
    var st = item.price * item.qty;
    total += st;
    h += '<div class="cart-item">';
    h += '<div class="cart-item-img"><img src="' + item.image + '" onerror="this.src=\'https://via.placeholder.com/80x100/121212/d4a017?text=Img\'"></div>';
    h += '<div class="cart-item-info"><h4>' + escHtml(item.name) + '</h4>';
    h += '<div class="cart-item-meta">';
    if (item.color) h += '<span class="cart-item-color"><span class="dot" style="background:' + item.color + '"></span>' + item.color + '</span>';
    if (item.size) h += '<span class="cart-item-size">' + item.size + '</span>';
    h += '</div>';
    h += '<div class="cart-item-qty"><button onclick="updateCartQty(' + i + ',-1)"><i class="fas fa-minus"></i></button><span>' + item.qty + '</span><button onclick="updateCartQty(' + i + ',1)"><i class="fas fa-plus"></i></button></div>';
    h += '<div class="cart-item-price">' + fmtPrice(st) + '</div></div>';
    h += '<button class="cart-item-remove" onclick="removeFromCart(' + i + ')"><i class="fas fa-times"></i></button>';
    h += '</div>';
  });
  el.innerHTML = h;
  document.getElementById('cartTotal').textContent = fmtPrice(total);
  updateCartBadge();
}

function updateCartBadge() {
  var total = cart.reduce(function (s, i) { return s + i.qty; }, 0);
  var el = document.getElementById('cartBadge');
  if (el) { el.textContent = total; el.style.display = total > 0 ? 'flex' : 'none'; }
}

function addToCart(item) {
  var exist = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].productId === item.productId && cart[i].color === item.color && cart[i].size === item.size) {
      exist = i;
      break;
    }
  }
  if (exist !== null) { cart[exist].qty += item.qty; }
  else { cart.push(item); }
  updateCartBadge();
  showToast('Added to bag');
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  renderCart();
}

function updateCartQty(idx, dir) {
  cart[idx].qty += dir;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
}

/* ==========================================
   WISHLIST
   ========================================== */
function openWishlist() {
  renderWishlist();
  document.getElementById('wlOv').classList.add('active');
  document.getElementById('wlSb').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeWishlist() {
  document.getElementById('wlOv').classList.remove('active');
  document.getElementById('wlSb').classList.remove('active');
  var isOtherOpen = document.querySelector('.login-ov.active, .co-ov.active, .pm-ov.active, .cart-ov.active, .search-ov.active');
  if (!isOtherOpen) document.body.style.overflow = '';
}

function renderWishlist() {
  var el = document.getElementById('wlItems');
  var wlProducts = products.filter(function (p) { return wishlist.has(p.id); });
  if (!wlProducts.length) {
    el.innerHTML = '<div class="cart-empty"><i class="fas fa-heart"></i>Your wishlist is empty</div>';
    updateWlBadge();
    return;
  }
  var h = '';
  wlProducts.forEach(function (p) {
    h += '<div class="cart-item">';
    h += '<div class="cart-item-img" style="cursor:pointer" onclick="closeWishlist();openPM(' + p.id + ')"><img src="' + p.image + '" onerror="this.src=\'https://via.placeholder.com/80x100/121212/d4a017?text=Img\'"></div>';
    h += '<div class="cart-item-info"><h4>' + escHtml(p.name) + '</h4>';
    h += '<div class="p-price" style="justify-content:flex-start;margin-top:6px"><span class="cur">' + fmtPrice(p.price) + '</span>';
    if (p.oldPrice) h += '<span class="old">' + fmtPrice(p.oldPrice) + '</span>';
    h += '</div>';
    if (p.inStock) {
      h += '<div class="wl-item-actions">';
      h += '<button class="wl-action-btn wl-add-cart" onclick="wlQuickAdd(' + p.id + ')">Add to Bag</button>';
      h += '<button class="wl-action-btn wl-remove" onclick="toggleWishlist(' + p.id + ')">Remove</button>';
      h += '</div>';
    } else {
      h += '<div style="margin-top:8px;font-size:12px;color:var(--danger)">Out of Stock</div>';
    }
    h += '</div></div>';
  });
  el.innerHTML = h;
  updateWlBadge();
}

function wlQuickAdd(id) {
  var p = products.find(function (x) { return x.id === id; });
  if (!p) return;
  var color = p.colors && p.colors.length ? p.colors[0] : '';
  var size = p.sizes && p.sizes.length ? p.sizes[0] : '';
  addToCart({
    productId: p.id, name: p.name, price: p.price, image: p.image,
    color: color, size: size, qty: 1
  });
}

function toggleWishlist(id) {
  if (wishlist.has(id)) { wishlist.delete(id); showToast('Removed from wishlist'); }
  else { wishlist.add(id); showToast('Added to wishlist'); }
  saveWishlist();
  updateWlBadge();
  // Re-render current visible grids
  refreshVisibleCards();
}

function updateWlBadge() {
  var el = document.getElementById('wlBadge');
  if (el) { el.textContent = wishlist.size; el.style.display = wishlist.size > 0 ? 'flex' : 'none'; }
}

function refreshVisibleCards() {
  // Refresh trend grid if visible
  var tg = document.getElementById('trendGrid');
  if (tg && tg.closest('.page-sec.active')) renderTrending();
  // Refresh category grids
  var info = currentPageInfo;
  if (info.gridId && info.page !== 'home') {
    var gridEl = document.getElementById(info.gridId);
    if (gridEl && gridEl.closest('.page-sec.active')) {
      renderCategoryProducts(info.page, info.gridId, info.countId, info.subFilter);
    }
  }
}

/* ==========================================
   PRODUCT MODAL
   ========================================== */
function openPM(id) {
  var p = products.find(function (x) { return x.id === id; });
  if (!p) return;
  pmCurrentProduct = p;
  pmSelectedColor = p.colors && p.colors.length ? p.colors[0] : '';
  pmSelectedSize = p.sizes && p.sizes.length ? p.sizes[0] : '';
  pmQuantity = 1;

  document.getElementById('pmImg').src = p.image;
  document.getElementById('pmImg').onerror = function () { this.src = 'https://via.placeholder.com/380x500/121212/d4a017?text=No+Image'; };

  // Tag
  var tagEl = document.getElementById('pmTag');
  if (p.tag) { tagEl.innerHTML = '<span class="pm-tag">' + escHtml(p.tag) + '</span>'; }
  else if (!p.inStock) { tagEl.innerHTML = '<span class="pm-oos-tag">Out of Stock</span>'; }
  else { tagEl.innerHTML = ''; }

  document.getElementById('pmName').textContent = p.name;
  var priceH = '<span class="cur">' + fmtPrice(p.price) + '</span>';
  if (p.oldPrice) priceH += '<span class="old">' + fmtPrice(p.oldPrice) + '</span>';
  document.getElementById('pmPrice').innerHTML = priceH;

  // Colors
  var cH = '';
  if (p.colors && p.colors.length) {
    p.colors.forEach(function (c) {
      var isLight = LIGHT_COLORS.indexOf(c) !== -1;
      cH += '<div class="pm-cswatch' + (isLight ? ' light-c' : '') + (c === pmSelectedColor ? ' active' : '') + '" style="background:' + c + '" onclick="selectPmColor(\'' + c + '\',this)"></div>';
    });
    document.getElementById('pmColors').innerHTML = cH;
    document.getElementById('pmColors').previousElementSibling.style.display = '';
  } else {
    document.getElementById('pmColors').innerHTML = '';
    document.getElementById('pmColors').previousElementSibling.style.display = 'none';
  }

  // Sizes
  var sH = '';
  if (p.sizes && p.sizes.length) {
    p.sizes.forEach(function (s) {
      sH += '<button class="pm-sbtn' + (s === pmSelectedSize ? ' active' : '') + '" onclick="selectPmSize(\'' + s + '\',this)">' + s + '</button>';
    });
    document.getElementById('pmSizes').innerHTML = sH;
    document.getElementById('pmSizes').previousElementSibling.style.display = '';
  } else {
    document.getElementById('pmSizes').innerHTML = '';
    document.getElementById('pmSizes').previousElementSibling.style.display = 'none';
  }

  document.getElementById('pmQtyVal').textContent = '1';

  var addBtn = document.getElementById('pmAddBtn');
  if (p.inStock) {
    addBtn.textContent = 'Add to Cart';
    addBtn.className = 'pm-add';
    addBtn.disabled = false;
  } else {
    addBtn.textContent = 'Out of Stock';
    addBtn.className = 'pm-add oos';
    addBtn.disabled = true;
  }

  document.getElementById('pmOv').classList.add('active');
  document.getElementById('pmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePM() {
  document.getElementById('pmOv').classList.remove('active');
  document.getElementById('pmModal').classList.remove('active');
  var isOtherOpen = document.querySelector('.login-ov.active, .co-ov.active, .cart-ov.active, .wl-ov.active, .search-ov.active');
  if (!isOtherOpen) document.body.style.overflow = '';
  pmCurrentProduct = null;
}

function selectPmColor(c, el) {
  pmSelectedColor = c;
  document.querySelectorAll('.pm-cswatch').forEach(function (s) { s.classList.remove('active'); });
  el.classList.add('active');
}

function selectPmSize(s, el) {
  pmSelectedSize = s;
  document.querySelectorAll('.pm-sbtn').forEach(function (b) { b.classList.remove('active'); });
  el.classList.add('active');
}

function pmQty(dir) {
  pmQuantity += dir;
  if (pmQuantity < 1) pmQuantity = 1;
  if (pmQuantity > 10) pmQuantity = 10;
  document.getElementById('pmQtyVal').textContent = pmQuantity;
}

function pmAddToCart() {
  if (!pmCurrentProduct || !pmCurrentProduct.inStock) return;
  addToCart({
    productId: pmCurrentProduct.id,
    name: pmCurrentProduct.name,
    price: pmCurrentProduct.price,
    image: pmCurrentProduct.image,
    color: pmSelectedColor,
    size: pmSelectedSize,
    qty: pmQuantity
  });
  closePM();
}

/* ==========================================
   CHECKOUT
   ========================================== */
function openCheckout() {
  if (!cart.length) { showToast('Your bag is empty'); return; }
  closeCart();

  // Show the modal FIRST. This guarantees the checkout UI always appears,
  // even if something below (prefill / reset / summary render) throws an
  // error for any reason (missing field, Firebase hiccup, etc).
  document.getElementById('coOv').classList.add('active');
  document.getElementById('coModal').classList.add('active');
  document.body.style.overflow = 'hidden';

  try {
    // Reset fields
    document.getElementById('coAddress').value = '';
    document.getElementById('coNotes').value = '';
    document.getElementById('coPayMethod').value = 'cod';
    document.getElementById('coTxnId').value = '';
    document.getElementById('coTxnField').style.display = 'none';
    document.getElementById('coDeliveryArea').value = 'inside_dhaka';
    updatePayInfo();

    // Pre-fill if logged in, otherwise clear
    if (isLoggedIn()) {
      getLoggedUser().then(function (u) {
        if (u) {
          document.getElementById('coName').value = u.name || '';
          document.getElementById('coEmail').value = u.email || '';
          document.getElementById('coPhone').value = u.phone || '';
        }
      }).catch(function (e) { console.error('Checkout prefill error:', e); });
    } else {
      document.getElementById('coName').value = '';
      document.getElementById('coEmail').value = '';
      document.getElementById('coPhone').value = '';
    }

    // Render order summary
    renderCheckoutSummary();
  } catch (e) {
    console.error('Checkout init error:', e);
  }
}

function closeCheckout() {
  document.getElementById('coOv').classList.remove('active');
  document.getElementById('coModal').classList.remove('active');
  document.body.style.overflow = '';
}

// Shared helper so summary, payment-info box and submitOrder always agree on the numbers
function getCheckoutTotals() {
  var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  var area = document.getElementById('coDeliveryArea');
  var deliveryArea = area ? area.value : 'inside_dhaka';
  var deliveryCharge = deliveryArea === 'inside_dhaka' ? DELIVERY_INSIDE_DHAKA : DELIVERY_OUTSIDE_DHAKA;
  return { subtotal: subtotal, deliveryArea: deliveryArea, deliveryCharge: deliveryCharge, total: subtotal + deliveryCharge };
}

function toggleTxnField() {
  var m = document.getElementById('coPayMethod').value;
  document.getElementById('coTxnField').style.display = (m === 'bkash' || m === 'nagad') ? 'block' : 'none';
  updatePayInfo();
}

// Shows which number (bKash/Nagad) to send money to, and exactly how much
// (subtotal + delivery charge), BEFORE the customer pays and enters the txn ID.
function updatePayInfo() {
  var box = document.getElementById('coPayInfo');
  if (!box) return;
  var m = document.getElementById('coPayMethod').value;
  if (m === 'bkash' || m === 'nagad') {
    var t = getCheckoutTotals();
    var num = m === 'bkash' ? BKASH_NUMBER : NAGAD_NUMBER;
    document.getElementById('coPayMethodName').textContent = m === 'bkash' ? 'bKash' : 'Nagad';
    document.getElementById('coPayNumberDisp').textContent = num;
    document.getElementById('coPayAmount').textContent = fmtPrice(t.total);
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}

function renderCheckoutSummary() {
  var el = document.getElementById('coOrderSummary');
  if (!cart.length) { el.innerHTML = ''; return; }
  var t = getCheckoutTotals();

  var h = '<div class="co-order-summary"><h4>Order Summary</h4>';
  cart.forEach(function (item) {
    h += '<div class="co-summary-item">';
    h += '<img src="' + item.image + '" onerror="this.src=\'https://via.placeholder.com/40x50/121212/d4a017?text=Img\'">';
    h += '<div class="co-summary-item-info"><h5>' + escHtml(item.name) + '</h5>';
    h += '<p>' + (item.color || 'No color') + (item.size ? ' | ' + item.size : '') + ' x ' + item.qty + '</p></div>';
    h += '<div class="co-summary-item-price">' + fmtPrice(item.price * item.qty) + '</div>';
    h += '</div>';
  });
  h += '<div class="co-summary-total"><span>Subtotal: ' + fmtPrice(t.subtotal) + '</span><span>Delivery: ' + fmtPrice(t.deliveryCharge) + '</span></div>';
  h += '<div class="co-summary-total" style="border-top:none;padding-top:4px"><span>Total</span><span>' + fmtPrice(t.total) + '</span></div>';
  h += '</div>';
  el.innerHTML = h;
}

// Update summary + payment info when delivery area changes
document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'coDeliveryArea') {
    renderCheckoutSummary();
    updatePayInfo();
  }
});

async function submitOrder() {
  var name = document.getElementById('coName').value.trim();
  var email = document.getElementById('coEmail').value.trim();
  var phone = document.getElementById('coPhone').value.trim();
  var address = document.getElementById('coAddress').value.trim();
  var notes = document.getElementById('coNotes').value.trim();
  var payMethod = document.getElementById('coPayMethod').value;
  var txnId = document.getElementById('coTxnId').value.trim();
  var deliveryArea = document.getElementById('coDeliveryArea').value;

  if (!name || !email || !phone || !address) {
    showToast('Please fill in all required fields');
    return;
  }
  if ((payMethod === 'bkash' || payMethod === 'nagad') && !txnId) {
    showToast('Please enter transaction ID');
    return;
  }
  if (!cart.length) {
    showToast('Your bag is empty');
    return;
  }

  var t = getCheckoutTotals();
  var subtotal = t.subtotal;
  var deliveryCharge = t.deliveryCharge;
  var total = t.total;

  var btn = document.querySelector('#coModal .co-submit');
  var ot = btn.textContent;
  btn.textContent = 'Placing Order...';
  btn.disabled = true;

  try {
    var config = await loadConfig();
    nextOrderId = config.nextOrderId || 1001;
    var orderId = 'FG-' + nextOrderId;

    var payLabel = payMethod === 'cod' ? 'Cash on Delivery' : (payMethod === 'bkash' ? 'bKash' : 'Nagad');
    var payNumber = payMethod === 'bkash' ? BKASH_NUMBER : (payMethod === 'nagad' ? NAGAD_NUMBER : '');
    var isPaid = payMethod !== 'cod';

    var orderData = {
      id: orderId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dateISO: new Date().toISOString(),
      customer: { name: name, email: email, phone: phone, address: address },
      notes: notes,
      items: cart.map(function (i) {
        return {
          productId: i.productId, name: i.name, price: i.price,
          image: i.image, color: i.color, size: i.size, qty: i.qty
        };
      }),
      subtotal: subtotal,
      deliveryCharge: deliveryCharge,
      deliveryArea: deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka',
      total: total,
      payMethod: payLabel,
      payMethodKey: payMethod,
      payNumber: payNumber,
      txnId: (payMethod !== 'cod') ? txnId : 'N/A',
      paid: isPaid,
      status: 'pending',
      userId: isLoggedIn() ? auth.currentUser.uid : 'guest'
    };

    await saveOrderToDB(orderData);
    await saveConfig({ nextOrderId: nextOrderId + 1 });

    cart = [];
    updateCartBadge();
    closeCheckout();
    showToast('Order placed! ID: ' + orderId);

    // Show confirmation
    setTimeout(function () {
      var msg = 'Order ' + orderId + ' placed successfully!\n\n';
      msg += 'Total: ' + fmtPrice(total) + '\n';
      msg += 'Payment: ' + payLabel + '\n';
      if (payMethod !== 'cod') msg += 'Send to: ' + payNumber + '\n';
      msg += '\nWe will contact you soon.';
      alert(msg);
    }, 500);

  } catch (e) {
    console.error('Order error:', e);
    showToast('Error placing order. Try again.');
  }
  btn.textContent = ot;
  btn.disabled = false;
}

/* ==========================================
   TRENDING (HOME)
   ========================================== */
function renderTrending() {
  var el = document.getElementById('trendGrid');
  if (!el) return;
  var trending = products.filter(function (p) { return p.tag === 'New' || p.tag === 'Hot'; });
  if (!trending.length) trending = products.slice(0, 8);
  if (!trending.length) {
    el.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><br>No products yet</div>';
    return;
  }
  var h = '';
  trending.slice(0, 8).forEach(function (p) { h += productCard(p); });
  el.innerHTML = h;
}

/* ==========================================
   CATEGORY PAGE
   ========================================== */
function initCategoryPage(page, gridId, countId, filterId, subFilter) {
  var filtered = getFilteredProducts(page, subFilter);
  document.getElementById(countId).textContent = filtered.length + ' products found';
  buildFilters(page, filterId, subFilter);
  renderCategoryProducts(page, gridId, countId, subFilter);
}

function getFilteredProducts(page, subFilter) {
  var list = products.slice();
  // Category filter
  if (page === 'men') list = list.filter(function (p) { return p.category === 'men'; });
  else if (page === 'women') list = list.filter(function (p) { return p.category === 'women'; });
  else if (page === 'accessories') {
    var accCats = ['watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'];
    list = list.filter(function (p) { return accCats.indexOf(p.category) !== -1; });
    if (subFilter) list = list.filter(function (p) { return p.category === subFilter; });
  }
  else if (page === 'offer') list = list.filter(function (p) { return p.oldPrice && p.oldPrice > p.price; });

  // Sub-category filter
  if (_activeSubFilter && page !== 'accessories') {
    list = list.filter(function (p) { return p.subCategory === _activeSubFilter; });
  }

  // Size filter
  if (_activeSizes.length) {
    list = list.filter(function (p) {
      return _activeSizes.some(function (s) { return p.sizes && p.sizes.indexOf(s) !== -1; });
    });
  }

  return list;
}

function renderCategoryProducts(page, gridId, countId, subFilter) {
  var grid = document.getElementById(gridId);
  var filtered = getFilteredProducts(page, subFilter);
  document.getElementById(countId).textContent = filtered.length + ' products found';
  if (!filtered.length) {
    grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><br>No products found</div>';
    return;
  }
  var h = '';
  filtered.forEach(function (p) { h += productCard(p); });
  grid.innerHTML = h;
}

function buildFilters(page, filterId, subFilter) {
  var el = document.getElementById(filterId);
  var h = '';

  // Sub-category filter
  var catKey = page;
  if (page === 'accessories' && subFilter) catKey = subFilter;
  var subs = SUB_CATS[catKey];
  if (subs && subs.length) {
    h += '<div class="filter-group"><h4>Sub Category</h4><div class="filter-sub-btns">';
    h += '<button class="fsub-btn' + (!_activeSubFilter ? ' active' : '') + '" onclick="setSubFilter(\'\',\'' + page + '\')"><i class="fas fa-check"></i> All</button>';
    subs.forEach(function (s) {
      h += '<button class="fsub-btn' + (_activeSubFilter === s ? ' active' : '') + '" onclick="setSubFilter(\'' + s + '\',\'' + page + '\')"><i class="fas fa-check"></i> ' + SUB_CAT_LABELS[s] + '</button>';
    });
    h += '</div></div>';
  }

  // Size filter
  var allSizes = (catKey === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  h += '<div class="filter-group"><h4>Size</h4><div class="filter-size-btns">';
  allSizes.forEach(function (s) {
    h += '<button class="fsize-btn' + (_activeSizes.indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleSizeFilter(\'' + s + '\',\'' + page + '\')">' + s + '</button>';
  });
  h += '</div></div>';

  // Clear button
  if (_activeSubFilter || _activeSizes.length) {
    h += '<button class="clear-filter-btn" onclick="clearFilters(\'' + page + '\')"><i class="fas fa-times"></i> Clear Filters</button>';
  }

  el.innerHTML = h;
}

function setSubFilter(val, page) {
  _activeSubFilter = val;
  var info = currentPageInfo;
  if (info.gridId) renderCategoryProducts(page, info.gridId, info.countId, info.subFilter);
  if (info.filterId) buildFilters(page, info.filterId, info.subFilter);
}

function toggleSizeFilter(size, page) {
  var idx = _activeSizes.indexOf(size);
  if (idx === -1) _activeSizes.push(size);
  else _activeSizes.splice(idx, 1);
  var info = currentPageInfo;
  if (info.gridId) renderCategoryProducts(page, info.gridId, info.countId, info.subFilter);
  if (info.filterId) buildFilters(page, info.filterId, info.subFilter);
}

function clearFilters(page) {
  _activeSubFilter = '';
  _activeSizes = [];
  var info = currentPageInfo;
  if (info.gridId) renderCategoryProducts(page, info.gridId, info.countId, info.subFilter);
  if (info.filterId) buildFilters(page, info.filterId, info.subFilter);
}

/* ==========================================
   NEWSLETTER
   ========================================== */
function subscribeNL(e) {
  e.preventDefault();
  var inp = e.target.querySelector('input');
  if (inp && inp.value) {
    showToast('Subscribed successfully!');
    inp.value = '';
  }
  return false;
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

  var nm = { home: 'home', men: 'men', women: 'women', accessories: 'accessories', offer: 'sale' };
  var nk = nm[page] || page;
  document.querySelectorAll('[data-nav="' + nk + '"]').forEach(function (a) { a.classList.add('active'); });
  document.querySelectorAll('[data-mnav="' + nk + '"]').forEach(function (a) { a.classList.add('active'); });

  var gid = '', cid = '', fid = '';

  if (page === 'home') {
    document.getElementById('homePage').classList.add('active');
  } else if (page === 'men') {
    document.getElementById('menPage').classList.add('active');
    gid = 'menGrid'; cid = 'menCount'; fid = 'menFilter';
  } else if (page === 'women') {
    document.getElementById('womenPage').classList.add('active');
    gid = 'womenGrid'; cid = 'womenCount'; fid = 'womenFilter';
  } else if (page === 'accessories') {
    document.getElementById('accPage').classList.add('active');
    var at = { watch: 'Watches', bag: 'Bags', perfume: 'Perfumes', jewelry: 'Jewelry', sunglasses: 'Sunglasses', homedecor: 'Home Decor' };
    var sf = subFilter || null;
    document.getElementById('accBreadcrumb').textContent = sf ? (at[sf] || 'Accessories') : 'Accessories';
    document.getElementById('accTitle').textContent = sf ? (at[sf] || 'Accessories') : 'Accessories';
    gid = 'accGrid'; cid = 'accCount'; fid = 'accFilter';
  } else if (page === 'offer') {
    document.getElementById('offerPage').classList.add('active');
    gid = 'offerGrid'; cid = 'offerCount'; fid = 'offerFilter';
  }

  currentPageInfo = { page: page, gridId: gid, countId: cid, filterId: fid, subFilter: subFilter || null };
  _activeSubFilter = '';
  _activeSizes = [];

  if (gid) {
    document.getElementById(gid).innerHTML = '<div class="no-products"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--gold);margin-bottom:16px;display:block"></i>Loading...</div>';
    document.getElementById(cid).textContent = 'Loading...';
    document.getElementById(fid).innerHTML = '';
  }

  loadProducts().then(function (d) {
    products = d;
    if (page === 'home') renderTrending();
    else if (gid) initCategoryPage(page, gid, cid, fid, subFilter || null);
  }).catch(function () {
    if (gid) document.getElementById(gid).innerHTML = '<div class="no-products"><i class="fas fa-exclamation-triangle"></i><br>Error loading</div>';
  });

  // Re-trigger fade-in for home page
  if (page === 'home') {
    setTimeout(initFadeIn, 100);
  }
}

/* ==========================================
   MOBILE NAV
   ========================================== */
function closeMob() {
  document.getElementById('mobToggle').classList.remove('active');
  document.getElementById('mobNav').classList.remove('active');
  document.getElementById('mobOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('mobToggle').addEventListener('click', function () {
  this.classList.toggle('active');
  document.getElementById('mobNav').classList.toggle('active');
  document.getElementById('mobOverlay').classList.toggle('active');
  document.body.style.overflow = this.classList.contains('active') ? 'hidden' : '';
});

document.getElementById('mobOverlay').addEventListener('click', closeMob);

function toggleMobAcc(e) {
  e.preventDefault();
  document.getElementById('mobAccTog').classList.toggle('open');
  document.getElementById('mobSub').classList.toggle('show');
}

/* ==========================================
   HERO SLIDER
   ========================================== */
function initHeroSlider() {
  var t = document.getElementById('heroTrack');
  var d = document.getElementById('heroDots');
  var s = t.querySelectorAll('.hero-slide');
  if (!s.length) return;
  d.innerHTML = '';
  s.forEach(function (_, i) {
    var el = document.createElement('div');
    el.className = 'dot' + (i === 0 ? ' active' : '');
    el.onclick = function () { goToSlide(i); };
    d.appendChild(el);
  });
  startAutoSlide();
}

function goToSlide(n) {
  var s = document.getElementById('heroTrack').querySelectorAll('.hero-slide');
  if (n < 0) n = s.length - 1;
  if (n >= s.length) n = 0;
  currentSlide = n;
  document.getElementById('heroTrack').style.transform = 'translateX(-' + (n * 100) + '%)';
  document.querySelectorAll('.s-dots .dot').forEach(function (d, i) { d.classList.toggle('active', i === n); });
}

function heroSlide(dir) {
  goToSlide(currentSlide + dir);
  startAutoSlide();
}

function startAutoSlide() {
  clearInterval(slideInterval);
  slideInterval = setInterval(function () { goToSlide(currentSlide + 1); }, 5000);
}

/* ==========================================
   SCROLL EFFECTS
   ========================================== */
function initScrollEffects() {
  var nav = document.getElementById('mainNav');
  var stp = document.getElementById('scrollTop');
  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    stp.classList.toggle('visible', window.scrollY > 400);
  });
  initFadeIn();
}

function initFadeIn() {
  var els = document.querySelectorAll('.fade-in:not(.visible)');
  if (!els.length) return;
  var obs = new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(function (el) { obs.observe(el); });
}

/* ==========================================
   ADMIN PANEL
   ========================================== */
function handleHash() {
  if (window.location.hash === '#admin') showAdminLogin();
  else hideAdmin();
}
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
  window.location.hash = '';
  hideAdmin();
  await refreshStoreData();
  showPage('home');
}

async function refreshStoreData() {
  try { products = await loadProducts(); } catch (e) { products = []; }
  try { orders = await loadOrders(); } catch (e) { orders = []; }
}

async function adminDoLogin() {
  var u = document.getElementById('adminUser').value.trim();
  var p = document.getElementById('adminPass').value;
  var err = document.getElementById('adminLoginError');
  err.classList.remove('show');
  if (!u || !p) { err.textContent = 'Please enter username and password'; err.classList.add('show'); return; }
  var btn = document.querySelector('.admin-login-btn');
  var ot = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
  btn.disabled = true;

  var inputHash = hashPassword(p);
  var correctHash = null;
  try {
    var config = await withTimeout(db.collection('config').doc('store').get(), 5000);
    if (config.exists && config.data().adminPassHash) { correctHash = config.data().adminPassHash; }
  } catch (e) { }
  if (!correctHash) correctHash = ADMIN_INIT_HASH;

  if (inputHash !== correctHash) {
    err.textContent = 'Invalid username or password';
    err.classList.add('show');
    btn.innerHTML = ot;
    btn.disabled = false;
    return;
  }

  document.body.style.overflow = 'auto';
  document.getElementById('adminLoginOv').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'flex';
  document.getElementById('adminUserDisp').textContent = 'Admin';
  adminShowSec('dashboard');
}

async function adminDoLogout() {
  window.location.hash = '';
  hideAdmin();
  await refreshStoreData();
  showPage('home');
  showToast('Admin logged out');
}

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

function toggleAdminSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

/* ==========================================
   ADMIN DASHBOARD
   ========================================== */
async function renderAdminDashboard() {
  products = await loadProducts();
  orders = await loadOrders();
  var tp = products.length;
  var to = orders.length;
  var rev = orders.reduce(function (s, o) { return s + (o.total || 0); }, 0);
  var oos = products.filter(function (p) { return !p.inStock; }).length;
  var rc = orders.slice().reverse().slice(0, 5);

  var h = '<div class="adm-stats">';
  h += '<div class="adm-stat-card"><div class="adm-stat-icon gold"><i class="fas fa-box"></i></div><div class="adm-stat-info"><h4>' + tp + '</h4><p>Products</p></div></div>';
  h += '<div class="adm-stat-card"><div class="adm-stat-icon blue"><i class="fas fa-receipt"></i></div><div class="adm-stat-info"><h4>' + to + '</h4><p>Orders</p></div></div>';
  h += '<div class="adm-stat-card"><div class="adm-stat-icon green"><i class="fas fa-bangladeshi-taka-sign"></i></div><div class="adm-stat-info"><h4>' + fmtPrice(rev) + '</h4><p>Revenue</p></div></div>';
  h += '<div class="adm-stat-card"><div class="adm-stat-icon red"><i class="fas fa-exclamation-triangle"></i></div><div class="adm-stat-info"><h4>' + oos + '</h4><p>Out of Stock</p></div></div></div>';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Recent Orders</h3></div>';
  if (rc.length) {
    h += '<table class="adm-table"><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>';
    rc.forEach(function (o) {
      h += '<tr><td style="font-weight:600;color:var(--gold)">' + o.id + '</td><td>' + escHtml(o.customer.name) + '</td><td>' + fmtPrice(o.total) + '</td><td><span class="adm-status ' + o.status + '">' + o.status + '</span></td></tr>';
    });
    h += '</tbody></table>';
  } else {
    h += '<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders</div>';
  }
  h += '</div>';

  var cats = {};
  products.forEach(function (p) { cats[p.category] = (cats[p.category] || 0) + 1; });
  h += '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>By Category</h3></div><table class="adm-table"><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>';
  for (var c in cats) {
    h += '<tr><td><span class="adm-table-cat">' + c + '</span></td><td>' + cats[c] + '</td></tr>';
  }
  if (!Object.keys(cats).length) {
    h += '<tr><td colspan="2" style="text-align:center;color:var(--lg);padding:20px">No products</td></tr>';
  }
  h += '</tbody></table></div></div>';
  document.getElementById('admDashboard').innerHTML = h;
}

/* ==========================================
   ADMIN PRODUCTS
   ========================================== */
var admProdSearchQ = '', admProdFilterCat = '';

async function renderAdminProducts() {
  products = await loadProducts();
  var list = products.slice();
  if (admProdFilterCat) list = list.filter(function (p) { return p.category === admProdFilterCat; });
  if (admProdSearchQ) {
    var q = admProdSearchQ.toLowerCase();
    list = list.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1 || p.id.toString().indexOf(q) !== -1; });
  }

  var h = '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>All Products (' + list.length + ')</h3><div class="adm-table-actions">';
  h += '<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search..." value="' + escHtml(admProdSearchQ) + '" oninput="admProdSearchQ=this.value;renderAdminProducts()"></div>';
  h += '<select class="adm-filter-sel" onchange="admProdFilterCat=this.value;renderAdminProducts()"><option value="">All</option>';
  ['men', 'women', 'watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].forEach(function (c) {
    h += '<option value="' + c + '"' + (admProdFilterCat === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>';
  });
  h += '</select><button class="adm-btn" onclick="openAddProductModal()"><i class="fas fa-plus"></i> Add Product</button></div></div>';

  if (!list.length) {
    h += '<div class="adm-table-empty"><i class="fas fa-box-open"></i>No products</div>';
  } else {
    h += '<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function (p) {
      h += '<tr>';
      h += '<td><img src="' + p.image + '" class="adm-table-img" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=No+Img\'"></td>';
      h += '<td class="adm-table-name">' + escHtml(p.name) + '</td>';
      h += '<td><span class="adm-table-cat">' + p.category + (p.subCategory ? ' / ' + p.subCategory : '') + '</span></td>';
      h += '<td>' + fmtPrice(p.price) + (p.oldPrice ? ' <br><span style="text-decoration:line-through;color:rgba(255,255,255,.3);font-size:11px">' + fmtPrice(p.oldPrice) + '</span>' : '') + '</td>';
      h += '<td>' + (p.inStock ? '<span class="adm-stock-yes"><i class="fas fa-check-circle"></i> In</span>' : '<span class="adm-stock-no"><i class="fas fa-times-circle"></i> Out</span>') + '</td>';
      h += '<td><div class="adm-actions"><button class="adm-act-btn" onclick="openEditProductModal(' + p.id + ')"><i class="fas fa-pen"></i></button><button class="adm-act-btn del" onclick="deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i></button></div></td>';
      h += '</tr>';
    });
    h += '</tbody></table></div>';
  }
  h += '</div>';
  document.getElementById('admProducts').innerHTML = h;
}

function openAddProductModal() {
  admEditId = null;
  admFormColors = [];
  admFormSizes = [];
  document.getElementById('admModalTitle').textContent = 'Add New Product';
  renderProductForm({ name: '', price: '', oldPrice: '', category: 'men', subCategory: '', image: '', colors: [], sizes: [], inStock: true, tag: '', description: '' });
  document.getElementById('admModalOv').classList.add('active');
  document.getElementById('admProductModal').classList.add('active');
}

async function openEditProductModal(id) {
  products = await loadProducts();
  var p = products.find(function (x) { return x.id === id; });
  if (!p) return;
  admEditId = id;
  admFormColors = p.colors ? p.colors.slice() : [];
  admFormSizes = p.sizes ? p.sizes.slice() : [];
  document.getElementById('admModalTitle').textContent = 'Edit Product';
  renderProductForm(p);
  document.getElementById('admModalOv').classList.add('active');
  document.getElementById('admProductModal').classList.add('active');
}

function closeAdmModal() {
  document.getElementById('admModalOv').classList.remove('active');
  document.getElementById('admProductModal').classList.remove('active');
}

function renderProductForm(p) {
  var h = '<div class="adm-form-grid">';
  h += '<div class="adm-form-full adm-form-group"><label>Product Name</label><input type="text" id="afName" value="' + escHtml(p.name) + '" placeholder="Product name"></div>';

  h += '<div class="adm-form-group"><label>Category</label><select id="afCat" onchange="updateSubCatOptions()">';
  ['men', 'women', 'watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].forEach(function (c) {
    h += '<option value="' + c + '"' + (p.category === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>';
  });
  h += '</select></div>';
  h += '<div class="adm-form-group"><label>Sub-Category</label><select id="afSubCat"></select></div>';

  h += '<div class="adm-form-group"><label>Price (&#x09F3;)</label><input type="number" id="afPrice" value="' + (p.price || '') + '" min="0"></div>';
  h += '<div class="adm-form-group"><label>Old Price (&#x09F3;)</label><input type="number" id="afOldPrice" value="' + (p.oldPrice || '') + '" min="0"></div>';

  h += '<div class="adm-form-full adm-form-group"><label>Image</label>';
  h += '<div class="adm-img-preview" id="afImgPreview">' + (p.image ? '<img src="' + p.image + '">' : '<span class="placeholder">No Image</span>') + '</div>';
  h += '<div class="adm-img-inputs"><div class="adm-img-url-wrap"><input type="text" id="afImage" value="' + escHtml(p.image) + '" placeholder="Image URL" oninput="previewImgUrl(this.value)"></div>';
  h += '<div class="adm-img-or">OR</div>';
  h += '<div class="adm-img-upload-wrap"><div class="adm-img-upload-btn"><i class="fas fa-cloud-upload-alt"></i> Upload<input type="file" id="afImageFile" accept="image/*" onchange="handleImageUpload(event)"></div></div></div></div>';

  h += '<div class="adm-form-full adm-form-group"><label>Colors</label><div class="adm-color-picks" id="afColorPicks">';
  ADMIN_COLORS.forEach(function (c) {
    h += '<div class="adm-color-pick' + (LIGHT_COLORS.indexOf(c.hex) !== -1 ? ' light-c' : '') + ((p.colors || []).indexOf(c.hex) !== -1 ? ' active' : '') + '" style="background:' + c.hex + '" title="' + c.name + '" onclick="toggleAdmColor(this,\'' + c.hex + '\')"></div>';
  });
  h += '</div></div>';

  h += '<div class="adm-form-full adm-form-group"><label>Sizes</label><div class="adm-size-picks" id="afSizePicks">';
  var sz = (p.category === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  sz.forEach(function (s) {
    h += '<div class="adm-size-pick' + ((p.sizes || []).indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleAdmSize(this,\'' + s + '\')">' + s + '</div>';
  });
  h += '</div></div>';

  h += '<div class="adm-form-group"><label>Tag</label><select id="afTag"><option value="">None</option>';
  ['New', 'Hot', 'Sale'].forEach(function (t) {
    h += '<option value="' + t + '"' + (p.tag === t ? ' selected' : '') + '>' + t + '</option>';
  });
  h += '</select></div>';

  h += '<div class="adm-form-group" style="display:flex;align-items:flex-end;padding-bottom:2px"><label class="adm-form-check"><input type="checkbox" id="afStock" ' + (p.inStock ? 'checked' : '') + '><span>In Stock</span></label></div>';

  h += '<div class="adm-form-full adm-form-group"><label>Description</label><textarea id="afDesc" rows="3">' + escHtml(p.description || '') + '</textarea></div>';

  h += '<div class="adm-form-bottom"><button class="adm-btn adm-btn-outline" onclick="closeAdmModal()">Cancel</button><button class="adm-btn" onclick="saveProductFromModal()"><i class="fas fa-save"></i> Save</button></div></div>';
  document.getElementById('admModalBody').innerHTML = h;
  updateSubCatOptions(p.subCategory);
}

function previewImgUrl(v) {
  var p = document.getElementById('afImgPreview');
  if (v) p.innerHTML = '<img src="' + v + '">';
  else p.innerHTML = '<span class="placeholder">No Image</span>';
}

function handleImageUpload(e) {
  var f = e.target.files[0];
  if (!f) return;
  if (!f.type.startsWith('image/')) { showToast('Select image'); return; }
  if (f.size > 5 * 1024 * 1024) { showToast('Max 5MB'); return; }
  var r = new FileReader();
  r.onload = function (ev) {
    document.getElementById('afImage').value = ev.target.result;
    document.getElementById('afImgPreview').innerHTML = '<img src="' + ev.target.result + '">';
  };
  r.readAsDataURL(f);
}

function updateSubCatOptions(sel) {
  var cat = document.getElementById('afCat').value;
  var el = document.getElementById('afSubCat');
  var cs = SUB_CATS[cat] || [];
  var h = '<option value="">Select</option>';
  cs.forEach(function (c) {
    h += '<option value="' + c + '"' + (sel === c ? ' selected' : '') + '>' + SUB_CAT_LABELS[c] + '</option>';
  });
  el.innerHTML = h;

  var se = document.getElementById('afSizePicks');
  var st = (cat === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  var sh = '';
  st.forEach(function (s) {
    sh += '<div class="adm-size-pick' + (admFormSizes.indexOf(s) !== -1 ? ' active' : '') + '" onclick="toggleAdmSize(this,\'' + s + '\')">' + s + '</div>';
  });
  se.innerHTML = sh;
}

function toggleAdmColor(el, hex) {
  el.classList.toggle('active');
  var i = admFormColors.indexOf(hex);
  if (i === -1) admFormColors.push(hex);
  else admFormColors.splice(i, 1);
}

function toggleAdmSize(el, size) {
  el.classList.toggle('active');
  var i = admFormSizes.indexOf(size);
  if (i === -1) admFormSizes.push(size);
  else admFormSizes.splice(i, 1);
}

async function saveProductFromModal() {
  var n = document.getElementById('afName').value.trim();
  var pr = parseInt(document.getElementById('afPrice').value);
  var op = parseInt(document.getElementById('afOldPrice').value) || 0;
  var cat = document.getElementById('afCat').value;
  var sc = document.getElementById('afSubCat').value;
  var img = document.getElementById('afImage').value.trim();
  var tag = document.getElementById('afTag').value;
  var stk = document.getElementById('afStock').checked;
  var desc = document.getElementById('afDesc').value.trim();

  if (!n) { showToast('Name required'); return; }
  if (!pr || pr <= 0) { showToast('Valid price required'); return; }
  if (!img) { showToast('Image required'); return; }

  var d = {
    name: n, price: pr, oldPrice: op, category: cat, subCategory: sc,
    image: img, colors: admFormColors.slice(), sizes: admFormSizes.slice(),
    inStock: stk, tag: tag, description: desc
  };

  try {
    if (admEditId) {
      d.id = admEditId;
      await saveProductToDB(d);
      showToast('Updated');
    } else {
      d.id = products.reduce(function (m, p) { return p.id > m ? p.id : m; }, 0) + 1;
      await saveProductToDB(d);
      products.push(d);
      showToast('Added');
    }
    closeAdmModal();
    await renderAdminProducts();
  } catch (e) {
    console.error(e);
    showToast('Error saving');
  }
}

async function deleteProduct(id) {
  var p = products.find(function (x) { return x.id === id; });
  if (!p || !confirm('Delete "' + p.name + '"?')) return;
  try {
    await deleteProductFromDB(id);
    products = products.filter(function (x) { return x.id !== id; });
    await renderAdminProducts();
    showToast('Deleted');
  } catch (e) { showToast('Error'); }
}

/* ==========================================
   ADMIN ORDERS
   ========================================== */
var admOrderSearchQ = '';

async function renderAdminOrders() {
  orders = await loadOrders();
  var list = orders.slice();
  if (admOrderSearchQ) {
    var q = admOrderSearchQ.toLowerCase();
    list = list.filter(function (o) {
      return o.id.toLowerCase().indexOf(q) !== -1 || o.customer.name.toLowerCase().indexOf(q) !== -1;
    });
  }

  var h = '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Orders (' + list.length + ')</h3><div class="adm-table-actions">';
  h += '<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search..." value="' + escHtml(admOrderSearchQ) + '" oninput="admOrderSearchQ=this.value;renderAdminOrders()"></div></div></div>';

  if (!list.length) {
    h += '<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders</div>';
  } else {
    h += '<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function (o) {
      h += '<tr>';
      h += '<td style="font-weight:600;color:var(--gold)">' + o.id + '</td>';
      h += '<td>' + (o.date || '') + '</td>';
      h += '<td>' + escHtml(o.customer.name) + '</td>';
      h += '<td>' + fmtPrice(o.total) + '</td>';
      h += '<td><span class="adm-status ' + o.status + '">' + o.status + '</span></td>';
      h += '<td><div class="adm-actions"><button class="adm-act-btn" onclick="openOrderDetailModal(\'' + o.id + '\')"><i class="fas fa-eye"></i></button><button class="adm-act-btn del" onclick="deleteOrder(\'' + o.id + '\')"><i class="fas fa-trash"></i></button></div></td>';
      h += '</tr>';
    });
    h += '</tbody></table></div>';
  }
  h += '</div>';
  document.getElementById('admOrders').innerHTML = h;
}

async function openOrderDetailModal(id) {
  orders = await loadOrders();
  var o = orders.find(function (x) { return x.id === id; });
  if (!o) return;

  var h = '<div class="adm-order-info"><div class="adm-order-info-card"><h4>Customer</h4>';
  h += '<p><strong>Name:</strong> ' + escHtml(o.customer.name) + '</p>';
  h += '<p><strong>Phone:</strong> ' + escHtml(o.customer.phone) + '</p>';
  h += '<p><strong>Email:</strong> ' + escHtml(o.customer.email) + '</p></div>';
  h += '<div class="adm-order-info-card"><h4>Shipping</h4>';
  h += '<p>' + escHtml(o.customer.address) + '</p>';
  if (o.deliveryArea) h += '<p style="margin-top:8px"><strong>Area:</strong> ' + escHtml(o.deliveryArea) + '</p>';
  h += '</div></div>';

  h += '<div class="adm-order-info" style="margin-bottom:20px"><div class="adm-order-info-card"><h4>Payment</h4>';
  h += '<p>' + (o.payMethod || '') + '</p>';
  h += '<p>' + (o.paid ? '<span class="adm-paid-badge">Paid</span>' : '<span class="adm-unpaid-badge">Unpaid</span>') + '</p>';
  if (o.txnId && o.txnId !== 'N/A') {
    h += '<p style="margin-top:8px"><strong>Transaction ID:</strong> <span style="color:var(--gold)">' + escHtml(o.txnId) + '</span></p>';
  }
  h += '</div><div class="adm-order-info-card"><h4>Order</h4>';
  h += '<p><span style="color:var(--gold)">' + o.id + '</span></p>';
  h += '<p>' + (o.date || '') + '</p>';
  h += '<span class="adm-status ' + o.status + '">' + o.status + '</span></div></div>';

  h += '<h4 style="font-family:var(--fh);font-size:13px;color:var(--gold);margin-bottom:12px">Items</h4>';
  h += '<div class="adm-order-items">';
  (o.items || []).forEach(function (it) {
    h += '<div class="adm-order-item">';
    h += '<img src="' + it.image + '" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=Img\'">';
    h += '<div class="adm-order-item-info"><h5>' + escHtml(it.name) + '</h5>';
    h += '<p>' + (it.color || '') + (it.size ? ' | ' + it.size : '') + ' x ' + it.qty + '</p></div>';
    h += '<div class="adm-order-item-price">' + fmtPrice(it.price * it.qty) + '</div></div>';
  });
  h += '</div>';

  h += '<div class="adm-order-total">';
  if (o.subtotal !== undefined) {
    h += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;color:var(--lg)"><span>Subtotal</span><span>' + fmtPrice(o.subtotal) + '</span></div>';
  }
  if (o.deliveryCharge) {
    h += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;color:var(--lg)"><span>Delivery (' + (o.deliveryArea || '') + ')</span><span>' + fmtPrice(o.deliveryCharge) + '</span></div>';
  }
  h += '<div style="display:flex;justify-content:space-between"><span>Total:</span><strong>' + fmtPrice(o.total) + '</strong></div></div>';

  h += '<div style="margin-top:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">';
  h += '<label style="font-family:var(--fh);font-size:12px;color:var(--lg)">Status:</label>';
  h += '<select id="admOrderStatus" style="padding:10px 16px;background:var(--bg);border:1px solid rgba(255,255,255,.08);color:var(--w);outline:none">';
  ['pending', 'processing', 'shipped', 'delivered'].forEach(function (s) {
    h += '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>';
  });
  h += '</select>';
  h += '<button class="adm-btn" onclick="updateOrderStatus(\'' + o.id + '\')"><i class="fas fa-save"></i> Update</button></div>';

  document.getElementById('admOrderBody').innerHTML = h;
  document.getElementById('admOrderOv').classList.add('active');
  document.getElementById('admOrderModal').classList.add('active');
}

function closeAdmOrderModal() {
  document.getElementById('admOrderOv').classList.remove('active');
  document.getElementById('admOrderModal').classList.remove('active');
}

async function updateOrderStatus(id) {
  var s = document.getElementById('admOrderStatus').value;
  try {
    await updateOrderInDB(id, { status: s });
    closeAdmOrderModal();
    await renderAdminOrders();
    showToast('Updated to ' + s);
  } catch (e) { showToast('Error'); }
}

async function deleteOrder(id) {
  if (!confirm('Delete ' + id + '?')) return;
  try {
    await deleteOrderFromDB(id);
    await renderAdminOrders();
    showToast('Deleted');
  } catch (e) { showToast('Error'); }
}

/* ==========================================
   ADMIN SETTINGS
   ========================================== */
function renderAdminSettings() {
  var h = '<div class="adm-settings-card"><h3>Change Admin Password</h3>';
  h += '<p style="font-size:12px;color:var(--success);margin-bottom:16px"><i class="fas fa-shield-halved"></i> Passwords are hashed with SHA-256 before storing.</p>';
  h += '<div class="adm-form-group"><label>Current Password</label><input type="password" id="setCurrPass"></div>';
  h += '<div class="adm-form-group"><label>New Password</label><input type="password" id="setNewPass"></div>';
  h += '<div class="adm-form-group"><label>Confirm New Password</label><input type="password" id="setConfPass"></div>';
  h += '<button class="adm-btn" onclick="changeAdminPass()"><i class="fas fa-key"></i> Update Password</button></div>';

  h += '<div class="adm-settings-card"><h3>Data Management</h3>';
  h += '<p style="font-size:13px;color:var(--lg);margin-bottom:16px">Export/Import data.</p>';
  h += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  h += '<button class="adm-btn adm-btn-outline" onclick="exportData()"><i class="fas fa-download"></i> Export</button>';
  h += '<button class="adm-btn adm-btn-outline" onclick="document.getElementById(\'importFileInput\').click()"><i class="fas fa-upload"></i> Import</button>';
  h += '<input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importData(event)"></div></div>';

  h += '<div class="adm-settings-card adm-danger-zone"><h3>Danger Zone</h3>';
  h += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
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

  var currHash = hashPassword(curr);
  var savedHash = null;
  try {
    var config = await withTimeout(db.collection('config').doc('store').get(), 5000);
    if (config.exists && config.data().adminPassHash) { savedHash = config.data().adminPassHash; }
  } catch (e) { }
  if (!savedHash) savedHash = ADMIN_INIT_HASH;
  if (currHash !== savedHash) { showToast('Current password is incorrect'); return; }

  var newHash = hashPassword(newP);
  try {
    await db.collection('config').doc('store').set({ adminPassHash: newHash }, { merge: true });
    document.getElementById('setCurrPass').value = '';
    document.getElementById('setNewPass').value = '';
    document.getElementById('setConfPass').value = '';
    showToast('Password changed successfully!');
  } catch (e) { showToast('Error saving password'); }
}

function exportData() {
  var b = new Blob([JSON.stringify({ products: products, orders: orders }, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'fashion_garage_data.json';
  a.click();
  showToast('Exported');
}

async function importData(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = async function (ev) {
    try {
      var d = JSON.parse(ev.target.result);
      if (d.products && Array.isArray(d.products)) {
        showToast('Importing...');
        for (var i = 0; i < d.products.length; i++) await saveProductToDB(d.products[i]);
        products = await loadProducts();
        await renderAdminProducts();
        showToast('Imported ' + products.length + ' products');
      } else { showToast('Invalid file'); }
    } catch (err) { console.error(err); showToast('Error importing'); }
  };
  r.readAsText(f);
  e.target.value = '';
}

async function resetProducts() {
  if (!confirm('Delete all products?')) return;
  try {
    var s = await db.collection('products').get();
    var b = db.batch();
    s.forEach(function (d) { b.delete(d.ref); });
    await b.commit();
    products = [];
    await renderAdminProducts();
    showToast('Reset');
  } catch (e) { showToast('Error'); }
}

async function resetAllData() {
  if (!confirm('WARNING: Delete ALL data?')) return;
  try {
    var s1 = await db.collection('products').get();
    var b1 = db.batch();
    s1.forEach(function (d) { b1.delete(d.ref); });
    await b1.commit();
    var s2 = await db.collection('orders').get();
    var b2 = db.batch();
    s2.forEach(function (d) { b2.delete(d.ref); });
    await b2.commit();
    await saveConfig({ nextOrderId: 1001 });
    products = [];
    orders = [];
    await adminShowSec('dashboard');
    showToast('All reset');
  } catch (e) { showToast('Error'); }
}

/* ==========================================
   KEYBOARD SHORTCUTS
   ========================================== */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (document.querySelector('.search-ov.active')) closeSearch();
    else if (document.querySelector('.pm-ov.active')) closePM();
    else if (document.querySelector('.co-ov.active')) closeCheckout();
    else if (document.querySelector('.login-ov.active')) closeLogin();
    else if (document.querySelector('.wl-ov.active')) closeWishlist();
    else if (document.querySelector('.cart-ov.active')) closeCart();
    else if (document.querySelector('.admin-modal-ov.active')) closeAdmModal();
    else if (document.querySelector('#admOrderOv.active')) closeAdmOrderModal();
  }
});

/* ==========================================
   INIT
   ========================================== */
(async function init() {
  loadWishlist();
  updateCartBadge();
  updateWlBadge();
  handleHash();
  initHeroSlider();
  initScrollEffects();

  try {
    products = await loadProducts();
    renderTrending();
  } catch (e) {
    console.error('Init load error:', e);
    document.getElementById('trendGrid').innerHTML = '<div class="no-products"><i class="fas fa-exclamation-triangle"></i><br>Could not load products</div>';
  }
})();
