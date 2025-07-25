#!/bin/bash
echo "🚀 Starting AskMira Production Deployment"
echo "📦 Pre-caching Desklib AI Detection Model..."

# Pre-cache the AI detection model for production
cd server/services
python3 model-cache.py

if [ $? -eq 0 ]; then
    echo "✅ Desklib AI Detection Model cached successfully"
else
    echo "❌ Failed to cache Desklib AI Detection Model"
    echo "🛑 Production deployment requires the ML model to work"
    exit 1
fi

cd ../..

echo "🌐 Starting production server..."
NODE_ENV=production npm start