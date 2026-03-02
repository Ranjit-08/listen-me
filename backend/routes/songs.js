const router = require('express').Router();
const db     = require('../config/db');
const { upload, deleteFromS3, keyFromUrl } = require('../config/s3');
const { authenticate, adminOnly } = require('../middleware/auth');

// ── GET /api/songs ───────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { artist_id, search } = req.query;
  let q = `SELECT s.id,s.title,s.genre,s.audio_url,s.thumbnail_url,s.created_at,
                  a.id AS artist_id, a.name AS artist_name, a.photo_url
           FROM songs s JOIN artists a ON s.artist_id=a.id`;
  const params = [], cond = [];

  if (artist_id) { params.push(artist_id); cond.push(`s.artist_id=$${params.length}`); }
  if (search)    { params.push(`%${search}%`); cond.push(`(s.title ILIKE $${params.length} OR a.name ILIKE $${params.length})`); }
  if (cond.length) q += ' WHERE ' + cond.join(' AND ');
  q += ' ORDER BY s.created_at DESC';

  const { rows } = await db.query(q, params);
  res.json({ success:true, data:rows });
});

// ── GET /api/songs/:id ───────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  const { rows } = await db.query(
    'SELECT s.*,a.name AS artist_name,a.photo_url FROM songs s JOIN artists a ON s.artist_id=a.id WHERE s.id=$1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ success:false, message:'Song not found' });
  res.json({ success:true, data:rows[0] });
});

// ── POST /api/songs/upload (admin only) ──────────────────────────
router.post('/upload', authenticate, adminOnly,
  upload.fields([
    { name:'audio',        maxCount:1 },
    { name:'thumbnail',    maxCount:1 },
    { name:'artist_photo', maxCount:1 }
  ]),
  async (req, res) => {
    const { title, artist_id, new_artist_name, genre } = req.body;
    if (!title || !req.files?.audio || !req.files?.thumbnail)
      return res.json({ success:false, message:'Title, audio and thumbnail are required' });

    const audioUrl       = req.files.audio[0].location;
    const thumbnailUrl   = req.files.thumbnail[0].location;
    const artistPhotoUrl = req.files?.artist_photo?.[0]?.location || null;

    let finalArtistId = artist_id;

    if (new_artist_name?.trim()) {
      const { rows: existing } = await db.query('SELECT id FROM artists WHERE LOWER(name)=LOWER($1)', [new_artist_name.trim()]);
      if (existing.length) {
        finalArtistId = existing[0].id;
        if (artistPhotoUrl) await db.query('UPDATE artists SET photo_url=$1 WHERE id=$2', [artistPhotoUrl, finalArtistId]);
      } else {
        const { rows: newA } = await db.query('INSERT INTO artists(name,photo_url) VALUES($1,$2) RETURNING id', [new_artist_name.trim(), artistPhotoUrl]);
        finalArtistId = newA[0].id;
      }
    }

    if (!finalArtistId) return res.json({ success:false, message:'Artist is required' });

    await db.query(
      'INSERT INTO songs(title,artist_id,genre,audio_url,thumbnail_url,uploaded_by) VALUES($1,$2,$3,$4,$5,$6)',
      [title.trim(), finalArtistId, genre||null, audioUrl, thumbnailUrl, req.user.id]
    );
    res.json({ success:true, message:'Song uploaded successfully' });
  }
);

// ── DELETE /api/songs/:id (admin only) ───────────────────────────
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM songs WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success:false, message:'Song not found' });

  await Promise.all([
    deleteFromS3(keyFromUrl(rows[0].audio_url)),
    deleteFromS3(keyFromUrl(rows[0].thumbnail_url))
  ]);
  await db.query('DELETE FROM songs WHERE id=$1', [req.params.id]);
  res.json({ success:true, message:'Song deleted' });
});

module.exports = router;