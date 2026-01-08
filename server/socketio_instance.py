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

# Define namespace handlers to allow connections
@socketio.on('connect', namespace='/community')
def handle_community_connect():
    print('[SOCKET] Client connected to /community namespace')

@socketio.on('disconnect', namespace='/community')
def handle_community_disconnect():
    print('[SOCKET] Client disconnected from /community namespace')
