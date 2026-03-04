/**
 * photos.js — ListenMe Photo Configuration
 *
 * HOW TO ADD YOUR PHOTOS:
 * 1. Drop your images into these folders on the server:
 *    /root/music-app/frontend/photos/artists/     ← artist photos
 *    /root/music-app/frontend/photos/thumbnails/  ← album/song covers
 *    /root/music-app/frontend/photos/banners/     ← wide banner images
 *
 * 2. Add the filenames to the arrays below (just filename, not full path)
 *
 * 3. Refresh the page — photos will float in the background automatically
 *
 * Supported formats: .jpg  .jpeg  .png  .webp
 */

const PHOTO_CONFIG = {

  // Artist profile photos (square or portrait work best)
  artists: [
    // 'weeknd.jpg',
    // 'billie.jpg',
    // 'drake.png',
    // 'ariana.webp',
  ],

  // Song / album thumbnails (square images work best)
  thumbnails: [
    // 'blinding-lights.jpg',
    // 'happier.jpg',
    // 'positions.jpg',
    // 'levitating.jpg',
  ],

  // Wide banner images (optional, used as large background cards)
  banners: [
    // 'banner1.jpg',
    // 'banner2.jpg',
  ],

};

// Fallback gradient palettes used when no photos are provided
const GRADIENT_PALETTES = [
  ['#7c3aed', '#4c1d95'],
  ['#e879f9', '#7c3aed'],
  ['#f0a500', '#7c3aed'],
  ['#3b82f6', '#1d4ed8'],
  ['#10b981', '#065f46'],
  ['#f43f5e', '#9f1239'],
  ['#8b5cf6', '#ec4899'],
  ['#06b6d4', '#0891b2'],
];