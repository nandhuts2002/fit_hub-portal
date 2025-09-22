// Location-based services for FitHub
class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
  }

  // Prefer real-time OpenStreetMap gyms for a city/district
  async getRealGymsByCity(city, state = 'Kerala') {
    try {
      const gyms = await this.getGymsFromOSMByCity(city, `${state}, India`);
      return Array.isArray(gyms) ? gyms : [];
    } catch (e) {
      console.warn('OSM real-time fetch failed:', e?.message || e);
      // Return empty to ensure only real gyms are shown (no admin fallback)
      return [];
    }
  }

  // Get current user location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback to Kerala center coordinates if geolocation is not supported
        console.log('Geolocation not supported, using Kerala center coordinates');
        this.currentLocation = {
          latitude: 9.9312, // Kochi coordinates
          longitude: 76.2673,
          accuracy: 0,
          timestamp: Date.now()
        };
        resolve(this.currentLocation);
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          resolve(this.currentLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Kerala center coordinates
          console.log('Using Kerala center coordinates as fallback');
          this.currentLocation = {
            latitude: 9.9312, // Kochi coordinates
            longitude: 76.2673,
            accuracy: 0,
            timestamp: Date.now()
          };
          resolve(this.currentLocation);
        },
        options
      );
    });
  }

  // Watch location changes
  startLocationWatch(callback) {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        if (callback) callback(this.currentLocation);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      options
    );
  }

  // Stop watching location
  stopLocationWatch() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Format distance for display
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }

  // Get nearby gyms from database
  async getNearbyGyms(radius = 5) {
    try {
      const location = await this.getCurrentLocation();
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`http://localhost:5000/location/nearby-gyms?lat=${location.latitude}&lon=${location.longitude}&radius=${radius}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Failed to fetch gyms'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Successfully fetched gyms:', data.gyms.length);
        return data.gyms;
      } else {
        throw new Error(data.message || 'Failed to fetch gyms');
      }
    } catch (error) {
      console.error('Error getting nearby gyms:', error);
      // Only fallback to mock data if it's a network/API error, not auth error
      if (error.message.includes('Authentication required')) {
        throw error; // Re-throw auth errors
      }
      console.log('API failed, but showing mock data for demo');
      return this.getMockGyms(radius);
    }
  }

  // Fallback mock data with real Kerala locations
  getMockGyms(radius = 5) {
    const mockGyms = [
      {
        _id: '1',
        name: "Gold's Gym",
        address: "Marine Drive, Kochi",
        latitude: 9.9312,
        longitude: 76.2673,
        rating: 4.5,
        price: "₹2000/month",
        facilities: ["Cardio", "Weights", "Pool", "Sauna"],
        distance: 0.8,
        open_hours: "6:00 AM - 10:00 PM",
        phone: "+91 9876543210"
      },
      {
        _id: '2',
        name: "Cult Fit",
        address: "Panampilly Nagar, Kochi",
        latitude: 9.9312,
        longitude: 76.2673,
        rating: 4.2,
        price: "₹1800/month",
        facilities: ["CrossFit", "Yoga", "Personal Training"],
        distance: 1.2,
        open_hours: "5:00 AM - 11:00 PM",
        phone: "+91 9876543211"
      },
      {
        _id: '3',
        name: "Anytime Fitness",
        address: "Thiruvananthapuram",
        latitude: 8.5241,
        longitude: 76.9366,
        rating: 4.8,
        price: "₹3000/month",
        facilities: ["Premium Equipment", "Spa", "Nutritionist", "Group Classes"],
        distance: 2.1,
        open_hours: "24/7",
        phone: "+91 9876543212"
      },
      {
        _id: '4',
        name: "Fitness First",
        address: "Calicut",
        latitude: 11.2588,
        longitude: 75.7804,
        rating: 4.3,
        price: "₹1500/month",
        facilities: ["Group Classes", "Yoga", "Pilates"],
        distance: 0.5,
        open_hours: "5:00 AM - 9:00 PM",
        phone: "+91 9876543213"
      },
      {
        _id: '5',
        name: "Snap Fitness",
        address: "Kollam",
        latitude: 8.8932,
        longitude: 76.6141,
        rating: 4.6,
        price: "₹2500/month",
        facilities: ["Swimming", "Tennis", "Basketball", "Gym"],
        distance: 1.8,
        open_hours: "6:00 AM - 10:00 PM",
        phone: "+91 9876543214"
      }
    ];

    return mockGyms.filter(gym => gym.distance <= radius);
  }

  // Get nearby trainers from database
  async getNearbyTrainers(radius = 10) {
    try {
      const location = await this.getCurrentLocation();
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`http://localhost:5000/location/nearby-trainers?lat=${location.latitude}&lon=${location.longitude}&radius=${radius}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Failed to fetch trainers'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Successfully fetched trainers:', data.trainers.length);
        return data.trainers;
      } else {
        throw new Error(data.message || 'Failed to fetch trainers');
      }
    } catch (error) {
      console.error('Error getting nearby trainers:', error);
      // Only fallback to mock data if it's a network/API error, not auth error
      if (error.message.includes('Authentication required')) {
        throw error; // Re-throw auth errors
      }
      console.log('Falling back to mock trainers data');
      return this.getMockTrainers(radius);
    }
  }

  // Fallback mock trainers
  getMockTrainers(radius = 10) {
    const mockTrainers = [
      {
        _id: '1',
        name: "Sarah Johnson",
        specialization: "Yoga & Meditation",
        rating: 4.9,
        experience: "8 years",
        price: "₹500/session",
        latitude: 9.9312,
        longitude: 76.2673,
        distance: 0.5,
        certifications: ["RYT-500", "Pilates Certified"],
        availability: "Mon-Fri 6AM-8PM"
      },
      {
        _id: '2',
        name: "Mike Chen",
        specialization: "Strength Training",
        rating: 4.7,
        experience: "12 years",
        price: "₹800/session",
        latitude: 8.5241,
        longitude: 76.9366,
        distance: 1.8,
        certifications: ["NSCA-CPT", "Olympic Lifting"],
        availability: "Mon-Sat 5AM-9PM"
      },
      {
        _id: '3',
        name: "Lisa Martinez",
        specialization: "Cardio & Weight Loss",
        rating: 4.8,
        experience: "6 years",
        price: "₹600/session",
        latitude: 11.2588,
        longitude: 75.7804,
        distance: 1.2,
        certifications: ["ACE-CPT", "Nutrition Specialist"],
        availability: "Mon-Fri 7AM-7PM"
      },
      {
        _id: '4',
        name: "David Kumar",
        specialization: "Functional Training",
        rating: 4.6,
        experience: "10 years",
        price: "₹700/session",
        latitude: 8.8932,
        longitude: 76.6141,
        distance: 2.0,
        certifications: ["NASM-CPT", "Functional Movement"],
        availability: "Mon-Sat 6AM-8PM"
      }
    ];

    return mockTrainers.filter(trainer => trainer.distance <= radius);
  }

  // Get local fitness events from database
  async getLocalEvents(radius = 15) {
    try {
      const location = await this.getCurrentLocation();
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`http://localhost:5000/location/local-events?lat=${location.latitude}&lon=${location.longitude}&radius=${radius}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Failed to fetch events'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Successfully fetched events:', data.events.length);
        // Convert date strings back to Date objects
        return data.events.map(event => ({
          ...event,
          date: new Date(event.date)
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error getting local events:', error);
      // Only fallback to mock data if it's a network/API error, not auth error
      if (error.message.includes('Authentication required')) {
        throw error; // Re-throw auth errors
      }
      console.log('Falling back to mock events data');
      return this.getMockEvents(radius);
    }
  }

  // Fallback mock events
  getMockEvents(radius = 15) {
    const mockEvents = [
      {
        _id: '1',
        title: "Morning Yoga in the Park",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        time: "7:00 AM",
        location: "Marine Drive, Kochi",
        latitude: 9.9312,
        longitude: 76.2673,
        distance: 2.5,
        type: "Yoga",
        participants: 25,
        max_participants: 50,
        price: "Free",
        organizer: "FitHub Community"
      },
      {
        _id: '2',
        title: "5K Fun Run",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        time: "6:00 AM",
        location: "Thiruvananthapuram",
        latitude: 8.5241,
        longitude: 76.9366,
        distance: 1.8,
        type: "Running",
        participants: 120,
        max_participants: 200,
        price: "₹100",
        organizer: "City Running Club"
      },
      {
        _id: '3',
        title: "HIIT Bootcamp",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        time: "6:30 PM",
        location: "Calicut",
        latitude: 11.2588,
        longitude: 75.7804,
        distance: 1.5,
        type: "HIIT",
        participants: 15,
        max_participants: 30,
        price: "₹200",
        organizer: "Elite Fitness"
      },
      {
        _id: '4',
        title: "Cycling Tour",
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        time: "8:00 AM",
        location: "Kollam",
        latitude: 8.8932,
        longitude: 76.6141,
        distance: 2.8,
        type: "Cycling",
        participants: 40,
        max_participants: 60,
        price: "₹150",
        organizer: "Cycling Club"
      }
    ];

    return mockEvents.filter(event => event.distance <= radius);
  }

  // Get gyms by city name
  async getGymsByCity(city, state = 'Kerala') {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`http://localhost:5000/location/gyms-by-city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Failed to fetch gyms'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Successfully fetched ${data.gyms.length} gyms for ${city}, ${state}`);
        return data.gyms;
      } else {
        throw new Error(data.message || 'Failed to fetch gyms');
      }
    } catch (error) {
      console.error('Error getting gyms by city:', error);
      if (error.message.includes('Authentication required')) {
        throw error; // Re-throw auth errors
      }
      // Try real-time OpenStreetMap as a fallback before mock
      try {
        console.log('Falling back to OpenStreetMap (Overpass) gyms search...');
        const osmGyms = await this.getGymsFromOSMByCity(city, state);
        if (osmGyms && osmGyms.length) return osmGyms;
      } catch (e) {
        console.warn('OSM fallback failed:', e);
      }
      console.log('OSM failed or returned no results, falling back to mock gyms for city search');
      return this.getMockGymsByCity(city, state);
    }
  }

  // Get trainers by city name
  async getTrainersByCity(city, state = 'Kerala') {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`http://localhost:5000/location/trainers-by-city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Failed to fetch trainers'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Successfully fetched ${data.trainers.length} trainers for ${city}, ${state}`);
        return data.trainers;
      } else {
        throw new Error(data.message || 'Failed to fetch trainers');
      }
    } catch (error) {
      console.error('Error getting trainers by city:', error);
      if (error.message.includes('Authentication required')) {
        throw error; // Re-throw auth errors
      }
      console.log('Falling back to mock trainers data for city search');
      return this.getMockTrainersByCity(city, state);
    }
  }

  // Get events by city name
  async getEventsByCity(city, state = 'Kerala') {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`http://localhost:5000/location/events-by-city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Failed to fetch events'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Successfully fetched ${data.events.length} events for ${city}, ${state}`);
        // Convert date strings back to Date objects
        return data.events.map(event => ({
          ...event,
          date: new Date(event.date)
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error getting events by city:', error);
      if (error.message.includes('Authentication required')) {
        throw error; // Re-throw auth errors
      }
      console.log('Falling back to mock events data for city search');
      return this.getMockEventsByCity(city, state);
    }
  }

  // Mock data for city-based search
  getMockGymsByCity(city, state) {
    const cityLower = city.toLowerCase();
    const mockGyms = this.getMockGyms(50); // Get all gyms
    
    // Filter by city name in address
    return mockGyms.filter(gym => 
      gym.address.toLowerCase().includes(cityLower) ||
      (cityLower.includes('kochi') && gym.address.toLowerCase().includes('kochi')) ||
      (cityLower.includes('thiruvananthapuram') && gym.address.toLowerCase().includes('thiruvananthapuram')) ||
      (cityLower.includes('calicut') && gym.address.toLowerCase().includes('calicut')) ||
      (cityLower.includes('kollam') && gym.address.toLowerCase().includes('kollam')) ||
      (cityLower.includes('kottayam') && gym.address.toLowerCase().includes('kottayam'))
    );
  }

  getMockTrainersByCity(city, state) {
    const cityLower = city.toLowerCase();
    const mockTrainers = this.getMockTrainers(50); // Get all trainers
    
    // Filter by city (using coordinates as proxy for city)
    return mockTrainers.filter(trainer => {
      if (cityLower.includes('kochi')) {
        return trainer.latitude === 9.9312 && trainer.longitude === 76.2673;
      } else if (cityLower.includes('thiruvananthapuram')) {
        return trainer.latitude === 8.5241 && trainer.longitude === 76.9366;
      } else if (cityLower.includes('calicut')) {
        return trainer.latitude === 11.2588 && trainer.longitude === 75.7804;
      } else if (cityLower.includes('kollam')) {
        return trainer.latitude === 8.8932 && trainer.longitude === 76.6141;
      } else if (cityLower.includes('kottayam')) {
        return trainer.latitude === 9.5916 && trainer.longitude === 76.5222;
      }
      return true; // Return all if city not recognized
    });
  }

  getMockEventsByCity(city, state) {
    const cityLower = city.toLowerCase();
    const mockEvents = this.getMockEvents(50); // Get all events
    
    // Filter by city name in location
    return mockEvents.filter(event => 
      event.location.toLowerCase().includes(cityLower) ||
      cityLower.includes('kochi') && event.location.toLowerCase().includes('kochi') ||
      cityLower.includes('thiruvananthapuram') && event.location.toLowerCase().includes('thiruvananthapuram') ||
      cityLower.includes('calicut') && event.location.toLowerCase().includes('calicut') ||
      cityLower.includes('kollam') && event.location.toLowerCase().includes('kollam') ||
      cityLower.includes('kottayam') && event.location.toLowerCase().includes('kottayam')
    );
  }

  // Get weather-based workout suggestions
  async getWeatherBasedSuggestions() {
    try {
      const location = await this.getCurrentLocation();
      
      // Mock weather API call - replace with real weather API
      const weatherData = {
        temperature: 28,
        condition: "sunny",
        humidity: 65,
        windSpeed: 12
      };

      const suggestions = [];

      if (weatherData.temperature > 30) {
        suggestions.push({
          type: "indoor",
          activities: ["Swimming", "Gym workout", "Indoor cycling"],
          reason: "Hot weather - stay cool indoors"
        });
      } else if (weatherData.temperature < 15) {
        suggestions.push({
          type: "indoor",
          activities: ["Hot yoga", "Sauna", "Indoor cardio"],
          reason: "Cold weather - warm up indoors"
        });
      } else {
        suggestions.push({
          type: "outdoor",
          activities: ["Running", "Cycling", "Outdoor yoga", "Hiking"],
          reason: "Perfect weather for outdoor activities"
        });
      }

      if (weatherData.condition === "rainy") {
        suggestions.push({
          type: "indoor",
          activities: ["Indoor workout", "Yoga", "Dancing"],
          reason: "Rainy weather - indoor activities recommended"
        });
      }

      return {
        weather: weatherData,
        suggestions
      };
    } catch (error) {
      console.error('Error getting weather suggestions:', error);
      return { weather: null, suggestions: [] };
    }
  }

  // Check if location permission is granted
  async checkLocationPermission() {
    if (!navigator.permissions) {
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'unknown';
    }
  }

  // Request location permission
  async requestLocationPermission() {
    try {
      const location = await this.getCurrentLocation();
      return { granted: true, location };
    } catch (error) {
      return { granted: false, error: error.message };
    }
  }
  
  // ---------- OpenStreetMap integration (Nominatim + Overpass) ----------
  async getGymsFromOSMByCity(city, state = 'Kerala, India') {
    // 1) Resolve the city/district bounding box using Nominatim
    const bbox = await this._nominatimCityBBox(`${city}, ${state}`);
    if (!bbox) return [];

    // 2) Query Overpass for gyms within bbox
    const elements = await this._overpassGymsInBBox(bbox);
    if (!elements || !elements.length) return [];

    // 3) Normalize to app gym schema and compute distance
    const current = await this.getCurrentLocation().catch(() => null);
    const gyms = elements.map((el, idx) => this._normalizeOSMGym(el, idx, current));

    // Deduplicate by name/address if needed
    const seen = new Set();
    const unique = [];
    for (const g of gyms) {
      const key = `${(g.name || '').toLowerCase()}|${(g.address || '').toLowerCase()}|${g.latitude?.toFixed?.(5)},${g.longitude?.toFixed?.(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(g);
    }

    // Sort by distance if available
    unique.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return unique;
  }

  async _nominatimCityBBox(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // A descriptive UA helps with Nominatim policy; Referer will be set by the browser
        'User-Agent': 'FitHub-Portal/1.0 (Location Features)'
      }
    });
    if (!resp.ok) return null;
    const json = await resp.json().catch(() => []);
    if (!json || !json.length) return null;
    const item = json[0];
    // Nominatim bbox comes as [south, north, west, east] in some docs, but API commonly returns [south, north, west, east]
    if (!item?.boundingbox) return null;
    const bbox = {
      south: parseFloat(item.boundingbox[0]),
      north: parseFloat(item.boundingbox[1]),
      west: parseFloat(item.boundingbox[2]),
      east: parseFloat(item.boundingbox[3])
    };
    if ([bbox.south, bbox.north, bbox.west, bbox.east].some((n) => Number.isNaN(n))) return null;
    return bbox;
  }

  async _overpassGymsInBBox(bbox) {
    // Overpass QL: search for amenity=gym or leisure=fitness_centre
    const q = `
      [out:json][timeout:25];
      (
        node["amenity"="gym"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        way["amenity"="gym"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        relation["amenity"="gym"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        node["leisure"="fitness_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        way["leisure"="fitness_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        relation["leisure"="fitness_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      );
      out center tags 200;`;

    const resp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({ data: q })
    });
    if (!resp.ok) return [];
    const json = await resp.json().catch(() => ({}));
    return json.elements || [];
  }

  _normalizeOSMGym(el, index, current) {
    const tags = el.tags || {};
    // For ways/relations, Overpass returns a "center" with lat/lon
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    const name = tags.name || 'Gym';
    const addressParts = [
      tags['addr:housename'],
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:suburb'],
      tags['addr:district'] || tags['addr:county'],
      tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    ].filter(Boolean);
    const address = addressParts.join(', ');

    // Fake rating/price if absent to satisfy UI layout
    const rating = 4.2 + (index % 6) * 0.1; // 4.2 - 4.7
    const price = tags.fee === 'yes' ? 'Paid' : 'Free/Unknown';

    // Infer some facilities from tags
    const facilities = [];
    if (tags.sauna === 'yes') facilities.push('Sauna');
    if (tags.pool === 'yes' || tags.swimming_pool === 'yes') facilities.push('Pool');
    if (tags.yoga === 'yes') facilities.push('Yoga');
    if (tags['changing_rooms'] === 'yes') facilities.push('Changing Rooms');
    if (!facilities.length) facilities.push('Gym');

    const distance = (current && lat && lon)
      ? this.calculateDistance(current.latitude, current.longitude, lat, lon)
      : undefined;

    return {
      _id: String(el.id),
      id: String(el.id),
      name,
      address: address || (tags['addr:full'] || 'Address not available'),
      latitude: lat,
      longitude: lon,
      rating: Number(rating.toFixed(1)),
      price,
      facilities,
      distance,
      open_hours: tags.opening_hours || 'Timing not listed',
      phone: tags.phone || tags['contact:phone'] || undefined,
      source: 'osm'
    };
  }
}

// Create and export a singleton instance
const locationService = new LocationService();
export default locationService;

// Export the class for custom instances
export { LocationService };


