#!/bin/bash
# Startup script for Render deployment
cd /opt/render/project/src
export PYTHONPATH="${PYTHONPATH}:/opt/render/project/src"
gunicorn server.app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
