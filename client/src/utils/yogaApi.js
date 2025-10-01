class YogaApiService {
  constructor() {
    this.baseUrl = 'https://yoga-api-nzy4.onrender.com/v1';
  }

  async getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        headers: await this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Yoga API connection test failed:', error);
      return false;
    }
  }

  async getCategories() {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Yoga categories fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching yoga categories:', error);
      throw error;
    }
  }

  async getAllPoses() {
    try {
      const response = await fetch(`${this.baseUrl}/poses`, {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Yoga poses fetched:', data);
      
      // Process and add image URLs
      const processedPoses = this.addImageUrls(data);
      return processedPoses;
    } catch (error) {
      console.error('Error fetching yoga poses:', error);
      throw error;
    }
  }

  addImageUrls(poses) {
    if (!Array.isArray(poses)) return poses;

    return poses.map((pose) => {
      if (!pose || typeof pose !== 'object') {
        return pose;
      }

      let imageUrl = null;
      if (pose.url_png) {
        imageUrl = pose.url_png;
      } else if (pose.url_svg) {
        imageUrl = pose.url_svg;
      } else if (pose.img_url) {
        imageUrl = pose.img_url;
      } else if (pose.image) {
        imageUrl = pose.image;
      } else if (pose.imgUrl) {
        imageUrl = pose.imgUrl;
      } else if (pose.url) {
        imageUrl = pose.url;
      } else if (pose.photo) {
        imageUrl = pose.photo;
      }

      console.log(`Processing pose: ${pose.name || pose.english_name}, imageUrl: ${imageUrl}`);

      return {
        ...pose,
        imageUrl,
        gifUrl: imageUrl,
        previewUrl: imageUrl,
        name: pose.english_name,
        category: pose.category_name,
        level: pose.level || 'beginner'
      };
    });
  }

  async getPosesByLevel(level) {
    try {
      console.log(`Filtering poses by level: ${level}`);
      const allPoses = await this.getAllPoses();

      const levelMapping = {
        'beginner': ['Boat', 'Cat', 'Chair', 'Child', 'Cobra', 'Downward-Facing Dog', 'Easy Pose', 'Extended Puppy', 'Half Boat', 'Mountain', 'Plank', 'Seated Forward Bend', 'Tree', 'Warrior I', 'Warrior II'],
        'intermediate': ['Camel', 'Crow', 'Dolphin', 'Eagle', 'Extended Side Angle', 'Fire Log', 'Half Moon', 'Head to Knee', 'Locust', 'Low Lunge', 'Pigeon', 'Side Plank', 'Standing Forward Bend', 'Triangle', 'Upward-Facing Dog'],
        'advanced': ['Bridge', 'Fish', 'Forearm Stand', 'Handstand', 'King Pigeon', 'Lotus', 'Peacock', 'Shoulder Stand', 'Wheel', 'Wild Thing']
      };

      const filteredPoses = allPoses.filter(pose => {
        const poseName = pose.english_name || pose.name;
        return levelMapping[level]?.includes(poseName) || false;
      });

      console.log(`Found ${filteredPoses.length} ${level} poses`);
      return filteredPoses;
    } catch (error) {
      console.error(`Error filtering poses by level ${level}:`, error);
      throw error;
    }
  }

  async getPoseByName(name) {
    try {
      console.log(`Searching for pose: ${name}`);
      const allPoses = await this.getAllPoses();
      
      const foundPose = allPoses.find(pose => {
        const poseName = pose.english_name || pose.name;
        return poseName && poseName.toLowerCase().includes(name.toLowerCase());
      });

      console.log(`Found pose:`, foundPose);
      return foundPose || null;
    } catch (error) {
      console.error(`Error searching for pose ${name}:`, error);
      throw error;
    }
  }

  async searchPoses(query) {
    try {
      console.log(`Searching poses with query: ${query}`);
      const allPoses = await this.getAllPoses();
      
      const filteredPoses = allPoses.filter(pose => {
        const poseName = pose.english_name || pose.name;
        const sanskritName = pose.sanskrit_name || '';
        const category = pose.category_name || pose.category || '';
        
        return (
          poseName && poseName.toLowerCase().includes(query.toLowerCase()) ||
          sanskritName && sanskritName.toLowerCase().includes(query.toLowerCase()) ||
          category && category.toLowerCase().includes(query.toLowerCase())
        );
      });

      console.log(`Found ${filteredPoses.length} poses matching "${query}"`);
      return filteredPoses;
    } catch (error) {
      console.error(`Error searching poses with query ${query}:`, error);
      throw error;
    }
  }
}

const yogaApi = new YogaApiService();
export default yogaApi;