# Corrected Installation Instructions

Based on your path (`C:\Users\rohan\Documents\E-lib\backend`), it looks like you're already in the backend directory of your E-lib project. Let's adjust the instructions for your specific folder structure.

## Directory Structure

Let's create the necessary directories for MongoDB integration:

```bash
https://drive.google.com/file/d/1IzBwA4xaUAaHnIjVqr6904E4FY25xVIw/view?usp=sharing
```
Link For The Project Report
```bash
https://docs.google.com/document/d/1cVa2mfVzYpQY8_PumFWtWz1C8-nsjGYQ/edit?usp=sharing&ouid=110044238099211872579&rtpof=true&sd=true
```

## 🚀 Getting Started
## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Basic understanding of HTML, CSS, and JavaScript if you plan to modify the code

## Installation

Clone this repository:
```bash
git clone https://github.com/yourusername/e-libraryai.git
cd e-libraryai
```

## Set up the backend (optional):

For testing without a backend, set USE_DIRECT_API = true in common.js
For production, configure your server URL in common.js

## API Integration
The application can work in two modes:

- Direct API Mode: Connects directly to Gutendex API (for development)
- Backend Mode: Uses your custom backend (for production)

-Configure this in common.js by setting USE_DIRECT_API.

## Open the application:

-Open index.html in your browser for local testing
-Or deploy to a web server

## For Backend
- 🖥️ Terminal Commands to Run E-Lib (Cross-Platform)

- ⚠️ Before running, make sure you have Node.js, Python 3, and MongoDB installed on your system.

## Start MongoDB
```bash
mongod
```
Make sure MongoDB is running on the default port 27017.

## Set Up and Run the Node.js Backend
```bash
cd backend/server
npm install
npm start
```
This starts the Node.js server on port 3000.

## Set Up and Run the Flask Chatbot Server
```bash
cd ../        # Go back to the backend directory
pip install -r requirements.txt
export JWT_SECRET="your_secret_key_here"       # Use `set` instead of `export` on Windows
python app.py
```
This starts the Flask server on port 5000.

## Open the Application
Visit the frontend in your browser (if available):

```bash
http://localhost:3000
```
## Folder Structure 

Your folder structure should look something like this:

```
E-lib/
│
├── backend/
│   ├── app.py                 # Flask app
│   ├── chatbot_service.py     # chatbot service
│   │
│   └── server/                #  Node.js MongoDB server
│       ├── models/
│       │   └── User.js
│       ├── routes/
│       │   ├── users.js
│       │   └── recommendations.js
│       ├── middleware/
│       │   └── auth.js
│       ├── server.js
│       ├── package.json
│       └── .env
│
└── frontend/
    ├── css/
    ├── js/
    │   ├── api.js            # integrated API file
    │   └── [other JS files]
    └── [HTML files]
```
## 🧩 Key Components
## JavaScript Files

- common.js: Core functionality for API communication, book fetching, and UI updates
- sidebar-chat.js: Handles sidebar collapse functionality
chat-input.js: Manages the chat input and messaging functionality

## 🤖 BookBot Features
## The integrated AI assistant can:

- Recommend books based on genres or interests
- Answer questions about authors and books
- Help with searching and navigating the library
- Provide information about literary periods and styles

## Changing the Theme
Modify theme.css to customize colors, fonts, and overall appearance.
## Adding New Features
- To extend functionality:
- Add new HTML pages as needed
- Update common.js or create new JavaScript files
- Link them in your HTML files

## Testing the Integration

Try these actions to test that everything is working properly:

1. Register a new user account
2. Log in with the new account
3. Change theme or preferences and verify they persist
4. Ask the chatbot for book recommendations
5. Check that the chatbot references your user information

## Troubleshooting Common Windows Issues

### PowerShell Execution Policy

If you encounter execution policy errors when running npm scripts, you may need to adjust your PowerShell execution policy:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Path Issues

Windows uses backslashes (`\`) rather than forward slashes (`/`) for paths. Be careful when copying path examples.

### Port Already in Use

If you get "port already in use" errors:

1. Find the process using the port:
   ```powershell
   netstat -ano | findstr :3000
   ```

2. Kill the process:
   ```powershell
   taskkill /PID [PID_NUMBER] /F
   ```

## 🙏 Acknowledgements

- Project Gutenberg for the incredible collection of free e-books

- Gutendex API for providing API access to Project Gutenberg
