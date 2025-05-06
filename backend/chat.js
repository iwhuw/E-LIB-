// E-LibraryAI Enhanced Chat Integration

// Configuration
const CHAT_API_URL = '/api/chat';
const BOOK_SEARCH_API_URL = '/api/book-search';
const RECOMMENDATIONS_API_URL = '/api/recommendations';

// DOM elements cache
let chatMessages;
let chatInput;
let bookSearchInput;
let curatedSection;

// Flag to track if chat input has been initialized
let chatInputInitialized = false;

// Initialize once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    chatMessages = document.querySelector('.chat-messages');
    chatInput = document.querySelector('.chat-input input');
    bookSearchInput = document.getElementById('searchInput') || document.getElementById('gutenbergSearch');
    curatedSection = document.getElementById('curatedSection') || document.getElementById('recommendedBooks');
    
    // Initialize chat input handler
    initChatInput();
    
    // Initialize search functionality
    initBookSearch();
    
    // Add welcome message
    if (chatMessages && !chatMessages.querySelector('.message:not(.user-message)')) {
        setTimeout(() => {
            addBotMessage("Welcome to E-LibraryAI! I can help you find books, explore genres, or get reading recommendations. What are you interested in reading today?");
        }, 500);
    }
});



// Initialize chat input handler
function initChatInput() {
    if (chatInput && !chatInputInitialized) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                const userMessage = this.value.trim();
                // Use the global addUserMessage function if available, otherwise use local version
                if (typeof window.addUserMessage === 'function') {
                    window.addUserMessage(userMessage);
                } else {
                    addUserMessage(userMessage);
                }
                this.value = '';
            }
        });
        chatInputInitialized = true;
        console.log("Chat input initialized by chat.js");
    }
}

// Initialize book search handler
function initBookSearch() {
    if (bookSearchInput) {
        bookSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    if (typeof window.fetchBooks === 'function') {
                        window.fetchBooks(query);
                    } else {
                        fetchBooks(query);
                    }
                }
            }
        });
    }
}

// Add user message to chat
function addUserMessage(text) {
    if (!chatMessages) return;
    
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
    
    // Send message to backend
    sendMessageToBackend(text);
}

// Send message to backend
function sendMessageToBackend(message) {
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
    
    // Send request to Flask backend
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
        chatMessages.removeChild(loadingDiv);
        
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

// Fetch books from the API
async function fetchBooks(searchTerm = '') {
    if (!curatedSection) return;
    
    try {
        // Show loading state
        curatedSection.innerHTML = '<div class="loading">Searching for books...</div>';
        
        // Call the search API
        const response = await fetch(`${BOOK_SEARCH_API_URL}?query=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        const books = data.books || [];
        
        displayBooks(books);
        
        // Update chat with confirmation
        if (chatMessages && books.length > 0) {
            addBotMessage(`I found ${books.length} books matching "${searchTerm}". Take a look at the results!`);
        } else if (chatMessages && books.length === 0) {
            addBotMessage(`I couldn't find any books matching "${searchTerm}". Try a different search term?`);
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        curatedSection.innerHTML = '<div class="loading">Error loading books. Please try again.</div>';
        
        if (chatMessages) {
            addBotMessage("I had trouble searching for books. Please try again later.");
        }
    }
}

// Display books in the UI
function displayBooks(books) {
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
        const response = await fetch(`${RECOMMENDATIONS_API_URL}?genre=${encodeURIComponent(genre)}&user_id=${getUserId()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        const recommendations = data.books || [];
        
        if (recommendations.length > 0 && curatedSection) {
            displayBooks(recommendations);
            
            if (chatMessages) {
                addBotMessage(`Here are some ${genre || 'recommended'} books for you. Click on any book to see more details.`);
            }
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        if (chatMessages) {
            addBotMessage("I had trouble getting recommendations for you. Let's try something else.");
        }
    }
}

// Show book details (for pages without details page)
function showBookDetails(book) {
    // Check if we have a right sidebar for book details
    const bookDetails = document.querySelector('.book-details');
    
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
                <button class="action-btn continue-btn" onclick="window.open('https://gutenberg.org/ebooks/${book.id}', '_blank')">Read now</button>
            </div>
        `;
    } else if (chatMessages) {
        // If no sidebar, provide info in chat
        addBotMessage(`"${book.title}" by ${book.authors?.join(', ') || 'Unknown Author'}. You can read it online at https://gutenberg.org/ebooks/${book.id}`);
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