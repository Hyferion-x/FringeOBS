import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './events.css';
import heroBg from './resources/hero-bg.jpg';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';
const Shop = () => {
  const navigate = useNavigate();
  const [merchandise, setMerchandise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Track current image index for each item with multiple images
  const [sliderIndexes, setSliderIndexes] = useState({});
  // Filter state
  const [search, setSearch] = useState('');
  const [variant, setVariant] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    const fetchMerchandise = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(API_ENDPOINTS.MERCHANDISE.BASE);
        if (!res.ok) throw new Error('Failed to fetch merchandise');
        const data = await res.json();
        setMerchandise(data);
      } catch (err) {
        setError(err.message || 'Error loading merchandise');
      }
      setLoading(false);
    };
    fetchMerchandise();
  }, []);

  // Remove dynamic minPrice and maxPrice, set minPrice = 0 and maxPrice = 200
  const minPrice = 0;
  const maxPrice = 200;

  // Filtering logic
  const filteredMerch = merchandise.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (variant !== 'all') {
      if (variant === 'clothing' && item.type !== 'clothing') return false;
      if (variant === 'objects' && item.type !== 'object') return false;
    }
    if (item.price < priceRange[0] || item.price > priceRange[1]) return false;
    return true;
  });
  // Sorting logic
  const sortedMerch = [...filteredMerch].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    return 0;
  });

  const handlePrev = (id, imagesLength) => {
    setSliderIndexes(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? prev[id] - 1 : imagesLength - 1
    }));
  };
  const handleNext = (id, imagesLength) => {
    setSliderIndexes(prev => ({
      ...prev,
      [id]: prev[id] < imagesLength - 1 ? prev[id] + 1 : 0
    }));
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
            </button>
          </div>
        </header>
        <div className="events-hero-content">
          <h1>Merchandise</h1>
        </div>
      </section>
      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 18,
        alignItems: 'center',
        margin: '32px auto 0 auto',
        background: 'rgba(247,247,250,0.95)',
        borderRadius: 16,
        boxShadow: '0 2px 12px #ed469033',
        padding: '18px 24px',
        maxWidth: 1200,
        justifyContent: 'center',
      }}>
        <input
          type="text"
          placeholder="Search merchandise..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 16, minWidth: 180, background: '#fff', fontWeight: 500 }}
        />
        <select
          value={variant}
          onChange={e => setVariant(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 16, background: '#fff', fontWeight: 500 }}
        >
          <option value="all">All Types</option>
          <option value="clothing">Clothing</option>
          <option value="objects">Objects</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500, color: '#888', fontSize: 15 }}>Price</span>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={priceRange[0]}
            onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
            style={{ width: 100 }}
          />
          <span>${priceRange[0]}</span>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
            style={{ width: 100 }}
          />
          <span>${priceRange[1]}</span>
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 16, background: '#fff', fontWeight: 500 }}
        >
          <option value="default">Sort by</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A-Z</option>
          <option value="name-desc">Name: Z-A</option>
        </select>
      </div>
      <main className="events-main">
        <div className="shop-grid-4col" style={{ maxWidth: 1200, margin: '40px auto', gap: 32 }}>
          {loading ? (
            <p>Loading merchandise...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : sortedMerch.map(item => (
            <div key={item.id} className="event-card-2col" style={{ cursor: 'pointer' }}>
              <div className="event-image-2col" onClick={() => navigate(`/shop/${item._id}`)} style={{ position: 'relative' }}>
                {item.images && item.images.length > 1 ? (
                  <div style={{ position: 'relative', width: '100%', height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', position: 'relative', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={e => { e.stopPropagation(); handlePrev(item._id, item.images.length); }}
                        style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: '#fff8', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', zIndex: 2 }}
                        aria-label="Previous image"
                      >
                        &#8592;
                      </button>
                      <img
                        src={item.images[sliderIndexes[item._id] || 0]}
                        alt={item.name}
                        style={{ objectFit: 'cover', width: '100%', height: 220, borderRadius: 12, transition: '0.2s' }}
                      />
                      <button
                        onClick={e => { e.stopPropagation(); handleNext(item._id, item.images.length); }}
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#fff8', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', zIndex: 2 }}
                        aria-label="Next image"
                      >
                        &#8594;
                      </button>
                      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: '#fff8', borderRadius: 8, padding: '2px 8px', fontSize: 14 }}>
                        {((sliderIndexes[item._id] || 0) + 1)} / {item.images.length}
                      </div>
                    </div>
                    {/* Thumbnails */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                      {item.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={item.name + ' thumbnail ' + (idx + 1)}
                          onClick={e => { e.stopPropagation(); setSliderIndexes(prev => ({ ...prev, [item._id]: idx })); }}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 6,
                            border: (sliderIndexes[item._id] || 0) === idx ? '2px solid #ed4690' : '2px solid #eee',
                            cursor: 'pointer',
                            boxShadow: (sliderIndexes[item._id] || 0) === idx ? '0 0 6px #ed469088' : 'none',
                            transition: 'border 0.2s, box-shadow 0.2s',
                            background: '#fff'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <img src={item.images && item.images.length > 0 ? item.images[0] : item.imgUrl} alt={item.name} style={{ objectFit: 'cover', width: '100%', height: 220, borderRadius: 12 }} />
                )}
              </div>
              <div className="event-info-2col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0, padding: '18px' }}>
                <h3>{item.name}</h3>
                <p style={{ color: '#ed4690', fontWeight: 700, fontSize: 18 }}>${item.price.toFixed(2)}</p>
                <p>{item.description ? (item.description.length > 60 ? item.description.slice(0, 60) + '...' : item.description) : ''}</p>
                <button className="events-nav-btn" style={{ width: '100%', marginTop: 12, background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 12, padding: '12px 0', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px #ed469033', transition: 'background 0.2s' }} onClick={() => navigate(`/shop/${item._id}`)}>
                  Buy Now!
                </button>
              </div>
            </div>
          ))}
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

export default Shop; 