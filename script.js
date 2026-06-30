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
var db = firebase.firestore();
var googleProvider = new firebase.auth.GoogleAuthProvider();

/* ==========================================
   CONSTANTS
   ========================================== */
var ADMIN_COLORS = [
  {hex:'#000000',name:'Black',light:false},{hex:'#ffffff',name:'White',light:true},
  {hex:'#1a237e',name:'Navy',light:false},{hex:'#5d4037',name:'Brown',light:false},
  {hex:'#757575',name:'Gray',light:false},{hex:'#d4c5a9',name:'Beige',light:true},
  {hex:'#c62828',name:'Red',light:false},{hex:'#1565c0',name:'Blue',light:false},
  {hex:'#2e7d32',name:'Green',light:false},{hex:'#d4a017',name:'Gold',light:false},
  {hex:'#e91e63',name:'Pink',light:false},{hex:'#556b2f',name:'Olive',light:false},
  {hex:'#800000',name:'Maroon',light:false},{hex:'#008080',name:'Teal',light:false},
  {hex:'#722F37',name:'Burgundy',light:false},{hex:'#FF7F50',name:'Coral',light:false},
  {hex:'#D2B48C',name:'Tan',light:false},{hex:'#36454F',name:'Charcoal',light:false},
  {hex:'#8E4585',name:'Plum',light:false},{hex:'#F5F5DC',name:'Cream',light:true},
  {hex:'#E6E6FA',name:'Lavender',light:true},{hex:'#FFD700',name:'Yellow',light:false},
  {hex:'#4A0E0E',name:'Dark Red',light:false},{hex:'#2F4F4F',name:'Dark Slate',light:false}
];
var ADMIN_SIZES = ['XS','S','M','L','XL','XXL','One Size'];
var PERFUME_SIZES = ['30ml','50ml','100ml'];
var SUB_CATS = {
  men:['jacket','shirt','trousers','sweater','polo'],
  women:['dress','top','skirt','coat','blouse'],
  watch:['chronograph','minimalist','diver','smart'],
  bag:['tote','crossbody','backpack','clutch'],
  perfume:['oud','floral','citrus','musk'],
  jewelry:['necklace','earrings','bracelet','ring'],
  sunglasses:['aviator','wayfarer','round','sport'],
  homedecor:['vase','candle','frame','sculpture']
};
var SUB_CAT_LABELS = {
  jacket:'Jacket',shirt:'Shirt',trousers:'Trousers',sweater:'Sweater',polo:'Polo',
  dress:'Dress',top:'Top',skirt:'Skirt',coat:'Coat',blouse:'Blouse',
  chronograph:'Chronograph',minimalist:'Minimalist',diver:'Diver',smart:'Smart Watch',
  tote:'Tote',crossbody:'Crossbody',backpack:'Backpack',clutch:'Clutch',
  oud:'Oud',floral:'Floral',citrus:'Citrus',musk:'Musk',
  necklace:'Necklace',earrings:'Earrings',bracelet:'Bracelet',ring:'Ring',
  aviator:'Aviator',wayfarer:'Wayfarer',round:'Round',sport:'Sport',
  vase:'Vase',candle:'Candle',frame:'Frame',sculpture:'Sculpture'
};
var LIGHT_COLORS = ['#ffffff','#d4c5a9','#f5e6cc','#e8d5b7','#f0e68c','#F5F5DC','#E6E6FA','#FFD700'];
var ADMIN_DEFAULT_USER = 'admin';
var ADMIN_DEFAULT_PASS = 'admin123';

/* ==========================================
   GLOBAL STATE
   ========================================== */
var products = [];
var orders = [];
var cart = [];
var wishlist = new Set();
var currentSlide = 0;
var slideInterval;
var pmCurrentProduct = null;
var pmSelectedColor = '';
var pmSelectedSize = '';
var pmQuantity = 1;
var pendingCartAction = null;
var currentPageInfo = {page:'home',gridId:'',countId:'',filterId:'',subFilter:null};
var _activeSubFilter = '';
var _activeSizes = [];
var _activePriceRange = [0, 999999];
var _activeSort = 'newest';
var admEditId = null;
var admFormColors = [];
var admFormSizes = [];
var admProdSearchQ = '';
var admProdFilterCat = '';
var admOrderSearchQ = '';
var _initialRenderDone = false;

/* ==========================================
   FIRESTORE DATA LAYER
   ========================================== */
function initDataListeners() {
  db.collection('products').onSnapshot(function(snapshot) {
    products = [];
    snapshot.forEach(function(doc) {
      var d = doc.data();
      if (d.id === undefined) d.id = parseInt(doc.id) || 0;
      products.push(d);
    });
    products.sort(function(a, b) { return (b.id || 0) - (a.id || 0); });
    onProductsUpdated();
  }, function(error) {
    console.error('Products listener error:', error);
    onProductsUpdated();
  });

  db.collection('orders').onSnapshot(function(snapshot) {
    orders = [];
    snapshot.forEach(function(doc) {
      orders.push(doc.data());
    });
    orders.sort(function(a, b) {
      var idA = parseInt(String(a.id || '').replace(/\D/g, '')) || 0;
      var idB = parseInt(String(b.id || '').replace(/\D/g, '')) || 0;
      return idB - idA;
    });
    onOrdersUpdated();
  }, function(error) {
    console.error('Orders listener error:', error);
  });

  migrateLocalStorageToFirestore();
}

function onProductsUpdated() {
  if (window.location.hash === '#admin') {
    var activeSec = document.querySelector('.admin-sec.active');
    if (activeSec) {
      if (activeSec.id === 'admProducts') renderAdminProducts();
      else if (activeSec.id === 'admDashboard') renderAdminDashboard();
    }
    return;
  }
  if (!_initialRenderDone) {
    _initialRenderDone = true;
    renderTrending();
    return;
  }
  if (currentPageInfo.page === 'home') {
    renderTrending();
  } else if (currentPageInfo.gridId) {
    initCategoryPage(
      currentPageInfo.page === 'accessories' ? 'accessories' : currentPageInfo.page,
      currentPageInfo.gridId, currentPageInfo.countId, currentPageInfo.filterId, currentPageInfo.subFilter
    );
  }
}

function onOrdersUpdated() {
  if (window.location.hash === '#admin') {
    var activeSec = document.querySelector('.admin-sec.active');
    if (activeSec && activeSec.id === 'admOrders') renderAdminOrders();
    if (activeSec && activeSec.id === 'admDashboard') renderAdminDashboard();
  }
}

function migrateLocalStorageToFirestore() {
  if (localStorage.getItem('fg_migrated_v2')) return;
  try {
    var localProducts = JSON.parse(localStorage.getItem('fg_products') || '[]');
    var localOrders = JSON.parse(localStorage.getItem('fg_orders') || '[]');
    if (localProducts.length === 0 && localOrders.length === 0) {
      localStorage.setItem('fg_migrated_v2', 'true');
      return;
    }
    var batch = db.batch();
    var count = 0;
    localProducts.forEach(function(p) {
      if (p.id) {
        batch.set(db.collection('products').doc(String(p.id)), p, {merge: true});
        count++;
        if (count % 400 === 0) { batch.commit(); batch = db.batch(); }
      }
    });
    localOrders.forEach(function(o) {
      if (o.id) {
        batch.set(db.collection('orders').doc(String(o.id)), o, {merge: true});
        count++;
        if (count % 400 === 0) { batch.commit(); batch = db.batch(); }
      }
    });
    if (count > 0) {
      batch.commit().then(function() {
        localStorage.setItem('fg_migrated_v2', 'true');
        console.log('Migrated ' + count + ' items to Firestore');
      }).catch(function(err) { console.error('Migration error:', err); });
    } else {
      localStorage.setItem('fg_migrated_v2', 'true');
    }
  } catch(e) {
    localStorage.setItem('fg_migrated_v2', 'true');
  }
}

function getNextOrderIdFromFirestore(callback) {
  var counterRef = db.collection('config').doc('counters');
  db.runTransaction(function(transaction) {
    return transaction.get(counterRef).then(function(doc) {
      var currentId = doc.exists ? (doc.data().nextOrderId || 1000) : 1000;
      var newId = currentId + 1;
      transaction.set(counterRef, { nextOrderId: newId }, { merge: true });
      return newId;
    });
  }).then(function(newId) {
    callback(newId);
  }).catch(function(error) {
    console.error('Order ID error:', error);
    callback(parseInt(localStorage.getItem('fg_nextOrderId') || '1001'));
  });
}

function compressImage(dataUrl, maxWidth, quality, callback) {
  var img = new Image();
  img.onload = function() {
    var canvas = document.createElement('canvas');
    var ratio = Math.min(maxWidth / img.width, 1);
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = function() { callback(dataUrl); };
  img.src = dataUrl;
}

/* ==========================================
   FIREBASE USER PROFILE
   ========================================== */
function getFirebaseUsers() {
  try { var s = localStorage.getItem('fg_firebase_users'); return s ? JSON.parse(s) : {}; } catch(e) { return {}; }
}
function saveFirebaseUsers(users) { localStorage.setItem('fg_firebase_users', JSON.stringify(users)); }
function getFirebaseUserProfile(uid) { var u = getFirebaseUsers(); return u[uid] || null; }
function saveFirebaseUserProfile(uid, profile) { var u = getFirebaseUsers(); u[uid] = profile; saveFirebaseUsers(u); }
function removeFirebaseUserProfile(uid) { var u = getFirebaseUsers(); delete u[uid]; saveFirebaseUsers(u); }

/* ==========================================
   AUTH STATE
   ========================================== */
auth.onAuthStateChanged(function(user) {
  if (user) { updateUserUI(user); } else { updateUserUI(null); }
  if (pendingCartAction && user) {
    var action = pendingCartAction;
    pendingCartAction = null;
    setTimeout(function() { action(); }, 300);
  }
});

function isLoggedIn() { return !!auth.currentUser; }
function getLoggedUser() {
  var user = auth.currentUser;
  if (!user) return null;
  var profile = getFirebaseUserProfile(user.uid);
  return {
    uid: user.uid,
    name: profile ? profile.name : (user.displayName || 'User'),
    email: user.email,
    phone: profile ? profile.phone : '',
    photoURL: user.photoURL || ''
  };
}

function doLogin() {
  var email = document.getElementById('loginEmail').value.trim().toLowerCase();
  var password = document.getElementById('loginPass').value;
  var errEl = document.getElementById('loginError');
  errEl.classList.remove('show');
  if (!email || !password) { errEl.textContent = 'Please enter email and password'; errEl.classList.add('show'); return; }
  var btn = errEl.parentElement.querySelector('.co-submit');
  var origText = btn.textContent;
  btn.textContent = 'Logging in...'; btn.disabled = true;
  auth.signInWithEmailAndPassword(email, password)
    .then(function(cred) {
      closeLogin();
      var p = getFirebaseUserProfile(cred.user.uid);
      showToast('Welcome back, ' + (p ? p.name : (cred.user.displayName || 'User')) + '!');
    })
    .catch(function(error) {
      errEl.textContent = getFirebaseErrorMsg(error.code); errEl.classList.add('show');
      btn.textContent = origText; btn.disabled = false;
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Please enter a valid email'; errEl.classList.add('show'); return; }
  var btn = errEl.parentElement.querySelector('.co-submit');
  var origText = btn.textContent;
  btn.textContent = 'Creating Account...'; btn.disabled = true;
  auth.createUserWithEmailAndPassword(email, password)
    .then(function(cred) {
      return cred.user.updateProfile({ displayName: name }).then(function() {
        saveFirebaseUserProfile(cred.user.uid, { name: name, email: email, phone: phone, createdAt: new Date().toISOString() });
        closeLogin();
        showToast('Account created! Welcome, ' + name + '!');
      });
    })
    .catch(function(error) {
      errEl.textContent = getFirebaseErrorMsg(error.code); errEl.classList.add('show');
      btn.textContent = origText; btn.disabled = false;
    });
}

function googleSignIn() {
  var errEl = null;
  if (document.getElementById('loginFormDiv').style.display !== 'none') errEl = document.getElementById('loginError');
  else if (document.getElementById('regFormDiv').style.display !== 'none') errEl = document.getElementById('regError');
  if (errEl) errEl.classList.remove('show');
  auth.signInWithPopup(googleProvider)
    .then(function(result) {
      var user = result.user;
      if (!getFirebaseUserProfile(user.uid)) {
        saveFirebaseUserProfile(user.uid, { name: user.displayName || 'Google User', email: user.email, phone: '', photoURL: user.photoURL || '', createdAt: new Date().toISOString() });
      }
      closeLogin();
      showToast('Welcome, ' + (user.displayName || 'User') + '!');
    })
    .catch(function(error) {
      if (error.code === 'auth/popup-closed-by-user') return;
      var msg = getFirebaseErrorMsg(error.code);
      if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); } else { showToast(msg); }
    });
}

function doForgotPassword() {
  var email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  var errEl = document.getElementById('forgotError');
  var succEl = document.getElementById('forgotSuccess');
  errEl.classList.remove('show'); succEl.classList.remove('show');
  if (!email) { errEl.textContent = 'Please enter your email'; errEl.classList.add('show'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Please enter a valid email'; errEl.classList.add('show'); return; }
  var btn = errEl.parentElement.querySelector('.co-submit');
  var origText = btn.textContent;
  btn.textContent = 'Sending...'; btn.disabled = true;
  auth.sendPasswordResetEmail(email)
    .then(function() {
      succEl.innerHTML = '<i class="fas fa-check-circle" style="color:#4CAF50;margin-right:8px"></i> Reset link sent to <strong>' + email + '</strong>. Check your inbox.';
      succEl.classList.add('show'); btn.textContent = origText; btn.disabled = false;
      document.getElementById('forgotEmail').value = '';
    })
    .catch(function(error) {
      errEl.textContent = getFirebaseErrorMsg(error.code); errEl.classList.add('show');
      btn.textContent = origText; btn.disabled = false;
    });
}

function doLogout() {
  auth.signOut().then(function() { showToast('Logged out successfully'); }).catch(function() { showToast('Logged out'); });
}

function getFirebaseErrorMsg(code) {
  var m = {
    'auth/user-not-found': 'No account found with this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/operation-not-allowed': 'Sign-in method not enabled. Contact admin.',
    'auth/popup-blocked': 'Popup blocked by browser. Allow popups for this site.',
    'auth/account-exists-with-different-credential': 'Account exists with a different sign-in method.'
  };
  return m[code] || 'An error occurred (' + code + '). Please try again.';
}

/* ==========================================
   LOGIN / REGISTER UI
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
  document.body.style.overflow = '';
  ['loginEmail', 'loginPass', 'regName', 'regEmail', 'regPhone', 'regPass', 'forgotEmail'].forEach(function(id) { document.getElementById(id).value = ''; });
  ['loginError', 'regError', 'forgotError', 'forgotSuccess'].forEach(function(id) { document.getElementById(id).classList.remove('show'); });
  document.querySelectorAll('.login-modal .co-submit').forEach(function(b) { b.disabled = false; });
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
function handleUserClick() {
  if (isLoggedIn()) {
    var user = getLoggedUser();
    if (confirm('Logged in as ' + user.name + '\nEmail: ' + user.email + '\n\nDo you want to logout?')) doLogout();
  } else { openLogin(); }
}
function updateUserUI(firebaseUser) {
  var btn = document.getElementById('userBtn');
  if (firebaseUser) { btn.classList.add('logged-in'); btn.querySelector('i').className = 'fas fa-user-check'; }
  else { btn.classList.remove('logged-in'); btn.querySelector('i').className = 'fas fa-user'; }
}

/* ==========================================
   ADMIN PANEL
   ========================================== */
function getAdminPass() { return localStorage.getItem('fg_admin_pass') || ADMIN_DEFAULT_PASS; }
function setAdminPass(p) { localStorage.setItem('fg_admin_pass', p); }
function handleHash() { if (window.location.hash === '#admin') { showAdminLogin(); } else { hideAdmin(); } }
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
  setTimeout(function() { document.getElementById('adminUser').focus(); }, 200);
}
function hideAdmin() {
  document.getElementById('storeWrapper').style.display = '';
  document.querySelector('.main-nav').style.display = '';
  document.getElementById('adminLoginOv').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'none';
  document.body.style.overflow = '';
}
function adminGoBack() { window.location.hash = ''; hideAdmin(); showPage('home'); }

function adminDoLogin() {
  var u = document.getElementById('adminUser').value.trim();
  var p = document.getElementById('adminPass').value;
  var err = document.getElementById('adminLoginError');
  err.classList.remove('show');
  if (!u || !p) { err.textContent = 'Please enter username and password'; err.classList.add('show'); return; }
  if (u !== ADMIN_DEFAULT_USER || p !== getAdminPass()) { err.textContent = 'Invalid username or password'; err.classList.add('show'); return; }
  document.body.style.overflow = 'auto';
  document.getElementById('adminLoginOv').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'flex';
  document.getElementById('adminUserDisp').textContent = 'Admin';
  adminShowSec('dashboard');
}
function adminDoLogout() { window.location.hash = ''; hideAdmin(); showPage('home'); showToast('Admin logged out'); }

function adminShowSec(sec) {
  document.querySelectorAll('.admin-sec').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.admin-snav a').forEach(function(a) { a.classList.remove('active'); });
  var secMap = { dashboard: 'admDashboard', products: 'admProducts', orders: 'admOrders', settings: 'admSettings' };
  var titleMap = { dashboard: 'Dashboard', products: 'Products', orders: 'Orders', settings: 'Settings' };
  document.getElementById(secMap[sec]).classList.add('active');
  document.querySelector('.admin-snav a[data-asec="' + sec + '"]').classList.add('active');
  document.getElementById('adminPageTitle').textContent = titleMap[sec];
  if (sec === 'dashboard') renderAdminDashboard();
  else if (sec === 'products') renderAdminProducts();
  else if (sec === 'orders') renderAdminOrders();
  else if (sec === 'settings') renderAdminSettings();
  document.getElementById('adminSidebar').classList.remove('open');
}
function toggleAdminSidebar() { document.getElementById('adminSidebar').classList.toggle('open'); }

function renderAdminDashboard() {
  var totalProducts = products.length;
  var totalOrders = orders.length;
  var revenue = orders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
  var outOfStock = products.filter(function(p) { return !p.inStock; }).length;
  var recentOrders = orders.slice(0, 5);
  var html = '<div class="adm-stats">';
  html += '<div class="adm-stat-card"><div class="adm-stat-icon gold"><i class="fas fa-box"></i></div><div class="adm-stat-info"><h4>' + totalProducts + '</h4><p>Total Products</p></div></div>';
  html += '<div class="adm-stat-card"><div class="adm-stat-icon blue"><i class="fas fa-receipt"></i></div><div class="adm-stat-info"><h4>' + totalOrders + '</h4><p>Total Orders</p></div></div>';
  html += '<div class="adm-stat-card"><div class="adm-stat-icon green"><i class="fas fa-bangladeshi-taka-sign"></i></div><div class="adm-stat-info"><h4>' + fmtPrice(revenue) + '</h4><p>Total Revenue</p></div></div>';
  html += '<div class="adm-stat-card"><div class="adm-stat-icon red"><i class="fas fa-exclamation-triangle"></i></div><div class="adm-stat-info"><h4>' + outOfStock + '</h4><p>Out of Stock</p></div></div>';
  html += '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
  html += '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Recent Orders</h3></div>';
  if (recentOrders.length) {
    html += '<table class="adm-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>';
    recentOrders.forEach(function(o) {
      var inStr = o.items.map(function(it) { return it.name; }).join(', ');
      if (inStr.length > 35) inStr = inStr.substring(0, 35) + '...';
      html += '<tr><td style="font-weight:600;color:var(--gold);white-space:nowrap">' + o.id + '</td><td>' + o.customer.name + '</td><td style="font-size:12px;color:var(--lg);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + inStr + '</td><td>' + fmtPrice(o.total) + '</td><td><span class="adm-status ' + o.status + '">' + o.status + '</span>' + (o.paid ? ' <span class="adm-paid-badge">Paid</span>' : '') + '</td></tr>';
    });
    html += '</tbody></table>';
  } else { html += '<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders yet</div>'; }
  html += '</div>';
  var cats = {};
  products.forEach(function(p) { cats[p.category] = (cats[p.category] || 0) + 1; });
  html += '<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Products by Category</h3></div>';
  html += '<table class="adm-table"><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>';
  for (var c in cats) { html += '<tr><td><span class="adm-table-cat">' + c + '</span></td><td>' + cats[c] + '</td></tr>'; }
  if (!Object.keys(cats).length) { html += '<tr><td colspan="2" style="text-align:center;color:var(--lg);padding:30px">No products yet</td></tr>'; }
  html += '</tbody></table></div></div>';
  document.getElementById('admDashboard').innerHTML = html;
}

function renderAdminProducts() {
  var list = products.slice();
  if (admProdFilterCat) list = list.filter(function(p) { return p.category === admProdFilterCat; });
  if (admProdSearchQ) { var q = admProdSearchQ.toLowerCase(); list = list.filter(function(p) { return p.name.toLowerCase().indexOf(q) !== -1 || String(p.id).indexOf(q) !== -1; }); }
  var html = '<div class="adm-table-wrap">';
  html += '<div class="adm-table-hdr"><h3>All Products (' + list.length + ')</h3><div class="adm-table-actions">';
  html += '<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search..." value="' + admProdSearchQ + '" oninput="admProdSearchQ=this.value;renderAdminProducts()"></div>';
  html += '<select class="adm-filter-sel" onchange="admProdFilterCat=this.value;renderAdminProducts()"><option value="">All Categories</option>';
  ['men', 'women', 'watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].forEach(function(c) { html += '<option value="' + c + '"' + (admProdFilterCat === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>'; });
  html += '</select>';
  html += '<button class="adm-btn" onclick="openAddProductModal()"><i class="fas fa-plus"></i> Add Product</button>';
  html += '</div></div>';
  if (!list.length) {
    html += '<div class="adm-table-empty"><i class="fas fa-box-open"></i>No products found</div>';
  } else {
    html += '<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function(p) {
      html += '<tr>';
      html += '<td><img src="' + p.image + '" class="adm-table-img" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=No+Img\'"></td>';
      html += '<td class="adm-table-name">' + escHtml(p.name) + '</td>';
      html += '<td><span class="adm-table-cat">' + p.category + (p.subCategory ? ' / ' + p.subCategory : '') + '</span></td>';
      html += '<td>' + fmtPrice(p.price) + (p.oldPrice ? ' <br><span style="text-decoration:line-through;color:rgba(255,255,255,.3);font-size:11px">' + fmtPrice(p.oldPrice) + '</span>' : '') + '</td>';
      html += '<td>' + (p.inStock ? '<span class="adm-stock-yes"><i class="fas fa-check-circle"></i> In Stock</span>' : '<span class="adm-stock-no"><i class="fas fa-times-circle"></i> Out</span>') + '</td>';
      html += '<td><div class="adm-actions"><button class="adm-act-btn" title="Edit" onclick="openEditProductModal(' + p.id + ')"><i class="fas fa-pen"></i></button><button class="adm-act-btn del" title="Delete" onclick="deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i></button></div></td>';
      html += '</tr>';
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
function openEditProductModal(id) {
  var p = products.find(function(x) { return x.id === id; });
  if (!p) return;
  admEditId = id; admFormColors = (p.colors || []).slice(); admFormSizes = (p.sizes || []).slice();
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
  ['men', 'women', 'watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].forEach(function(c) { html += '<option value="' + c + '"' + (p.category === c ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>'; });
  html += '</select></div>';
  html += '<div class="adm-form-group"><label>Sub-Category</label><select id="afSubCat"></select></div>';
  html += '<div class="adm-form-group"><label>Current Price (&#x09F3;)</label><input type="number" id="afPrice" value="' + (p.price || '') + '" placeholder="0" min="0"></div>';
  html += '<div class="adm-form-group"><label>Old Price (&#x09F3;) [Optional]</label><input type="number" id="afOldPrice" value="' + (p.oldPrice || '') + '" placeholder="0" min="0"></div>';
  html += '<div class="adm-form-full adm-form-group"><label>Product Image</label>';
  html += '<div class="adm-img-preview" id="afImgPreview">' + (p.image ? '<img src="' + p.image + '" onerror="this.parentElement.innerHTML=\'<span class=placeholder>Invalid Image</span>\'">' : '<span class="placeholder">No Image</span>') + '</div>';
  html += '<div class="adm-img-inputs">';
  html += '<div class="adm-img-url-wrap"><input type="text" id="afImage" value="' + escHtml(p.image) + '" placeholder="Paste image URL here" oninput="previewImgUrl(this.value)"></div>';
  html += '<div class="adm-img-or">&mdash; OR &mdash;</div>';
  html += '<div class="adm-img-upload-wrap"><div class="adm-img-upload-btn"><i class="fas fa-cloud-upload-alt"></i> Drag & Drop or Click to Upload<input type="file" id="afImageFile" accept="image/*" onchange="handleImageUpload(event)"></div></div>';
  html += '</div></div>';
  html += '<div class="adm-form-full adm-form-group"><label>Colors</label><div class="adm-color-picks" id="afColorPicks">';
  ADMIN_COLORS.forEach(function(c) {
    var isL = LIGHT_COLORS.indexOf(c.hex) !== -1;
    var isActive = (p.colors || []).indexOf(c.hex) !== -1;
    html += '<div class="adm-color-pick' + (isL ? ' light-c' : '') + (isActive ? ' active' : '') + '" style="background:' + c.hex + '" title="' + c.name + '" onclick="toggleAdmColor(this,\'' + c.hex + '\')"></div>';
  });
  html += '</div></div>';
  html += '<div class="adm-form-full adm-form-group"><label>Sizes</label><div class="adm-size-picks" id="afSizePicks">';
  var sizesToShow = (p.category === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  sizesToShow.forEach(function(s) {
    var isActive = (p.sizes || []).indexOf(s) !== -1;
    html += '<div class="adm-size-pick' + (isActive ? ' active' : '') + '" onclick="toggleAdmSize(this,\'' + s + '\')">' + s + '</div>';
  });
  html += '</div></div>';
  html += '<div class="adm-form-group"><label>Tag</label><select id="afTag"><option value="">None</option>';
  ['New', 'Hot', 'Sale'].forEach(function(t) { html += '<option value="' + t + '"' + (p.tag === t ? ' selected' : '') + '>' + t + '</option>'; });
  html += '</select></div>';
  html += '<div class="adm-form-group" style="display:flex;align-items:flex-end;padding-bottom:2px"><label class="adm-form-check"><input type="checkbox" id="afStock" ' + (p.inStock ? 'checked' : '') + '><span>In Stock</span></label></div>';
  html += '<div class="adm-form-full adm-form-group"><label>Description</label><textarea id="afDesc" rows="3" placeholder="Product description">' + escHtml(p.description || '') + '</textarea></div>';
  html += '<div class="adm-form-bottom"><button class="adm-btn adm-btn-outline" type="button" onclick="closeAdmModal()">Cancel</button><button class="adm-btn" type="button" onclick="saveProductFromModal()"><i class="fas fa-save"></i> Save Product</button></div>';
  html += '</div>';
  document.getElementById('admModalBody').innerHTML = html;
  updateSubCatOptions(p.subCategory);
}

function escHtml(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function previewImgUrl(val) {
  var prev = document.getElementById('afImgPreview');
  if (val) { prev.innerHTML = '<img src="' + val + '" onerror="this.parentElement.innerHTML=\'<span class=placeholder>Invalid URL</span>\'">'; }
  else { prev.innerHTML = '<span class="placeholder">No Image</span>'; }
}

function handleImageUpload(e) {
  var file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please select an image file'); return; }
  if (file.size > 10 * 1024 * 1024) { showToast('Image must be under 10MB'); return; }
  var reader = new FileReader();
  reader.onload = function(ev) {
    compressImage(ev.target.result, 800, 0.7, function(compressed) {
      var sizeKB = Math.round((compressed.length - 'data:image/jpeg;base64,'.length) * 3 / 4 / 1024);
      if (sizeKB > 900) { showToast('Image too large (' + sizeKB + 'KB). Use a smaller image or URL.'); return; }
      document.getElementById('afImage').value = compressed;
      document.getElementById('afImgPreview').innerHTML = '<img src="' + compressed + '">';
    });
  };
  reader.readAsDataURL(file);
}

function updateSubCatOptions(sel) {
  var cat = document.getElementById('afCat').value;
  var el = document.getElementById('afSubCat');
  var cats = SUB_CATS[cat] || [];
  var html = '<option value="">Select Sub-Category</option>';
  cats.forEach(function(c) { html += '<option value="' + c + '"' + (sel === c ? ' selected' : '') + '>' + SUB_CAT_LABELS[c] + '</option>'; });
  el.innerHTML = html;
  var sizeEl = document.getElementById('afSizePicks');
  var sizesToShow = (cat === 'perfume') ? PERFUME_SIZES : ADMIN_SIZES;
  var sizeHtml = '';
  sizesToShow.forEach(function(s) {
    var isActive = admFormSizes.indexOf(s) !== -1;
    sizeHtml += '<div class="adm-size-pick' + (isActive ? ' active' : '') + '" onclick="toggleAdmSize(this,\'' + s + '\')">' + s + '</div>';
  });
  sizeEl.innerHTML = sizeHtml;
}
function toggleAdmColor(el, hex) { el.classList.toggle('active'); var idx = admFormColors.indexOf(hex); if (idx === -1) admFormColors.push(hex); else admFormColors.splice(idx, 1); }
function toggleAdmSize(el, size) { el.classList.toggle('active'); var idx = admFormSizes.indexOf(size); if (idx === -1) admFormSizes.push(size); else admFormSizes.splice(idx, 1); }

function saveProductFromModal() {
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
  if (!image) { showToast('Image is required (URL or upload)'); return; }
  var prodData = {
    name: name, price: price, oldPrice: oldPrice, category: category,
    subCategory: subCategory, image: image, colors: admFormColors.slice(),
    sizes: admFormSizes.slice(), inStock: inStock, tag: tag, description: description
  };
  if (admEditId) {
    prodData.id = admEditId;
    var idx = products.findIndex(function(p) { return p.id === admEditId; });
    if (idx !== -1) products[idx] = prodData;
    db.collection('products').doc(String(admEditId)).set(prodData)
      .then(function() { showToast('Product updated successfully'); })
      .catch(function(e) { showToast('Error updating: ' + e.message); });
  } else {
    var maxId = products.reduce(function(max, p) { return p.id > max ? p.id : max; }, 0);
    prodData.id = maxId + 1;
    products.unshift(prodData);
    db.collection('products').doc(String(prodData.id)).set(prodData)
      .then(function() { showToast('Product added successfully'); })
      .catch(function(e) { showToast('Error adding: ' + e.message); products.shift(); });
  }
  closeAdmModal();
  renderAdminProducts();
}

function deleteProduct(id) {
  var p = products.find(function(x) { return x.id === id; });
  if (!p) return;
  if (!confirm('Are you sure you want to delete "' + p.name + '"?')) return;
  products = products.filter(function(x) { return x.id !== id; });
  db.collection('products').doc(String(id)).delete()
    .then(function() { showToast('Product deleted'); })
    .catch(function(e) { showToast('Error deleting: ' + e.message); });
  renderAdminProducts();
}

function renderAdminOrders() {
  var list = orders.slice();
  if (admOrderSearchQ) { var q = admOrderSearchQ.toLowerCase(); list = list.filter(function(o) { return o.id.toLowerCase().indexOf(q) !== -1 || o.customer.name.toLowerCase().indexOf(q) !== -1 || o.customer.phone.indexOf(q) !== -1; }); }
  var html = '<div class="adm-table-wrap">';
  html += '<div class="adm-table-hdr"><h3>All Orders (' + list.length + ')</h3><div class="adm-table-actions">';
  html += '<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search orders..." value="' + admOrderSearchQ + '" oninput="admOrderSearchQ=this.value;renderAdminOrders()"></div>';
  html += '</div></div>';
  if (!list.length) {
    html += '<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders found</div>';
  } else {
    html += '<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function(o) {
      var inStr = o.items.map(function(it) { return it.name; }).join(', ');
      if (inStr.length > 25) inStr = inStr.substring(0, 25) + '...';
      html += '<tr>';
      html += '<td style="font-weight:600;color:var(--gold);white-space:nowrap">' + o.id + '</td>';
      html += '<td style="white-space:nowrap">' + o.date + '</td>';
      html += '<td>' + o.customer.name + '<br><span style="font-size:11px;color:var(--lg)">' + o.customer.phone + '</span></td>';
      html += '<td style="font-size:12px;color:var(--lg)">' + o.items.length + ' item(s)<br><span style="font-size:11px;color:rgba(255,255,255,.4)">' + inStr + '</span></td>';
      html += '<td style="font-weight:600">' + fmtPrice(o.total) + '</td>';
      html += '<td>' + (o.paid ? '<span class="adm-paid-badge">Paid</span>' + (o.txnId ? '<br><span style="font-size:10px;color:var(--lg)">Txn: ' + o.txnId + '</span>' : '') : '<span class="adm-unpaid-badge">Unpaid</span>') + '</td>';
      html += '<td><span class="adm-status ' + o.status + '">' + o.status + '</span></td>';
      html += '<td><div class="adm-actions"><button class="adm-act-btn" title="View" onclick="openOrderDetailModal(\'' + o.id + '\')"><i class="fas fa-eye"></i></button><button class="adm-act-btn del" title="Delete" onclick="deleteOrder(\'' + o.id + '\')"><i class="fas fa-trash"></i></button></div></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }
  html += '</div>';
  document.getElementById('admOrders').innerHTML = html;
}

function openOrderDetailModal(id) {
  var o = orders.find(function(x) { return x.id === id; });
  if (!o) return;
  var html = '<div class="adm-order-info">';
  html += '<div class="adm-order-info-card"><h4>Customer Info</h4><p><strong>Name:</strong> ' + o.customer.name + '</p><p><strong>Phone:</strong> ' + o.customer.phone + '</p><p><strong>Email:</strong> ' + o.customer.email + '</p></div>';
  html += '<div class="adm-order-info-card"><h4>Shipping Info</h4><p>' + o.customer.address + '</p>' + (o.customer.notes ? '<p><strong>Notes:</strong> ' + o.customer.notes + '</p>' : '') + '</div>';
  html += '</div>';
  html += '<div class="adm-order-info" style="margin-bottom:20px">';
  html += '<div class="adm-order-info-card"><h4>Payment Info</h4><p><strong>Method:</strong> ' + (o.payMethod === 'cod' ? 'Cash on Delivery' : o.payMethod === 'bkash' ? 'bKash' : 'Nagad') + '</p><p><strong>Status:</strong> ' + (o.paid ? '<span class="adm-paid-badge">Paid</span>' : '<span class="adm-unpaid-badge">Unpaid</span>') + '</p>' + (o.txnId ? '<p><strong>Transaction ID:</strong> ' + o.txnId + '</p>' : '') + '</div>';
  html += '<div class="adm-order-info-card"><h4>Order Info</h4><p><strong>Order ID:</strong> <span style="color:var(--gold)">' + o.id + '</span></p><p><strong>Date:</strong> ' + o.date + '</p><p><strong>Status:</strong> <span class="adm-status ' + o.status + '">' + o.status + '</span></p></div>';
  html += '</div>';
  html += '<h4 style="font-family:var(--fh);font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:12px">Order Items</h4>';
  html += '<div class="adm-order-items">';
  o.items.forEach(function(item) {
    html += '<div class="adm-order-item">';
    html += '<img src="' + item.image + '" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=Img\'">';
    html += '<div class="adm-order-item-info"><h5>' + item.name + '</h5><p>' + (item.color ? 'Color: ' + item.color : '') + (item.size ? ' | Size: ' + item.size : '') + ' | Qty: ' + item.qty + '</p></div>';
    html += '<div class="adm-order-item-price">' + fmtPrice(item.price * item.qty) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div class="adm-order-total"><span>Total:</span><strong>' + fmtPrice(o.total) + '</strong></div>';
  html += '<div style="margin-top:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">';
  html += '<label style="font-family:var(--fh);font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--lg)">Update Status:</label>';
  html += '<select id="admOrderStatus" style="padding:10px 16px;background:var(--bg);border:1px solid rgba(255,255,255,.08);color:var(--w);outline:none;cursor:pointer">';
  ['pending', 'processing', 'shipped', 'delivered'].forEach(function(s) { html += '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>'; });
  html += '</select>';
  html += '<button class="adm-btn" onclick="updateOrderStatus(\'' + o.id + '\')"><i class="fas fa-save"></i> Update</button>';
  html += '</div>';
  document.getElementById('admOrderBody').innerHTML = html;
  document.getElementById('admOrderOv').classList.add('active');
  document.getElementById('admOrderModal').classList.add('active');
}
function closeAdmOrderModal() { document.getElementById('admOrderOv').classList.remove('active'); document.getElementById('admOrderModal').classList.remove('active'); }

function updateOrderStatus(id) {
  var newStatus = document.getElementById('admOrderStatus').value;
  var idx = orders.findIndex(function(o) { return o.id === id; });
  if (idx !== -1) orders[idx].status = newStatus;
  db.collection('orders').doc(String(id)).update({ status: newStatus })
    .then(function() { closeAdmOrderModal(); showToast('Order status updated to ' + newStatus); })
    .catch(function(e) { showToast('Error: ' + e.message); });
}

function deleteOrder(id) {
  if (!confirm('Delete order ' + id + '? This cannot be undone.')) return;
  orders = orders.filter(function(o) { return o.id !== id; });
  db.collection('orders').doc(String(id)).delete()
    .then(function() { showToast('Order ' + id + ' deleted'); })
    .catch(function(e) { showToast('Error: ' + e.message); });
}

function renderAdminSettings() {
  var html = '';
  html += '<div class="adm-settings-card"><h3>Change Admin Password</h3>';
  html += '<div class="adm-form-group"><label>Current Password</label><input type="password" id="setCurrPass"></div>';
  html += '<div class="adm-form-group"><label>New Password</label><input type="password" id="setNewPass"></div>';
  html += '<div class="adm-form-group"><label>Confirm New Password</label><input type="password" id="setConfPass"></div>';
  html += '<button class="adm-btn" onclick="changeAdminPass()"><i class="fas fa-key"></i> Update Password</button></div>';
  html += '<div class="adm-settings-card"><h3>Data Management</h3>';
  html += '<p style="font-size:13px;color:var(--lg);margin-bottom:16px">Data is stored in Firestore cloud database.</p>';
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  html += '<button class="adm-btn adm-btn-outline" onclick="exportData()"><i class="fas fa-download"></i> Export All Data</button>';
  html += '<button class="adm-btn adm-btn-outline" onclick="document.getElementById(\'importFileInput\').click()"><i class="fas fa-upload"></i> Import Products</button>';
  html += '<input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importData(event)">';
  html += '</div></div>';
  html += '<div class="adm-settings-card adm-danger-zone"><h3>Danger Zone</h3>';
  html += '<p>These actions are irreversible and will delete data from the cloud database.</p>';
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  html += '<button class="adm-btn adm-btn-danger" onclick="resetProducts()"><i class="fas fa-box-open"></i> Reset All Products</button>';
  html += '<button class="adm-btn adm-btn-danger" onclick="resetAllData()"><i class="fas fa-trash-alt"></i> Reset Everything</button>';
  html += '</div></div>';
  document.getElementById('admSettings').innerHTML = html;
}
function changeAdminPass() {
  var curr = document.getElementById('setCurrPass').value;
  var newP = document.getElementById('setNewPass').value;
  var conf = document.getElementById('setConfPass').value;
  if (curr !== getAdminPass()) { showToast('Current password is incorrect'); return; }
  if (!newP || newP.length < 4) { showToast('New password must be at least 4 characters'); return; }
  if (newP !== conf) { showToast('New passwords do not match'); return; }
  setAdminPass(newP);
  document.getElementById('setCurrPass').value = '';
  document.getElementById('setNewPass').value = '';
  document.getElementById('setConfPass').value = '';
  showToast('Password changed successfully');
}
function exportData() {
  var data = { products: products, orders: orders };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fashion_garage_data.json';
  a.click();
  showToast('Data exported successfully');
}
function importData(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var data = JSON.parse(ev.target.result);
      if (data.products && Array.isArray(data.products)) {
        showToast('Importing ' + data.products.length + ' products to Firestore...');
        var batch = db.batch();
        var count = 0;
        data.products.forEach(function(p) {
          if (p.id) {
            batch.set(db.collection('products').doc(String(p.id)), p);
            count++;
            if (count % 400 === 0) { batch.commit(); batch = db.batch(); }
          }
        });
        batch.commit().then(function() { showToast('Successfully imported ' + count + ' products!'); renderAdminProducts(); });
      } else { showToast('Invalid file format'); }
    } catch(err) { showToast('Error reading file'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}
function resetProducts() {
  if (!confirm('This will delete ALL products from the cloud database. Continue?')) return;
  if (!products.length) { showToast('No products to delete'); return; }
  var batch = db.batch();
  products.forEach(function(p) { batch.delete(db.collection('products').doc(String(p.id))); });
  batch.commit().then(function() { showToast('All products deleted from database'); }).catch(function(e) { showToast('Error: ' + e.message); });
}
function resetAllData() {
  if (!confirm('WARNING: This will delete ALL data from the cloud database. Continue?')) return;
  var batch = db.batch();
  products.forEach(function(p) { batch.delete(db.collection('products').doc(String(p.id))); });
  orders.forEach(function(o) { if (o.id) batch.delete(db.collection('orders').doc(String(o.id))); });
  batch.commit().then(function() {
    db.collection('config').doc('counters').delete().catch(function() {});
    localStorage.removeItem('fg_firebase_users');
    adminShowSec('dashboard');
    showToast('All data has been reset');
  }).catch(function(e) { showToast('Error: ' + e.message); });
}

/* ==========================================
   PAGE NAVIGATION & SPA
   ========================================== */
document.addEventListener('DOMContentLoaded', function() {
  initHeroSlider();
  initScrollEffects();
  initDataListeners();
  if (window.location.hash === '#admin') { handleHash(); } else { window.scrollTo(0, 0); }
});

function showPage(page, subFilter) {
  if (window.location.hash === '#admin') return;
  document.querySelectorAll('.page-sec').forEach(function(s) { s.classList.remove('active'); });
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.querySelectorAll('[data-nav]').forEach(function(a) { a.classList.remove('active'); });
  document.querySelectorAll('[data-mnav]').forEach(function(a) { a.classList.remove('active'); });
  var navMap = { home: 'home', men: 'men', women: 'women', accessories: 'accessories', offer: 'sale' };
  var navKey = navMap[page] || page;
  document.querySelectorAll('[data-nav="' + navKey + '"]').forEach(function(a) { a.classList.add('active'); });
  document.querySelectorAll('[data-mnav="' + navKey + '"]').forEach(function(a) { a.classList.add('active'); });
  if (page === 'home') {
    document.getElementById('homePage').classList.add('active');
    currentPageInfo = { page: 'home', gridId: '', countId: '', filterId: '', subFilter: null };
    renderTrending();
  } else if (page === 'men') {
    document.getElementById('menPage').classList.add('active');
    currentPageInfo = { page: 'men', gridId: 'menGrid', countId: 'menCount', filterId: 'menFilter', subFilter: null };
    initCategoryPage('men', 'menGrid', 'menCount', 'menFilter', null);
  } else if (page === 'women') {
    document.getElementById('womenPage').classList.add('active');
    currentPageInfo = { page: 'women', gridId: 'womenGrid', countId: 'womenCount', filterId: 'womenFilter', subFilter: null };
    initCategoryPage('women', 'womenGrid', 'womenCount', 'womenFilter', null);
  } else if (page === 'accessories') {
    document.getElementById('accPage').classList.add('active');
    var accTypes = { watch: 'Watches', bag: 'Bags', perfume: 'Perfumes', jewelry: 'Jewelry', sunglasses: 'Sunglasses', homedecor: 'Home Decor' };
    var sf = subFilter || null;
    document.getElementById('accBreadcrumb').textContent = sf ? (accTypes[sf] || 'Accessories') : 'Accessories';
    document.getElementById('accTitle').textContent = sf ? (accTypes[sf] || 'Accessories') : 'Accessories';
    currentPageInfo = { page: 'accessories', gridId: 'accGrid', countId: 'accCount', filterId: 'accFilter', subFilter: sf };
    initCategoryPage('accessories', 'accGrid', 'accCount', 'accFilter', sf);
  } else if (page === 'offer') {
    document.getElementById('offerPage').classList.add('active');
    currentPageInfo = { page: 'offer', gridId: 'offerGrid', countId: 'offerCount', filterId: 'offerFilter', subFilter: null };
    initCategoryPage('offer', 'offerGrid', 'offerCount', 'offerFilter', null);
  }
}

function closeMob() {
  document.getElementById('mobToggle').classList.remove('active');
  document.getElementById('mobNav').classList.remove('active');
  document.getElementById('mobOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
document.getElementById('mobToggle').addEventListener('click', function() {
  this.classList.toggle('active');
  document.getElementById('mobNav').classList.toggle('active');
  document.getElementById('mobOverlay').classList.toggle('active');
  document.body.style.overflow = this.classList.contains('active') ? 'hidden' : '';
});
document.getElementById('mobOverlay').addEventListener('click', closeMob);
function toggleMobAcc(e) {
  e.preventDefault();
  document.getElementById('mobSub').classList.toggle('open');
  document.getElementById('mobAccTog').classList.toggle('open');
}

/* ==========================================
   HERO SLIDER
   ========================================== */
function initHeroSlider() {
  var track = document.getElementById('heroTrack');
  var slides = track.querySelectorAll('.hero-slide');
  var dotsEl = document.getElementById('heroDots');
  dotsEl.innerHTML = '';
  slides.forEach(function(_, i) {
    var dot = document.createElement('button');
    dot.className = 's-dot' + (i === 0 ? ' active' : '');
    dot.onclick = function() { goToSlide(i); };
    dotsEl.appendChild(dot);
  });
  startAutoSlide();
}
function goToSlide(n) {
  var track = document.getElementById('heroTrack');
  var slides = track.querySelectorAll('.hero-slide');
  var dots = document.querySelectorAll('.s-dot');
  if (n >= slides.length) n = 0;
  if (n < 0) n = slides.length - 1;
  currentSlide = n;
  track.style.transform = 'translateX(-' + n * 100 + '%)';
  dots.forEach(function(d, i) { d.classList.toggle('active', i === n); });
}
function heroSlide(dir) { clearInterval(slideInterval); goToSlide(currentSlide + dir); startAutoSlide(); }
function startAutoSlide() { clearInterval(slideInterval); slideInterval = setInterval(function() { goToSlide(currentSlide + 1); }, 5000); }

/* ==========================================
   SCROLL EFFECTS
   ========================================== */
function initScrollEffects() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(function(el) { observer.observe(el); });
  window.addEventListener('scroll', function() {
    var nav = document.getElementById('mainNav');
    if (window.scrollY > 80) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
    var st = document.getElementById('scrollTop');
    if (window.scrollY > 400) st.classList.add('show'); else st.classList.remove('show');
  });
}

/* ==========================================
   PRODUCT RENDERING
   ========================================== */
function renderTrending() {
  var grid = document.getElementById('trendGrid');
  if (!grid) return;
  var trending = products.filter(function(p) { return p.inStock; }).slice(0, 8);
  if (!trending.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--lg)"><i class="fas fa-box-open" style="font-size:40px;margin-bottom:16px;display:block;opacity:.3"></i>No products available yet</div>';
    return;
  }
  grid.innerHTML = trending.map(function(p) { return renderProductCard(p); }).join('');
}

function initCategoryPage(page, gridId, countId, filterId, subFilter) {
  _activeSubFilter = subFilter || '';
  _activeSizes = [];
  _activePriceRange = [0, 999999];
  _activeSort = 'newest';
  var grid = document.getElementById(gridId);
  var countEl = document.getElementById(countId);
  var filterEl = document.getElementById(filterId);
  if (!grid) return;
  var filtered = products.slice();
  if (page === 'offer') { filtered = filtered.filter(function(p) { return p.oldPrice && p.oldPrice > p.price; }); }
  else if (page === 'accessories') {
    if (subFilter) filtered = filtered.filter(function(p) { return p.category === subFilter; });
    else filtered = filtered.filter(function(p) { return ['watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].indexOf(p.category) !== -1; });
  } else if (page === 'men' || page === 'women') { filtered = filtered.filter(function(p) { return p.category === page; }); }
  renderFilterSidebar(filtered, page, filterId, subFilter);
  var finalList = applyCategoryFilters(filtered);
  if (countEl) countEl.textContent = finalList.length + ' products found';
  if (!finalList.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--lg)"><i class="fas fa-search" style="font-size:40px;margin-bottom:16px;display:block;opacity:.3"></i>No products found</div>';
    return;
  }
  grid.innerHTML = finalList.map(function(p) { return renderProductCard(p); }).join('');
}

function renderFilterSidebar(allProducts, page, filterId, subFilter) {
  var el = document.getElementById(filterId);
  if (!el) return;
  var html = '<div class="filter-section"><h4 class="filter-title">Sort By</h4><div class="filter-options">';
  [{ v: 'newest', l: 'Newest' }, { v: 'price-low', l: 'Price: Low to High' }, { v: 'price-high', l: 'Price: High to Low' }].forEach(function(o) {
    html += '<label class="filter-opt"><input type="radio" name="sort" value="' + o.v + '" ' + (o.v === 'newest' ? 'checked' : '') + ' onchange="_activeSort=this.value;refreshCategoryGrid()"><span>' + o.l + '</span></label>';
  });
  html += '</div></div>';
  var cats = page === 'accessories' ? (subFilter ? [subFilter] : ['watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor']) : (page === 'men' ? SUB_CATS.men : page === 'women' ? SUB_CATS.women : []);
  if (cats.length > 1) {
    html += '<div class="filter-section"><h4 class="filter-title">Sub-Category</h4><div class="filter-options">';
    html += '<label class="filter-opt"><input type="radio" name="subcat" value="" checked onchange="_activeSubFilter=\'\';refreshCategoryGrid()"><span>All</span></label>';
    cats.forEach(function(c) {
      html += '<label class="filter-opt"><input type="radio" name="subcat" value="' + c + '" onchange="_activeSubFilter=this.value;refreshCategoryGrid()"><span>' + SUB_CAT_LABELS[c] + '</span></label>';
    });
    html += '</div></div>';
  }
  var allSizes = page === 'perfume' ? PERFUME_SIZES : ADMIN_SIZES;
  html += '<div class="filter-section"><h4 class="filter-title">Size</h4><div class="filter-options">';
  allSizes.forEach(function(s) {
    html += '<label class="filter-opt size-opt"><input type="checkbox" value="' + s + '" onchange="toggleSizeFilter(\'' + s + '\',this.checked)"><span>' + s + '</span></label>';
  });
  html += '</div></div>';
  html += '<div class="filter-section"><h4 class="filter-title">Price Range</h4><div class="filter-options">';
  html += '<input type="number" class="filter-price-input" placeholder="Min" oninput="_activePriceRange[0]=parseInt(this.value)||0;refreshCategoryGrid()">';
  html += '<span style="color:var(--lg);margin:0 4px">-</span>';
  html += '<input type="number" class="filter-price-input" placeholder="Max" oninput="_activePriceRange[1]=parseInt(this.value)||999999;refreshCategoryGrid()">';
  html += '</div></div>';
  el.innerHTML = html;
}

function toggleSizeFilter(size, checked) {
  if (checked) { if (_activeSizes.indexOf(size) === -1) _activeSizes.push(size); }
  else { _activeSizes = _activeSizes.filter(function(s) { return s !== size; }); }
  refreshCategoryGrid();
}

function applyCategoryFilters(list) {
  var filtered = list.slice();
  if (_activeSubFilter) filtered = filtered.filter(function(p) { return p.subCategory === _activeSubFilter; });
  if (_activeSizes.length) filtered = filtered.filter(function(p) { return _activeSizes.some(function(s) { return (p.sizes || []).indexOf(s) !== -1; }); });
  filtered = filtered.filter(function(p) { return p.price >= _activePriceRange[0] && p.price <= _activePriceRange[1]; });
  if (_activeSort === 'price-low') filtered.sort(function(a, b) { return a.price - b.price; });
  else if (_activeSort === 'price-high') filtered.sort(function(a, b) { return b.price - a.price; });
  else filtered.sort(function(a, b) { return (b.id || 0) - (a.id || 0); });
  return filtered;
}

function refreshCategoryGrid() {
  var gridId = currentPageInfo.gridId;
  var countId = currentPageInfo.countId;
  var grid = document.getElementById(gridId);
  var countEl = document.getElementById(countId);
  if (!grid) return;
  var page = currentPageInfo.page;
  var subFilter = currentPageInfo.subFilter;
  var filtered = products.slice();
  if (page === 'offer') filtered = filtered.filter(function(p) { return p.oldPrice && p.oldPrice > p.price; });
  else if (page === 'accessories') {
    if (subFilter) filtered = filtered.filter(function(p) { return p.category === subFilter; });
    else filtered = filtered.filter(function(p) { return ['watch', 'bag', 'perfume', 'jewelry', 'sunglasses', 'homedecor'].indexOf(p.category) !== -1; });
  } else if (page === 'men' || page === 'women') filtered = filtered.filter(function(p) { return p.category === page; });
  var finalList = applyCategoryFilters(filtered);
  if (countEl) countEl.textContent = finalList.length + ' products found';
  if (!finalList.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--lg)"><i class="fas fa-search" style="font-size:40px;margin-bottom:16px;display:block;opacity:.3"></i>No products found</div>';
    return;
  }
  grid.innerHTML = finalList.map(function(p) { return renderProductCard(p); }).join('');
}

function renderProductCard(p) {
  var isWl = wishlist.has(p.id);
  var discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  var html = '<div class="prod-card">';
  if (p.tag) html += '<span class="prod-tag ' + p.tag.toLowerCase() + '">' + p.tag + '</span>';
  if (discount) html += '<span class="prod-tag sale">-' + discount + '%</span>';
  html += '<div class="prod-img" onclick="openPM(' + p.id + ')">';
  html += '<img src="' + p.image + '" alt="' + escHtml(p.name) + '" onerror="this.src=\'https://via.placeholder.com/300x380/121212/d4a017?text=No+Image\'">';
  html += '<div class="prod-overlay"><button class="prod-quick" onclick="event.stopPropagation();openPM(' + p.id + ')"><i class="fas fa-eye"></i> Quick View</button></div>';
  html += '</div>';
  html += '<div class="prod-info">';
  html += '<h4 class="prod-name" onclick="openPM(' + p.id + ')">' + escHtml(p.name) + '</h4>';
  if (p.colors && p.colors.length) {
    html += '<div class="prod-colors">';
    p.colors.forEach(function(c) { html += '<span class="prod-color-dot" style="background:' + c + ';' + (LIGHT_COLORS.indexOf(c) !== -1 ? 'border:1px solid rgba(255,255,255,.2)' : '') + '"></span>'; });
    html += '</div>';
  }
  html += '<div class="prod-bottom">';
  html += '<div class="prod-price">' + fmtPrice(p.price) + (p.oldPrice ? '<span class="prod-old-price">' + fmtPrice(p.oldPrice) + '</span>' : '') + '</div>';
  html += '<div class="prod-actions">';
  html += '<button class="prod-wish' + (isWl ? ' active' : '') + '" onclick="toggleWishlist(' + p.id + ')" title="Wishlist"><i class="fas fa-heart"></i></button>';
  html += '<button class="prod-cart" onclick="quickAddToCart(' + p.id + ')" title="Add to Cart"><i class="fas fa-shopping-bag"></i></button>';
  html += '</div></div></div>';
  return html;
}

/* ==========================================
   PRODUCT MODAL
   ========================================== */
function openPM(id) {
  var p = products.find(function(x) { return x.id === id; });
  if (!p) return;
  pmCurrentProduct = p;
  pmSelectedColor = (p.colors && p.colors[0]) || '';
  pmSelectedSize = (p.sizes && p.sizes[0]) || '';
  pmQuantity = 1;
  document.getElementById('pmImg').src = p.image;
  document.getElementById('pmImg').onerror = function() { this.src = 'https://via.placeholder.com/400x500/121212/d4a017?text=No+Image'; };
  var tagHtml = '';
  if (p.tag) tagHtml += '<span class="prod-tag ' + p.tag.toLowerCase() + '">' + p.tag + '</span>';
  if (p.oldPrice && p.oldPrice > p.price) tagHtml += '<span class="prod-tag sale">-' + Math.round((1 - p.price / p.oldPrice) * 100) + '% OFF</span>';
  document.getElementById('pmTag').innerHTML = tagHtml;
  document.getElementById('pmName').textContent = p.name;
  var priceHtml = '<span class="pm-current">' + fmtPrice(p.price) + '</span>';
  if (p.oldPrice) priceHtml += '<span class="pm-old">' + fmtPrice(p.oldPrice) + '</span>';
  document.getElementById('pmPrice').innerHTML = priceHtml;
  var colorsHtml = '';
  if (p.colors && p.colors.length) {
    p.colors.forEach(function(c) {
      var isL = LIGHT_COLORS.indexOf(c) !== -1;
      colorsHtml += '<span class="pm-color' + (c === pmSelectedColor ? ' active' : '') + '" style="background:' + c + ';' + (isL ? 'border:2px solid rgba(255,255,255,.2)' : '') + '" onclick="selectPMColor(this,\'' + c + '\')"></span>';
    });
  } else { colorsHtml = '<span style="color:var(--lg);font-size:12px">No color options</span>'; }
  document.getElementById('pmColors').innerHTML = colorsHtml;
  var sizesHtml = '';
  if (p.sizes && p.sizes.length) {
    p.sizes.forEach(function(s) {
      sizesHtml += '<span class="pm-size' + (s === pmSelectedSize ? ' active' : '') + '" onclick="selectPMSize(this,\'' + s + '\')">' + s + '</span>';
    });
  } else { sizesHtml = '<span style="color:var(--lg);font-size:12px">No size options</span>'; }
  document.getElementById('pmSizes').innerHTML = sizesHtml;
  document.getElementById('pmQtyVal').textContent = '1';
  document.getElementById('pmOv').classList.add('active');
  document.getElementById('pmModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closePM() { document.getElementById('pmOv').classList.remove('active'); document.getElementById('pmModal').classList.remove('active'); document.body.style.overflow = ''; pmCurrentProduct = null; }
function selectPMColor(el, hex) { document.querySelectorAll('.pm-color').forEach(function(c) { c.classList.remove('active'); }); el.classList.add('active'); pmSelectedColor = hex; }
function selectPMSize(el, size) { document.querySelectorAll('.pm-size').forEach(function(s) { s.classList.remove('active'); }); el.classList.add('active'); pmSelectedSize = size; }
function pmQty(d) { pmQuantity = Math.max(1, pmQuantity + d); document.getElementById('pmQtyVal').textContent = pmQuantity; }
function pmAddToCart() { if (!pmCurrentProduct) return; addToCart(pmCurrentProduct, pmSelectedColor, pmSelectedSize, pmQuantity); closePM(); }
function quickAddToCart(id) { var p = products.find(function(x) { return x.id === id; }); if (!p) return; addToCart(p, (p.colors && p.colors[0]) || '', (p.sizes && p.sizes[0]) || '', 1); }

/* ==========================================
   CART
   ========================================== */
function addToCart(product, color, size, qty) {
  var existing = cart.find(function(c) { return c.id === product.id && c.color === color && c.size === size; });
  if (existing) { existing.qty += qty; }
  else { cart.push({ id: product.id, name: product.name, image: product.image, price: product.price, color: color, size: size, qty: qty }); }
  updateCartUI();
  showToast('Added to cart');
}
function removeFromCart(idx) { cart.splice(idx, 1); updateCartUI(); }
function updateCartQty(idx, d) { cart[idx].qty = Math.max(1, cart[idx].qty + d); updateCartUI(); }
function updateCartUI() {
  var badge = document.getElementById('cartBadge');
  var total = cart.reduce(function(s, c) { return s + c.qty; }, 0);
  badge.textContent = total;
  badge.style.display = total ? '' : 'none';
  renderCartItems();
}
function renderCartItems() {
  var el = document.getElementById('cartItems');
  if (!cart.length) { el.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your bag is empty</p></div>'; return; }
  var html = '';
  cart.forEach(function(item, i) {
    html += '<div class="cart-item">';
    html += '<img src="' + item.image + '" alt="" onerror="this.src=\'https://via.placeholder.com/60x75/121212/d4a017?text=Img\'">';
    html += '<div class="cart-item-info"><h5>' + escHtml(item.name) + '</h5>';
    if (item.color) html += '<p class="cart-item-meta">Color: ' + item.color + '</p>';
    if (item.size) html += '<p class="cart-item-meta">Size: ' + item.size + '</p>';
    html += '<div class="cart-item-qty"><button onclick="updateCartQty(' + i + ',-1)"><i class="fas fa-minus"></i></button><span>' + item.qty + '</span><button onclick="updateCartQty(' + i + ',1)"><i class="fas fa-plus"></i></button></div>';
    html += '</div>';
    html += '<div class="cart-item-right"><div class="cart-item-price">' + fmtPrice(item.price * item.qty) + '</div><button class="cart-item-remove" onclick="removeFromCart(' + i + ')"><i class="fas fa-times"></i></button></div>';
    html += '</div>';
  });
  el.innerHTML = html;
  var total = cart.reduce(function(s, c) { return s + c.price * c.qty; }, 0);
  document.getElementById('cartTotal').textContent = fmtPrice(total);
}
function openCart() {
  renderCartItems();
  document.getElementById('cartOv').classList.add('active');
  document.getElementById('cartSb').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() { document.getElementById('cartOv').classList.remove('active'); document.getElementById('cartSb').classList.remove('active'); document.body.style.overflow = ''; }

/* ==========================================
   WISHLIST
   ========================================== */
function toggleWishlist(id) {
  if (wishlist.has(id)) { wishlist.delete(id); showToast('Removed from wishlist'); }
  else { wishlist.add(id); showToast('Added to wishlist'); }
  updateWishlistUI();
  if (currentPageInfo.page === 'home') renderTrending();
  else if (currentPageInfo.gridId) refreshCategoryGrid();
}
function removeFromWishlist(id) { wishlist.delete(id); updateWishlistUI(); renderWishlistItems(); }
function updateWishlistUI() {
  var badge = document.getElementById('wlBadge');
  badge.textContent = wishlist.size;
  badge.style.display = wishlist.size ? '' : 'none';
}
function renderWishlistItems() {
  var el = document.getElementById('wlItems');
  var wlProducts = products.filter(function(p) { return wishlist.has(p.id); });
  if (!wlProducts.length) { el.innerHTML = '<div class="cart-empty"><i class="fas fa-heart"></i><p>Your wishlist is empty</p></div>'; return; }
  var html = '';
  wlProducts.forEach(function(p) {
    html += '<div class="cart-item">';
    html += '<img src="' + p.image + '" alt="" onerror="this.src=\'https://via.placeholder.com/60x75/121212/d4a017?text=Img\'">';
    html += '<div class="cart-item-info"><h5>' + escHtml(p.name) + '</h5><p class="cart-item-meta" style="color:var(--gold);font-weight:600">' + fmtPrice(p.price) + '</p>';
    html += '<div style="display:flex;gap:8px;margin-top:8px">';
    html += '<button class="prod-cart" style="padding:6px 12px;font-size:11px" onclick="quickAddToCart(' + p.id + ');removeFromWishlist(' + p.id + ')"><i class="fas fa-shopping-bag"></i> Add to Bag</button>';
    html += '<button style="background:transparent;border:1px solid rgba(255,255,255,.1);color:var(--lg);padding:6px 10px;cursor:pointer;font-size:11px" onclick="removeFromWishlist(' + p.id + ')"><i class="fas fa-times"></i></button>';
    html += '</div></div></div>';
  });
  el.innerHTML = html;
}
function openWishlist() {
  renderWishlistItems();
  document.getElementById('wlOv').classList.add('active');
  document.getElementById('wlSb').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeWishlist() { document.getElementById('wlOv').classList.remove('active'); document.getElementById('wlSb').classList.remove('active'); document.body.style.overflow = ''; }

/* ==========================================
   SEARCH
   ========================================== */
function openSearch() {
  document.getElementById('searchOv').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(function() { document.getElementById('searchInput').focus(); }, 200);
}
function closeSearch() { document.getElementById('searchOv').classList.remove('active'); document.getElementById('searchInput').value = ''; document.getElementById('searchResults').innerHTML = ''; document.body.style.overflow = ''; }
function performSearch(query) {
  var el = document.getElementById('searchResults');
  if (!query || query.length < 2) { el.innerHTML = ''; return; }
  var q = query.toLowerCase();
  var results = products.filter(function(p) { return p.name.toLowerCase().indexOf(q) !== -1 || p.category.toLowerCase().indexOf(q) !== -1 || (p.subCategory || '').toLowerCase().indexOf(q) !== -1; }).slice(0, 10);
  if (!results.length) { el.innerHTML = '<div class="search-empty">No products found for "' + escHtml(query) + '"</div>'; return; }
  el.innerHTML = results.map(function(p) {
    return '<div class="search-result-item" onclick="closeSearch();openPM(' + p.id + ')"><img src="' + p.image + '" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=Img\'"><div class="search-result-info"><h5>' + escHtml(p.name) + '</h5><p>' + p.category.charAt(0).toUpperCase() + p.category.slice(1) + (p.subCategory ? ' / ' + SUB_CAT_LABELS[p.subCategory] : '') + '</p><span class="search-result-price">' + fmtPrice(p.price) + '</span></div></div>';
  }).join('');
}

/* ==========================================
   CHECKOUT & ORDER
   ========================================== */
function toggleTxnField() {
  var method = document.getElementById('coPayMethod').value;
  document.getElementById('coTxnField').style.display = (method === 'bkash' || method === 'nagad') ? '' : 'none';
}
function openCheckout() {
  if (!cart.length) { showToast('Your cart is empty'); return; }
  if (!isLoggedIn()) { pendingCartAction = openCheckout; openLogin(); return; }
  var user = getLoggedUser();
  document.getElementById('coName').value = user.name || '';
  document.getElementById('coEmail').value = user.email || '';
  document.getElementById('coPhone').value = user.phone || '';
  document.getElementById('coAddress').value = '';
  document.getElementById('coNotes').value = '';
  document.getElementById('coPayMethod').value = 'cod';
  document.getElementById('coTxnId').value = '';
  document.getElementById('coTxnField').style.display = 'none';
  document.getElementById('coOv').classList.add('active');
  document.getElementById('coModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCheckout() { document.getElementById('coOv').classList.remove('active'); document.getElementById('coModal').classList.remove('active'); document.body.style.overflow = ''; }

function submitOrder() {
  var name = document.getElementById('coName').value.trim();
  var email = document.getElementById('coEmail').value.trim();
  var phone = document.getElementById('coPhone').value.trim();
  var address = document.getElementById('coAddress').value.trim();
  var notes = document.getElementById('coNotes').value.trim();
  var payMethod = document.getElementById('coPayMethod').value;
  var txnId = document.getElementById('coTxnId').value.trim();
  if (!name || !email || !phone || !address) { showToast('Please fill in all required fields'); return; }
  if ((payMethod === 'bkash' || payMethod === 'nagad') && !txnId) { showToast('Please enter the transaction ID'); return; }
  var total = cart.reduce(function(s, c) { return s + c.price * c.qty; }, 0);
  var user = getLoggedUser();
  getNextOrderIdFromFirestore(function(orderId) {
    var orderData = {
      id: 'FG-' + orderId,
      customerId: user ? user.uid : 'guest',
      customer: { name: name, email: email, phone: phone, address: address, notes: notes },
      items: cart.map(function(c) { return { id: c.id, name: c.name, image: c.image, price: c.price, color: c.color, size: c.size, qty: c.qty }; }),
      total: total,
      payMethod: payMethod,
      txnId: txnId,
      paid: payMethod !== 'cod',
      status: 'pending',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString()
    };
    db.collection('orders').doc(orderData.id).set(orderData)
      .then(function() {
        cart = [];
        updateCartUI();
        closeCheckout();
        showToast('Order placed successfully! Order ID: ' + orderData.id);
      })
      .catch(function(e) {
        showToast('Error placing order: ' + e.message);
      });
  });
}

/* ==========================================
   NEWSLETTER
   ========================================== */
function subscribeNL(e) {
  e.preventDefault();
  var input = e.target.querySelector('input');
  if (!input.value) { showToast('Please enter your email'); return false; }
  showToast('Thank you for subscribing!');
  input.value = '';
  return false;
}

/* ==========================================
   UTILITY FUNCTIONS
   ========================================== */
function fmtPrice(n) {
  return '\u09F3' + Number(n || 0).toLocaleString('en-BD');
}

var _toastTimer;
function showToast(msg) {
  var toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 3000);
}
