# Adelaide Fringe Project

![Adelaide Fringe Banner](https://playandgo.com.au/wp-content/uploads/2025/03/gawler-fringe-in-the-park-2025.jpeg)

---

## 🎭 Overview

The **Adelaide Fringe Project** is a modern, full-stack web application designed and led by Udantha Weliwatta as the Lead Developer. to provide a seamless experience for event discovery, ticket purchasing, merchandise shopping, and event management. Built with a robust React frontend and a scalable Node.js/Express backend, the platform empowers users and administrators to interact with the vibrant world of Adelaide Fringe events.

---

## 🚀 Features

- **Event Discovery:** Browse, search, and filter a wide range of events by category, venue, date, and price.
- **User Authentication:** Secure login, registration, and social login (Google, Facebook).
- **Ticket Booking:** Purchase tickets for events with real-time seat and price management.
- **Merchandise Shop:** Explore and buy official Adelaide Fringe merchandise.
- **Order Management:** View and manage your ticket and shop orders.
- **Admin Dashboard:** Manage events, users, notifications, and sales (admin only).
- **Responsive Design:** Optimized for desktop.
- **Secure Payments:** Integrated with Stripe for safe and reliable transactions.

---

## 🛠️ Tech Stack

**Frontend:**
- React 18.2.0
- Material-UI (MUI) 7.0.2
- React Router DOM 6.22.1
- Emotion, Font Awesome, React Icons

**Backend:**
- Node.js, Express.js
- MongoDB (Mongoose ODM)
- Passport.js (OAuth)
- Stripe API (Payments)

**Testing:**
- Jest, React Testing Library, DOM Testing Library

**DevOps:**
- Docker, GitLab CI/CD

---

## 📦 Project Structure

```
Fringe/
├── fringe-client/         # React frontend
│   ├── src/
│   ├── public/
│   └── ...
├── fringe-backend/        # Node.js/Express backend
│   ├── routes/
│   ├── models/
│   └── ...
├── .gitlab-ci.yml         # CI/CD pipeline config
├── Dockerfile             # Docker container config
└── README.md              # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm
- MongoDB (local or cloud)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd Fringe
   ```
2. **Install dependencies:**
   ```bash
   cd fringe-client && npm install
   cd ../fringe-backend && npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both `fringe-client` and `fringe-backend` (if provided).
   - Set your MongoDB URI, Stripe keys, and other secrets.

4. **Start the backend:**
   ```bash
   cd fringe-backend
   npm start
   # or: node server.js
   ```
5. **Start the frontend:**
   ```bash
   cd ../fringe-client
   npm start
   ```
6. **Access the app:**
   - Website: [fringe-obs.vercel.app](https://fringe-obs.vercel.app/)
   

---

## 🧑‍💻 Usage
- Register or log in as a user.
- Browse and filter events.
- Add tickets and merchandise to your cart.
- Checkout securely via Stripe.
- View your orders and profile.
- Admins can manage events, users, and notifications from the dashboard.

---

## 🚢 Deployment

**Live Application:** [https://fringe-obs.vercel.app](https://fringe-obs.vercel.app)

### Vercel Deployment
The application is deployed on Vercel with a monolithic architecture combining both frontend and backend:

- **Platform:** Vercel (Serverless)
- **Frontend:** React app served from `/fringe-client/build`
- **Backend:** Express.js API served via serverless functions at `/api/*`
- **Database:** MongoDB Atlas

### Environment Variables Required:
```bash
# Database
MONGO_URL=mongodb+srv://...

# Authentication
SECRET_KEY=your_secret_key
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://fringe-obs.vercel.app/api/auth/google/callback

# Payment
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Frontend URLs
FRONTEND_URL=https://fringe-obs.vercel.app
REACT_APP_API_URL=https://fringe-obs.vercel.app/api
REACT_APP_FRONTEND_URL=https://fringe-obs.vercel.app
```

### Deployment Steps:
1. **Connect to Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **MongoDB Atlas Setup:**
   - Ensure MongoDB Atlas cluster allows access from anywhere (`0.0.0.0/0`)
   - Update connection string in Vercel environment variables

3. **Automatic Deployment:**
   - Push to `main` branch triggers automatic deployment
   - Vercel builds using `vercel.json` configuration

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📫 Contact

- **Lead Developer:** Udantha Weliwatta ([weli0007@flinders.edu.au](mailto:weli0007@flinders.edu.au))
- **Alternative Contact:** [utgw98@gmail.com](mailto:utgw98@gmail.com)
- **Company Website:** [hyferion.com](https://hyferion.com)
- **Project Repository:** [GitLab/GitHub URL]

---

> © Adelaide Fringe Project. All rights reserved.