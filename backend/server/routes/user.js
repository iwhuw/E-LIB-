// routes/users.js
const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Register a new user
router.post('/', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      name: name || email.split('@')[0] // Use part before @ as default name
    });
    
    await user.save();
    
    // Generate token
    const token = await user.generateAuthToken();
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by credentials
    const user = await User.findByCredentials(email, password);
    
    // Generate token
    const token = await user.generateAuthToken();
    
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid login credentials' });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    // Remove the token used for authentication
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// Logout from all devices
router.post('/logoutAll', auth, async (req, res) => {
  try {
    // Remove all tokens
    req.user.tokens = [];
    await req.user.save();
    
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// Get user profile
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update user profile
router.patch('/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  
  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }
  
  try {
    updates.forEach(update => {
      req.user[update] = req.body[update];
    });
    
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Server error updating profile' });
  }
});

// Update user preferences
router.patch('/preferences', auth, async (req, res) => {
  try {
    const preferences = await req.user.updatePreferences(req.body);
    res.json(preferences);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Server error updating preferences' });
  }
});

// Get reading history
router.get('/reading-history', auth, async (req, res) => {
  try {
    res.json(req.user.readingHistory);
  } catch (error) {
    console.error('Reading history error:', error);
    res.status(500).json({ error: 'Server error fetching reading history' });
  }
});

// Update reading progress
router.post('/reading-progress', auth, async (req, res) => {
  try {
    const { bookId, title, authors, cover, progress } = req.body;
    
    if (!bookId || progress === undefined) {
      return res.status(400).json({ error: 'BookId and progress are required' });
    }
    
    // Ensure progress is between 0 and 100
    const validProgress = Math.max(0, Math.min(100, progress));
    
    const readingHistory = await req.user.updateReadingProgress({
      bookId,
      title,
      authors,
      cover,
      progress: validProgress
    });
    
    res.json(readingHistory);
  } catch (error) {
    console.error('Update reading progress error:', error);
    res.status(500).json({ error: 'Server error updating reading progress' });
  }
});

// Get bookmarks
router.get('/bookmarks', auth, async (req, res) => {
  try {
    res.json(req.user.bookmarks);
  } catch (error) {
    console.error('Bookmarks error:', error);
    res.status(500).json({ error: 'Server error fetching bookmarks' });
  }
});

// Add bookmark
router.post('/bookmarks', auth, async (req, res) => {
  try {
    const { bookId, title, authors, cover } = req.body;
    
    if (!bookId) {
      return res.status(400).json({ error: 'BookId is required' });
    }
    
    const bookmarks = await req.user.addBookmark({
      bookId,
      title,
      authors,
      cover
    });
    
    res.json(bookmarks);
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ error: 'Server error adding bookmark' });
  }
});

// Remove bookmark
router.delete('/bookmarks/:bookId', auth, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    
    if (!bookId) {
      return res.status(400).json({ error: 'BookId is required' });
    }
    
    const bookmarks = await req.user.removeBookmark(bookId);
    res.json(bookmarks);
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ error: 'Server error removing bookmark' });
  }
});

// Delete user account
router.delete('/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error deleting account' });
  }
});

module.exports = router;