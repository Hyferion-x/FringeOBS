import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './events.css';
import heroBg from './resources/hero-bg.jpg';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';
const ShopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [variant, setVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addSuccess, setAddSuccess] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(API_ENDPOINTS.MERCHANDISE.BY_ID(id));
        if (!res.ok) throw new Error('Failed to fetch merchandise item');
        const data = await res.json();
        setItem(data);
        setVariant(data.sizes && data.sizes.length > 0 ? data.sizes[0] : '');
      } catch (err) {
        setError(err.message || 'Error loading item');
      }
      setLoading(false);
    };
    fetchItem();
    // Fetch cart count on mount
    fetchCartCount();
  }, [id]);

  const fetchCartCount = async () => {
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
    } catch {
      setCartCount(0);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: 80, color: 'red' }}>{error}</div>;
  if (!item) return <div style={{ textAlign: 'center', marginTop: 80 }}>Item not found.</div>;

  const handlePrev = () => {
    if (!item.images) return;
    setSliderIndex(idx => idx > 0 ? idx - 1 : item.images.length - 1);
  };
  const handleNext = () => {
    if (!item.images) return;
    setSliderIndex(idx => idx < item.images.length - 1 ? idx + 1 : 0);
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to add to cart.');
      return;
    }
          await fetch(`${API_ENDPOINTS.CART.BASE}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        eventId: item._id,
        eventName: item.name,
        ticketType: 'merch',
        ticketLabel: variant || 'Merchandise',
        price: item.price,
        quantity,
        imgUrl: item.images && item.images.length > 0 ? item.images[0] : item.imgUrl
      })
    });
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
    await fetchCartCount();
  };

  return (
    <div className="events-root">
      {/* Hero Section */}
      <section className="events-hero" style={{ backgroundImage: `url(${heroBg})` }}>
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
          <h1>{item.name}</h1>
        </div>
      </section>
      <main className="events-main" style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', gap: 48 }}>
        <div style={{ flex: 1 }}>
          {item.images ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                {item.images.length > 1 ? (
                  <>
                    <button
                      onClick={handlePrev}
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        fontSize: 28,
                        fontWeight: 700,
                        color: '#ed4690',
                        boxShadow: '0 2px 8px #0002',
                        cursor: 'pointer',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#ed4690'}
                      onMouseOut={e => e.currentTarget.style.background = '#fff'}
                      onFocus={e => e.currentTarget.style.background = '#ed4690'}
                      onBlur={e => e.currentTarget.style.background = '#fff'}
                      aria-label="Previous image"
                    >
                      <span style={{ color: 'inherit', fontWeight: 900, fontSize: 32, transition: 'color 0.2s' }}>&#8592;</span>
                    </button>
                  </>
                ) : null}
                <img
                  src={item.images[sliderIndex]}
                  alt={item.name + ' ' + (sliderIndex + 1)}
                  style={{ width: '100%', maxWidth: 480, borderRadius: 16, background: '#fff', objectFit: 'contain', maxHeight: 400, boxShadow: '0 2px 16px #0001' }}
                />
                {item.images.length > 1 ? (
                  <>
                    <button
                      onClick={handleNext}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        fontSize: 28,
                        fontWeight: 700,
                        color: '#ed4690',
                        boxShadow: '0 2px 8px #0002',
                        cursor: 'pointer',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#ed4690'}
                      onMouseOut={e => e.currentTarget.style.background = '#fff'}
                      onFocus={e => e.currentTarget.style.background = '#ed4690'}
                      onBlur={e => e.currentTarget.style.background = '#fff'}
                      aria-label="Next image"
                    >
                      <span style={{ color: 'inherit', fontWeight: 900, fontSize: 32, transition: 'color 0.2s' }}>&#8594;</span>
                    </button>
                    <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: '#fff8', borderRadius: 8, padding: '2px 8px', fontSize: 14 }}>
                      {(sliderIndex + 1)} / {item.images.length}
                    </div>
                  </>
                ) : null}
              </div>
              {/* Thumbnails */}
              {item.images.length > 1 && (
                <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
                  {item.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={item.name + ' thumbnail ' + (idx + 1)}
                      onClick={() => setSliderIndex(idx)}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: sliderIndex === idx ? '3px solid #ed4690' : '2px solid #eee',
                        cursor: 'pointer',
                        boxShadow: sliderIndex === idx ? '0 0 8px #ed469088' : 'none',
                        transition: 'border 0.2s, box-shadow 0.2s',
                        background: '#fff'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <img
              src={item.imgUrl}
              alt={item.name}
              style={{ width: '100%', borderRadius: 16, background: '#fff', objectFit: 'contain', maxHeight: 480 }}
            />
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <h2 style={{ color: '#ed4690', fontWeight: 700, fontSize: 32 }}>{item.name}</h2>
          <p style={{ color: '#ed4690', fontWeight: 700, fontSize: 24, margin: '12px 0' }}>${item.price.toFixed(2)}</p>
          <p style={{ fontSize: 18 }}>{item.description}</p>
          {/* Size/Variant Dropdown */}
          {item.sizes && item.sizes.length > 0 && (
            <div style={{ margin: '18px 0' }}>
              <label style={{ fontWeight: 600, fontSize: 16 }}>Select Size:</label>
              <select value={variant} onChange={e => setVariant(e.target.value)} style={{ marginLeft: 12, padding: 8, borderRadius: 8, border: '1.5px solid #eee', fontSize: 16 }}>
                {item.sizes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}
          <div style={{ margin: '18px 0' }}>
            <label style={{ fontWeight: 600, fontSize: 16 }}>Quantity:</label>
            <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ marginLeft: 12, padding: 8, borderRadius: 8, border: '1.5px solid #eee', fontSize: 16 }}>
              {[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>
          <button className="events-nav-btn" style={{ width: '100%', marginTop: 18, background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 12, padding: '14px 0', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px #ed469033', transition: 'background 0.2s' }} onClick={handleAddToCart}>
            <i className="fas fa-cart-plus" style={{ marginRight: 8 }}></i> Add to Cart
          </button>
          {addSuccess && <div style={{ color: '#30FF99', marginTop: 12, fontWeight: 600, textAlign: 'center' }}>Added to cart!</div>}
        </div>
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

export default ShopDetail; 