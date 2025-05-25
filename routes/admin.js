const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Get all users (without passwords)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json({ users });
});

// Delete a user
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

// Delete a specific photo by index
router.delete('/photos/:userId/:index', verifyToken, isAdmin, async (req, res) => {
  const { userId, index } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.photos || user.photos.length <= index) {
    return res.status(400).json({ error: 'Invalid photo index' });
  }
  const removed = user.photos.splice(index, 1);
  await user.save();
  res.json({ message: 'Photo deleted', removed });
});

module.exports = router;
