require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app = express();

// ── Security ─────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    /^http:\/\/\d+\.\d+\.\d+\.\d+/   // allow any EC2 IP
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ────────────────────────────────────────────────
app.use('/api/',      rateLimit({ windowMs:15*60*1000, max:200, standardHeaders:true }));
app.use('/api/auth/', rateLimit({ windowMs:15*60*1000, max:20,  message:{ success:false, message:'Too many requests, try again later.' } }));

// ── Serve Frontend ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ───────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/songs',   require('./routes/songs'));
app.use('/api/artists', require('./routes/artists'));

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status:'OK', app:'AURA Music', time:new Date().toISOString() }));

// ── SPA Fallback ─────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api'))
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ success:false, message: err.message || 'Server error' });
});

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🎵 AURA running on port ${PORT}`));