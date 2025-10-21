// Image upload utility for community features
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const uploadImage = async (file, folder = 'community') => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.ok) {
      // Return full URL
      const imageUrl = data.url.startsWith('http') ? data.url : `${API_BASE_URL}${data.url}`;
      return imageUrl;
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
  }

  if (file.size > maxSize) {
    throw new Error('Image file must be smaller than 5MB');
  }

  return true;
};

export default {
  uploadImage,
  validateImageFile
};
