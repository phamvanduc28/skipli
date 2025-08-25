#!/bin/bash

# Skipli Development Startup Script
# This script helps you quickly start both frontend and backend servers

echo "🚀 Starting Skipli Employee Task Management System..."
echo ""

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
        echo "   Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 14 ]; then
        echo "❌ Node.js version must be 14 or higher. Current version: $(node -v)"
        exit 1
    fi
    
    echo "✅ Node.js $(node -v) is installed"
}

# Function to check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm."
        exit 1
    fi
    echo "✅ npm $(npm -v) is installed"
}

# Function to install dependencies
install_dependencies() {
    echo ""
    echo "📦 Installing dependencies..."
    
    # Install backend dependencies
    echo "Installing backend dependencies..."
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install backend dependencies"
            exit 1
        fi
    else
        echo "✅ Backend dependencies already installed"
    fi
    
    # Install frontend dependencies
    echo "Installing frontend dependencies..."
    cd ../frontend
    if [ ! -d "node_modules" ]; then
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install frontend dependencies"
            exit 1
        fi
    else
        echo "✅ Frontend dependencies already installed"
    fi
    
    cd ..
}

# Function to check environment files
check_env_files() {
    echo ""
    echo "🔧 Checking environment configuration..."
    
    # Check backend .env
    if [ ! -f "backend/.env" ]; then
        echo "⚠️  Backend .env file not found. Creating example file..."
        cat > backend/.env << EOL
PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email Service Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOL
        echo "📝 Please configure backend/.env with your actual credentials"
    else
        echo "✅ Backend .env file found"
    fi
    
    # Check frontend .env
    if [ ! -f "frontend/.env" ]; then
        echo "⚠️  Frontend .env file not found. Creating example file..."
        cat > frontend/.env << EOL
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
EOL
        echo "✅ Frontend .env file created"
    else
        echo "✅ Frontend .env file found"
    fi
}

# Function to start development servers
start_servers() {
    echo ""
    echo "🎯 Starting development servers..."
    echo ""
    
    # Start backend server in background
    echo "Starting backend server (http://localhost:5000)..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend server
    echo "Starting frontend server (http://localhost:3000)..."
    cd ../frontend
    npm start &
    FRONTEND_PID=$!
    
    # Return to root directory
    cd ..
    
    echo ""
    echo "🎉 Servers are starting up!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
    echo "📚 Backend Docs: http://localhost:5000/api/docs"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    echo ""
    
    # Wait for user to stop servers
    trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ Servers stopped"; exit 0' INT
    
    # Keep script running
    wait
}

# Function to show help
show_help() {
    echo "Skipli Development Script"
    echo ""
    echo "Usage: ./start-dev.sh [option]"
    echo ""
    echo "Options:"
    echo "  start, dev     Start development servers (default)"
    echo "  install        Install dependencies only"
    echo "  check          Check environment and dependencies"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./start-dev.sh              # Start development servers"
    echo "  ./start-dev.sh install      # Install dependencies"
    echo "  ./start-dev.sh check        # Check setup"
}

# Main script logic
main() {
    case "${1:-start}" in
        "start"|"dev"|"")
            check_node
            check_npm
            install_dependencies
            check_env_files
            start_servers
            ;;
        "install")
            check_node
            check_npm
            install_dependencies
            echo "✅ Dependencies installed successfully!"
            ;;
        "check")
            check_node
            check_npm
            check_env_files
            echo "✅ Environment check completed!"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
