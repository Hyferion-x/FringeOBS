import React, { useState, useEffect } from 'react';
import './signup.css';
import posterImg from './resources/adelaide-fringe-poster.jpg';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';
const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [focus, setFocus] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [error, setError] = useState("");
  const [showFbPopup, setShowFbPopup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/events';
    }
  }, []);

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
            <a href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif' }}>Home</a>
            <a href="/shop" style={{ color: '#fff', textDecoration: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif' }}>Shop</a>
            <a href="/events" style={{ color: '#fff', textDecoration: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif' }}>Events</a>
            <a href="/contact" style={{ color: '#fff', textDecoration: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif' }}>Contact</a>
          </div>
        </div>
        <div className="login-hero-text">
          <h2>Join the Fringe Family and enjoy your member exclusive giveaways and much more..!</h2>
        </div>
      </div>

      {/* Signup Card */}
      <div className="login-card-wrapper">
        <div className="login-card">
          {/* Left: Form */}
          <div className="login-card-left">
            <div className="content">
              <div className="login-header-group">
                <h2>Sign up</h2>
                <p className="login-subtext">Sign up to enjoy the feature of Fringe 2025</p>
              </div>
              <form className="login-form" onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                if (!terms) {
                  setError("You must accept the terms and conditions.");
                  return;
                }
                if (password !== confirmPassword) {
                  setError("Passwords do not match.");
                  return;
                }
                try {
                  const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password, role: 'customer' })
                  });
                  const data = await response.json();
                  if (response.ok) {
                    // Signup successful, redirect to login
                    window.location.href = "/login";
                  } else {
                    setError(data.message || "Signup failed");
                  }
                } catch (err) {
                  setError("Network error");
                }
              }}>
                <div className="login-input-group">
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocus(f => ({ ...f, name: true }))}
                    onBlur={() => setFocus(f => ({ ...f, name: false }))}
                    placeholder=""
                  />
                  <span className={`login-float-label${focus.name || name ? ' active' : ''}`}>Your Name</span>
                </div>
                <div className="login-input-group">
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocus(f => ({ ...f, email: true }))}
                    onBlur={() => setFocus(f => ({ ...f, email: false }))}
                    placeholder=""
                  />
                  <span className={`login-float-label${focus.email || email ? ' active' : ''}`}>Email</span>
                </div>
                <div className="login-input-group">
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocus(f => ({ ...f, password: true }))}
                    onBlur={() => setFocus(f => ({ ...f, password: false }))}
                    placeholder=""
                  />
                  <span className={`login-float-label${focus.password || password ? ' active' : ''}`}>Password</span>
                </div>
                <div className="login-input-group">
                  <input
                    id="signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocus(f => ({ ...f, confirmPassword: true }))}
                    onBlur={() => setFocus(f => ({ ...f, confirmPassword: false }))}
                    placeholder=""
                  />
                  <span className={`login-float-label${focus.confirmPassword || confirmPassword ? ' active' : ''}`}>Confirm Password</span>
                </div>
                <div className="login-options-row">
                  <label className="login-keep-logged">
                    <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /> Terms and Conditions
                  </label>
                </div>
                {error && <div className="login-error" style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
                <button type="submit" className="login-signin-btn">Sign up</button>
                <div className="login-divider"><span>or</span></div>
                <button type="button" className="login-google-btn" onClick={() => window.location.href = "API_ENDPOINTS.AUTH.GOOGLE"}>
                  <span className="login-btn-icon"><i className="fab fa-google"></i></span> Continue with Google
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
                <div className="login-create-account">Already have an account? <a href="/login">Sign in</a></div>
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
              <li><a href="#create">Create and Sign In</a></li>
              <li><a href="#buy">Buy Tickets</a></li>
              <li><a href="#online">Online RSVP</a></li>
              <li><a href="#online">Online Events</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Eventick</h3>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#press">Press</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#help">Help Center</a></li>
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

export default Signup;
