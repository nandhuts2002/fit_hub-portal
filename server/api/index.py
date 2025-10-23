# Vercel entry point for Flask app
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path so we can import app
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

# Import the Flask app
from app import app

if __name__ == "__main__":
    app.run()