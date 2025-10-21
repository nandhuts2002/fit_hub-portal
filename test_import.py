#!/usr/bin/env python3
"""
Test script to verify the app can be imported correctly
"""
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from server.app import app
    print("✅ Successfully imported app from server.app")
    print(f"App name: {app.name}")
    print(f"App config: {app.config}")
except ImportError as e:
    print(f"❌ Failed to import app: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error with app: {e}")
    sys.exit(1)

print("✅ App import test passed!")
