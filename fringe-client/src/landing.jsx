import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import './landing.css';

// Import images
import heroBg from './resources/hero-bg.jpg';
import event1 from './resources/event1.jpg';
import newsletterImage from './resources/Newsletter image.png';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';
const weekdays = ['Any', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Landing = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [place, setPlace] = useState("");
  const [weekday, setWeekday] = useState("Any");
  const [eventType, setEventType] = useState('Any');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(API_ENDPOINTS.EVENTS.BASE);
        const data = await response.json();
        if (response.ok) {
          setEvents(data);
        } else {
          setError(data.message || "Failed to fetch events");
        }
      } catch (err) {
        setError("Network error");
      }
      setLoading(false);
    };
    fetchEvents();

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

  const handleLoginClick = () => {
    navigate('/login');
  };

  // Helper to get day/month from event.date
  const getDayMonth = (dateStr) => {
    if (!dateStr) return { day: '', month: '' };
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  // Unique event types and categories from events
  const eventTypes = ['Any', ...Array.from(new Set(events.map(e => e.type || e.category).filter(Boolean)))];

  // Filtering logic
  const filteredEvents = events.filter(event => {
    // Search
    const term = search.toLowerCase();
    const matchesSearch =
      event.name?.toLowerCase().includes(term) ||
      event.description?.toLowerCase().includes(term) ||
      event.category?.toLowerCase().includes(term);
    // Place
    const matchesPlace = place === "" || event.venue?.toLowerCase().includes(place.toLowerCase());
    // Weekday
    const eventDate = event.date ? new Date(event.date) : null;
    const matchesWeekday =
      weekday === 'Any' ||
      (eventDate && weekdays[eventDate.getDay()] === weekday);
    // Event Type
    const matchesType =
      eventType === 'Any' ||
      (event.type ? event.type === eventType : event.category === eventType);
    return matchesSearch && matchesPlace && matchesWeekday && matchesType;
  });

  // For demo, trending = first 6, upcoming = next 6 (or all if <12)
  const trendingEvents = filteredEvents.slice(0, 6);
  const upcomingEvents = filteredEvents.slice(6, 12).length ? filteredEvents.slice(6, 12) : filteredEvents.slice(0, 6);

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
      {/* Hero Section */}
      <section className="hero-section" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-logo">
            <h1>ADELAIDE FRINGE</h1>
            <span className="date">21 FEB - 23 MAR</span>
          </div>
          <div className="nav-links">
            <button className="events-nav-link" onClick={() => navigate('/shop')}>Shop</button>
            <button className="events-nav-link" onClick={() => navigate('/events')}>Events</button>
            <button className="events-nav-link" onClick={() => navigate('/myorders')}>My Orders</button>
            <button className="events-nav-link" onClick={() => navigate('/contact')}>Contact</button>
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
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
                  <div style={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: 50, 
                    background: isDarkMode ? '#333' : '#fff', 
                    border: `1px solid ${isDarkMode ? '#444' : '#eee'}`, 
                    borderRadius: 8, 
                    boxShadow: '0 2px 12px rgba(85,34,204,0.08)', 
                    minWidth: 140, 
                    zIndex: 100 
                  }}>
                    <button 
                      style={{ 
                        width: '100%', 
                        padding: '10px 16px', 
                        background: 'none', 
                        border: 'none', 
                        textAlign: 'left', 
                        cursor: 'pointer',
                        color: isDarkMode ? '#fff' : '#333'
                      }} 
                      onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                    >
                      My Profile
                    </button>
                    <button 
                      style={{ 
                        width: '100%', 
                        padding: '10px 16px', 
                        background: 'none', 
                        border: 'none', 
                        textAlign: 'left', 
                        cursor: 'pointer', 
                        color: '#ed4690' 
                      }} 
                      onClick={() => { localStorage.removeItem('token'); setShowProfileMenu(false); navigate('/login'); }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="login-btn" onClick={handleLoginClick}>Login</button>
            )}
          </div>
        </nav>
        {/* Hero Content */}
        <div className="hero-content">
          <h1>
            FINAL WEEKEND for 2025<br />Adelaide fringe is here..!!
          </h1>
          <p>Look no further! Our SBS The Show tickets are the simplest way for you to experience a live Kpop recording.</p>
          <div className="hero-buttons">
            <button
              className="get-ticket-btn"
              onClick={() => navigate('/events')}
            >
              Get Ticket
            </button>
            <button className="learn-more-btn" onClick={() => navigate('/aboutus')}>Learn More</button>
          </div>
        </div>
        {/* Search Box */}
        <div className="search-box">
          <div className="search-group">
            <div className="search-item" style={{ position: 'relative' }}>
              <label>Search Event</label>
              <input
                type="text"
                placeholder="Search by event name, artist, or keyword…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2em' }}
              />
              <span style={{
                position: 'absolute',
                left: '0.8em',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#bdbdfc',
                fontSize: '1.1em',
                pointerEvents: 'none',
                opacity: 0.8
              }}>
                <i className="fas fa-search"></i>
              </span>
            </div>
            <div className="search-item">
              <label>Place</label>
              <input
                type="text"
                placeholder="Enter a place or venue…"
                value={place}
                onChange={e => setPlace(e.target.value)}
              />
            </div>
            <div className="search-item">
              <label className="floating-label">Select time</label>
              <div className="custom-select-wrapper">
                <select className="custom-select" value={weekday} onChange={e => setWeekday(e.target.value)}>
                  <option value="Any">Any</option>
                  {weekdays.filter(day => day !== 'Any').map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <span className="dropdown-icon">▼</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="events-section">
        <div className="section-header">
          <h2>Upcoming Events</h2>
          <div className="filters">
            <div className="filter-item">
              <label className="floating-label">Select category</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)}>
                <option value="Any">Any</option>
                {eventTypes.filter(type => type !== 'Any').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#ed4690', fontWeight: 600 }}>Loading events...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>
        ) : (
          <div className="events-grid">
            {upcomingEvents.map((event) => {
              const { day, month } = getDayMonth(event.date);
              return (
                <div key={event._id || event.id} className="event-card" onClick={() => navigate(`/events/${event._id || event.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="event-image">
                    <img src={event.imgUrl || event1} alt={event.name || event.title} />
                  </div>
                  <div className="event-content">
                    <div className="event-date">
                      <span className="day">{day}</span>
                      <span className="month">{month}</span>
                    </div>
                    <h3>{event.name || event.title}</h3>
                    <p>{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button className="load-more" onClick={() => navigate('/events')}>Load More</button>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter">
        <div className="newsletter-card">
          <div className="newsletter-image">
            <img src={newsletterImage} alt="Newsletter" />
          </div>
          <div className="newsletter-content">
            <h2>BE THE FIRST TO KNOW ABOUT THE GIVEAWAYS, DISCOUNTS AND MANY MORE..!!</h2>
            <div className="newsletter-form">
              <input type="email" placeholder="Enter your email address" />
              <button>SIGN UP</button>
            </div>
            <p>By signing up to Fringe eNews, you're also agreeing to our T&Cs.</p>
          </div>
        </div>
      </section>

      {/* Trending Events Section */}
      <section className="events-section trending">
        <div className="section-header">
          <h2>Trending Events</h2>
          <div className="filters">
            <div className="filter-item">
              <label className="floating-label">Select category</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)}>
                <option value="Any">Any</option>
                {eventTypes.filter(type => type !== 'Any').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#ed4690', fontWeight: 600 }}>Loading events...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>
        ) : (
          <div className="events-grid">
            {trendingEvents.map((event) => {
              const { day, month } = getDayMonth(event.date);
              return (
                <div key={event._id || event.id} className="event-card" onClick={() => navigate(`/events/${event._id || event.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="event-image">
                    <img src={event.imgUrl || event1} alt={event.name || event.title} />
                  </div>
                  <div className="event-content">
                    <div className="event-date">
                      <span className="day">{day}</span>
                      <span className="month">{month}</span>
                    </div>
                    <h3>{event.name || event.title}</h3>
                    <p>{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button className="load-more" onClick={() => navigate('/events')}>Load More</button>
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

export default Landing; 