# Skipli - Employee Task Management System

A real-time employee task management application with dual authentication system for owners and employees.

## Project Structure

```
skipli/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # ChatComponent, ProtectedRoute
│   │   ├── pages/           # LandingPage, OwnerLogin, EmployeeLogin, Dashboards
│   │   ├── context/         # AuthContext, SocketContext
│   │   └── services/        # api.js, socketService.js
│   └── package.json
├── backend/                  # Express.js API
│   ├── middleware/          # auth.js, errorHandler.js, validation.js
│   ├── routes/             # owner.js, employee.js, task.js, message.js
│   ├── services/           # firebase.js, auth.js, sms.js, email.js, socket.js
│   └── server.js
└── README.md
```

## Technology Stack

- **Frontend**: React.js, Socket.io-client, Axios, React Router
- **Backend**: Node.js, Express.js, Socket.io, JWT
- **Database**: Firebase Firestore
- **SMS**: Twilio
- **Email**: Nodemailer

## Setup & Installation

### Backend
```bash
cd backend
npm install
npm run dev  # Run on port 5000
```

### Frontend  
```bash
cd frontend
npm install
npm start   # Run on port 3000
```

### Environment Variables
Create `.env` files in both backend and frontend directories with Firebase, Twilio, and email service credentials.

## Features
- Owner authentication via SMS
- Employee authentication via email
- Task management system
- Real-time chat functionality
