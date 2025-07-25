
#!/bin/bash
echo "🚀 Starting AskMira Production Deployment"

# Install Python dependencies first
echo "📦 Installing Python dependencies..."
pip3 install --user torch>=2.0.0 transformers>=4.30.0 tokenizers>=0.13.0 numpy>=1.21.0 huggingface-hub>=0.16.0 safetensors>=0.3.0 accelerate>=0.20.0 sentencepiece>=0.1.99 protobuf>=3.20.0

# Set up Python environment for production
export PYTHONPATH="$HOME/.local/lib/python3.11/site-packages:$PYTHONPATH"
export PATH="$HOME/.local/bin:$PATH"

echo "🔧 Testing Python environment..."
python3 -c "import torch, transformers; print('✅ PyTorch and Transformers available')"

if [ $? -ne 0 ]; then
    echo "❌ Python dependencies not properly installed"
    exit 1
fi

echo "📦 Pre-caching Desklib AI Detection Model..."
cd server/services

# Test if the model can be loaded
python3 -c "
import sys
sys.path.append('.')
from model_cache import cache_model
if cache_model():
    print('✅ Desklib AI Detection Model cached successfully')
else:
    print('❌ Failed to cache model')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo "✅ Desklib AI Detection Model ready"
    echo "🧪 Testing AI detection functionality..."
    echo "This is a test for AI detection in production deployment." | python3 ai-detector-daemon.py
    if [ $? -eq 0 ]; then
        echo "✅ AI detection test passed"
    else
        echo "❌ AI detection test failed"
        exit 1
    fi
else
    echo "❌ Failed to prepare Desklib AI Detection Model"
    echo "🛑 Production deployment requires the ML model to work"
    exit 1
fi

cd ../..

echo "🌐 Starting production server with proper Python environment..."
export PYTHONPATH="$HOME/.local/lib/python3.11/site-packages:$PYTHONPATH"
export PATH="$HOME/.local/bin:$PATH"
NODE_ENV=production npm start
