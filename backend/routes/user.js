const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Use if you want to protect this route
const router = express.Router();

// Get all users (admin only)
router.get('/', auth('admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password from response
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch users' });
  }
});

module.exports = router;
