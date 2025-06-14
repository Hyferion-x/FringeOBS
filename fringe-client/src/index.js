import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './landing';
import Login from './login';
import Signup from './signup';
import Events from './events';
import Admin from './admin';
import Profile from './profile';
import EventDetail from './EventDetail';
import Success from './Success';
import Cart from './Cart';
import './landing.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Contact from './Contact';
import MyOrders from './MyOrders';
import Shop from './Shop';
import ShopDetail from './ShopDetail';
import ShopSuccess from './ShopSuccess';
import TicketReceipt from './TicketReceipt';
import AboutUs from './AboutUs.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/events" element={<Events />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/success" element={<Success />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/myorders" element={<MyOrders />} />
        <Route path="/tickets" element={<MyOrders />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ShopDetail />} />
        <Route path="/shop-success" element={<ShopSuccess />} />
        <Route path="/ticket-receipt/:id" element={<TicketReceipt />} />
        <Route path="/AboutUs" element={<AboutUs />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
