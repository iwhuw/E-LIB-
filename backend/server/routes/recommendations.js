// routes/recommendations.js
const express = require('express');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');
const router = express.Router();

// Gutendex API URL for book data
const GUTENDEX_API = 'https://gutendex.com/books/';

/**
 * Get personalized book recommendations
 * Based on user reading history and preferences
 */
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get genre from query or user preferences
    let genre = req.query.genre;
    
    if (!genre && user.preferences && user.preferences.genres && user.preferences.genres.length > 0) {
      // Use first preferred genre if no genre specified
      genre = user.preferences.genres[0];
    }
    
    // Default to fiction if no genre available
    if (!genre) {
      genre = 'fiction';
    }
    
    // Build query for Gutendex API
    let apiUrl = `${GUTENDEX_API}?search=${encodeURIComponent(genre)}`;
    
    // Add sorting parameters if available
    if (req.query.sort) {
      apiUrl += `&sort=${req.query.sort}`;
    }
    
    // Fetch books from Gutendex API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Gutendex API error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process the results to include user-specific data
    const books = await processBookResults(data.results || [], user);
    
    // Send recommendations response
    res.json({ 
      books, 
      total: data.count || books.length,
      genre
    });
    
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Server error fetching recommendations' });
  }
});

/**
 * Get trending books (most downloaded)
 */
router.get('/trending', auth, async (req, res) => {
  try {
    // Fetch trending books from Gutendex API (sorted by download count)
    const response = await fetch(`${GUTENDEX_API}?sort=download_count`);
    
    if (!response.ok) {
      throw new Error(`Gutendex API error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process the results to include user-specific data
    const books = await processBookResults(data.results || [], req.user);
    
    res.json({ 
      books, 
      total: data.count || books.length
    });
    
  } catch (error) {
    console.error('Trending books error:', error);
    res.status(500).json({ error: 'Server error fetching trending books' });
  }
});

/**
 * Get similar books based on a book ID
 */
router.get('/similar/:bookId', auth, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    
    // First fetch the book details to get authors and subjects
    const bookResponse = await fetch(`${GUTENDEX_API}${bookId}`);
    
    if (!bookResponse.ok) {
      throw new Error(`Gutendex API error! Status: ${bookResponse.status}`);
    }
    
    const bookData = await bookResponse.json();
    
    // Extract author name for search
    let authorName = '';
    if (bookData.authors && bookData.authors.length > 0) {
      authorName = bookData.authors[0].name.split(' ')[0]; // Use first name of first author
    }
    
    // Fetch similar books by author
    const response = await fetch(`${GUTENDEX_API}?search=${encodeURIComponent(authorName)}`);
    
    if (!response.ok) {
      throw new Error(`Gutendex API error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter out the original book
    const similarBooks = data.results.filter(book => book.id !== parseInt(bookId));
    
    // Process the results to include user-specific data
    const books = await processBookResults(similarBooks || [], req.user);
    
    res.json({ 
      books, 
      total: books.length,
      basedOn: {
        id: bookId,
        title: bookData.title,
        author: authorName
      }
    });
    
  } catch (error) {
    console.error('Similar books error:', error);
    res.status(500).json({ error: 'Server error fetching similar books' });
  }
});

/**
 * Process book results to include user-specific data
 * @param {Array} books - Books from Gutendex API
 * @param {Object} user - User object
 * @returns {Array} Processed books with user data
 */
async function processBookResults(books, user) {
  // Map Gutendex results to our format and add user data
  return books.map(book => {
    // Check if book is in user's reading history
    const historyEntry = user.readingHistory.find(item => item.bookId === book.id.toString());
    
    // Check if book is bookmarked
    const isBookmarked = user.bookmarks.some(bookmark => bookmark.bookId === book.id.toString());
    
    return {
      id: book.id.toString(),
      title: book.title,
      authors: book.authors.map(author => author.name),
      languages: book.languages,
      download_count: book.download_count,
      cover: book.formats['image/jpeg'] || '',
      html_url: book.formats['text/html'] || '',
      text_url: book.formats['text/plain'] || '',
      // Add user-specific data
      progress: historyEntry ? historyEntry.progress : 0,
      lastRead: historyEntry ? historyEntry.lastRead : null,
      isBookmarked: isBookmarked
    };
  });
}

module.exports = router;