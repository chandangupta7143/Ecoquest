const router       = require('express').Router();
const auth         = require('../middleware/auth');
const multer       = require('multer');
const path         = require('path');
const Submission   = require('../models/Submission');
const User         = require('../models/User');
const Task         = require('../models/Task');
const Notification = require('../models/Notification');
const { updateProgress } = require('../utils/userProgress');

const IMAGE_MAX  = 10 * 1024 * 1024; // 10 MB
const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp)$/i;
const VIDEO_EXTS = /\.(mp4|mov|avi|mkv|webm|3gp)$/i;

// Store file in memory → convert to base64 → save in MongoDB
// No disk, no external service, works on Render permanently
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: IMAGE_MAX },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (IMAGE_EXTS.test(ext) || VIDEO_EXTS.test(ext)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// GET submissions
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') filter.student = req.user.id;
    else if (req.query.status) filter.status = req.query.status;

    const subs = await Submission.find(filter)
      .populate('student', 'name class')
      .populate('task', 'title category xpReward')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create submission (student)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { taskId, description } = req.body;

    // Convert buffer → base64 data URL → stored directly in MongoDB
    // Works forever, no external service needed
    let imageUrl = '';
    if (req.file) {
      const b64  = req.file.buffer.toString('base64');
      imageUrl   = `data:${req.file.mimetype};base64,${b64}`;
    }

    const sub = await Submission.create({
      student: req.user.id,
      task:    taskId,
      description,
      imageUrl,
      status:  'pending',
    });

    // Notify teacher
    const task = await Task.findById(taskId);
    if (task?.createdBy) {
      const student = await User.findById(req.user.id).select('name');
      await Notification.create({
        recipient: task.createdBy,
        sender:    req.user.id,
        type:      'submission_received',
        message:   `${student?.name || 'A student'} submitted "${task.title}"`,
        taskTitle: task.title,
      });
    }

    res.status(201).json(sub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT teacher review
router.put('/:id/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher')
      return res.status(403).json({ message: 'Forbidden' });

    const { teacherScore, status } = req.body;
    const sub = await Submission.findById(req.params.id).populate('task');
    if (!sub) return res.status(404).json({ message: 'Submission not found' });

    sub.teacherScore = teacherScore;
    sub.status       = status;
    sub.reviewedBy   = req.user.id;

    if (status === 'approved') {
      const xp = Math.round((teacherScore / 10) * sub.task.xpReward);
      sub.xpAwarded = xp;
      await User.findByIdAndUpdate(sub.student, { $inc: { xp } });
      await updateProgress(sub.student);
    }

    await sub.save();

    const teacher   = await User.findById(req.user.id).select('name');
    const notifType = status === 'approved' ? 'submission_approved' : 'submission_rejected';
    const xpMsg     = status === 'approved' ? ` (+${sub.xpAwarded} XP)` : '';
    await Notification.create({
      recipient: sub.student,
      sender:    req.user.id,
      type:      notifType,
      message:   `Your "${sub.task?.title}" submission was ${status} by ${teacher?.name || 'your teacher'}${xpMsg}`,
      taskTitle: sub.task?.title || '',
    });

    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
