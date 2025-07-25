#!/bin/bash
echo "🚀 Starting AskMira Production Deployment"
echo "📦 Pre-caching Desklib AI Detection Model..."

# Set up Python environment for production
export PYTHONPATH="/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages"
export PATH="/home/runner/workspace/.pythonlibs/bin:$PATH"

# Pre-cache the AI detection model for production
cd server/services
/home/runner/workspace/.pythonlibs/bin/python3 model-cache.py

if [ $? -eq 0 ]; then
    echo "✅ Desklib AI Detection Model cached successfully"
    echo "🧪 Testing AI detection functionality..."
    echo "This is a test for AI detection in production deployment." | /home/runner/workspace/.pythonlibs/bin/python3 ai-detector.py
    if [ $? -eq 0 ]; then
        echo "✅ AI detection test passed"
    else
        echo "❌ AI detection test failed"
        exit 1
    fi
else
    echo "❌ Failed to cache Desklib AI Detection Model"
    echo "🛑 Production deployment requires the ML model to work"
    exit 1
fi

cd ../..

echo "🌐 Starting production server with proper Python environment..."
export PYTHONPATH="/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages"
export PATH="/home/runner/workspace/.pythonlibs/bin:$PATH"
NODE_ENV=production npm start