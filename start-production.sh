#!/bin/bash

# Production startup script for deployment
echo "🚀 Starting CV Avatar Chatbot in production mode..."

# Set environment variables for production
export NODE_ENV=production
export PORT=${PORT:-5000}

# Verify environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "❌ Error: ELEVENLABS_API_KEY environment variable is required"
    exit 1
fi

echo "✅ All required environment variables are set"
echo "🌐 Starting server on port $PORT"

# Start the application
node dist/index.js