// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  preferences: {
    genres: [String],
    theme: {
      type: String,
      enum: ['dark', 'light', 'sepia'],
      default: 'dark'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    progressTracking: {
      type: Boolean,
      default: true
    }
  },
  bookmarks: [{
    bookId: String,
    title: String,
    authors: [String],
    cover: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  readingHistory: [{
    bookId: String,
    title: String,
    authors: [String],
    cover: String,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastRead: {
      type: Date,
      default: Date.now
    }
  }],
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash password if it's modified
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate auth token
UserSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() }, 
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '7d' }
  );
  
  // Add token to tokens array
  user.tokens = user.tokens.concat({ token });
  await user.save();
  
  return token;
};

// Find user by credentials
UserSchema.statics.findByCredentials = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }
  
  return user;
};

// Remove sensitive data when returning user
UserSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();
  
  // Remove password and tokens
  delete userObject.password;
  delete userObject.tokens;
  
  return userObject;
};

// Add book to reading history
UserSchema.methods.updateReadingProgress = async function(bookData) {
  const user = this;
  const { bookId, title, authors, cover, progress } = bookData;
  
  // Find if book already exists in history
  const bookIndex = user.readingHistory.findIndex(book => book.bookId === bookId);
  
  if (bookIndex >= 0) {
    // Update existing entry
    user.readingHistory[bookIndex].progress = progress;
    user.readingHistory[bookIndex].lastRead = new Date();
  } else {
    // Add new entry
    user.readingHistory.push({
      bookId,
      title,
      authors: authors || [],
      cover: cover || '',
      progress,
      lastRead: new Date()
    });
  }
  
  await user.save();
  return user.readingHistory;
};

// Add bookmark
UserSchema.methods.addBookmark = async function(bookData) {
  const user = this;
  const { bookId, title, authors, cover } = bookData;
  
  // Check if bookmark already exists
  const bookmarkExists = user.bookmarks.some(bookmark => bookmark.bookId === bookId);
  
  if (!bookmarkExists) {
    user.bookmarks.push({
      bookId,
      title,
      authors: authors || [],
      cover: cover || '',
      addedAt: new Date()
    });
    await user.save();
  }
  
  return user.bookmarks;
};

// Remove bookmark
UserSchema.methods.removeBookmark = async function(bookId) {
  const user = this;
  
  user.bookmarks = user.bookmarks.filter(bookmark => bookmark.bookId !== bookId);
  await user.save();
  
  return user.bookmarks;
};

// Update user preferences
UserSchema.methods.updatePreferences = async function(preferencesData) {
  const user = this;
  const allowedUpdates = ['genres', 'theme', 'fontSize', 'emailNotifications', 'progressTracking'];
  
  Object.keys(preferencesData).forEach(update => {
    if (allowedUpdates.includes(update)) {
      user.preferences[update] = preferencesData[update];
    }
  });
  
  await user.save();
  return user.preferences;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;