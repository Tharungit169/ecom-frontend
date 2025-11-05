import React, {useEffect, useState} from 'react';
const API = process.env.REACT_APP_API_URL || 'http://localhost:4242';

function saveToken(t){ localStorage.setItem('token', t); }
function getToken(){ return localStorage.getItem('token'); }
function saveUser(u){ localStorage.setItem('user', JSON.stringify(u)); }
function getUser(){ const v = localStorage.getItem('user'); return v ? JSON.parse(v): null; }

export default function App(){
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [user, setUser] = useState(getUser());
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login | register
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(()=>{ fetch(API + '/api/products').then(r=>r.json()).then(setProducts); },[]);

  const add = (id)=> setCart(c=> ({...c, [id]: (c[id]||0)+1}));
  const remove = (id)=> setCart(c=> { const nc={...c}; if(!nc[id]) return nc; nc[id]--; if(nc[id]<=0) delete nc[id]; return nc; });

  async function login(username,password){
    setLoading(true);
    const res = await fetch(API + '/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,password})});
    const data = await res.json();
    setLoading(false);
    if(data.token){ saveToken(data.token); saveUser(data.user); setUser(data.user); setShowAuth(false); setSuccessMsg('Welcome back, '+data.user.username); setTimeout(()=>setSuccessMsg(''),3000); }
    else alert(data.error || 'Login failed');
  }
  async function register(username,password){
    setLoading(true);
    const res = await fetch(API + '/api/register', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,password})});
    const data = await res.json();
    setLoading(false);
    if(data.token){ saveToken(data.token); saveUser(data.user); setUser(data.user); setShowAuth(false); setSuccessMsg('Account created'); setTimeout(()=>setSuccessMsg(''),3000); }
    else alert(data.error || 'Register failed');
  }

  async function checkout(){
    if(!user){ setAuthMode('login'); setShowAuth(true); return; }
    const items = Object.entries(cart).map(([id,qty])=>({ id, quantity: qty }));
    if(items.length===0) return alert('Cart empty');
    setLoading(true);
    const res = await fetch(API + '/api/create-checkout-session', { method:'POST', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + getToken() }, body: JSON.stringify({ items }) });
    const data = await res.json();
    setLoading(false);
    if(data.url){ window.location = data.url; } else alert(data.error || 'Checkout failed');
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">ES</div>
          <div>
            <h1>EdgeStore</h1>
            <div className="small-muted">Stylish essentials for daily life</div>
          </div>
        </div>
        <div className="controls">
          <div className="small-muted">Cart: {Object.values(cart).reduce((s,v)=>s+v,0)} items</div>
          <div className="auth">
            {user ? (<><div className="small-muted">Hi, {user.username}</div><button className="btn" onClick={()=>{ localStorage.clear(); setUser(null); alert('Logged out'); }}>Logout</button></>) :
              (<button className="btn" onClick={()=>{ setAuthMode('login'); setShowAuth(true); }}>Login / Register</button>)}
          </div>
        </div>
      </header>

      {successMsg && <div className="success card" style={{marginBottom:12}}>{successMsg}</div>}

      <main style={{display:'flex', gap:20}}>
        <section style={{flex:1}}>
          <div className="card" style={{marginBottom:16, padding:20}}>
            <h2 style={{marginTop:0}}>Featured</h2>
            <p className="small-muted">Handpicked items with premium quality.</p>
          </div>

          <div className="grid">
            {products.map(p=> (
              <div key={p.id} className="product card">
                <img src={API.replace('/api','') + (p.image || '/images/tee.jpg')} alt={p.name} />
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div><strong>{p.name}</strong><div className="small">{p.description}</div></div>
                  <div className="price">₹{(p.price_cents/100).toFixed(2)}</div>
                </div>
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <button className="btn" onClick={()=>add(p.id)}>Add</button>
                  <button style={{padding:'8px 10px',borderRadius:8,background:'transparent',border:'1px solid rgba(255,255,255,0.06)',color:'#cfefff'}} onClick={()=>remove(p.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="cart card">
          <h3>Your Cart</h3>
          <div>
            {Object.keys(cart).length===0 && <div className="small-muted">Cart is empty</div>}
            {Object.entries(cart).map(([id,qty])=>{
              const p = products.find(x=>x.id===id);
              if(!p) return null;
              return (<div className="cart-item" key={id}>
                <img src={API.replace('/api','') + (p.image || '/images/tee.jpg')} style={{width:60,height:48,objectFit:'cover',borderRadius:6}} />
                <div style={{flex:1}}>
                  <div style={{fontWeight:700}}>{p.name}</div>
                  <div className="small">{qty} × ₹{(p.price_cents/100).toFixed(2)}</div>
                </div>
                <div>₹{((p.price_cents/100)*qty).toFixed(2)}</div>
              </div>);
            })}
          </div>
          <div style={{marginTop:12,fontWeight:700}}>Total: ₹{products.reduce((s,p)=> s + (cart[p.id]||0)*(p.price_cents/100), 0).toFixed(2)}</div>
          <div style={{marginTop:12}}>
            <button className="btn" onClick={checkout} disabled={loading}>{loading ? 'Processing…' : 'Checkout (Login required)'}</button>
          </div>
          <div style={{marginTop:12}} className="small-muted">Orders are saved locally (demo).</div>
        </aside>
      </main>

      <footer className="footer small-muted">Happy shopping!</footer>

      {showAuth && <AuthModal mode={authMode} onClose={()=>setShowAuth(false)} onSwitch={(m)=>setAuthMode(m)} onLogin={login} onRegister={register} loading={loading} />}
    </div>
  );
}

function AuthModal({mode,onClose,onSwitch,onLogin,onRegister,loading}){
  const [u,setU]=React.useState('');
  const [p,setP]=React.useState('');
  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{mode==='login' ? 'Login to your account' : 'Create a new account'}</h3>
        <input className="input" placeholder="email or username" value={u} onChange={e=>setU(e.target.value)} />
        <input className="input" placeholder="password" type="password" value={p} onChange={e=>setP(e.target.value)} />
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          {mode==='login' ? <button className="btn" onClick={()=>onLogin(u,p)} disabled={loading}>{loading ? '...' : 'Login'}</button> :
            <button className="btn" onClick={()=>onRegister(u,p)} disabled={loading}>{loading ? '...' : 'Register'}</button>}
          <button style={{background:'transparent',border:'1px solid rgba(255,255,255,0.04)',padding:10,borderRadius:8}} onClick={onClose}>Close</button>
        </div>
        <div style={{marginTop:10}} className="small-muted">{mode==='login' ? 'New here?' : 'Already have an account?'} <a href="#" onClick={(e)=>{e.preventDefault(); onSwitch(mode==='login' ? 'register' : 'login')}}>{mode==='login' ? 'Create account' : 'Login'}</a></div>
      </div>
    </div>
  );
}
