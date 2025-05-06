// Common JavaScript functionality for E-LibraryAI

// API Configuration - CHANGE THIS URL TO MATCH YOUR SERVER
const API_BASE_URL = '/api';  // Use relative URL
const CHAT_API_URL = `${API_BASE_URL}/chat`;
const SEARCH_API_URL = `${API_BASE_URL}/search`;
const RECOMMENDATIONS_API_URL = `${API_BASE_URL}/recommendations`;
const BOOK_API_URL = `${API_BASE_URL}/book`;
const TRACK_API_URL = `${API_BASE_URL}/track`;

// Gutendex fallback API (direct) for development/testing
const GUTENDEX_API = 'https://gutendex.com/books/';

// Flag to use direct Gutendex API instead of backend (DEVELOPMENT ONLY)
// *** SET THIS TO TRUE FOR TESTING WITHOUT A BACKEND ***
const USE_DIRECT_API = false;  // Change to true to bypass backend API

// Important: Make sure we wait until DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded - initializing E-LibraryAI components");
    
   
    
    
    
    // Initialize search functionality if search input exists
    initSearch();
    
    // When in direct API mode, show indicator
    if (USE_DIRECT_API) {
        console.log("DEVELOPMENT MODE: Using direct Gutendex API");
        
        // Create a development mode indicator
        const devModeIndicator = document.createElement('div');
        devModeIndicator.style.position = 'fixed';
        devModeIndicator.style.top = '5px';
        devModeIndicator.style.right = '5px';
        devModeIndicator.style.backgroundColor = '#ff6b6b';
        devModeIndicator.style.color = 'white';
        devModeIndicator.style.padding = '5px 10px';
        devModeIndicator.style.borderRadius = '3px';
        devModeIndicator.style.fontSize = '12px';
        devModeIndicator.style.zIndex = '9999';
        devModeIndicator.textContent = 'DEV MODE';
        document.body.appendChild(devModeIndicator);
    }
});



// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput') || document.getElementById('gutenbergSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    fetchBooks(query);
                }
            }
        });
    }
}

// Fetch books from the API
async function fetchBooks(searchTerm = '') {
    const curatedSection = document.getElementById('curatedSection') || document.getElementById('recommendedBooks');
    if (!curatedSection) return;
    
    try {
        // Show loading state
        curatedSection.innerHTML = '<div class="loading">Searching for books...</div>';
        
        // Determine which API to use
        let apiUrl;
        let response;
        let data;
        
        if (USE_DIRECT_API) {
            // Use Gutendex API directly for development
            apiUrl = `${GUTENDEX_API}?search=${encodeURIComponent(searchTerm)}`;
            console.log(`DEV MODE: Fetching books from Gutendex: ${apiUrl}`);
            
            response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Gutendex API error! Status: ${response.status}`);
            }
            
            data = await response.json();
            let books = processGutendexResults(data.results || []);
            displayBooks(books, curatedSection);
            
            // Update chat with confirmation
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages && books.length > 0) {
                mockBotResponse(`I found ${books.length} books matching "${searchTerm}". Take a look at the results!`);
            } else if (chatMessages && books.length === 0) {
                mockBotResponse(`I couldn't find any books matching "${searchTerm}". Try a different search term?`);
            }
        } else {
            // Use backend API
            apiUrl = `${SEARCH_API_URL}?q=${encodeURIComponent(searchTerm)}`;
            console.log(`Fetching books from backend: ${apiUrl}`);
            
            response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Backend API error! Status: ${response.status}`);
            }
            
            data = await response.json();
            let books = data.books || [];
            displayBooks(books, curatedSection);
            
            // Update chat with confirmation
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages && books.length > 0) {
                addBotMessage(`I found ${books.length} books matching "${searchTerm}". Take a look at the results!`);
            } else if (chatMessages && books.length === 0) {
                addBotMessage(`I couldn't find any books matching "${searchTerm}". Try a different search term?`);
            }
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        if (curatedSection) {
            curatedSection.innerHTML = '<div class="loading">Error loading books. Please try again.</div>';
        }
        
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            if (USE_DIRECT_API) {
                mockBotResponse("I had trouble searching for books. Please try again later.");
            } else {
                addBotMessage("I had trouble searching for books. Please try again later.");
            }
        }
    }
}

// Process Gutendex API results into our format
function processGutendexResults(results) {
    return results.map(book => ({
        id: book.id,
        title: book.title,
        authors: book.authors.map(author => author.name),
        languages: book.languages,
        download_count: book.download_count,
        cover: book.formats['image/jpeg'] || '',
        html_url: book.formats['text/html'] || '',
        text_url: book.formats['text/plain'] || ''
    }));
}

// Display books in the UI
function displayBooks(books, containerElement = null) {
    const curatedSection = containerElement || document.getElementById('curatedSection') || document.getElementById('recommendedBooks');
    if (!curatedSection) return;
    
    if (books.length === 0) {
        curatedSection.innerHTML = '<div class="loading">No books found matching your criteria. Try a different search.</div>';
        return;
    }
    
    curatedSection.innerHTML = '';
    
    books.forEach(book => {
        const coverUrl = book.cover || 'https://via.placeholder.com/150x200?text=No+Cover';
        const authors = book.authors?.join(', ') || 'Unknown Author';
        
        const bookCard = document.createElement('div');
        
        // Determine which type of card to create based on container
        if (curatedSection.classList.contains('curated-section')) {
            // For search.html style
            bookCard.className = 'curated-card';
            bookCard.innerHTML = `
                <img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">
                <div class="card-content">
                    <h3>${book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}</h3>
                    <p>${authors}</p>
                </div>
            `;
        } else {
            // For other pages style - participants list
            bookCard.className = 'participant-card';
            bookCard.innerHTML = `
                <img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">
            `;
        }
        
        // Add click handler to show book details
        bookCard.addEventListener('click', () => {
            if (window.location.href.includes('index.html') || window.location.href.includes('book-details.html')) {
                navigateToBookDetails(book.id);
            } else {
                showBookDetails(book);
            }
        });
        
        curatedSection.appendChild(bookCard);
    });
}

// Fetch and display recommendations
async function fetchAndDisplayRecommendations(genre) {
    try {
        // Determine which API to use
        if (USE_DIRECT_API) {
            // For development only - direct API call
            const apiUrl = `${GUTENDEX_API}?search=${encodeURIComponent(genre)}`;
            console.log(`DEV MODE: Fetching recommendations from Gutendex: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Gutendex API error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            const recommendations = processGutendexResults(data.results || []);
            
            if (recommendations.length > 0) {
                const curatedSection = document.getElementById('curatedSection') || document.getElementById('recommendedBooks');
                if (curatedSection) {
                    displayBooks(recommendations, curatedSection);
                    
                    const chatMessages = document.querySelector('.chat-messages');
                    if (chatMessages) {
                        mockBotResponse(`Here are some ${genre || 'recommended'} books for you. Click on any book to see more details.`);
                    }
                }
            }
        } else {
            // Use our backend API
            const apiUrl = `${RECOMMENDATIONS_API_URL}?genre=${encodeURIComponent(genre)}&user_id=${getUserId()}`;
            console.log(`Fetching recommendations from backend: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Backend API error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            const recommendations = data.books || [];
            
            if (recommendations.length > 0) {
                const curatedSection = document.getElementById('curatedSection') || document.getElementById('recommendedBooks');
                if (curatedSection) {
                    displayBooks(recommendations, curatedSection);
                    
                    const chatMessages = document.querySelector('.chat-messages');
                    if (chatMessages) {
                        addBotMessage(`Here are some ${genre || 'recommended'} books for you. Click on any book to see more details.`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            if (USE_DIRECT_API) {
                mockBotResponse("I had trouble getting recommendations for you. Let's try something else.");
            } else {
                addBotMessage("I had trouble getting recommendations for you. Let's try something else.");
            }
        }
    }
}

// Add a user message to the chat
function addUserMessage(text) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    // Check if this message was already added (prevent duplicates)
    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage && 
        lastMessage.classList.contains('user-message') && 
        lastMessage.querySelector('p').textContent === text) {
        console.log("Preventing duplicate user message");
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const messagePara = document.createElement('p');
    messagePara.textContent = text;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = 'You';
    
    messageDiv.appendChild(messagePara);
    messageDiv.appendChild(timeSpan);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Send message to backend, or create mock response in dev mode
    if (USE_DIRECT_API) {
        createMockResponse(text);
    } else {
        sendMessageToBackend(text);
    }
}

// Create a mock response when in dev mode
function createMockResponse(message) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message loading';
    loadingDiv.innerHTML = '<p>...</p>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Mock responses based on message content
    let response;
    
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi ')) {
        response = "Hi there! I'm in development mode right now. How can I help you find books today?";
    } else if (message.toLowerCase().includes('recommend') || message.toLowerCase().includes('suggestion')) {
        response = "I'd love to recommend some books for you! What genres or authors do you enjoy?";
        
        // Offer recommendations if genre is mentioned
        const genre = extractGenre(message);
        if (genre) {
            setTimeout(() => {
                fetchAndDisplayRecommendations(genre);
            }, 1000);
        }
    } else if (message.toLowerCase().includes('search') || message.toLowerCase().includes('find')) {
        response = "You can use the search bar at the top to find specific books, or ask me about a topic you're interested in.";
    } else if (message.toLowerCase().includes('author')) {
        response = "I can help you find books by specific authors. Which author are you interested in?";
    } else if (isBookRelatedMessage(message)) {
        response = "I see you're interested in books! Tell me more about what you're looking for, and I'll try to help.";
        
        // Extract genre if present
        const genre = extractGenre(message);
        if (genre) {
            setTimeout(() => {
                fetchAndDisplayRecommendations(genre);
            }, 1000);
        }
    } else {
        response = "I'm here to help you discover books from Project Gutenberg. Feel free to ask about specific genres, authors, or for general recommendations!";
    }
    
    // Remove loading after delay to simulate response time
    setTimeout(() => {
        if (chatMessages.contains(loadingDiv)) {
            chatMessages.removeChild(loadingDiv);
            mockBotResponse(response);
        }
    }, 1000);
}

// Add a mock bot message (used in dev mode)
function mockBotResponse(text) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    // Create the header with avatar and name
    const headerDiv = document.createElement('div');
    headerDiv.style = 'display: flex; gap: 10px; align-items: center;';
    
    const avatar = document.createElement('img');
    avatar.src = 'https://ui-avatars.com/api/?name=AI&background=1a73e8&color=fff';
    avatar.alt = 'AI Assistant';
    avatar.style = 'border-radius: 50%; width: 40px; height: 40px;';
    
    const nameTimeDiv = document.createElement('div');
    
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = 'BookBot (Dev)';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    nameTimeDiv.appendChild(nameStrong);
    nameTimeDiv.appendChild(document.createTextNode(' '));
    nameTimeDiv.appendChild(timeSpan);
    
    headerDiv.appendChild(avatar);
    headerDiv.appendChild(nameTimeDiv);
    
    // Message content
    const messagePara = document.createElement('p');
    messagePara.textContent = text;
    
    // Assemble the message
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(messagePara);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message to backend
function sendMessageToBackend(message) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message loading';
    loadingDiv.innerHTML = '<p>...</p>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Prepare request payload
    const payload = {
        message: message,
        user_id: getUserId()
    };
    
    // Send request to backend
    fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Remove loading indicator
        if (chatMessages.contains(loadingDiv)) {
            chatMessages.removeChild(loadingDiv);
        }
        
        // Add bot response
        addBotMessage(data.response);
        
        // If the message contains book-related keywords, offer recommendations
        if (isBookRelatedMessage(message)) {
            fetchAndDisplayRecommendations(extractGenre(message));
        }
    })
    .catch(error => {
        // Remove loading indicator
        if (chatMessages.contains(loadingDiv)) {
            chatMessages.removeChild(loadingDiv);
        }
        
        // Show error message
        console.error('Error:', error);
        addBotMessage("Sorry, I'm having trouble connecting to my backend. Please try again later.");
    });
}

// Add bot message to chat
function addBotMessage(text) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    // Create the header with avatar and name
    const headerDiv = document.createElement('div');
    headerDiv.style = 'display: flex; gap: 10px; align-items: center;';
    
    const avatar = document.createElement('img');
    avatar.src = 'https://ui-avatars.com/api/?name=AI&background=1a73e8&color=fff';
    avatar.alt = 'AI Assistant';
    avatar.style = 'border-radius: 50%; width: 40px; height: 40px;';
    
    const nameTimeDiv = document.createElement('div');
    
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = 'BookBot';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    nameTimeDiv.appendChild(nameStrong);
    nameTimeDiv.appendChild(document.createTextNode(' '));
    nameTimeDiv.appendChild(timeSpan);
    
    headerDiv.appendChild(avatar);
    headerDiv.appendChild(nameTimeDiv);
    
    // Message content
    const messagePara = document.createElement('p');
    messagePara.textContent = text;
    
    // Assemble the message
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(messagePara);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show book details (for pages without details page)
function showBookDetails(book) {
    // Check if we have a right sidebar for book details
    const bookDetails = document.querySelector('.book-details');
    const chatMessages = document.querySelector('.chat-messages');
    
    if (bookDetails) {
        const coverUrl = book.cover || 'https://via.placeholder.com/300x400?text=No+Cover';
        const authors = book.authors?.join(', ') || 'Unknown Author';
        
        bookDetails.innerHTML = `
            <img src="${coverUrl}" alt="${book.title}" class="featured-image" onerror="this.src='https://via.placeholder.com/300x400?text=No+Cover'">
            <h2>${book.title}</h2>
            <div class="author-info">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(authors.charAt(0))}&background=random" alt="Author" class="author-avatar">
                <span>${authors}</span>
            </div>
            <div class="stats">
                <div>
                    <span>📥 ${book.download_count?.toLocaleString() || '0'} downloads</span>
                </div>
            </div>
            <h3>Book Overview</h3>
            <p>A classic work from Project Gutenberg's collection.</p>
            <div class="action-buttons">
                <button class="action-btn continue-btn" onclick="window.open('${book.html_url || 'https://gutenberg.org/ebooks/' + book.id}', '_blank')">Read now</button>
            </div>
        `;
    } else if (chatMessages) {
        // If no sidebar, provide info in chat
        if (USE_DIRECT_API) {
            mockBotResponse(`"${book.title}" by ${book.authors?.join(', ') || 'Unknown Author'}. You can read it online at https://gutenberg.org/ebooks/${book.id}`);
        } else {
            addBotMessage(`"${book.title}" by ${book.authors?.join(', ') || 'Unknown Author'}. You can read it online at https://gutenberg.org/ebooks/${book.id}`);
        }
    }
}

// Navigate to book details page
function navigateToBookDetails(bookId) {
    window.location.href = `book-details.html?id=${bookId}`;
}

// Helper functions
function getUserId() {
    let userId = localStorage.getItem('e-libraryai-user-id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('e-libraryai-user-id', userId);
    }
    return userId;
}

function isBookRelatedMessage(message) {
    const bookKeywords = ['book', 'read', 'novel', 'author', 'genre', 'recommend', 'suggestion'];
    message = message.toLowerCase();
    return bookKeywords.some(keyword => message.includes(keyword));
}

function extractGenre(message) {
    const genreKeywords = {
        'fiction': ['fiction', 'novel', 'story'],
        'science fiction': ['sci-fi', 'science fiction', 'futuristic'],
        'mystery': ['mystery', 'detective', 'crime', 'thriller'],
        'romance': ['romance', 'love story', 'romantic'],
        'adventure': ['adventure', 'action', 'exciting'],
        'fantasy': ['fantasy', 'magical', 'dragon'],
        'biography': ['biography', 'memoir', 'life story'],
        'history': ['history', 'historical', 'past'],
        'philosophy': ['philosophy', 'philosophical', 'ethics'],
        'poetry': ['poem', 'poetry', 'verse']
    };
    
    message = message.toLowerCase();
    
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
        if (keywords.some(keyword => message.includes(keyword))) {
            return genre;
        }
    }
    
    return '';
}

// Expose key functions globally for use in HTML
window.fetchBooks = fetchBooks;
window.addUserMessage = addUserMessage;
window.addBotMessage = addBotMessage;
window.navigateToBookDetails = navigateToBookDetails;