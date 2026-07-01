/* ==========================================
   FIREBASE CONFIGURATION
   ========================================== */
// ⚠️ আপনার Firebase Console > Project Settings থেকে এই তথ্য কপি করুন
// ⚠️ Firebase Console > Authentication > Sign-in method থেকে:
//     1. Email/Password → Enabled করুন
//     2. Google → Enabled করুন (Support email দিন)
// ⚠️ Firebase Console > Authentication > Templates থেকে Password Reset email কাস্টমাইজ করতে পারবেন
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAt3CUfExpQKEsPMqqy-ky_A1lJqKAebXU",
  authDomain: "fashion-garage-c8058.firebaseapp.com",
  projectId: "fashion-garage-c8058",
  storageBucket: "fashion-garage-c8058.firebasestorage.app",
  messagingSenderId: "900366120245",
  appId: "1:900366120245:web:b2ea2bf8aceda339f8087c",
  measurementId: "G-LFPD2EV5FG"
};

// Firebase Initialize
firebase.initializeApp(FIREBASE_CONFIG);
var auth = firebase.auth();
var googleProvider = new firebase.auth.GoogleAuthProvider();
// Google Sign-in এ অতিরিক্ত permissions যদি চান
// googleProvider.addScope('profile');
// googleProvider.addScope('email');

/* ==========================================
   বেস রিসেট এবং গ্লোবাল ভ্যারিয়েবল সেটআপ
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
var DEFAULT_USERS = [
  {name:'Rahim Ahmed',email:'rahim@gmail.com',phone:'01712345678'},
  {name:'Karim Hossain',email:'karim@yahoo.com',phone:'01898765432'},
  {name:'Test User',email:'user@example.com',phone:'01911223344'}
];
var DEFAULT_PRODUCTS = [];
function loadProducts(){try{var s=localStorage.getItem('fg_products');return s?JSON.parse(s):JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));}catch(e){return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));}}
function saveProducts(){try{localStorage.setItem('fg_products',JSON.stringify(products));}catch(e){showToast('Storage error!');}}
function loadOrders(){try{var s=localStorage.getItem('fg_orders');return s?JSON.parse(s):[];}catch(e){return [];}}
function saveOrders(){localStorage.setItem('fg_orders',JSON.stringify(orders));}
function loadNextOrderId(){return parseInt(localStorage.getItem('fg_nextOrderId')||'1001');}
function saveNextOrderId(){localStorage.setItem('fg_nextOrderId',String(nextOrderId));}
var products = loadProducts();
var orders = loadOrders();
var cart = [];
var wishlist = new Set();
var nextOrderId = loadNextOrderId();
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
var admEditId = null;
var admFormColors = [];
var admFormSizes = [];
var ADMIN_DEFAULT_USER = 'admin';
var ADMIN_DEFAULT_PASS = 'admin123';
var isAuthLoading = false; // Firebase auth loading state

/* ==========================================
   FIREBASE USER PROFILE MANAGEMENT
   ========================================== */
// Firebase UID দিয়ে localStorage এ user profile সেভ করা হয়
// কারণ Firebase Auth এ শুধু email, displayName, photoURL থাকে
// phone এবং অন্যান্য info localStorage এ রাখা হয়
function getFirebaseUsers(){
  try{var s=localStorage.getItem('fg_firebase_users');return s?JSON.parse(s):{};}catch(e){return {};}
}
function saveFirebaseUsers(users){localStorage.setItem('fg_firebase_users',JSON.stringify(users));}
function getFirebaseUserProfile(uid){
  var users=getFirebaseUsers();
  return users[uid]||null;
}
function saveFirebaseUserProfile(uid,profile){
  var users=getFirebaseUsers();
  users[uid]=profile;
  saveFirebaseUsers(users);
}
function removeFirebaseUserProfile(uid){
  var users=getFirebaseUsers();
  delete users[uid];
  saveFirebaseUsers(users);
}

/* ==========================================
   AUTH STATE - Firebase onAuthStateChanged
   ========================================== */
auth.onAuthStateChanged(function(user){
  isAuthLoading = false;
  if(user){
    // User is signed in - update UI
    updateUserUI(user);
  } else {
    // User is signed out
    updateUserUI(null);
  }
  // Handle pending cart action after auth resolves
  if(pendingCartAction && user){
    var action = pendingCartAction;
    pendingCartAction = null;
    setTimeout(function(){ action(); }, 300);
  }
});

/* ==========================================
   AUTH FUNCTIONS - Firebase Integrated
   ========================================== */
function isLoggedIn(){
  return !!auth.currentUser;
}
function getLoggedUser(){
  var user = auth.currentUser;
  if(!user) return null;
  var profile = getFirebaseUserProfile(user.uid);
  return {
    uid: user.uid,
    name: profile ? profile.name : (user.displayName || 'User'),
    email: user.email,
    phone: profile ? profile.phone : '',
    photoURL: user.photoURL || ''
  };
}

// Email/Password Login
function doLogin(){
  var email = document.getElementById('loginEmail').value.trim().toLowerCase();
  var password = document.getElementById('loginPass').value;
  var errEl = document.getElementById('loginError');
  errEl.classList.remove('show');

  if(!email || !password){
    errEl.textContent = 'Please enter email and password';
    errEl.classList.add('show');
    return;
  }

  // Show loading state
  var btn = errEl.parentElement.querySelector('.co-submit');
  var originalText = btn.textContent;
  btn.textContent = 'Logging in...';
  btn.disabled = true;

  auth.signInWithEmailAndPassword(email, password)
    .then(function(userCredential){
      // Login successful - onAuthStateChanged will handle UI
      closeLogin();
      var profile = getFirebaseUserProfile(userCredential.user.uid);
      var name = profile ? profile.name : (userCredential.user.displayName || 'User');
      showToast('Welcome back, ' + name + '!');
    })
    .catch(function(error){
      var msg = getFirebaseErrorMsg(error.code);
      errEl.textContent = msg;
      errEl.classList.add('show');
      btn.textContent = originalText;
      btn.disabled = false;
    });
}

// Email/Password Registration
function doRegister(){
  var name = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim().toLowerCase();
  var phone = document.getElementById('regPhone').value.trim();
  var password = document.getElementById('regPass').value;
  var errEl = document.getElementById('regError');
  errEl.classList.remove('show');

  if(!name || !email || !phone || !password){
    errEl.textContent = 'Please fill in all fields';
    errEl.classList.add('show');
    return;
  }
  if(password.length < 6){
    errEl.textContent = 'Password must be at least 6 characters';
    errEl.classList.add('show');
    return;
  }
  if(!isValidEmail(email)){
    errEl.textContent = 'Please enter a valid email address';
    errEl.classList.add('show');
    return;
  }

  var btn = errEl.parentElement.querySelector('.co-submit');
  var originalText = btn.textContent;
  btn.textContent = 'Creating Account...';
  btn.disabled = true;

  auth.createUserWithEmailAndPassword(email, password)
    .then(function(userCredential){
      var user = userCredential.user;
      // Update displayName in Firebase
      return user.updateProfile({ displayName: name }).then(function(){
        // Save extra profile data locally
        saveFirebaseUserProfile(user.uid, {
          name: name,
          email: email,
          phone: phone,
          createdAt: new Date().toISOString()
        });
        closeLogin();
        showToast('Account created! Welcome, ' + name + '!');
      });
    })
    .catch(function(error){
      var msg = getFirebaseErrorMsg(error.code);
      errEl.textContent = msg;
      errEl.classList.add('show');
      btn.textContent = originalText;
      btn.disabled = false;
    });
}

// Google Sign-In
function googleSignIn(){
  var errEl = null;
  // Determine which form is visible to show errors
  if(document.getElementById('loginFormDiv').style.display !== 'none'){
    errEl = document.getElementById('loginError');
  } else if(document.getElementById('regFormDiv').style.display !== 'none'){
    errEl = document.getElementById('regError');
  }
  if(errEl) errEl.classList.remove('show');

  auth.signInWithPopup(googleProvider)
    .then(function(result){
      var user = result.user;
      var profile = getFirebaseUserProfile(user.uid);

      if(!profile){
        // First time Google sign-in - save profile
        saveFirebaseUserProfile(user.uid, {
          name: user.displayName || 'Google User',
          email: user.email,
          phone: '',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString()
        });
      }

      closeLogin();
      var displayName = user.displayName || 'User';
      showToast('Welcome, ' + displayName + '!');
    })
    .catch(function(error){
      if(error.code === 'auth/popup-closed-by-user'){
        // User closed the popup - don't show error
        return;
      }
      var msg = getFirebaseErrorMsg(error.code);
      if(errEl){
        errEl.textContent = msg;
        errEl.classList.add('show');
      } else {
        showToast(msg);
      }
    });
}

// Forgot Password - Firebase sends reset email
function doForgotPassword(){
  var email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  var errEl = document.getElementById('forgotError');
  var succEl = document.getElementById('forgotSuccess');
  errEl.classList.remove('show');
  succEl.classList.remove('show');

  if(!email){
    errEl.textContent = 'Please enter your email address';
    errEl.classList.add('show');
    return;
  }
  if(!isValidEmail(email)){
    errEl.textContent = 'Please enter a valid email address';
    errEl.classList.add('show');
    return;
  }

  var btn = errEl.parentElement.querySelector('.co-submit');
  var originalText = btn.textContent;
  btn.textContent = 'Sending...';
  btn.disabled = true;

  auth.sendPasswordResetEmail(email)
    .then(function(){
      succEl.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success);margin-right:8px"></i> Password reset link has been sent to <strong>' + email + '</strong>. Please check your inbox (and spam folder).';
      succEl.classList.add('show');
      btn.textContent = originalText;
      btn.disabled = false;
      document.getElementById('forgotEmail').value = '';
    })
    .catch(function(error){
      var msg = getFirebaseErrorMsg(error.code);
      errEl.textContent = msg;
      errEl.classList.add('show');
      btn.textContent = originalText;
      btn.disabled = false;
    });
}

// Logout
function doLogout(){
  auth.signOut().then(function(){
    showToast('Logged out successfully');
  }).catch(function(error){
    // Even if error, clear local state
    showToast('Logged out successfully');
  });
}

// Firebase Error Code to User-Friendly Message
function getFirebaseErrorMsg(code){
  var messages = {
    'auth/user-not-found': 'No account found with this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
    'auth/email-already-in-use': 'An account with this email already exists. Please login instead.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Contact admin.',
    'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups for this site.',
    'auth/cancelled-popup-request': 'Sign-in popup was closed before completing.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/invalid-verification-id': 'Invalid verification ID.',
    'auth/timeout': 'The operation has timed out. Please try again.',
    'auth/internal-error': 'An internal error occurred. Please try again.'
  };
  return messages[code] || 'An error occurred (' + code + '). Please try again.';
}

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ==========================================
   LOGIN / REGISTER / FORGOT UI FUNCTIONS
   ========================================== */
function openLogin(){
  document.getElementById('loginOv').classList.add('active');
  document.getElementById('loginModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  showLogForm();
}
function closeLogin(){
  document.getElementById('loginOv').classList.remove('active');
  document.getElementById('loginModal').classList.remove('active');
  document.body.style.overflow = '';
  // Clear all form fields
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('regName').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPhone').value = '';
  document.getElementById('regPass').value = '';
  document.getElementById('forgotEmail').value = '';
  document.getElementById('loginError').classList.remove('show');
  document.getElementById('regError').classList.remove('show');
  document.getElementById('forgotError').classList.remove('show');
  document.getElementById('forgotSuccess').classList.remove('show');
  // Reset button states
  document.querySelectorAll('.login-modal .co-submit').forEach(function(btn){
    btn.disabled = false;
  });
}
function showLogForm(){
  document.getElementById('loginFormDiv').style.display = 'block';
  document.getElementById('regFormDiv').style.display = 'none';
  document.getElementById('forgotFormDiv').style.display = 'none';
  document.getElementById('loginTitle').textContent = 'Login';
  document.getElementById('loginError').classList.remove('show');
}
function showRegForm(){
  document.getElementById('loginFormDiv').style.display = 'none';
  document.getElementById('regFormDiv').style.display = 'block';
  document.getElementById('forgotFormDiv').style.display = 'none';
  document.getElementById('loginTitle').textContent = 'Register';
  document.getElementById('regError').classList.remove('show');
}
function showForgotForm(){
  document.getElementById('loginFormDiv').style.display = 'none';
  document.getElementById('regFormDiv').style.display = 'none';
  document.getElementById('forgotFormDiv').style.display = 'block';
  document.getElementById('loginTitle').textContent = 'Reset Password';
  document.getElementById('forgotError').classList.remove('show');
  document.getElementById('forgotSuccess').classList.remove('show');
}
function togglePassVis(inputId, btn){
  var input = document.getElementById(inputId);
  var icon = btn.querySelector('i');
  if(input.type === 'password'){
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}
function handleUserClick(){
  if(isLoggedIn()){
    var user = getLoggedUser();
    if(confirm('Logged in as ' + user.name + '\nEmail: ' + user.email + '\n\nDo you want to logout?')){
      doLogout();
    }
  } else {
    openLogin();
  }
}
function updateUserUI(firebaseUser){
  var btn = document.getElementById('userBtn');
  if(firebaseUser){
    btn.classList.add('logged-in');
    btn.querySelector('i').className = 'fas fa-user-check';
  } else {
    btn.classList.remove('logged-in');
    btn.querySelector('i').className = 'fas fa-user';
  }
}

/* ==========================================
   ADMIN PANEL
   ========================================== */
function getAdminPass(){return localStorage.getItem('fg_admin_pass')||ADMIN_DEFAULT_PASS;}
function setAdminPass(p){localStorage.setItem('fg_admin_pass',p);}
function handleHash(){if(window.location.hash==='#admin'){showAdminLogin();}else{hideAdmin();}}
window.addEventListener('hashchange',handleHash);
function showAdminLogin(){
  document.getElementById('storeWrapper').style.display='none';
  document.querySelector('.main-nav').style.display='none';
  document.getElementById('adminLoginOv').style.display='flex';
  document.getElementById('adminPanel').style.display='none';
  document.getElementById('adminLoginError').classList.remove('show');
  document.getElementById('adminUser').value='';
  document.getElementById('adminPass').value='';
  document.body.style.overflow='hidden';
  setTimeout(function(){document.getElementById('adminUser').focus();},200);
}
function hideAdmin(){
  document.getElementById('storeWrapper').style.display='';
  document.querySelector('.main-nav').style.display='';
  document.getElementById('adminLoginOv').style.display='none';
  document.getElementById('adminPanel').style.display='none';
  document.body.style.overflow='';
}
function adminGoBack(){window.location.hash='';hideAdmin();products=loadProducts();orders=loadOrders();showPage('home');}
function adminDoLogin(){
  var u=document.getElementById('adminUser').value.trim();
  var p=document.getElementById('adminPass').value;
  var err=document.getElementById('adminLoginError');
  err.classList.remove('show');
  if(!u||!p){err.textContent='Please enter username and password';err.classList.add('show');return;}
  if(u!==ADMIN_DEFAULT_USER||p!==getAdminPass()){err.textContent='Invalid username or password';err.classList.add('show');return;}
  document.body.style.overflow='auto';
  document.getElementById('adminLoginOv').style.display='none';
  document.getElementById('adminPanel').style.display='flex';
  document.getElementById('adminUserDisp').textContent='Admin';
  adminShowSec('dashboard');
}
function adminDoLogout(){window.location.hash='';hideAdmin();products=loadProducts();orders=loadOrders();showPage('home');showToast('Admin logged out');}
function adminShowSec(sec){
  document.querySelectorAll('.admin-sec').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.admin-snav a').forEach(function(a){a.classList.remove('active');});
  var secMap={dashboard:'admDashboard',products:'admProducts',orders:'admOrders',settings:'admSettings'};
  var titleMap={dashboard:'Dashboard',products:'Products',orders:'Orders',settings:'Settings'};
  document.getElementById(secMap[sec]).classList.add('active');
  document.querySelector('.admin-snav a[data-asec="'+sec+'"]').classList.add('active');
  document.getElementById('adminPageTitle').textContent=titleMap[sec];
  if(sec==='dashboard')renderAdminDashboard();
  else if(sec==='products')renderAdminProducts();
  else if(sec==='orders')renderAdminOrders();
  else if(sec==='settings')renderAdminSettings();
  document.getElementById('adminSidebar').classList.remove('open');
}
function toggleAdminSidebar(){document.getElementById('adminSidebar').classList.toggle('open');}
function renderAdminDashboard(){
  products=loadProducts();orders=loadOrders();
  var totalProducts=products.length;
  var totalOrders=orders.length;
  var revenue=orders.reduce(function(s,o){return s+o.total;},0);
  var outOfStock=products.filter(function(p){return !p.inStock;}).length;
  var recentOrders=orders.slice().reverse().slice(0,5);
  var html='<div class="adm-stats">';
  html+='<div class="adm-stat-card"><div class="adm-stat-icon gold"><i class="fas fa-box"></i></div><div class="adm-stat-info"><h4>'+totalProducts+'</h4><p>Total Products</p></div></div>';
  html+='<div class="adm-stat-card"><div class="adm-stat-icon blue"><i class="fas fa-receipt"></i></div><div class="adm-stat-info"><h4>'+totalOrders+'</h4><p>Total Orders</p></div></div>';
  html+='<div class="adm-stat-card"><div class="adm-stat-icon green"><i class="fas fa-bangladeshi-taka-sign"></i></div><div class="adm-stat-info"><h4>'+fmtPrice(revenue)+'</h4><p>Total Revenue</p></div></div>';
  html+='<div class="adm-stat-card"><div class="adm-stat-icon red"><i class="fas fa-exclamation-triangle"></i></div><div class="adm-stat-info"><h4>'+outOfStock+'</h4><p>Out of Stock</p></div></div>';
  html+='</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
  html+='<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Recent Orders</h3></div>';
  if(recentOrders.length){
    html+='<table class="adm-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>';
    recentOrders.forEach(function(o){
      var itemNames=o.items.map(function(it){return it.name;}).join(', ');
      if(itemNames.length>35)itemNames=itemNames.substring(0,35)+'...';
      html+='<tr><td style="font-weight:600;color:var(--gold);white-space:nowrap">'+o.id+'</td><td>'+o.customer.name+'</td><td style="font-size:12px;color:var(--lg);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+itemNames+'</td><td>'+fmtPrice(o.total)+'</td><td><span class="adm-status '+o.status+'">'+o.status+'</span>'+(o.paid?' <span class="adm-paid-badge">Paid</span>':'')+'</td></tr>';
    });
    html+='</tbody></table>';
  }else{html+='<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders yet</div>';}
  html+='</div>';
  var cats={};
  products.forEach(function(p){cats[p.category]=(cats[p.category]||0)+1;});
  html+='<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Products by Category</h3></div>';
  html+='<table class="adm-table"><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>';
  for(var c in cats){html+='<tr><td><span class="adm-table-cat">'+c+'</span></td><td>'+cats[c]+'</td></tr>';}
  html+='</tbody></table></div></div>';
  document.getElementById('admDashboard').innerHTML=html;
}
var admProdSearchQ='';
var admProdFilterCat='';
function renderAdminProducts(){
  products=loadProducts();
  var list=products.slice();
  if(admProdFilterCat)list=list.filter(function(p){return p.category===admProdFilterCat;});
  if(admProdSearchQ){var q=admProdSearchQ.toLowerCase();list=list.filter(function(p){return p.name.toLowerCase().indexOf(q)!==-1||p.id.toString().indexOf(q)!==-1;});}
  var html='<div class="adm-table-wrap">';
  html+='<div class="adm-table-hdr"><h3>All Products ('+list.length+')</h3><div class="adm-table-actions">';
  html+='<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search..." value="'+admProdSearchQ+'" oninput="admProdSearchQ=this.value;renderAdminProducts()"></div>';
  html+='<select class="adm-filter-sel" onchange="admProdFilterCat=this.value;renderAdminProducts()"><option value="">All Categories</option>';
  ['men','women','watch','bag','perfume','jewelry','sunglasses','homedecor'].forEach(function(c){html+='<option value="'+c+'"'+(admProdFilterCat===c?' selected':'')+'>'+c.charAt(0).toUpperCase()+c.slice(1)+'</option>';});
  html+='</select>';
  html+='<button class="adm-btn" onclick="openAddProductModal()"><i class="fas fa-plus"></i> Add Product</button>';
  html+='</div></div>';
  if(!list.length){html+='<div class="adm-table-empty"><i class="fas fa-box-open"></i>No products found</div>';
  }else{
    html+='<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function(p){
      html+='<tr>';
      html+='<td><img src="'+p.image+'" class="adm-table-img" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=No+Img\'"></td>';
      html+='<td class="adm-table-name">'+p.name+'</td>';
      html+='<td><span class="adm-table-cat">'+p.category+(p.subCategory?' / '+p.subCategory:'')+'</span></td>';
      html+='<td>'+fmtPrice(p.price)+(p.oldPrice?' <br><span style="text-decoration:line-through;color:rgba(255,255,255,.3);font-size:11px">'+fmtPrice(p.oldPrice)+'</span>':'')+'</td>';
      html+='<td>'+(p.inStock?'<span class="adm-stock-yes"><i class="fas fa-check-circle"></i> In Stock</span>':'<span class="adm-stock-no"><i class="fas fa-times-circle"></i> Out</span>')+'</td>';
      html+='<td><div class="adm-actions"><button class="adm-act-btn" title="Edit" onclick="openEditProductModal('+p.id+')"><i class="fas fa-pen"></i></button><button class="adm-act-btn del" title="Delete" onclick="deleteProduct('+p.id+')"><i class="fas fa-trash"></i></button></div></td>';
      html+='</tr>';
    });
    html+='</tbody></table></div>';
  }
  html+='</div>';
  document.getElementById('admProducts').innerHTML=html;
}
function openAddProductModal(){
  admEditId=null;admFormColors=[];admFormSizes=[];
  document.getElementById('admModalTitle').textContent='Add New Product';
  renderProductForm({name:'',price:'',oldPrice:'',category:'men',subCategory:'',image:'',colors:[],sizes:[],inStock:true,tag:'',description:''});
  document.getElementById('admModalOv').classList.add('active');
  document.getElementById('admProductModal').classList.add('active');
}
function openEditProductModal(id){
  var p=products.find(function(x){return x.id===id;});
  if(!p)return;
  admEditId=id;admFormColors=p.colors.slice();admFormSizes=p.sizes.slice();
  document.getElementById('admModalTitle').textContent='Edit Product';
  renderProductForm(p);
  document.getElementById('admModalOv').classList.add('active');
  document.getElementById('admProductModal').classList.add('active');
}
function closeAdmModal(){document.getElementById('admModalOv').classList.remove('active');document.getElementById('admProductModal').classList.remove('active');}
function renderProductForm(p){
  var html='<div class="adm-form-grid">';
  html+='<div class="adm-form-full adm-form-group"><label>Product Name</label><input type="text" id="afName" value="'+escHtml(p.name)+'" placeholder="Enter product name"></div>';
  html+='<div class="adm-form-group"><label>Category</label><select id="afCat" onchange="updateSubCatOptions()">';
  ['men','women','watch','bag','perfume','jewelry','sunglasses','homedecor'].forEach(function(c){html+='<option value="'+c+'"'+(p.category===c?' selected':'')+'>'+c.charAt(0).toUpperCase()+c.slice(1)+'</option>';});
  html+='</select></div>';
  html+='<div class="adm-form-group"><label>Sub-Category</label><select id="afSubCat"></select></div>';
  html+='<div class="adm-form-group"><label>Current Price (&#x09F3;)</label><input type="number" id="afPrice" value="'+(p.price||'')+'" placeholder="0" min="0"></div>';
  html+='<div class="adm-form-group"><label>Old Price (&#x09F3;) [Optional]</label><input type="number" id="afOldPrice" value="'+(p.oldPrice||'')+'" placeholder="0" min="0"></div>';
  html+='<div class="adm-form-full adm-form-group"><label>Product Image</label>';
  html+='<div class="adm-img-preview" id="afImgPreview">'+(p.image?'<img src="'+p.image+'" onerror="this.parentElement.innerHTML=\'<span class=placeholder>Invalid Image</span>\'">':'<span class="placeholder">No Image</span>')+'</div>';
  html+='<div class="adm-img-inputs">';
  html+='<div class="adm-img-url-wrap"><input type="text" id="afImage" value="'+escHtml(p.image)+'" placeholder="Paste image URL here" oninput="previewImgUrl(this.value)"></div>';
  html+='<div class="adm-img-or">&mdash; OR &mdash;</div>';
  html+='<div class="adm-img-upload-wrap"><div class="adm-img-upload-btn"><i class="fas fa-cloud-upload-alt"></i> Drag & Drop or Click to Upload Image<input type="file" id="afImageFile" accept="image/*" onchange="handleImageUpload(event)"></div></div>';
  html+='</div></div>';
  html+='<div class="adm-form-full adm-form-group"><label>Colors</label><div class="adm-color-picks" id="afColorPicks">';
  ADMIN_COLORS.forEach(function(c){
    var isL=LIGHT_COLORS.indexOf(c.hex)!==-1;
    var isActive=p.colors.indexOf(c.hex)!==-1;
    html+='<div class="adm-color-pick'+(isL?' light-c':'')+(isActive?' active':'')+'" style="background:'+c.hex+'" title="'+c.name+'" onclick="toggleAdmColor(this,\''+c.hex+'\')"></div>';
  });
  html+='</div></div>';
  html+='<div class="adm-form-full adm-form-group"><label>Sizes</label><div class="adm-size-picks" id="afSizePicks">';
  var sizesToShow=(p.category==='perfume')?PERFUME_SIZES:ADMIN_SIZES;
  sizesToShow.forEach(function(s){
    var isActive=p.sizes.indexOf(s)!==-1;
    html+='<div class="adm-size-pick'+(isActive?' active':'')+'" onclick="toggleAdmSize(this,\''+s+'\')">'+s+'</div>';
  });
  html+='</div></div>';
  html+='<div class="adm-form-group"><label>Tag</label><select id="afTag"><option value="">None</option>';
  ['New','Hot','Sale'].forEach(function(t){html+='<option value="'+t+'"'+(p.tag===t?' selected':'')+'>'+t+'</option>';});
  html+='</select></div>';
  html+='<div class="adm-form-group" style="display:flex;align-items:flex-end;padding-bottom:2px"><label class="adm-form-check"><input type="checkbox" id="afStock" '+(p.inStock?'checked':'')+'><span>In Stock</span></label></div>';
  html+='<div class="adm-form-full adm-form-group"><label>Description</label><textarea id="afDesc" rows="3" placeholder="Product description">'+escHtml(p.description||'')+'</textarea></div>';
  html+='<div class="adm-form-bottom"><button class="adm-btn adm-btn-outline" type="button" onclick="closeAdmModal()">Cancel</button><button class="adm-btn" type="button" onclick="saveProductFromModal()"><i class="fas fa-save"></i> Save Product</button></div>';
  html+='</div>';
  document.getElementById('admModalBody').innerHTML=html;
  updateSubCatOptions(p.subCategory);
}
function escHtml(s){if(!s)return '';return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function previewImgUrl(val){
  var prev=document.getElementById('afImgPreview');
  if(val){prev.innerHTML='<img src="'+val+'" onerror="this.parentElement.innerHTML=\'<span class=placeholder>Invalid URL</span>\'">';}
  else{prev.innerHTML='<span class="placeholder">No Image</span>';}
}
function handleImageUpload(e){
  var file=e.target.files[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){showToast('Please select an image file');return;}
  if(file.size>5*1024*1024){showToast('Image must be under 5MB');return;}
  var reader=new FileReader();
  reader.onload=function(ev){
    var dataUrl=ev.target.result;
    document.getElementById('afImage').value=dataUrl;
    document.getElementById('afImgPreview').innerHTML='<img src="'+dataUrl+'">';
  };
  reader.readAsDataURL(file);
}
function updateSubCatOptions(sel){
  var cat=document.getElementById('afCat').value;
  var el=document.getElementById('afSubCat');
  var cats=SUB_CATS[cat]||[];
  var html='<option value="">Select Sub-Category</option>';
  cats.forEach(function(c){html+='<option value="'+c+'"'+(sel===c?' selected':'')+'>'+SUB_CAT_LABELS[c]+'</option>';});
  el.innerHTML=html;
  var sizeEl=document.getElementById('afSizePicks');
  var sizesToShow=(cat==='perfume')?PERFUME_SIZES:ADMIN_SIZES;
  var sizeHtml='';
  sizesToShow.forEach(function(s){
    var isActive=admFormSizes.indexOf(s)!==-1;
    sizeHtml+='<div class="adm-size-pick'+(isActive?' active':'')+'" onclick="toggleAdmSize(this,\''+s+'\')">'+s+'</div>';
  });
  sizeEl.innerHTML=sizeHtml;
}
function toggleAdmColor(el,hex){el.classList.toggle('active');var idx=admFormColors.indexOf(hex);if(idx===-1)admFormColors.push(hex);else admFormColors.splice(idx,1);}
function toggleAdmSize(el,size){el.classList.toggle('active');var idx=admFormSizes.indexOf(size);if(idx===-1)admFormSizes.push(size);else admFormSizes.splice(idx,1);}
function saveProductFromModal(){
  var name=document.getElementById('afName').value.trim();
  var price=parseInt(document.getElementById('afPrice').value);
  var oldPrice=parseInt(document.getElementById('afOldPrice').value)||0;
  var category=document.getElementById('afCat').value;
  var subCategory=document.getElementById('afSubCat').value;
  var image=document.getElementById('afImage').value.trim();
  var tag=document.getElementById('afTag').value;
  var inStock=document.getElementById('afStock').checked;
  var description=document.getElementById('afDesc').value.trim();
  if(!name){showToast('Product name is required');return;}
  if(!price||price<=0){showToast('Valid price is required');return;}
  if(!image){showToast('Image is required (URL or upload)');return;}
  var prodData={name:name,price:price,oldPrice:oldPrice,category:category,subCategory:subCategory,image:image,colors:admFormColors.slice(),sizes:admFormSizes.slice(),inStock:inStock,tag:tag,description:description};
  if(admEditId){
    var idx=products.findIndex(function(p){return p.id===admEditId;});
    if(idx!==-1){prodData.id=admEditId;products[idx]=prodData;saveProducts();showToast('Product updated successfully');}
  }else{
    var maxId=products.reduce(function(max,p){return p.id>max?p.id:max;},0);
    prodData.id=maxId+1;
    products.push(prodData);
    saveProducts();
    showToast('Product added successfully');
  }
  closeAdmModal();
  renderAdminProducts();
}
function deleteProduct(id){
  var p=products.find(function(x){return x.id===id;});
  if(!p)return;
  if(!confirm('Are you sure you want to delete "'+p.name+'"?'))return;
  products=products.filter(function(x){return x.id!==id;});
  saveProducts();
  renderAdminProducts();
  showToast('Product deleted');
}
var admOrderSearchQ='';
function renderAdminOrders(){
  orders=loadOrders();
  var list=orders.slice();
  if(admOrderSearchQ){var q=admOrderSearchQ.toLowerCase();list=list.filter(function(o){return o.id.toLowerCase().indexOf(q)!==-1||o.customer.name.toLowerCase().indexOf(q)!==-1||o.customer.phone.indexOf(q)!==-1;});}
  var html='<div class="adm-table-wrap">';
  html+='<div class="adm-table-hdr"><h3>All Orders ('+list.length+')</h3><div class="adm-table-actions">';
  html+='<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search orders..." value="'+admOrderSearchQ+'" oninput="admOrderSearchQ=this.value;renderAdminOrders()"></div>';
  html+='</div></div>';
  if(!list.length){html+='<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders found</div>';
  }else{
    html+='<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function(o){
      var itemNames=o.items.map(function(it){return it.name;}).join(', ');
      if(itemNames.length>25)itemNames=itemNames.substring(0,25)+'...';
      html+='<tr>';
      html+='<td style="font-weight:600;color:var(--gold);white-space:nowrap">'+o.id+'</td>';
      html+='<td style="white-space:nowrap">'+o.date+'</td>';
      html+='<td>'+o.customer.name+'<br><span style="font-size:11px;color:var(--lg)">'+o.customer.phone+'</span></td>';
      html+='<td style="font-size:12px;color:var(--lg)">'+o.items.length+' item(s)<br><span style="font-size:11px;color:rgba(255,255,255,.4)">'+itemNames+'</span></td>';
      html+='<td style="font-weight:600">'+fmtPrice(o.total)+'</td>';
      html+='<td>'+(o.paid?'<span class="adm-paid-badge">Paid</span>'+(o.txnId?'<br><span style="font-size:10px;color:var(--lg)">Txn: '+o.txnId+'</span>':''):'<span class="adm-unpaid-badge">Unpaid</span>')+'</td>';
      html+='<td><span class="adm-status '+o.status+'">'+o.status+'</span></td>';
      html+='<td><div class="adm-actions"><button class="adm-act-btn" title="View Details" onclick="openOrderDetailModal(\''+o.id+'\')"><i class="fas fa-eye"></i></button><button class="adm-act-btn del" title="Delete Order" onclick="deleteOrder(\''+o.id+'\')"><i class="fas fa-trash"></i></button></div></td>';
      html+='</tr>';
    });
    html+='</tbody></table></div>';
  }
  html+='</div>';
  document.getElementById('admOrders').innerHTML=html;
}
function openOrderDetailModal(id){
  var o=orders.find(function(x){return x.id===id;});
  if(!o)return;
  var html='<div class="adm-order-info">';
  html+='<div class="adm-order-info-card"><h4>Customer Info</h4><p><strong>Name:</strong> '+o.customer.name+'</p><p><strong>Phone:</strong> '+o.customer.phone+'</p><p><strong>Email:</strong> '+o.customer.email+'</p></div>';
  html+='<div class="adm-order-info-card"><h4>Shipping Info</h4><p>'+o.customer.address+'</p>'+(o.customer.notes?'<p><strong>Notes:</strong> '+o.customer.notes+'</p>':'')+'</div>';
  html+='</div>';
  html+='<div class="adm-order-info" style="margin-bottom:20px">';
  html+='<div class="adm-order-info-card"><h4>Payment Info</h4><p><strong>Method:</strong> '+(o.payMethod==='cod'?'Cash on Delivery':o.payMethod==='bkash'?'bKash':'Nagad')+'</p><p><strong>Status:</strong> '+(o.paid?'<span class="adm-paid-badge">Paid</span>':'<span class="adm-unpaid-badge">Unpaid</span>')+'</p>'+(o.txnId?'<p><strong>Transaction ID:</strong> '+o.txnId+'</p>':'')+'</div>';
  html+='<div class="adm-order-info-card"><h4>Order Info</h4><p><strong>Order ID:</strong> <span style="color:var(--gold)">'+o.id+'</span></p><p><strong>Date:</strong> '+o.date+'</p><p><strong>Status:</strong> <span class="adm-status '+o.status+'">'+o.status+'</span></p></div>';
  html+='</div>';
  html+='<h4 style="font-family:var(--fh);font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:12px">Order Items</h4>';
  html+='<div class="adm-order-items">';
  o.items.forEach(function(item){
    html+='<div class="adm-order-item">';
    html+='<img src="'+item.image+'" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=Img\'">';
    html+='<div class="adm-order-item-info"><h5>'+item.name+'</h5><p>'+(item.color?'Color: '+item.color:'')+(item.size?' | Size: '+item.size:'')+' | Qty: '+item.qty+'</p></div>';
    html+='<div class="adm-order-item-price">'+fmtPrice(item.price*item.qty)+'</div>';
    html+='</div>';
  });
  html+='</div>';
  html+='<div class="adm-order-total"><span>Total:</span><strong>'+fmtPrice(o.total)+'</strong></div>';
  html+='<div style="margin-top:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">';
  html+='<label style="font-family:var(--fh);font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--lg)">Update Status:</label>';
  html+='<select id="admOrderStatus" style="padding:10px 16px;background:var(--bg);border:1px solid rgba(255,255,255,.08);color:var(--w);outline:none;cursor:pointer">';
  ['pending','processing','shipped','delivered'].forEach(function(s){html+='<option value="'+s+'"'+(o.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>';});
  html+='</select>';
  html+='<button class="adm-btn" onclick="updateOrderStatus(\''+o.id+'\')"><i class="fas fa-save"></i> Update</button>';
  html+='</div>';
  document.getElementById('admOrderBody').innerHTML=html;
  document.getElementById('admOrderOv').classList.add('active');
  document.getElementById('admOrderModal').classList.add('active');
}
function closeAdmOrderModal(){document.getElementById('admOrderOv').classList.remove('active');document.getElementById('admOrderModal').classList.remove('active');}
function updateOrderStatus(id){
  var newStatus=document.getElementById('admOrderStatus').value;
  var idx=orders.findIndex(function(o){return o.id===id;});
  if(idx!==-1){orders[idx].status=newStatus;saveOrders();closeAdmOrderModal();renderAdminOrders();showToast('Order status updated to '+newStatus);}
}
function deleteOrder(id){
  if(!confirm('Are you sure you want to delete order '+id+'? This cannot be undone.'))return;
  orders=orders.filter(function(o){return o.id!==id;});
  saveOrders();
  renderAdminOrders();
  showToast('Order '+id+' deleted');
}
function renderAdminSettings(){
  var html='';
  html+='<div class="adm-settings-card"><h3>Change Admin Password</h3>';
  html+='<div class="adm-form-group"><label>Current Password</label><input type="password" id="setCurrPass"></div>';
  html+='<div class="adm-form-group"><label>New Password</label><input type="password" id="setNewPass"></div>';
  html+='<div class="adm-form-group"><label>Confirm New Password</label><input type="password" id="setConfPass"></div>';
  html+='<button class="adm-btn" onclick="changeAdminPass()"><i class="fas fa-key"></i> Update Password</button></div>';
  html+='<div class="adm-settings-card"><h3>Data Management</h3>';
  html+='<p style="font-size:13px;color:var(--lg);margin-bottom:16px">Manage your store data.</p>';
  html+='<div style="display:flex;gap:12px;flex-wrap:wrap">';
  html+='<button class="adm-btn adm-btn-outline" onclick="exportData()"><i class="fas fa-download"></i> Export All Data</button>';
  html+='<button class="adm-btn adm-btn-outline" onclick="document.getElementById(\'importFileInput\').click()"><i class="fas fa-upload"></i> Import Products</button>';
  html+='<input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importData(event)">';
  html+='</div></div>';
  html+='<div class="adm-settings-card adm-danger-zone"><h3>Danger Zone</h3>';
  html+='<p>These actions are irreversible.</p>';
  html+='<div style="display:flex;gap:12px;flex-wrap:wrap">';
  html+='<button class="adm-btn adm-btn-danger" onclick="resetProducts()"><i class="fas fa-box-open"></i> Reset Products</button>';
  html+='<button class="adm-btn adm-btn-danger" onclick="resetAllData()"><i class="fas fa-trash-alt"></i> Reset Everything</button>';
  html+='</div></div>';
  document.getElementById('admSettings').innerHTML=html;
}
function changeAdminPass(){
  var curr=document.getElementById('setCurrPass').value;
  var newP=document.getElementById('setNewPass').value;
  var conf=document.getElementById('setConfPass').value;
  if(curr!==getAdminPass()){showToast('Current password is incorrect');return;}
  if(!newP||newP.length<4){showToast('New password must be at least 4 characters');return;}
  if(newP!==conf){showToast('New passwords do not match');return;}
  setAdminPass(newP);
  document.getElementById('setCurrPass').value='';
  document.getElementById('setNewPass').value='';
  document.getElementById('setConfPass').value='';
  showToast('Password changed successfully');
}
function exportData(){
  var data={products:products,orders:orders};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fashion_garage_data.json';a.click();
  showToast('Data exported successfully');
}
function importData(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    try{var data=JSON.parse(ev.target.result);if(data.products&&Array.isArray(data.products)){products=data.products;saveProducts();showToast('Imported '+products.length+' products');renderAdminProducts();}else{showToast('Invalid file format');}}catch(err){showToast('Error reading file');}
  };
  reader.readAsText(file);e.target.value='';
}
function resetProducts(){
  if(!confirm('This will delete all current products. Continue?'))return;
  products=JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));saveProducts();renderAdminProducts();showToast('Products reset');
}
function resetAllData(){
  if(!confirm('WARNING: This will delete ALL data. Continue?'))return;
  localStorage.removeItem('fg_products');localStorage.removeItem('fg_orders');localStorage.removeItem('fg_nextOrderId');localStorage.removeItem('fg_firebase_users');
  products=JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));orders=[];nextOrderId=1001;saveProducts();saveOrders();saveNextOrderId();
  adminShowSec('dashboard');showToast('All data has been reset');
}

/* ==========================================
   PAGE NAVIGATION & SPA
   ========================================== */
document.addEventListener('DOMContentLoaded',function(){
  initHeroSlider();initScrollEffects();renderTrending();
  if(window.location.hash==='#admin'){handleHash();}else{window.scrollTo(0,0);}
});
function showPage(page,subFilter){
  if(window.location.hash==='#admin')return;
  products=loadProducts();
  document.querySelectorAll('.page-sec').forEach(function(s){s.classList.remove('active');});
  window.scrollTo({top:0,behavior:'auto'});
  document.querySelectorAll('[data-nav]').forEach(function(a){a.classList.remove('active');});
  document.querySelectorAll('[data-mnav]').forEach(function(a){a.classList.remove('active');});
  var navMap={home:'home',men:'men',women:'women',accessories:'accessories',offer:'sale'};
  var navKey=navMap[page]||page;
  document.querySelectorAll('[data-nav="'+navKey+'"]').forEach(function(a){a.classList.add('active');});
  document.querySelectorAll('[data-mnav="'+navKey+'"]').forEach(function(a){a.classList.add('active');});
  if(page==='home'){document.getElementById('homePage').classList.add('active');currentPageInfo={page:'home',gridId:'',countId:'',filterId:'',subFilter:null};renderTrending();}
  else if(page==='men'){document.getElementById('menPage').classList.add('active');currentPageInfo={page:'men',gridId:'menGrid',countId:'menCount',filterId:'menFilter',subFilter:null};initCategoryPage('men','menGrid','menCount','menFilter',null);}
  else if(page==='women'){document.getElementById('womenPage').classList.add('active');currentPageInfo={page:'women',gridId:'womenGrid',countId:'womenCount',filterId:'womenFilter',subFilter:null};initCategoryPage('women','womenGrid','womenCount','womenFilter',null);}
  else if(page==='accessories'){
    document.getElementById('accPage').classList.add('active');
    var accTypes={watch:'Watches',bag:'Bags',perfume:'Perfumes',jewelry:'Jewelry',sunglasses:'Sunglasses',homedecor:'Home Decor'};
    var sf=subFilter||null;
    document.getElementById('accBreadcrumb').textContent=sf?accTypes[sf]||'Accessories':'Accessories';
    document.getElementById('accTitle').textContent=sf?accTypes[sf]||'Accessories':'Accessories';
    currentPageInfo={page:'accessories',gridId:'accGrid',countId:'accCount',filterId:'accFilter',subFilter:sf};
    initCategoryPage('accessories','accGrid','accCount','accFilter',sf);
  }
  else if(page==='offer'){document.getElementById('offerPage').classList.add('active');currentPageInfo={page:'offer',gridId:'offerGrid',countId:'offerCount',filterId:'offerFilter',subFilter:null};initCategoryPage('offer','offerGrid','offerCount','offerFilter',null);}
}
function closeMob(){document.getElementById('mobToggle').classList.remove('active');document.getElementById('mobNav').classList.remove('active');document.getElementById('mobOverlay').classList.remove('active');document.body.style.overflow='';}
document.getElementById('mobToggle').addEventListener('click',function(){this.classList.toggle('active');document.getElementById('mobNav').classList.toggle('active');document.getElementById('mobOverlay').classList.toggle('active');document.body.style.overflow=this.classList.contains('active')?'hidden':'';});
document.getElementById('mobOverlay').addEventListener('click',closeMob);
function toggleMobAcc(e){e.preventDefault();document.getElementById('mobSub').classList.toggle('show');document.getElementById('mobAccTog').classList.toggle('open');}

/* ==========================================
   SCROLL EFFECTS & HERO SLIDER
   ========================================== */
function initScrollEffects(){
  var nav=document.getElementById('mainNav');
  var stt=document.getElementById('scrollTop');
  window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>50);stt.classList.toggle('visible',window.scrollY>400);});
  var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.1});
  document.querySelectorAll('.fade-in').forEach(function(el){obs.observe(el);});
}
function initHeroSlider(){
  var track=document.getElementById('heroTrack');
  var slides=track.children;
  var dotsC=document.getElementById('heroDots');
  for(var i=0;i<slides.length;i++){
    var d=document.createElement('div');d.className='dot'+(i===0?' active':'');
    d.onclick=(function(idx){return function(){goToSlide(idx);};})(i);
    dotsC.appendChild(d);
  }
  startAutoSlide();
}
function goToSlide(n){var slides=document.getElementById('heroTrack').children;currentSlide=((n%slides.length)+slides.length)%slides.length;document.getElementById('heroTrack').style.transform='translateX(-'+currentSlide*100+'%)';document.querySelectorAll('#heroDots .dot').forEach(function(d,i){d.classList.toggle('active',i===currentSlide);});}
function heroSlide(dir){goToSlide(currentSlide+dir);resetAutoSlide();}
function startAutoSlide(){slideInterval=setInterval(function(){goToSlide(currentSlide+1);},5000);}
function resetAutoSlide(){clearInterval(slideInterval);startAutoSlide();}

/* ==========================================
   UTILITY FUNCTIONS
   ========================================== */
function fmtPrice(val){return '\u09F3'+val.toLocaleString('en-BD');}
function showToast(msg){
  var t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(function(){t.classList.remove('show');},3000);
}

/* ==========================================
   PRODUCT CARD & GRID RENDERING
   ========================================== */
function productCardHTML(p){
  var liked=wishlist.has(p.id);
  var tagHTML='';
  if(!p.inStock)tagHTML='<div class="p-oos-tag">Out of Stock</div>';
  else if(p.tag)tagHTML='<div class="p-tag">'+p.tag+'</div>';
  return '<div class="p-card" onclick="openPM('+p.id+')"><div class="p-img"><img src="'+p.image+'" alt="'+p.name+'" loading="lazy" onerror="this.src=\'https://via.placeholder.com/400x500/121212/d4a017?text=Image\'">'+tagHTML+'<button class="wl-btn'+(liked?' liked':'')+'" onclick="event.stopPropagation();toggleWL('+p.id+')"><i class="fas fa-heart"></i></button></div><div class="p-details"><h4>'+p.name+'</h4><div class="p-price"><span class="cur">'+fmtPrice(p.price)+'</span>'+(p.oldPrice?'<span class="old">'+fmtPrice(p.oldPrice)+'</span>':'')+'</div><button class="qv-btn'+(p.inStock?'':' oos')+'" onclick="event.stopPropagation();'+(p.inStock?'openPM('+p.id+')':'')+'">'+(p.inStock?'Order Now':'Sold Out')+'</button></div></div>';
}
function renderTrending(){
  var grid=document.getElementById('trendGrid');
  var items=products.slice().sort(function(a,b){if(a.inStock===b.inStock)return 0;return a.inStock?-1:1;}).slice(0,8);
  grid.innerHTML=items.length?items.map(productCardHTML).join(''):'<div class="no-products"><i class="fas fa-box-open"></i>No products available yet</div>';
}
function initCategoryPage(page,gridId,countId,filterId,subFilter){_activeSubFilter=subFilter||'';_activeSizes=[];buildFilterSidebar(filterId,page,subFilter);renderCategoryGrid(page,gridId,countId);}
function renderCategoryGrid(page,gridId,countId){var filtered=getFilteredProducts(page);document.getElementById(countId).textContent=filtered.length+' products found';var grid=document.getElementById(gridId);grid.innerHTML=filtered.length?filtered.map(productCardHTML).join(''):'<div class="no-products"><i class="fas fa-box-open"></i>No products available yet</div>';}
function getFilteredProducts(page){
  var list=[];
  if(page==='men')list=products.filter(function(p){return p.category==='men';});
  else if(page==='women')list=products.filter(function(p){return p.category==='women';});
  else if(page==='accessories')list=products.filter(function(p){return ['watch','bag','perfume','jewelry','sunglasses','homedecor'].indexOf(p.category)!==-1;});
  else if(page==='offer')list=products.filter(function(p){return p.oldPrice>0;});
  if(_activeSubFilter){list=list.filter(function(p){return p.category===_activeSubFilter;});}
  var rangeInput=document.querySelector('#'+currentPageInfo.filterId+' .price-range-wrap input[type="range"]');
  var maxPrice=rangeInput?parseInt(rangeInput.value):99999;
  list=list.filter(function(p){return p.price<=maxPrice;});
  if(_activeSizes.length){list=list.filter(function(p){return p.sizes.some(function(s){return _activeSizes.indexOf(s)!==-1;});});}
  list.sort(function(a,b){if(a.inStock===b.inStock)return 0;return a.inStock?-1:1;});
  return list;
}
function buildFilterSidebar(filterId,page,subFilter){
  var el=document.getElementById(filterId);if(!el)return;
  var baseList=[];
  if(page==='men')baseList=products.filter(function(p){return p.category==='men';});
  else if(page==='women')baseList=products.filter(function(p){return p.category==='women';});
  else if(page==='accessories'){
    if(subFilter)baseList=products.filter(function(p){return p.category===subFilter;});
    else baseList=products.filter(function(p){return ['watch','bag','perfume','jewelry','sunglasses','homedecor'].indexOf(p.category)!==-1;});
  }
  else if(page==='offer')baseList=products.filter(function(p){return p.oldPrice>0;});
  var allSizes=[];
  baseList.forEach(function(p){p.sizes.forEach(function(s){if(allSizes.indexOf(s)===-1)allSizes.push(s);});});
  var maxP=baseList.length?Math.max.apply(null,baseList.map(function(p){return p.price;})):100;
  var html='';
  if(page==='men'||page==='women'){
    var cats=SUB_CATS[page]||[];
    html+='<div class="filter-group"><h4>Category</h4><div class="filter-sub-btns">';
    cats.forEach(function(cat){var label=SUB_CAT_LABELS[cat]||cat;var isActive=_activeSubFilter===cat?' active':'';html+='<button class="fsub-btn'+isActive+'" onclick="toggleSubFilter(\''+cat+'\')"><i class="fas fa-check"></i>'+label+'</button>';});
    html+='</div></div>';
  }
  html+='<div class="filter-group"><h4>Price Range</h4><div class="price-range-wrap"><input type="range" min="0" max="'+maxP+'" value="'+maxP+'" id="priceRangeSlider" oninput="onPriceRangeChange(this)"><div class="price-range-val" id="priceRangeVal">Up to '+fmtPrice(maxP)+'</div></div></div>';
  if(allSizes.length){
    html+='<div class="filter-group"><h4>Size</h4><div class="filter-size-btns">';
    allSizes.forEach(function(s){var isActive=_activeSizes.indexOf(s)!==-1?' active':'';html+='<button class="fsize-btn'+isActive+'" onclick="toggleSizeFilter(this,\''+s+'\')">'+s+'</button>';});
    html+='</div></div>';
  }
  html+='<button class="clear-filter-btn" onclick="clearFilters()">Clear Filters</button>';
  el.innerHTML=html;
}
function toggleSubFilter(cat){if(_activeSubFilter===cat)_activeSubFilter='';else _activeSubFilter=cat;var pi=currentPageInfo;buildFilterSidebar(pi.filterId,pi.page,pi.subFilter);renderCategoryGrid(pi.page,pi.gridId,pi.countId);}
function toggleSizeFilter(el,size){el.classList.toggle('active');var idx=_activeSizes.indexOf(size);if(idx===-1)_activeSizes.push(size);else _activeSizes.splice(idx,1);reRenderPage();}
function onPriceRangeChange(input){document.getElementById('priceRangeVal').textContent='Up to '+fmtPrice(parseInt(input.value));reRenderPage();}
function reRenderPage(){var pi=currentPageInfo;if(!pi.gridId)return;renderCategoryGrid(pi.page,pi.gridId,pi.countId);}
function clearFilters(){_activeSubFilter='';_activeSizes=[];var pi=currentPageInfo;buildFilterSidebar(pi.filterId,pi.page,pi.subFilter);renderCategoryGrid(pi.page,pi.gridId,pi.countId);}

/* ==========================================
   WISHLIST
   ========================================== */
function toggleWL(id){
  if(wishlist.has(id))wishlist.delete(id);else wishlist.add(id);
  showToast(wishlist.has(id)?'Added to wishlist':'Removed from wishlist');
  updateWLBadge();
  var pi=currentPageInfo;
  if(pi.page==='home')renderTrending();else reRenderPage();
}
function updateWLBadge(){document.getElementById('wlBadge').textContent=wishlist.size;}
function openWishlist(){document.getElementById('wlOv').classList.add('active');document.getElementById('wlSb').classList.add('active');document.body.style.overflow='hidden';renderWishlist();}
function closeWishlist(){document.getElementById('wlOv').classList.remove('active');document.getElementById('wlSb').classList.remove('active');document.body.style.overflow='';}
function renderWishlist(){
  var el=document.getElementById('wlItems');
  var wlProducts=products.filter(function(p){return wishlist.has(p.id);});
  if(!wlProducts.length){el.innerHTML='<div class="cart-empty"><i class="fas fa-heart"></i><p>Your wishlist is empty</p></div>';return;}
  el.innerHTML=wlProducts.map(function(p){
    return '<div class="cart-item"><div class="cart-item-img" onclick="closeWishlist();openPM('+p.id+')" style="cursor:pointer"><img src="'+p.image+'" alt="'+p.name+'"></div><div class="cart-item-info"><h4 style="cursor:pointer" onclick="closeWishlist();openPM('+p.id+')">'+p.name+'</h4><div class="cart-item-price">'+fmtPrice(p.price)+'</div><div class="wl-item-actions">'+(p.inStock?'<button class="wl-action-btn wl-add-cart" onclick="wlAddToCart('+p.id+')">Add to Cart</button>':'')+'<button class="wl-action-btn wl-remove" onclick="toggleWL('+p.id+');renderWishlist()">Remove</button></div></div></div>';
  }).join('');
}
function wlAddToCart(id){
  var p=products.find(function(x){return x.id===id;});if(!p)return;
  var color=p.colors.length?p.colors[0]:'';var size=p.sizes.length?p.sizes[0]:'';
  addToCart(p,color,size,1);renderWishlist();
}

/* ==========================================
   CART
   ========================================== */
function addToCart(product,color,size,qty){
  var key=product.id+'_'+color+'_'+size;
  var existing=cart.find(function(c){return c.key===key;});
  if(existing){existing.qty+=qty;}
  else{cart.push({key:key,id:product.id,name:product.name,image:product.image,price:product.price,color:color,size:size,qty:qty});}
  updateCartBadge();showToast('Added to cart');
}
function updateCartBadge(){document.getElementById('cartBadge').textContent=cart.reduce(function(s,c){return s+c.qty;},0);}
function openCart(){document.getElementById('cartOv').classList.add('active');document.getElementById('cartSb').classList.add('active');document.body.style.overflow='hidden';renderCart();}
function closeCart(){document.getElementById('cartOv').classList.remove('active');document.getElementById('cartSb').classList.remove('active');document.body.style.overflow='';}
function renderCart(){
  var el=document.getElementById('cartItems');
  if(!cart.length){el.innerHTML='<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>';document.getElementById('cartTotal').textContent=fmtPrice(0);return;}
  var total=0;
  el.innerHTML=cart.map(function(c,i){
    var subtotal=c.price*c.qty;total+=subtotal;
    var colorDot=c.color?'<span class="cart-item-color"><span class="dot" style="background:'+c.color+'"></span></span>':'';
    var sizeTxt=c.size?'<span class="cart-item-size">Size: '+c.size+'</span>':'';
    return '<div class="cart-item"><div class="cart-item-img"><img src="'+c.image+'" alt="'+c.name+'"></div><div class="cart-item-info"><h4>'+c.name+'</h4><div class="cart-item-meta">'+colorDot+sizeTxt+'</div><div class="cart-item-qty"><button onclick="changeCartQty('+i+',-1)"><i class="fas fa-minus"></i></button><span>'+c.qty+'</span><button onclick="changeCartQty('+i+',1)"><i class="fas fa-plus"></i></button></div><div class="cart-item-price">'+fmtPrice(subtotal)+'</div></div><button class="cart-item-remove" onclick="removeCartItem('+i+')"><i class="fas fa-trash"></i></button></div>';
  }).join('');
  document.getElementById('cartTotal').textContent=fmtPrice(total);
}
function changeCartQty(idx,dir){
  if(!cart[idx])return;
  cart[idx].qty+=dir;
  if(cart[idx].qty<=0)cart.splice(idx,1);
  updateCartBadge();renderCart();
}
function removeCartItem(idx){
  cart.splice(idx,1);updateCartBadge();renderCart();showToast('Item removed from cart');
}

/* ==========================================
   CHECKOUT
   ========================================== */
function openCheckout(){
  closeCart();
  if(!cart.length){showToast('Your cart is empty');return;}
  if(!isLoggedIn()){
    pendingCartAction=function(){openCheckout();};
    openLogin();
    showToast('Please login to checkout');
    return;
  }
  var user=getLoggedUser();
  document.getElementById('coName').value=user.name||'';
  document.getElementById('coEmail').value=user.email||'';
  document.getElementById('coPhone').value=user.phone||'';
  document.getElementById('coAddress').value='';
  document.getElementById('coNotes').value='';
  document.getElementById('coPayMethod').value='cod';
  document.getElementById('coTxnId').value='';
  document.getElementById('coTxnField').style.display='none';
  document.getElementById('coOv').classList.add('active');
  document.getElementById('coModal').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeCheckout(){document.getElementById('coOv').classList.remove('active');document.getElementById('coModal').classList.remove('active');document.body.style.overflow='';}
function toggleTxnField(){
  var method=document.getElementById('coPayMethod').value;
  document.getElementById('coTxnField').style.display=(method==='cod')?'none':'block';
}
function submitOrder(){
  var name=document.getElementById('coName').value.trim();
  var email=document.getElementById('coEmail').value.trim();
  var phone=document.getElementById('coPhone').value.trim();
  var address=document.getElementById('coAddress').value.trim();
  var notes=document.getElementById('coNotes').value.trim();
  var payMethod=document.getElementById('coPayMethod').value;
  var txnId=document.getElementById('coTxnId').value.trim();
  if(!name||!email||!phone||!address){showToast('Please fill in all required fields');return;}
  if(payMethod!=='cod'&&!txnId){showToast('Please enter your transaction ID');return;}
  var total=cart.reduce(function(s,c){return s+(c.price*c.qty);},0);
  var order={
    id:'FG-'+String(nextOrderId).padStart(4,'0'),
    date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),
    customer:{name:name,email:email,phone:phone,address:address,notes:notes},
    items:cart.map(function(c){return{name:c.name,image:c.image,price:c.price,color:c.color,size:c.size,qty:c.qty};}),
    total:total,
    payMethod:payMethod,
    txnId:payMethod!=='cod'?txnId:'',
    paid:payMethod!=='cod',
    status:'pending',
    userId:auth.currentUser?auth.currentUser.uid:'guest'
  };
  orders.push(order);
  nextOrderId++;
  saveOrders();saveNextOrderId();
  cart=[];updateCartBadge();
  closeCheckout();
  showToast('Order '+order.id+' placed successfully!');
}

/* ==========================================
   SEARCH
   ========================================== */
function openSearch(){document.getElementById('searchOv').classList.add('active');document.body.style.overflow='hidden';document.getElementById('searchInput').value='';document.getElementById('searchResults').innerHTML='';setTimeout(function(){document.getElementById('searchInput').focus();},200);}
function closeSearch(){document.getElementById('searchOv').classList.remove('active');document.body.style.overflow='';}
function performSearch(q){
  var el=document.getElementById('searchResults');
  q=q.trim().toLowerCase();
  if(!q){el.innerHTML='';return;}
  var results=products.filter(function(p){return p.name.toLowerCase().indexOf(q)!==-1||(p.category&&p.category.toLowerCase().indexOf(q)!==-1)||(p.subCategory&&p.subCategory.toLowerCase().indexOf(q)!==-1);});
  if(!results.length){el.innerHTML='<div class="search-no-result"><i class="fas fa-search"></i>No products found for "'+q+'"</div>';return;}
  el.innerHTML='<div class="search-results-grid">'+results.map(productCardHTML).join('')+'</div>';
}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeSearch();closePM();closeCart();closeWishlist();closeLogin();closeCheckout();}});

/* ==========================================
   PRODUCT MODAL
   ========================================== */
function openPM(id){
  var p=products.find(function(x){return x.id===id;});if(!p)return;
  pmCurrentProduct=p;pmSelectedColor=p.colors.length?p.colors[0]:'';pmSelectedSize=p.sizes.length?p.sizes[0]:'';pmQuantity=1;
  document.getElementById('pmImg').src=p.image;
  document.getElementById('pmImg').onerror=function(){this.src='https://via.placeholder.com/400x500/121212/d4a017?text=Image';};
  // Tag
  var tagEl=document.getElementById('pmTag');
  if(!p.inStock){tagEl.className='pm-oos-tag';tagEl.textContent='Out of Stock';}
  else if(p.tag){tagEl.className='pm-tag';tagEl.textContent=p.tag;}
  else{tagEl.className='pm-tag';tagEl.style.display='none';}
  if(p.tag||!p.inStock)tagEl.style.display=''; 
  document.getElementById('pmName').textContent=p.name;
  document.getElementById('pmPrice').innerHTML='<span class="cur">'+fmtPrice(p.price)+'</span>'+(p.oldPrice?'<span class="old">'+fmtPrice(p.oldPrice)+'</span>':'');
  // Colors
  var colorsHtml='';
  p.colors.forEach(function(c){
    var isL=LIGHT_COLORS.indexOf(c)!==-1;
    colorsHtml+='<div class="pm-cswatch'+(isL?' light-c':'')+(c===pmSelectedColor?' active':'')+'" style="background:'+c+'" onclick="selectPMColor(this,\''+c+'\')"></div>';
  });
  document.getElementById('pmColors').innerHTML=colorsHtml;
  // Sizes
  var sizesHtml='';
  p.sizes.forEach(function(s){
    sizesHtml+='<button class="pm-sbtn'+(s===pmSelectedSize?' active':'')+'" onclick="selectPMSize(this,\''+s+'\')">'+s+'</button>';
  });
  document.getElementById('pmSizes').innerHTML=sizesHtml;
  // Qty
  document.getElementById('pmQtyVal').textContent='1';
  // Add button
  var addBtn=document.getElementById('pmAddBtn');
  if(!p.inStock){addBtn.textContent='OUT OF STOCK';addBtn.classList.add('oos');}
  else{addBtn.textContent='ADD TO CART';addBtn.classList.remove('oos');}
  document.getElementById('pmOv').classList.add('active');
  document.getElementById('pmModal').classList.add('active');
  document.body.style.overflow='hidden';
}
function closePM(){document.getElementById('pmOv').classList.remove('active');document.getElementById('pmModal').classList.remove('active');document.body.style.overflow='';}
function selectPMColor(el,hex){
  document.querySelectorAll('.pm-cswatch').forEach(function(s){s.classList.remove('active');});
  el.classList.add('active');pmSelectedColor=hex;
}
function selectPMSize(el,size){
  document.querySelectorAll('.pm-sbtn').forEach(function(s){s.classList.remove('active');});
  el.classList.add('active');pmSelectedSize=size;
}
function pmQty(dir){
  pmQuantity+=dir;if(pmQuantity<1)pmQuantity=1;if(pmQuantity>10)pmQuantity=10;
  document.getElementById('pmQtyVal').textContent=pmQuantity;
}
function pmAddToCart(){
  if(!pmCurrentProduct||!pmCurrentProduct.inStock)return;
  addToCart(pmCurrentProduct,pmSelectedColor,pmSelectedSize,pmQuantity);
  closePM();
}

/* ==========================================
   NEWSLETTER
   ========================================== */
function subscribeNL(e){
  e.preventDefault();
  var input=e.target.querySelector('input');
  var email=input.value.trim();
  if(!email||!isValidEmail(email)){showToast('Please enter a valid email address');return false;}
  input.value='';
  showToast('Subscribed successfully! Check your email for 15% off code.');
  return false;
}
