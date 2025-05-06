const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/user');
const recommendationRoutes = require('./routes/recommendations');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e-libraryai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure static file serving
const frontendPath = path.join(__dirname, '../../frontend'); // Goes up 2 levels from backend/server/
const indexPath = path.join(frontendPath, 'index.html');

// Verify frontend files exist
if (!fs.existsSync(indexPath)) {
  console.error('Frontend files path:', frontendPath);
  console.error('ERROR: index.html not found at:', indexPath);
  console.log('Available files:', fs.readdirSync(frontendPath));
} else {
  console.log('Serving frontend from:', frontendPath);
}

// Serve static files (CSS, JS, images)
app.use(express.static(frontendPath));

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'E-LibraryAI API is running' });
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend not built', path: indexPath });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
  console.log(`Frontend path: ${frontendPath}\n`);
});

module.exports = app;