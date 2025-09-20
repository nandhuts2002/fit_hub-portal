# Simple image proxy to handle CORS issues with ExerciseDB GIFs
from flask import Flask, request, Response, jsonify
import requests
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/proxy-image')
def proxy_image():
    """
    Proxy endpoint to serve ExerciseDB images with proper CORS headers
    Usage: /proxy-image?url=<encoded_gif_url>
    """
    try:
        image_url = request.args.get('url')
        if not image_url:
            return jsonify({'error': 'No URL provided'}), 400
        
        # Decode the URL if it's encoded
        import urllib.parse
        image_url = urllib.parse.unquote(image_url)
        
        print(f"Proxying image: {image_url}")
        
        # Fetch the image from ExerciseDB
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*',
            'Referer': 'https://exercisedb.p.rapidapi.com/'
        }
        
        response = requests.get(image_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Return the image with proper CORS headers
            return Response(
                response.content,
                mimetype=response.headers.get('content-type', 'image/gif'),
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cache-Control': 'public, max-age=3600'
                }
            )
        else:
            return jsonify({'error': f'Failed to fetch image: {response.status_code}'}), 500
            
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Request failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'image-proxy'})

if __name__ == '__main__':
    print("Starting Image Proxy Server...")
    print("Available endpoints:")
    print("  GET /proxy-image?url=<encoded_gif_url> - Proxy ExerciseDB images")
    print("  GET /health - Health check")
    print("\nExample usage:")
    print("  http://localhost:5001/proxy-image?url=https%3A//v2.exercisedb.io/image/45-degree-side-bend")
    
    app.run(host='0.0.0.0', port=5001, debug=True)

