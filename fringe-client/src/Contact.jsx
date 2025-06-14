import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './events.css';
import heroBg from './resources/hero-bg.jpg';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS, apiCall } from './config/api';
const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
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
  }, []);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.EVENTS.BASE}/contact-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, subject: form.subject, message: form.message })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send message');
      }
      setSuccess('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
    setLoading(false);
  };

  return (
    <div className="events-root" style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation/Header Section */}
      <section className="events-hero" style={{ backgroundImage: `url('https://wp.indaily.com.au/wp-content/uploads/2021/07/Light-Cycles-Botanic-Garden-Illuminate-Adelaide-2021-TLC07692.jpg')`, minHeight: 120 }}>
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
            {isLoggedIn ? (
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
          <h1>Contact Us</h1>
        </div>
      </section>
      {/* Main Contact Content */}
      <div style={{ maxWidth: 900, margin: '40px auto 0 auto', flex: 1, display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Contact Form */}
        <div className="contact-card" style={{ background: '#f7f7fa', borderRadius: 18, padding: 32, boxShadow: '0 2px 16px rgba(85,34,204,0.08)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#232323', marginBottom: 18 }}>Send us a message</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <input name="name" type="text" placeholder="Your Name" value={form.name} onChange={handleChange} style={{ padding: 14, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16 }} required />
            <input name="email" type="email" placeholder="Your Email" value={form.email} onChange={handleChange} style={{ padding: 14, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16 }} required />
            <input name="subject" type="text" placeholder="Subject" value={form.subject} onChange={handleChange} style={{ padding: 14, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16 }} required />
            <textarea name="message" placeholder="Your Message" value={form.message} onChange={handleChange} style={{ padding: 14, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16, minHeight: 120, resize: 'vertical' }} required />
            <button type="submit" style={{ background: '#ed4690', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px #ed469033', marginTop: 8 }}>Send Message</button>
            {error && <div style={{ color: 'red', marginTop: 8, fontWeight: 600 }}>{error}</div>}
            {success && <div style={{ color: '#30FF99', marginTop: 8, fontWeight: 600 }}>{success}</div>}
          </form>
        </div>
        {/* Contact Info */}
        <div className="contact-card contact-info-card" style={{ background: '#fff', borderRadius: 18, padding: 32, boxShadow: '0 2px 16px rgba(85,34,204,0.08)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#ed4690', marginBottom: 8 }}>Contact Information</h3>
          <div style={{ color: '#232323', fontSize: 16, marginBottom: 8 }}><i className="fas fa-envelope" style={{ color: '#ed4690', marginRight: 10 }}></i> info@adelaidefringe.com.au</div>
          <div style={{ color: '#232323', fontSize: 16, marginBottom: 8 }}><i className="fas fa-phone" style={{ color: '#ed4690', marginRight: 10 }}></i> +61 8 8100 2000</div>
          <div style={{ color: '#232323', fontSize: 16, marginBottom: 8 }}><i className="fas fa-map-marker-alt" style={{ color: '#ed4690', marginRight: 10 }}></i> 136 Frome St, Adelaide SA 5000</div>
          <div style={{ marginTop: 18, display: 'flex', gap: 16 }}>
            <a href="https://facebook.com/adelaidefringe" target="_blank" rel="noopener noreferrer" style={{ color: '#ed4690', fontSize: 22 }}><i className="fab fa-facebook-f"></i></a>
            <a href="https://instagram.com/adelaidefringe" target="_blank" rel="noopener noreferrer" style={{ color: '#ed4690', fontSize: 22 }}><i className="fab fa-instagram"></i></a>
            <a href="https://twitter.com/adelaidefringe" target="_blank" rel="noopener noreferrer" style={{ color: '#ed4690', fontSize: 22 }}><i className="fab fa-twitter"></i></a>
            <a href="https://youtube.com/adelaidefringe" target="_blank" rel="noopener noreferrer" style={{ color: '#ed4690', fontSize: 22 }}><i className="fab fa-youtube"></i></a>
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

export default Contact; 