const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Notes storage (PDFs, images, docs) ── */
const noteStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:        'ecoquest/notes',
    resource_type: 'auto',   // handles pdf, image, etc.
    public_id:     `note-${Date.now()}`,
  }),
});

/* ── Submissions storage (images + videos) ── */
const submissionStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder:        'ecoquest/submissions',
      resource_type: isVideo ? 'video' : 'image',
      public_id:     `sub-${Date.now()}`,
    };
  },
});

module.exports = { cloudinary, noteStorage, submissionStorage };
