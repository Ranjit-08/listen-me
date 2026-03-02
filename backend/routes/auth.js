const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db      = require('../config/db');
const { sendOTP, generateOTP } = require('../config/email');

const OTP_TTL = () => Date.now() + parseInt(process.env.OTP_EXPIRES_MINUTES || 10) * 60 * 1000;

// Simple in-memory OTP store (works great for single-instance EC2)
const store = new Map();
const setOTP  = (key, data) => store.set(key, { ...data, exp: OTP_TTL() });
const getOTP  = (key) => {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { store.delete(key); return null; }
  return e;
};

// ── POST /api/auth/send-otp ──────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.json({ success:false, message:'Name and email required' });

  const { rows } = await db.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
  if (rows.length) return res.json({ success:false, message:'Email already registered' });

  const otp = generateOTP();
  setOTP(`reg:${email}`, { otp, name });
  try {
    await sendOTP(email, otp, 'verify');
    res.json({ success:true });
  } catch(e) {
    console.error('Email error:', e.message);
    res.json({ success:false, message:'Failed to send email. Check SMTP settings.' });
  }
});

// ── POST /api/auth/register ──────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, otp } = req.body;
  if (!name||!email||!password||!otp) return res.json({ success:false, message:'All fields required' });
  if (password.length < 8)            return res.json({ success:false, message:'Password must be at least 8 characters' });

  const saved = getOTP(`reg:${email}`);
  if (!saved || saved.otp !== otp) return res.json({ success:false, message:'Invalid or expired code' });
  store.delete(`reg:${email}`);

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await db.query(
    'INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email,role',
    [name.trim(), email.toLowerCase(), hash]
  );
  const user  = rows[0];
  const token = jwt.sign({ id:user.id, email:user.email, role:user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  res.json({ success:true, token, user:{ id:user.id, name:user.name, email:user.email, role:user.role } });
});

// ── POST /api/auth/login ─────────────────────────────────────────
// No OTP on login — just email + password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email||!password) return res.json({ success:false, message:'Email and password required' });

  const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
  if (!rows.length) return res.json({ success:false, message:'Invalid email or password' });

  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid)    return res.json({ success:false, message:'Invalid email or password' });

  const user  = rows[0];
  const token = jwt.sign({ id:user.id, email:user.email, role:user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  res.json({ success:true, token, user:{ id:user.id, name:user.name, email:user.email, role:user.role } });
});

// ── POST /api/auth/forgot-password ──────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success:false, message:'Email required' });

  const { rows } = await db.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
  if (!rows.length) return res.json({ success:false, message:'No account with that email' });

  const otp = generateOTP();
  setOTP(`reset:${email}`, { otp });
  try {
    await sendOTP(email, otp, 'reset');
    res.json({ success:true });
  } catch(e) {
    res.json({ success:false, message:'Failed to send email' });
  }
});

// ── POST /api/auth/verify-reset-otp ─────────────────────────────
router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp } = req.body;
  const saved = getOTP(`reset:${email}`);
  if (!saved || saved.otp !== otp) return res.json({ success:false, message:'Invalid or expired code' });

  const resetToken = uuidv4();
  setOTP(`rtok:${resetToken}`, { email });
  store.delete(`reset:${email}`);
  res.json({ success:true, resetToken });
});

// ── POST /api/auth/reset-password ────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken||!newPassword) return res.json({ success:false, message:'Token and password required' });
  if (newPassword.length < 8)    return res.json({ success:false, message:'Password must be at least 8 characters' });

  const saved = getOTP(`rtok:${resetToken}`);
  if (!saved) return res.json({ success:false, message:'Reset token expired or invalid' });

  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE email=$2', [hash, saved.email]);
  store.delete(`rtok:${resetToken}`);
  res.json({ success:true, message:'Password reset successfully' });
});

module.exports = router;