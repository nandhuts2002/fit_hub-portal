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
  DollarSign,
  Filter,
  Search,
  RefreshCw,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Wind
} from 'lucide-react';
import locationService from '../utils/locationService';
import exerciseApi from '../utils/exerciseApi';
import GymDetailsModal from '../components/GymDetailsModal';
import EventDetailsModal from '../components/EventDetailsModal';
import SessionManager from '../utils/sessionManager';

const LocationFeaturesPage = () => {
  const [activeTab, setActiveTab] = useState('gyms');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyGyms, setNearbyGyms] = useState([]);
  const [nearbyTrainers, setNearbyTrainers] = useState([]);
  const [localEvents, setLocalEvents] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Kochi');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedGym, setSelectedGym] = useState(null);
  const [mapView, setMapView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showGymModal, setShowGymModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Load location and nearby data
  useEffect(() => {
    loadLocationData();
  }, []);

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

  const loadWeatherData = async () => {
    try {
      const weather = await locationService.getWeatherBasedSuggestions();
      setWeatherData(weather);
    } catch (err) {
      console.error('Error loading weather:', err);
    }
  };

  const handleCityChange = async (newCity) => {
    setSelectedCity(newCity);
    setLoading(true);
    setError(null);
    
    try {
      // Load data for the new city directly
      const [gyms, trainers, events] = await Promise.all([
        locationService.getRealGymsByCity(newCity),
        locationService.getTrainersByCity(newCity),
        locationService.getEventsByCity(newCity)
      ]);
      
      setNearbyGyms(gyms);
      setNearbyTrainers(trainers);
      setLocalEvents(events);
    } catch (err) {
      console.error('Error loading city data:', err);
      setError('Failed to load data for the selected city.');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-500" />;
      default: return <Cloud className="w-6 h-6 text-gray-500" />;
    }
  };

  const filteredGyms = nearbyGyms.filter(gym => 
    gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrainers = nearbyTrainers.filter(trainer => 
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = localEvents.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.type.toLowerCase().includes(searchTerm.toLowerCase())
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
                <span>City: {selectedCity}</span>
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
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Weather & Workout Suggestions</h3>
              {getWeatherIcon(weatherData.weather?.condition)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Thermometer className="w-5 h-5 text-red-500" />
                <span className="text-gray-600">Temperature: {weatherData.weather?.temperature}°C</span>
              </div>
              <div className="flex items-center gap-3">
                <Wind className="w-5 h-5 text-blue-500" />
                <span className="text-gray-600">Wind: {weatherData.weather?.windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Humidity: {weatherData.weather?.humidity}%</span>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Recommended Activities:</h4>
              <div className="flex flex-wrap gap-2">
                {weatherData.suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 mb-1">{suggestion.reason}</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.activities.map((activity, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'gyms', label: 'Nearby Gyms', icon: MapPin },
            { id: 'trainers', label: 'Trainers', icon: Users },
            { id: 'events', label: 'Events', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
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
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Kochi">Kochi</option>
                <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                <option value="Calicut">Calicut</option>
                <option value="Kollam">Kollam</option>
                <option value="Kottayam">Kottayam</option>
                <option value="Thrissur">Thrissur</option>
                <option value="Palakkad">Palakkad</option>
                <option value="Kannur">Kannur</option>
                <option value="Kasargod">Kasargod</option>
                <option value="Kattappana">Kattappana</option>
                <option value="Mundakayam">Mundakayam</option>
                <option value="Kanjirappally">Kanjirappally</option>
              </select>

              <button
                type="button"
                onClick={() => setMapView(v => !v)}
                className={`px-3 py-2 rounded-lg border ${mapView ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} hover:shadow-sm transition`}
                title="Toggle Map View"
              >
                {mapView ? 'Map View: On' : 'Map View: Off'}
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
                      key={gym.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{gym.name}</h3>
                          <p className="text-gray-600 text-sm">{gym.address}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{gym.rating}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation className="w-4 h-4" />
                          <span>{locationService.formatDistance(gym.distance)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{gym.open_hours || gym.openHours}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{gym.price}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Facilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {gym.facilities.map((facility, index) => (
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
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${gym.longitude-0.01}%2C${gym.latitude-0.01}%2C${gym.longitude+0.01}%2C${gym.latitude+0.01}&layer=mapnik&marker=${gym.latitude}%2C${gym.longitude}`}
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
                      key={trainer.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{trainer.name}</h3>
                          <p className="text-gray-600 text-sm">{trainer.specialization}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{trainer.rating}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation className="w-4 h-4" />
                          <span>{locationService.formatDistance(trainer.distance)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{trainer.experience}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{trainer.price}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Certifications:</p>
                        <div className="flex flex-wrap gap-1">
                          {trainer.certifications.map((cert, index) => (
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
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-gray-600 text-sm">{event.location}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {event.type}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation className="w-4 h-4" />
                          <span>{locationService.formatDistance(event.distance)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{event.participants}/{event.max_participants || event.maxParticipants} participants</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Organized by: {event.organizer}</p>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">{event.price}</span>
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


