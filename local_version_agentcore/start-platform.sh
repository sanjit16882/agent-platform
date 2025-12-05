#!/bin/bash

echo "🚀 Starting Agent Hub Intelligence Platform..."
echo ""

echo "📡 Backend API (Intelligence + Agents): http://localhost:3002"
echo "🎨 Frontend UI:                        http://localhost:3001"
echo ""

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check ports
if ! check_port 3002; then
    echo "Please stop the service using port 3002 and try again"
    exit 1
fi

if ! check_port 3001; then
    echo "Please stop the service using port 3001 and try again"
    exit 1
fi

echo "Starting backend server..."
cd agent-hub-backend
npm run dev &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

echo "Starting frontend UI..."
cd ../agent-hub-ui
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Platform starting up!"
echo ""
echo "🌐 Open your browser to: http://localhost:3001"
echo "📊 Backend API available at: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait