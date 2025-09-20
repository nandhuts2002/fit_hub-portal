// ExerciseDB API service for RapidAPI
const EXERCISE_API_BASE_URL = 'https://exercisedb.p.rapidapi.com';

class ExerciseApiService {
  constructor() {
    // Read once from env; getHeaders() will refresh from runtime storage if needed
    this.apiKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_RAPIDAPI_KEY) || '';
    this.baseURL = EXERCISE_API_BASE_URL;
    
    // Debug logging (non-sensitive: only show first 6 chars)
    console.log('ExerciseApiService constructor:');
    const masked = this.apiKey ? this.apiKey.slice(0, 6) + '…' : 'undefined';
    console.log('- REACT_APP_RAPIDAPI_KEY(masked):', masked);
    try {
      const keys = Object.keys(process.env || {}).filter(key => key.startsWith('REACT_APP'));
      console.log('- All REACT_APP env keys:', keys);
    } catch {}
  }

  // Get headers for API requests
  getHeaders() {
    // Resolve API key from multiple sources to be resilient during dev/hot reloads
    const envKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_RAPIDAPI_KEY) || '';
    let runtimeKey = '';
    try {
      runtimeKey = (typeof window !== 'undefined' && (window.__RAPIDAPI_KEY__ ||
        localStorage.getItem('REACT_APP_RAPIDAPI_KEY') ||
        localStorage.getItem('RAPIDAPI_KEY'))) || '';
    } catch {}

    // Prefer env, then runtime, then previous cached value
    this.apiKey = envKey || runtimeKey || this.apiKey || '';

    if (!this.apiKey) {
      throw new Error('Missing REACT_APP_RAPIDAPI_KEY in client/.env');
    }
    return {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      'Content-Type': 'application/json'
    };
  }

  // Test if a GIF URL is accessible
  async testGifUrl(gifUrl) {
    try {
      const response = await fetch(gifUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // This won't give us the actual response but won't throw CORS errors
      });
      console.log('GIF URL test result for:', gifUrl, 'Response:', response);
      return true;
    } catch (error) {
      console.log('GIF URL test failed for:', gifUrl, 'Error:', error.message);
      return false;
    }
  }

  // Helper function to add gifUrl to exercises
  addImageUrls(exercises) {
    if (!Array.isArray(exercises)) return exercises;
    
    return exercises.map((exercise) => {
      // Pass through non-objects (e.g., lists like bodyPartList/targetList are arrays of strings)
      if (!exercise || typeof exercise !== 'object') {
        return exercise;
      }

      // ExerciseDB API provides exercise data but GIF URLs need to be constructed when missing
      // We now prefer the original animated GIF from the API (HTTPS-upgraded) for animations.
      // Additionally, we provide a static preview URL from v2 for components that want a non-animated image.
      let gifUrl = null;
      let previewUrl = null;

      // Try to resolve id for preview URL
      let id = exercise.id;
      if (!id && exercise.gifUrl) {
        const m = exercise.gifUrl.match(/\/([0-9]+)\.gif$/);
        if (m) id = m[1];
      }

      if (exercise.gifUrl) {
        // Prefer animated GIF (upgrade to HTTPS if needed)
        gifUrl = exercise.gifUrl.startsWith('http://')
          ? exercise.gifUrl.replace('http://', 'https://')
          : exercise.gifUrl;
      }

      // Only use v2 preview when ID is a valid 14-char string (v2 requirement)
      if (id && typeof id === 'string' && id.length === 14) {
        previewUrl = `https://v2.exercisedb.io/image/${id}`; // v2 image endpoint (no extension)
      }
      
      return {
        ...exercise,
        gifUrl,       // animated when available
        previewUrl,   // static preview (optional)
      };
    });
  }

  // Get all exercises
  async getAllExercises() {
    try {
      console.log('Fetching exercises with API key:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'undefined');
      const response = await fetch(`${this.baseURL}/exercises`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched exercises:', data.length);
      console.log('Sample exercise data:', data[0]); // Log first exercise to see structure
      console.log('Exercise ID format:', data[0]?.id, 'Length:', data[0]?.id?.length);
      
      const exercisesWithImages = this.addImageUrls(data);
      console.log('Sample exercise with gifUrl:', exercisesWithImages[0]);
      console.log('Constructed GIF URL:', exercisesWithImages[0]?.gifUrl);
      
      // Test the first GIF URL
      if (exercisesWithImages[0]?.gifUrl) {
        this.testGifUrl(exercisesWithImages[0].gifUrl);
      }
      
      return exercisesWithImages;
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  }

  // Get exercises by body part
  async getExercisesByBodyPart(bodyPart) {
    try {
      const response = await fetch(`${this.baseURL}/exercises/bodyPart/${bodyPart}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error(`Error fetching exercises for body part ${bodyPart}:`, error);
      throw error;
    }
  }

  // Get exercises by target muscle
  async getExercisesByTarget(target) {
    try {
      const response = await fetch(`${this.baseURL}/exercises/target/${target}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error(`Error fetching exercises for target ${target}:`, error);
      throw error;
    }
  }

  // Get exercises by equipment
  async getExercisesByEquipment(equipment) {
    try {
      const response = await fetch(`${this.baseURL}/exercises/equipment/${equipment}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error(`Error fetching exercises for equipment ${equipment}:`, error);
      throw error;
    }
  }

  // Get exercise by ID
  async getExerciseById(id) {
    try {
      const response = await fetch(`${this.baseURL}/exercises/exercise/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error(`Error fetching exercise ${id}:`, error);
      throw error;
    }
  }

  // Get exercise by name (search)
  async searchExercisesByName(name) {
    try {
      const response = await fetch(`${this.baseURL}/exercises/name/${name}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error(`Error searching exercises by name ${name}:`, error);
      throw error;
    }
  }

  // Get body parts list
  async getBodyParts() {
    try {
      const response = await fetch(`${this.baseURL}/exercises/bodyPartList`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error('Error fetching body parts:', error);
      throw error;
    }
  }

  // Get target muscles list
  async getTargetMuscles() {
    try {
      const response = await fetch(`${this.baseURL}/exercises/targetList`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error('Error fetching target muscles:', error);
      throw error;
    }
  }

  // Get equipment list
  async getEquipmentList() {
    try {
      const response = await fetch(`${this.baseURL}/exercises/equipmentList`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error('Error fetching equipment list:', error);
      throw error;
    }
  }

  // Get random exercises
  async getRandomExercises(count = 10) {
    try {
      const response = await fetch(`${this.baseURL}/exercises/random?limit=${count}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error(`Error fetching random exercises:`, error);
      throw error;
    }
  }

  // Advanced search with multiple filters
  async searchExercises(filters = {}) {
    try {
      let url = `${this.baseURL}/exercises`;
      const queryParams = [];
      
      if (filters.bodyPart) queryParams.push(`bodyPart=${filters.bodyPart}`);
      if (filters.target) queryParams.push(`target=${filters.target}`);
      if (filters.equipment) queryParams.push(`equipment=${filters.equipment}`);
      if (filters.name) queryParams.push(`name=${filters.name}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.addImageUrls(data);
    } catch (error) {
      console.error('Error searching exercises:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const exerciseApi = new ExerciseApiService();
export default exerciseApi;

// Export the class for custom instances
export { ExerciseApiService };

