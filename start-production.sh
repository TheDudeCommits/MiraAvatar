#!/bin/bash

# Production startup script for AskMira
echo "🚀 Starting AskMira production build..."

# Ensure Python dependencies are available
echo "🔍 Checking Python environment..."
python3 --version || echo "⚠️ Python3 not found"

# Check if required Python packages are available
python3 -c "import torch; print('✅ PyTorch available')" 2>/dev/null || echo "⚠️ PyTorch not available"
python3 -c "import transformers; print('✅ Transformers available')" 2>/dev/null || echo "⚠️ Transformers not available"

# Ensure the AI detector script is in the right location
if [ -f "server/services/ai-detector.py" ]; then
    echo "✅ AI detector script found"
    # Copy to dist if it exists
    if [ -d "dist" ]; then
        mkdir -p dist/server/services
        cp server/services/ai-detector.py dist/server/services/ 2>/dev/null || echo "📝 Note: Could not copy to dist directory"
        cp server/services/ai-detector.py dist/ 2>/dev/null || echo "📝 Note: Could not copy to dist root"
    fi
else
    echo "❌ AI detector script not found!"
fi

# Start the application
echo "🌐 Starting Node.js server..."
NODE_ENV=production node dist/index.js