// Image proxy utility to handle CORS issues with ExerciseDB GIFs
class ImageProxy {
  constructor() {
    this.cache = new Map();
    this.fallbackImages = {
      'waist': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      'abs': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      'chest': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop&auto=format',
      'back': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop&auto=format',
      'shoulders': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop&auto=format',
      'arms': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop&auto=format',
      'legs': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      'cardio': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      'default': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format'
    };

    // Allow configuring proxy URL via env at build time
    this.proxyBase = process.env.REACT_APP_IMAGE_PROXY_URL || 'http://localhost:5001';
  }

  // Get a fallback image based on body part
  getFallbackImage(bodyPart) {
    const normalizedBodyPart = bodyPart?.toLowerCase() || 'default';
    return this.fallbackImages[normalizedBodyPart] || this.fallbackImages.default;
  }

  // Create a proxy URL for the ExerciseDB image
  getProxyUrl(originalUrl, bodyPart) {
    if (!originalUrl) return this.getFallbackImage(bodyPart);
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${this.proxyBase}/proxy-image?url=${encodedUrl}`;
  }

  // Test if an image URL is accessible (best-effort only)
  async testImageUrl(url) {
    try {
      await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch (error) {
      console.log('Image URL test failed:', error.message);
      return false;
    }
  }

  // Get the best available image URL
  async getBestImageUrl(exercise) {
    const { gifUrl, mediaUrl, id, bodyPart, name } = exercise || {};

    // Prefer mediaUrl over gifUrl for newer exercises
    const rawUrl = mediaUrl || gifUrl || (id ? `https://v2.exercisedb.io/image/${id}` : null);

    if (rawUrl) {
      // Check if this is a local uploaded file (starts with /uploads/)
      if (rawUrl.startsWith('/uploads/')) {
        // For local uploads, serve directly from our Flask server
        const apiBase = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const localUrl = `${apiBase}${rawUrl}`;
        this.cache.set(mediaUrl || gifUrl || name || id, localUrl);
        return localUrl;
      }
      
      // For external URLs (ExerciseDB, etc.), route through proxy to avoid CORS
      const proxied = this.getProxyUrl(rawUrl, bodyPart);
      this.cache.set(mediaUrl || gifUrl || name || id, proxied);
      return proxied;
    }

    // Fallback to static placeholder image
    const fallbackUrl = this.getFallbackImage(bodyPart);
    this.cache.set(mediaUrl || gifUrl || name || id || 'fallback', fallbackUrl);
    return fallbackUrl;
  }

  // Generate a placeholder image URL with exercise info (inline SVG to avoid external DNS)
  generatePlaceholderUrl(exercise) {
    const { name, bodyPart } = exercise || {};
    const title = (name || 'Exercise').slice(0, 50);
    const subtitle = (bodyPart || 'fitness');

    // Build a simple SVG with purple background and white text
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>
        <rect width='100%' height='100%' fill='#6366f1'/>
        <g font-family='Arial, Helvetica, sans-serif' fill='#ffffff'>
          <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='16' font-weight='bold'>${title.replace(/&/g, '&amp;')}</text>
          <text x='50%' y='70%' dominant-baseline='middle' text-anchor='middle' font-size='12' opacity='0.9'>${subtitle.replace(/&/g, '&amp;')}</text>
        </g>
      </svg>
    `;

    // Encode SVG for data URI
    const encodedSvg = encodeURIComponent(svg)
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');

    return `data:image/svg+xml;charset=UTF-8,${encodedSvg}`;
  }
}

// Create and export singleton instance
const imageProxy = new ImageProxy();
export default imageProxy;
