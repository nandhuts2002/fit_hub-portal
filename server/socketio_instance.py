from flask_socketio import SocketIO

# Create a shared SocketIO instance to avoid circular imports
# Initialized in app.py via socketio.init_app(app)
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")


