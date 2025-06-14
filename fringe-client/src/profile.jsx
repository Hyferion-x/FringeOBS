import React, { useEffect, useState } from 'react';
import './login.css'; // Reuse styles for consistency
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS, apiCall } from './config/api';
const TABS = [
  { key: 'info', label: 'Profile Info' },
  { key: 'edit', label: 'Edit Profile' },
  { key: 'password', label: 'Change Password' },
];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [cartCount, setCartCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
            fetch(API_ENDPOINTS.AUTH.PROFILE, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch profile'))
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load profile. Please login again.');
        setLoading(false);
      });

    // Cart badge logic
    const updateCartCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return setCartCount(0);
      try {
        const res = await fetch(API_ENDPOINTS.CART.BASE, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCartCount((data.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0));
        }
      } catch {}
    };
    updateCartCount();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Helper for avatar
  const renderAvatar = () => {
    if (user && user.profilePic) {
      return <img src={user.profilePic} alt="Profile" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 24px #ed469044', background: '#fff' }} />;
    }
    if (user && user.name) {
      return (
        <div style={{
          width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #ed4690 0%, #5522cc 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 40, color: '#fff', fontWeight: 700, boxShadow: '0 4px 24px #ed469044', border: '4px solid #fff'
        }}>
          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
      );
    }
    return (
      <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#bbb', fontWeight: 700, boxShadow: '0 4px 24px #ed469044', border: '4px solid #fff' }}>?</div>
    );
  };

  // Edit Profile form (functional)
  const EditProfile = () => {
    const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleSubmit = async e => {
      e.preventDefault();
      setSaving(true); setMsg(''); setErr('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (res.ok) {
          setMsg('Profile updated!');
          setUser(u => ({ ...u, ...form }));
        } else {
          setErr(data.message || 'Update failed');
        }
      } catch {
        setErr('Network error');
      }
      setSaving(false);
    };
    return (
      <form style={{ marginTop: 24, textAlign: 'left' }} onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600 }}>Name</label>
          <input name="name" type="text" value={form.name} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ccc', marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600 }}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ccc', marginTop: 4 }} />
      </div>
        {msg && <div style={{ color: '#1ecb4f', marginBottom: 8 }}>{msg}</div>}
        {err && <div style={{ color: '#d7263d', marginBottom: 8 }}>{err}</div>}
        <button type="submit" disabled={saving} style={{ background: '#ed4690', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
    </form>
  );
  };

  // Change Password form (functional)
  const ChangePassword = () => {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleSubmit = async e => {
      e.preventDefault();
      setSaving(true); setMsg(''); setErr('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.AUTH.UPDATE_PASSWORD, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (res.ok) {
          setMsg('Password updated!');
          setForm({ currentPassword: '', newPassword: '' });
        } else {
          setErr(data.message || 'Update failed');
        }
      } catch {
        setErr('Network error');
      }
      setSaving(false);
    };
    return (
      <form style={{ marginTop: 24, textAlign: 'left' }} onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600 }}>Current Password</label>
          <input name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ccc', marginTop: 4 }} required />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600 }}>New Password</label>
          <input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ccc', marginTop: 4 }} required />
      </div>
        {msg && <div style={{ color: '#1ecb4f', marginBottom: 8 }}>{msg}</div>}
        {err && <div style={{ color: '#d7263d', marginBottom: 8 }}>{err}</div>}
        <button type="submit" disabled={saving} style={{ background: '#ed4690', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Change Password'}</button>
    </form>
  );
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}>Loading profile...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 80 }}>{error}</div>;

  return (
    <div className="events-root" style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation/Header Section */}
      <section className="events-hero" style={{ minHeight: 120, backgroundImage: `url('https://wp.indaily.com.au/wp-content/uploads/2021/03/Adelaide-Fringe-2021_Gluttony-Borealis-Photo-Chloe-Elizabeth_BOREALIS_Gluttony-scaled.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="events-hero-overlay"></div>
        <header className="events-navbar">
          <div className="events-navbar-left">
            <span className="events-logo">ADELAIDE FRINGE</span>
            <span className="events-date">21 FEB - 23 MAR</span>
          </div>
          <div className="events-navbar-right">
            <button className="events-nav-link" onClick={() => navigate('/')}>Home</button>
            <button className="events-nav-link" onClick={() => navigate('/shop')}>Shop</button>
            <button className="events-nav-link" onClick={() => navigate('/events')}>Events</button>
            <button className="events-nav-link" onClick={() => navigate('/myorders')}>My Orders</button>
            <button className="events-nav-link" onClick={() => navigate('/contact')}>Contact</button>
            <button className="events-nav-btn" onClick={() => navigate('/cart')} style={{ position: 'relative' }}>
              <i className="fas fa-shopping-cart"></i>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: '#ed4690', color: '#fff', borderRadius: '50%', fontSize: 13, fontWeight: 700, minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', boxShadow: '0 1px 4px #ed469033' }}>{cartCount}</span>
              )}
            </button>
            {localStorage.getItem('token') ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  className="events-nav-btn"
                  style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, fontSize: 22, background: '#fff', color: '#ed4690', border: '1.5px solid #ed4690', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setShowProfileMenu(v => !v)}
                  aria-label="Profile menu"
                >
                  <i className="fas fa-user-circle"></i>
                </button>
                {showProfileMenu && (
                  <div style={{ position: 'absolute', right: 0, top: 50, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 12px rgba(85,34,204,0.08)', minWidth: 140, zIndex: 100 }}>
                    <button style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>My Profile</button>
                    <button style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#ed4690' }} onClick={() => { localStorage.removeItem('token'); setShowProfileMenu(false); navigate('/login'); }}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="events-nav-btn" onClick={() => navigate('/login')}>Login</button>
            )}
          </div>
        </header>
        <div className="events-hero-content">
          <h1>Profile</h1>
        </div>
      </section>
      {/* Main Profile Content */}
      <div style={{
        minHeight: 'calc(100vh - 72px - 420px)',
        width: '100vw',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        fontFamily: 'DM Sans, Alatsi, sans-serif',
      }}>
        {/* Sidebar */}
        <div style={{
          width: 340,
          background: 'rgba(255,255,255,0.97)',
          borderRight: '1.5px solid #e6eaff',
          boxShadow: '4px 0 32px rgba(85,34,204,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '56px 32px 32px 32px',
          gap: 18,
          zIndex: 2,
          borderRadius: '28px',
          margin: '32px 0 32px 32px',
        }}>
          <div style={{ marginBottom: 18 }}>{renderAvatar()}</div>
          <h2 style={{ fontFamily: 'Alatsi, sans-serif', color: '#232323', marginBottom: 4, fontWeight: 700, fontSize: 28, letterSpacing: 1 }}>{user.name}</h2>
          <div style={{ color: '#6E6E6E', fontSize: 16, marginBottom: 2 }}>{user.email}</div>
          <div style={{ color: '#ed4690', fontWeight: 600, marginBottom: 18, fontSize: 15, letterSpacing: 1 }}>Role: {user.role}</div>
          {user.role === 'admin' && (
            <button onClick={() => navigate('/admin')} style={{ background: 'linear-gradient(90deg, #4a23dd 0%, #ed4690 100%)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #4a23dd33', transition: 'background 0.2s', width: '100%', letterSpacing: 1, marginTop: 8, marginBottom: 8, outline: 'none' }}>Go to Admin Page</button>
          )}
          <button onClick={handleLogout} style={{ background: 'linear-gradient(90deg, #ed4690 0%, #5522cc 100%)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #ed469033', transition: 'background 0.2s', width: '100%', letterSpacing: 1, marginTop: 18, outline: 'none' }}>Logout</button>
        </div>
        {/* Main Content + Images/Text Section */}
        <div style={{
          flex: 1,
          padding: '56px 48px',
          display: 'flex',
          flexDirection: 'row',
          minWidth: 0,
          background: 'rgba(255,255,255,0.90)',
          boxShadow: '0 8px 40px rgba(61, 55, 241, 0.06)',
          borderRadius: '32px',
          margin: '32px 32px 32px 0',
          gap: 40,
        }}>
          {/* Profile Cards */}
          <div style={{ flex: 1, minWidth: 340, maxWidth: 540 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: activeTab === tab.key ? 'linear-gradient(90deg, #ed4690 0%, #5522cc 100%)' : '#f7f7fa',
                    color: activeTab === tab.key ? '#fff' : '#ed4690',
                    border: 'none',
                    borderRadius: 20,
                    padding: '10px 28px',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: activeTab === tab.key ? '0 2px 8px #ed469033' : 'none',
                    transition: 'background 0.2s, color 0.2s',
                    marginBottom: 4,
                    outline: 'none',
                    letterSpacing: 0.5,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 12px #ed469033', padding: '18px 18px 16px 18px', minHeight: 320, marginTop: 8, maxWidth: 500, overflow: 'hidden' }}>
              {activeTab === 'info' && (
                <div style={{
                  marginTop: 18,
                  color: '#232323',
                  fontSize: 17,
                  textAlign: 'left',
                  paddingLeft: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minHeight: 220,
                  position: 'relative',
                  background: 'linear-gradient(120deg, #f7f7fa 80%, #f6f4ff 100%)',
                  borderRadius: 24,
                  boxShadow: '0 4px 32px #ed469022',
                  border: '2.5px solid',
                  borderImage: 'linear-gradient(90deg, #f7a7c7 0%, #bdbdfc 100%) 1',
                  padding: '18px 18px 16px 18px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    marginBottom: 18,
                    width: '100%',
                  }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ed4690 0%, #5522cc 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      color: '#fff',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px #ed469044',
                      border: '3px solid #fff',
                    }}>
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : <i className="fas fa-user"></i>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: 22, color: '#5522cc', letterSpacing: 0.5 }}>{user.name}</span>
                      <div style={{ color: '#ed4690', fontWeight: 600, fontSize: 15, marginTop: 2 }}>{user.role}</div>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, #ed4690 0%, #5522cc 100%)', opacity: 0.13, margin: '8px 0 18px 0' }} />
                  <div style={{ fontSize: 16, color: '#232323', lineHeight: 2, fontWeight: 500 }}>
                    <span style={{ display: 'block', marginBottom: 6 }}><strong>Name:</strong> {user.name}</span>
                    <span style={{ display: 'block', marginBottom: 6 }}><strong>Email:</strong> {user.email}</span>
                    <span style={{ display: 'block', marginBottom: 6 }}><strong>Role:</strong> {user.role}</span>
                  </div>
                </div>
              )}
              {activeTab === 'edit' && (
                <div style={{
                  marginTop: 18,
                  color: '#232323',
                  fontSize: 17,
                  textAlign: 'left',
                  paddingLeft: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minHeight: 220,
                  position: 'relative',
                  background: 'linear-gradient(120deg, #f7f7fa 80%, #f6f4ff 100%)',
                  borderRadius: 24,
                  boxShadow: '0 4px 32px #ed469022',
                  border: '2.5px solid',
                  borderImage: 'linear-gradient(90deg, #f7a7c7 0%, #bdbdfc 100%) 1',
                  padding: '18px 18px 16px 18px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    marginBottom: 18,
                    width: '100%',
                  }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ed4690 0%, #5522cc 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      color: '#fff',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px #ed469044',
                      border: '3px solid #fff',
                    }}>
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : <i className="fas fa-user"></i>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: 22, color: '#5522cc', letterSpacing: 0.5 }}>{user.name}</span>
                      <div style={{ color: '#ed4690', fontWeight: 600, fontSize: 15, marginTop: 2 }}>{user.role}</div>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, #ed4690 0%, #5522cc 100%)', opacity: 0.13, margin: '8px 0 18px 0' }} />
                  <EditProfile />
                </div>
              )}
              {activeTab === 'password' && (
                <div style={{
                  marginTop: 18,
                  color: '#232323',
                  fontSize: 17,
                  textAlign: 'left',
                  paddingLeft: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minHeight: 220,
                  position: 'relative',
                  background: 'linear-gradient(120deg, #f7f7fa 80%, #f6f4ff 100%)',
                  borderRadius: 24,
                  boxShadow: '0 4px 32px #ed469022',
                  border: '2.5px solid',
                  borderImage: 'linear-gradient(90deg, #f7a7c7 0%, #bdbdfc 100%) 1',
                  padding: '18px 18px 16px 18px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    marginBottom: 18,
                    width: '100%',
                  }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ed4690 0%, #5522cc 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      color: '#fff',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px #ed469044',
                      border: '3px solid #fff',
                    }}>
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : <i className="fas fa-user"></i>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: 22, color: '#5522cc', letterSpacing: 0.5 }}>{user.name}</span>
                      <div style={{ color: '#ed4690', fontWeight: 600, fontSize: 15, marginTop: 2 }}>{user.role}</div>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, #ed4690 0%, #5522cc 100%)', opacity: 0.13, margin: '8px 0 18px 0' }} />
                  <ChangePassword />
                </div>
              )}
            </div>
          </div>
          {/* Images and Text Section */}
          <div style={{
            flex: 1.2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 28,
            minWidth: 320,
            maxWidth: 520,
            padding: '18px 0 0 0',
            marginLeft: '20%',
          }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 22, width: '100%', justifyContent: 'center' }}>
              <img src="https://image.isu.pub/221208012116-afb3a26973d8a4d0ad74c307dd4d89fd/jpg/page_1_thumb_large.jpg" alt="Adelaide Fringe 1" style={{ width: '48%', borderRadius: 18, boxShadow: '0 2px 12px #ed469033', objectFit: 'cover', maxHeight: 261 }} />
              <img src="https://image.isu.pub/210204035244-fbb09e3568b83c5b648edfbf1eafc62c/jpg/page_1_thumb_large.jpg" alt="Adelaide Fringe 2" style={{ width: '48%', borderRadius: 18, boxShadow: '0 2px 12px #ed469033', objectFit: 'cover', maxHeight: 261 }} />
            </div>
            <div style={{
              background: 'linear-gradient(90deg, #f7f7fa 60%, #f6f4ff 100%)',
              borderRadius: 16,
              boxShadow: '0 2px 12px #ed469022',
              padding: '22px 24px',
              fontSize: 16,
              color: '#232323',
              fontWeight: 500,
              lineHeight: 1.7,
              textAlign: 'center',
              marginTop: 8,
              maxWidth: 480,
            }}>
              You came for Adelaide Fringe, but you're going to get so much more! Adelaide is a vibrant city bursting with culture, flavours, and entertainment. Explore world-renowned wineries, relax on stunning beaches, and wander along North Terrace, Adelaide's Cultural Boulevard. After enjoying one or more of the 1,400+ Fringe shows, retire to one of Adelaide's IHG Hotels & Resorts to relax, recharge and get ready to do it all again.
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-acknowledgement">
            <p>
              Adelaide Fringe recognises Kaurna Miyurna Yarta (Adelaide Plains people's Land) and all First Nations people and their ancestral lands and waterways on which Fringe lives, operates and learns. The lands were never ceded and remain as important to the living Kaurna people today. We pay respect to the Kaurna people and their Elders past and present.
            </p>
            <div className="footer-social">
              <button type="button" className="footer-social-btn" aria-label="Facebook"><i className="fab fa-facebook-f"></i></button>
              <button type="button" className="footer-social-btn" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></button>
              <button type="button" className="footer-social-btn" aria-label="YouTube"><i className="fab fa-youtube"></i></button>
              <button type="button" className="footer-social-btn" aria-label="Instagram"><i className="fab fa-instagram"></i></button>
            </div>
          </div>
          <div className="footer-section">
            <h3>Plan Events</h3>
            <ul>
              <li><a href="/login">Create and Sign In</a></li>
              <li><a href="/events">Buy Tickets</a></li>
              <li><a href="#online">Online RSVP</a></li>
              <li><a href="#online">Online Events</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Eventick</h3>
            <ul>
              <li><a href="/AboutUs">About Us</a></li>
              <li><a href="/contact">Contact Us</a></li>
              <li><a href="/contact">Help Center</a></li>
              <li><a href="#how">How it Works</a></li>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Stay In The Loop</h3>
            <p>Join our mailing list to stay in the loop with our newest for Event and concert</p>
            <form className="footer-newsletter">
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe Now</button>
            </form>
          </div>
        </div>
        <div style={{ 
          borderTop: '1px solid #eee', 
          paddingTop: '20px', 
          marginTop: '30px', 
          textAlign: 'center', 
          color: '#fff' 
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#fff' }}>
            © 2025 <a 
              href="https://hyferion.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#ed4690', 
                textDecoration: 'none', 
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.color = '#ff69b4';
                e.target.style.textShadow = '0 0 10px #ff69b4, 0 0 20px #ff69b4, 0 0 30px #ff69b4';
              }}
              onMouseOut={(e) => {
                e.target.style.color = '#ed4690';
                e.target.style.textShadow = 'none';
              }}
            >
              Hyferion Technologies
            </a>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Profile; 