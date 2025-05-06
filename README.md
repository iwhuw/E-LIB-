# Corrected Installation Instructions

Based on your path (`C:\Users\rohan\Documents\E-lib\backend`), it looks like you're already in the backend directory of your E-lib project. Let's adjust the instructions for your specific folder structure.

## Directory Structure

Let's create the necessary directories for MongoDB integration:

```bash
# Navigate to your backend directory
cd C:\Users\rohan\Documents\E-lib\backend

# Create MongoDB server structure
mkdir server
mkdir server\models
mkdir server\routes
mkdir server\middleware
```

## Set Up the MongoDB Backend

### 1. Create package.json

Create a `package.json` file in the `C:\Users\rohan\Documents\E-lib\backend\server` directory:

```bash
cd server
```

Create a new file called `package.json` and copy the content I provided earlier.

### 2. Install Dependencies

Install Node.js dependencies:

```bash
npm install
```

### 3. Create .env File

Create a `.env` file in the same server directory:

```
MONGODB_URI=mongodb://localhost:27017/e-lib
JWT_SECRET=your_secret_key_here
PORT=3000
```

Replace `your_secret_key_here` with a strong random string.

### 4. Create Backend Files

Create the following files with the content I provided earlier:

- `server.js` - Main server file (in the server directory)
- `models\User.js` - User model
- `middleware\auth.js` - Authentication middleware
- `routes\users.js` - User routes
- `routes\recommendations.js` - Recommendations routes

## Update Flask Application

### 1. Install Required Python Packages

```bash
pip install PyJWT
```

### 2. Update app.py

Update your existing app.py (likely in `C:\Users\rohan\Documents\E-lib\backend`) with the JWT-enabled version I provided.

### 3. Set JWT_SECRET Environment Variable

Before running Flask, set the JWT_SECRET environment variable (in PowerShell):

```powershell
$env:JWT_SECRET = "your_secret_key_here"
```

Use the same secret key as in your .env file.

## Update Frontend Files

### 1. Create or Update api.js

Place the integrated api.js file in your frontend JavaScript folder. This is likely located at:

```
C:\Users\rohan\Documents\E-lib\frontend\js\
```

or a similar location. Make sure to put it where your other JavaScript files are located.

## Running the System

### 1. Start MongoDB

Make sure MongoDB is installed and running:

```bash
# If MongoDB is installed as a service, it may already be running
# Otherwise, start it with:
mongod
```

### 2. Start Node.js Backend

Open a PowerShell window:

```powershell
cd C:\Users\rohan\Documents\E-lib\backend\server
npm start
```

This will start the Node.js server on port 3000.

### 3. Start Flask Backend

In a separate PowerShell window:

```powershell
$env:JWT_SECRET = "your_secret_key_here"
cd C:\Users\rohan\Documents\E-lib\backend
python app.py
```

This will start the Flask server on port 5000.

### 4. Access the Application

Open your web browser and go to:

```
http://localhost:3000
```

## Folder Structure After Setup

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