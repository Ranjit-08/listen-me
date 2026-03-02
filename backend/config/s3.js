const AWS    = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  region:          process.env.AWS_REGION,
  accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET = process.env.S3_BUCKET_NAME;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (file.fieldname === 'audio'        && /mp3|wav|flac|ogg|m4a|aac/.test(ext))  return cb(null, true);
  if (['thumbnail','artist_photo'].includes(file.fieldname) && /jpe?g|png|webp/.test(ext)) return cb(null, true);
  cb(new Error(`File type not allowed for field: ${file.fieldname}`), false);
};

const upload = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const folder = file.fieldname === 'audio' ? 'audio' : file.fieldname === 'thumbnail' ? 'thumbnails' : 'artist-photos';
      cb(null, `${folder}/${uuidv4()}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }   // 50 MB max for all files
});

const deleteFromS3 = async (key) => {
  if (!key) return;
  try { await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise(); }
  catch (e) { console.error('S3 delete error:', e.message); }
};

const keyFromUrl = (url) => {
  if (!url) return null;
  try { return new URL(url).pathname.slice(1); } catch { return null; }
};

module.exports = { upload, deleteFromS3, keyFromUrl };