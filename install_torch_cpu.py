#!/usr/bin/env python3
import subprocess
import sys

def install_torch_cpu():
    """Install CPU-only version of PyTorch which has fewer system dependencies"""
    try:
        # Uninstall GPU version first
        subprocess.run([sys.executable, "-m", "pip", "uninstall", "torch", "-y"], 
                      capture_output=True)
        
        # Install CPU-only PyTorch
        result = subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "torch", "torchvision", "torchaudio", 
            "--index-url", "https://download.pytorch.org/whl/cpu",
            "--user", "--no-cache-dir"
        ])
        print("CPU-only PyTorch installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to install CPU PyTorch: {e}")
        return False

def test_imports():
    """Test if the modules can be imported"""
    try:
        import torch
        import transformers
        print(f"PyTorch version: {torch.__version__}")
        print(f"Transformers version: {transformers.__version__}")
        print("Torch device:", torch.device('cpu'))
        return True
    except Exception as e:
        print(f"Import test failed: {e}")
        return False

if __name__ == "__main__":
    print("Installing CPU-only PyTorch...")
    if install_torch_cpu():
        print("Testing imports...")
        test_imports()
    else:
        print("Installation failed")