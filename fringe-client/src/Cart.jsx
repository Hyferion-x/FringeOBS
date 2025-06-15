import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './events.css';
import event1 from './resources/event1.jpg';
import heroBg from './resources/hero-bg.jpg';
// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';

const OrderSummaryStep = ({ cart, total, onPay, onClose }) => (
  <div style={{ maxWidth: 480, margin: '0 auto' }}>
    <h2 style={{ fontSize: 26, fontWeight: 700, color: '#232323', marginBottom: 18 }}>Order Summary</h2>
    <div style={{ marginBottom: 18 }}>
      {cart.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px #ed469033', padding: '10px 12px', marginBottom: 10 }}>
          <img src={item.imgUrl || event1} alt={item.eventName} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#232323' }}>{item.eventName}</div>
            <div style={{ color: '#5522cc', fontWeight: 500, fontSize: 15 }}>{item.ticketLabel} x {item.quantity}</div>
          </div>
          <div style={{ color: '#ed4690', fontWeight: 700, fontSize: 17 }}>${item.price * item.quantity}</div>
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginBottom: 24 }}>
      <span>Total</span>
      <span style={{ color: '#ed4690' }}>${total}</span>
    </div>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
      <button onClick={onClose} style={{ background: '#f7f7fa', color: '#ed4690', border: '1.5px solid #ed4690', borderRadius: 10, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
      <button onClick={onPay} style={{ background: '#ed4690', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #ed469033' }}>Checkout</button>
    </div>
  </div>
);

const CheckoutModal = ({ open, onClose, cart, total, user, clearCart }) => {
  const [error, setError] = useState('');

  const handlePay = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login before checkout.');
        return;
      }
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        setError('Your cart is empty.');
        return;
      }
      // Unified checkout endpoint (no body needed)
      // Updated for Vercel deployment - using API_ENDPOINTS
      const sessionRes = await fetch(API_ENDPOINTS.PAYMENTS.CREATE_SESSION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!sessionRes.ok) {
        const errorText = await sessionRes.text();
        throw new Error(errorText || 'Stripe session failed');
      }
      const sessionData = await sessionRes.json();
      // Redirect to Stripe checkout
      window.location.href = sessionData.url;
      return;
    } catch (err) {
      setError(err.message || 'Payment initiation failed. Please try again.');
    }
  };

  const handleClose = () => {
    onClose();
  };

  return open ? (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(34,34,54,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
      <div style={{ background: '#f7f7fa', borderRadius: 18, boxShadow: '0 8px 40px #ed469033', padding: '40px 32px 32px 32px', minWidth: 340, maxWidth: '95vw', width: 480, position: 'relative', animation: 'fadeIn 0.2s' }}>
        <button onClick={handleClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ed4690', fontSize: 26, cursor: 'pointer', zIndex: 10 }} title="Close"><i className="fas fa-times"></i></button>
        <OrderSummaryStep cart={cart} total={total} onPay={handlePay} onClose={handleClose} />
        {error && <div style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>{error}</div>}
      </div>
    </div>
  ) : null;
};

// --- Main Cart Component ---
const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  // Calculate total from cart items
  const calculateTotal = (items) => {
    const newTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  };

  // Fetch cart from API
  useEffect(() => {
    const loadCart = async () => {
      const token = localStorage.getItem('token');
      if (!token) return setCartItems([]);
      try {
        const res = await fetch(API_ENDPOINTS.CART.BASE, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCartItems(data.items || []);
          calculateTotal(data.items || []);
          setCartCount((data.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0));
        }
      } catch {
        setCartItems([]);
      }
      // Try to get user info for prefill
      if (token) {
        fetch(API_ENDPOINTS.AUTH.PROFILE, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch profile'))
          .then(data => setUser(data))
          .catch(() => setUser(null));
      }
    };
    loadCart();
  }, []);

  useEffect(() => {
    setTotal(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0));
  }, [cartItems]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleQuantityChange = async (idx, value) => {
    const item = cartItems[idx];
    const token = localStorage.getItem('token');
    if (!token) return;
    const quantity = Math.max(1, Number(value));
    await fetch(`${API_ENDPOINTS.CART.BASE}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId: item.eventId, ticketType: item.ticketType, quantity })
    });
    // Reload cart
    const res = await fetch(API_ENDPOINTS.CART.BASE, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setCartItems(data.items || []);
      calculateTotal(data.items || []);
      setCartCount((data.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0));
    }
    showToast('Quantity updated');
  };

  const handleRemove = async (idx) => {
    const item = cartItems[idx];
    const token = localStorage.getItem('token');
    if (!token) return;
    let body = { eventId: item.eventId, ticketType: item.ticketType };
    if (item.ticketType === 'merch') {
      body = { eventId: item.merchId || item.eventId, ticketType: item.ticketType, ticketLabel: item.ticketLabel };
    }
    await fetch(`${API_ENDPOINTS.CART.BASE}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    // Reload cart
    const res = await fetch(API_ENDPOINTS.CART.BASE, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setCartItems(data.items || []);
      calculateTotal(data.items || []);
      setCartCount((data.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0));
    }
    showToast('Item removed from cart');
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_ENDPOINTS.CART.BASE}/clear`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setCartItems([]);
    setTotal(0);
  };

  if (cartItems.length === 0) {
    return (
      <div className="events-root" style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation/Header Section */}
        <section className="events-hero" style={{ backgroundImage: `url(${heroBg})`, minHeight: 120 }}>
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
            <h1>Your Cart</h1>
          </div>
        </section>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <h2 style={{ color: '#ed4690', fontWeight: 700, fontSize: 32, marginBottom: 18 }}>Your cart is empty</h2>
          <p style={{ color: '#6E6E6E', fontSize: 18, marginBottom: 24 }}>Browse events and add tickets to your cart.</p>
          <div style={{ display: 'flex', gap: 18 }}>
            <button className="events-nav-btn" style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 12, padding: '12px 32px', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/events')}>
              Go to Events
            </button>
            <button className="events-nav-btn" style={{ background: '#5522cc', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 12, padding: '12px 32px', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/shop')}>
              Go to Shop
            </button>
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
        {toast && (
          <div style={{ position: 'fixed', left: '50%', bottom: 40, transform: 'translateX(-50%)', background: '#23243A', color: '#fff', borderRadius: 16, padding: '16px 32px', fontWeight: 600, fontSize: 17, boxShadow: '0 4px 24px #ed469033', zIndex: 9999, transition: 'opacity 0.2s', opacity: toast ? 1 : 0 }}>
            {toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="events-root" style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation/Header Section */}
      <section className="events-hero" style={{ backgroundImage: `url(${heroBg})`, minHeight: 120 }}>
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
          <h1>Your Cart</h1>
        </div>
      </section>
      <div style={{ maxWidth: 900, margin: '40px auto 0 auto', flex: 1 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#232323', marginBottom: 24 }}>Your Cart</h2>
        <div style={{ background: '#f7f7fa', borderRadius: 18, boxShadow: '0 2px 16px rgba(85,34,204,0.08)', padding: 28 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ color: '#5522cc', fontWeight: 700, fontSize: 16 }}>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Event</th>
                <th style={{ textAlign: 'left', padding: '12px 8px' }}>Ticket</th>
                <th style={{ textAlign: 'right', padding: '12px 8px' }}>Price</th>
                <th style={{ textAlign: 'center', padding: '12px 8px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '12px 8px' }}>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, idx) => (
                <tr key={idx} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(85,34,204,0.04)', marginBottom: 8 }}>
                  <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={item.imgUrl || event1} alt={item.eventName} style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover', boxShadow: '0 2px 8px #ed469033' }} />
                    <span style={{ fontWeight: 600, color: '#232323' }}>{item.eventName}</span>
                  </td>
                  <td style={{ padding: '12px 8px', color: '#5522cc', fontWeight: 600 }}>{item.ticketLabel}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ed4690', fontWeight: 700 }}>${item.price}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => handleQuantityChange(idx, e.target.value)}
                      style={{ width: 48, borderRadius: 8, border: '1.5px solid #eee', padding: 4, fontSize: 16, background: '#f7f7fa', textAlign: 'center' }}
                    />
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>${item.price * item.quantity}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <button onClick={() => handleRemove(idx)} style={{ background: 'none', border: 'none', color: '#ed4690', fontWeight: 700, fontSize: 18, cursor: 'pointer' }} title="Remove">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 24, gap: 32 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#232323' }}>Total: <span style={{ color: '#ed4690' }}>${total}</span></span>
            <button className="events-nav-btn" style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 12, padding: '12px 32px', border: 'none', cursor: 'pointer', opacity: 1 }} onClick={() => setShowCheckout(true)}>
              Checkout
            </button>
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
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 40, transform: 'translateX(-50%)', background: '#23243A', color: '#fff', borderRadius: 16, padding: '16px 32px', fontWeight: 600, fontSize: 17, boxShadow: '0 4px 24px #ed469033', zIndex: 9999, transition: 'opacity 0.2s', opacity: toast ? 1 : 0 }}>
          {toast}
        </div>
      )}
      <CheckoutModal open={showCheckout} onClose={() => setShowCheckout(false)} cart={cartItems} total={total} user={user} clearCart={clearCart} />
    </div>
  );
};

export default Cart; 