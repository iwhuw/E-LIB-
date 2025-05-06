from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
import random
import logging
import os
from collections import defaultdict
import jwt
from chatbot_service import get_chatbot_response

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../frontend')
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for all routes

# Constants
GUTENDEX_API = 'https://gutendex.com/books/'
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_jwt_secret')  # Should match Node.js server

# In-memory cache for book data to reduce API calls
book_cache = {}
# User reading history (will partially migrate to MongoDB)
user_reading_history = defaultdict(list)
# Book recommendations based on categories
book_recommendations = defaultdict(list)

# Function to decode JWT tokens from the Node.js backend
def decode_jwt_token(token):
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
            
        # Decode token
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return decoded.get('_id')
    except jwt.PyJWTError as e:
        logger.error(f"JWT decode error: {e}")
        return None

# Serve static files (frontend)
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Function to fetch books from Gutendex API
def fetch_books_from_api(params=""):
    try:
        url = f"{GUTENDEX_API}{params}"
        logger.info(f"Fetching books from: {url}")
        
        response = requests.get(url)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error fetching books: {e}")
        return {"results": [], "error": str(e)}

# Route for chatbot interactions - Enhanced to support MongoDB user system
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").lower().strip()
    user_id = data.get("user_id", "anonymous")
    
    # Get authentication token from header
    auth_header = request.headers.get('Authorization')
    if auth_header:
        # Try to decode token to get MongoDB user ID
        mongo_user_id = decode_jwt_token(auth_header)
        if mongo_user_id:
            # Use MongoDB user ID instead if available
            user_id = mongo_user_id
            logger.info(f"Using MongoDB user ID: {user_id}")
    
    logger.info(f"Received chat message from user {user_id}: {user_message}")
    
    # Generate response using chatbot service
    response_text = get_chatbot_response(user_message, user_id)
    
    return jsonify({"response": response_text})

# Route to get book recommendations - Enhanced to support MongoDB user system
@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():
    genre = request.args.get("genre", "")
    user_id = request.args.get("user_id", "anonymous")
    
    # Get authentication token from header
    auth_header = request.headers.get('Authorization')
    if auth_header:
        # Try to decode token to get MongoDB user ID
        mongo_user_id = decode_jwt_token(auth_header)
        if mongo_user_id:
            # Use MongoDB user ID instead if available
            user_id = mongo_user_id
    
    if genre in book_recommendations and book_recommendations[genre]:
        # Return cached recommendations
        return jsonify({"books": book_recommendations[genre]})
    
    # Fetch new recommendations
    params = f"?search={genre}&languages=en" if genre else "?sort=popular&languages=en"
    api_response = fetch_books_from_api(params)
    
    if "error" in api_response:
        return jsonify({"error": api_response["error"]}), 500
    
    # Process and store recommendations
    books = process_books(api_response.get("results", []))
    book_recommendations[genre] = books
    
    # Add to user history
    if genre and books:
        track_user_interest(user_id, genre, books[0])
    
    return jsonify({"books": books})

# Route to search books
@app.route("/api/search", methods=["GET"])
def search_books():
    query = request.args.get("q", "")
    
    if not query:
        return jsonify({"books": [], "message": "Please provide a search query"}), 400
    
    # Check cache first
    cache_key = f"search:{query}"
    if cache_key in book_cache:
        return jsonify({"books": book_cache[cache_key], "cached": True})
    
    # Fetch from API
    params = f"?search={query}&languages=en"
    api_response = fetch_books_from_api(params)
    
    if "error" in api_response:
        return jsonify({"error": api_response["error"]}), 500
    
    # Process results
    books = process_books(api_response.get("results", []))
    book_cache[cache_key] = books
    
    return jsonify({"books": books})

# Route to get book details
@app.route("/api/book/<book_id>", methods=["GET"])
def get_book_details(book_id):
    # Check cache
    cache_key = f"book:{book_id}"
    if cache_key in book_cache:
        return jsonify(book_cache[cache_key])
    
    # Fetch from API
    try:
        response = requests.get(f"{GUTENDEX_API}{book_id}")
        response.raise_for_status()
        book_data = response.json()
        
        # Process book details
        processed_book = {
            "id": book_data.get("id"),
            "title": book_data.get("title"),
            "authors": [{"name": author.get("name"), "birth_year": author.get("birth_year"), "death_year": author.get("death_year")} 
                      for author in book_data.get("authors", [])],
            "languages": book_data.get("languages", []),
            "download_count": book_data.get("download_count", 0),
            "formats": book_data.get("formats", {}),
            "subjects": book_data.get("subjects", [])
        }
        
        # Cache the result
        book_cache[cache_key] = processed_book
        
        return jsonify(processed_book)
    except requests.RequestException as e:
        logger.error(f"Error fetching book {book_id}: {e}")
        return jsonify({"error": str(e)}), 500

# Route to record user reading history
@app.route("/api/track", methods=["POST"])
def track_reading():
    data = request.json
    user_id = data.get("user_id", "anonymous")
    book_id = data.get("book_id")
    action = data.get("action", "view")  # view, read, bookmark, etc.
    
    # Get authentication token from header
    auth_header = request.headers.get('Authorization')
    if auth_header:
        # Try to decode token to get MongoDB user ID
        mongo_user_id = decode_jwt_token(auth_header)
        if mongo_user_id:
            # Use MongoDB user ID instead if available
            user_id = mongo_user_id
    
    if not book_id:
        return jsonify({"error": "Book ID is required"}), 400
    
    # Get book details if needed
    book_info = data.get("book_info", {})
    if not book_info and book_id:
        # Fetch minimal book info
        cache_key = f"book:{book_id}"
        if cache_key in book_cache:
            book_info = book_cache[cache_key]
        else:
            # Just store the ID if we don't have details
            book_info = {"id": book_id}
    
    # Record the action
    entry = {
        "book": book_info,
        "action": action,
        "timestamp": data.get("timestamp", None)
    }
    
    user_reading_history[user_id].append(entry)
    logger.info(f"Tracked {action} for user {user_id} on book {book_id}")
    
    return jsonify({"status": "success"})

# Route to get user reading history
@app.route("/api/history/<user_id>", methods=["GET"])
def get_reading_history(user_id):
    # Get authentication token from header
    auth_header = request.headers.get('Authorization')
    if auth_header:
        # Try to decode token to get MongoDB user ID
        mongo_user_id = decode_jwt_token(auth_header)
        if mongo_user_id:
            # Use MongoDB user ID instead if available
            user_id = mongo_user_id
    
    history = user_reading_history.get(user_id, [])
    return jsonify({"history": history})

# Route for health check
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Flask backend is running"})

# Helper Functions
def process_books(books_data):
    """Process and extract relevant book information"""
    processed_books = []
    
    for book in books_data:
        processed_book = {
            "id": book.get("id"),
            "title": book.get("title"),
            "authors": [author.get("name") for author in book.get("authors", [])],
            "languages": book.get("languages", []),
            "download_count": book.get("download_count", 0),
            "cover": book.get("formats", {}).get("image/jpeg", ""),
            "html_url": book.get("formats", {}).get("text/html", ""),
            "text_url": book.get("formats", {}).get("text/plain", "")
        }
        processed_books.append(processed_book)
    
    return processed_books

def track_user_interest(user_id, genre, book):
    """Track user interest in genres and books"""
    if not user_id or user_id == "anonymous":
        return
    
    entry = {
        "genre": genre,
        "book": book,
        "timestamp": None  # In a real app, use actual timestamp
    }
    
    user_reading_history[user_id].append(entry)

# Main entry point
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)