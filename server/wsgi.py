# Vercel WSGI entry point for Flask application
from app import app

if __name__ == "__main__":
    app.run()