// API Configuration for Vercel Deployment
// This file centralizes all API endpoints to make switching between environments easy

// Get the API base URL from environment variables
// In production (Vercel), this will be your deployed API URL
// In development, it will be your local backend URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Frontend URL (for redirects and callbacks)
export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';

// API endpoints object for easy management
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/users/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
    GOOGLE: `${API_BASE_URL}/auth/google`,
    ALL_USERS: `${API_BASE_URL}/auth/all`,
    UPDATE_PASSWORD: `${API_BASE_URL}/auth/profile/password`,
  },
  
  // Events
  EVENTS: {
    BASE: `${API_BASE_URL}/events`,
    BY_ID: (id) => `${API_BASE_URL}/events/${id}`,
    EXPECTED_SALES: (eventId) => `${API_BASE_URL}/events/expected-sales/${eventId}`,
    CONTACT_MESSAGES: `${API_BASE_URL}/events/contact-messages`,
  },
  
  // Cart
  CART: {
    BASE: `${API_BASE_URL}/cart`,
    ADD: `${API_BASE_URL}/cart/add`,
    UPDATE: `${API_BASE_URL}/cart/update`,
    REMOVE: `${API_BASE_URL}/cart/remove`,
    CLEAR: `${API_BASE_URL}/cart/clear`,
  },
  
  // Payments
  PAYMENTS: {
    CREATE_SESSION: `${API_BASE_URL}/payments/create-checkout-session`,
    VERIFY_ORDERS: `${API_BASE_URL}/payments/verify-and-create-orders`,
  },
  
  // Merchandise
  MERCHANDISE: {
    BASE: `${API_BASE_URL}/merchandise`,
    BY_ID: (id) => `${API_BASE_URL}/merchandise/${id}`,
  },
  
  // Orders
  ORDERS: {
    SHOP: `${API_BASE_URL}/shopOrders`,
    SHOP_BY_ID: (id) => `${API_BASE_URL}/shopOrders/${id}`,
    SHOP_ALL: `${API_BASE_URL}/shopOrders/all`,
    TICKETS: `${API_BASE_URL}/ticketOrders`,
    TICKETS_ADMIN: `${API_BASE_URL}/ticketOrders/admin`,
    TICKETS_BY_ID: (id) => `${API_BASE_URL}/ticketOrders/${id}`,
  },
  
  // Bookings
  BOOKINGS: {
    BASE: `${API_BASE_URL}/bookings`,
    BY_ID: (id) => `${API_BASE_URL}/bookings/${id}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: `${API_BASE_URL}/notifications`,
    READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
    UNREAD: (id) => `${API_BASE_URL}/notifications/${id}/unread`,
    DELETE: (id) => `${API_BASE_URL}/notifications/${id}`,
  },
  
  // Users
  USERS: {
    ALL: `${API_BASE_URL}/users/all`,
    BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
  },
  
  // Contact Messages
  CONTACT: {
    MESSAGES: `${API_BASE_URL}/contactMessages`,
    MESSAGE_BY_ID: (id) => `${API_BASE_URL}/events/contact-messages/${id}`,
    MARK_READ: (id) => `${API_BASE_URL}/events/contact-messages/${id}/read`,
    DELETE: (id) => `${API_BASE_URL}/events/contact-messages/${id}`,
  },
};

// Helper function to make API calls with consistent error handling
export const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export default API_ENDPOINTS; 