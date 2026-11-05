-- Guest bookings, guest access tokens, unpaid reminders, and email subscriptions.
-- Safe to run repeatedly against an existing HavenStay database.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

UPDATE bookings
SET access_token = uuid_generate_v4()
WHERE access_token IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_access_token_key'
  ) THEN
    NULL;
  ELSE
    ALTER TABLE bookings ADD CONSTRAINT bookings_access_token_key UNIQUE (access_token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS bookings_guest_email_idx ON bookings (guest_email);
CREATE INDEX IF NOT EXISTS bookings_status_created_idx ON bookings (status, created_at);

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(120),
  is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  token UUID NOT NULL DEFAULT uuid_generate_v4(),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS email_subscribers_token_idx ON email_subscribers (token);
