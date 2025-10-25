import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  ChevronDown, 
  Search, 
  X,
  Check
} from 'lucide-react';

const LocationSelector = ({ 
  selectedLocation, 
  onLocationChange, 
  placeholder = "Select Location",
  className = "",
  showSearch = true,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Kerala districts and their major places
  const keralaLocations = {
    'Thiruvananthapuram': [
      'Kazhakkoottam', 'Kowdiar', 'Kesavadasapuram', 'Vellayambalam', 
      'Pattom', 'Kumarapuram', 'Peroorkada', 'Kalliyoor', 'Kudappanakunnu',
      'Medical College', 'Thampanoor', 'East Fort', 'West Fort', 'Chalai',
      'Killipalam', 'Kaniyapuram', 'Attingal', 'Nedumangad', 'Varkala'
    ],
    'Kollam': [
      'Kollam City', 'Chinnakada', 'Kadakkal', 'Karunagappally', 'Kottarakkara',
      'Punalur', 'Sasthamkotta', 'Thirumullavaram', 'Tangasseri', 'Mayyanad',
      'Paravur', 'Ochira', 'Chavara', 'Neendakara', 'Kilikollur'
    ],
    'Pathanamthitta': [
      'Pathanamthitta Town', 'Adoor', 'Ranni', 'Konni', 'Kozhencherry',
      'Thiruvalla', 'Mallappally', 'Aranmula', 'Pandalam', 'Kumbanad',
      'Kadapra', 'Kozhanchery', 'Elanthoor', 'Omallur'
    ],
    'Alappuzha': [
      'Alappuzha Town', 'Cherthala', 'Kayamkulam', 'Mavelikkara', 'Chengannur',
      'Haripad', 'Aroor', 'Mararikulam', 'Thumpoly', 'Pallippuram',
      'Kuttanad', 'Kainakary', 'Champakulam', 'Kumarakom'
    ],
    'Kottayam': [
      'Kottayam Town', 'Changanassery', 'Vaikom', 'Ettumanoor', 'Pala',
      'Erattupetta', 'Kanjirappally', 'Mundakayam', 'Puthuppally', 'Kumarakom',
      'Kaduthuruthy', 'Uzhavoor', 'Ramapuram', 'Kuruppanthara'
    ],
    'Idukki': [
      'Thodupuzha', 'Munnar', 'Kattappana', 'Nedumkandam', 'Adimali',
      'Devikulam', 'Marayur', 'Udumbanchola', 'Peerumade', 'Vandiperiyar',
      'Kumily', 'Thekkady', 'Pallivasal', 'Mattupetty'
    ],
    'Ernakulam': [
      'Kochi', 'Fort Kochi', 'Mattancherry', 'Jew Town', 'Marine Drive',
      'MG Road', 'Panampilly Nagar', 'Kadavanthra', 'Palarivattom', 'Edappally',
      'Kakkanad', 'Infopark', 'Technopark', 'Aluva', 'Perumbavoor',
      'Angamaly', 'North Paravur', 'Tripunithura', 'Thripunithura', 'Vyttila',
      'Kaloor', 'Ernakulam North', 'Ernakulam South', 'Thrikkakara'
    ],
    'Thrissur': [
      'Thrissur City', 'Guruvayur', 'Kodungallur', 'Irinjalakuda', 'Chalakudy',
      'Wadakkanchery', 'Kunnamkulam', 'Chelakkara', 'Mala', 'Kodakara',
      'Pazhayannur', 'Puthukkad', 'Mannuthy', 'Ayyanthole'
    ],
    'Palakkad': [
      'Palakkad Town', 'Ottapalam', 'Chittur', 'Mannarkkad', 'Alathur',
      'Pattambi', 'Shoranur', 'Kollengode', 'Malampuzha', 'Koduvayur',
      'Kanjikode', 'Feroke', 'Kozhikode', 'Vadakara'
    ],
    'Malappuram': [
      'Malappuram Town', 'Manjeri', 'Perinthalmanna', 'Tirur', 'Kottakkal',
      'Ponnani', 'Tirurangadi', 'Nilambur', 'Kondotty', 'Valanchery',
      'Tanur', 'Parappanangadi', 'Edappal', 'Areekode'
    ],
    'Kozhikode': [
      'Kozhikode City', 'Feroke', 'Vadakara', 'Koyilandy', 'Ramanattukara',
      'Elathur', 'Beypore', 'Kallai', 'Meppayur', 'Payyoli',
      'Balussery', 'Koduvally', 'Thiruvambady', 'Perambra'
    ],
    'Wayanad': [
      'Kalpetta', 'Mananthavady', 'Sultan Bathery', 'Vythiri', 'Pulpally',
      'Meppadi', 'Ambalavayal', 'Panamaram', 'Banasura Sagar', 'Chembra Peak',
      'Pookode Lake', 'Edakkal Caves', 'Kuruva Island'
    ],
    'Kannur': [
      'Kannur City', 'Thalassery', 'Payyannur', 'Koothuparamba', 'Mattannur',
      'Iritty', 'Taliparamba', 'Kannapuram', 'Chirakkal', 'Azhikode',
      'Kadachira', 'Pappinisseri', 'Muzhappilangad', 'Dharmadam'
    ],
    'Kasaragod': [
      'Kasaragod Town', 'Kanhangad', 'Nileshwar', 'Manjeshwar', 'Kumbla',
      'Bekal', 'Hosdurg', 'Cheruvathur', 'Uppala', 'Mangalpady',
      'Pallikkara', 'Kuttikol', 'Kanjangad', 'Kallar'
    ]
  };

  useEffect(() => {
    if (selectedLocation) {
      // Parse the selected location to set district and place
      const parts = selectedLocation.split(', ');
      if (parts.length >= 2) {
        const place = parts[0].trim();
        const district = parts[1].trim();
        
        if (keralaLocations[district] && keralaLocations[district].includes(place)) {
          setSelectedDistrict(district);
          setSelectedPlace(place);
        }
      }
    }
  }, [selectedLocation]);

  const handleLocationSelect = (district, place) => {
    const locationString = `${place}, ${district}`;
    setSelectedDistrict(district);
    setSelectedPlace(place);
    onLocationChange(locationString);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedDistrict(null);
    setSelectedPlace(null);
    onLocationChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredDistricts = Object.keys(keralaLocations).filter(district =>
    district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlaces = selectedDistrict 
    ? keralaLocations[selectedDistrict].filter(place =>
        place.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getDisplayText = () => {
    if (selectedDistrict && selectedPlace) {
      return `${selectedPlace}, ${selectedDistrict}`;
    }
    return placeholder;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 
          border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          transition-colors
        `}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className={`${selectedLocation ? 'text-gray-900' : 'text-gray-500'}`}>
            {getDisplayText()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selectedLocation && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden"
          >
            {showSearch && (
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search districts or places..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {!selectedDistrict ? (
                // Show districts
                <div className="py-2">
                  {filteredDistricts.length === 0 ? (
                    <div className="px-3 py-4 text-center text-gray-500">
                      No districts found
                    </div>
                  ) : (
                    filteredDistricts.map((district) => (
                      <button
                        key={district}
                        onClick={() => setSelectedDistrict(district)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-gray-900">{district}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Show places for selected district
                <div className="py-2">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{selectedDistrict}</span>
                      <button
                        onClick={() => setSelectedDistrict(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Back to Districts
                      </button>
                    </div>
                  </div>
                  
                  {filteredPlaces.length === 0 ? (
                    <div className="px-3 py-4 text-center text-gray-500">
                      No places found in {selectedDistrict}
                    </div>
                  ) : (
                    filteredPlaces.map((place) => (
                      <button
                        key={place}
                        onClick={() => handleLocationSelect(selectedDistrict, place)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-gray-900">{place}</span>
                        {selectedPlace === place && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationSelector;


