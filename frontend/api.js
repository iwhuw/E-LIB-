// api.js - Frontend API Integration Module for Dual Backend Architecture
// This file integrates both the Node.js/MongoDB backend and Flask chatbot

// API Base URLs
const AUTH_API_URL = 'http://localhost:3000/api';  // Node.js/MongoDB backend
const CHATBOT_API_URL = 'http://localhost:5000/api';  // Flask backend

// Authentication storage keys
const AUTH_TOKEN_KEY = 'e-libraryai-token';
const AUTH_USER_KEY = 'e-libraryai-user';
const PERSIST_AUTH_KEY = 'e-libraryai-auth';

/**
 * User Registration
 * @param {Object} userData - User data {email, password, name}
 * @returns {Promise} - Promise with user data and token
 */
export async function registerUser(userData) {
  try {
    const response = await fetch(`${AUTH_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * User Login
 * @param {Object} credentials - Login credentials {email, password}
 * @param {boolean} remember - Whether to remember login
 * @returns {Promise} - Promise with user data and token
 */
export async function loginUser(credentials, remember = false) {
  try {
    const response = await fetch(`${AUTH_API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store authentication data
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    
    // Store persistent auth if remember is true
    if (remember) {
      localStorage.setItem(PERSIST_AUTH_KEY, JSON.stringify({
        token: data.token,
        user: data.user
      }));
    } else {
      // Store in session storage only
      sessionStorage.setItem(PERSIST_AUTH_KEY, JSON.stringify({
        token: data.token,
        user: data.user
      }));
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * User Logout
 * @returns {Promise} - Promise with logout confirmation
 */
export async function logoutUser() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${AUTH_API_URL}/users/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Logout failed');
    }
    
    // Clear all authentication data
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(PERSIST_AUTH_KEY);
    sessionStorage.removeItem(PERSIST_AUTH_KEY);
    
    return data;
  } catch (error) {
    console.error('Logout error:', error);
    // Clear authentication data anyway
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(PERSIST_AUTH_KEY);
    sessionStorage.removeItem(PERSIST_AUTH_KEY);
    throw error;
  }
}

/**
 * Get User Profile
 * @returns {Promise} - Promise with user profile data
 */
export async function getUserProfile() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${AUTH_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile');
    }
    
    // Update stored user data
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Profile error:', error);
    // Handle authentication errors
    if (error.message.includes('authentication') || error.message.includes('Not authenticated')) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
    throw error;
  }
}

/**
 * Update User Preferences
 * @param {Object} preferences - User preferences to update
 * @returns {Promise} - Promise with updated preferences
 */
export async function updatePreferences(preferences) {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${AUTH_API_URL}/users/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(preferences)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update preferences');
    }
    
    // Update user preferences in local storage
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || '{}');
    user.preferences = data;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    
    return data;
  } catch (error) {
    console.error('Update preferences error:', error);
    throw error;
  }
}

/**
 * Get Books Recommendations - Uses both backends depending on authentication status
 * @param {string} genre - Optional genre to filter recommendations
 * @returns {Promise} - Promise with recommended books
 */
export async function getRecommendations(genre = '') {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (token) {
      // Authenticated - use MongoDB backend
      // Build query string
      let url = `${AUTH_API_URL}/recommendations`;
      if (genre) {
        url += `?genre=${encodeURIComponent(genre)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }
      
      return data;
    } else {
      // Not authenticated - use Flask backend
      let url = `${CHATBOT_API_URL}/recommendations`;
      if (genre) {
        url += `?genre=${encodeURIComponent(genre)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }
      
      return data;
    }
  } catch (error) {
    console.error('Recommendations error:', error);
    throw error;
  }
}

/**
 * Get Trending Books
 * @returns {Promise} - Promise with trending books
 */
export async function getTrendingBooks() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (token) {
      // Authenticated - use MongoDB backend
      const response = await fetch(`${AUTH_API_URL}/recommendations/trending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trending books');
      }
      
      return data;
    } else {
      // Not authenticated - use Flask backend
      const response = await fetch(`${CHATBOT_API_URL}/recommendations?sort=popular`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trending books');
      }
      
      return data;
    }
  } catch (error) {
    console.error('Trending books error:', error);
    throw error;
  }
}

/**
 * Send Message to Chatbot - Uses Flask backend
 * @param {string} message - User message for chatbot
 * @returns {Promise} - Promise with chatbot response
 */
export async function sendChatMessage(message) {
  try {
    // Get auth token if available
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const user = getCurrentUser();
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Send request to Flask backend
    const response = await fetch(`${CHATBOT_API_URL}/chat`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ 
        message: message,
        user_id: user?.id || 'anonymous'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get chatbot response');
    }
    
    return data;
  } catch (error) {
    console.error('Chatbot error:', error);
    throw error;
  }
}

/**
 * Search Books - Uses Flask backend
 * @param {string} query - Search query
 * @returns {Promise} - Promise with search results
 */
export async function searchBooks(query) {
  try {
    // Get auth token if available
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    // Prepare headers
    const headers = {};
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Send request to Flask backend
    const response = await fetch(`${CHATBOT_API_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to search books');
    }
    
    return data;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Get Book Details - Uses Flask backend
 * @param {string} bookId - Book ID
 * @returns {Promise} - Promise with book details
 */
export async function getBookDetails(bookId) {
  try {
    // Get auth token if available
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    // Prepare headers
    const headers = {};
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Send request to Flask backend
    const response = await fetch(`${CHATBOT_API_URL}/book/${bookId}`, {
      headers: headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get book details');
    }
    
    return data;
  } catch (error) {
    console.error('Book details error:', error);
    throw error;
  }
}

/**
 * Track Reading Activity - Sends to both backends
 * @param {Object} trackData - Tracking data {bookId, action, bookInfo}
 * @returns {Promise} - Promise with tracking confirmation
 */
export async function trackReading(trackData) {
  try {
    // Get auth token
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (token) {
      // Update MongoDB reading history
      await updateReadingProgress({
        bookId: trackData.bookId,
        title: trackData.bookInfo?.title,
        authors: trackData.bookInfo?.authors,
        cover: trackData.bookInfo?.cover,
        progress: trackData.progress || 0
      });
    }
    
    // Also send to Flask backend for chatbot context
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Send tracking data to Flask
    const response = await fetch(`${CHATBOT_API_URL}/track`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(trackData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to track reading activity');
    }
    
    return data;
  } catch (error) {
    console.error('Track reading error:', error);
    throw error;
  }
}

/**
 * Get User Bookmarks
 * @returns {Promise} - Promise with user bookmarks
 */
export async function getBookmarks() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${AUTH_API_URL}/users/bookmarks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch bookmarks');
    }
    
    return data;
  } catch (error) {
    console.error('Bookmarks error:', error);
    throw error;
  }
}

/**
 * Add Bookmark
 * @param {Object} bookData - Book data {bookId, title, authors, cover}
 * @returns {Promise} - Promise with updated bookmarks
 */
export async function addBookmark(bookData) {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${AUTH_API_URL}/users/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add bookmark');
    }
    
    // Also track in Flask backend for chatbot context
    await trackReading({
      bookId: bookData.bookId,
      action: 'bookmark',
      bookInfo: bookData
    });
    
    return data;
  } catch (error) {
    console.error('Add bookmark error:', error);
    throw error;
  }
}

/**
 * Remove Bookmark
 * @param {string} bookId - Book ID to remove from bookmarks
 * @returns {Promise} - Promise with updated bookmarks
 */
export async function removeBookmark(bookId) {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${AUTH_API_URL}/users/bookmarks/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove bookmark');
    }
    
    // Also track in Flask backend for chatbot context
    await trackReading({
      bookId: bookId,
      action: 'unbookmark',
    });
    
    return data;
  } catch (error) {
    console.error('Remove bookmark error:', error);
    throw error;
  }
}

/**
 * Get Reading History
 * @returns {Promise} - Promise with reading history
 */
export async function getReadingHistory() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${AUTH_API_URL}/users/reading-history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch reading history');
    }
    
    return data;
  } catch (error) {
    console.error('Reading history error:', error);
    throw error;
  }
}

/**
 * Update Reading Progress
 * @param {Object} progressData - Progress data {bookId, title, authors, cover, progress}
 * @returns {Promise} - Promise with updated reading history
 */
export async function updateReadingProgress(progressData) {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${AUTH_API_URL}/users/reading-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(progressData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update reading progress');
    }
    
    return data;
  } catch (error) {
    console.error('Update reading progress error:', error);
    throw error;
  }
}

/**
 * Check if backends are online
 * @returns {Promise} - Promise with health status for both backends
 */
export async function checkBackendHealth() {
  try {
    const results = {
      auth: false,
      chatbot: false
    };
    
    // Check Node.js backend
    try {
      const authResponse = await fetch(`${AUTH_API_URL}/health`);
      results.auth = authResponse.ok;
    } catch (e) {
      console.error('Auth backend health check failed:', e);
    }
    
    // Check Flask backend
    try {
      const chatbotResponse = await fetch(`${CHATBOT_API_URL}/health`);
      results.chatbot = chatbotResponse.ok;
    } catch (e) {
      console.error('Chatbot backend health check failed:', e);
    }
    
    return results;
  } catch (error) {
    console.error('Health check error:', error);
    return { auth: false, chatbot: false };
  }
}

/**
 * Check Authentication Status
 * @returns {boolean} - True if user is authenticated, false otherwise
 */
export function isAuthenticated() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
}

/**
 * Get Current User
 * @returns {Object|null} - User object or null if not authenticated
 */
export function getCurrentUser() {
  try {
    const userString = localStorage.getItem(AUTH_USER_KEY);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Initialize Authentication
 * Checks if user is logged in from previous session
 * @returns {Promise} - Promise that resolves when auth is initialized
 */
export async function initAuth() {
  try {
    // Check for auth in local or session storage
    const auth = JSON.parse(
      localStorage.getItem(PERSIST_AUTH_KEY) || 
      sessionStorage.getItem(PERSIST_AUTH_KEY) || 
      '{}'
    );
    
    if (auth.token) {
      // Verify token is still valid
      const response = await fetch(`${AUTH_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (response.ok) {
        // Token is valid, set auth data
        const userData = await response.json();
        localStorage.setItem(AUTH_TOKEN_KEY, auth.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        return userData;
      } else {
        // Token is invalid, clear auth data
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(PERSIST_AUTH_KEY);
        sessionStorage.removeItem(PERSIST_AUTH_KEY);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Auth initialization error:', error);
    return null;
  }
}

/**
 * Get Similar Books
 * @param {string} bookId - Book ID to find similar books
 * @returns {Promise} - Promise with similar books
 */
export async function getSimilarBooks(bookId) {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (token) {
      // Authenticated - use MongoDB backend
      const response = await fetch(`${AUTH_API_URL}/recommendations/similar/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch similar books');
      }
      
      return data;
    } else {
      // Not authenticated - use Flask backend
      const response = await fetch(`${CHATBOT_API_URL}/book/${bookId}`);
      const bookData = await response.json();
      
      if (!response.ok) {
        throw new Error(bookData.error || 'Failed to fetch book details');
      }
      
      // Use first author name as search term for similar books
      let searchTerm = '';
      if (bookData.authors && bookData.authors.length > 0) {
        searchTerm = bookData.authors[0].name;
      }
      
      // Search for books by the same author
      const searchResponse = await fetch(`${CHATBOT_API_URL}/search?q=${encodeURIComponent(searchTerm)}`);
      const searchData = await searchResponse.json();
      
      if (!searchResponse.ok) {
        throw new Error(searchData.error || 'Failed to fetch similar books');
      }
      
      // Filter out the original book
      const similar = {
        books: searchData.books.filter(book => book.id !== bookId),
        basedOn: {
          id: bookId,
          title: bookData.title,
          author: searchTerm
        }
      };
      
      return similar;
    }
  } catch (error) {
    console.error('Similar books error:', error);
    throw error;
  }
}