# Quick Start Guide - Skipli

Get up and running with Skipli in minutes!

## One-Command Start

```bash
./start-dev.sh
```

This script will:
1. Check Node.js installation
2. Install dependencies (if needed)
3. Create environment files
4. Start both frontend and backend servers

## Before You Begin

### Required Accounts:
1. Firebase Project - [Get Started](https://console.firebase.google.com)
2. Twilio Account - [Sign Up](https://www.twilio.com/try-twilio)
3. Gmail Account (for email service)

### 1-Minute Firebase Setup:
1. Create new project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Go to Project Settings → Service Accounts
4. Click Generate new private key → Download JSON
5. Copy these values to `backend/.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 1-Minute Twilio Setup:
1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Get Account SID and Auth Token from Console Dashboard
3. Buy a phone number in Console
4. Add to `backend/.env`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

### 1-Minute Gmail Setup:
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail"
4. Add to `backend/.env`:
   - `EMAIL_USER=your-email@gmail.com`
   - `EMAIL_PASS=generated-app-password`

## Access Your Application

After running `./start-dev.sh`:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/docs

## Test the Application

### Owner/Manager Login:
1. Go to http://localhost:3000
2. Click "Login as Owner/Manager"
3. Enter your phone number (with country code)
4. Check SMS for verification code
5. Enter code and access dashboard

### Employee Login:
1. First, create an employee as owner/manager
2. Go to http://localhost:3000
3. Click "Login as Employee"
4. Use email and temporary password from creation
5. Complete account setup
6. Access employee dashboard

## Development Commands

```bash
# Start everything
./start-dev.sh

# Install dependencies only
./start-dev.sh install

# Check environment setup
./start-dev.sh check

# Manual start (alternative)
cd backend && npm run dev &
cd frontend && npm start
```

## Features to Try

### For Owners/Managers:
- Add employees in dashboard
-  Create and assign tasks
-  Chat with employees in real-time
-  View analytics and statistics

### For Employees:
-  Mark tasks as complete
-  Start/pause tasks
-  Chat with manager
-  Update profile information

## Troubleshooting

### Common Issues:

**"Firebase connection failed"**
```bash
# Check your Firebase credentials in backend/.env
# Ensure Firestore is enabled in Firebase Console
```

**"SMS not sending"**
```bash
# Verify Twilio credentials
# Check phone number format (+1234567890)
# Ensure Twilio account has credit
```

**"Email not working"**
```bash
# Verify Gmail app password (not your login password)
# Ensure 2FA is enabled on Gmail
```

**"Port already in use"**
```bash
# Kill processes on ports 3000/5000
lsof -ti:3000 | xargs kill
lsof -ti:5000 | xargs kill
```

## You're Ready!

Your Skipli application is now running! Check the main [README.md](README.md) for detailed documentation and advanced features.

---
**Need help?** Create an issue or check the troubleshooting section in the main README.
