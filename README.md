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

## No-account bookings

Guests can book and pay without creating an account. The booking form requires a full name and email address. The backend stores the guest email on the booking and creates a secure guest access token so the customer can reopen the booking later from an email link (`/guest-booking/<token>`). Account holders continue to see their bookings under **My Bookings**.

## Transactional emails (Brevo)

All HavenStay notifications — transaction slips, unpaid-booking reminders, booking codes, and subscription updates — are delivered through the **Brevo transactional email API**. The backend does not use SMTP.

Add these to `backend/.env`:

```text
APP_URL=http://localhost:5173
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_NAME=HavenStay
# Must be a verified sender or domain in your Brevo account
BREVO_SENDER_EMAIL=bulusakwashikitimothy@gmail.com
```

Your Brevo sender email/domain must be verified in the Brevo dashboard, otherwise the API returns a sender-validation error. If `BREVO_API_KEY` is missing, the receipt is still generated and shown in the app, but no email is sent (the response includes the Brevo/configuration reason).

## Unpaid booking reminders

A background service checks for pending bookings older than `BOOKING_REMINDER_DELAY_MINUTES` (default `60`) and emails the customer a reminder with a link to complete payment. Reminders run every `REMINDER_INTERVAL_MINUTES` (default `15`) and are only sent once per booking. The reminder is skipped for bookings that were already paid or cancelled.

## Subscribe / unsubscribe

Every HavenStay notification email includes **Subscribe** and **Unsubscribe** buttons and a `List-Unsubscribe` header. Subscription preferences are managed on the frontend at `/subscribe?token=...` and `/unsubscribe?token=...`, and the footer also has a newsletter subscribe form.

## Refund policy

A **Read Refund Policies** button is available in the booking and payment modals and links to `/refund-policy`. Reading the policy is optional; customers can proceed with payment without opening it.

## Security

Never commit real `.env` files or secret keys. The repository `.gitignore` excludes both backend and frontend environment files.
