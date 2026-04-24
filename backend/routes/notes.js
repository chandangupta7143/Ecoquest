const router = require('express').Router();
const auth   = require('../middleware/auth');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const Note   = require('../models/Note');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function sanitizeFilename(prefix, originalName) {
  const ext  = path.extname(originalName) || '';
  const base = path.basename(originalName, ext)
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '')
    .slice(0, 80) || 'file';
  return `${prefix}-${Date.now()}-${base}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => cb(null, sanitizeFilename('note', file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|ppt|pptx|txt|xls|xlsx)$/i;
    if (!allowed.test(path.extname(file.originalname)))
      return cb(new Error('Only documents and images are allowed'));
    cb(null, true);
  },
});

// GET notes
router.get('/', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.class)   filter.class   = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.chapter) filter.chapter = req.query.chapter;
    const notes = await Note.find(filter).populate('uploadedBy', 'name').sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST upload note (teacher only)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'teacher')
      return res.status(403).json({ message: 'Forbidden' });
    const { title, subject, chapter, class: cls, type, externalUrl } = req.body;
    const fileUrl          = req.file ? `/uploads/${req.file.filename}` : '';
    const fileOriginalName = req.file ? req.file.originalname : '';
    const note = await Note.create({
      title, subject, chapter: chapter || '', class: cls,
      type: type || (req.file ? 'pdf' : 'url'),
      fileUrl, fileOriginalName, externalUrl: externalUrl || '',
      uploadedBy: req.user.id,
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE note (teacher only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher')
      return res.status(403).json({ message: 'Forbidden' });
    await Note.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Note removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
