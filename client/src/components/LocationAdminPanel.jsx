import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Search,
  Filter,
  X
} from 'lucide-react';
import SessionManager from '../utils/sessionManager';
import api from '../utils/api';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://fit-hub-portal-1.onrender.com';

const LocationAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('gyms');
  const [gyms, setGyms] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [gymForm, setGymForm] = useState({
    name: '',
    address: '',
    city: 'Kochi',
    state: 'Kerala',
    phone: '',
    price: '',
    rating: 0,
    facilities: [],
    open_hours: '24/7',
    description: ''
  });

  // Location validation state
  const [locationValidation, setLocationValidation] = useState(null);
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);

  const [trainerForm, setTrainerForm] = useState({
    email: '',
    latitude: '',
    longitude: '',
    price: '',
    rating: 0,
    experience: '',
    certifications: [],
    bio: '',
    specialization: ''
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    city: 'Kochi',
    state: 'Kerala',
    date: '',
    time: '',
    max_participants: '',
    price: '',
    type: 'fitness',
    organizer: 'Fit-Hub'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Geocode and validate address function
  const geocodeAndValidateAddress = async (address, city, state) => {
    try {
      setIsValidatingLocation(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/location/geocode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
          city,
          state
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update validation state
        setLocationValidation({
          isValidating: false,
          confidence: data.confidence,
          source: data.source,
          validation: data.validation,
          coordinates: {
            latitude: data.latitude,
            longitude: data.longitude
          },
          formatted_address: data.formatted_address
        });

        return {
          latitude: data.latitude,
          longitude: data.longitude,
          formatted_address: data.formatted_address,
          confidence: data.confidence,
          validation: data.validation
        };
      } else {
        setLocationValidation({
          isValidating: false,
          error: data.message,
          suggestions: data.suggestions || []
        });
        throw new Error(data.message || 'Geocoding failed');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationValidation({
        isValidating: false,
        error: error.message
      });
      throw error;
    } finally {
      setIsValidatingLocation(false);
    }
  };

  // Manual location validation
  const validateLocation = async (latitude, longitude, city, state) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/location/validate-location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude,
          longitude,
          city,
          state
        })
      });

      const data = await response.json();

      if (data.success) {
        setLocationValidation(prev => ({
          ...prev,
          validation: data.validation
        }));
        return data.validation;
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
    return null;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;

      if (activeTab === 'gyms') {
        const response = await api.get('/location/admin/gyms', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGyms(response.data.gyms || []);
      } else if (activeTab === 'trainers') {
        const response = await api.get('/location/admin/trainers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrainers(response.data.trainers || []);
      } else if (activeTab === 'events') {
        const response = await api.get('/location/admin/events', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(response.data.events || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to load data. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;

      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please login again.' });
        return;
      }

      if (activeTab === 'gyms') {
        // First validate the location
        try {
          const locationResult = await geocodeAndValidateAddress(
            gymForm.address,
            gymForm.city,
            gymForm.state
          );

          // Submit gym data with validated location
          const response = await api.post('/location/admin/gyms', gymForm, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            const locationInfo = response.data.location_info;
            let successMessage = 'Gym created successfully!';

            if (locationInfo) {
              successMessage += ` (Confidence: ${Math.round(locationInfo.confidence * 100)}%`;

              if (!locationInfo.validated) {
                successMessage += ' - Location may need verification';
              }
              successMessage += ')';
            }

            setMessage({ type: 'success', text: successMessage });
            setShowForm(false);
            resetGymForm();
            setLocationValidation(null);
            loadData();
          } else {
            setMessage({ type: 'error', text: response.data.message || 'Failed to create gym' });
          }
        } catch (error) {
          // Location validation failed
          setMessage({
            type: 'error',
            text: error.message || 'Location validation failed. Please check the address and try again.'
          });
        }
      } else if (activeTab === 'trainers') {
        const response = await api.post('/location/admin/trainers', trainerForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setMessage({ type: 'success', text: 'Trainer updated successfully!' });
          setShowForm(false);
          resetTrainerForm();
          loadData();
        } else {
          setMessage({ type: 'error', text: response.data.message || 'Failed to update trainer' });
        }
      } else if (activeTab === 'events') {
        const response = await api.post('/location/admin/events', eventForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setMessage({ type: 'success', text: 'Event created successfully!' });
          setShowForm(false);
          resetEventForm();
          loadData();
        } else {
          setMessage({ type: 'error', text: response.data.message || 'Failed to create event' });
        }
      }
    } catch (error) {
      console.error('Error creating item:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'An error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const currentUser = SessionManager.getCurrentUser();
      const token = currentUser?.token;

      if (activeTab === 'gyms') {
        await api.delete(`/location/admin/gyms/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (activeTab === 'trainers') {
        await api.delete(`/location/admin/trainers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (activeTab === 'events') {
        await api.delete(`/location/admin/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const resetGymForm = () => {
    setGymForm({
      name: '',
      address: '',
      city: 'Kochi',
      state: 'Kerala',
      phone: '',
      price: '',
      rating: 0,
      facilities: [],
      open_hours: '24/7',
      description: ''
    });
    setLocationValidation(null);
  };

  const resetTrainerForm = () => {
    setTrainerForm({
      email: '',
      latitude: '',
      longitude: '',
      price: '',
      rating: 0,
      experience: '',
      certifications: [],
      bio: '',
      specialization: ''
    });
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      location: '',
      city: 'Kochi',
      state: 'Kerala',
      date: '',
      time: '',
      max_participants: '',
      price: '',
      type: 'fitness',
      organizer: 'Fit-Hub'
    });
  };

  const filteredData = () => {
    const data = activeTab === 'gyms' ? gyms : activeTab === 'trainers' ? trainers : events;
    return data.filter(item => {
      const searchFields = activeTab === 'gyms' ? ['name', 'address'] :
                          activeTab === 'trainers' ? ['name', 'specialization'] :
                          ['title', 'location'];
      
      return searchFields.some(field => 
        item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const renderForm = () => {
    if (activeTab === 'gyms') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📍 Location:</strong> Just enter the address, city, and state. Coordinates will be found automatically!
              <br />
              <strong>Examples:</strong> "Marine Drive, Kochi", "MG Road, Thiruvananthapuram", "Railway Station, Calicut"
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Gym Name"
              value={gymForm.name}
              onChange={(e) => setGymForm({...gymForm, name: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Address (e.g., Marine Drive, Kochi or MG Road, Thiruvananthapuram)"
              value={gymForm.address}
              onChange={(e) => setGymForm({...gymForm, address: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="City"
              value={gymForm.city}
              onChange={(e) => setGymForm({...gymForm, city: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="State"
              value={gymForm.state}
              onChange={(e) => setGymForm({...gymForm, state: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={gymForm.phone}
              onChange={(e) => setGymForm({...gymForm, phone: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Price"
              value={gymForm.price}
              onChange={(e) => setGymForm({...gymForm, price: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Rating"
              value={gymForm.rating}
              onChange={(e) => setGymForm({...gymForm, rating: parseFloat(e.target.value)})}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Open Hours"
              value={gymForm.open_hours}
              onChange={(e) => setGymForm({...gymForm, open_hours: e.target.value})}
              className="border rounded px-3 py-2"
            />
          </div>
          <textarea
            placeholder="Description"
            value={gymForm.description}
            onChange={(e) => setGymForm({...gymForm, description: e.target.value})}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />

          {/* Location Validation Section */}
          {gymForm.address && gymForm.city && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">📍 Location Preview</h4>
                <button
                  type="button"
                  onClick={() => geocodeAndValidateAddress(gymForm.address, gymForm.city, gymForm.state)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={isValidatingLocation}
                >
                  {isValidatingLocation ? 'Validating...' : 'Validate Location'}
                </button>
              </div>

              {locationValidation && (
                <div className="space-y-2">
                  {locationValidation.error ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-800 text-sm font-medium">⚠️ Location Error</p>
                      <p className="text-red-700 text-sm">{locationValidation.error}</p>
                      {locationValidation.suggestions && locationValidation.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-700 text-sm font-medium">Suggestions:</p>
                          <ul className="text-red-600 text-sm list-disc list-inside">
                            {locationValidation.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Confidence:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-20 h-2 bg-gray-200 rounded">
                            <div
                              className={`h-2 rounded ${
                                locationValidation.confidence > 0.7 ? 'bg-green-500' :
                                locationValidation.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${locationValidation.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${
                            locationValidation.confidence > 0.7 ? 'text-green-600' :
                            locationValidation.confidence > 0.4 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {Math.round(locationValidation.confidence * 100)}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">({locationValidation.source})</span>
                      </div>

                      {locationValidation.validation && (
                        <div className={`p-2 rounded text-sm ${
                          locationValidation.validation.is_accurate ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
                        }`}>
                          <p className="font-medium">
                            {locationValidation.validation.is_accurate ? '✅' : '⚠️'} {locationValidation.validation.message}
                          </p>
                        </div>
                      )}

                      {locationValidation.formatted_address && (
                        <div className="p-2 bg-blue-50 rounded text-sm">
                          <p className="font-medium text-blue-800">📍 Found Address:</p>
                          <p className="text-blue-700">{locationValidation.formatted_address}</p>
                          {locationValidation.coordinates && (
                            <p className="text-blue-600 text-xs mt-1">
                              Coordinates: {locationValidation.coordinates.latitude.toFixed(6)}, {locationValidation.coordinates.longitude.toFixed(6)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!locationValidation && !isValidatingLocation && (
                <p className="text-gray-500 text-sm">Click "Validate Location" to preview and verify the address.</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Gym'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      );
    } else if (activeTab === 'trainers') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This will update an existing trainer's location data. 
              Enter the trainer's email to find and update their profile.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Trainer Email (Required)"
              value={trainerForm.email}
              onChange={(e) => setTrainerForm({...trainerForm, email: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Specialization"
              value={trainerForm.specialization}
              onChange={(e) => setTrainerForm({...trainerForm, specialization: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              step="0.000001"
              placeholder="Latitude (Required)"
              value={trainerForm.latitude}
              onChange={(e) => setTrainerForm({...trainerForm, latitude: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              step="0.000001"
              placeholder="Longitude (Required)"
              value={trainerForm.longitude}
              onChange={(e) => setTrainerForm({...trainerForm, longitude: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Price per Session"
              value={trainerForm.price}
              onChange={(e) => setTrainerForm({...trainerForm, price: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Experience"
              value={trainerForm.experience}
              onChange={(e) => setTrainerForm({...trainerForm, experience: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Rating"
              value={trainerForm.rating}
              onChange={(e) => setTrainerForm({...trainerForm, rating: parseFloat(e.target.value)})}
              className="border rounded px-3 py-2"
            />
          </div>
          <textarea
            placeholder="Bio"
            value={trainerForm.bio}
            onChange={(e) => setTrainerForm({...trainerForm, bio: e.target.value})}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Trainer'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      );
    } else if (activeTab === 'events') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>📍 Location:</strong> Just enter the location, city, and state. Coordinates will be found automatically!
              <br />
              <strong>Examples:</strong> "Marine Drive, Kochi", "MG Road, Thiruvananthapuram", "Railway Station, Calicut"
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Event Title"
              value={eventForm.title}
              onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Location (e.g., Marine Drive, Kochi or MG Road, Thiruvananthapuram)"
              value={eventForm.location}
              onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="City"
              value={eventForm.city}
              onChange={(e) => setEventForm({...eventForm, city: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="State"
              value={eventForm.state}
              onChange={(e) => setEventForm({...eventForm, state: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="date"
              value={eventForm.date}
              onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="time"
              value={eventForm.time}
              onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Max Participants"
              value={eventForm.max_participants}
              onChange={(e) => setEventForm({...eventForm, max_participants: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Price"
              value={eventForm.price}
              onChange={(e) => setEventForm({...eventForm, price: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <select
              value={eventForm.type}
              onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
              className="border rounded px-3 py-2"
            >
              <option value="fitness">Fitness</option>
              <option value="yoga">Yoga</option>
              <option value="running">Running</option>
              <option value="cycling">Cycling</option>
              <option value="swimming">Swimming</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Organizer"
              value={eventForm.organizer}
              onChange={(e) => setEventForm({...eventForm, organizer: e.target.value})}
              className="border rounded px-3 py-2"
            />
          </div>
          <textarea
            placeholder="Event Description"
            value={eventForm.description}
            onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      );
    }
  };

  const renderList = () => {
    const data = filteredData();
    
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No {activeTab} found. Create your first {activeTab.slice(0, -1)}!
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((item) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {item.name || item.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {item.address || item.location || item.specialization}
                </p>
                {activeTab === 'gyms' && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>⭐ {item.rating || 0}</span>
                    <span>💰 {item.price}</span>
                    <span>🕒 {item.open_hours}</span>
                  </div>
                )}
                {activeTab === 'trainers' && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>⭐ {item.rating || 0}</span>
                    <span>💰 {item.price || 'Contact for pricing'}</span>
                    <span>📍 {item.latitude && item.longitude ? 'Location set' : 'No location'}</span>
                  </div>
                )}
                {activeTab === 'events' && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                    <span>🕒 {item.time}</span>
                    <span>👥 {item.participants || 0}/{item.max_participants}</span>
                    <span>💰 {item.price}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Location Management</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {[
          { id: 'gyms', label: 'Gyms', icon: MapPin },
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

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">
                  Add New {activeTab.slice(0, -1)}
                </h4>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderForm()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {renderList()}
    </div>
  );
};

export default LocationAdminPanel;
