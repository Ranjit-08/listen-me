const router = require('express').Router();
const db     = require('../config/db');
const { deleteFromS3, keyFromUrl } = require('../config/s3');
const { authenticate, adminOnly }  = require('../middleware/auth');

// ── GET /api/artists ─────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { rows } = await db.query(`
    SELECT a.id, a.name, a.photo_url, a.bio, a.created_at,
           COUNT(s.id)::int AS song_count
    FROM artists a LEFT JOIN songs s ON s.artist_id=a.id
    GROUP BY a.id ORDER BY a.name ASC
  `);
  res.json({ success:true, data:rows });
});

// ── GET /api/artists/:id ─────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  const [a, s] = await Promise.all([
    db.query('SELECT * FROM artists WHERE id=$1', [req.params.id]),
    db.query('SELECT * FROM songs WHERE artist_id=$1 ORDER BY created_at DESC', [req.params.id])
  ]);
  if (!a.rows.length) return res.status(404).json({ success:false, message:'Artist not found' });
  res.json({ success:true, data:{ ...a.rows[0], songs:s.rows } });
});

// ── DELETE /api/artists/:id (admin only) ─────────────────────────
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  const { rows: artist } = await db.query('SELECT * FROM artists WHERE id=$1', [req.params.id]);
  if (!artist.length) return res.status(404).json({ success:false, message:'Artist not found' });

  const { rows: songs } = await db.query('SELECT * FROM songs WHERE artist_id=$1', [req.params.id]);
  for (const s of songs) {
    await deleteFromS3(keyFromUrl(s.audio_url));
    await deleteFromS3(keyFromUrl(s.thumbnail_url));
  }
  await deleteFromS3(keyFromUrl(artist[0].photo_url));
  await db.query('DELETE FROM artists WHERE id=$1', [req.params.id]);
  res.json({ success:true, message:'Artist deleted' });
});

module.exports = router;