import requests
import random
import json
import logging
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Gutendex API URL
GUTENDEX_API = 'https://gutendex.com/books/'

class ChatbotService:
    def __init__(self):
        # User context storage
        self.user_contexts = defaultdict(dict)
        
        # Basic book knowledge base
        self.genre_authors = {
            "fiction": ["Jane Austen", "Charles Dickens", "Mark Twain", "Virginia Woolf"],
            "science fiction": ["H.G. Wells", "Jules Verne", "Mary Shelley"],
            "mystery": ["Arthur Conan Doyle", "Agatha Christie", "Edgar Allan Poe"],
            "romance": ["Jane Austen", "Charlotte Brontë", "Emily Brontë"],
            "adventure": ["Robert Louis Stevenson", "Jack London", "Herman Melville"],
            "philosophy": ["Plato", "Aristotle", "Seneca", "Marcus Aurelius"],
            "history": ["Herodotus", "Thucydides", "Edward Gibbon"],
            "poetry": ["William Shakespeare", "Walt Whitman", "Emily Dickinson"]
        }
        
        # Cache for book recommendations
        self.book_cache = {}
        
    def get_response(self, message, user_id="anonymous"):
        """Generate response based on user message and context"""
        # Log the incoming message
        logger.info(f"User {user_id} message: {message}")
        
        # Clean and normalize input
        message = message.lower().strip()
        
        # Update user context
        user_context = self.user_contexts[user_id]
        self._update_context(user_context, message)
        
        # Process the message and generate response
        response = self._process_message(message, user_context)
        
        # Log the response
        logger.info(f"Response to user {user_id}: {response}")
        
        return response
    
    def _update_context(self, context, message):
        """Update user context based on the message"""
        # Track conversation history
        if 'history' not in context:
            context['history'] = []
        
        context['history'].append(message)
        
        # Detect interests and reading preferences
        for genre in self.genre_authors.keys():
            if genre in message:
                context['current_genre'] = genre
                break
        
        # Extract author mentions
        for genre, authors in self.genre_authors.items():
            for author in authors:
                if author.lower() in message:
                    context['current_author'] = author
                    context['current_genre'] = genre
                    break
        
        # Detect question types
        if "recommend" in message or "suggestion" in message:
            context['last_intent'] = 'recommendation'
        elif "search" in message or "find" in message:
            context['last_intent'] = 'search'
        elif "how" in message:
            context['last_intent'] = 'help'
    
    def _process_message(self, message, context):
        """Process the message and generate appropriate response"""
        # Handle greetings
        if any(greeting in message for greeting in ["hello", "hi", "hey", "greetings"]):
            return self._get_greeting_response(context)
        
        # Handle goodbyes
        if any(farewell in message for farewell in ["bye", "goodbye", "cya", "see you"]):
            return self._get_farewell_response()
        
        # Handle recommendations
        if any(term in message for term in ["recommend", "suggest", "recommendation", "what should i read"]):
            return self._get_recommendation_response(message, context)
        
        # Handle search help
        if "search" in message or "find" in message or "looking for" in message:
            return self._get_search_help_response(message)
        
        # Handle genre questions
        for genre in self.genre_authors.keys():
            if genre in message:
                return self._get_genre_info_response(genre, context)
        
        # Handle author questions
        for genre, authors in self.genre_authors.items():
            for author in authors:
                if author.lower() in message:
                    return self._get_author_info_response(author, genre)
        
        # Handle general questions about books
        if "book" in message and any(q in message for q in ["what", "which", "how", "where"]):
            return self._get_general_book_info_response(message)
        
        # Handle help request
        if "help" in message:
            return ("I can help you find books, get recommendations, and explore genres. "
                   "Try asking me things like 'recommend a science fiction book' or "
                   "'tell me about mystery novels' or 'search for books by Mark Twain'.")
        
        # Default response for unmatched queries
        return self._get_default_response(context)
    
    def _get_greeting_response(self, context):
        """Return a personalized greeting based on user context"""
        greetings = [
            "Hello! How can I help with your reading today?",
            "Hi there! Looking for a new book to discover?",
            "Welcome to E-LibraryAI! How can I assist you?",
            "Greetings! I'm your BookBot assistant. What can I help you find today?"
        ]
        
        # Personalize if we have context
        if 'current_genre' in context:
            personalized = f"Hello! I see you're interested in {context['current_genre']}. Would you like more recommendations in that genre?"
            greetings.append(personalized)
        
        if 'current_author' in context:
            personalized = f"Hi there! Last time we talked about {context['current_author']}. Would you like to explore more of their works?"
            greetings.append(personalized)
        
        return random.choice(greetings)
    
    def _get_farewell_response(self):
        """Return a farewell message"""
        farewells = [
            "Goodbye! Happy reading!",
            "Until next time! Enjoy your books.",
            "Farewell! Come back when you need more book recommendations.",
            "See you later! The world of books awaits your return."
        ]
        return random.choice(farewells)
    
    def _get_recommendation_response(self, message, context):
        """Generate book recommendations based on message and context"""
        # Determine genre to recommend
        genre = context.get('current_genre', None)
        
        # Extract genre from message if not in context
        if not genre:
            for g in self.genre_authors.keys():
                if g in message:
                    genre = g
                    break
        
        # Default to fiction if no genre found
        if not genre:
            genre = "fiction"
        
        # Try to fetch a book recommendation from Gutendex
        try:
            cache_key = f"recommend:{genre}"
            
            # Use cached recommendation if available
            if cache_key in self.book_cache:
                book = random.choice(self.book_cache[cache_key])
            else:
                # Fetch from API
                params = f"?search={genre}&languages=en"
                response = requests.get(f"{GUTENDEX_API}{params}")
                
                if response.status_code == 200:
                    data = response.json()
                    books = data.get("results", [])
                    
                    if books:
                        # Cache the results
                        self.book_cache[cache_key] = books
                        book = random.choice(books)
                    else:
                        # Fallback to general recommendation
                        return self._get_genre_info_response(genre, context)
                else:
                    # API error - fallback to general recommendation
                    return self._get_genre_info_response(genre, context)
            
            # Format the recommendation
            title = book.get("title", "an interesting book")
            authors = ", ".join([author.get("name", "Unknown") for author in book.get("authors", [])])
            
            recommendations = [
                f"For {genre}, I recommend '{title}' by {authors}. It's available in our library.",
                f"If you enjoy {genre}, you might like '{title}' by {authors}.",
                f"A great {genre} read is '{title}' by {authors}.",
                f"Based on your interest in {genre}, I think you'd enjoy '{title}' by {authors}."
            ]
            
            return random.choice(recommendations)
            
        except Exception as e:
            logger.error(f"Error getting recommendation: {e}")
            return self._get_genre_info_response(genre, context)
    
    def _get_search_help_response(self, message):
        """Provide guidance on searching for books"""
        responses = [
            "You can search our collection using the search bar at the top of the page. Try entering an author name, book title, or genre.",
            "To find books, use the search feature with keywords like author names, book titles, or topics you're interested in.",
            "Looking for something specific? Use the search bar and try different keywords related to what you want to find.",
            "Our search feature works best with specific terms. Try author names, book titles, or particular subjects you're interested in."
        ]
        
        # If message mentions specific search terms, provide more tailored guidance
        if "author" in message:
            return "To search for books by a specific author, simply type their name in the search bar. For example, 'Mark Twain' or 'Jane Austen'."
        
        if "title" in message:
            return "To find a specific book by title, enter the title in the search bar. Even partial titles often work well for finding what you need."
        
        return random.choice(responses)
    
    def _get_genre_info_response(self, genre, context):
        """Provide information about a specific genre"""
        # Update context with current genre
        context['current_genre'] = genre
        
        # Get authors for this genre
        authors = self.genre_authors.get(genre, ["various authors"])
        
        genre_info = {
            "fiction": "Fiction encompasses imaginative storytelling across many styles and settings.",
            "science fiction": "Science fiction explores speculative concepts, often involving futuristic science and technology.",
            "mystery": "Mystery focuses on solving puzzles, crimes, or unexplained events through investigation.",
            "romance": "Romance centers on relationships and emotional connections between characters.",
            "adventure": "Adventure follows exciting journeys and experiences, often in unusual or dangerous settings.",
            "philosophy": "Philosophy examines fundamental questions about existence, knowledge, values, and reasoning.",
            "history": "History documents and analyzes past events, people, and societies.",
            "poetry": "Poetry uses aesthetic and rhythmic qualities of language to evoke meanings beyond literal interpretation."
        }
        
        responses = [
            f"{genre.capitalize()} in our library features works by {', '.join(authors[:-1]) + ' and ' + authors[-1] if len(authors) > 1 else authors[0]}. {genre_info.get(genre, '')}",
            f"Our {genre} collection includes notable authors like {', '.join(authors[:2])}. Would you like specific recommendations?",
            f"{genre.capitalize()} books are popular in our library. You might enjoy works by {random.choice(authors)}. Would you like to explore more?",
            f"If you're interested in {genre}, I can recommend several books from authors such as {', '.join(random.sample(authors, min(2, len(authors))))}."
        ]
        
        return random.choice(responses)
    
    def _get_author_info_response(self, author, genre):
        """Provide information about a specific author"""
        author_info = {
            "Jane Austen": "Jane Austen (1775-1817) was an English novelist known for her works of romantic fiction set among the landed gentry.",
            "Charles Dickens": "Charles Dickens (1812-1870) was an English writer and social critic, creating some of the world's best-known fictional characters.",
            "Mark Twain": "Mark Twain (1835-1910), real name Samuel Clemens, was an American writer known for his wit and social commentary.",
            "H.G. Wells": "H.G. Wells (1866-1946) was an English writer known for his science fiction works like 'The Time Machine' and 'The War of the Worlds'.",
            "Jules Verne": "Jules Verne (1828-1905) was a French novelist known for his adventure fiction and influence on the science fiction genre.",
            "Arthur Conan Doyle": "Arthur Conan Doyle (1859-1930) was a British writer best known for his detective fiction featuring Sherlock Holmes.",
            "Plato": "Plato (c. 428-348 BCE) was an Athenian philosopher who laid the foundations of Western philosophy and science."
        }
        
        # Get author info or use a generic template
        if author in author_info:
            info = author_info[author]
        else:
            info = f"{author} was a notable {genre} author with works available in our library."
        
        responses = [
            f"{info} Would you like to browse their books?",
            f"{info} They made significant contributions to {genre} literature.",
            f"{info} Their works remain popular in our digital library.",
            f"{info} I can recommend some of their most acclaimed works if you're interested."
        ]
        
        return random.choice(responses)
    
    def _get_general_book_info_response(self, message):
        """Provide general information about books or reading"""
        responses = [
            "Our library contains thousands of free books from Project Gutenberg. You can read them online or download in various formats.",
            "E-LibraryAI offers classic literature across many genres and languages, all freely accessible.",
            "Project Gutenberg books are free because their copyright has expired in the US. That's why we focus on classics and historical works.",
            "You can read books in your browser or download them in formats like EPUB, PDF, or plain text for different devices."
        ]
        
        if "how many" in message:
            return "Our library contains thousands of books from Project Gutenberg's collection, with new additions regularly."
        
        if "download" in message:
            return "You can download books in various formats including EPUB, PDF, HTML, and plain text. Just click on a book and select your preferred format."
        
        if "read" in message and "how" in message:
            return "You can read books directly in your browser by clicking on the HTML version, or download them in your preferred format for offline reading."
        
        return random.choice(responses)
    
    def _get_default_response(self, context):
        """Provide a default response when no specific match is found"""
        default_responses = [
            "I can help you discover books in our library. Try asking for recommendations in a genre you enjoy.",
            "I'm your AI book assistant. I can suggest books, provide information about authors, or help you navigate our library.",
            "Looking for something to read? I can recommend books based on genres, authors, or topics you're interested in.",
            "Tell me what kind of books you enjoy, and I can help you find similar works in our collection."
        ]
        
        # If we have context, provide more personalized response
        if 'current_genre' in context:
            personalized = f"I notice you're interested in {context['current_genre']}. Would you like recommendations in that genre, or would you prefer to explore something else?"
            default_responses.append(personalized)
        
        if 'current_author' in context:
            personalized = f"Since you mentioned {context['current_author']}, would you like to know more about their works or similar authors?"
            default_responses.append(personalized)
        
        return random.choice(default_responses)

# Create a singleton instance
chatbot = ChatbotService()

# Function to get responses from the chatbot service
def get_chatbot_response(message, user_id="anonymous"):
    return chatbot.get_response(message, user_id)

# If run directly, test the chatbot
if __name__ == "__main__":
    test_messages = [
        "hello",
        "recommend a science fiction book",
        "tell me about Mark Twain",
        "how do I search for books?",
        "what mystery novels do you have?",
        "goodbye"
    ]
    
    for msg in test_messages:
        print(f"User: {msg}")
        print(f"Bot: {chatbot.get_response(msg)}")
        print()