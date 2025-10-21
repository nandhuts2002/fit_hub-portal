from flask_socketio import SocketIO

# Create a shared SocketIO instance to avoid circular imports
# Initialized in app.py via socketio.init_app(app)
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode="threading",
    logger=True,  # Enable logging for debugging
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    # Allow both WebSocket and polling transports
    transports=['websocket', 'polling']
)


