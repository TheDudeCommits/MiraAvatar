#!/usr/bin/env python3
import subprocess
import sys

def install_package(package):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--user", "--no-cache-dir"])
        print(f"Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to install {package}: {e}")
        return False

def main():
    packages = ["torch", "transformers", "numpy", "scikit-learn"]
    
    for package in packages:
        print(f"Installing {package}...")
        success = install_package(package)
        if not success:
            print(f"Installation failed for {package}")
    
    # Test imports
    try:
        import torch
        import transformers
        import numpy
        import sklearn
        print("All packages installed and importable successfully!")
        print(f"PyTorch version: {torch.__version__}")
        print(f"Transformers version: {transformers.__version__}")
    except ImportError as e:
        print(f"Import test failed: {e}")

if __name__ == "__main__":
    main()