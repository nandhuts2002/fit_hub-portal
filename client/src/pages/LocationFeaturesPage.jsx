import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Clock,
  Star,
  Phone,
  Calendar,
  Users,
  Filter,
  Search,
  RefreshCw,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Wind,
  Ticket
} from 'lucide-react';
import locationService from '../utils/locationService';
import exerciseApi from '../utils/exerciseApi';
import GymDetailsModal from '../components/GymDetailsModal';
import EventDetailsModal from '../components/EventDetailsModal';
import SessionManager from '../utils/sessionManager';

// District and city data structure
const DISTRICTS_AND_CITIES = {
  'Kottayam': [
    'Kanjirappally', 'Kottayam', 'Pala', 'Changanassery', 'Vaikom', 'Erattupetta',
    'Mundakayam', 'Kattappana', 'Kumily', 'Peermade', 'Thodupuzha', 'Idukki'
  ],
  'Ernakulam': [
    'Kochi', 'Aluva', 'Kalamassery', 'Perumbavoor', 'Muvattupuzha', 'Kothamangalam',
    'North Paravur', 'Angamaly', 'Kakkanad', 'Edappally', 'Fort Kochi', 'Mattancherry'
  ],
  'Thiruvananthapuram': [
    'Thiruvananthapuram', 'Neyyattinkara', 'Attingal', 'Nedumangad', 'Varkala',
    'Parassala', 'Kazhakuttam', 'Kovalam', 'Ponmudi', 'Kattakada'
  ],
  'Kozhikode': [
    'Kozhikode', 'Vadakara', 'Koyilandy', 'Ramanattukara', 'Feroke', 'Mukkam',
    'Koduvally', 'Balussery', 'Perambra', 'Thamarassery'
  ],
  'Kollam': [
    'Kollam', 'Punalur', 'Karunagappally', 'Kottarakkara', 'Pathanapuram',
    'Chavara', 'Kundara', 'Sasthamkotta', 'Chadayamangalam', 'Anchal'
  ],
  'Thrissur': [
    'Thrissur', 'Guruvayur', 'Kodungallur', 'Irinjalakuda', 'Chalakudy',
    'Wadakkancherry', 'Chavakkad', 'Mala', 'Kunnamkulam', 'Chelakkara'
  ],
  'Palakkad': [
    'Palakkad', 'Ottapalam', 'Mannarkkad', 'Alathur', 'Chittur', 'Pattambi',
    'Shoranur', 'Kozhinjampara', 'Malampuzha', 'Kollengode'
  ],
  'Kannur': [
    'Kannur', 'Thalassery', 'Payyannur', 'Iritty', 'Koothuparamba', 'Mattannur',
    'Peravoor', 'Sreekandapuram', 'Koothuparamba', 'Cherukunnu'
  ],
  'Kasaragod': [
    'Kasaragod', 'Kanhangad', 'Manjeshwaram', 'Hosdurg', 'Vellarikundu',
    'Cheruvathur', 'Kumbala', 'Nileshwaram', 'Uppala', 'Bedadka'
  ],
  'Malappuram': [
    'Malappuram', 'Manjeri', 'Perinthalmanna', 'Tirur', 'Ponnani', 'Kottakkal',
    'Tirurangadi', 'Nilambur', 'Wandoor', 'Kondotty'
  ],
  'Wayanad': [
    'Kalpetta', 'Sultan Bathery', 'Mananthavady', 'Pulpally', 'Vythiri',
    'Ambalavayal', 'Meppadi', 'Panamaram', 'Kambalakkad', 'Thirunelli'
  ],
  'Alappuzha': [
    'Alappuzha', 'Cherthala', 'Mavelikkara', 'Chengannur', 'Kayamkulam',
    'Haripad', 'Aroor', 'Kuttanad', 'Karthikappally', 'Thiruvalla'
  ],
  'Pathanamthitta': [
    'Pathanamthitta', 'Adoor', 'Ranni', 'Kozhencherry', 'Mallappally',
    'Pandalam', 'Konni', 'Thiruvalla', 'Aranmula', 'Elanthoor'
  ],
  'Idukki': [
    'Painavu', 'Thodupuzha', 'Munnar', 'Devikulam', 'Udumbanchola',
    'Idukki', 'Peerumade', 'Kattappana', 'Nedumkandam', 'Vagamon'
  ]
};

const LocationFeaturesPage = () => {
  const [activeTab, setActiveTab] = useState('gyms');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyGyms, setNearbyGyms] = useState([]);
  const [nearbyTrainers, setNearbyTrainers] = useState([]);
  const [localEvents, setLocalEvents] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('Kottayam');
  const [selectedCity, setSelectedCity] = useState('Kanjirappally');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [mapView, setMapView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showGymModal, setShowGymModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Get filtered cities based on search term
  const getFilteredCities = () => {
    const cities = DISTRICTS_AND_CITIES[selectedDistrict] || [];
    if (!citySearchTerm) return cities;
    return cities.filter(city =>
      city.toLowerCase().includes(citySearchTerm.toLowerCase())
    );
  };

  // Handle district change
  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    const cities = DISTRICTS_AND_CITIES[district] || [];
    if (cities.length > 0) {
      setSelectedCity(cities[0]);
    }
    setCitySearchTerm('');
    setShowCityDropdown(false);
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCitySearchTerm(city);
    setShowCityDropdown(false);
  };

  // Load location and nearby data
  useEffect(() => {
    loadLocationData();
  }, []);

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCityDropdown && !event.target.closest('.city-dropdown-container')) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCityDropdown]);

  // Regenerate weather suggestions when gyms, trainers, or events change
  useEffect(() => {
    if (weatherData && (nearbyGyms.length > 0 || nearbyTrainers.length > 0 || localEvents.length > 0)) {
      const dynamicSuggestions = generateDynamicSuggestions(weatherData, nearbyGyms, nearbyTrainers, localEvents);
      setWeatherData(prev => ({
        ...prev,
        suggestions: dynamicSuggestions
      }));
    }
  }, [nearbyGyms, nearbyTrainers, localEvents, selectedCity]);

  const loadLocationData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check authentication first
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;
      console.log('Token found:', !!token);
      if (!token) {
        setError('Please log in to access location features.');
        return;
      }

      // Get current location
      const location = await locationService.getCurrentLocation();
      console.log('Current location:', location);
      setCurrentLocation(location);

      // Load nearby data
      await Promise.all([
        loadNearbyGyms(selectedCity),
        loadNearbyTrainers(selectedCity),
        loadLocalEvents(selectedCity),
        loadWeatherData()
      ]);
    } catch (err) {
      if (err.message.includes('Authentication required') || err.message.includes('log in')) {
        setError('Please log in to access location features.');
      } else {
        setError('Unable to access your location. Please enable location services.');
      }
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyGyms = async (city = selectedCity) => {
    try {
      console.log('Loading gyms for city:', city);
      const gyms = await locationService.getRealGymsByCity(city);
      console.log('Loaded gyms:', gyms);
      setNearbyGyms(gyms);
    } catch (err) {
      console.error('Error loading gyms:', err);
    }
  };

  const loadNearbyTrainers = async (city = selectedCity) => {
    try {
      const trainers = await locationService.getTrainersByCity(city);
      setNearbyTrainers(trainers);
    } catch (err) {
      console.error('Error loading trainers:', err);
    }
  };

  const loadLocalEvents = async (city = selectedCity) => {
    try {
      const events = await locationService.getEventsByCity(city);
      setLocalEvents(events);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  const loadWeatherData = async (city = selectedCity) => {
    try {
      // Pass the selected city to get city-specific weather
      const weather = await locationService.getWeatherBasedSuggestions(city);

      // Generate dynamic suggestions based on available data
      const dynamicSuggestions = generateDynamicSuggestions(weather, nearbyGyms, nearbyTrainers, localEvents);

      setWeatherData({
        ...weather,
        suggestions: dynamicSuggestions
      });
    } catch (err) {
      console.error('Error loading weather:', err);
    }
  };

  // Generate dynamic suggestions based on available gyms, trainers, and events
  const generateDynamicSuggestions = (weather, gyms, trainers, events) => {
    const suggestions = [];

    // Get current time and day
    const now = new Date();
    const currentHour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Temperature-based suggestions
    const temp = weather?.weather?.temperature || 25;
    const condition = weather?.weather?.condition?.toLowerCase() || 'clear';

    if (temp > 30) {
      suggestions.push({
        reason: `It's hot (${temp}°C) - perfect for indoor workouts!`,
        activities: [
          ...(gyms.length > 0 ? [`Visit ${gyms[0].name}`, 'Air-conditioned gym workout'] : []),
          ...(trainers.length > 0 ? [`Book with ${trainers[0].name}`] : []),
          'Indoor yoga session',
          'Swimming pool workout'
        ].filter(Boolean)
      });
    } else if (temp < 20) {
      suggestions.push({
        reason: `Cool weather (${temp}°C) - great for outdoor activities!`,
        activities: [
          'Morning jog in the park',
          'Outdoor yoga session',
          'Cycling around the city',
          ...(events.length > 0 ? [`Join ${events[0].title}`] : [])
        ].filter(Boolean)
      });
    } else {
      suggestions.push({
        reason: `Perfect temperature (${temp}°C) - ideal for any workout!`,
        activities: [
          ...(gyms.length > 0 ? [`Visit ${gyms[0].name}`] : []),
          ...(trainers.length > 0 ? [`Train with ${trainers[0].name}`] : []),
          'Outdoor running',
          'Mixed workout session'
        ].filter(Boolean)
      });
    }

    // Time-based suggestions
    if (currentHour >= 6 && currentHour <= 10) {
      suggestions.push({
        reason: 'Morning energy boost time!',
        activities: [
          'Morning yoga',
          'Light cardio',
          ...(gyms.length > 0 ? ['Early gym session'] : []),
          'Fresh air walk'
        ]
      });
    } else if (currentHour >= 17 && currentHour <= 20) {
      suggestions.push({
        reason: 'Evening workout time - perfect for stress relief!',
        activities: [
          ...(gyms.length > 0 ? ['Evening gym session'] : []),
          ...(trainers.length > 0 ? ['Personal training session'] : []),
          'Sunset jog',
          'Group fitness class'
        ]
      });
    }

    // Weather condition-based suggestions
    if (condition.includes('rain') || condition.includes('storm')) {
      suggestions.push({
        reason: 'Rainy weather - stay indoors and stay active!',
        activities: [
          ...(gyms.length > 0 ? [`Indoor workout at ${gyms[0].name}`] : []),
          ...(trainers.length > 0 ? [`Online session with ${trainers[0].name}`] : []),
          'Home workout routine',
          'Indoor cycling'
        ].filter(Boolean)
      });
    } else if (condition.includes('sunny') || condition.includes('clear')) {
      suggestions.push({
        reason: 'Beautiful sunny day - get outside and move!',
        activities: [
          'Outdoor running',
          'Park workout',
          'Beach volleyball',
          ...(events.length > 0 ? [`Join outdoor event: ${events[0].title}`] : [])
        ].filter(Boolean)
      });
    }

    // Weekend-specific suggestions
    if (isWeekend) {
      suggestions.push({
        reason: 'Weekend vibes - time for fun fitness activities!',
        activities: [
          ...(events.length > 0 ? [`Weekend event: ${events[0].title}`] : []),
          'Family fitness activity',
          'Hiking adventure',
          'Recreational sports'
        ].filter(Boolean)
      });
    }

    // Add location-specific suggestions if we have local data
    if (gyms.length > 0 || trainers.length > 0 || events.length > 0) {
      suggestions.push({
        reason: `Local opportunities in ${selectedCity} - make the most of what's available!`,
        activities: [
          ...(gyms.length > 0 ? [`Check out ${gyms.slice(0, 2).map(g => g.name).join(' or ')}`] : []),
          ...(trainers.length > 0 ? [`Connect with ${trainers.slice(0, 2).map(t => t.name).join(' or ')}`] : []),
          ...(events.length > 0 ? [`Join ${events[0].title}`] : [])
        ].filter(Boolean)
      });
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  const handleCityChange = async (newCity) => {
    setSelectedCity(newCity);
    setCitySearchTerm(newCity);
    setLoading(true);
    setError(null);

    try {
      // Load data for the new city directly, including weather
      const [gyms, trainers, events] = await Promise.all([
        locationService.getRealGymsByCity(newCity),
        locationService.getTrainersByCity(newCity),
        locationService.getEventsByCity(newCity)
      ]);

      setNearbyGyms(gyms);
      setNearbyTrainers(trainers);
      setLocalEvents(events);

      // Load weather for the new city
      await loadWeatherData(newCity);
    } catch (err) {
      console.error('Error loading city data:', err);
      setError('Failed to load data for the selected city.');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return <Cloud className="w-6 h-6 text-gray-500" />;

    switch (condition.toLowerCase()) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-500" />;
      default: return <Cloud className="w-6 h-6 text-gray-500" />;
    }
  };

  const filteredGyms = nearbyGyms.filter(gym =>
    (gym.name && gym.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (gym.address && gym.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTrainers = nearbyTrainers.filter(trainer =>
    (trainer.name && trainer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (trainer.specialization && trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEvents = localEvents.filter(event =>
    (event.title && event.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (event.type && event.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading location data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error.includes('log in') ? 'Authentication Required' : 'Location Access Required'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {error.includes('log in') ? (
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            ) : (
              <button
                onClick={loadLocationData}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Location Features</h1>
              <p className="text-gray-600 mt-1">Discover nearby fitness opportunities</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>District: {selectedDistrict} | City: {selectedCity}</span>
              </div>
              <button
                onClick={loadLocationData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Card */}
      {weatherData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Weather & Workout Suggestions</h3>
                  <p className="text-gray-600">
                    {nearbyGyms.length > 0 || nearbyTrainers.length > 0 || localEvents.length > 0
                      ? `Perfect conditions for your fitness journey in ${selectedCity}`
                      : 'Perfect conditions for your fitness journey'
                    }
                  </p>
                  {(nearbyGyms.length > 0 || nearbyTrainers.length > 0 || localEvents.length > 0) && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {nearbyGyms.length > 0 && <span>🏋️ {nearbyGyms.length} gyms nearby</span>}
                      {nearbyTrainers.length > 0 && <span>👨‍💼 {nearbyTrainers.length} trainers available</span>}
                      {localEvents.length > 0 && <span>📅 {localEvents.length} events happening</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg">
                {getWeatherIcon(weatherData.weather?.condition)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Temperature</div>
                  <div className="text-xl font-bold text-gray-900">{weatherData?.weather?.temperature || 'N/A'}°C</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wind className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Wind Speed</div>
                  <div className="text-xl font-bold text-gray-900">{weatherData?.weather?.windSpeed || 'N/A'} km/h</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Humidity</div>
                  <div className="text-xl font-bold text-gray-900">{weatherData?.weather?.humidity || 'N/A'}%</div>
                </div>
              </div>
            </div>

            <div className="bg-white/40 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Recommended Activities
              </h4>
              <div className="space-y-4">
                {(weatherData?.suggestions || []).map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/60 rounded-lg p-4"
                  >
                    <p className="text-gray-700 mb-3 font-medium">{suggestion.reason || 'No reason provided'}</p>
                    <div className="flex flex-wrap gap-2">
                      {(suggestion.activities || []).map((activity, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {activity}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 p-1 sm:p-2 rounded-2xl shadow-sm">
          {[
            { id: 'gyms', label: 'Gyms', icon: MapPin, color: 'blue' },
            { id: 'trainers', label: 'Trainers', icon: Users, color: 'green' },
            { id: 'events', label: 'Events', icon: Calendar, color: 'purple' },
            { id: 'tickets', label: 'Tickets', icon: Ticket, color: 'orange' }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 rounded-xl font-semibold transition-all duration-200 ${activeTab === tab.id
                ? `bg-white text-${tab.color}-600 shadow-lg border-2 border-${tab.color}-200`
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${activeTab === tab.id
                ? `bg-${tab.color}-100`
                : 'bg-gray-200'
                }`}>
                <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === tab.id
                  ? `text-${tab.color}-600`
                  : 'text-gray-500'
                  }`} />
              </div>
              <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              {/* District Selection */}
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium min-w-[140px]"
                >
                  {Object.keys(DISTRICTS_AND_CITIES).map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              {/* City Search Dropdown */}
              <div className="relative city-dropdown-container">
                <div className="relative">
                  <input
                    type="text"
                    value={citySearchTerm}
                    onChange={(e) => {
                      setCitySearchTerm(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Search city..."
                    className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 min-w-[200px]"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                {/* City Dropdown */}
                {showCityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {getFilteredCities().length > 0 ? (
                      getFilteredCities().map(city => (
                        <button
                          key={city}
                          onClick={() => handleCitySelect(city)}
                          className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${city === selectedCity ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'
                            }`}
                        >
                          {city}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">No cities found</div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMapView(v => !v)}
                className={`px-4 py-2 rounded-lg border font-medium transition-all ${mapView
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:shadow-sm'
                  }`}
                title="Toggle Map View"
              >
                <div className="flex items-center gap-2">
                  {mapView ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Map View: On
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Map View: Off
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'gyms' && (
            <motion.div
              key="gyms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">Gyms in {selectedCity}</h2>
              {filteredGyms.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No gyms found in {selectedCity}</h3>
                  <p className="text-gray-600">Try selecting a different city</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGyms.map((gym) => (
                    <motion.div
                      key={gym._id || gym.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{gym.name || 'Unnamed Gym'}</h3>
                          <p className="text-gray-600 text-sm">{gym.address || 'Address not available'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{gym.rating || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation className="w-4 h-4" />
                          <span>{gym.distance ? locationService.formatDistance(gym.distance) : 'Distance unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{gym.open_hours || gym.openHours || 'Hours not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-base font-bold text-green-600">₹</span>
                          <span>{gym.price || 'Price not specified'}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Facilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {(gym.facilities || []).map((facility, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedGym(gym);
                            setShowGymModal(true);
                          }}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${gym.latitude}&mlon=${gym.longitude}#map=16/${gym.latitude}/${gym.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Open in OpenStreetMap"
                        >
                          <MapPin className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${gym.latitude},${gym.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Open in Google Maps"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>

                      {mapView && gym.latitude && gym.longitude && (
                        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                          <iframe
                            title={`map-${gym.id}`}
                            width="100%"
                            height="220"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${gym.longitude - 0.01}%2C${gym.latitude - 0.01}%2C${gym.longitude + 0.01}%2C${gym.latitude + 0.01}&layer=mapnik&marker=${gym.latitude}%2C${gym.longitude}`}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'trainers' && (
            <motion.div
              key="trainers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">Trainers in {selectedCity}</h2>
              {filteredTrainers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No trainers found in {selectedCity}</h3>
                  <p className="text-gray-600">Try selecting a different city</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTrainers.map((trainer) => (
                    <motion.div
                      key={trainer._id || trainer.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{trainer.name || 'Unnamed Trainer'}</h3>
                          <p className="text-gray-600 text-sm">{trainer.specialization || 'Specialization not specified'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{trainer.rating || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation className="w-4 h-4" />
                          <span>{trainer.distance ? locationService.formatDistance(trainer.distance) : 'Distance unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{trainer.experience || 'Experience not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-base font-bold text-green-600">₹</span>
                          <span>{trainer.price || 'Price not specified'}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Certifications:</p>
                        <div className="flex flex-wrap gap-1">
                          {(trainer.certifications || []).map((cert, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                          Book Session
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">Events in {selectedCity}</h2>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found in {selectedCity}</h3>
                  <p className="text-gray-600">Try selecting a different city</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event._id || event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{event.title || 'Untitled Event'}</h3>
                          <p className="text-gray-600 text-sm">{event.location || 'Location not specified'}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {event.type || 'Type not specified'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date ? new Date(event.date).toLocaleDateString() : 'Date not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{event.time || 'Time not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation className="w-4 h-4" />
                          <span>{event.distance ? locationService.formatDistance(event.distance) : 'Distance unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{(event.participants || 0)}/{event.max_participants || event.maxParticipants || 'N/A'} participants</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Organized by: {event.organizer || 'Organizer not specified'}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-green-600">₹</span>
                          <span className="text-sm font-medium text-green-600">{event.price || 'Price not specified'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventModal(true);
                          }}
                          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Join Event
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tickets' && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Ticket className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">My Event Tickets</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Access your event tickets and manage your bookings from the dedicated tickets page.
                </p>
                <button
                  onClick={() => window.location.href = '/my-tickets'}
                  className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-lg"
                >
                  Go to My Tickets
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <GymDetailsModal
        gym={selectedGym}
        isOpen={showGymModal}
        onClose={() => {
          setShowGymModal(false);
          setSelectedGym(null);
        }}
      />

      <EventDetailsModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default LocationFeaturesPage;


