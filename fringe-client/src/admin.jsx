import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './admin.css';
import { FaUserFriends, FaCalendarAlt, FaEnvelope, FaUsers, FaCog, FaSignOutAlt, FaChartLine, FaBoxOpen, FaTicketAlt, FaBell, FaSearch, FaReceipt, FaDollarSign, FaTshirt, FaSyncAlt } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';

const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
  { key: 'events', label: 'Events', icon: <FaBoxOpen /> },
  { key: 'merchandise', label: 'Merchandise', icon: <FaBoxOpen /> },
  { key: 'orderscenter', label: 'Ticket Orders', icon: <FaReceipt /> },
  { key: 'merchorders', label: 'Merchandise Orders', icon: <FaBoxOpen /> },
  { key: 'inbox', label: 'Inbox', icon: <FaEnvelope /> },
  { key: 'customers', label: 'Customers', icon: <FaUserFriends /> },
  { key: 'team', label: 'Team', icon: <FaUsers /> },
];

const eventTypes = [
  'All',
  'Comedy',
  'Music',
  'Theatre',
  'Dance',
  'Other'
];
const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ name: '', description: '', venue: '', date: '', category: '', seatingCapacity: '', ticketPrices: { standard: '', vip: '', student: '' }, imgUrl: '' });
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterVenue, setFilterVenue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  // Merchandise state
  const [merchandise, setMerchandise] = useState([]);
  const [showMerchModal, setShowMerchModal] = useState(false);
  const [editingMerch, setEditingMerch] = useState(null);
  const [merchForm, setMerchForm] = useState({ name: '', type: '', price: '', description: '', images: '', sizes: '' });
  const [merchModalLoading, setMerchModalLoading] = useState(false);
  const [merchModalError, setMerchModalError] = useState('');
  const [allShopOrders, setAllShopOrders] = useState([]);
  const [merchFilterName, setMerchFilterName] = useState('');
  const [merchFilterType, setMerchFilterType] = useState('');
  const [merchFilterMinPrice, setMerchFilterMinPrice] = useState('');
  const [merchFilterMaxPrice, setMerchFilterMaxPrice] = useState('');
  const [merchFilterSize, setMerchFilterSize] = useState('');
  const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear());
  const [dashboardMonth, setDashboardMonth] = useState(new Date().getMonth() + 1); // 1-based
  // Orders Center state
  const [ordersCenterUsers, setOrdersCenterUsers] = useState([]);
  const [ordersCenterSearch, setOrdersCenterSearch] = useState('');
  const [selectedOrdersUser, setSelectedOrdersUser] = useState(null);
  const [ordersCenterTickets, setOrdersCenterTickets] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  // Editable Expected Sales state
  const [editingExpectedSalesId, setEditingExpectedSalesId] = useState(null);
  const [expectedSalesInput, setExpectedSalesInput] = useState('');
  // Add a state to store expected sales values for events
  const [expectedSalesMap, setExpectedSalesMap] = useState({});
  const [inboxMessages, setInboxMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  // Inbox filter state
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxStatus, setInboxStatus] = useState('All');
  const [inboxDateFrom, setInboxDateFrom] = useState('');
  const [inboxDateTo, setInboxDateTo] = useState('');
  // Add state for team tab filter and modal
  const [teamSearch, setTeamSearch] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  // Remove filterDate, add filterFromDate and filterToDate
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  // Add state for Merchandise Orders tab search
  const [merchOrdersSearch, setMerchOrdersSearch] = useState('');
  const [merchOrdersFromDate, setMerchOrdersFromDate] = useState('');
  const [merchOrdersToDate, setMerchOrdersToDate] = useState('');
  const [merchOrdersOrderId, setMerchOrdersOrderId] = useState('');
  const [merchOrdersItem, setMerchOrdersItem] = useState('');
  // Add state for Merchandise Orders receipt modal
  const [showMerchReceipt, setShowMerchReceipt] = useState(false);
  const [merchReceiptData, setMerchReceiptData] = useState(null);


  // Events Tab: filter events
  const filteredEvents = events.filter(event => {
    let match = true;
    if (filterType !== 'All' && event.category !== filterType) match = false;
    if (filterVenue && event.venue !== filterVenue) match = false;
    // Date range filter
    if (filterFromDate) {
      const eventDate = new Date(event.date).toISOString().slice(0, 10);
      if (eventDate < filterFromDate) match = false;
    }
    if (filterToDate) {
      const eventDate = new Date(event.date).toISOString().slice(0, 10);
      if (eventDate > filterToDate) match = false;
    }
    if (searchQuery && !(
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.category && event.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )) match = false;
    return match;
  });
  // Orders Center: filter users and orders
  const filteredOrdersCenterUsers = ordersCenterUsers.filter(u =>
    u.name.toLowerCase().includes(ordersCenterSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(ordersCenterSearch.toLowerCase())
  ).filter(u =>
    !searchQuery ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOrdersCenterTickets = ordersCenterTickets.filter(order => {
    if (!searchQuery) return true;
    return (
      (order._id && order._id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.bookingId?.eventId?.name && order.bookingId.eventId.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });
  // Team Tab: filter admins
  const filteredAdmins = users.filter(u => u.role === 'admin')
    .filter(u => !teamSearch || u.name.toLowerCase().includes(teamSearch.toLowerCase()))
    .filter(u => !teamEmail || u.email.toLowerCase().includes(teamEmail.toLowerCase()))
    .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));
  // Customers Tab: filter customers
  const filteredCustomers = users.filter(u => u.role === 'customer')
    .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(u => !filterVenue || u.email.toLowerCase().includes(filterVenue.toLowerCase()))
    .filter(u => {
      if (!filterType) return true;
      const hasType = orders.some(o => (o.userId?._id || o.userId) === u._id && bookings.some(b => b._id === (o.bookingId?._id || o.bookingId) && b.ticketType && b.ticketType.toLowerCase() === filterType.toLowerCase()));
      return hasType;
    })
    .filter(u => {
      if (!filterMerchStatus) return true;
      const userShopOrders = allShopOrders.filter(order => (order.userId?._id || order.userId) === u._id);
      return userShopOrders.some(order => order.status && order.status.toLowerCase() === filterMerchStatus.toLowerCase());
    })
    .filter(u => {
      if (!filterMerchItem) return true;
      const userShopOrders = allShopOrders.filter(order => (order.userId?._id || order.userId) === u._id);
      return userShopOrders.some(order => order.items && order.items.some(item => item.name && item.name.toLowerCase().includes(filterMerchItem.toLowerCase())));
    });
  // Merchandise Tab: filter merchandise
  const filteredMerchandise = merchandise
    .filter(item => !merchFilterName || item.name.toLowerCase().includes(merchFilterName.toLowerCase()))
    .filter(item => !merchFilterType || item.type === merchFilterType)
    .filter(item => !merchFilterMinPrice || item.price >= parseFloat(merchFilterMinPrice))
    .filter(item => !merchFilterMaxPrice || item.price <= parseFloat(merchFilterMaxPrice))
    .filter(item => !merchFilterSize || (item.type === 'clothing' && item.sizes && item.sizes.includes(merchFilterSize)))
    .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  // Filtered shop orders by user name, date, order id, and item
  const filteredShopOrders = allShopOrders.filter(order => {
    // User name/email filter
    if (merchOrdersSearch) {
      const user = order.userId;
      if (!user || typeof user !== 'object') return false;
      if (
        !(user.name && user.name.toLowerCase().includes(merchOrdersSearch.toLowerCase())) &&
        !(user.email && user.email.toLowerCase().includes(merchOrdersSearch.toLowerCase()))
      ) return false;
    }
    // Order ID filter
    if (merchOrdersOrderId && (!order._id || !order._id.toLowerCase().includes(merchOrdersOrderId.toLowerCase()))) return false;
    // Date range filter
    if (merchOrdersFromDate) {
      const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '';
      if (orderDate < merchOrdersFromDate) return false;
    }
    if (merchOrdersToDate) {
      const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '';
      if (orderDate > merchOrdersToDate) return false;
    }
    // Item name filter
    if (merchOrdersItem) {
      if (!order.items || !order.items.some(item => item.name && item.name.toLowerCase().includes(merchOrdersItem.toLowerCase()))) return false;
    }
    return true;
  });
  

  useEffect(() => {
    // Fetch profile on mount
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {}
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  useEffect(() => {
    // Fetch merchandise if tab is active
    if (activeTab === 'merchandise') {
      fetchMerchandise();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'customers') {
      setSearchQuery('');
      setFilterVenue('');
      setFilterType('');
      setFilterMerchStatus('');
      setFilterMerchItem('');
      // Fetch all shop orders for filtering
      const fetchAllShopOrders = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(API_ENDPOINTS.ORDERS.SHOP, { headers: { Authorization: `Bearer ${token}` } });
          const data = res.ok ? await res.json() : [];
          setAllShopOrders(data);
        } catch {
          setAllShopOrders([]);
        }
      };
      fetchAllShopOrders();
    }
  }, [activeTab]);

  // Fetch all users for Orders Center
  useEffect(() => {
    if (activeTab !== 'orderscenter') return;
    const token = localStorage.getItem('token');
    // Updated for Vercel deployment - using API_ENDPOINTS
    fetch(API_ENDPOINTS.USERS.ALL, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch users'))
      .then(data => {
        console.log('Fetched users for Orders Center:', data); // Debug log
        setOrdersCenterUsers(data);
      })
      .catch(() => setOrdersCenterUsers([]));
  }, [activeTab]);

  // Fetch orders for selected user
  useEffect(() => {
    if (!selectedOrdersUser) return;
    setOrdersLoading(true);
    setOrdersError('');
    const token = localStorage.getItem('token');
    // Updated for Vercel deployment - using API_ENDPOINTS
    fetch(`${API_ENDPOINTS.ORDERS.TICKETS_ADMIN}?userId=${selectedOrdersUser._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((tickets) => {
        setOrdersCenterTickets(tickets);
        setOrdersLoading(false);
      })
      .catch(() => {
        setOrdersError('Failed to load orders');
        setOrdersLoading(false);
      });
  }, [selectedOrdersUser]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      // Fetch profile first to check role
      // Updated for Vercel deployment - using API_ENDPOINTS
      let profileRes = await fetch(API_ENDPOINTS.AUTH.PROFILE, { headers });
      let profileData = profileRes.ok ? await profileRes.json() : null;
      setProfile(profileData);
      // Use /shopOrders/all for admin, /shopOrders for others
      const shopOrdersUrl = profileData && profileData.role === 'admin' ? API_ENDPOINTS.ORDERS.SHOP_ALL : API_ENDPOINTS.ORDERS.SHOP;
      const [usersRes, eventsRes, bookingsRes, ordersRes, shopOrdersRes, merchandiseRes] = await Promise.all([
        fetch(API_ENDPOINTS.AUTH.ALL_USERS, { headers }),
        fetch(API_ENDPOINTS.EVENTS.BASE, { headers }),
        fetch(API_ENDPOINTS.BOOKINGS.BASE, { headers }),
        fetch(API_ENDPOINTS.ORDERS.TICKETS, { headers }),
        fetch(shopOrdersUrl, { headers }),
        fetch(API_ENDPOINTS.MERCHANDISE.BASE, { headers })
      ]);
      if (!usersRes.ok || !eventsRes.ok || !bookingsRes.ok || !ordersRes.ok || !shopOrdersRes.ok || !merchandiseRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const usersData = await usersRes.json();
      const eventsData = await eventsRes.json();
      const bookingsData = await bookingsRes.json();
      const ordersData = await ordersRes.json();
      const shopOrdersData = await shopOrdersRes.json();
      const merchandiseData = await merchandiseRes.json();
      setUsers(usersData);
      setEvents(eventsData);
      setBookings(bookingsData);
      setOrders(ordersData);
      setAllShopOrders(shopOrdersData);
      setMerchandise(merchandiseData);
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    }
    setLoading(false);
  };

  const fetchMerchandise = async () => {
    try {
      const token = localStorage.getItem('token');
      // Updated for Vercel deployment - using API_ENDPOINTS
      const res = await fetch(API_ENDPOINTS.MERCHANDISE.BASE, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch merchandise');
      const data = await res.json();
      setMerchandise(data);
    } catch (err) {
      setMerchModalError(err.message || 'Error loading merchandise');
    }
  };

  // Calculate stats
  const totalUsers = users.length;
  // Show the total number of events in the DB (no filtering, no status logic)
  // This is always the length of the events array fetched from the backend
  const totalEvents = events.length;
  // Total ticket sales: sum of all bookings quantities
  const totalTicketSales = bookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
  // Active merchandise: total number of merchandise items
  const activeMerchandise = merchandise.length;

  // Aggregate ticket sales per day for the chart (for selected month/year) -- USE ONLY TicketOrder (orders)
  const salesByDay = {};
  console.log('--- Ticket Orders Date Debug ---');
  console.log('dashboardYear:', dashboardYear, 'dashboardMonth:', dashboardMonth);
  orders.forEach(order => {
    const booking = bookings.find(b => String(b._id) === String(order.bookingId?._id || order.bookingId));
    if (!booking) {
      console.warn('No booking found for order', order._id, 'bookingId:', order.bookingId);
      return;
    }
    // Parse createdAt as UTC, then get local date for comparison
    const date = new Date(order.createdAt);
    const orderYear = date.getUTCFullYear();
    const orderMonth = date.getUTCMonth() + 1; // getUTCMonth is 0-indexed, so +1 for 1-indexed
    const orderDay = date.getUTCDate();
    const isSameMonth = orderYear === dashboardYear && orderMonth === dashboardMonth;
    console.log(`Order ${order._id} createdAt: ${order.createdAt} | Parsed: ${date.toISOString()} | Year: ${orderYear} | Month: ${orderMonth} | Day: ${orderDay} | isSameMonth: ${isSameMonth}`);
    if (isSameMonth) {
      const day = `${dashboardMonth.toString().padStart(2, '0')}/${orderDay.toString().padStart(2, '0')}`;
      salesByDay[day] = (salesByDay[day] || 0) + (booking.quantity || 0);
    }
  });
  // Merchandise sales per day: sum of all item quantities in allShopOrders, grouped by createdAt
  const merchSalesByDay = {};
  console.log('--- Shop Orders Date Debug ---');
  allShopOrders.forEach(order => {
    const date = new Date(order.createdAt);
    const orderYear = date.getUTCFullYear();
    const orderMonth = date.getUTCMonth() + 1; // getUTCMonth is 0-indexed, so +1 for 1-indexed
    const orderDay = date.getUTCDate();
    const isSameMonth = orderYear === dashboardYear && orderMonth === dashboardMonth;
    console.log(`ShopOrder ${order._id} createdAt: ${order.createdAt} | Parsed: ${date.toISOString()} | Year: ${orderYear} | Month: ${orderMonth} | Day: ${orderDay} | isSameMonth: ${isSameMonth}`);
    if (isSameMonth) {
      const totalQty = order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
      const day = `${dashboardMonth.toString().padStart(2, '0')}/${orderDay.toString().padStart(2, '0')}`;
      merchSalesByDay[day] = (merchSalesByDay[day] || 0) + totalQty;
    }
  });
  const chartData = [];
  const daysInMonth = new Date(dashboardYear, dashboardMonth, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${dashboardMonth.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
    chartData.push({
      day: dayStr,
      ticketSales: salesByDay[dayStr] || 0,
      merchSales: merchSalesByDay[dayStr] || 0
    });
  }
  console.log('Final chartData:', chartData);

  // --- Calculate Expected and Actual Sales for each event ---
  const eventSalesMap = {};
  events.forEach(event => {
    // Expected Sales: sum of (seatingCapacity * ticket price) for all ticket types
    let expected = 0;
    if (event.ticketPrices) {
      for (const type of ['standard', 'vip', 'student']) {
        const price = event.ticketPrices[type] || 0;
        expected += (event.seatingCapacity || 0) * price;
      }
    }
    // Actual Sales: sum of all tickets sold for this event (across all bookings)
    let actual = 0;
    bookings.forEach(b => {
      if (String(b.eventId) === String(event._id)) {
        actual += (b.quantity || 0) * (b.price || 0);
      }
    });
    eventSalesMap[event._id] = { expected, actual };
  });
  // Inject into filteredEvents for table rendering
  const filteredEventsWithSales = filteredEvents.map(event => ({
    ...event,
    expectedSales: eventSalesMap[event._id]?.expected || 0,
    actualSales: eventSalesMap[event._id]?.actual || 0,
  }));

  // Join TicketOrder, Booking, Event, User for table rows
  const ticketTableData = orders.map(order => {
    const booking = bookings.find(b => b._id === (order.bookingId?._id || order.bookingId));
    const event = events.find(e => e._id === (booking?.eventId?._id || booking?.eventId));
    const user = users.find(u => u._id === (order.userId?._id || order.userId));
    return {
      ticketOrderId: order._id,
      eventName: event?.name || 'Unknown',
      venue: event?.venue || 'Unknown',
      eventDateStr: event?.date ? new Date(event.date).toLocaleDateString() + ' ' + new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      ticketType: booking?.ticketType || '-',
      quantity: booking?.quantity || '-',
      userName: user?.name || 'Unknown',
      status: booking?.status || '-',
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId,
      bookingId: booking?._id,
      userId: user?._id,
      eventId: event?._id,
    };
  });

  // Filtering logic
  const filteredTicketTableData = ticketTableData.filter(row => {
    if (ticketFilterDate && row.eventDateStr !== ticketFilterDate) return false;
    if (ticketFilterEvent && row.eventName !== ticketFilterEvent) return false;
    if (ticketFilterVenue && row.venue !== ticketFilterVenue) return false;
    if (ticketFilterUser && row.userName !== ticketFilterUser) return false;
    if (ticketFilterStatus && row.paymentStatus !== ticketFilterStatus && row.status !== ticketFilterStatus) return false;
    if (searchQuery && !row.ticketOrderId.toLowerCase().includes(searchQuery.toLowerCase()) && !row.eventName.toLowerCase().includes(searchQuery.toLowerCase()) && !row.venue.toLowerCase().includes(searchQuery.toLowerCase()) && !row.userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Handlers for Events CRUD
  const openAddEvent = () => {
    setEditingEvent(null);
    setEventForm({ name: '', description: '', venue: '', date: '', category: '', seatingCapacity: '', ticketPrices: { standard: '', vip: '', student: '' }, imgUrl: '' });
    setShowEventModal(true);
  };
  const openEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      ...event,
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      ticketPrices: {
        standard: event.ticketPrices?.standard || '',
        vip: event.ticketPrices?.vip || '',
        student: event.ticketPrices?.student || ''
      },
      imgUrl: event.imgUrl || '' // Pre-fill imgUrl
    });
    setShowEventModal(true);
  };
  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventForm({ name: '', description: '', venue: '', date: '', category: '', seatingCapacity: '', ticketPrices: { standard: '', vip: '', student: '' }, imgUrl: '' });
    setEventError('');
  };
  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('ticketPrices.')) {
      setEventForm(f => ({ ...f, ticketPrices: { ...f.ticketPrices, [name.split('.')[1]]: value } }));
    } else {
      setEventForm(f => ({ ...f, [name]: value }));
    }
  };

  // --- Backend integration for add/edit event ---
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventLoading(true);
    setEventError('');
    const token = localStorage.getItem('token');
    // Validate required fields
    const { name, description, venue, date, category, seatingCapacity, ticketPrices, imgUrl } = eventForm;
    if (!name || !description || !venue || !date || !category || !seatingCapacity || !ticketPrices.standard || !ticketPrices.vip || !ticketPrices.student) {
      setEventError('All fields are required.');
      setEventLoading(false);
      return;
    }
    // Prepare payload
    const payload = {
      name: name.trim(),
      description: description.trim(),
      venue: venue.trim(),
      date: new Date(date).toISOString(),
      category,
      seatingCapacity: Number(seatingCapacity),
      ticketPrices: {
        standard: Number(ticketPrices.standard),
        vip: Number(ticketPrices.vip),
        student: Number(ticketPrices.student)
      },
      imgUrl: imgUrl ? imgUrl.trim() : '' // Add imgUrl to payload
    };
    try {
      let res;
      if (editingEvent) {
        // Edit
        res = await fetch(API_ENDPOINTS.EVENTS.BY_ID(editingEvent._id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Add
        res = await fetch(API_ENDPOINTS.EVENTS.BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setEventError(err.message || 'Failed to save event.');
        setEventLoading(false);
        return;
      }
      // Success: refresh events
      await fetchDashboardData();
      closeEventModal();
    } catch (err) {
      setEventError('Network or server error.');
    }
    setEventLoading(false);
  };

  // --- Backend integration for delete event ---
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setEventLoading(true);
    setEventError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API_ENDPOINTS.EVENTS.BY_ID(eventId), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setEventError(err.message || 'Failed to delete event.');
        setEventLoading(false);
        return;
      }
      await fetchDashboardData();
    } catch (err) {
      setEventError('Network or server error.');
    }
    setEventLoading(false);
  };



  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Profile menu close on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClick = (e) => {
      if (!e.target.closest('.admin-profile-menu') && !e.target.closest('.profile') && !e.target.closest('.profile-dropdown-arrow')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);

  // Reset search on tab change
  useEffect(() => { setSearchQuery(''); }, [activeTab]);

  // Fetch notifications from backend - Updated for Vercel deployment
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(API_ENDPOINTS.NOTIFICATIONS.BASE, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
  };
  useEffect(() => { fetchNotifications(); }, []);

  // Mark as read - Updated for Vercel deployment
  const markAsRead = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(API_ENDPOINTS.NOTIFICATIONS.READ(id), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNotifications();
  };
  // Mark as unread - Updated for Vercel deployment
  const markAsUnread = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(API_ENDPOINTS.NOTIFICATIONS.UNREAD(id), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNotifications();
  };
  // Delete notification - Updated for Vercel deployment
  const deleteNotification = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(API_ENDPOINTS.NOTIFICATIONS.DELETE(id), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNotifications();
  };
  // Go to event
  const goToEvent = (eventId) => {
    if (eventId) navigate(`/events/${eventId}`);
  };

  // Mark all as read when opening modal
  const handleOpenNotifModal = () => {
    notifications.forEach(n => { if (!n.read) markAsRead(n._id); });
    setShowNotifModal(true);
    setShowNotifDropdown(false);
  };

  // Mark dropdown as read when opened
  useEffect(() => {
    if (showNotifDropdown) {
      notifications.forEach(n => { if (!n.read) markAsRead(n._id); });
    }
    // eslint-disable-next-line
  }, [showNotifDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNotifDropdown) return;
    const handleClick = (e) => {
      if (!e.target.closest('.admin-notification-dropdown') && !e.target.closest('.notification')) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifDropdown]);

  // Fetch tickets and bookings for a customer
  const openCustomerModal = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(true);
    setCustomerModalLoading(true);
    const token = localStorage.getItem('token');
    try {
      // Fetch all ticket orders and bookings (already in state, but filter for this user)
      // If not loaded, fetch them
      let userOrders = orders;
      if (!orders.length) {
        // Updated for Vercel deployment
        const res = await fetch(API_ENDPOINTS.ORDERS.TICKETS, { headers: { Authorization: `Bearer ${token}` } });
        userOrders = res.ok ? await res.json() : [];
      }
      // Filter for this customer
      const filteredOrders = userOrders.filter(o => (o.userId?._id || o.userId) === customer._id);
      setCustomerTickets(filteredOrders);
      // Fetch shop orders for this customer
      // Updated for Vercel deployment
      const shopRes = await fetch(API_ENDPOINTS.ORDERS.SHOP, { headers: { Authorization: `Bearer ${token}` } });
      let shopOrders = shopRes.ok ? await shopRes.json() : [];
      shopOrders = shopOrders.filter(order => (order.userId?._id || order.userId) === customer._id);
      setCustomerShopOrders(shopOrders);
    } catch (err) {
      setCustomerTickets([]);
      setCustomerShopOrders([]);
    }
    setCustomerModalLoading(false);
  };
  const closeCustomerModal = () => {
    setCustomerModalOpen(false);
    setSelectedCustomer(null);
    setCustomerTickets([]);
  };

  // Merchandise CRUD handlers
  const openAddMerch = () => {
    setEditingMerch(null);
    setMerchForm({ name: '', type: '', price: '', description: '', images: '', sizes: '' });
    setShowMerchModal(true);
  };
  const openEditMerch = (item) => {
    setEditingMerch(item);
    setMerchForm({
      name: item.name,
      type: item.type,
      price: item.price,
      description: item.description,
      images: item.images ? item.images.join(',') : '',
      sizes: item.type === 'clothing' ? item.sizes.join(',') : ''
    });
    setShowMerchModal(true);
  };
  const handleMerchSubmit = async (e) => {
    e.preventDefault();
    setMerchModalLoading(true);
    setMerchModalError('');
    const token = localStorage.getItem('token');
    // Prepare payload
    let sizesArr = merchForm.type === 'clothing' ? merchForm.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (merchForm.type === 'clothing' && sizesArr.length === 0) {
      sizesArr = ['Small', 'Medium', 'Large'];
    }
    const payload = {
      name: merchForm.name,
      type: merchForm.type,
      price: Number(merchForm.price),
      description: merchForm.description,
      images: merchForm.images.split(',').map(s => s.trim()).filter(Boolean),
      sizes: sizesArr
    };
    try {
      let res;
      if (editingMerch) {
        // Edit
        // Updated for Vercel deployment
        res = await fetch(API_ENDPOINTS.MERCHANDISE.BY_ID(editingMerch._id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Add - Updated for Vercel deployment
        res = await fetch(API_ENDPOINTS.MERCHANDISE.BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMerchModalError(err.message || 'Failed to save merchandise.');
        setMerchModalLoading(false);
        return;
      }
      // Success: refresh merchandise
      await fetchMerchandise();
      closeMerchModal();
    } catch (err) {
      setMerchModalError('Network or server error.');
    }
    setMerchModalLoading(false);
  };
  const closeMerchModal = () => {
    setShowMerchModal(false);
    setEditingMerch(null);
    setMerchForm({ name: '', type: '', price: '', description: '', images: '', sizes: '' });
    setMerchModalError('');
  };
  const handleDeleteMerch = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this merchandise?')) return;
    setMerchModalLoading(true);
    setMerchModalError('');
    const token = localStorage.getItem('token');
    try {
      // Updated for Vercel deployment
      const res = await fetch(API_ENDPOINTS.MERCHANDISE.BY_ID(itemId), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMerchModalError(err.message || 'Failed to delete merchandise.');
        setMerchModalLoading(false);
        return;
      }
      await fetchMerchandise();
    } catch (err) {
      setMerchModalError('Network or server error.');
    }
    setMerchModalLoading(false);
  };

  // Month/year selector options
  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // DEBUG LOGGING for chart issues
  if (activeTab === 'dashboard') {
    console.log('orders', orders);
    console.log('bookings', bookings);
    console.log('allShopOrders', allShopOrders);
    console.log('chartData', chartData);
  }

  // --- Dashboard Card Calculations ---
  // Total Ticket Sales Income
  const totalTicketSalesIncome = orders.reduce((sum, order) => {
    const booking = bookings.find(b => b._id === (order.bookingId?._id || order.bookingId));
    const event = events.find(e => e._id === (booking?.eventId?._id || booking?.eventId));
    if (!booking || !event) return sum;
    let price = 0;
    if (booking.ticketType && event.ticketPrices) {
      price = event.ticketPrices[booking.ticketType.toLowerCase()] || 0;
    }
    return sum + price * (booking.quantity || 0);
  }, 0);
  // Total Merchandise Sales (quantity)
  const totalMerchandiseSales = allShopOrders.reduce(
    (sum, order) => sum + (order.items ? order.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0),
    0
  );
  // Total Merchandise Sales Income
  const totalMerchandiseSalesIncome = allShopOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );
  // Total Sales Income = Ticket + Merchandise
  const totalSalesIncome = totalTicketSalesIncome + totalMerchandiseSalesIncome;

  // Fetch expected sales for all events when events change
  useEffect(() => {
    const fetchAllExpectedSales = async () => {
      const token = localStorage.getItem('token');
      if (!events.length) return;
      const map = {};
      await Promise.all(events.map(async (event) => {
        try {
          // Updated for Vercel deployment
          const res = await fetch(API_ENDPOINTS.EVENTS.EXPECTED_SALES(event._id), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            map[event._id] = data.expectedSales;
          }
        } catch {}
      }));
      setExpectedSalesMap(map);
    };
    fetchAllExpectedSales();
  }, [events]);

  // Save expected sales handler (new API)
  const handleSaveExpectedSales = async (eventId) => {
    const token = localStorage.getItem('token');
    try {
      // Updated for Vercel deployment
      const res = await fetch(API_ENDPOINTS.EVENTS.EXPECTED_SALES(eventId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ expectedSales: Number(expectedSalesInput) })
      });
      if (res.ok) {
        setEditingExpectedSalesId(null);
        setExpectedSalesInput('');
        // Update local map
        const data = await res.json();
        setExpectedSalesMap((prev) => ({ ...prev, [eventId]: data.expectedSales }));
        await fetchDashboardData();
      } else {
        alert('Failed to update expected sales');
      }
    } catch {
      alert('Network error updating expected sales');
    }
  };

  // Fetch inbox messages
  const fetchInbox = async () => {
    setInboxLoading(true);
    setInboxError('');
    const token = localStorage.getItem('token');
    try {
      // Updated for Vercel deployment
      const url = API_ENDPOINTS.CONTACT.MESSAGES;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = null;
      try { data = await res.clone().json(); } catch (e) { data = null; }
      if (!res.ok) throw new Error((data && data.message) || 'Failed to fetch messages');
      setInboxMessages(data);
    } catch (err) {
      setInboxError(err.message || 'Failed to fetch messages');
      setInboxMessages([]);
      console.error('[Inbox fetch error]', err);
    }
    setInboxLoading(false);
  };
  useEffect(() => {
    if (activeTab === 'inbox') fetchInbox();
  }, [activeTab]);

  const handleMarkRead = async (msg, isRead) => {
    const token = localStorage.getItem('token');
    // Updated for Vercel deployment
    await fetch(API_ENDPOINTS.CONTACT.MARK_READ(msg._id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isRead })
    });
    setInboxMessages(msgs => msgs.map(m => m._id === msg._id ? { ...m, isRead } : m));
  };
  const handleDeleteMessage = async (msg) => {
    const token = localStorage.getItem('token');
    // Updated for Vercel deployment
    await fetch(API_ENDPOINTS.CONTACT.DELETE(msg._id), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setInboxMessages(msgs => msgs.filter(m => m._id !== msg._id));
    setShowMessageModal(false);
  };
  const openMessageModal = (msg) => {
    setSelectedMessage(msg);
    setShowMessageModal(true);
    if (!msg.isRead) handleMarkRead(msg, true);
  };
  const closeMessageModal = () => {
    setShowMessageModal(false);
    setSelectedMessage(null);
  };

  // Filtered inbox messages
  const filteredInboxMessages = inboxMessages.filter(msg => {
    // Combine both searchQuery (global) and inboxSearch (inbox tab)
    const search = (searchQuery.trim() || inboxSearch.trim()).toLowerCase();
    if (search && !(
      (msg.name && msg.name.toLowerCase().includes(search)) ||
      (msg.email && msg.email.toLowerCase().includes(search)) ||
      (msg.subject && msg.subject.toLowerCase().includes(search)) ||
      (msg.message && msg.message.toLowerCase().includes(search))
    )) return false;
    // Status filter
    if (inboxStatus === 'Read' && !msg.isRead) return false;
    if (inboxStatus === 'Unread' && msg.isRead) return false;
    // Date range filter
    if (inboxDateFrom) {
      const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
      if (!msgDate || msgDate < new Date(inboxDateFrom)) return false;
    }
    if (inboxDateTo) {
      const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
      if (!msgDate || msgDate > new Date(inboxDateTo + 'T23:59:59')) return false;
    }
    return true;
  });

  // Add a reload handler for each tab
  const handleReload = () => {
    // Use location.replace to reload and preserve tab in hash
    window.location.replace(`${window.location.pathname}?tab=${activeTab}`);
  };

  // On mount, check for tab param in URL and set activeTab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) setActiveTab(tab);
    // eslint-disable-next-line
  }, []);

  // Fetch all shop orders for admin when Merchandise Orders tab is active
  useEffect(() => {
    if (activeTab === 'merchorders') {
      const fetchAllShopOrders = async () => {
        const token = localStorage.getItem('token');
        try {
          // Updated for Vercel deployment
          const res = await fetch(API_ENDPOINTS.ORDERS.SHOP_ALL, { headers: { Authorization: `Bearer ${token}` } });
          const data = res.ok ? await res.json() : [];
          setAllShopOrders(data);
        } catch {
          setAllShopOrders([]);
        }
      };
      fetchAllShopOrders();
    }
  }, [activeTab]);

  return (
    <div className={`admin-root${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        {sidebarCollapsed ? (
          <img src="https://thefringebar.co.nz/wp-content/uploads/2014/04/fringe-logo.png" alt="Logo" className="admin-logo-collapsed-img" />
        ) : (
          <div className="admin-logo">ADELAIDE <span>FRINGE</span></div>
        )}
        <nav className="admin-nav">
          <ul>
            {sidebarItems.map(item => (
              <li
                key={item.key}
                className={activeTab === item.key ? 'active' : ''}
                onClick={() => setActiveTab(item.key)}
                style={sidebarCollapsed ? { justifyContent: 'center' } : {}}
              >
                <span className="icon">{item.icon}</span>
                {!sidebarCollapsed && <span className="label">{item.label}</span>}
              </li>
            ))}
          </ul>
        </nav>
        <div className="admin-sidebar-bottom">
          <button className="sidebar-btn" onClick={() => setShowSettings(true)}><FaCog /> Settings</button>
          <button className="sidebar-btn logout" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
        </div>
      </aside>
      {/* Main Content */}
      <div className={`admin-content${sidebarCollapsed ? ' collapsed' : ''}`}>
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" aria-label="Open sidebar" onClick={() => setSidebarCollapsed(v => !v)}>
              <span className="hamburger"></span>
            </button>
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input type="text" placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            {/* Reload button outside search bar */}
            <button
              className="reload-btn"
              title="Reload"
              onClick={handleReload}
              style={{ marginLeft: 18, background: 'none', border: 'none', padding: 6, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.18s' }}
            >
              <FaSyncAlt style={{ fontSize: 18, color: '#5522cc', transition: 'transform 0.3s' }} />
            </button>
          </div>
          <div className="topbar-right">
            <div className="notification" onClick={() => setShowNotifDropdown(v => !v)} style={{ position: 'relative' }}>
              <FaBell />
              {notifications.some(n => !n.read) && (
                <span className="notif-badge">{notifications.filter(n => !n.read).length}</span>
              )}
            </div>
            <div className="profile" onClick={() => setShowProfileMenu(v => !v)} style={{cursor: 'pointer', position: 'relative'}}>
              <div className="avatar">
                {profile && profile.name ? profile.name[0].toUpperCase() : <span style={{fontSize: '1.3em', color: '#bbb'}}>&#9679;</span>}
              </div>
              <div className="profile-info">
                <div className="profile-name">{profile ? profile.name : ''}</div>
                <div className="profile-role">{profile ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}</div>
              </div>
              <span className="profile-dropdown-arrow">&#9662;</span>
            </div>
          </div>
        </header>
        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <main className="dashboard-main">
            <h2>Dashboard</h2>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ed4690' }}>Loading dashboard...</div>
            ) : error ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#d7263d' }}>{error}</div>
            ) : (
              <>
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-title">Total User</div>
                    <div className="card-value">{totalUsers.toLocaleString()}</div>
                    <div className="card-icon user"><FaUserFriends /></div>
                    <div className="card-trend" style={{ color: '#1ecb4f', fontWeight: 700 }}>
                      Total registered users
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-title">Active Events</div>
                    <div className="card-value">{totalEvents.toString().padStart(3, '0')}</div>
                    <div className="card-icon event"><FaBoxOpen /></div>
                    <div className="card-trend" style={{ color: '#1ecb4f', fontWeight: 700 }}>
                      Total events in database
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-title">Total Sales Income</div>
                    <div className="card-value">${totalSalesIncome.toLocaleString()}</div>
                    <div className="card-icon income"><FaDollarSign /></div>
                    <div className="card-trend" style={{ color: '#1ecb4f', fontWeight: 700 }}>
                      Total income from all sales
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-title">Total Ticket Sales</div>
                    <div className="card-value">{totalTicketSales.toString().padStart(3, '0')}</div>
                    <div className="card-icon ticket"><FaTicketAlt /></div>
                    <div className="card-trend" style={{ color: '#1ecb4f', fontWeight: 700 }}>
                      Total tickets sold
                    </div>
                  </div>
                </div>
                {/* New Dashboard Cards Row */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-title">Total Ticket Sales Income</div>
                    <div className="card-value">${totalTicketSalesIncome.toLocaleString()}</div>
                    <div className="card-icon income"><FaTicketAlt /></div>
                    <div className="card-trend" style={{ color: '#1ecb4f', fontWeight: 700 }}>
                      Total ticket revenue
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-title">Total Merchandise Sales</div>
                    <div className="card-value">{totalMerchandiseSales.toLocaleString()}</div>
                    <div className="card-icon"><FaBoxOpen /></div>
                    <div className="card-trend" style={{ color: '#1ecb4f', fontWeight: 700 }}>
                      Total merchandise items sold
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-title">Total Merchandise Sales Income</div>
                    <div className="card-value">${totalMerchandiseSalesIncome.toLocaleString()}</div>
                    <div className="card-icon income"><FaBoxOpen /></div>
                    <div className="card-trend" style={{ color: '#1ecb4f', fontWeight: 700 }}>
                      Total merchandise revenue
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-title">Active Merchandise</div>
                    <div className="card-value">{activeMerchandise.toString().padStart(3, '0')}</div>
                    <div className="card-icon merch"><FaTshirt /></div>
                    <div className="card-trend" style={{ color: '#1ecb4f', fontWeight: 700 }}>
                      Total merchandise in shop
                    </div>
                  </div>
                </div>
                <div className="dashboard-row">
                  <div className="dashboard-chart">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div className="chart-header">Ticket & Merchandise Sales Summary</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <select value={dashboardYear} onChange={e => setDashboardYear(Number(e.target.value))} style={{ padding: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15 }}>
                          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={dashboardMonth} onChange={e => setDashboardMonth(Number(e.target.value))} style={{ padding: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15 }}>
                          {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="ticketSales" stroke="#ed4690" strokeWidth={2} dot={false} activeDot={{ r: 6 }} name="Ticket Sales" />
                          <Line type="monotone" dataKey="merchSales" stroke="#5522cc" strokeWidth={2} dot={false} activeDot={{ r: 6 }} name="Merch Sales" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', gap: 18, marginTop: 8, fontWeight: 700, fontSize: 15 }}>
                      <span style={{ color: '#ed4690' }}>■ Ticket Sales</span>
                      <span style={{ color: '#5522cc' }}>■ Merchandise Sales</span>
                    </div>
                  </div>
                </div>
                <div className="dashboard-row">
                  <div className="dashboard-events">
                    <div className="events-header">Events Details</div>
                    <table className="admin-dashboard-table">
                      <thead>
                        <tr>
                          <th>Event Name</th>
                          <th>Location</th>
                          <th>Date - Time</th>
                          <th>Expected Sales</th>
                          <th>Actual Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEventsWithSales.map(event => (
                          <tr key={event._id}>
                            <td>{event.name}</td>
                            <td>{event.venue}</td>
                            <td>{new Date(event.date).toLocaleString()}</td>
                            <td>
                              {editingExpectedSalesId === event._id ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <input
                                    type="number"
                                    min={0}
                                    value={expectedSalesInput}
                                    onChange={e => setExpectedSalesInput(e.target.value)}
                                    style={{ width: 100, borderRadius: 6, border: '1.5px solid #eee', padding: '4px 8px', fontSize: 15 }}
                                  />
                                  <button style={{ color: '#1ecb4f', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }} title="Save" onClick={() => handleSaveExpectedSales(event._id)}>
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button style={{ color: '#ed4690', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }} title="Cancel" onClick={() => { setEditingExpectedSalesId(null); setExpectedSalesInput(''); }}>
                                    <i className="fas fa-times"></i>
                                  </button>
                                </span>
                              ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  ${expectedSalesMap[event._id] !== undefined ? expectedSalesMap[event._id].toLocaleString() : event.calculatedExpected ? event.calculatedExpected.toLocaleString() : 'N/A'}
                                  <button style={{ color: '#5522cc', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }} title="Edit Expected Sales" onClick={() => { setEditingExpectedSalesId(event._id); setExpectedSalesInput(expectedSalesMap[event._id] !== undefined ? expectedSalesMap[event._id] : event.calculatedExpected || 0); }}>
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  {expectedSalesMap[event._id] === undefined && event.calculatedExpected > 0 && (
                                    <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }} title="Suggested">(suggested: ${event.calculatedExpected.toLocaleString()})</span>
                                  )}
                                </span>
                              )}
                            </td>
                            <td>${(event.actualSales || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </main>
        )}
        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="admin-events-tab">
            <main className="events-main">
              <div className="events-flex-row">
                <div className="events-flex-col">
                  <div className="admin-events-filter-bar-unique">
                    <div className="filter-group">
                      <span className="filter-icon" role="img" aria-label="Filter">&#128269;</span>
                      <span className="filter-label">Filter By</span>
                      
                      <select className="filter-dropdown" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        {eventTypes.map(type => (
                          <option key={type} value={type}>{type === 'All' ? 'Event Type' : type}</option>
                        ))}
                      </select>
                      {/* Venue filter dropdown */}
                      <select className="filter-dropdown" value={filterVenue} onChange={e => setFilterVenue(e.target.value)}>
                        <option value="">Venue</option>
                        {[...new Set(events.map(ev => ev.venue).filter(Boolean))].map(venue => (
                          <option key={venue} value={venue}>{venue}</option>
                        ))}
                      </select>
                      {/* Date range filter: From - To */}
                      <label style={{ fontWeight: 600, color: '#5522cc', fontSize: 15, marginRight: 8 }}>From:
                        <input
                          type="date"
                          value={filterFromDate}
                          onChange={e => setFilterFromDate(e.target.value)}
                          style={{ marginLeft: 6, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15 }}
                        />
                      </label>
                      <label style={{ fontWeight: 600, color: '#5522cc', fontSize: 15, marginRight: 8 }}>To:
                        <input
                          type="date"
                          value={filterToDate}
                          onChange={e => setFilterToDate(e.target.value)}
                          style={{ marginLeft: 6, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15 }}
                        />
                      </label>
                      <button
                        style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '10px 28px', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                        onClick={() => { setFilterType('All'); setFilterVenue(''); setFilterFromDate(''); setFilterToDate(''); }}
                      >
                        Reset Filters
                      </button>
                    </div>
                    <div className="filterbar-actions">
                      <button className="add-event-bar-btn" onClick={openAddEvent}>+ Add Event</button>
                    </div>
                  </div>
                  <div className="events-table-card">
                    <table className="admin-events-table-unique">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Venue</th>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Capacity</th>
                          <th>Standard</th>
                          <th>VIP</th>
                          <th>Student</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.map(event => (
                          <tr key={event._id}>
                            <td>{event.name}</td>
                            <td>{event.venue}</td>
                            <td>{new Date(event.date).toLocaleString()}</td>
                            <td>{event.category}</td>
                            <td>{event.seatingCapacity}</td>
                            <td>${event.ticketPrices?.standard || '-'}</td>
                            <td>${event.ticketPrices?.vip || '-'}</td>
                            <td>${event.ticketPrices?.student || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button className="admin-events-edit-btn" onClick={() => openEditEvent(event)}>Edit</button>
                                <button className="admin-events-delete-btn" onClick={() => handleDeleteEvent(event._id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {showEventModal && (
                <div className="modal-overlay admin-events-modal">
                  <div className="modal">
                    <h3>{editingEvent ? 'Edit Event' : 'Add Event'}</h3>
                    {eventError && <div className="modal-error">{eventError}</div>}
                    <form onSubmit={handleEventSubmit} className="event-form">
                      <label className="modal-label" htmlFor="event-name">Event Name</label>
                      <input id="event-name" name="name" value={eventForm.name} onChange={handleEventFormChange} placeholder="Event Name" required />
                      <label className="modal-label" htmlFor="event-description">Description</label>
                      <textarea id="event-description" name="description" value={eventForm.description} onChange={handleEventFormChange} placeholder="Description" required rows={3} className="modal-textarea" />
                      <label className="modal-label" htmlFor="event-venue">Venue</label>
                      <input id="event-venue" name="venue" value={eventForm.venue} onChange={handleEventFormChange} placeholder="Venue" required />
                      <label className="modal-label" htmlFor="event-date">Date & Time</label>
                      <input id="event-date" name="date" value={eventForm.date} onChange={handleEventFormChange} type="datetime-local" required />
                      <label className="modal-label" htmlFor="event-category">Category</label>
                      <input id="event-category" name="category" value={eventForm.category} onChange={handleEventFormChange} placeholder="Category" required />
                      <label className="modal-label" htmlFor="event-capacity">Capacity</label>
                      <input id="event-capacity" name="seatingCapacity" value={eventForm.seatingCapacity} onChange={handleEventFormChange} placeholder="Capacity" type="number" required />
                      <label className="modal-label" htmlFor="event-standard">Standard Price</label>
                      <input id="event-standard" name="ticketPrices.standard" value={eventForm.ticketPrices.standard} onChange={handleEventFormChange} placeholder="Standard Price" type="number" required />
                      <label className="modal-label" htmlFor="event-vip">VIP Price</label>
                      <input id="event-vip" name="ticketPrices.vip" value={eventForm.ticketPrices.vip} onChange={handleEventFormChange} placeholder="VIP Price" type="number" required />
                      <label className="modal-label" htmlFor="event-student">Student Price</label>
                      <input id="event-student" name="ticketPrices.student" value={eventForm.ticketPrices.student} onChange={handleEventFormChange} placeholder="Student Price" type="number" required />
                      <label className="modal-label" htmlFor="event-imgUrl">Image URL</label>
                      <input id="event-imgUrl" name="imgUrl" value={eventForm.imgUrl} onChange={handleEventFormChange} placeholder="Image URL (optional)" />
                      <div style={{ margin: '10px 0', textAlign: 'center' }}>
                        {/* Live image preview or placeholder */}
                        {eventForm.imgUrl ? (
                          <img src={eventForm.imgUrl} alt="Preview" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8, border: '1.5px solid #eee', objectFit: 'cover' }} onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/180x120?text=No+Image'; }} />
                        ) : (
                          <img src="https://via.placeholder.com/180x120?text=No+Image" alt="No Image" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8, border: '1.5px solid #eee', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div className="modal-actions">
                        <button type="submit" className="save-btn" disabled={eventLoading}>{editingEvent ? 'Save Changes' : 'Add Event'}</button>
                        <button type="button" className="cancel-btn" onClick={closeEventModal}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
        {/* Ticket Orders Tab */}
        {activeTab === 'orderscenter' && (
          <div className="admin-orderscenter-tab" style={{ display: 'flex', minHeight: 600 }}>
            {/* Sidebar: User List */}
            <aside style={{ width: 320, background: '#f7f7fa', borderRight: '1.5px solid #e6eaff', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={ordersCenterSearch}
                onChange={e => setOrdersCenterSearch(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, marginBottom: 12 }}
              />
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredOrdersCenterUsers.map(u => (
                  <div
                    key={u._id}
                    onClick={() => setSelectedOrdersUser(u)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 8,
                      background: selectedOrdersUser && selectedOrdersUser._id === u._id ? '#ed469022' : '#fff',
                      marginBottom: 6,
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: '#232323',
                      border: selectedOrdersUser && selectedOrdersUser._id === u._id ? '2px solid #ed4690' : '1.5px solid #eee',
                      boxShadow: selectedOrdersUser && selectedOrdersUser._id === u._id ? '0 2px 8px #ed469033' : 'none',
                      transition: 'all 0.18s'
                    }}
                  >
                    <div style={{ fontSize: 17 }}>{u.name}</div>
                    <div style={{ fontSize: 14, color: '#888' }}>{u.email}</div>
                  </div>
                ))}
                    </div>
            </aside>
            {/* Main Panel: Orders */}
            <main style={{ flex: 1, padding: 36, background: '#fff' }}>
              {!selectedOrdersUser ? (
                <div style={{ color: '#bbb', fontSize: 22, textAlign: 'center', marginTop: 120 }}>Select a user to view their orders.</div>
              ) : (
                <>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#4a23dd', marginBottom: 18 }}>Event Ticket Orders for {selectedOrdersUser.name} <span style={{ color: '#ed4690', fontWeight: 600, fontSize: 18 }}>({selectedOrdersUser.email})</span></div>
                  <div style={{ display: 'flex', gap: 18, marginBottom: 24 }}>
                    {/* Only one tab now, so no tab buttons needed */}
                  </div>
                  {ordersLoading ? (
                    <div style={{ color: '#ed4690', fontSize: 18 }}>Loading orders...</div>
                  ) : ordersError ? (
                    <div style={{ color: '#d7263d', fontSize: 18 }}>{ordersError}</div>
                  ) : (
                    <table className="admin-dashboard-table" style={{ marginBottom: 32 }}>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Event</th>
                          <th>Type</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrdersCenterTickets.length === 0 ? (
                          <tr><td colSpan={8} style={{ textAlign: 'center', color: '#bbb' }}>No ticket orders found.</td></tr>
                        ) : filteredOrdersCenterTickets.map(order => (
                          <tr key={order._id}>
                            <td>{order._id}</td>
                            <td>{order.bookingId?.eventId?.name || 'Event'}</td>
                            <td>{order.bookingId?.ticketType || ''}</td>
                            <td>{order.bookingId?.quantity || 1}</td>
                            <td>${order.bookingId?.price || 0}</td>
                            <td>{order.paymentStatus}</td>
                            <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</td>
                            <td><button className="events-nav-btn" style={{ background: '#ed4690', color: '#fff', borderRadius: 8, padding: '6px 18px', fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={() => { setShowReceipt(true); setReceiptData({ type: 'ticket', order }); }}>View Receipt</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
              {/* Receipt Modal */}
              {showReceipt && receiptData && (
                <div className="admin-ticketing-modal" onClick={() => setShowReceipt(false)}>
                  <div
                    className="modal"
                    onClick={e => e.stopPropagation()}
                    style={{
                      minWidth: 380,
                      maxWidth: 600,
                      position: 'relative',
                      background: 'linear-gradient(120deg, #fff 70%, #f6f4ff 100%)',
                      borderRadius: 28,
                      boxShadow: '0 12px 48px #ed469055',
                      padding: '48px 40px 36px 40px',
                      textAlign: 'left',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 16,
                      border: '2.5px solid #ed4690',
                      margin: '0 auto',
                      overflow: 'visible',
                      zIndex: 1000
                    }}
                  >
                    {/* Accent bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 8, background: 'linear-gradient(90deg, #ed4690 0%, #30FF99 100%)', borderTopLeftRadius: 28, borderTopRightRadius: 28, opacity: 0.18 }} />
                    {/* Watermark icon */}
                    <div style={{ position: 'absolute', right: 24, bottom: 90, fontSize: 120, color: '#ed469022', zIndex: 0, pointerEvents: 'none', userSelect: 'none' }}>
                      <i className="fas fa-ticket-alt"></i>
                    </div>
                    {/* Close Button */}
                    <button onClick={() => setShowReceipt(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ed4690', fontSize: 28, cursor: 'pointer', zIndex: 10, fontWeight: 900 }} title="Close">&times;</button>
                    <div style={{ fontWeight: 900, color: '#ed4690', fontSize: 30, marginBottom: 18, letterSpacing: 0.5, fontFamily: 'Alatsi, sans-serif', textShadow: '0 2px 12px #ed469033' }}>Order Receipt</div>
                    {/* Ticket Order Receipt */}
                    {receiptData.type === 'ticket' ? (
                      <div id="admin-receipt-print-section" style={{ padding: 0, position: 'relative', zIndex: 2 }}>
                        <div style={{ marginBottom: 18, fontSize: 15, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <div><strong>Order ID:</strong> <span style={{ wordBreak: 'break-all', background: '#f7f7fa', borderRadius: 6, padding: '2px 8px', fontFamily: 'monospace', fontSize: 13, marginBottom: 4, border: '1.5px solid #e6eaff' }}>{receiptData.order._id}</span></div>
                          <div><strong>User:</strong> <span style={{ color: '#5522cc', fontWeight: 600 }}>{receiptData.order.userId?.name}</span> <span style={{ color: '#888', fontSize: 13 }}>({receiptData.order.userId?.email})</span></div>
                          <div><strong>Event:</strong> <span style={{ color: '#ed4690', fontWeight: 700 }}>{receiptData.order.bookingId?.eventId?.name}</span></div>
                          <div><strong>Type:</strong> <span style={{ color: '#5522cc', fontWeight: 600 }}>{receiptData.order.bookingId?.ticketType}</span></div>
                          <div><strong>Quantity:</strong> {receiptData.order.bookingId?.quantity}</div>
                          <div><strong>Price:</strong> <span style={{ color: '#ed4690', fontWeight: 700 }}>${receiptData.order.bookingId?.price}</span></div>
                          <div><strong>Status:</strong> <span style={{ background: receiptData.order.paymentStatus === 'Completed' ? '#e6fbe8' : '#fff0f0', color: receiptData.order.paymentStatus === 'Completed' ? '#1ecb4f' : '#d7263d', borderRadius: 999, padding: '2px 16px', fontWeight: 800, fontSize: 15, border: '1.5px solid #b6eac2', marginLeft: 6 }}>{receiptData.order.paymentStatus}</span></div>
                          <div><strong>Date:</strong> {receiptData.order.createdAt ? new Date(receiptData.order.createdAt).toLocaleString() : ''}</div>
                    </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                          <button className="print-btn" onClick={e => {
                            e.currentTarget.style.background = '#5522cc';
                            const printContents = document.getElementById('admin-receipt-print-section').innerHTML;
                            const win = window.open('', '', 'height=700,width=900');
                            win.document.write('<html><head><title>Order Receipt</title>');
                            win.document.write('<link rel="stylesheet" href="/receipt.css" />');
                            win.document.write('</head><body>');
                            win.document.write(printContents);
                            win.document.write('</body></html>');
                            win.document.close();
                            win.focus();
                            setTimeout(() => { win.print(); win.close(); }, 500);
                          }}
                            style={{ background: '#23243A', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 36px', fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px #23243A22', transition: 'background 0.2s', outline: 'none', letterSpacing: 0.5 }}
                            onMouseEnter={e => e.currentTarget.style.background = '#5522cc'}
                            onMouseLeave={e => e.currentTarget.style.background = '#23243A'}
                          >
                            <i className="fas fa-print" style={{ marginRight: 10 }}></i> Print
                          </button>
                  </div>
                  </div>
                    ) : (
                      // Merchandise order receipt (already styled)
                      <div id="admin-receipt-print-section">
                        <div style={{ marginBottom: 10, fontSize: 15 }}>
                          <strong>Order ID:</strong>{' '}
                          <span style={{ wordBreak: 'break-all', maxWidth: 400, display: 'inline-block', verticalAlign: 'bottom', background: '#f7f7fa', borderRadius: 6, padding: '2px 8px', fontFamily: 'monospace', fontSize: 13, marginBottom: 4 }}>{receiptData.order._id}</span><br />
                          <strong>User:</strong> {receiptData.order.userId?.name} ({receiptData.order.userId?.email})<br />
                          <strong>Date:</strong> {receiptData.order.createdAt ? new Date(receiptData.order.createdAt).toLocaleString() : ''}
                              </div>
                        <table className="receipt-table" style={{ width: '100%', marginBottom: 18, borderCollapse: 'collapse', fontSize: 16 }}>
                          <thead>
                            <tr style={{ background: '#f7f7fa' }}>
                              <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Item</th>
                              <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Variant</th>
                              <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>Qty</th>
                              <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>Price</th>
                              <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {receiptData.order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {item.imgUrl && <img src={item.imgUrl} alt={item.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', background: '#f7f7fa', boxShadow: '0 1px 4px #ed469033' }} />}
                                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                                </td>
                                <td style={{ padding: 8 }}>{item.variant || '-'}</td>
                                <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: 8, textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                                <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                          Total: <span style={{ color: '#ed4690' }}>${receiptData.order.total.toFixed(2)}</span>
                              </div>
                        <div style={{ color: '#30FF99', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Payment Status: {receiptData.order.status}</div>
                        <div style={{ color: '#6E6E6E', fontSize: 15, marginBottom: 8 }}>Thank you for your purchase! Please keep this receipt for your records.</div>
                        <div style={{ marginTop: 18, textAlign: 'right' }}>
                          <button className="print-btn" onClick={() => {
                            const printContents = document.getElementById('admin-receipt-print-section').innerHTML;
                            const win = window.open('', '', 'height=700,width=900');
                            win.document.write('<html><head><title>Order Receipt</title>');
                            win.document.write('<link rel="stylesheet" href="/receipt.css" />');
                            win.document.write('</head><body>');
                            win.document.write(printContents);
                            win.document.write('</body></html>');
                            win.document.close();
                            win.focus();
                            setTimeout(() => { win.print(); win.close(); }, 500);
                          }} style={{ background: '#23243A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #23243A22', transition: 'background 0.2s', outline: 'none' }}>
                            <i className="fas fa-print" style={{ marginRight: 10 }}></i> Print
                          </button>
                              </div>
                              </div>
                  )}
                </div>
              </div>
              )}
          </main>
          </div>
        )}
        {/* Team Tab */}
        {activeTab === 'team' && (
          <main className="team-main" style={{padding: '2.5rem 2.5rem 2rem 2.5rem'}}>
            <h2 style={{fontSize: '2.3rem', fontWeight: 900, color: '#4a23dd', marginBottom: 32, letterSpacing: 0.5, textShadow: '0 2px 12px #ed469033'}}>Admin Team</h2>
            {/* Team Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 24, background: '#f7f7fa', borderRadius: 12, padding: '18px 24px', boxShadow: '0 2px 8px #ed469033', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16, minWidth: 180 }}
              />
              <input
                type="text"
                placeholder="Filter by email..."
                value={teamEmail}
                onChange={e => setTeamEmail(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16, minWidth: 180 }}
              />
              <button
                style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '10px 28px', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                onClick={() => { setTeamSearch(''); setTeamEmail(''); }}
              >
                Reset Filters
              </button>
            </div>
            <div className="team-admin-grid" style={{display: 'flex', flexWrap: 'wrap', gap: '2.5rem', justifyContent: 'flex-start'}}>
              {filteredAdmins.length === 0 ? (
                <div style={{color: '#bbb', fontSize: 20, marginTop: 32}}>No admin users found.</div>
              ) : (
                filteredAdmins.map(admin => (
                  <div key={admin._id} className="team-admin-card" style={{background: 'linear-gradient(120deg, #fff 60%, #f6f4ff 100%)', borderRadius: 22, boxShadow: '0 8px 40px rgba(61, 55, 241, 0.10), 0 2px 12px #ed469033', padding: '2.2rem 2.5rem', minWidth: 320, maxWidth: 380, flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', transition: 'box-shadow 0.2s, transform 0.13s', cursor: 'pointer'} } onClick={() => { setSelectedAdmin(admin); setShowAdminModal(true); }}>
                    <div style={{width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #ed4690 0%, #5522cc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, color: '#fff', fontWeight: 700, boxShadow: '0 4px 24px #ed469044', border: '4px solid #fff', marginBottom: 18, textShadow: '0 2px 12px #ed469033'}}>
                      {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div style={{fontWeight: 800, fontSize: 24, color: '#4a23dd', marginBottom: 6, letterSpacing: 0.5, textAlign: 'center'}}>{admin.name}</div>
                    <div style={{color: '#ed4690', fontWeight: 600, fontSize: 16, marginBottom: 8, letterSpacing: 1, textAlign: 'center'}}>Admin</div>
                    <div style={{color: '#6E6E6E', fontSize: 16, marginBottom: 2, textAlign: 'center'}}>{admin.email}</div>
                    <div style={{marginTop: 18, width: '100%', display: 'flex', justifyContent: 'center'}}>
                      <span style={{background: '#f7f7fa', color: '#7c2ae8', borderRadius: 12, padding: '6px 18px', fontWeight: 700, fontSize: 15, letterSpacing: 0.5, boxShadow: '0 2px 8px #ed469033'}}>Superuser</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Admin Modal */}
            {showAdminModal && selectedAdmin && (
              <div className="modal-overlay admin-events-modal" style={{zIndex: 3000}} onClick={e => { if (e.target.classList.contains('modal-overlay')) { setShowAdminModal(false); setSelectedAdmin(null); } }}>
                <div className="modal" style={{minWidth: 340, maxWidth: 600, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'stretch', maxHeight: '90vh', overflowY: 'auto', position: 'relative'}}>
                  <button onClick={() => { setShowAdminModal(false); setSelectedAdmin(null); }} style={{position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ed4690', fontSize: 26, cursor: 'pointer', zIndex: 10}} title="Close">&times;</button>
                  <h3 style={{color: '#4a23dd', fontWeight: 900, fontSize: 24, marginBottom: 8, letterSpacing: 0.5}}>{selectedAdmin.name}</h3>
                  <div style={{color: '#6E6E6E', fontSize: 16, marginBottom: 18}}>{selectedAdmin.email}</div>
                  {selectedAdmin.createdAt && (
                    <div style={{color: '#5522cc', fontSize: 16, marginBottom: 18, fontWeight: 700}}>
                      Account Created: {new Date(selectedAdmin.createdAt).toISOString().slice(0, 10)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        )}
        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <main className="customers-main" style={{padding: '2.5rem 2.5rem 2rem 2.5rem'}}>
            <h2 style={{fontSize: '2.3rem', fontWeight: 900, color: '#4a23dd', marginBottom: 32, letterSpacing: 0.5, textShadow: '0 2px 12px #ed469033'}}>Customers</h2>
            {/* Filter Bar for Customers */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 24, background: '#f7f7fa', borderRadius: 12, padding: '18px 24px', boxShadow: '0 2px 8px #ed469033' }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16, minWidth: 180 }}
              />
              <input
                type="text"
                placeholder="Filter by email..."
                value={filterVenue}
                onChange={e => setFilterVenue(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16, minWidth: 180 }}
              />
              <button
                style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '10px 28px', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                onClick={() => { setSearchQuery(''); setFilterVenue(''); }}
              >
                Reset Filters
              </button>
            </div>
            <div className="customers-list" style={{display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: 900, margin: '0 auto'}}>
              {filteredCustomers.length === 0 ? (
                <div style={{color: '#bbb', fontSize: 20, marginTop: 32}}>No customers found.</div>
              ) : (
                filteredCustomers.map(customer => (
                  <div key={customer._id} className="customer-card" style={{background: selectedCustomer && selectedCustomer._id === customer._id ? 'linear-gradient(120deg, #f6f4ff 60%, #fff 100%)' : 'linear-gradient(120deg, #fff 60%, #f6f4ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px rgba(61, 55, 241, 0.10), 0 2px 8px #ed469033', padding: '1.7rem 2.2rem', display: 'flex', alignItems: 'center', gap: 32, position: 'relative', transition: 'box-shadow 0.2s, transform 0.13s', cursor: 'pointer'} } onClick={() => openCustomerModal(customer)}>
                    <div style={{width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #ed4690 0%, #5522cc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', fontWeight: 700, boxShadow: '0 2px 12px #ed469044', border: '3px solid #fff', textShadow: '0 2px 12px #ed469033'}}>
                      {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 4}}>
                      <div style={{fontWeight: 800, fontSize: 20, color: '#4a23dd', marginBottom: 2, letterSpacing: 0.5}}>{customer.name}</div>
                      <div style={{color: '#6E6E6E', fontSize: 15, marginBottom: 2}}>{customer.email}</div>
                    </div>
                    <div style={{marginLeft: 18, display: 'flex', alignItems: 'center'}}>
                      <span style={{background: '#f7f7fa', color: '#ed4690', borderRadius: 12, padding: '6px 18px', fontWeight: 700, fontSize: 15, letterSpacing: 0.5, boxShadow: '0 2px 8px #ed469033'}}>Customer</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Customer Modal */}
            {customerModalOpen && selectedCustomer && (
              <div className="modal-overlay admin-events-modal" style={{zIndex: 3000}} onClick={e => { if (e.target.classList.contains('modal-overlay')) closeCustomerModal(); }}>
                <div className="modal" style={{minWidth: 340, maxWidth: 600, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'stretch', maxHeight: '90vh', overflowY: 'auto', position: 'relative'}}>
                  <button onClick={closeCustomerModal} style={{position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ed4690', fontSize: 26, cursor: 'pointer', zIndex: 10}} title="Close">&times;</button>
                  {/* Simplified customer info view: only name, email, and account creation date */}
                  <h3 style={{color: '#4a23dd', fontWeight: 900, fontSize: 24, marginBottom: 8, letterSpacing: 0.5}}>{selectedCustomer.name}</h3>
                  <div style={{color: '#6E6E6E', fontSize: 16, marginBottom: 18}}>{selectedCustomer.email}</div>
                  {selectedCustomer.createdAt && (
                    <div style={{color: '#5522cc', fontSize: 16, marginBottom: 18, fontWeight: 700}}>
                      Account Created: {new Date(selectedCustomer.createdAt).toISOString().slice(0, 10)}
                          </div>
                  )}
                </div>
              </div>
            )}
          </main>
        )}
        {/* Merchandise Tab */}
        {activeTab === 'merchandise' && (
          <div className="admin-merchandise-tab">
            <div className="merch-header">
              <span className="merch-title">Merchandise Management</span>
              <button className="merch-add-btn" onClick={openAddMerch}>Add Merchandise</button>
            </div>
            {/* Merchandise Filter Bar */}
            <div className="merch-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 24, background: '#f7f7fa', borderRadius: 12, padding: '18px 24px', boxShadow: '0 2px 8px #ed469033', maxWidth: 1600, marginLeft: 'auto', marginRight: 'auto' }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={merchFilterName}
                onChange={e => setMerchFilterName(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, minWidth: 180 }}
              />
              <select
                value={merchFilterType}
                onChange={e => setMerchFilterType(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, minWidth: 140 }}
              >
                <option value="">All Types</option>
                <option value="clothing">Clothing</option>
                <option value="object">Object</option>
              </select>
              <input
                type="number"
                placeholder="Min price"
                value={merchFilterMinPrice}
                onChange={e => setMerchFilterMinPrice(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, width: 100 }}
                min="0"
              />
              <input
                type="number"
                placeholder="Max price"
                value={merchFilterMaxPrice}
                onChange={e => setMerchFilterMaxPrice(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, width: 100 }}
                min="0"
              />
              {/* Size filter only if there are clothing items */}
              {merchandise.some(m => m.type === 'clothing' && m.sizes && m.sizes.length > 0) && (
                <select
                  value={merchFilterSize}
                  onChange={e => setMerchFilterSize(e.target.value)}
                  style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, minWidth: 120 }}
                >
                  <option value="">All Sizes</option>
                  {[...new Set(merchandise.filter(m => m.type === 'clothing').flatMap(m => m.sizes || []))].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              )}
              <button
                style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 8, padding: '10px 28px', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                onClick={() => { setMerchFilterName(''); setMerchFilterType(''); setMerchFilterMinPrice(''); setMerchFilterMaxPrice(''); setMerchFilterSize(''); }}
              >
                Reset Filters
              </button>
            </div>
            <div className="merch-table-card">
              <table className="merch-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Sizes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMerchandise.map(item => (
                    <tr key={item._id}>
                      <td>{item.images && item.images[0] && <img src={item.images[0]} alt={item.name} className="merch-img-thumb" />}</td>
                      <td>{item.name}</td>
                      <td><span className={`merch-status-badge ${item.type}`}>{item.type === 'clothing' ? 'Clothing' : 'Object'}</span></td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>{item.description}</td>
                      <td>{item.sizes && item.sizes.length > 0 ? item.sizes.join(', ') : '-'}</td>
                      <td>
                        <div className="merch-action-group">
                          <button className="merch-action-btn edit" onClick={() => openEditMerch(item)}>Edit</button>
                          <button className="merch-action-btn delete" onClick={() => handleDeleteMerch(item._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Modal for Add/Edit */}
            {showMerchModal && (
              <div className="merch-modal">
                <div className="merch-modal-content">
                  <h3>{editingMerch ? 'Edit Merchandise' : 'Add Merchandise'}</h3>
                  {merchModalError && <div className="merch-modal-error">{merchModalError}</div>}
                  <form onSubmit={handleMerchSubmit}>
                    <label>Name</label>
                    <input type="text" value={merchForm.name} onChange={e => setMerchForm({ ...merchForm, name: e.target.value })} required />
                    <label>Type</label>
                    <select value={merchForm.type} onChange={e => setMerchForm({ ...merchForm, type: e.target.value })} required>
                      <option value="clothing">Clothing</option>
                      <option value="object">Object</option>
                    </select>
                    <label>Price</label>
                    <input type="number" value={merchForm.price} onChange={e => setMerchForm({ ...merchForm, price: e.target.value })} required min="0" step="0.01" />
                    <label>Description</label>
                    <textarea value={merchForm.description} onChange={e => setMerchForm({ ...merchForm, description: e.target.value })} required />
                    <label>Images (comma-separated URLs)</label>
                    <input type="text" value={merchForm.images} onChange={e => setMerchForm({ ...merchForm, images: e.target.value })} placeholder="https://..." />
                    {merchForm.type === 'clothing' && (
                      <>
                        <label>Sizes (comma-separated)</label>
                        <input type="text" value={merchForm.sizes} onChange={e => setMerchForm({ ...merchForm, sizes: e.target.value })} placeholder="Small, Medium, Large" />
                      </>
                    )}
                    <div className="merch-modal-actions">
                      <button type="button" className="merch-modal-cancel-btn" onClick={closeMerchModal}>Cancel</button>
                      <button type="submit" className="merch-modal-save-btn" disabled={merchModalLoading}>{merchModalLoading ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <main className="inbox-main" style={{ padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 900, color: '#4a23dd', marginBottom: 32, letterSpacing: 0.5, textShadow: '0 2px 12px #ed469033' }}>Inbox</h2>
            {/* Inbox Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 24, background: '#f7f7fa', borderRadius: 12, padding: '18px 24px', boxShadow: '0 2px 8px #ed469033' }}>
              <input
                type="text"
                placeholder="Search name, email, subject, message..."
                value={inboxSearch}
                onChange={e => setInboxSearch(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16, minWidth: 180 }}
              />
              <select
                value={inboxStatus}
                onChange={e => setInboxStatus(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 16, minWidth: 140 }}
              >
                <option value="All">All Statuses</option>
                <option value="Read">Read</option>
                <option value="Unread">Unread</option>
              </select>
              <label style={{ fontWeight: 600, color: '#5522cc', fontSize: 15 }}>From:
                <input
                  type="date"
                  value={inboxDateFrom}
                  onChange={e => setInboxDateFrom(e.target.value)}
                  style={{ marginLeft: 6, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15 }}
                />
              </label>
              <label style={{ fontWeight: 600, color: '#5522cc', fontSize: 15 }}>To:
                <input
                  type="date"
                  value={inboxDateTo}
                  onChange={e => setInboxDateTo(e.target.value)}
                  style={{ marginLeft: 6, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15 }}
                />
              </label>
              <button
                style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '10px 28px', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                onClick={() => { setInboxSearch(''); setInboxStatus('All'); setInboxDateFrom(''); setInboxDateTo(''); }}
              >
                Reset Filters
              </button>
            </div>
            {inboxLoading ? (
              <div style={{ color: '#ed4690', fontSize: 18 }}>Loading messages...</div>
            ) : inboxError ? (
              <div style={{ color: '#d7263d', fontSize: 18 }}>{inboxError}</div>
            ) : (
              <table className="admin-dashboard-table" style={{ marginBottom: 32 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInboxMessages.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#bbb' }}>No messages found.</td></tr>
                  ) : filteredInboxMessages.map(msg => (
                    <tr key={msg._id} style={{ background: msg.isRead ? '#fff' : '#f6f4ff', fontWeight: msg.isRead ? 400 : 700 }}>
                      <td>{msg.name}</td>
                      <td>{msg.email}</td>
                      <td>{msg.subject || '-'}</td>
                      <td>{msg.message ? (msg.message.length > 40 ? msg.message.slice(0, 40) + '...' : msg.message) : '-'}</td>
                      <td>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</td>
                      <td className={`inbox-status-cell`}>
                        <span className={`inbox-status-badge ${msg.isRead ? 'read' : 'unread'}`}>{msg.isRead ? 'Read' : 'Unread'}</span>
                      </td>
                      <td>
                        <button className="events-nav-btn" style={{ background: '#5522cc', color: '#fff', borderRadius: 8, padding: '6px 18px', fontWeight: 600, border: 'none', cursor: 'pointer', marginRight: 8 }} onClick={() => openMessageModal(msg)}>View</button>
                        <button className="events-nav-btn" style={{ background: msg.isRead ? '#ed4690' : '#30FF99', color: msg.isRead ? '#fff' : '#23243A', borderRadius: 8, padding: '6px 18px', fontWeight: 600, border: 'none', cursor: 'pointer', marginRight: 8 }} onClick={() => handleMarkRead(msg, !msg.isRead)}>{msg.isRead ? 'Mark Unread' : 'Mark Read'}</button>
                        <button className="events-nav-btn" style={{ background: '#d7263d', color: '#fff', borderRadius: 8, padding: '6px 18px', fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={() => handleDeleteMessage(msg)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {showMessageModal && selectedMessage && (
              <div className="modal-overlay admin-events-modal" style={{ zIndex: 3000 }} onClick={e => { if (e.target.classList.contains('modal-overlay')) closeMessageModal(); }}>
                <div className="modal" style={{ minWidth: 340, maxWidth: 600, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'stretch', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                  <button onClick={closeMessageModal} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ed4690', fontSize: 26, cursor: 'pointer', zIndex: 10 }} title="Close">&times;</button>
                  <h3 style={{ color: '#4a23dd', fontWeight: 900, fontSize: 24, marginBottom: 8, letterSpacing: 0.5 }}>Message from {selectedMessage.name}</h3>
                  <div style={{ color: '#6E6E6E', fontSize: 16, marginBottom: 8 }}>{selectedMessage.email}</div>
                  <div style={{ color: '#5522cc', fontSize: 16, marginBottom: 8, fontWeight: 700 }}>Subject: {selectedMessage.subject || '-'}</div>
                  {/* Message content in modal: use a resizable, read-only textarea */}
                  <textarea
                    value={selectedMessage.message}
                    readOnly
                    style={{
                      width: '100%',
                      minHeight: 80,
                      resize: 'vertical',
                      borderRadius: 8,
                      border: '1.5px solid #ececec',
                      background: '#f7f7fa',
                      fontSize: 17,
                      color: '#232323',
                      padding: 16,
                      marginBottom: 18,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontWeight: 400
                    }}
                  />
                  <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>Received: {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : ''}</div>
                  <div className="modal-actions">
                    <button className="save-btn" onClick={() => handleMarkRead(selectedMessage, !selectedMessage.isRead)}>{selectedMessage.isRead ? 'Mark as Unread' : 'Mark as Read'}</button>
                    <button className="cancel-btn" onClick={() => handleDeleteMessage(selectedMessage)}>Delete</button>
                    <button className="cancel-btn" onClick={closeMessageModal}>Close</button>
      </div>
          </div>
        </div>
      )}
          </main>
        )}
        {/* Merchandise Orders Tab */}
        {activeTab === 'merchorders' && (
          <div className="admin-merchorders-tab" style={{ padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 900, color: '#4a23dd', marginBottom: 32, letterSpacing: 0.5, textShadow: '0 2px 12px #ed469033' }}>Merchandise Orders</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 24, background: '#f7f7fa', borderRadius: 12, padding: '18px 24px', boxShadow: '0 2px 8px #ed469033', maxWidth: 1600, marginLeft: 'auto', marginRight: 'auto' }}>
              <input
                type="text"
                placeholder="Search by user name or email..."
                value={merchOrdersSearch}
                onChange={e => setMerchOrdersSearch(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, minWidth: 180 }}
              />
              <input
                type="text"
                placeholder="Order ID..."
                value={merchOrdersOrderId}
                onChange={e => setMerchOrdersOrderId(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, minWidth: 120 }}
              />
              <input
                type="text"
                placeholder="Item name..."
                value={merchOrdersItem}
                onChange={e => setMerchOrdersItem(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15, minWidth: 120 }}
              />
              <label style={{ fontWeight: 600, color: '#5522cc', fontSize: 15 }}>From:
                <input
                  type="date"
                  value={merchOrdersFromDate}
                  onChange={e => setMerchOrdersFromDate(e.target.value)}
                  style={{ marginLeft: 6, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15 }}
                />
              </label>
              <label style={{ fontWeight: 600, color: '#5522cc', fontSize: 15 }}>To:
                <input
                  type="date"
                  value={merchOrdersToDate}
                  onChange={e => setMerchOrdersToDate(e.target.value)}
                  style={{ marginLeft: 6, padding: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 15 }}
                />
              </label>
              <button
                style={{ background: '#ed4690', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 8, padding: '10px 28px', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                onClick={() => { setMerchOrdersSearch(''); setMerchOrdersOrderId(''); setMerchOrdersItem(''); setMerchOrdersFromDate(''); setMerchOrdersToDate(''); }}
              >
                Reset Filters
              </button>
            </div>
            <div className="merchorders-table-card" style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px 0 rgba(61,55,241,0.08)', padding: 0, margin: '0 auto 32px auto', border: '1.5px solid #e6eaff', maxWidth: 1600, width: '100%', position: 'relative', overflowX: 'auto', transition: 'box-shadow 0.2s', minWidth: 320 }}>
              <table className="merch-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 14, background: 'none' }}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShopOrders.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: '#bbb' }}>No merchandise orders found.</td></tr>
                  ) : filteredShopOrders.map(order => (
                    <tr key={order._id} style={{ background: '#f9f9fb', transition: 'background 0.18s', borderRadius: 12, boxShadow: '0 1px 6px #ed469011' }}>
                      <td style={{ padding: 12, wordBreak: 'break-all', maxWidth: 180 }}>
                        <span style={{ background: '#d4f8e8', color: '#1b5e20', borderRadius: 8, padding: '3px 6px', fontWeight: 700, fontSize: 10, letterSpacing: 0.5, boxShadow: '0 2px 8px #d4f8e822', display: 'inline-block' }}>{order._id}</span>
                      </td>
                      <td style={{ padding: 12 }}>{order.userId?.name || '-'}</td>
                      <td style={{ padding: 12 }}>{order.userId?.email || '-'}</td>
                      <td style={{ padding: 12 }}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</td>
                      <td style={{ padding: 12 }}>{order.status}</td>
                      <td style={{ padding: 12, color: '#ed4690', fontWeight: 700, fontSize: 15 }}>${order.total?.toFixed(2)}</td>
                      <td style={{ padding: 12 }}>
                        {order.items && order.items.length > 0 ? (
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {order.items.map((item, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>
                                <span style={{ fontWeight: 600 }}>{item.name}</span> x{item.quantity} <span style={{ color: '#888', fontSize: 13 }}>({item.variant || '-'})</span>
                              </li>
                            ))}
                          </ul>
                        ) : '-'}
                      </td>
                      <td style={{ padding: 12 }}>
                        <button className="merch-action-btn" style={{ background: '#ed4690', color: '#fff', borderRadius: 8, padding: '7px 22px', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #ed469022', transition: 'background 0.2s' }}
                          onClick={() => { setShowMerchReceipt(true); setMerchReceiptData(order); }}>
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Merchandise Receipt Modal */}
            {showMerchReceipt && merchReceiptData && (
              <div className="admin-ticketing-modal" onClick={() => setShowMerchReceipt(false)}>
                <div
                  className="modal"
                  onClick={e => e.stopPropagation()}
                  style={{
                    minWidth: 380,
                    maxWidth: 600,
                    position: 'relative',
                    background: 'linear-gradient(120deg, #fff 70%, #f6f4ff 100%)',
                    borderRadius: 28,
                    boxShadow: '0 12px 48px #ed469055',
                    padding: '48px 40px 36px 40px',
                    textAlign: 'left',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 16,
                    border: '2.5px solid #ed4690',
                    margin: '0 auto',
                    overflow: 'visible',
                    zIndex: 1000
                  }}
                >
                  {/* Accent bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 8, background: 'linear-gradient(90deg, #ed4690 0%, #30FF99 100%)', borderTopLeftRadius: 28, borderTopRightRadius: 28, opacity: 0.18 }} />
                  {/* Watermark icon */}
                  <div style={{ position: 'absolute', right: 24, bottom: 90, fontSize: 120, color: '#ed469022', zIndex: 0, pointerEvents: 'none', userSelect: 'none' }}>
                    <i className="fas fa-box-open"></i>
                  </div>
                  {/* Close Button */}
                  <button onClick={() => setShowMerchReceipt(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ed4690', fontSize: 28, cursor: 'pointer', zIndex: 10, fontWeight: 900 }} title="Close">&times;</button>
                  <div style={{ fontWeight: 900, color: '#ed4690', fontSize: 30, marginBottom: 18, letterSpacing: 0.5, fontFamily: 'Alatsi, sans-serif', textShadow: '0 2px 12px #ed469033' }}>Order Receipt</div>
                  <div id="admin-merch-receipt-print-section" style={{ padding: 0, position: 'relative', zIndex: 2 }}>
                    <div style={{ marginBottom: 18, fontSize: 15, display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div><strong>Order ID:</strong> <span style={{ wordBreak: 'break-all', background: '#f7f7fa', borderRadius: 6, padding: '2px 8px', fontFamily: 'monospace', fontSize: 13, marginBottom: 4, border: '1.5px solid #e6eaff' }}>{merchReceiptData._id}</span></div>
                      <div><strong>User:</strong> <span style={{ color: '#5522cc', fontWeight: 600 }}>{merchReceiptData.userId?.name}</span> <span style={{ color: '#888', fontSize: 13 }}>({merchReceiptData.userId?.email})</span></div>
                      <div><strong>Date:</strong> {merchReceiptData.createdAt ? new Date(merchReceiptData.createdAt).toLocaleString() : ''}</div>
                      <div><strong>Status:</strong> <span style={{ background: merchReceiptData.status === 'paid' ? '#e6fbe8' : '#fff0f0', color: merchReceiptData.status === 'paid' ? '#1ecb4f' : '#d7263d', borderRadius: 999, padding: '2px 16px', fontWeight: 800, fontSize: 15, border: '1.5px solid #b6eac2', marginLeft: 6 }}>{merchReceiptData.status}</span></div>
                    </div>
                    <table className="receipt-table" style={{ width: '100%', marginBottom: 18, borderCollapse: 'collapse', fontSize: 16 }}>
                      <thead>
                        <tr style={{ background: '#f7f7fa' }}>
                          <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Item</th>
                          <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Variant</th>
                          <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>Price</th>
                          <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {merchReceiptData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {item.imgUrl && <img src={item.imgUrl} alt={item.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', background: '#f7f7fa', boxShadow: '0 1px 4px #ed469033' }} />}
                              <span style={{ fontWeight: 600 }}>{item.name}</span>
                            </td>
                            <td style={{ padding: 8 }}>{item.variant || '-'}</td>
                            <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: 8, textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                            <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                      Total: <span style={{ color: '#ed4690' }}>${merchReceiptData.total.toFixed(2)}</span>
                    </div>
                    <div style={{ color: '#30FF99', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Payment Status: {merchReceiptData.status}</div>
                    <div style={{ color: '#6E6E6E', fontSize: 15, marginBottom: 8 }}>Thank you for your purchase! Please keep this receipt for your records.</div>
                    <div style={{ marginTop: 18, textAlign: 'right' }}>
                      <button className="print-btn" onClick={() => {
                        const printContents = document.getElementById('admin-merch-receipt-print-section').innerHTML;
                        const win = window.open('', '', 'height=700,width=900');
                        win.document.write('<html><head><title>Order Receipt</title>');
                        win.document.write('<link rel="stylesheet" href="/receipt.css" />');
                        win.document.write('</head><body>');
                        win.document.write(printContents);
                        win.document.write('</body></html>');
                        win.document.close();
                        win.focus();
                        setTimeout(() => { win.print(); win.close(); }, 500);
                      }} style={{ background: '#23243A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #23243A22', transition: 'background 0.2s', outline: 'none' }}>
                        <i className="fas fa-print" style={{ marginRight: 10 }}></i> Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Other tabs can be implemented similarly */}
      </div>
      {/* Settings Modal */}
      
      {/* Profile Dropdown Portal */}
      {showProfileMenu && ReactDOM.createPortal(
        <div className="admin-profile-menu" style={{position: 'fixed', right: 32, top: 72, zIndex: 4000}}>
          <button style={{width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 600, color: '#4a23dd'}} onClick={() => { setShowProfileMenu(false); navigate('/'); }}>Go to Landing Page</button>
          <button style={{width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer'}} onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>Profile</button>
          <button style={{width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#ed4690'}} onClick={handleLogout}>Logout</button>
        </div>,
        document.body
      )}
      {/* Notification Dropdown Portal */}
      {showNotifDropdown && ReactDOM.createPortal(
        <div className="admin-notification-dropdown">
          <div className="notif-header">Notifications</div>
          <ul className="notif-list">
            {notifications.length === 0 ? (
              <li className="notif-item" style={{ color: '#bbb', textAlign: 'center', padding: 24 }}>No notifications</li>
            ) : notifications.slice(0, 5).map(n => (
              <li key={n._id} className={`notif-item${n.read ? '' : ' unread'}`}>
                <span className="notif-icon">{n.type === 'ticket' ? <FaTicketAlt style={{ color: '#ed4690' }} /> : n.type === 'event' ? <FaCalendarAlt style={{ color: '#5522cc' }} /> : n.type === 'user' ? <FaUserFriends style={{ color: '#7c2ae8' }} /> : n.type === 'inventory' ? <FaBoxOpen style={{ color: '#ed4690' }} /> : <FaBell />}</span>
                <div className="notif-content">
                  {n.content}
                  <div className="notif-time">{new Date(n.time).toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {n.eventId && <button onClick={() => goToEvent(n.eventId)} style={{ color: '#4a23dd', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Go to Event</button>}
                    {!n.read && <button onClick={() => markAsRead(n._id)} style={{ color: '#1ecb4f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark as Read</button>}
                    {n.read && <button onClick={() => markAsUnread(n._id)} style={{ color: '#ed4690', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark as Unread</button>}
                    <button onClick={() => deleteNotification(n._id)} style={{ color: '#d7263d', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="notif-footer">
            <button onClick={handleOpenNotifModal}>View All</button>
          </div>
        </div>,
        document.body
      )}
      {/* Notification Modal Portal */}
      {showNotifModal && ReactDOM.createPortal(
        <div className="admin-notification-modal">
          <div className="modal">
            <h3>All Notifications</h3>
            <ul className="notif-list">
              {notifications.length === 0 ? (
                <li className="notif-item" style={{ color: '#bbb', textAlign: 'center', padding: 24 }}>No notifications</li>
              ) : notifications.map(n => (
                <li key={n._id} className={`notif-item${n.read ? '' : ' unread'}`}>
                  <span className="notif-icon">{n.type === 'ticket' ? <FaTicketAlt style={{ color: '#ed4690' }} /> : n.type === 'event' ? <FaCalendarAlt style={{ color: '#5522cc' }} /> : n.type === 'user' ? <FaUserFriends style={{ color: '#7c2ae8' }} /> : n.type === 'inventory' ? <FaBoxOpen style={{ color: '#ed4690' }} /> : <FaBell />}</span>
                  <div className="notif-content">
                    {n.content}
                    <div className="notif-time">{new Date(n.time).toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      {n.eventId && <button onClick={() => goToEvent(n.eventId)} style={{ color: '#4a23dd', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Go to Event</button>}
                      {!n.read && <button onClick={() => markAsRead(n._id)} style={{ color: '#1ecb4f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark as Read</button>}
                      {n.read && <button onClick={() => markAsUnread(n._id)} style={{ color: '#ed4690', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark as Unread</button>}
                      <button onClick={() => deleteNotification(n._id)} style={{ color: '#d7263d', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button className="close-btn" onClick={() => setShowNotifModal(false)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Settings Modal: Admin Version Info */}
      {showSettings && (
        <div className="modal-overlay admin-events-modal" style={{zIndex: 4000}} onClick={e => { if (e.target.classList.contains('modal-overlay')) setShowSettings(false); }}>
          <div className="modal" style={{minWidth: 320, maxWidth: 400, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: 36}}>
            <button onClick={() => setShowSettings(false)} style={{position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ed4690', fontSize: 26, cursor: 'pointer', zIndex: 10}} title="Close">&times;</button>
            {/* Admin version modal */}
            <h2 style={{color: '#4a23dd', fontWeight: 900, fontSize: 28, marginBottom: 18, letterSpacing: 0.5}}>Admin Panel</h2>
            <div style={{color: '#ed4690', fontWeight: 700, fontSize: 20, marginBottom: 12}}>Version 1.7</div>
            <div style={{color: '#888', fontSize: 15, textAlign: 'center'}}>You are running the latest admin panel version.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;