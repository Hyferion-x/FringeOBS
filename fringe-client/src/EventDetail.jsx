import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './events.css';
import event1 from './resources/event1.jpg';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS, apiCall } from './config/api';
const ticketTypes = [
  { key: 'standard', label: 'Standard' },
  { key: 'vip', label: 'VIP' },
  { key: 'student', label: 'Student' },
];

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState({ standard: 0, vip: 0, student: 0 });
  const [addSuccess, setAddSuccess] = useState(false);
  const [hoveredType, setHoveredType] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(API_ENDPOINTS.EVENTS.BY_ID(id));
        const data = await response.json();
        if (response.ok) {
          setEvent(data);
        } else {
          setError(data.message || 'Failed to fetch event');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  const handleQuantityChange = (type, value) => {
    setQuantities(q => ({ ...q, [type]: Math.max(0, value) }));
  };

  const handleAddToCart = async () => {
    if (!event) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to add to cart.');
      return;
    }
    let added = false;
    for (const t of ticketTypes) {
      if (quantities[t.key] > 0) {
        await fetch(`${API_ENDPOINTS.CART.BASE}/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            eventId: event._id || event.id,
            eventName: event.name,
            ticketType: t.key,
            ticketLabel: t.label,
            price: event.ticketPrices?.[t.key] || 0,
            quantity: quantities[t.key],
            imgUrl: event.imgUrl || event1
          })
          });
        added = true;
      }
    }
    if (added) {
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
    setQuantities({ standard: 0, vip: 0, student: 0 });
      // Update cart badge
      updateCartCount();
    }
  };

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

  useEffect(() => {
    updateCartCount();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}>Loading event...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 80 }}>{error}</div>;
  if (!event) return null;

  return (
    <div className="events-root" style={{ minHeight: '100vh', background: '#fff' }}>
      <section className="events-hero" style={{ backgroundImage: `url(${event.imgUrl || event1})`, minHeight: 320 }}>
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
          </div>
        </header>
        <div className="events-hero-content">
          <h1>{event.name}</h1>
        </div>
      </section>
      <main className="events-main" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 0', display: 'flex', gap: 48 }}>
        <div style={{ flex: 2 }}>
          <button onClick={() => navigate('/events')} style={{ background: 'none', border: 'none', color: '#ed4690', fontWeight: 600, fontSize: 16, marginBottom: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-arrow-left"></i> Back to Events
          </button>
          <img src={event.imgUrl || event1} alt={event.name} style={{ width: '100%', borderRadius: 18, marginBottom: 24, maxHeight: 340, objectFit: 'cover', boxShadow: '0 4px 24px rgba(237,70,144,0.10)' }} />
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, color: '#232323' }}>{event.name}</h2>
          <div style={{ display: 'flex', gap: 18, marginBottom: 18, flexWrap: 'wrap' }}>
            <span style={{ background: '#f7f7fa', color: '#ed4690', borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 15 }}><i className="fas fa-calendar-alt" style={{ marginRight: 6 }}></i> {event.date ? new Date(event.date).toLocaleString() : ''}</span>
            <span style={{ background: '#f7f7fa', color: '#5522cc', borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 15 }}><i className="fas fa-map-marker-alt" style={{ marginRight: 6 }}></i> {event.venue}</span>
            <span style={{ background: '#f7f7fa', color: '#232323', borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 15 }}><i className="fas fa-tag" style={{ marginRight: 6 }}></i> {event.category}</span>
            <span style={{ background: '#f7f7fa', color: '#232323', borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 15 }}><i className="fas fa-users" style={{ marginRight: 6 }}></i> {event.seatingCapacity} seats</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1.5px solid #eee', margin: '18px 0 18px 0' }} />
          <p style={{ fontSize: 18, color: '#6E6E6E', marginBottom: 18, lineHeight: 1.7 }}>{event.description}</p>
        </div>
        <aside style={{ flex: 1, background: '#f7f7fa', borderRadius: 18, padding: 28, boxShadow: '0 2px 16px rgba(85,34,204,0.08)', minWidth: 320 }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: '#232323' }}>Buy Tickets</h3>
          {ticketTypes.map(t => (
            <div
              key={t.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
                borderRadius: 8,
                background: '#fff',
                boxShadow: hoveredType === t.key ? '0 4px 16px #ed469033' : '0 1px 6px rgba(85,34,204,0.04)',
                padding: '10px 12px',
                transition: 'box-shadow 0.2s, transform 0.18s',
                transform: hoveredType === t.key ? 'translateY(-2px) scale(1.02)' : 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredType(t.key)}
              onMouseLeave={() => setHoveredType(null)}
            >
              <span style={{ flex: 1, fontWeight: 500, color: '#232323' }}>{t.label}</span>
              <span style={{ width: 80, color: '#ed4690', fontWeight: 700, fontSize: 18 }}>
                ${event.ticketPrices?.[t.key] ?? '--'}
              </span>
              <input
                type="number"
                min={0}
                max={event.seatingCapacity || 1000}
                value={quantities[t.key]}
                onChange={e => handleQuantityChange(t.key, Number(e.target.value))}
                style={{ width: 60, marginLeft: 12, borderRadius: 8, border: '1.5px solid #eee', padding: 4, fontSize: 16, background: '#f7f7fa' }}
              />
            </div>
          ))}
          <button
            className="events-nav-btn"
            style={{ width: '100%', marginTop: 18, background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 12, padding: '12px 0', border: 'none', cursor: ticketTypes.every(t => quantities[t.key] === 0) ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px #ed469033', transition: 'background 0.2s' }}
            onClick={handleAddToCart}
            disabled={ticketTypes.every(t => quantities[t.key] === 0)}
          >
            <i className="fas fa-cart-plus" style={{ marginRight: 8 }}></i> Add to Cart
          </button>
          {addSuccess && <div style={{ color: '#30FF99', marginTop: 12, fontWeight: 600, textAlign: 'center' }}>Added to cart!</div>}
        </aside>
      </main>
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

export default EventDetail; 