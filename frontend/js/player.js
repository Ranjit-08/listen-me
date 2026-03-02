// AURA Music Player — background play with Media Session API

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audioEl');
  if (!audio) return;

  audio.volume = 0.8;

  audio.addEventListener('timeupdate', () => {
    const cur = audio.currentTime, dur = audio.duration || 0;
    document.getElementById('currentTime').textContent = fmt(cur);
    const bar = document.getElementById('progressBar');
    if (bar && !bar.matches(':active')) bar.value = cur;
  });

  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('totalTime').textContent = fmt(audio.duration);
    document.getElementById('progressBar').max = audio.duration;
  });

  audio.addEventListener('play',  () => { document.getElementById('playPauseBtn').textContent = '⏸'; });
  audio.addEventListener('pause', () => { document.getElementById('playPauseBtn').textContent = '▶'; });
  audio.addEventListener('ended', nextSong);
});

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

function playSong(song) {
  const audio = document.getElementById('audioEl');
  if (!audio) return;

  audio.src = song.audio_url;
  audio.load();
  audio.play().catch(e => console.warn('Autoplay blocked:', e));

  // Update player bar UI
  document.getElementById('playerBar').classList.add('visible');
  document.getElementById('playerTitle').textContent  = song.title;
  document.getElementById('playerArtist').textContent = song.artist_name;

  const thumb = document.getElementById('playerThumb');
  if (song.thumbnail_url) { thumb.src = song.thumbnail_url; thumb.style.display = 'block'; }

  // Update document title
  document.title = `${song.title} – AURA`;

  // Highlight active card
  document.querySelectorAll('.song-card').forEach(c => c.classList.remove('playing'));
  const active = document.getElementById(`song-${song.id}`);
  if (active) active.classList.add('playing');

  // OS media controls (lock screen / notification bar)
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  song.title,
      artist: song.artist_name,
      artwork: song.thumbnail_url ? [{ src: song.thumbnail_url, sizes:'512x512', type:'image/jpeg' }] : []
    });
    navigator.mediaSession.setActionHandler('play',          () => audio.play());
    navigator.mediaSession.setActionHandler('pause',         () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', prevSong);
    navigator.mediaSession.setActionHandler('nexttrack',     nextSong);
  }
}

function togglePlay() {
  const audio = document.getElementById('audioEl');
  if (!audio || !audio.src) return;
  audio.paused ? audio.play() : audio.pause();
}

function seekTo(val) {
  const audio = document.getElementById('audioEl');
  if (audio) audio.currentTime = parseFloat(val);
}

function setVolume(val) {
  const audio = document.getElementById('audioEl');
  if (audio) audio.volume = val / 100;
}

function prevSong() {
  const audio = document.getElementById('audioEl');
  if (audio) { audio.currentTime = 0; audio.play(); }
}

function nextSong() {
  const audio = document.getElementById('audioEl');
  if (audio) { audio.pause(); audio.currentTime = 0; document.getElementById('playPauseBtn').textContent = '▶'; }
}