📚 Project Description
E-Lib is an AI-powered digital library assistant that allows users to interact with a chatbot to search for books, receive personalized recommendations, and manage their profiles. It combines a Flask-based Python chatbot, a Node.js + MongoDB backend for handling user data and book information, and a JavaScript frontend to provide a seamless and intuitive user experience. The goal is to make digital library access conversational, intelligent, and user-friendly.

🖥️ Terminal Commands to Run E-Lib (Cross-Platform)
⚠️ Before running, make sure you have Node.js, Python 3, and MongoDB installed on your system.

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
│   ├── app.py                 # Your updated Flask app
│   ├── chatbot_service.py     # Your existing chatbot service
│   │
│   └── server/                # New Node.js MongoDB server
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
    │   ├── api.js             # New integrated API file
    │   └── [other JS files]
    └── [HTML files]
```

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
