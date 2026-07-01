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
   GLOBAL VARIABLES
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
var DEFAULT_PRODUCTS = [];

/* ==========================================
   FIRESTORE DATA LAYER — রিয়েল-টাইম সিঙ্ক
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
var currentPageInfo = {page:'home',gridId:'',countId:'',filterId:'',subFilter:null};
var _activeSubFilter = '';
var _activeSizes = [];
var _activePriceRange = '';
var _activeSort = '';
var _currentCatProducts = [];
var admEditId = null;
var admFormColors = [];
var admFormSizes = [];
var ADMIN_DEFAULT_USER = 'admin';
var ADMIN_DEFAULT_PASS = 'admin123';

// localStorage থেকে ক্যাশ লোড (ইনস্ট্যান্ট শো করার জন্য)
function loadProductsCache(){
  try{var s=localStorage.getItem('fg_products_cache');return s?JSON.parse(s):[];}catch(e){return [];}
}
function loadOrdersCache(){
  try{var s=localStorage.getItem('fg_orders_cache');return s?JSON.parse(s):[];}catch(e){return [];}
}
function loadProducts(){
  if(products.length>0) return products;
  return loadProductsCache();
}
function loadOrders(){
  if(orders.length>0) return orders;
  return loadOrdersCache();
}
function loadNextOrderId(){
  return parseInt(localStorage.getItem('fg_nextOrderId')||'1001');
}
function saveNextOrderId(){
  localStorage.setItem('fg_nextOrderId',String(nextOrderId));
}

// ★ Firestore এ সেভ — সব ডিভাইসে রিয়েল-টাইম সিঙ্ক হবে
function saveProducts(){
  var batch = db.batch();
  products.forEach(function(p){
    batch.set(db.collection('products').doc(String(p.id)), p);
  });
  batch.commit().catch(function(err){
    console.error('Save products error:', err);
    showToast('Error saving products to database');
  });
  try{localStorage.setItem('fg_products_cache',JSON.stringify(products));}catch(e){}
}
function saveOrders(){
  var batch = db.batch();
  orders.forEach(function(o){
    batch.set(db.collection('orders').doc(o.id), o);
  });
  batch.commit().catch(function(err){
    console.error('Save orders error:', err);
  });
  try{localStorage.setItem('fg_orders_cache',JSON.stringify(orders));}catch(e){}
}

// ★ Firestore থেকে একটা প্রোডাক্ট ডিলিট করা
function deleteProductFromFirestore(id){
  db.collection('products').doc(String(id)).delete().catch(function(err){
    console.error('Delete product error:', err);
  });
}

// ★ Firestore রিয়েল-টাইম লিসেনার
function initFirestoreListeners(){
  db.collection('products').onSnapshot(function(snapshot){
    products = [];
    snapshot.forEach(function(doc){
      var data = doc.data();
      data.id = parseInt(doc.id) || data.id;
      products.push(data);
    });
    try{localStorage.setItem('fg_products_cache',JSON.stringify(products));}catch(e){}
    refreshCurrentView();
    refreshAdminIfVisible();
  }, function(error){
    console.error('Products listener error:', error);
  });

  db.collection('orders').onSnapshot(function(snapshot){
    orders = [];
    snapshot.forEach(function(doc){
      orders.push(doc.data());
    });
    try{localStorage.setItem('fg_orders_cache',JSON.stringify(orders));}catch(e){}
    refreshAdminIfVisible();
  }, function(error){
    console.error('Orders listener error:', error);
  });

  db.collection('store').doc('counter').get().then(function(doc){
    if(doc.exists && doc.data().nextOrderId){
      nextOrderId = doc.data().nextOrderId;
      saveNextOrderId();
    }
  }).catch(function(){});
}

function refreshCurrentView(){
  var page = currentPageInfo.page;
  if(page==='home'){renderTrending();}
  else if(page==='men'||page==='women'||page==='accessories'||page==='offer'){
    filterAndRender(currentPageInfo.gridId, currentPageInfo.countId, _currentCatProducts);
  }
}
function refreshAdminIfVisible(){
  if(document.getElementById('adminPanel').style.display==='flex'){
    var activeLink = document.querySelector('.admin-snav a.active');
    if(activeLink){
      var sec = activeLink.getAttribute('data-asec');
      if(sec==='dashboard') renderAdminDashboard();
      else if(sec==='products') renderAdminProducts();
      else if(sec==='orders') renderAdminOrders();
    }
  }
}

/* ==========================================
   FIREBASE USER PROFILE MANAGEMENT
   ========================================== */
function getFirebaseUsers(){
  try{var s=localStorage.getItem('fg_firebase_users');return s?JSON.parse(s):{};}catch(e){return {};}
}
function saveFirebaseUsers(users){localStorage.setItem('fg_firebase_users',JSON.stringify(users));}
function getFirebaseUserProfile(uid){var users=getFirebaseUsers();return users[uid]||null;}
function saveFirebaseUserProfile(uid,profile){var users=getFirebaseUsers();users[uid]=profile;saveFirebaseUsers(users);}
function removeFirebaseUserProfile(uid){var users=getFirebaseUsers();delete users[uid];saveFirebaseUsers(users);}

/* ==========================================
   AUTH STATE
   ========================================== */
auth.onAuthStateChanged(function(user){
  if(user){updateUserUI(user);}else{updateUserUI(null);}
  if(pendingCartAction && user){
    var action = pendingCartAction;pendingCartAction = null;
    setTimeout(function(){ action(); }, 300);
  }
});

/* ==========================================
   AUTH FUNCTIONS
   ========================================== */
function isLoggedIn(){return !!auth.currentUser;}
function getLoggedUser(){
  var user = auth.currentUser;if(!user) return null;
  var profile = getFirebaseUserProfile(user.uid);
  return {uid:user.uid,name:profile?profile.name:(user.displayName||'User'),email:user.email,phone:profile?profile.phone:'',photoURL:user.photoURL||''};
}
function doLogin(){
  var email=document.getElementById('loginEmail').value.trim().toLowerCase();
  var password=document.getElementById('loginPass').value;
  var errEl=document.getElementById('loginError');errEl.classList.remove('show');
  if(!email||!password){errEl.textContent='Please enter email and password';errEl.classList.add('show');return;}
  var btn=errEl.parentElement.querySelector('.co-submit');var ot=btn.textContent;btn.textContent='Logging in...';btn.disabled=true;
  auth.signInWithEmailAndPassword(email,password).then(function(cred){
    closeLogin();var profile=getFirebaseUserProfile(cred.user.uid);showToast('Welcome back, '+(profile?profile.name:(cred.user.displayName||'User'))+'!');
  }).catch(function(error){errEl.textContent=getFirebaseErrorMsg(error.code);errEl.classList.add('show');btn.textContent=ot;btn.disabled=false;});
}
function doRegister(){
  var name=document.getElementById('regName').value.trim();var email=document.getElementById('regEmail').value.trim().toLowerCase();
  var phone=document.getElementById('regPhone').value.trim();var password=document.getElementById('regPass').value;
  var errEl=document.getElementById('regError');errEl.classList.remove('show');
  if(!name||!email||!phone||!password){errEl.textContent='Please fill in all fields';errEl.classList.add('show');return;}
  if(password.length<6){errEl.textContent='Password must be at least 6 characters';errEl.classList.add('show');return;}
  if(!isValidEmail(email)){errEl.textContent='Please enter a valid email address';errEl.classList.add('show');return;}
  var btn=errEl.parentElement.querySelector('.co-submit');var ot=btn.textContent;btn.textContent='Creating Account...';btn.disabled=true;
  auth.createUserWithEmailAndPassword(email,password).then(function(cred){
    return cred.user.updateProfile({displayName:name}).then(function(){
      saveFirebaseUserProfile(cred.user.uid,{name:name,email:email,phone:phone,createdAt:new Date().toISOString()});
      closeLogin();showToast('Account created! Welcome, '+name+'!');
    });
  }).catch(function(error){errEl.textContent=getFirebaseErrorMsg(error.code);errEl.classList.add('show');btn.textContent=ot;btn.disabled=false;});
}
function googleSignIn(){
  var errEl=null;
  if(document.getElementById('loginFormDiv').style.display!=='none') errEl=document.getElementById('loginError');
  else if(document.getElementById('regFormDiv').style.display!=='none') errEl=document.getElementById('regError');
  if(errEl) errEl.classList.remove('show');
  auth.signInWithPopup(googleProvider).then(function(result){
    var user=result.user;var profile=getFirebaseUserProfile(user.uid);
    if(!profile){saveFirebaseUserProfile(user.uid,{name:user.displayName||'Google User',email:user.email,phone:'',photoURL:user.photoURL||'',createdAt:new Date().toISOString()});}
    closeLogin();showToast('Welcome, '+(user.displayName||'User')+'!');
  }).catch(function(error){
    if(error.code==='auth/popup-closed-by-user') return;
    var msg=getFirebaseErrorMsg(error.code);if(errEl){errEl.textContent=msg;errEl.classList.add('show');}else{showToast(msg);}
  });
}
function doForgotPassword(){
  var email=document.getElementById('forgotEmail').value.trim().toLowerCase();
  var errEl=document.getElementById('forgotError');var succEl=document.getElementById('forgotSuccess');
  errEl.classList.remove('show');succEl.classList.remove('show');
  if(!email){errEl.textContent='Please enter your email address';errEl.classList.add('show');return;}
  if(!isValidEmail(email)){errEl.textContent='Please enter a valid email address';errEl.classList.add('show');return;}
  var btn=errEl.parentElement.querySelector('.co-submit');var ot=btn.textContent;btn.textContent='Sending...';btn.disabled=true;
  auth.sendPasswordResetEmail(email).then(function(){
    succEl.innerHTML='<i class="fas fa-check-circle" style="color:var(--success);margin-right:8px"></i> Password reset link sent to <strong>'+email+'</strong>. Check your inbox.';succEl.classList.add('show');btn.textContent=ot;btn.disabled=false;document.getElementById('forgotEmail').value='';
  }).catch(function(error){errEl.textContent=getFirebaseErrorMsg(error.code);errEl.classList.add('show');btn.textContent=ot;btn.disabled=false;});
}
function doLogout(){auth.signOut().then(function(){showToast('Logged out successfully');}).catch(function(){showToast('Logged out successfully');});}
function getFirebaseErrorMsg(code){
  var m={'auth/user-not-found':'No account found with this email.','auth/wrong-password':'Incorrect password.','auth/invalid-email':'Invalid email address.','auth/user-disabled':'Account disabled.','auth/too-many-requests':'Too many attempts. Try later.','auth/network-request-failed':'Network error.','auth/invalid-credential':'Invalid email or password.','auth/email-already-in-use':'Email already exists. Login instead.','auth/weak-password':'Password too weak. Min 6 characters.','auth/operation-not-allowed':'Sign-in method not enabled.','auth/popup-blocked':'Popup blocked. Allow popups.','auth/internal-error':'Internal error. Try again.'};
  return m[code]||'Error ('+code+'). Try again.';
}
function isValidEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);}

/* ==========================================
   LOGIN / REGISTER UI
   ========================================== */
function openLogin(){document.getElementById('loginOv').classList.add('active');document.getElementById('loginModal').classList.add('active');document.body.style.overflow='hidden';showLogForm();}
function closeLogin(){
  document.getElementById('loginOv').classList.remove('active');document.getElementById('loginModal').classList.remove('active');document.body.style.overflow='';
  document.getElementById('loginEmail').value='';document.getElementById('loginPass').value='';document.getElementById('regName').value='';document.getElementById('regEmail').value='';document.getElementById('regPhone').value='';document.getElementById('regPass').value='';document.getElementById('forgotEmail').value='';
  document.getElementById('loginError').classList.remove('show');document.getElementById('regError').classList.remove('show');document.getElementById('forgotError').classList.remove('show');document.getElementById('forgotSuccess').classList.remove('show');
  document.querySelectorAll('.login-modal .co-submit').forEach(function(b){b.disabled=false;b.textContent=b.textContent.includes('Login')?'Login':b.textContent.includes('Create')?'Create Account':'Send Reset Link';});
}
function showLogForm(){document.getElementById('loginFormDiv').style.display='block';document.getElementById('regFormDiv').style.display='none';document.getElementById('forgotFormDiv').style.display='none';document.getElementById('loginTitle').textContent='Login';document.getElementById('loginError').classList.remove('show');}
function showRegForm(){document.getElementById('loginFormDiv').style.display='none';document.getElementById('regFormDiv').style.display='block';document.getElementById('forgotFormDiv').style.display='none';document.getElementById('loginTitle').textContent='Register';document.getElementById('regError').classList.remove('show');}
function showForgotForm(){document.getElementById('loginFormDiv').style.display='none';document.getElementById('regFormDiv').style.display='none';document.getElementById('forgotFormDiv').style.display='block';document.getElementById('loginTitle').textContent='Reset Password';document.getElementById('forgotError').classList.remove('show');document.getElementById('forgotSuccess').classList.remove('show');}
function togglePassVis(inputId,btn){var input=document.getElementById(inputId);var icon=btn.querySelector('i');if(input.type==='password'){input.type='text';icon.className='fas fa-eye-slash';}else{input.type='password';icon.className='fas fa-eye';}}
function handleUserClick(){if(isLoggedIn()){var user=getLoggedUser();if(confirm('Logged in as '+user.name+'\nEmail: '+user.email+'\n\nLogout?')){doLogout();}}else{openLogin();}}
function updateUserUI(firebaseUser){var btn=document.getElementById('userBtn');if(firebaseUser){btn.classList.add('logged-in');btn.querySelector('i').className='fas fa-user-check';}else{btn.classList.remove('logged-in');btn.querySelector('i').className='fas fa-user';}}

/* ==========================================
   ADMIN PANEL
   ========================================== */
function getAdminPass(){return localStorage.getItem('fg_admin_pass')||ADMIN_DEFAULT_PASS;}
function setAdminPass(p){localStorage.setItem('fg_admin_pass',p);}
function handleHash(){if(window.location.hash==='#admin'){showAdminLogin();}else{hideAdmin();}}
window.addEventListener('hashchange',handleHash);
function showAdminLogin(){
  document.getElementById('storeWrapper').style.display='none';document.querySelector('.main-nav').style.display='none';
  document.getElementById('adminLoginOv').style.display='flex';document.getElementById('adminPanel').style.display='none';
  document.getElementById('adminLoginError').classList.remove('show');document.getElementById('adminUser').value='';document.getElementById('adminPass').value='';
  document.body.style.overflow='hidden';setTimeout(function(){document.getElementById('adminUser').focus();},200);
}
function hideAdmin(){document.getElementById('storeWrapper').style.display='';document.querySelector('.main-nav').style.display='';document.getElementById('adminLoginOv').style.display='none';document.getElementById('adminPanel').style.display='none';document.body.style.overflow='';}
function adminGoBack(){window.location.hash='';hideAdmin();showPage('home');}
function adminDoLogin(){
  var u=document.getElementById('adminUser').value.trim();var p=document.getElementById('adminPass').value;
  var err=document.getElementById('adminLoginError');err.classList.remove('show');
  if(!u||!p){err.textContent='Please enter username and password';err.classList.add('show');return;}
  if(u!==ADMIN_DEFAULT_USER||p!==getAdminPass()){err.textContent='Invalid username or password';err.classList.add('show');return;}
  document.body.style.overflow='auto';document.getElementById('adminLoginOv').style.display='none';document.getElementById('adminPanel').style.display='flex';
  document.getElementById('adminUserDisp').textContent='Admin';adminShowSec('dashboard');
}
function adminDoLogout(){window.location.hash='';hideAdmin();showPage('home');showToast('Admin logged out');}
function adminShowSec(sec){
  document.querySelectorAll('.admin-sec').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.admin-snav a').forEach(function(a){a.classList.remove('active');});
  var secMap={dashboard:'admDashboard',products:'admProducts',orders:'admOrders',settings:'admSettings'};
  var titleMap={dashboard:'Dashboard',products:'Products',orders:'Orders',settings:'Settings'};
  document.getElementById(secMap[sec]).classList.add('active');
  document.querySelector('.admin-snav a[data-asec="'+sec+'"]').classList.add('active');
  document.getElementById('adminPageTitle').textContent=titleMap[sec];
  if(sec==='dashboard')renderAdminDashboard();else if(sec==='products')renderAdminProducts();else if(sec==='orders')renderAdminOrders();else if(sec==='settings')renderAdminSettings();
  document.getElementById('adminSidebar').classList.remove('open');
}
function toggleAdminSidebar(){document.getElementById('adminSidebar').classList.toggle('open');}

function renderAdminDashboard(){
  var totalProducts=products.length;var totalOrders=orders.length;
  var revenue=orders.reduce(function(s,o){return s+o.total;},0);
  var outOfStock=products.filter(function(p){return !p.inStock;}).length;
  var recentOrders=orders.slice().reverse().slice(0,5);
  var html='<div class="adm-stats">';
  html+='<div class="adm-stat-card"><div class="adm-stat-icon gold"><i class="fas fa-box"></i></div><div class="adm-stat-info"><h4>'+totalProducts+'</h4><p>Total Products</p></div></div>';
  html+='<div class="adm-stat-card"><div class="adm-stat-icon blue"><i class="fas fa-receipt"></i></div><div class="adm-stat-info"><h4>'+totalOrders+'</h4><p>Total Orders</p></div></div>';
  html+='<div class="adm-stat-card"><div class="adm-stat-icon green"><i class="fas fa-bangladeshi-taka-sign"></i></div><div class="adm-stat-info"><h4>'+fmtPrice(revenue)+'</h4><p>Total Revenue</p></div></div>';
  html+='<div class="adm-stat-card"><div class="adm-stat-icon red"><i class="fas fa-exclamation-triangle"></i></div><div class="adm-stat-info"><h4>'+outOfStock+'</h4><p>Out of Stock</p></div></div></div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
  html+='<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Recent Orders</h3></div>';
  if(recentOrders.length){html+='<table class="adm-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>';
  recentOrders.forEach(function(o){var in2=o.items.map(function(it){return it.name;}).join(', ');if(in2.length>35)in2=in2.substring(0,35)+'...';
  html+='<tr><td style="font-weight:600;color:var(--gold);white-space:nowrap">'+o.id+'</td><td>'+o.customer.name+'</td><td style="font-size:12px;color:var(--lg);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+in2+'</td><td>'+fmtPrice(o.total)+'</td><td><span class="adm-status '+o.status+'">'+o.status+'</span>'+(o.paid?' <span class="adm-paid-badge">Paid</span>':'')+'</td></tr>';});
  html+='</tbody></table>';}else{html+='<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders yet</div>';}html+='</div>';
  var cats={};products.forEach(function(p){cats[p.category]=(cats[p.category]||0)+1;});
  html+='<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>Products by Category</h3></div><table class="adm-table"><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>';
  for(var c in cats){html+='<tr><td><span class="adm-table-cat">'+c+'</span></td><td>'+cats[c]+'</td></tr>';}html+='</tbody></table></div></div>';
  document.getElementById('admDashboard').innerHTML=html;
}

var admProdSearchQ='';var admProdFilterCat='';
function renderAdminProducts(){
  var list=products.slice();
  if(admProdFilterCat)list=list.filter(function(p){return p.category===admProdFilterCat;});
  if(admProdSearchQ){var q=admProdSearchQ.toLowerCase();list=list.filter(function(p){return p.name.toLowerCase().indexOf(q)!==-1||p.id.toString().indexOf(q)!==-1;});}
  var html='<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>All Products ('+list.length+')</h3><div class="adm-table-actions">';
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
      html+='<tr><td><img src="'+p.image+'" class="adm-table-img" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=No+Img\'"></td>';
      html+='<td class="adm-table-name">'+p.name+'</td>';
      html+='<td><span class="adm-table-cat">'+p.category+(p.subCategory?' / '+p.subCategory:'')+'</span></td>';
      html+='<td>'+fmtPrice(p.price)+(p.oldPrice?' <br><span style="text-decoration:line-through;color:rgba(255,255,255,.3);font-size:11px">'+fmtPrice(p.oldPrice)+'</span>':'')+'</td>';
      html+='<td>'+(p.inStock?'<span class="adm-stock-yes"><i class="fas fa-check-circle"></i> In Stock</span>':'<span class="adm-stock-no"><i class="fas fa-times-circle"></i> Out</span>')+'</td>';
      html+='<td><div class="adm-actions"><button class="adm-act-btn" title="Edit" onclick="openEditProductModal('+p.id+')"><i class="fas fa-pen"></i></button><button class="adm-act-btn del" title="Delete" onclick="deleteProduct('+p.id+')"><i class="fas fa-trash"></i></button></div></td></tr>';
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
  document.getElementById('admModalOv').classList.add('active');document.getElementById('admProductModal').classList.add('active');
}
function openEditProductModal(id){
  var p=products.find(function(x){return x.id===id;});if(!p)return;
  admEditId=id;admFormColors=p.colors.slice();admFormSizes=p.sizes.slice();
  document.getElementById('admModalTitle').textContent='Edit Product';
  renderProductForm(p);
  document.getElementById('admModalOv').classList.add('active');document.getElementById('admProductModal').classList.add('active');
}
function closeAdmModal(){document.getElementById('admModalOv').classList.remove('active');document.getElementById('admProductModal').classList.remove('active');}
function escHtml(s){if(!s)return '';return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
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
  html+='<div class="adm-img-inputs"><div class="adm-img-url-wrap"><input type="text" id="afImage" value="'+escHtml(p.image)+'" placeholder="Paste image URL here" oninput="previewImgUrl(this.value)"></div>';
  html+='<div class="adm-img-or">&mdash; OR &mdash;</div>';
  html+='<div class="adm-img-upload-wrap"><div class="adm-img-upload-btn"><i class="fas fa-cloud-upload-alt"></i> Drag & Drop or Click to Upload Image<input type="file" id="afImageFile" accept="image/*" onchange="handleImageUpload(event)"></div></div></div></div>';
  html+='<div class="adm-form-full adm-form-group"><label>Colors</label><div class="adm-color-picks" id="afColorPicks">';
  ADMIN_COLORS.forEach(function(c){var isL=LIGHT_COLORS.indexOf(c.hex)!==-1;var isActive=p.colors.indexOf(c.hex)!==-1;
  html+='<div class="adm-color-pick'+(isL?' light-c':'')+(isActive?' active':'')+'" style="background:'+c.hex+'" title="'+c.name+'" onclick="toggleAdmColor(this,\''+c.hex+'\')"></div>';});
  html+='</div></div>';
  html+='<div class="adm-form-full adm-form-group"><label>Sizes</label><div class="adm-size-picks" id="afSizePicks">';
  var sizesToShow=(p.category==='perfume')?PERFUME_SIZES:ADMIN_SIZES;
  sizesToShow.forEach(function(s){var isActive=p.sizes.indexOf(s)!==-1;html+='<div class="adm-size-pick'+(isActive?' active':'')+'" onclick="toggleAdmSize(this,\''+s+'\')">'+s+'</div>';});
  html+='</div></div>';
  html+='<div class="adm-form-group"><label>Tag</label><select id="afTag"><option value="">None</option>';
  ['New','Hot','Sale'].forEach(function(t){html+='<option value="'+t+'"'+(p.tag===t?' selected':'')+'>'+t+'</option>';});
  html+='</select></div>';
  html+='<div class="adm-form-group" style="display:flex;align-items:flex-end;padding-bottom:2px"><label class="adm-form-check"><input type="checkbox" id="afStock" '+(p.inStock?'checked':'')+'><span>In Stock</span></label></div>';
  html+='<div class="adm-form-full adm-form-group"><label>Description</label><textarea id="afDesc" rows="3" placeholder="Product description">'+escHtml(p.description||'')+'</textarea></div>';
  html+='<div class="adm-form-bottom"><button class="adm-btn adm-btn-outline" type="button" onclick="closeAdmModal()">Cancel</button><button class="adm-btn" type="button" onclick="saveProductFromModal()"><i class="fas fa-save"></i> Save Product</button></div></div>';
  document.getElementById('admModalBody').innerHTML=html;
  updateSubCatOptions(p.subCategory);
}
function previewImgUrl(val){
  var prev=document.getElementById('afImgPreview');
  if(val){prev.innerHTML='<img src="'+val+'" onerror="this.parentElement.innerHTML=\'<span class=placeholder>Invalid URL</span>\'">';}
  else{prev.innerHTML='<span class="placeholder">No Image</span>';}
}
function handleImageUpload(e){
  var file=e.target.files[0];if(!file)return;
  if(!file.type.startsWith('image/')){showToast('Please select an image file');return;}
  if(file.size>5*1024*1024){showToast('Image must be under 5MB');return;}
  var reader=new FileReader();reader.onload=function(ev){var dataUrl=ev.target.result;document.getElementById('afImage').value=dataUrl;document.getElementById('afImgPreview').innerHTML='<img src="'+dataUrl+'">';};reader.readAsDataURL(file);
}
function updateSubCatOptions(sel){
  var cat=document.getElementById('afCat').value;var el=document.getElementById('afSubCat');var cats=SUB_CATS[cat]||[];
  var html='<option value="">Select Sub-Category</option>';cats.forEach(function(c){html+='<option value="'+c+'"'+(sel===c?' selected':'')+'>'+SUB_CAT_LABELS[c]+'</option>';});el.innerHTML=html;
  var sizeEl=document.getElementById('afSizePicks');var sizesToShow=(cat==='perfume')?PERFUME_SIZES:ADMIN_SIZES;var sizeHtml='';
  sizesToShow.forEach(function(s){var isActive=admFormSizes.indexOf(s)!==-1;sizeHtml+='<div class="adm-size-pick'+(isActive?' active':'')+'" onclick="toggleAdmSize(this,\''+s+'\')">'+s+'</div>';});sizeEl.innerHTML=sizeHtml;
}
function toggleAdmColor(el,hex){el.classList.toggle('active');var idx=admFormColors.indexOf(hex);if(idx===-1)admFormColors.push(hex);else admFormColors.splice(idx,1);}
function toggleAdmSize(el,size){el.classList.toggle('active');var idx=admFormSizes.indexOf(size);if(idx===-1)admFormSizes.push(size);else admFormSizes.splice(idx,1);}

// ★ Firestore এ প্রোডাক্ট সেভ / আপডেট
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
    prodData.id=admEditId;
    var idx=products.findIndex(function(p){return p.id===admEditId;});
    if(idx!==-1){products[idx]=prodData;}
    showToast('Product updated successfully');
  }else{
    var maxId=products.reduce(function(max,p){return p.id>max?p.id:max;},0);
    prodData.id=maxId+1;
    products.push(prodData);
    showToast('Product added successfully');
  }
  saveProducts();
  closeAdmModal();
  renderAdminProducts();
}

// ★ Firestore থেকে প্রোডাক্ট ডিলিট
function deleteProduct(id){
  var p=products.find(function(x){return x.id===id;});if(!p)return;
  if(!confirm('Are you sure you want to delete "'+p.name+'"?'))return;
  products=products.filter(function(x){return x.id!==id;});
  deleteProductFromFirestore(id);
  renderAdminProducts();
  showToast('Product deleted');
}

var admOrderSearchQ='';
function renderAdminOrders(){
  var list=orders.slice();
  if(admOrderSearchQ){var q=admOrderSearchQ.toLowerCase();list=list.filter(function(o){return o.id.toLowerCase().indexOf(q)!==-1||o.customer.name.toLowerCase().indexOf(q)!==-1||o.customer.phone.indexOf(q)!==-1;});}
  var html='<div class="adm-table-wrap"><div class="adm-table-hdr"><h3>All Orders ('+list.length+')</h3><div class="adm-table-actions">';
  html+='<div class="adm-search-wrap"><i class="fas fa-search"></i><input type="text" class="adm-search" placeholder="Search orders..." value="'+admOrderSearchQ+'" oninput="admOrderSearchQ=this.value;renderAdminOrders()"></div></div></div>';
  if(!list.length){html+='<div class="adm-table-empty"><i class="fas fa-inbox"></i>No orders found</div>';
  }else{
    html+='<div style="overflow-x:auto"><table class="adm-table"><thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function(o){
      var in2=o.items.map(function(it){return it.name;}).join(', ');if(in2.length>25)in2=in2.substring(0,25)+'...';
      html+='<tr><td style="font-weight:600;color:var(--gold);white-space:nowrap">'+o.id+'</td><td style="white-space:nowrap">'+o.date+'</td><td>'+o.customer.name+'<br><span style="font-size:11px;color:var(--lg)">'+o.customer.phone+'</span></td>';
      html+='<td style="font-size:12px;color:var(--lg)">'+o.items.length+' item(s)<br><span style="font-size:11px;color:rgba(255,255,255,.4)">'+in2+'</span></td>';
      html+='<td style="font-weight:600">'+fmtPrice(o.total)+'</td>';
      html+='<td>'+(o.paid?'<span class="adm-paid-badge">Paid</span>'+(o.txnId?'<br><span style="font-size:10px;color:var(--lg)">Txn: '+o.txnId+'</span>':''):'<span class="adm-unpaid-badge">Unpaid</span>')+'</td>';
      html+='<td><span class="adm-status '+o.status+'">'+o.status+'</span></td>';
      html+='<td><div class="adm-actions"><button class="adm-act-btn" title="View Details" onclick="openOrderDetailModal(\''+o.id+'\')"><i class="fas fa-eye"></i></button><button class="adm-act-btn del" title="Delete Order" onclick="deleteOrder(\''+o.id+'\')"><i class="fas fa-trash"></i></button></div></td></tr>';
    });
    html+='</tbody></table></div>';
  }
  html+='</div>';document.getElementById('admOrders').innerHTML=html;
}
function openOrderDetailModal(id){
  var o=orders.find(function(x){return x.id===id;});if(!o)return;
  var html='<div class="adm-order-info">';
  html+='<div class="adm-order-info-card"><h4>Customer Info</h4><p><strong>Name:</strong> '+o.customer.name+'</p><p><strong>Phone:</strong> '+o.customer.phone+'</p><p><strong>Email:</strong> '+o.customer.email+'</p></div>';
  html+='<div class="adm-order-info-card"><h4>Shipping Info</h4><p>'+o.customer.address+'</p>'+(o.customer.notes?'<p><strong>Notes:</strong> '+o.customer.notes+'</p>':'')+'</div></div>';
  html+='<div class="adm-order-info" style="margin-bottom:20px">';
  html+='<div class="adm-order-info-card"><h4>Payment Info</h4><p><strong>Method:</strong> '+(o.payMethod==='cod'?'Cash on Delivery':o.payMethod==='bkash'?'bKash':'Nagad')+'</p><p><strong>Status:</strong> '+(o.paid?'<span class="adm-paid-badge">Paid</span>':'<span class="adm-unpaid-badge">Unpaid</span>')+'</p>'+(o.txnId?'<p><strong>Transaction ID:</strong> '+o.txnId+'</p>':'')+'</div>';
  html+='<div class="adm-order-info-card"><h4>Order Info</h4><p><strong>Order ID:</strong> <span style="color:var(--gold)">'+o.id+'</span></p><p><strong>Date:</strong> '+o.date+'</p><p><strong>Status:</strong> <span class="adm-status '+o.status+'">'+o.status+'</span></p></div></div>';
  html+='<h4 style="font-family:var(--fh);font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:12px">Order Items</h4>';
  html+='<div class="adm-order-items">';
  o.items.forEach(function(item){html+='<div class="adm-order-item"><img src="'+item.image+'" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=Img\'"><div class="adm-order-item-info"><h5>'+item.name+'</h5><p>'+(item.color?'Color: '+item.color:'')+(item.size?' | Size: '+item.size:'')+' | Qty: '+item.qty+'</p></div><div class="adm-order-item-price">'+fmtPrice(item.price*item.qty)+'</div></div>';});
  html+='</div><div class="adm-order-total"><span>Total:</span><strong>'+fmtPrice(o.total)+'</strong></div>';
  html+='<div style="margin-top:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap"><label style="font-family:var(--fh);font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--lg)">Update Status:</label>';
  html+='<select id="admOrderStatus" style="padding:10px 16px;background:var(--bg);border:1px solid rgba(255,255,255,.08);color:var(--w);outline:none;cursor:pointer">';
  ['pending','processing','shipped','delivered'].forEach(function(s){html+='<option value="'+s+'"'+(o.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>';});
  html+='</select><button class="adm-btn" onclick="updateOrderStatus(\''+o.id+'\')"><i class="fas fa-save"></i> Update</button></div>';
  document.getElementById('admOrderBody').innerHTML=html;document.getElementById('admOrderOv').classList.add('active');document.getElementById('admOrderModal').classList.add('active');
}
function closeAdmOrderModal(){document.getElementById('admOrderOv').classList.remove('active');document.getElementById('admOrderModal').classList.remove('active');}

// ★ Firestore এ অর্ডার স্ট্যাটাস আপডেট
function updateOrderStatus(id){
  var newStatus=document.getElementById('admOrderStatus').value;
  var idx=orders.findIndex(function(o){return o.id===id;});
  if(idx!==-1){orders[idx].status=newStatus;saveOrders();closeAdmOrderModal();renderAdminOrders();showToast('Order status updated to '+newStatus);}
}

// ★ Firestore থেকে অর্ডার ডিলিট
function deleteOrder(id){
  if(!confirm('Are you sure you want to delete order '+id+'?'))return;
  orders=orders.filter(function(o){return o.id!==id;});
  db.collection('orders').doc(id).delete().catch(function(err){console.error('Delete order error:',err);});
  renderAdminOrders();showToast('Order '+id+' deleted');
}

function renderAdminSettings(){
  var html='<div class="adm-settings-card"><h3>Change Admin Password</h3>';
  html+='<div class="adm-form-group"><label>Current Password</label><input type="password" id="setCurrPass"></div>';
  html+='<div class="adm-form-group"><label>New Password</label><input type="password" id="setNewPass"></div>';
  html+='<div class="adm-form-group"><label>Confirm New Password</label><input type="password" id="setConfPass"></div>';
  html+='<button class="adm-btn" onclick="changeAdminPass()"><i class="fas fa-key"></i> Update Password</button></div>';
  html+='<div class="adm-settings-card"><h3>Data Management</h3><p style="font-size:13px;color:var(--lg);margin-bottom:16px">Manage your store data.</p>';
  html+='<div style="display:flex;gap:12px;flex-wrap:wrap"><button class="adm-btn adm-btn-outline" onclick="exportData()"><i class="fas fa-download"></i> Export All Data</button>';
  html+='<button class="adm-btn adm-btn-outline" onclick="document.getElementById(\'importFileInput\').click()"><i class="fas fa-upload"></i> Import Products</button>';
  html+='<input type="file" id="importFileInput" accept=".json" style="display:none" onchange="importData(event)"></div></div>';
  html+='<div class="adm-settings-card adm-danger-zone"><h3>Danger Zone</h3><p>These actions are irreversible.</p>';
  html+='<div style="display:flex;gap:12px;flex-wrap:wrap"><button class="adm-btn adm-btn-danger" onclick="resetProducts()"><i class="fas fa-box-open"></i> Reset Products</button>';
  html+='<button class="adm-btn adm-btn-danger" onclick="resetAllData()"><i class="fas fa-trash-alt"></i> Reset Everything</button></div></div>';
  document.getElementById('admSettings').innerHTML=html;
}
function changeAdminPass(){
  var curr=document.getElementById('setCurrPass').value;var newP=document.getElementById('setNewPass').value;var conf=document.getElementById('setConfPass').value;
  if(curr!==getAdminPass()){showToast('Current password is incorrect');return;}
  if(!newP||newP.length<4){showToast('New password must be at least 4 characters');return;}
  if(newP!==conf){showToast('New passwords do not match');return;}
  setAdminPass(newP);document.getElementById('setCurrPass').value='';document.getElementById('setNewPass').value='';document.getElementById('setConfPass').value='';showToast('Password changed successfully');
}
function exportData(){
  var data={products:products,orders:orders};var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fashion_garage_data.json';a.click();showToast('Data exported successfully');
}
function importData(e){
  var file=e.target.files[0];if(!file)return;var reader=new FileReader();
  reader.onload=function(ev){try{var data=JSON.parse(ev.target.result);if(data.products&&Array.isArray(data.products)){products=data.products;saveProducts();showToast('Imported '+products.length+' products');renderAdminProducts();}else{showToast('Invalid file format');}}catch(err){showToast('Error reading file');}};
  reader.readAsText(file);e.target.value='';
}
function resetProducts(){
  if(!confirm('This will delete all current products from database. Continue?'))return;
  // Firestore থেকে সব প্রোডাক্ট ডিলিট
  var batch=db.batch();
  products.forEach(function(p){batch.delete(db.collection('products').doc(String(p.id)));});
  batch.commit().then(function(){products=[];showToast('Products reset');renderAdminProducts();}).catch(function(err){console.error(err);showToast('Error resetting products');});
}
function resetAllData(){
  if(!confirm('WARNING: This will delete ALL data from database. Continue?'))return;
  var batch=db.batch();
  products.forEach(function(p){batch.delete(db.collection('products').doc(String(p.id)));});
  orders.forEach(function(o){batch.delete(db.collection('orders').doc(o.id));});
  batch.delete(db.collection('store').doc('counter'));
  batch.commit().then(function(){
    products=[];orders=[];nextOrderId=1001;localStorage.removeItem('fg_products_cache');localStorage.removeItem('fg_orders_cache');localStorage.removeItem('fg_nextOrderId');localStorage.removeItem('fg_firebase_users');
    adminShowSec('dashboard');showToast('All data has been reset');
  }).catch(function(err){console.error(err);showToast('Error resetting data');});
}

/* ==========================================
   UTILITY FUNCTIONS
   ========================================== */
function fmtPrice(n){return '৳'+Number(n).toLocaleString('en-BD');}
function showToast(msg){
  var t=document.getElementById('toast');var m=document.getElementById('toastMsg');m.textContent=msg;t.classList.add('show');
  clearTimeout(t._timer);t._timer=setTimeout(function(){t.classList.remove('show');},3000);
}
function debounce(fn,ms){var t;return function(){var a=arguments,c=this;clearTimeout(t);t=setTimeout(function(){fn.apply(c,a);},ms);};}

/* ==========================================
   HERO SLIDER
   ========================================== */
function initHeroSlider(){
  var track=document.getElementById('heroTrack');var slides=track.querySelectorAll('.hero-slide');
  var dotsC=document.getElementById('heroDots');
  for(var i=0;i<slides.length;i++){var d=document.createElement('div');d.className='s-dot'+(i===0?' active':'');d.onclick=(function(idx){return function(){goToSlide(idx);};})(i);dotsC.appendChild(d);}
  startSlider();
}
function goToSlide(n){
  var track=document.getElementById('heroTrack');var slides=track.querySelectorAll('.hero-slide');
  if(n<0)n=slides.length-1;if(n>=slides.length)n=0;currentSlide=n;
  track.style.transform='translateX(-'+n*100+'%)';
  var dots=document.querySelectorAll('.s-dot');dots.forEach(function(d,i){d.classList.toggle('active',i===n);});
  restartSlider();
}
function heroSlide(dir){goToSlide(currentSlide+dir);}
function startSlider(){slideInterval=setInterval(function(){heroSlide(1);},5000);}
function restartSlider(){clearInterval(slideInterval);startSlider();}

/* ==========================================
   SCROLL EFFECTS
   ========================================== */
function initScrollEffects(){
  var nav=document.getElementById('mainNav');var stBtn=document.getElementById('scrollTop');
  window.addEventListener('scroll',function(){
    nav.classList.toggle('scrolled',window.scrollY>50);
    stBtn.classList.toggle('show',window.scrollY>400);
    document.querySelectorAll('.fade-in').forEach(function(el){if(isInViewport(el))el.classList.add('visible');});
  });
  document.querySelectorAll('.fade-in').forEach(function(el){if(isInViewport(el))el.classList.add('visible');});
}
function isInViewport(el){var r=el.getBoundingClientRect();return r.top<window.innerHeight-80;}

/* ==========================================
   MOBILE NAV
   ========================================== */
document.getElementById('mobToggle').addEventListener('click',function(){
  this.classList.toggle('active');document.getElementById('mobNav').classList.toggle('active');
  document.getElementById('mobOverlay').classList.toggle('active');document.body.style.overflow=this.classList.contains('active')?'hidden':'';
});
document.getElementById('mobOverlay').addEventListener('click',closeMob);
function toggleMobAcc(e){e.preventDefault();document.getElementById('mobSub').classList.toggle('open');document.getElementById('mobAccTog').classList.toggle('open');}

/* ==========================================
   PAGE NAVIGATION & SPA
   ========================================== */
document.addEventListener('DOMContentLoaded',function(){
  products=loadProductsCache();orders=loadOrdersCache();
  initHeroSlider();initScrollEffects();renderTrending();
  initFirestoreListeners();
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

/* ==========================================
   TRENDING / NEW ARRIVALS (HOME)
   ========================================== */
function renderTrending(){
  var prods=products.slice().filter(function(p){return p.inStock;}).sort(function(a,b){return b.id-a.id;}).slice(0,8);
  var grid=document.getElementById('trendGrid');if(!grid)return;
  if(!prods.length){grid.innerHTML='<div class="cprod-empty">No products yet. Check back soon!</div>';return;}
  grid.innerHTML=prods.map(function(p){return renderProductCard(p);}).join('');
}

/* ==========================================
   CATEGORY PAGE
   ========================================== */
function initCategoryPage(cat,gridId,countId,filterId,subFilter){
  var allProds=products.slice();
  var filtered;
  if(cat==='offer'){filtered=allProds.filter(function(p){return p.oldPrice>0;});}
  else if(cat==='accessories'){
    var accCats=['watch','bag','perfume','jewelry','sunglasses','homedecor'];
    if(subFilter){filtered=allProds.filter(function(p){return p.category===subFilter;});}
    else{filtered=allProds.filter(function(p){return accCats.indexOf(p.category)!==-1;});}
  }else{filtered=allProds.filter(function(p){return p.category===cat;});}
  _currentCatProducts=filtered;_activeSubFilter=subFilter||'';_activeSizes=[];_activePriceRange='';_activeSort='';
  renderFilterSidebar(filterId,cat,subFilter);
  filterAndRender(gridId,countId,filtered);
}
function renderFilterSidebar(filterId,cat,subFilter){
  var el=document.getElementById(filterId);if(!el)return;
  var html='<div class="filter-group"><h4 class="filter-title">Sub Category</h4><div class="filter-options">';
  var subs=SUB_CATS[cat]||[];
  if(!subs.length && subFilter){subs=SUB_CATS[subFilter]||[];}
  html+='<label class="filter-opt'+(_activeSubFilter===''?' active':'')+'"><input type="radio" name="'+filterId+'sub" value="" '+(_activeSubFilter===''?'checked':'')+' onchange="applySubFilter(\'\',\''+filterId+'\')"><span>All</span></label>';
  subs.forEach(function(s){html+='<label class="filter-opt'+(_activeSubFilter===s?' active':'')+'"><input type="radio" name="'+filterId+'sub" value="'+s+'" '+(_activeSubFilter===s?'checked':'')+' onchange="applySubFilter(\''+'\',\''+filterId+'\')"><span>'+SUB_CAT_LABELS[s]+'</span></label>';});
  // Fix: properly set the onchange for each sub
  html=''; // rebuild properly
  html+='<label class="filter-opt'+(_activeSubFilter===''?' active':'')+'"><input type="radio" name="'+filterId+'sub" value="" '+(_activeSubFilter===''?'checked':'')+' onchange="applySubFilter(\'\',\''+filterId+'\')"><span>All</span></label>';
  subs.forEach(function(s){
    html+='<label class="filter-opt'+(_activeSubFilter===s?' active':'')+'"><input type="radio" name="'+filterId+'sub" value="'+s+'" '+(_activeSubFilter===s?'checked':'')+' onchange="applySubFilter(\''+s+'\',\''+filterId+'\')"><span>'+SUB_CAT_LABELS[s]+'</span></label>';
  });
  html+='</div></div>';

  html+='<div class="filter-group"><h4 class="filter-title">Size</h4><div class="filter-options filter-size-options">';
  var sizeList=(cat==='perfume'||subFilter==='perfume')?PERFUME_SIZES:ADMIN_SIZES;
  sizeList.forEach(function(s){html+='<label class="filter-opt filter-size-opt'+(_activeSizes.indexOf(s)!==-1?' active':'')+'" onclick="toggleSizeFilter(\''+s+'\',this,\''+filterId+'\')"><span>'+s+'</span></label>';});
  html+='</div></div>';

  html+='<div class="filter-group"><h4 class="filter-title">Price Range</h4><div class="filter-options">';
  var priceRanges=[{label:'All',value:''},{label:'Under ৳1000',value:'0-1000'},{label:'৳1000 - ৳3000',value:'1000-3000'},{label:'৳3000 - ৳5000',value:'3000-5000'},{label:'Above ৳5000',value:'5000-999999'}];
  priceRanges.forEach(function(pr){html+='<label class="filter-opt'+(_activePriceRange===pr.value?' active':'')+'"><input type="radio" name="'+filterId+'price" value="'+pr.value+'" '+(_activePriceRange===pr.value?'checked':'')+' onchange="applyPriceFilter(\''+pr.value+'\',\''+filterId+'\')"><span>'+pr.label+'</span></label>';});
  html+='</div></div>';

  html+='<div class="filter-group"><h4 class="filter-title">Sort By</h4><div class="filter-options">';
  var sorts=[{label:'Default',value:''},{label:'Price: Low to High',value:'price-asc'},{label:'Price: High to Low',value:'price-desc'},{label:'Newest First',value:'newest'},{label:'Name A-Z',value:'name-asc'}];
  sorts.forEach(function(s){html+='<label class="filter-opt'+(_activeSort===s.value?' active':'')+'"><input type="radio" name="'+filterId+'sort" value="'+s.value+'" '+(_activeSort===s.value?'checked':'')+' onchange="applySortFilter(\''+s.value+'\',\''+filterId+'\')"><span>'+s.label+'</span></label>';});
  html+='</div></div>';

  el.innerHTML=html;
}
function applySubFilter(val,filterId){_activeSubFilter=val;renderFilterSidebar(filterId,currentPageInfo.page==='accessories'?(_activeSubFilter||'accessories'):currentPageInfo.page,_activeSubFilter||null);filterAndRender(currentPageInfo.gridId,currentPageInfo.countId,_currentCatProducts);}
function toggleSizeFilter(size,el,filterId){
  var idx=_activeSizes.indexOf(size);if(idx===-1)_activeSizes.push(size);else _activeSizes.splice(idx,1);
  el.classList.toggle('active');
  filterAndRender(currentPageInfo.gridId,currentPageInfo.countId,_currentCatProducts);
}
function applyPriceFilter(val,filterId){_activePriceRange=val;renderFilterSidebar(filterId,currentPageInfo.page==='accessories'?(_activeSubFilter||'accessories'):currentPageInfo.page,_activeSubFilter||null);filterAndRender(currentPageInfo.gridId,currentPageInfo.countId,_currentCatProducts);}
function applySortFilter(val,filterId){_activeSort=val;renderFilterSidebar(filterId,currentPageInfo.page==='accessories'?(_activeSubFilter||'accessories'):currentPageInfo.page,_activeSubFilter||null);filterAndRender(currentPageInfo.gridId,currentPageInfo.countId,_currentCatProducts);}

function filterAndRender(gridId,countId,allProds){
  var list=allProds.slice();
  if(_activeSubFilter){list=list.filter(function(p){return p.subCategory===_activeSubFilter;});}
  if(_activeSizes.length){list=list.filter(function(p){return _activeSizes.some(function(s){return p.sizes.indexOf(s)!==-1;});});}
  if(_activePriceRange){
    var parts=_activePriceRange.split('-');var min=parseInt(parts[0]);var max=parseInt(parts[1]);
    list=list.filter(function(p){return p.price>=min&&p.price<=max;});
  }
  if(_activeSort==='price-asc')list.sort(function(a,b){return a.price-b.price;});
  else if(_activeSort==='price-desc')list.sort(function(a,b){return b.price-a.price;});
  else if(_activeSort==='newest')list.sort(function(a,b){return b.id-a.id;});
  else if(_activeSort==='name-asc')list.sort(function(a,b){return a.name.localeCompare(b.name);});
  var grid=document.getElementById(gridId);var countEl=document.getElementById(countId);
  if(countEl)countEl.textContent='Showing '+list.length+' product'+(list.length!==1?'s':'');
  if(!grid)return;
  if(!list.length){grid.innerHTML='<div class="cprod-empty">No products found matching your filters.</div>';return;}
  grid.innerHTML=list.map(function(p){return renderProductCard(p);}).join('');
}

/* ==========================================
   PRODUCT CARD
   ========================================== */
function renderProductCard(p){
  var isWl=wishlist.has(p.id);
  var discount=p.oldPrice?Math.round((1-p.price/p.oldPrice)*100):0;
  var html='<div class="cprod-card">';
  html+='<div class="cprod-img-wrap"><img src="'+p.image+'" alt="'+escHtml(p.name)+'" class="cprod-img" onerror="this.src=\'https://via.placeholder.com/300x380/121212/d4a017?text=No+Image\'">';
  if(p.tag)html+='<span class="cprod-tag '+p.tag.toLowerCase()+'">'+p.tag.toUpperCase()+'</span>';
  if(discount>0)html+='<span class="cprod-discount">-'+discount+'%</span>';
  html+='<button class="cprod-wl'+(isWl?' active':'')+'" onclick="event.stopPropagation();toggleWishlist('+p.id+')"><i class="fas fa-heart"></i></button>';
  html+='<button class="cprod-quick" onclick="event.stopPropagation();openPM('+p.id+')"><i class="fas fa-eye"></i></button>';
  html+='</div>';
  html+='<div class="cprod-info" onclick="openPM('+p.id+')">';
  html+='<h3 class="cprod-name">'+escHtml(p.name)+'</h3>';
  html+='<div class="cprod-price">'+fmtPrice(p.price)+(p.oldPrice?'<span class="cprod-old">'+fmtPrice(p.oldPrice)+'</span>':'')+'</div>';
  if(p.colors&&p.colors.length){html+='<div class="cprod-colors">';p.colors.slice(0,6).forEach(function(c){var isL=LIGHT_COLORS.indexOf(c)!==-1;html+='<span class="cprod-cdot" style="background:'+c+';'+(isL?'box-shadow:inset 0 0 0 1px rgba(0,0,0,.2);':'')+'"></span>';});if(p.colors.length>6)html+='<span class="cprod-cdot cprod-cdot-more">+'+( p.colors.length-6)+'</span>';html+='</div>';}
  if(!p.inStock)html+='<div class="cprod-oos">Out of Stock</div>';
  html+='</div></div>';
  return html;
}

/* ==========================================
   PRODUCT MODAL
   ========================================== */
function openPM(id){
  var p=products.find(function(x){return x.id===id;});if(!p)return;
  pmCurrentProduct=p;pmSelectedColor=p.colors&&p.colors.length?p.colors[0]:'';pmSelectedSize=p.sizes&&p.sizes.length?p.sizes[0]:'';pmQuantity=1;
  document.getElementById('pmImg').src=p.image;
  document.getElementById('pmImg').onerror=function(){this.src='https://via.placeholder.com/500x600/121212/d4a017?text=No+Image';};
  document.getElementById('pmName').textContent=p.name;
  var tagHtml='';if(p.tag)tagHtml='<span class="cprod-tag '+p.tag.toLowerCase()+'">'+p.tag.toUpperCase()+'</span>';if(p.oldPrice)tagHtml+='<span class="cprod-discount" style="display:inline-block;margin-left:8px">-'+Math.round((1-p.price/p.oldPrice)*100)+'%</span>';
  document.getElementById('pmTag').innerHTML=tagHtml;
  var priceHtml='<span class="pm-price-now">'+fmtPrice(p.price)+'</span>'+(p.oldPrice?'<span class="pm-price-old">'+fmtPrice(p.oldPrice)+'</span>':'');
  document.getElementById('pmPrice').innerHTML=priceHtml;
  var colorsHtml='';if(p.colors&&p.colors.length){p.colors.forEach(function(c){var isL=LIGHT_COLORS.indexOf(c)!==-1;colorsHtml+='<div class="pm-color'+(pmSelectedColor===c?' active':'')+'" style="background:'+c+';'+(isL?'box-shadow:inset 0 0 0 1px rgba(0,0,0,.2);':'')+'" onclick="selectPMColor(this,\''+c+'\')"></div>';});}
  document.getElementById('pmColors').innerHTML=colorsHtml;
  var sizesHtml='';if(p.sizes&&p.sizes.length){p.sizes.forEach(function(s){sizesHtml+='<div class="pm-size'+(pmSelectedSize===s?' active':'')+'" onclick="selectPMSize(this,\''+s+'\')">'+s+'</div>';});}
  document.getElementById('pmSizes').innerHTML=sizesHtml;
  document.getElementById('pmQtyVal').textContent='1';
  var addBtn=document.getElementById('pmAddBtn');
  if(!p.inStock){addBtn.textContent='Out of Stock';addBtn.disabled=true;addBtn.style.opacity='.5';}
  else{addBtn.textContent='Add to Cart';addBtn.disabled=false;addBtn.style.opacity='1';}
  document.getElementById('pmOv').classList.add('active');document.getElementById('pmModal').classList.add('active');document.body.style.overflow='hidden';
}
function closePM(){document.getElementById('pmOv').classList.remove('active');document.getElementById('pmModal').classList.remove('active');document.body.style.overflow='';}
function selectPMColor(el,c){document.querySelectorAll('.pm-color').forEach(function(e){e.classList.remove('active');});el.classList.add('active');pmSelectedColor=c;}
function selectPMSize(el,s){document.querySelectorAll('.pm-size').forEach(function(e){e.classList.remove('active');});el.classList.add('active');pmSelectedSize=s;}
function pmQty(dir){pmQuantity+=dir;if(pmQuantity<1)pmQuantity=1;if(pmQuantity>10)pmQuantity=10;document.getElementById('pmQtyVal').textContent=pmQuantity;}
function pmAddToCart(){
  if(!pmCurrentProduct||!pmCurrentProduct.inStock)return;
  if(!isLoggedIn()){pendingCartAction=function(){pmAddToCart();};openLogin();return;}
  addToCart(pmCurrentProduct.id,pmSelectedColor,pmSelectedSize,pmQuantity);
  closePM();
}

/* ==========================================
   CART
   ========================================== */
function addToCart(productId,color,size,qty){
  var p=products.find(function(x){return x.id===productId;});if(!p)return;
  var existing=cart.find(function(c){return c.productId===productId&&c.color===color&&c.size===size;});
  if(existing){existing.qty+=qty;}else{cart.push({productId:productId,name:p.name,image:p.image,price:p.price,color:color,size:size,qty:qty});}
  updateCartBadge();showToast(p.name+' added to cart');
}
function removeFromCart(idx){cart.splice(idx,1);updateCartBadge();renderCartItems();}
function changeCartQty(idx,dir){
  cart[idx].qty+=dir;if(cart[idx].qty<1)cart[idx].qty=1;if(cart[idx].qty>10)cart[idx].qty=10;
  renderCartItems();updateCartBadge();
}
function updateCartBadge(){
  var total=cart.reduce(function(s,c){return s+c.qty;},0);
  document.getElementById('cartBadge').textContent=total;
}
function openCart(){renderCartItems();document.getElementById('cartOv').classList.add('active');document.getElementById('cartSb').classList.add('active');document.body.style.overflow='hidden';}
function closeCart(){document.getElementById('cartOv').classList.remove('active');document.getElementById('cartSb').classList.remove('active');document.body.style.overflow='';}
function renderCartItems(){
  var container=document.getElementById('cartItems');var total=0;
  if(!cart.length){container.innerHTML='<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your bag is empty</p></div>';document.getElementById('cartTotal').textContent='৳0';return;}
  var html='';
  cart.forEach(function(item,i){
    var itemTotal=item.price*item.qty;total+=itemTotal;
    html+='<div class="cart-item"><div class="cart-item-img"><img src="'+item.image+'" onerror="this.src=\'https://via.placeholder.com/60x70/121212/d4a017?text=Img\'"></div>';
    html+='<div class="cart-item-info"><h4>'+escHtml(item.name)+'</h4><p>'+(item.color?'<span class="cart-item-dot" style="background:'+item.color+'"></span> ':'')+(item.size?'Size: '+item.size:'')+'</p>';
    html+='<div class="cart-item-bottom"><div class="cart-item-qty"><button onclick="changeCartQty('+i+',-1)"><i class="fas fa-minus"></i></button><span>'+item.qty+'</span><button onclick="changeCartQty('+i+',1)"><i class="fas fa-plus"></i></button></div>';
    html+='<span class="cart-item-price">'+fmtPrice(itemTotal)+'</span></div></div>';
    html+='<button class="cart-item-remove" onclick="removeFromCart('+i+')"><i class="fas fa-times"></i></button></div>';
  });
  container.innerHTML=html;document.getElementById('cartTotal').textContent=fmtPrice(total);
}

/* ==========================================
   WISHLIST
   ========================================== */
function toggleWishlist(id){
  if(wishlist.has(id)){wishlist.delete(id);showToast('Removed from wishlist');}
  else{wishlist.add(id);var p=products.find(function(x){return x.id===id;});showToast((p?p.name:'Item')+' added to wishlist');}
  updateWlBadge();refreshCurrentView();
}
function updateWlBadge(){document.getElementById('wlBadge').textContent=wishlist.size;}
function openWishlist(){
  var container=document.getElementById('wlItems');
  if(!wishlist.size){container.innerHTML='<div class="cart-empty"><i class="fas fa-heart"></i><p>Your wishlist is empty</p></div>';}
  else{
    var html='';
    wishlist.forEach(function(id){
      var p=products.find(function(x){return x.id===id;});if(!p)return;
      html+='<div class="cart-item"><div class="cart-item-img"><img src="'+p.image+'" onerror="this.src=\'https://via.placeholder.com/60x70/121212/d4a017?text=Img\'"></div>';
      html+='<div class="cart-item-info"><h4>'+escHtml(p.name)+'</h4><p>'+fmtPrice(p.price)+(p.oldPrice?' <span style="text-decoration:line-through;color:rgba(255,255,255,.3);font-size:11px">'+fmtPrice(p.oldPrice)+'</span>':'')+'</p>';
      html+='<div class="cart-item-bottom"><button class="pm-add" style="padding:6px 14px;font-size:11px" onclick="addToCartFromWl('+p.id+')"><i class="fas fa-shopping-bag"></i> Add to Cart</button></div></div>';
      html+='<button class="cart-item-remove" onclick="toggleWishlist('+p.id+');openWishlist()"><i class="fas fa-times"></i></button></div>';
    });
    container.innerHTML=html;
  }
  document.getElementById('wlOv').classList.add('active');document.getElementById('wlSb').classList.add('active');document.body.style.overflow='hidden';
}
function addToCartFromWl(id){
  var p=products.find(function(x){return x.id===id;});if(!p)return;
  if(!isLoggedIn()){pendingCartAction=function(){addToCartFromWl(id);};openLogin();return;}
  var color=p.colors&&p.colors.length?p.colors[0]:'';var size=p.sizes&&p.sizes.length?p.sizes[0]:'';
  addToCart(id,color,size,1);
}
function closeWishlist(){document.getElementById('wlOv').classList.remove('active');document.getElementById('wlSb').classList.remove('active');document.body.style.overflow='';}

/* ==========================================
   SEARCH
   ========================================== */
function openSearch(){document.getElementById('searchOv').classList.add('active');document.body.style.overflow='hidden';setTimeout(function(){document.getElementById('searchInput').focus();},200);}
function closeSearch(){document.getElementById('searchOv').classList.remove('active');document.getElementById('searchInput').value='';document.getElementById('searchResults').innerHTML='';document.body.style.overflow='';}
var performSearch=debounce(function(q){
  var container=document.getElementById('searchResults');
  if(!q||q.length<2){container.innerHTML='<div class="search-empty">Type at least 2 characters to search</div>';return;}
  var ql=q.toLowerCase();var results=products.filter(function(p){return p.name.toLowerCase().indexOf(ql)!==-1||p.category.toLowerCase().indexOf(ql)!==-1||(p.subCategory&&p.subCategory.toLowerCase().indexOf(ql)!==-1);});
  if(!results.length){container.innerHTML='<div class="search-empty">No products found for "'+escHtml(q)+'"</div>';return;}
  container.innerHTML=results.slice(0,10).map(function(p){return '<div class="search-item" onclick="closeSearch();openPM('+p.id+')"><img src="'+p.image+'" onerror="this.src=\'https://via.placeholder.com/50x60/121212/d4a017?text=Img\'"><div class="search-item-info"><h4>'+escHtml(p.name)+'</h4><p>'+fmtPrice(p.price)+'</p></div></div>';}).join('');
},300);

/* ==========================================
   CHECKOUT
   ========================================== */
function openCheckout(){
  if(!cart.length){showToast('Your cart is empty');return;}
  closeCart();
  var user=getLoggedUser();
  if(user){document.getElementById('coName').value=user.name;document.getElementById('coEmail').value=user.email;document.getElementById('coPhone').value=user.phone;}
  document.getElementById('coOv').classList.add('active');document.getElementById('coModal').classList.add('active');document.body.style.overflow='hidden';
}
function closeCheckout(){document.getElementById('coOv').classList.remove('active');document.getElementById('coModal').classList.remove('active');document.body.style.overflow='';}
function toggleTxnField(){var v=document.getElementById('coPayMethod').value;document.getElementById('coTxnField').style.display=(v==='cod')?'none':'block';}

// ★ Firestore এ অর্ডার সেভ + কাউন্টার আপডেট
function submitOrder(){
  var name=document.getElementById('coName').value.trim();var email=document.getElementById('coEmail').value.trim();
  var phone=document.getElementById('coPhone').value.trim();var address=document.getElementById('coAddress').value.trim();
  var notes=document.getElementById('coNotes').value.trim();var payMethod=document.getElementById('coPayMethod').value;
  var txnId=document.getElementById('coTxnId').value.trim();
  if(!name||!email||!phone||!address){showToast('Please fill in all required fields');return;}
  if(payMethod!=='cod'&&!txnId){showToast('Please enter transaction ID for '+payMethod);return;}
  var total=cart.reduce(function(s,c){return s+c.price*c.qty;},0);
  var orderId='FG-'+String(nextOrderId).padStart(5,'0');
  var order={
    id:orderId,date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
    customer:{name:name,email:email,phone:phone,address:address,notes:notes},
    items:cart.slice(),total:total,payMethod:payMethod,txnId:txnId,
    paid:payMethod!=='cod',status:'pending'
  };
  orders.push(order);
  nextOrderId++;
  saveOrders();
  // Firestore এ কাউন্টার আপডেট
  db.collection('store').doc('counter').set({nextOrderId:nextOrderId}).catch(function(err){console.error('Counter update error:',err);});
  saveNextOrderId();

  cart=[];updateCartBadge();closeCheckout();
  showToast('Order placed successfully! Order ID: '+orderId);
}

/* ==========================================
   NEWSLETTER
   ========================================== */
function subscribeNL(e){
  e.preventDefault();var input=e.target.querySelector('input');if(!input.value){showToast('Please enter your email');return;}
  showToast('Thank you for subscribing!');input.value='';return false;
}
