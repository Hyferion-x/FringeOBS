import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Updated for Vercel deployment - using centralized API configuration
import { API_ENDPOINTS } from './config/api';
import './receipt.css'; // (Create this file for print styles)

const Success = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('');
  const [orderInfo, setOrderInfo] = useState({});
  const [allItems, setAllItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    const token = localStorage.getItem('token');
    if (!sessionId) {
      setError('No session ID found.');
      setLoading(false);
      return;
    }
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }
          fetch(API_ENDPOINTS.PAYMENTS.VERIFY_ORDERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sessionId })
    })
      .then(res => res.ok ? res.json() : null)
      .then(async data => {
        // Always show both event and shop receipts if present
        let items = [];
        let ticketReceipts = [];
        let shopReceipts = [];
        if (data && data.tickets?.length > 0) {
          ticketReceipts = data.tickets.map(t => ({
            name: t.eventName,
            type: t.ticketType,
            quantity: t.quantity || 1,
            price: t.price,
            subtotal: t.price * (t.quantity || 1),
            orderType: 'ticket',
            orderId: t._id
          }));
        }
        if (data && data.shopOrder && data.shopOrder.items?.length > 0) {
          shopReceipts = data.shopOrder.items.map(m => ({
            name: m.name,
            type: m.variant || 'Merchandise',
            quantity: m.quantity,
            price: m.price,
            subtotal: m.price * m.quantity,
            orderType: 'shop',
            orderId: data.shopOrder._id
          }));
        }
        // Deduplicate by orderId and name/type
        const uniqueReceipts = [...ticketReceipts, ...shopReceipts].filter((item, idx, arr) =>
          arr.findIndex(x => x.orderId === item.orderId && x.name === item.name && x.type === item.type) === idx
        );
        setAllItems(uniqueReceipts);
        setOrderInfo({
          orderId: sessionId,
          date: new Date().toLocaleString(),
        });
              setLoading(false);
      })
      .catch(async err => {
        setApiStatus('Your order was already processed. Here are your latest orders.');
        // Removed all localStorage/mock/test logic. Only DB-backed data is used.
        setAllItems([]);
            setLoading(false);
      });
  }, [location.search, navigate]);

  if (loading) return (
    <div style={{ textAlign: 'center', marginTop: 80 }}>
      <div>Processing your order...</div>
      {apiStatus && <div style={{ fontSize: 12, color: '#888', marginTop: 10 }}>{apiStatus}</div>}
    </div>
  );
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 80 }}>{error}</div>;

  // Calculate total
  const total = allItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  return (
    <div className="events-root" style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #fff 60%, #f6f4ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 600, margin: '80px auto 0 auto', background: 'rgba(255,255,255,0.85)', borderRadius: 28, boxShadow: '0 8px 40px #ed469033', padding: '48px 36px 36px 36px', textAlign: 'center', backdropFilter: 'blur(8px)', border: '1.5px solid #e6eaff', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 8, background: 'linear-gradient(90deg, #ed4690 0%, #30FF99 100%)', borderTopLeftRadius: 28, borderTopRightRadius: 28, opacity: 0.18 }} />
        <div style={{ fontSize: 64, color: '#30FF99', marginBottom: 18, textShadow: '0 2px 12px #ed469033' }}><i className="fas fa-check-circle"></i></div>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: '#232323', marginBottom: 10, letterSpacing: 0.5, fontFamily: 'Alatsi, sans-serif' }}>Payment Successful!</h2>
        <div style={{ color: '#6E6E6E', fontSize: 19, marginBottom: 18, fontWeight: 500 }}>Your order is confirmed.<br />Thank you for your purchase!</div>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 16, background: '#f0f0f0', padding: 8, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{apiStatus}</div>
        <div id="order-details-section" style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 16, boxShadow: '0 1px 6px #ed469033', padding: '18px 18px 10px 18px', marginBottom: 24, textAlign: 'left', fontFamily: 'DM Sans, sans-serif', fontSize: 16 }}>
          <div style={{ fontWeight: 700, color: '#232323', marginBottom: 8, fontSize: 18 }}>Order Receipt</div>
          <div style={{ marginBottom: 10, fontSize: 15 }}>
            <strong>Order ID:</strong>{' '}
            <span style={{
              wordBreak: 'break-all',
              maxWidth: 400,
                      display: 'inline-block',
                      verticalAlign: 'bottom',
                      background: '#f7f7fa',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontFamily: 'monospace',
                      fontSize: 13,
              marginBottom: 4
            }}>{orderInfo.orderId}</span><br />
            <strong>Date:</strong> {orderInfo.date}
                </div>
          <table className="receipt-table" style={{ width: '100%', marginBottom: 18, borderCollapse: 'collapse', fontSize: 16 }}>
            <thead>
              <tr style={{ background: '#f7f7fa' }}>
                <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Item</th>
                <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Type</th>
                <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>Price</th>
                <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {allItems.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No items found for this order.</td></tr>
              ) : (
                allItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8 }}>{item.name}</td>
                    <td style={{ padding: 8 }}>{item.type}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>${item.price}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>${item.subtotal}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
            Total: <span style={{ color: '#ed4690' }}>${total}</span>
                  </div>
          <div style={{ color: '#30FF99', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Payment Status: Paid</div>
          <div style={{ color: '#6E6E6E', fontSize: 15, marginBottom: 8 }}>Thank you for your purchase! Please keep this receipt for your records.</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 18 }}>
          <button onClick={() => window.print()} className="print-btn" style={{ background: '#23243A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #23243A22', transition: 'background 0.2s', outline: 'none' }}>
            <i className="fas fa-print" style={{ marginRight: 10 }}></i> Print Receipt
          </button>
          <button onClick={() => navigate('/profile')} style={{ background: '#5522cc', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #5522cc22', transition: 'background 0.2s', outline: 'none' }}>
            <i className="fas fa-user-circle" style={{ marginRight: 10 }}></i> My Profile
          </button>
          <button onClick={() => navigate('/shop')} style={{ background: '#ed4690', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #ed469022', transition: 'background 0.2s', outline: 'none' }}>
            <i className="fas fa-store" style={{ marginRight: 10 }}></i> Go to Shop
          </button>
          <button onClick={() => navigate('/')} style={{ background: '#30FF99', color: '#23243A', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #30FF9922', transition: 'background 0.2s', outline: 'none' }}>
            <i className="fas fa-home" style={{ marginRight: 10 }}></i> Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success; 