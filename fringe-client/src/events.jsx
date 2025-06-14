import React, { useEffect, useState } from 'react';
import './events.css';
import heroBg from './resources/hero-bg.jpg';
import event1 from './resources/event1.jpg';
import { useNavigate } from 'react-router-dom';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';
const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [priceType, setPriceType] = useState('all'); // all, free, paid
  const [dateFilter, setDateFilter] = useState(''); // '', 'today', 'tomorrow', 'week', 'weekend', 'pick'
  const [pickedDate, setPickedDate] = useState('');
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

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
  }, []);

  useEffect(() => {
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
    // Optionally, poll or listen for changes
  }, []);

  // Get unique categories from events
  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));
  // Get min/max standard price from events
  const allPrices = events.map(e => e.ticketPrices?.standard ?? 0);
  const minPrice = Math.min(...allPrices, 0);
  const maxPrice = Math.max(...allPrices, 1000);
  // Get unique venues from events
  const venues = Array.from(new Set(events.map(e => e.venue).filter(Boolean)));

  function isEventInDateFilter(event, dateFilter, pickedDate) {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekendStart = new Date(today);
    weekendStart.setDate(today.getDate() + (6 - dayOfWeek)); // Saturday
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendStart.getDate() + 1); // Sunday

    if (dateFilter === 'today') {
      return eventDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'tomorrow') {
      return eventDate.toDateString() === tomorrow.toDateString();
    } else if (dateFilter === 'week') {
      return eventDate >= weekStart && eventDate <= weekEnd;
    } else if (dateFilter === 'weekend') {
      return eventDate >= weekendStart && eventDate <= weekendEnd;
    } else if (dateFilter === 'pick' && pickedDate) {
      return eventDate.toISOString().slice(0, 10) === pickedDate;
    }
    return true;
  }

  // Filter and sort events before rendering
  const filteredEvents = events.filter(event => {
    const term = searchTerm.toLowerCase();
    const matchesText =
      event.name?.toLowerCase().includes(term) ||
      event.description?.toLowerCase().includes(term) ||
      event.venue?.toLowerCase().includes(term) ||
      event.category?.toLowerCase().includes(term);
    const matchesPlace = place ? event.venue?.toLowerCase().includes(place.toLowerCase()) : true;
    const matchesDate = isEventInDateFilter(event, dateFilter, pickedDate);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category);
    const price = event.ticketPrices?.standard ?? 0;
    const matchesPriceType =
      priceType === 'all' ? true :
      priceType === 'free' ? price === 0 :
      priceType === 'paid' ? price > 0 : true;
    const matchesPriceRange = price >= priceRange[0] && price <= priceRange[1];
    const matchesVenue = selectedVenues.length === 0 || selectedVenues.includes(event.venue);
    return matchesText && matchesPlace && matchesDate && matchesCategory && matchesPriceType && matchesPriceRange && matchesVenue;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === "price") {
      return (a.ticketPrices?.standard || 0) - (b.ticketPrices?.standard || 0);
    }
    // relevance: no sorting
    return 0;
  });

  const handleProfileClick = () => setShowProfileMenu(v => !v);
  const handleLogout = () => {
    localStorage.removeItem('token');
    setShowProfileMenu(false);
    navigate('/login');
  };

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClick = (e) => {
      if (!e.target.closest('.events-navbar-right')) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);

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
            {isLoggedIn ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  className="events-nav-btn"
                  style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, fontSize: 22, background: '#fff', color: '#ed4690', border: '1.5px solid #ed4690', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={handleProfileClick}
                  aria-label="Profile menu"
                >
                  <i className="fas fa-user-circle"></i>
                </button>
                {showProfileMenu && (
                  <div style={{ position: 'absolute', right: 0, top: 50, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 12px rgba(85,34,204,0.08)', minWidth: 140, zIndex: 100 }}>
                    <button style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>My Profile</button>
                    <button style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#ed4690' }} onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="events-nav-btn" onClick={() => navigate('/login')}>Login</button>
            )}
          </div>
        </header>
        <div className="events-hero-content">
          <h1>Discover a world of exciting events—find your next adventure!</h1>
        </div>
      </section>
      <div className="events-search-bar-wrapper">
        <div className="events-search-bar">
          <div className="events-search-field">
            <label>Search Event</label>
            <input
              type="text"
              className="events-search-value"
              placeholder="Search by name, description, venue, category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="events-search-field">
            <label>Place</label>
            <input
              type="text"
              className="events-search-value"
              placeholder="Search by venue..."
              value={place}
              onChange={e => setPlace(e.target.value)}
            />
          </div>
          <div className="events-search-field events-search-field-date">
            <label>Date</label>
            <input
              type="date"
              className="events-search-value events-search-date-value"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="events-main">
        {/* Sidebar Filters */}
        <aside className="events-filters">
          <h2>Filters</h2>
          {/* Price Type Filter */}
          <div className="filter-group">
            <h3>Price</h3>
            <label><input type="radio" name="priceType" value="all" checked={priceType === 'all'} onChange={() => setPriceType('all')} /> All</label>
            <label><input type="radio" name="priceType" value="free" checked={priceType === 'free'} onChange={() => setPriceType('free')} /> Free</label>
            <label><input type="radio" name="priceType" value="paid" checked={priceType === 'paid'} onChange={() => setPriceType('paid')} /> Paid</label>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontWeight: 500 }}>Standard Price Range</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[0]}
                  onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                  style={{ flex: 1 }}
                />
                <span>${priceRange[0]}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  style={{ flex: 1 }}
                />
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </div>
          {/* Category Filter */}
          <div className="filter-group">
            <h3>Category</h3>
            {categories.map(cat => (
              <label key={cat}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={e => {
                    setSelectedCategories(
                      e.target.checked
                        ? [...selectedCategories, cat]
                        : selectedCategories.filter(c => c !== cat)
                    );
                  }}
                /> {cat}
              </label>
            ))}
          </div>
          {/* Date Filter */}
          <div className="filter-group">
            <h3>Date</h3>
            <label><input type="radio" name="dateFilter" value="today" checked={dateFilter === 'today'} onChange={() => setDateFilter('today')} /> Today</label>
            <label><input type="radio" name="dateFilter" value="tomorrow" checked={dateFilter === 'tomorrow'} onChange={() => setDateFilter('tomorrow')} /> Tomorrow</label>
            <label><input type="radio" name="dateFilter" value="week" checked={dateFilter === 'week'} onChange={() => setDateFilter('week')} /> This Week</label>
            <label><input type="radio" name="dateFilter" value="weekend" checked={dateFilter === 'weekend'} onChange={() => setDateFilter('weekend')} /> This Weekend</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="radio" name="dateFilter" value="pick" checked={dateFilter === 'pick'} onChange={() => setDateFilter('pick')} />
              Pick a Date
              {dateFilter === 'pick' && (
                <input
                  type="date"
                  value={pickedDate}
                  onChange={e => setPickedDate(e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              )}
            </label>
          </div>
          {/* Venue Filter */}
          <div className="filter-group">
            <h3>Venue</h3>
            {venues.map(venue => (
              <label key={venue}>
                <input
                  type="checkbox"
                  checked={selectedVenues.includes(venue)}
                  onChange={e => {
                    setSelectedVenues(
                      e.target.checked
                        ? [...selectedVenues, venue]
                        : selectedVenues.filter(v => v !== venue)
                    );
                  }}
                /> {venue}
              </label>
            ))}
          </div>
        </aside>

        {/* Events Grid and Sort */}
        <section className="events-content">
          <div className="events-sort-row">
            <span>Sort by:</span>
            <div className="events-sort-select-wrapper">
              <select
                className="events-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="price">Price</option>
              </select>
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>
          {loading ? (
            <div>Loading events...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : (
            <div className="events-grid-2col">
              {sortedEvents.map((event) => (
                <div key={event._id || event.id} className="event-card-2col" onClick={() => navigate(`/events/${event._id || event.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="event-image-2col">
                    <img src={event.imgUrl || event1} alt={event.name} />
                  </div>
                  <div className="event-info-2col">
                    <div className="event-details-2col">
                      <h3>{event.name}</h3>
                      <p>{event.description}</p>
                      <p><strong>Venue:</strong> {event.venue}</p>
                      <p><strong>Date:</strong> {event.date ? new Date(event.date).toLocaleString() : ''}</p>
                      <p><strong>Category:</strong> {event.category}</p>
                      <p>
                        <strong>Ticket Prices:</strong>
                        <ul>
                          <li>Standard: ${event.ticketPrices?.standard}</li>
                          <li>VIP: ${event.ticketPrices?.vip}</li>
                          <li>Student: ${event.ticketPrices?.student}</li>
                        </ul>
                      </p>
                      <p><strong>Seating Capacity:</strong> {event.seatingCapacity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="events-load-more">Load More</button>
        </section>
      </main>

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

export default Events;
