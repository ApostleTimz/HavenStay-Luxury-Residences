# HavenStay

HavenStay is a React + Vite frontend with an Express/PostgreSQL backend. The frontend is organized by feature so UI components, pages, hooks, and API calls have separate responsibilities.

## Features

- Curated shortlet apartment discovery with city search
- Guest signup and signin with JWT authentication
- Booking creation, payment, cancellation, and reservation history
- Paystack payments initialized securely on the backend
- Branded in-app receipt with print / save-to-PDF support
- Email receipt delivery to the guest after successful payment

## Project structure

```text
backend/
  config/          Database connection
  middleware/      Authentication middleware
  routes/          API route definitions
  services/        Receipt email service
  schema.sql       PostgreSQL schema
  server.js        API entry point
frontend/
  src/
    components/layout/       Shared application layout
    features/apartments/     Apartment discovery UI
    features/auth/           Authentication UI
    features/bookings/       Booking, payment, and receipt UI
    hooks/                   Reusable application state/data hooks
    pages/                   Page-level composition
    services/                Axios API client
    App.jsx                  Application composition
```

## Setup

1. Create the PostgreSQL database and run `backend/schema.sql`.
2. Copy `backend/.env.example` to `backend/.env` and provide your database password, JWT secret, and Paystack test secret.
3. Copy `frontend/.env.example` to `frontend/.env` and provide your Paystack public test key.
4. In `backend/`, run `npm install`, then `npm run dev`.
5. In `frontend/`, run `npm install`, then `npm run dev`.

The frontend expects the backend at `http://localhost:5000/api` by default.

## Payments

Paystack transactions are initialized on the backend using `PAYSTACK_SECRET_KEY`, then resumed in the browser with the returned access code via Paystack Inline v2. Never expose the Paystack secret key to the frontend.

## Receipt emails

After a payment is verified, the backend emails a branded receipt to the guest with the apartment, stay dates, price breakdown, and transaction reference.

Add these to `backend/.env` to enable delivery:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=bulusakwashikitimothy@gmail.com
SMTP_PASS=your_google_app_password
EMAIL_FROM=bulusakwashikitimothy@gmail.com
```

For Gmail, enable 2-Step Verification and create an App Password. If `SMTP_PASS` is empty, the receipt is still generated and shown in the app, but no email is sent.

## Security

Never commit real `.env` files or secret keys. The repository `.gitignore` excludes both backend and frontend environment files.
