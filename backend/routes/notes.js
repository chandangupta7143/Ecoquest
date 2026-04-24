const router  = require('express').Router();
const auth    = require('../middleware/auth');
const multer  = require('multer');
const Note    = require('../models/Note');
const { noteStorage } = require('../utils/cloudinary');

const upload = multer({
  storage: noteStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|ppt|pptx|txt|xls|xlsx)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error('Only documents and images are allowed'));
    }
    cb(null, true);
  },
});

// GET notes (filter by class / subject / chapter)
router.get('/', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.class)   filter.class   = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.chapter) filter.chapter = req.query.chapter;
    const notes = await Note.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
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

    // Cloudinary returns req.file.path = full https://res.cloudinary.com/... URL
    const fileUrl          = req.file ? req.file.path : '';
    const fileOriginalName = req.file ? req.file.originalname : '';

    const note = await Note.create({
      title,
      subject,
      chapter:       chapter || '',
      class:         cls,
      type:          type || (req.file ? 'pdf' : 'url'),
      fileUrl,
      fileOriginalName,
      externalUrl:   externalUrl || '',
      uploadedBy:    req.user.id,
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
