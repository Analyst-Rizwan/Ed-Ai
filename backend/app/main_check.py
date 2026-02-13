
import sys
import os

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

try:
    from app.main import app
    print("Backend import successful")
except Exception as e:
    print(f"Backend import failed: {e}")
    sys.exit(1)
