# HavenStay

HavenStay is a React + Vite frontend with an Express/PostgreSQL backend. The frontend is organized by feature so UI components, pages, hooks, and API calls have separate responsibilities.

## Features

- Curated shortlet apartment discovery with city search
- Guest signup and signin with JWT authentication
- Book without an account by providing an email address
- Booking creation, payment, cancellation, and reservation history
- Paystack payments initialized securely on the backend
- Branded in-app receipt with print / save-to-PDF support
- Email transaction slip delivery after successful payment
- Automated payment reminders for unpaid bookings
- Subscribe / unsubscribe links in every notification email
- Refund policy available before payment (reading is optional)

## Project structure

```text
backend/
  config/          Database connection
  middleware/      Authentication middleware
  routes/          API route definitions
  migrations/      Incremental database migrations
  services/        Receipt, reminder, and subscription services
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
2. If you already have a HavenStay database, apply the incremental migrations instead:
   `psql "$DATABASE_URL" -f backend/migrations/001_guest_bookings_subscriptions.sql`.
3. Copy `backend/.env.example` to `backend/.env` and provide your database password, JWT secret, Paystack test secret, and `APP_URL`.
4. Copy `frontend/.env.example` to `frontend/.env` and provide your Paystack public test key.
5. In `backend/`, run `npm install`, then `npm run dev`.
6. In `frontend/`, run `npm install`, then `npm run dev`.

The frontend expects the backend at `http://localhost:5000/api` by default. `APP_URL` is used to build links in emails (booking/payment pages, refund policy, subscription preferences) and should point to the running frontend, e.g. `http://localhost:5173`.

### Authentication troubleshooting

If sign in or sign up shows a network or "authentication failed" message, confirm the backend is running on port 5000 and that `frontend/.env` points `VITE_API_BASE_URL` at it. The frontend now distinguishes unreachable-server errors from invalid credentials. Make sure the database schema/migrations have been applied.

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
