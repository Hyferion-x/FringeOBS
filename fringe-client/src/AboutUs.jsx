import React from 'react';
import { useNavigate } from 'react-router-dom';
// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS, apiCall } from './config/api';
import './landing.css';

const heroBg = 'https://wp.indaily.com.au/wp-content/uploads/2021/07/Light-Cycles-Botanic-Garden-Illuminate-Adelaide-2021-TLC07692.jpg';

const AboutUs = () => {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);

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

  // Close profile menu on outside click
  React.useEffect(() => {
    if (!showProfileMenu) return;
    const handleClick = (e) => {
      if (!e.target.closest('.nav-links')) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);

  return (
    <div className="landing-container">
      {/* Hero Section with Navbar */}
      <section className="hero-section" style={{ backgroundImage: `url(${heroBg})`, minHeight: 320 }}>
        <div className="overlay"></div>
      <nav className="navbar">
        <div className="nav-logo">
          <h1>ADELAIDE FRINGE</h1>
          <span className="date">21 FEB - 23 MAR</span>
        </div>
        <div className="nav-links">
            <button className="events-nav-link" onClick={() => navigate('/')}>Home</button>
          <button className="events-nav-link" onClick={() => navigate('/shop')}>Shop</button>
          <button className="events-nav-link" onClick={() => navigate('/events')}>Events</button>
          <button className="events-nav-link" onClick={() => navigate('/myorders')}>My Orders</button>
          <button className="events-nav-link" onClick={() => navigate('/contact')}>Contact</button>
          <button className="login-btn" onClick={() => navigate('/cart')} style={{ position: 'relative', background: '#fff', color: '#ed4690', border: '1.5px solid #ed4690', borderRadius: '50%', width: 44, height: 44, padding: 0, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
            <i className="fas fa-shopping-cart"></i>
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#ed4690', color: '#fff', borderRadius: '50%', fontSize: 13, fontWeight: 700, minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', boxShadow: '0 1px 4px #ed469033' }}>{cartCount}</span>
            )}
          </button>
          {isLoggedIn ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                className="login-btn"
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
            <button className="login-btn" onClick={() => navigate('/login')}>Login</button>
          )}
        </div>
      </nav>
        <div className="hero-content">
          <h1>About Us</h1>
        </div>
      </section>

      {/* About Us Content */}
      <section style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #fff 60%, #f6f4ff 100%)', padding: '80px 0 40px 0' }}>
        <div style={{ maxWidth: 800, background: 'rgba(255,255,255,0.97)', borderRadius: 28, boxShadow: '0 8px 40px #ed469033', padding: '48px 36px 36px 36px', textAlign: 'center', border: '1.5px solid #e6eaff', margin: '0 auto' }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: '#232323', marginBottom: 18, letterSpacing: 0.5, fontFamily: 'Alatsi, sans-serif' }}>About Us</h2>
          <p style={{ color: '#6E6E6E', fontSize: 19, marginBottom: 18, fontWeight: 500, lineHeight: 1.7 }}>
            This website was developed as part of the DevOps and Enterprise Systems Project for Flinders University. As the head developer and sole architect of this project, I built a robust, full-stack web application that demonstrates real-world principles of modern software engineering.
          </p>
          <p style={{ color: '#232323', fontSize: 17, marginBottom: 18, fontWeight: 400, lineHeight: 1.7 }}>
            Throughout this project, I applied DevOps concepts, integrating continuous integration and continuous deployment (CI/CD) pipelines, version control best practices, and automated testing to ensure code quality and rapid, reliable delivery. My workflow embraced Agile methodology, enabling me to iterate quickly, adapt to challenges, and continuously improve the development process.
          </p>
          <p style={{ color: '#232323', fontSize: 17, fontWeight: 400, lineHeight: 1.7 }}>
            My goal was to build an enterprise-grade solution that not only meets project requirements, but also exemplifies industry standards for automation, scalability, and innovation in software development.
          </p>
        </div>
      </section>

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

export default AboutUs; 