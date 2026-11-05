-- Email verification for new signups.
-- Existing accounts are marked verified so they keep access; new accounts must verify.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS verification_code_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verification_code_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS users_verification_code_expires_idx
  ON users (verification_code_expires_at);
