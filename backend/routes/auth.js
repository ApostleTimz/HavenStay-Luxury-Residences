const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendVerificationCode } = require('../services/emailService');
const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFICATION_CODE_TTL_MINUTES = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES || 15);
const VERIFICATION_RESEND_COOLDOWN_SECONDS = Number(process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS || 60);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const generateVerificationCode = () => String(crypto.randomInt(100000, 1000000));

const issueVerificationCode = async (userId, email, fullName) => {
  const code = generateVerificationCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);

  await db.query(
    `UPDATE users
     SET verification_code_hash = $1,
         verification_code_expires_at = $2,
         verification_code_sent_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [codeHash, expiresAt, userId]
  );

  const sendResult = await sendVerificationCode({
    email,
    fullName,
    code,
    expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES
  });

  return { code, sendResult };
};

const buildVerificationPayload = (email, sendResult) => ({
  verificationRequired: true,
  email,
  message: sendResult.sent
    ? `We sent a ${VERIFICATION_CODE_TTL_MINUTES}-minute verification code to ${email}. Enter it below to activate your account.`
    : 'Your account was created, but we could not send the verification email. Please request a new code.'
});

const signToken = (user) => jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const publicUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role
});

router.post('/signup', async (req, res) => {
  const full_name = String(req.body.full_name || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const phone = String(req.body.phone || '').trim();
  const requestedRole = String(req.body.role || 'guest');
  const role = ['guest', 'host'].includes(requestedRole) ? requestedRole : 'guest';

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Please provide full name, email, and password' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const existing = await db.query(
      'SELECT id, full_name, email, role, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];

      if (existingUser.email_verified) {
        return res.status(400).json({ message: 'An account with this email already exists. Try signing in instead.' });
      }

      const { sendResult } = await issueVerificationCode(existingUser.id, email, existingUser.full_name);
      return res.status(200).json(buildVerificationPayload(email, sendResult));
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const newUser = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING id, full_name, email, role`,
      [full_name, email, password_hash, phone || null, role]
    );

    const { sendResult } = await issueVerificationCode(newUser.rows[0].id, email, full_name);
    res.status(201).json(buildVerificationPayload(email, sendResult));
  } catch (error) {
    console.error('[auth] Signup failed:', error.message);
    res.status(500).json({ message: 'Server error during registration. Please try again later.' });
  }
});

router.post('/verify-email', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || '').trim();

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'No account found for this email address' });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ message: 'This email is already verified. Please sign in.' });
    }
    if (!user.verification_code_hash || !user.verification_code_expires_at) {
      return res.status(400).json({ message: 'No active verification code. Please request a new code.' });
    }
    if (new Date(user.verification_code_expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: 'This verification code has expired. Please request a new code.' });
    }

    const isMatch = await bcrypt.compare(code, user.verification_code_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'The verification code is incorrect. Please try again.' });
    }

    const verified = await db.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_code_hash = NULL,
           verification_code_expires_at = NULL,
           verification_code_sent_at = NULL
       WHERE id = $1
       RETURNING id, full_name, email, role`,
      [user.id]
    );

    const verifiedUser = verified.rows[0];
    const token = signToken(verifiedUser);
    res.json({ token, user: publicUser(verifiedUser) });
  } catch (error) {
    console.error('[auth] Email verification failed:', error.message);
    res.status(500).json({ message: 'Server error during verification. Please try again later.' });
  }
});

router.post('/resend-verification', async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No account found for this email address' });
    }

    const user = result.rows[0];
    if (user.email_verified) {
      return res.status(400).json({ message: 'This email is already verified. Please sign in.' });
    }

    if (user.verification_code_sent_at) {
      const elapsedSeconds = (Date.now() - new Date(user.verification_code_sent_at).getTime()) / 1000;
      if (elapsedSeconds < VERIFICATION_RESEND_COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(VERIFICATION_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
        return res.status(429).json({
          message: `Please wait ${retryAfter} seconds before requesting another code.`,
          retryAfter
        });
      }
    }

    const { sendResult } = await issueVerificationCode(user.id, email, user.full_name);
    res.json(buildVerificationPayload(email, sendResult));
  } catch (error) {
    console.error('[auth] Resend verification failed:', error.message);
    res.status(500).json({ message: 'Server error while resending the code. Please try again later.' });
  }
});

router.post('/signin', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    if (!user.email_verified) {
      const secondsSinceLastCode = user.verification_code_sent_at
        ? (Date.now() - new Date(user.verification_code_sent_at).getTime()) / 1000
        : Infinity;

      if (secondsSinceLastCode < VERIFICATION_RESEND_COOLDOWN_SECONDS) {
        return res.status(403).json({
          message: `Please check your email. Enter the ${VERIFICATION_CODE_TTL_MINUTES}-minute verification code we already sent, or request a new one.`,
          requiresVerification: true,
          email: user.email
        });
      }

      const { sendResult } = await issueVerificationCode(user.id, user.email, user.full_name);
      return res.status(403).json({
        message: sendResult.sent
          ? `We sent a ${VERIFICATION_CODE_TTL_MINUTES}-minute verification code to ${user.email}. Enter it below to activate your account.`
          : 'Please verify your email address before signing in, but we could not send the verification email. Please request a new code.',
        requiresVerification: true,
        email: user.email
      });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error('[auth] Signin failed:', error.message);
    res.status(500).json({ message: 'Server error during sign in. Please try again later.' });
  }
});

module.exports = router;
