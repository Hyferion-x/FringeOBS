import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import './events.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';
const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [transferModal, setTransferModal] = useState({ open: false, ticket: null });
  const [cancelLoading, setCancelLoading] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [sortBy, setSortBy] = useState('none'); // 'none', 'date-asc', 'date-desc', 'quantity-asc', 'quantity-desc'
  const [activeTab, setActiveTab] = useState('tickets');
  const [shopOrders, setShopOrders] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  // Helper function to extract ID from ObjectId string format
  const extractIdFromObjectId = (objectIdString) => {
    if (!objectIdString) return null;
    
    // Handle the case where it's already a clean ID
    if (typeof objectIdString === 'string' && !objectIdString.includes('ObjectId')) {
      return objectIdString;
    }
    
    // Handle ObjectId('xxxxx') format
    try {
      const match = objectIdString.toString().match(/ObjectId\(['"](.*)['"]\)/);
      return match ? match[1] : objectIdString.toString();
    } catch (err) {
      console.error('Error extracting ID:', err);
      return objectIdString.toString();
    }
  };

  // Helper function to get a clean event name
  const getCleanEventName = (ticket, eventMap, bookingDetailsMap) => {
    // Import default image - using resources/event1.jpg as fallback
    const defaultEventImage = require('./resources/event1.jpg');
    
    // Object to hold both event name and image
    const result = {
      name: "",
      image: ticket.eventImage || null
    };

    // First check if the ticket already has an event name that's not "Event"
    if (ticket.eventName && !ticket.eventName.startsWith('Event')) {
      result.name = ticket.eventName;
      if (ticket.eventImage) {
        return {name: ticket.eventName, image: ticket.eventImage};
      }
    }
    
    // Get the clean IDs
    const eventId = extractIdFromObjectId(ticket.eventId);
    const bookingId = extractIdFromObjectId(ticket.bookingId);
    
    // Try to get name from event map
    if (eventId && eventMap[eventId]) {
      const name = eventMap[eventId].name || eventMap[eventId].title;
      if (name) {
        result.name = name;
        if (eventMap[eventId].imgUrl) {
          result.image = eventMap[eventId].imgUrl;
          return result;
        }
      }
    }
    
    // Try to get from booking details
    if (bookingId && bookingDetailsMap[bookingId] && bookingDetailsMap[bookingId].eventName) {
      result.name = bookingDetailsMap[bookingId].eventName;
      if (bookingDetailsMap[bookingId].eventImage) {
        result.image = bookingDetailsMap[bookingId].eventImage;
        return result;
      }
    }
    
    // Try cart history
    const cartHistory = JSON.parse(localStorage.getItem('cartHistory') || '[]');
    
    // Look for exact eventId match
    let matchingItem = cartHistory.find(item => 
      item.eventId === eventId || item.eventId === bookingId
    );
    
    if (matchingItem && matchingItem.eventName) {
      result.name = matchingItem.eventName;
      if (matchingItem.eventImage) {
        result.image = matchingItem.eventImage;
        return result;
      }
    }
    
    // Try looking for events in local storage with matching ID parts
    if (eventId) {
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      
      // Try to find a matching event by ID substring comparison
      const matchingEvent = events.find(event => {
        const storedEventId = event._id || event.id;
        return storedEventId && (
          storedEventId.includes(eventId) || 
          (eventId && eventId.includes(storedEventId))
        );
      });
      
      if (matchingEvent) {
        const name = matchingEvent.name || matchingEvent.title;
        if (name) {
          result.name = name;
          if (matchingEvent.imgUrl) {
            result.image = matchingEvent.imgUrl;
            return result;
          }
        }
      }
      
      // Try all cart history items for partial ID matching
      const partialMatch = cartHistory.find(item => {
        const itemEventId = item.eventId;
        return itemEventId && (
          itemEventId.includes(eventId) || 
          (eventId && eventId.includes(itemEventId))
        );
      });
      
      if (partialMatch && partialMatch.eventName) {
        result.name = partialMatch.eventName;
        if (partialMatch.eventImage) {
          result.image = partialMatch.eventImage;
          return result;
        }
      }
    }
    
    // Check in localStorage directly for events that might have been browsed
    try {
      // Attempt to find event data from any stored event lists
      const browseEventsList = JSON.parse(localStorage.getItem('browseEvents') || '[]');
      const allStoredEvents = [
        ...JSON.parse(localStorage.getItem('events') || '[]'),
        ...browseEventsList,
        ...JSON.parse(localStorage.getItem('popularEvents') || '[]'),
        ...JSON.parse(localStorage.getItem('upcomingEvents') || '[]')
      ];
      
      for (const storedEvent of allStoredEvents) {
        // Match by any ID field
        if ((storedEvent._id && (storedEvent._id === eventId || storedEvent._id === bookingId)) ||
            (storedEvent.id && (storedEvent.id === eventId || storedEvent.id === bookingId))) {
          const name = storedEvent.name || storedEvent.title;
          if (name) {
            result.name = name;
            if (storedEvent.imgUrl) {
              result.image = storedEvent.imgUrl; 
              return result;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking localStorage for events:', err);
    }
    
    // Try fetching directly from API as a last resort
    try {
      if (eventId) {
        // Note: This is a synchronous fetch within a helper function
        // In a real app, this would be restructured to be async/await
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `API_ENDPOINTS.EVENTS.BASE/${eventId}`, false); // false for synchronous
        xhr.send();
        
        if (xhr.status === 200) {
          const event = JSON.parse(xhr.responseText);
          if (event && (event.name || event.title)) {
            // Also save this for future reference
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            if (!events.some(e => e._id === event._id || e.id === event.id)) {
              events.push(event);
              localStorage.setItem('events', JSON.stringify(events.slice(-50)));
            }
            result.name = event.name || event.title;
            if (event.imgUrl) {
              result.image = event.imgUrl;
              return result; 
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in direct event fetch:', err);
    }

    // Create a reasonable name using ticket properties
    let ticketInfo = '';
    if (ticket.venue) ticketInfo += ` at ${ticket.venue}`;
    if (ticket.date) ticketInfo += ` on ${new Date(ticket.date).toLocaleDateString()}`;
    if (ticket.ticketType) ticketInfo += ` (${ticket.ticketType})`;
    
    if (ticketInfo) {
      result.name = `Event${ticketInfo}`;
    } else {
      // Very last fallback if nothing else works
      result.name = eventId ? `Event ${eventId.substring(0, 8)}...` : 'Event';
    }
    
    // Ensure default image is set if we still don't have one
    if (!result.image) {
      result.image = defaultEventImage;
    }
    
    return result;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    // Fetch the current user's profile to get their userId
          fetch(API_ENDPOINTS.AUTH.PROFILE, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Auth check failed: ${res.status}`);
        }
        return res.json();
      })
      .then(userData => {
        const userId = userData._id || userData.id;
        // Now fetch ticket orders
        return fetch(API_ENDPOINTS.ORDERS.TICKETS, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch tickets. Status: ${res.status}`);
          }
          return res.json().then(ticketData => ({ ticketData, userId }));
        });
      })
      .then(({ ticketData, userId }) => {
        // Only show tickets for the logged-in user
        const userTickets = ticketData.filter(ticket => {
          if (!ticket.userId) return false;
          if (typeof ticket.userId === 'object' && ticket.userId._id) {
            return ticket.userId._id === userId;
          }
          return ticket.userId === userId;
        });
        // Extract bookingIds to fetch booking details 
        const bookingIds = userTickets
            .map(ticket => extractIdFromObjectId(ticket.bookingId))
            .filter(id => id && typeof id === 'string');
            
        console.log('Booking IDs to fetch:', bookingIds);
        
        // Get booking details for all tickets in batch
        const fetchBookingDetails = async () => {
          // Get event names from bookings
          const bookingDetailsMap = {};
          
          try {
            // Try to fetch all bookings at once if supported
            const allBookingsResponse = await fetch(API_ENDPOINTS.BOOKINGS.BASE, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (allBookingsResponse.ok) {
              const allBookings = await allBookingsResponse.json();
              console.log('Got all bookings:', allBookings);
              
              // Create map of bookingId to booking details
              allBookings.forEach(booking => {
                if (booking._id) {
                  bookingDetailsMap[booking._id] = booking;
                }
              });
            }
          } catch (error) {
            console.error('Error fetching all bookings:', error);
          }
          
          // For those we couldn't get in batch, try individual fetch
          for (const bookingId of bookingIds) {
            if (!bookingDetailsMap[bookingId]) {
              try {
                // Try to directly get booking details
                const response = await fetch(API_ENDPOINTS.BOOKINGS.BY_ID(bookingId), {
                  headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  const bookingData = await response.json();
                  bookingDetailsMap[bookingId] = bookingData;
                  console.log(`Successfully fetched booking data for ${bookingId}:`, bookingData);
                }
              } catch (error) {
                console.error(`Error fetching booking ${bookingId}:`, error);
              }
            }
          }
          
          console.log('Booking details map:', bookingDetailsMap);
          return bookingDetailsMap;
        };
        
        // Now with booking details in hand, get event details for each event
        const processTicketsWithBookings = async () => {
          // 1. Get booking details
          const bookingDetailsMap = await fetchBookingDetails();
          
          // 2. Extract eventIds from bookings
          const eventIds = [...new Set(
            Object.values(bookingDetailsMap)
              .map(booking => booking?.eventId)
              .filter(id => id)
          )];
          
          console.log('Event IDs extracted from bookings:', eventIds);
          
          // Get previously saved cart items to use as fallback
          const cartHistory = JSON.parse(localStorage.getItem('cartHistory') || '[]');
          console.log('Cart history for reference:', cartHistory);
          
          // 3. Get event details
          const eventMap = {};
          
          // First try to get all events at once
          try {
            const allEventsResponse = await fetch(API_ENDPOINTS.EVENTS.BASE, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (allEventsResponse.ok) {
              const allEvents = await allEventsResponse.json();
              console.log(`Got ${allEvents.length} events`);
              
              // Create map of eventId to event details
              allEvents.forEach(event => {
                if (event._id) {
                  eventMap[event._id] = event;
                }
              });
            }
          } catch (error) {
            console.error('Error fetching all events:', error);
          }
          
          // 4. Process tickets with all the data
          const enrichedTickets = userTickets.map(ticket => {
            // Extract clean IDs
            const bookingIdClean = extractIdFromObjectId(ticket.bookingId);
            // Get booking details using bookingId
            const bookingDetails = bookingDetailsMap[bookingIdClean];
            const eventId = bookingDetails?.eventId ? 
               extractIdFromObjectId(bookingDetails.eventId) : null;
            const event = eventId ? eventMap[eventId] : null;
            // Try to get event from cart history as fallback
            let cartHistoryMatch = null;
            if (eventId && (!event || (!event.name && !event.title))) {
              cartHistoryMatch = cartHistory.find(item => item.eventId === eventId);
            }
            // Import default image
            const defaultEventImage = require('./resources/event1.jpg');
            // Prioritize name from: booking > event > cart history > fallback
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const finalEventName = getCleanEventName(ticket, eventMap, bookingDetailsMap);
            console.log(`Final event name for ticket ${ticket._id}: ${finalEventName.name}`);
            // Add all collected info to ticket
            return {
              ...ticket,
              eventId,
              eventName: finalEventName.name,
              eventDate: 
                bookingDetails?.eventDate ||
                (event && event.date) ||
                (cartHistoryMatch && cartHistoryMatch.eventDate) ||
                null,
              ticketType: 
                bookingDetails?.ticketType ||
                ticket.ticketType ||
                (cartHistoryMatch && cartHistoryMatch.ticketType) ||
                'Standard',
              quantity: 1, // Always 1 per TicketOrder
              eventImage: finalEventName.image || defaultEventImage
            };
          });
          
          return enrichedTickets;
        };
        
        // Process tickets with all data sources
        processTicketsWithBookings()
          .then(enrichedTickets => {
            if (enrichedTickets.length > 0) {
              console.log(`Found ${enrichedTickets.length} tickets for user ${userId}`);
              setTickets(enrichedTickets);
              setDebugInfo(prev => `${prev}\nUsing ${enrichedTickets.length} tickets from API with enriched data`);
            } else {
              setTickets([]);
              setDebugInfo(prev => `${prev}\nNo tickets found in API`);
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Error processing tickets with bookings:', error);
            
            setTickets([]);
            setError(`Could not process tickets. ${error.message}`);
            
            setLoading(false);
          });
      })
      .catch(err => {
        console.error('Error fetching tickets:', err);
        setDebugInfo(prev => `${prev}\nError: ${err.message}`);
        
        setTickets([]);
        setError(`Could not load tickets. ${err.message}`);
        
        setLoading(false);
      });
    
    // Cart badge logic
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 0), 0));
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, [navigate]);

  // Fetch shop orders from DB only, deduplicate by orderId
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
          fetch(API_ENDPOINTS.ORDERS.SHOP, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        // Deduplicate by _id
        const uniqueOrders = data.filter((order, idx, arr) =>
          arr.findIndex(x => x._id === order._id) === idx
        );
        setShopOrders(uniqueOrders);
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const dropdown = document.getElementById('sort-dropdown-menu');
      const dropdownButton = document.getElementById('sort-dropdown-button');
      
      if (dropdown && dropdownButton && 
          !dropdown.contains(e.target) && 
          !dropdownButton.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter tickets by search
  const filteredTickets = tickets.filter(ticket => {
    const term = search.toLowerCase();
    return (
      ticket.eventName?.toLowerCase().includes(term) ||
      ticket.ticketType?.toLowerCase().includes(term) ||
      ticket._id?.toLowerCase().includes(term) ||
      ticket.status?.toLowerCase().includes(term)
    );
  });
  
  // Sort tickets based on selected sort option
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.eventDate || '2099-12-31') - new Date(b.eventDate || '2099-12-31');
      case 'date-desc':
        return new Date(b.eventDate || '1970-01-01') - new Date(a.eventDate || '1970-01-01');
      case 'quantity-asc':
        return (a.quantity || 1) - (b.quantity || 1);
      case 'quantity-desc':
        return (b.quantity || 1) - (a.quantity || 1);
      default:
        return 0; // No sorting
    }
  });
  
  // Get sort text display
  const getSortText = () => {
    switch (sortBy) {
      case 'date-asc': return 'Date (Earliest first)';
      case 'date-desc': return 'Date (Latest first)';
      case 'quantity-asc': return 'Quantity (Low to High)';
      case 'quantity-desc': return 'Quantity (High to Low)';
      default: return 'Sort by';
    }
  };

  // Special function to fetch proper event names for all tickets
  const fetchEventNames = useCallback(async (ticketsToUpdate) => {
    // Skip if no tickets or already using local fallback
    if (!ticketsToUpdate.length) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Create a copy of tickets we can update
    const updatedTickets = [...ticketsToUpdate];
    let hasUpdates = false;

    // Import event image as fallback (use an image from resources folder)
    const defaultEventImage = require('./resources/event1.jpg');

    // Direct ID to name mapping for problematic tickets - last resort fallback
    const knownEventIds = {
      '681c1eb7a456b8ba6574c98a': 'Adelaide Summer Festival 2025',
      '681c225': 'Comedy Night Show',
      '681c2252a456b8ba6574ca': 'Classical Music Evening',
      '681c2252a456b8ba6574ca14': 'Adelaide Fringe - Main Event',
      '68c252a456b8ba6574ca14': 'Adelaide Fringe - Main Event',
      '6771a8a0b1ff70a3d3950cde': 'Adelaide Arts Festival',
      '6771a7386a3550aeeb55049': 'Live Music Concert'
    };

    // For each ticket, try to get its proper event name from various sources
    for (let i = 0; i < updatedTickets.length; i++) {
      const ticket = updatedTickets[i];
      
      // Skip if ticket already has a proper event name and image
      if (ticket.eventName && !ticket.eventName.startsWith('Event') && ticket.eventImage) continue;
      
      // Get clean eventId
      const eventId = extractIdFromObjectId(ticket.eventId);
      if (!eventId) continue;

      // Step 1: Try the direct known ID mapping first
      const exactMatch = knownEventIds[eventId];
      if (exactMatch) {
        updatedTickets[i] = {
          ...ticket,
          eventName: exactMatch,
          // Keep existing image if we have one
          eventImage: ticket.eventImage || defaultEventImage
        };
        hasUpdates = true;
        continue;
      }

      // Step 2: Try partial ID matching for known events
      const partialMatch = Object.keys(knownEventIds).find(id => 
        id.includes(eventId) || eventId.includes(id)
      );
      
      if (partialMatch) {
        updatedTickets[i] = {
          ...ticket,
          eventName: knownEventIds[partialMatch],
          // Keep existing image if we have one
          eventImage: ticket.eventImage || defaultEventImage
        };
        hasUpdates = true;
        continue;
      }

      // Step 3: As a last resort, try API fetch
      try {
        // Try to fetch the event directly from the API
        const response = await fetch(API_ENDPOINTS.EVENTS.BY_ID(eventId), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const eventData = await response.json();
          // If we got valid event data with a name, update the ticket
          if (eventData && (eventData.name || eventData.title)) {
            updatedTickets[i] = {
              ...ticket,
              eventName: eventData.name || eventData.title,
              // Also update any other event details we might need
              eventDate: eventData.date || ticket.eventDate,
              // Add event image
              eventImage: eventData.imgUrl || ticket.eventImage || defaultEventImage
            };
            hasUpdates = true;
            
            // Also save this to localStorage for future reference
            try {
              const events = JSON.parse(localStorage.getItem('events') || '[]');
              if (!events.some(e => e._id === eventData._id)) {
                events.push(eventData);
                localStorage.setItem('events', JSON.stringify(events.slice(-50)));
              }
            } catch (err) {
              console.error('Error saving event to localStorage:', err);
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching event ${eventId}:`, err);
      }
    }
    
    // Only update state if we actually found new event names
    if (hasUpdates) {
      setTickets(updatedTickets);
    }
  }, [extractIdFromObjectId]);
  
  // Call fetchEventNames whenever tickets are loaded
  useEffect(() => {
    if (tickets.length > 0 && !loading) {
      fetchEventNames(tickets);
    }
  }, [tickets, tickets.length, loading, fetchEventNames]);

  // Utility: Download ticket as PDF
  const handleDownloadPDF = async (ticketId) => {
    const ticketDiv = document.getElementById(`ticket-${ticketId}`);
    if (!ticketDiv) return;
    const canvas = await html2canvas(ticketDiv, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`ticket-${ticketId}.pdf`);
  };

  // Utility: Print ticket
  const handlePrint = (ticketId) => {
    const ticketDiv = document.getElementById(`ticket-${ticketId}`);
    if (!ticketDiv) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Ticket</title>');
    printWindow.document.write('<link rel="stylesheet" href="/events.css" />');
    printWindow.document.write('</head><body >');
    printWindow.document.write(ticketDiv.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };



  // Add handleDelete function
  const handleDelete = async (ticket) => {
    setCancelLoading(ticket._id || ticket.id);
    setActionMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`API_ENDPOINTS.ORDERS.TICKETS/${ticket._id || ticket.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('Ticket deleted.');
        setTickets(tickets => tickets.filter(t => (t._id || t.id) !== (ticket._id || ticket.id)));
      } else {
        setActionMessage(data.message || 'Delete failed.');
      }
    } catch (err) {
      setActionMessage('Network error.');
    }
    setCancelLoading('');
  };

  return (
    <div className="events-root" style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation/Header Section */}
      <section className="events-hero" style={{ backgroundImage: `url('https://festivalcityadelaide.com.au/wp-content/uploads/2022/07/HERO-AF2020-FIREGARDEN-HI-041_credit-Andrew-Beveridge-1600x1065.jpg')`, minHeight: 120 }}>
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
          <h1>My Orders</h1>
        </div>
      </section>
      {/* Main Tickets Content */}
      <div style={{ maxWidth: 1000, margin: '40px auto 0 auto', flex: 1, width: '100%' }}>
        <div style={{ display: 'flex', gap: 24, margin: '32px 0 24px 0', justifyContent: 'center' }}>
          <button onClick={() => setActiveTab('tickets')} style={{ fontWeight: 700, fontSize: 18, color: activeTab === 'tickets' ? '#ed4690' : '#232323', background: 'none', border: 'none', borderBottom: activeTab === 'tickets' ? '3px solid #ed4690' : 'none', padding: '8px 24px', cursor: 'pointer' }}>Event Tickets</button>
          <button onClick={() => setActiveTab('shop')} style={{ fontWeight: 700, fontSize: 18, color: activeTab === 'shop' ? '#ed4690' : '#232323', background: 'none', border: 'none', borderBottom: activeTab === 'shop' ? '3px solid #ed4690' : 'none', padding: '8px 24px', cursor: 'pointer' }}>Shop Orders</button>
        </div>
        {activeTab === 'tickets' && (
          <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#232323', margin: 0 }}>Your Tickets</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div 
                  id="sort-dropdown-button"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    border: `1.5px solid ${sortBy !== 'none' ? '#5522cc' : '#ccc'}`, 
                    borderRadius: 8, 
                    cursor: 'pointer',
                    background: sortBy !== 'none' ? '#f6f4ff' : '#f9f9f9',
                    transition: 'all 0.2s ease',
                    minWidth: 200,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ed4690';
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = sortBy !== 'none' ? '#5522cc' : '#ccc';
                    e.currentTarget.style.background = sortBy !== 'none' ? '#f6f4ff' : '#f9f9f9';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    const menu = document.getElementById('sort-dropdown-menu');
                    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                  }}
                >
                  <i className="fas fa-sort" style={{ marginRight: 10, color: '#5522cc' }}></i>
                  <span style={{ flex: 1, fontSize: 15, color: '#444' }}>{getSortText()}</span>
                  <i className="fas fa-chevron-down" style={{ color: '#777', fontSize: 14 }}></i>
                </div>
                <div 
                  id="sort-dropdown-menu" 
                  style={{ 
                    display: 'none', 
                    position: 'absolute', 
                    top: 'calc(100% + 5px)', 
                    left: 0, 
                    background: 'white', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', 
                    borderRadius: 8, 
                    width: '100%',
                    zIndex: 10,
                    border: '1px solid #eee',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    style={{ 
                      padding: '10px 12px', 
                      fontSize: 15, 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s',
                      background: sortBy === 'none' ? '#f0f8ff' : 'transparent',
                      fontWeight: sortBy === 'none' ? 600 : 400
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7f7f7'}
                    onMouseLeave={(e) => e.currentTarget.style.background = sortBy === 'none' ? '#f0f8ff' : 'transparent'}
                    onClick={() => {
                      setSortBy('none');
                      document.getElementById('sort-dropdown-menu').style.display = 'none';
                    }}
                  >
                    Default
                  </div>
                  <div 
                    style={{ 
                      padding: '10px 12px', 
                      fontSize: 15, 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s',
                      background: sortBy === 'date-asc' ? '#f0f8ff' : 'transparent',
                      fontWeight: sortBy === 'date-asc' ? 600 : 400
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7f7f7'}
                    onMouseLeave={(e) => e.currentTarget.style.background = sortBy === 'date-asc' ? '#f0f8ff' : 'transparent'}
                    onClick={() => {
                      setSortBy('date-asc');
                      document.getElementById('sort-dropdown-menu').style.display = 'none';
                    }}
                  >
                    Date (Earliest first)
                  </div>
                  <div 
                    style={{ 
                      padding: '10px 12px', 
                      fontSize: 15, 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s',
                      background: sortBy === 'date-desc' ? '#f0f8ff' : 'transparent',
                      fontWeight: sortBy === 'date-desc' ? 600 : 400
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7f7f7'}
                    onMouseLeave={(e) => e.currentTarget.style.background = sortBy === 'date-desc' ? '#f0f8ff' : 'transparent'}
                    onClick={() => {
                      setSortBy('date-desc');
                      document.getElementById('sort-dropdown-menu').style.display = 'none';
                    }}
                  >
                    Date (Latest first)
                  </div>
                  <div 
                    style={{ 
                      padding: '10px 12px', 
                      fontSize: 15, 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s',
                      background: sortBy === 'quantity-asc' ? '#f0f8ff' : 'transparent',
                      fontWeight: sortBy === 'quantity-asc' ? 600 : 400
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7f7f7'}
                    onMouseLeave={(e) => e.currentTarget.style.background = sortBy === 'quantity-asc' ? '#f0f8ff' : 'transparent'}
                    onClick={() => {
                      setSortBy('quantity-asc');
                      document.getElementById('sort-dropdown-menu').style.display = 'none';
                    }}
                  >
                    Quantity (Low to High)
                  </div>
                  <div 
                    style={{ 
                      padding: '10px 12px', 
                      fontSize: 15, 
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      background: sortBy === 'quantity-desc' ? '#f0f8ff' : 'transparent',
                      fontWeight: sortBy === 'quantity-desc' ? 600 : 400
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7f7f7'}
                    onMouseLeave={(e) => e.currentTarget.style.background = sortBy === 'quantity-desc' ? '#f0f8ff' : 'transparent'}
                    onClick={() => {
                      setSortBy('quantity-desc');
                      document.getElementById('sort-dropdown-menu').style.display = 'none';
                    }}
                  >
                    Quantity (High to Low)
                  </div>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search by event, type, status, or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16, minWidth: 220 }}
              />
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', color: '#ed4690', fontWeight: 600, marginTop: 60 }}>Loading your tickets...</div>
          ) : error ? (
            <div style={{ color: 'red', textAlign: 'center', marginTop: 60 }}>
              {error}
              {debugInfo && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 10, whiteSpace: 'pre-wrap', textAlign: 'left', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                  Debug info: {debugInfo}
                </div>
              )}
            </div>
          ) : !sortedTickets.length ? (
            <div style={{ marginTop: 48, color: '#6E6E6E', fontSize: 18, textAlign: 'center' }}>
              <p>No tickets to show yet.</p>
              <p style={{ fontSize: 15, color: '#888' }}>(Your purchased tickets will appear here.)</p>
              <button className="events-nav-btn" style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 12, padding: '12px 32px', border: 'none', cursor: 'pointer', marginTop: 18 }} onClick={() => navigate('/events')}>
                Browse Events
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 8 }}>
              {sortedTickets.map(ticket => {
                // Log ticket info for debugging
                console.log(`Rendering ticket ${ticket._id}:`, {
                  eventName: ticket.eventName,
                  bookingId: extractIdFromObjectId(ticket.bookingId),
                  eventId: extractIdFromObjectId(ticket.eventId)
                });
                
                return (
                  <div 
                    key={ticket._id || ticket.id} 
                    id={`ticket-${ticket._id || ticket.id}`} 
                    style={{ 
                      background: '#fff', 
                      borderRadius: 16, 
                      boxShadow: '0 2px 12px #ed469033', 
                      padding: 0, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 15px 30px rgba(237,70,144,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 12px #ed469033';
                    }}
                  >
                    {/* Event header section with background */}
                    <div style={{
                      background: 'linear-gradient(90deg, rgba(237,70,144,0.85) 0%, rgba(85,34,204,0.85) 100%)',
                      backgroundImage: ticket.eventImage ? 
                        `linear-gradient(90deg, rgba(237,70,144,0.85) 0%, rgba(85,34,204,0.85) 100%), url(${ticket.eventImage})` : 
                        'linear-gradient(90deg, rgba(237,70,144,0.85) 0%, rgba(85,34,204,0.85) 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      padding: '24px 28px',
                      position: 'relative',
                      color: '#fff',
                      minHeight: '140px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <h3 style={{ 
                        fontWeight: 700, 
                        fontSize: 24, 
                        margin: 0, 
                        marginBottom: 8,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        {ticket.eventName && !ticket.eventName.startsWith('Event') 
                          ? ticket.eventName 
                          : ticket.eventName === 'Event' || !ticket.eventName
                            ? <span>
                                <i className="fas fa-sync fa-spin" style={{ fontSize: 18, marginRight: 10, opacity: 0.8 }}></i>
                                Fetching event details...
                              </span>
                            : ticket.eventName
                        }
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        flexWrap: 'wrap', 
                        gap: 12,
                        fontSize: 15,
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        <span><i className="fas fa-calendar-alt" style={{ marginRight: 5 }}></i>
                          {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Date not available'}
                        </span>
                        <span><i className="fas fa-ticket-alt" style={{ marginRight: 5 }}></i>{ticket.ticketType}</span>
                        <span><i className="fas fa-user" style={{ marginRight: 5 }}></i>Qty: {ticket.quantity || 1}</span>
                      </div>
                    </div>
                    
                    {/* Ticket details section */}
                    <div style={{ 
                      padding: '24px 28px', 
                      display: 'flex', 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      gap: 32,
                      flexWrap: 'wrap',
                      background: '#ffffff',
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16
                    }}>
                      <div style={{ flex: 2, minWidth: 220 }}>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 12 
                        }}>
                          <div style={{ color: '#5522cc', fontWeight: 600, fontSize: 17, marginBottom: 4 }}>Ticket Information</div>
                          <div style={{ color: '#6E6E6E', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>Status:</strong> <span style={{ 
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: 12,
                              fontSize: 14,
                              fontWeight: 600,
                              background: ticket.status === 'cancelled' ? '#ffdddd' : 
                                         ticket.status === 'transferred' ? '#e6f7ff' : '#e6ffe6',
                              color: ticket.status === 'cancelled' ? '#d32f2f' : 
                                     ticket.status === 'transferred' ? '#0288d1' : '#388e3c'
                            }}>{ticket.status || ticket.paymentStatus || 'Active'}</span>
                          </div>
                          <div style={{ color: '#6E6E6E', fontSize: 15 }}>
                            <strong>Order ID:</strong> {ticket._id || ticket.id}
                          </div>
                          {debugInfo && (
                            <div style={{ color: '#888', fontSize: 10 }}>
                              Event ID: {extractIdFromObjectId(ticket.eventId) || 'Unknown'} | 
                              Booking ID: {extractIdFromObjectId(ticket.bookingId) || 'Unknown'}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                          <button 
                            className="events-nav-btn" 
                            style={{ 
                              background: '#5522cc', 
                              color: '#fff', 
                              fontWeight: 600, 
                              borderRadius: 8, 
                              padding: '8px 18px', 
                              border: 'none', 
                              cursor: 'pointer', 
                              boxShadow: '0 2px 8px rgba(85,34,204,0.2)',
                              transition: 'all 0.2s ease'
                            }} 
                            onClick={() => handleDownloadPDF(ticket._id || ticket.id)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#4411bb';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 5px 15px rgba(85,34,204,0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#5522cc';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(85,34,204,0.2)';
                            }}
                          >
                            <i className="fas fa-download" style={{ marginRight: 8 }}></i> Download
                          </button>
                          <button 
                            className="events-nav-btn" 
                            style={{ 
                              background: '#ed4690', 
                              color: '#fff', 
                              fontWeight: 600, 
                              borderRadius: 8, 
                              padding: '8px 18px', 
                              border: 'none', 
                              cursor: 'pointer', 
                              boxShadow: '0 2px 8px #ed469022',
                              transition: 'background 0.2s'
                            }} 
                            onClick={() => handlePrint(ticket._id || ticket.id)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#d93576';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 5px 15px rgba(237,70,144,0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ed4690';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(237,70,144,0.2)';
                            }}
                          >
                            <i className="fas fa-print" style={{ marginRight: 8 }}></i> Print
                          </button>
                          <button 
                            className="events-nav-btn" 
                            style={{ 
                              background: '#d7263d', // red
                              color: '#fff', 
                              fontWeight: 600, 
                              borderRadius: 8, 
                              padding: '8px 18px', 
                              border: 'none', 
                              cursor: 'pointer', 
                              opacity: cancelLoading === (ticket._id || ticket.id) ? 0.7 : 1, 
                              boxShadow: '0 2px 8px rgba(215,38,61,0.15)',
                              transition: 'all 0.2s ease'
                            }} 
                            onClick={() => { setShowDeleteModal(true); setTicketToDelete(ticket); }}
                            disabled={cancelLoading === (ticket._id || ticket.id)}
                            onMouseEnter={(e) => {
                              if (cancelLoading !== (ticket._id || ticket.id)) {
                                e.currentTarget.style.background = '#b71c1c';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 5px 15px rgba(215,38,61,0.25)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#d7263d';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(215,38,61,0.15)';
                            }}
                          >
                            <i className="fas fa-times" style={{ marginRight: 8 }}></i> {cancelLoading === (ticket._id || ticket.id) ? 'Deleting...' : 'Delete'}
                          </button>
                          <button
                            className="events-nav-btn"
                            style={{ background: '#ed4690', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '8px 18px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #ed469022', transition: 'background 0.2s' }}
                            onClick={() => navigate(`/ticket-receipt/${ticket._id || ticket.id}`)}
                          >
                            <i className="fas fa-receipt" style={{ marginRight: 8 }}></i> View Receipt
                          </button>
                        </div>
                      </div>
                      <div style={{ 
                        minWidth: 120, 
                        textAlign: 'center',
                        background: '#f9f9f9',
                        padding: '18px 20px',
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid #eee',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      }}>
                        <QRCodeCanvas value={`${window.location.origin}/ticket-receipt/${ticket._id || ticket.id}`} size={120} level="H" includeMargin={true} />
                        <div style={{ fontSize: 13, color: '#6E6E6E', marginTop: 10, fontWeight: 500 }}>Scan at event</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>
        )}
        {activeTab === 'shop' && (
          <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px #ed469033', padding: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#232323', marginBottom: 18 }}>Your Shop Orders</h2>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 16, background: 'none' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, #f7f7fa 60%, #f6f4ff 100%)' }}>
                  <th style={{ padding: 12, borderBottom: '2.5px solid #ed4690', textAlign: 'left', fontWeight: 800, color: '#5522cc', fontSize: 17, letterSpacing: 0.2 }}>Order ID</th>
                  <th style={{ padding: 12, borderBottom: '2.5px solid #ed4690', textAlign: 'left', fontWeight: 800, color: '#5522cc', fontSize: 17, letterSpacing: 0.2 }}>Date</th>
                  <th style={{ padding: 12, borderBottom: '2.5px solid #ed4690', textAlign: 'right', fontWeight: 800, color: '#5522cc', fontSize: 17, letterSpacing: 0.2 }}>Total</th>
                  <th style={{ padding: 12, borderBottom: '2.5px solid #ed4690', textAlign: 'center', fontWeight: 800, color: '#5522cc', fontSize: 17, letterSpacing: 0.2 }}>Items</th>
                  <th style={{ padding: 12, borderBottom: '2.5px solid #ed4690', textAlign: 'center', fontWeight: 800, color: '#5522cc', fontSize: 17, letterSpacing: 0.2 }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {shopOrders.map(order => (
                  <tr key={order._id} style={{ background: '#f9f9fb', transition: 'background 0.18s', borderRadius: 12, boxShadow: '0 1px 6px #ed469011' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f6f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f9f9fb'}>
                    <td style={{ padding: 12, wordBreak: 'break-all', maxWidth: 180 }}>
                      <span style={{ background: '#d4f8e8', color: '#1b5e20', borderRadius: 8, padding: '3px 6px', fontWeight: 700, fontSize: 10, letterSpacing: 0.5, boxShadow: '0 2px 8px #d4f8e822', display: 'inline-block' }}>{order._id}</span>
                    </td>
                    <td style={{ padding: 12, color: '#232323', fontWeight: 600 }}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</td>
                    <td style={{ padding: 12, textAlign: 'right', color: '#ed4690', fontWeight: 700, fontSize: 17 }}>${order.total}</td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#5522cc', fontWeight: 700, fontSize: 16 }}>{order.items.length}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button onClick={() => navigate(`/shop-success?order_id=${order._id}`)} style={{ background: '#ffe0ef', color: '#ed4690', border: 'none', borderRadius: 8, padding: '7px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #ed469022', transition: 'background 0.2s' }}>View Receipt</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shopOrders.length === 0 && <div style={{ color: '#888', marginTop: 18 }}>No shop orders found.</div>}
          </div>
        )}
      </div>
        {/* Help/FAQ Section */}
        <div style={{ marginTop: 64, background: '#f7f7fa', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px #ed469033' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#ed4690', marginBottom: 12 }}>Ticket Help & FAQ</h3>
          <ul style={{ color: '#232323', fontSize: 16, lineHeight: 1.7, paddingLeft: 18 }}>
            <li><strong>How do I use my ticket?</strong> Show your QR code at the event entrance for scanning.</li>
            <li><strong>Can I download or print my ticket?</strong> Yes, you can screenshot or print this page with your QR code.</li>
            <li><strong>What if I lose my ticket?</strong> Log in and return to this page to access your tickets anytime.</li>
            <li><strong>Need more help?</strong> <span style={{ color: '#ed4690', cursor: 'pointer' }} onClick={() => navigate('/contact')}>Contact us</span>.</li>
          </ul>
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
      {/* Action message for cancel */}
      {actionMessage && !transferModal.open && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: actionMessage.includes('cancelled') ? 'green' : '#ed4690', borderRadius: 12, padding: '12px 32px', boxShadow: '0 2px 12px #ed469033', fontWeight: 600, fontSize: 16, zIndex: 9999 }}>
          {actionMessage}
        </div>
      )}
      {showDeleteModal && ticketToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,18,60,0.18)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
          <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 12px 48px #ed469055', padding: '36px 32px 28px 32px', minWidth: 320, maxWidth: '95vw', width: 400, position: 'relative', textAlign: 'center' }}>
            <button onClick={() => { setShowDeleteModal(false); setTicketToDelete(null); }} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ed4690', fontSize: 26, cursor: 'pointer', zIndex: 10 }} title="Close">&times;</button>
            <h3 style={{ color: '#d7263d', fontWeight: 900, fontSize: 24, marginBottom: 12 }}>Delete Ticket?</h3>
            <div style={{ color: '#232323', fontSize: 16, marginBottom: 18 }}>Are you sure you want to delete this ticket?<br /><span style={{ color: '#ed4690', fontWeight: 700 }}>{ticketToDelete.eventName}</span></div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 18 }}>
              <button 
                className="events-nav-btn" 
                style={{ background: '#bbb', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '8px 24px', border: 'none', cursor: 'pointer', fontSize: 17 }}
                onClick={() => { setShowDeleteModal(false); setTicketToDelete(null); }}
              >Cancel</button>
              <button 
                className="events-nav-btn" 
                style={{ background: '#d7263d', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '8px 24px', border: 'none', cursor: 'pointer', fontSize: 17, boxShadow: '0 2px 8px #d7263d22' }}
                onClick={async () => {
                  await handleDelete(ticketToDelete);
                  setShowDeleteModal(false); setTicketToDelete(null);
                }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets; 