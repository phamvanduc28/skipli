# Real-Time Employee Task Management Tool

A comprehensive real-time employee task management application with separate authentication flows for owners/managers and employees, featuring real-time chat, task management, and employee administration.

## 🏗️ Project Structure

```
skipli/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Main application pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service functions
│   │   ├── context/         # React context providers
│   │   └── utils/           # Utility functions
│   ├── public/
│   └── package.json
├── backend/                  # Express.js backend API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic services
│   │   └── utils/           # Utility functions
│   ├── config/              # Configuration files
│   └── package.json
└── README.md
```

## 🚀 Features

### Owner/Manager Features
- **Authentication**: Phone number + SMS verification
- **Employee Management**: Add, edit, delete employees
- **Task Management**: Create, assign, and track tasks
- **Real-time Chat**: Direct messaging with employees
- **Dashboard**: Overview of all employees and tasks

### Employee Features
- **Authentication**: Email + verification code
- **Profile Management**: Edit personal information
- **Task Management**: View and update assigned tasks
- **Real-time Chat**: Communication with managers

## 🛠️ Technology Stack

### Frontend
- **React.js** with Create React App
- **Socket.io-client** for real-time communication
- **Axios** for HTTP requests
- **React Router** for navigation
- **CSS Modules** for styling

### Backend
- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **Firebase Admin SDK** for database
- **Twilio** for SMS services
- **Nodemailer** for email services
- **JWT** for authentication

### Database
- **Firebase Firestore** for data storage
- **Firebase Authentication** for user management

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v14 or later)
2. **npm** or **yarn**
3. **Firebase Account** with a project set up
4. **Twilio Account** for SMS services
5. **Email Service** credentials (Gmail/SMTP)

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd skipli
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT Secret
JWT_SECRET=your-jwt-secret-key
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Generate a private key for service account:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Use the credentials in your `.env` file

### 5. Twilio Setup

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number for SMS
4. Add credentials to your `.env` file

## 🏃‍♂️ Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:5000

### Start Frontend Application
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000

## 📱 Application Usage

### For Owners/Managers

1. **Initial Access**
   - Enter your phone number
   - Receive SMS with 6-digit access code
   - Enter access code to authenticate

2. **Employee Management**
   - Add new employees with name, email, and department
   - Edit existing employee details
   - Delete employees
   - Set work schedules

3. **Task Management**
   - Create new tasks
   - Assign tasks to employees
   - Track task progress
   - Update task status

4. **Real-time Communication**
   - Chat with employees in real-time
   - Receive instant notifications

### For Employees

1. **Account Setup**
   - Receive email with setup link
   - Set username and password
   - Login with credentials

2. **Task Management**
   - View assigned tasks
   - Update task status
   - Mark tasks as complete

3. **Profile Management**
   - Edit personal information
   - Update contact details

4. **Communication**
   - Chat with managers
   - Receive real-time messages

## 🔒 Security Features

- **JWT Authentication** for secure API access
- **Phone/Email Verification** for user authentication
- **Input Validation** and sanitization
- **HTTPS** in production
- **Password Hashing** for employee accounts
- **Rate Limiting** on API endpoints

## 📊 Database Schema

### Collections

#### owners
```javascript
{
  id: "owner_id",
  phoneNumber: "+1234567890",
  accessCode: "123456", // Temporary, cleared after validation
  createdAt: "timestamp",
  lastLogin: "timestamp"
}
```

#### employees
```javascript
{
  id: "employee_id",
  name: "John Doe",
  email: "john@example.com",
  department: "Engineering",
  phoneNumber: "+1234567890",
  role: "Software Engineer",
  createdAt: "timestamp",
  isActive: true,
  credentials: {
    username: "johndoe",
    password: "hashed_password"
  }
}
```

#### tasks
```javascript
{
  id: "task_id",
  title: "Task Title",
  description: "Task description",
  assignedTo: "employee_id",
  createdBy: "owner_id",
  status: "pending|in-progress|completed",
  priority: "low|medium|high",
  dueDate: "timestamp",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

#### messages
```javascript
{
  id: "message_id",
  from: "user_id",
  to: "user_id",
  message: "Message content",
  timestamp: "timestamp",
  type: "owner|employee"
}
```

## 🔧 API Endpoints

### Owner Endpoints
- `POST /api/owner/create-access-code` - Generate SMS access code
- `POST /api/owner/validate-access-code` - Validate access code
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Employee Endpoints
- `POST /api/employee/login-email` - Send email verification code
- `POST /api/employee/validate-access-code` - Validate email code
- `POST /api/employee/setup-account` - Setup account credentials
- `POST /api/employee/login` - Login with credentials
- `GET /api/employee/profile` - Get employee profile
- `PUT /api/employee/profile` - Update employee profile

### Task Endpoints
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Chat Endpoints
- `GET /api/messages/:userId` - Get chat history
- `POST /api/messages` - Send message

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Live task and message updates
- **Modern Interface** - Clean and intuitive design
- **Loading States** - User feedback during operations
- **Error Handling** - Graceful error messages
- **Toast Notifications** - Success/error notifications

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📈 Production Deployment

### Backend Deployment (Heroku/Railway/Vercel)
1. Set environment variables
2. Deploy using your preferred platform
3. Update CORS settings for production domain

### Frontend Deployment (Netlify/Vercel)
1. Build the application: `npm run build`
2. Deploy build folder
3. Update API URL in environment variables

## 🐛 Troubleshooting

### Common Issues

1. **SMS not received**
   - Check Twilio phone number verification
   - Verify recipient phone number format

2. **Email not sent**
   - Check email service credentials
   - Verify app password for Gmail

3. **Real-time chat not working**
   - Check Socket.io connection
   - Verify CORS settings

4. **Firebase connection issues**
   - Verify service account credentials
   - Check Firestore rules

## 📞 Support

For questions or issues, contact:
- engineering@skiplinow.com
- hongnguyen.skipli.engineering@gmail.com

## 📄 License

This project is created for a coding challenge and is not intended for commercial use.
# skipli
