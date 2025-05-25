const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/save', async (req, res) => {
  const { userId, photoData } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { $push: { photos: photoData } });
    res.json({ message: 'Photo saved' });
  } catch (e) {
    res.status(400).json({ error: 'Error saving photo' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json({ photos: user.photos || [] });
  } catch (e) {
    res.status(404).json({ error: 'User not found' });
  }
});


const { verifyToken } = require('../middlewares/auth');

// Undo last saved photo (pop last photo)
router.delete('/undo/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.photos || user.photos.length === 0) {
      return res.status(400).json({ error: 'No photos to undo' });
    }
    const removed = user.photos.pop();
    await user.save();
    res.json({ message: 'Last action undone', removed });
  } catch (e) {
    res.status(500).json({ error: 'Error undoing action' });
  }
});

module.exports = router;