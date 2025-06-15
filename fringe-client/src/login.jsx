import React, { useState, useEffect } from 'react';
import './login.css';
import posterImg from './resources/adelaide-fringe-poster.jpg';
import { useNavigate } from 'react-router-dom';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showFbPopup, setShowFbPopup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/events');
    }
  }, [navigate]);

  return (
    <div className="login-page-root">
      {/* Hero Section with Navbar */}
      <div className="login-hero-section">
        <div className="login-navbar">
          <div className="login-navbar-left">
            <span className="login-logo">ADELAIDE FRINGE</span>
            <span className="login-date">21 FEB - 23 MAR</span>
          </div>
          <div className="login-navbar-right" style={{ display: 'flex', gap: '48px' }}>
            <button onClick={() => navigate('/')} style={{ color: '#fff', textDecoration: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>Home</button>
            <button onClick={() => navigate('/shop')} style={{ color: '#fff', textDecoration: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>Shop</button>
            <button onClick={() => navigate('/events')} style={{ color: '#fff', textDecoration: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>Events</button>
            <button onClick={() => navigate('/contact')} style={{ color: '#fff', textDecoration: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>Contact</button>
          </div>
        </div>
        <div className="login-hero-text">
          <h2>Sign in to access your member discounts, exclusive giveaways and so much more..!</h2>
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card-wrapper">
        <div className="login-card">
          {/* Left: Form */}
          <div className="login-card-left">
            <div className="content">
              <div className="login-header-group">
                <h2>Sign in</h2>
                <p className="login-subtext">Please login to continue to your account.</p>
              </div>
              <form className="login-form" onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                try {
                  const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                  });
                  const data = await response.json();
                  if (response.ok) {
                    if (data.token) {
                      localStorage.setItem('token', data.token);
                    }
                    if (data.user && data.user.role === 'admin') {
                      navigate("/admin");
                    } else {
                      navigate("/");
                    }
                  } else {
                    setError(data.message || "Login failed");
                  }
                } catch (err) {
                  setError("Network error");
                }
              }}>
                <div className="login-input-group">
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder=""
                  />
                  <span className={`login-float-label${emailFocused || email ? ' active' : ''}`}>Email</span>
                </div>
                <div className="login-input-group">
                  <div className="login-password-group">
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder=""
                    />
                    {/* Eye icon can be added here if needed */}
                  </div>
                  <span className={`login-float-label${passwordFocused || password ? ' active' : ''}`}>Password</span>
                </div>
                <div className="login-options-row">
                  <label className="login-keep-logged">
                    <input type="checkbox" /> Keep me logged in
                  </label>
                  <button onClick={() => navigate('/forgot-password')} className="login-forgot" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>Forgot Password?</button>
                </div>
                <button type="submit" className="login-signin-btn">Sign in</button>
                <div className="login-divider"><span>or</span></div>
                <button type="button" className="login-google-btn" onClick={() => window.location.href = API_ENDPOINTS.AUTH.GOOGLE}>
                  <span className="login-btn-icon"><i className="fab fa-google"></i></span> Sign in with Google
                </button>
                <button type="button" className="login-facebook-btn" onClick={() => setShowFbPopup(true)}>
                  <span className="login-btn-icon"><i className="fab fa-facebook-f"></i></span> Sign in with Facebook
                </button>
                {showFbPopup && (
                  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#fff', padding: '32px 48px', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                      <h2 style={{ marginBottom: '16px' }}>Coming soon</h2>
                      <p style={{ marginBottom: '24px' }}>Facebook login will be available soon.</p>
                      <button onClick={() => setShowFbPopup(false)} style={{ padding: '8px 24px', borderRadius: '6px', border: 'none', background: '#367AFF', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                    </div>
                  </div>
                )}
                <div className="login-create-account">Need an account? <button onClick={() => navigate('/signup')} style={{ background: 'none', border: 'none', color: '#367AFF', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>Create one</button></div>
                {error && <div className="login-error" style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
              </form>
            </div>
          </div>
          {/* Right: Poster */}
          <div className="login-card-right">
            <img src={posterImg} alt="Adelaide Fringe Poster" />
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
              <li><a href="/create">Create and Sign In</a></li>
              <li><a href="/tickets">Buy Tickets</a></li>
              <li><a href="/rsvp">Online RSVP</a></li>
              <li><a href="/online-events">Online Events</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Eventick</h3>
            <ul>
              <li><a href="/AboutUs">About Us</a></li>
              <li><a href="/contact">Contact Us</a></li>
              <li><a href="/contact">Help Center</a></li>
              <li><a href="/how-it-works">How it Works</a></li>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
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

export default Login;
