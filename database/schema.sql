-- AURA Music — PostgreSQL Schema
-- Run once: node database/migrate.js

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS artists (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  bio        TEXT,
  photo_url  TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(LOWER(name));

CREATE TABLE IF NOT EXISTS songs (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  artist_id     INTEGER      NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  genre         VARCHAR(100),
  audio_url     TEXT         NOT NULL,
  thumbnail_url TEXT         NOT NULL,
  duration_sec  INTEGER,
  play_count    INTEGER      NOT NULL DEFAULT 0,
  uploaded_by   INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_songs_artist  ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_created ON songs(created_at DESC);

-- Default admin user
-- Email: admin@aura.com   Password: Admin@123456
-- CHANGE THIS PASSWORD IMMEDIATELY after first login!
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'AURA Admin',
  'admin@aura.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS3w2.W',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_upd  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE OR REPLACE TRIGGER trg_songs_upd  BEFORE UPDATE ON songs  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();