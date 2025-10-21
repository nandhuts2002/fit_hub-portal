import requests
import time
from typing import Dict, Optional, Tuple

class GeocodingService:
    """Service for geocoding addresses using OpenStreetMap Nominatim API"""
    
    def __init__(self):
        self.base_url = "https://nominatim.openstreetmap.org/search"
        self.headers = {
            'User-Agent': 'FitHub-Location-Service/1.0'
        }
    
    def geocode_address(self, address: str, city: str = "Kochi", state: str = "Kerala", country: str = "India") -> Optional[Dict]:
        """
        Convert address to coordinates using OpenStreetMap Nominatim API with enhanced validation

        Args:
            address: Street address
            city: City name (default: Kochi)
            state: State name (default: Kerala)
            country: Country name (default: India)

        Returns:
            Dict with lat, lon, formatted_address or None if not found
        """
        try:
            # Clean and prepare the address
            clean_address = self._clean_address(address)
            clean_city = city.strip().lower()

            # Try multiple address formats for better results
            address_formats = [
                f"{clean_address}, {city}, {state}, {country}",
                f"{clean_address}, {city}, {state}",
                f"{city}, {state}, {country}",
                f"{city}, {state}",
                clean_address  # Try just the address
            ]

            best_result = None
            best_score = 0

            for full_address in address_formats:
                print(f"Trying geocoding: {full_address}")

                params = {
                    'q': full_address,
                    'format': 'json',
                    'limit': 10,  # Get more results for better selection
                    'addressdetails': 1,
                    'countrycodes': 'in'  # Limit to India
                }

                # Make request with rate limiting
                response = requests.get(self.base_url, params=params, headers=self.headers, timeout=15)

                if response.status_code == 200:
                    data = response.json()

                    if data and len(data) > 0:
                        # Evaluate and score each result
                        for result in data:
                            score = self._score_geocoding_result(result, city, state)
                            if score > best_score:
                                best_score = score
                                best_result = result

                        # If we have a good result, use it
                        if best_score >= 0.7:  # Good confidence threshold
                            lat = float(best_result['lat'])
                            lon = float(best_result['lon'])
                            formatted_address = best_result.get('display_name', full_address)
                            importance = best_result.get('importance', 0)

                            print(f"Geocoded successfully: {lat}, {lon} (score: {best_score:.2f}, importance: {importance})")

                            return {
                                'latitude': lat,
                                'longitude': lon,
                                'formatted_address': formatted_address,
                                'confidence': best_score,
                                'source': 'nominatim'
                            }
                    else:
                        print(f"No results found for: {full_address}")
                        continue
                else:
                    print(f"Geocoding API error: {response.status_code}")
                    continue

            # If all formats failed or confidence is too low, try with Kerala-specific fallback
            print(f"Geocoding failed or low confidence ({best_score:.2f}), trying Kerala fallback coordinates...")
            return self._get_kerala_fallback_coordinates(clean_address, clean_city)

        except Exception as e:
            print(f"Geocoding error: {str(e)}")
            return self._get_kerala_fallback_coordinates(address, city)

    def _clean_address(self, address: str) -> str:
        """Clean and standardize address format"""
        if not address:
            return ""

        # Remove extra whitespace and normalize
        clean = " ".join(address.split())
        # Remove common problematic characters
        clean = clean.replace('"', '').replace("'", '').strip()

        return clean

    def _score_geocoding_result(self, result: Dict, expected_city: str, expected_state: str) -> float:
        """
        Score a geocoding result based on how well it matches expected location
        Returns a score between 0 and 1
        """
        score = 0.0

        # Base score from Nominatim importance
        importance = result.get('importance', 0)
        score += min(importance * 2, 0.4)  # Cap at 0.4

        # Address details matching
        address_details = result.get('address', {})

        # City matching (high weight)
        result_city = address_details.get('city', '').lower()
        expected_city_lower = expected_city.lower()

        if result_city == expected_city_lower:
            score += 0.3
        elif expected_city_lower in result_city or result_city in expected_city_lower:
            score += 0.2

        # State matching (high weight)
        result_state = address_details.get('state', '').lower()
        expected_state_lower = expected_state.lower()

        if result_state == expected_state_lower:
            score += 0.3
        elif expected_state_lower in result_state or result_state in expected_state_lower:
            score += 0.2

        # Check if coordinates are within Kerala bounds (approximate)
        lat = float(result.get('lat', 0))
        lon = float(result.get('lon', 0))

        # Kerala approximate bounds: 8-12°N, 74-78°E
        if 8 <= lat <= 12 and 74 <= lon <= 78:
            score += 0.1
        else:
            score -= 0.2  # Penalize if outside Kerala

        return max(0, min(1, score))  # Clamp between 0 and 1
    
    def _get_kerala_fallback_coordinates(self, address: str, city: str) -> Optional[Dict]:
        """Fallback to known Kerala coordinates if geocoding fails with improved accuracy"""
        kerala_coordinates = {
            'kochi': {'lat': 9.9312, 'lon': 76.2673, 'name': 'Kochi'},
            'thiruvananthapuram': {'lat': 8.5241, 'lon': 76.9366, 'name': 'Thiruvananthapuram'},
            'calicut': {'lat': 11.2588, 'lon': 75.7804, 'name': 'Kozhikode'},
            'kollam': {'lat': 8.8932, 'lon': 76.6141, 'name': 'Kollam'},
            'thrissur': {'lat': 10.5276, 'lon': 76.2144, 'name': 'Thrissur'},
            'palakkad': {'lat': 10.7867, 'lon': 76.6548, 'name': 'Palakkad'},
            'kannur': {'lat': 11.8745, 'lon': 75.3704, 'name': 'Kannur'},
            'kasargod': {'lat': 12.4996, 'lon': 74.9899, 'name': 'Kasargod'},
            'ernakulam': {'lat': 9.9816, 'lon': 76.2999, 'name': 'Ernakulam'},
            'trivandrum': {'lat': 8.5241, 'lon': 76.9366, 'name': 'Thiruvananthapuram'},
            'cochin': {'lat': 9.9312, 'lon': 76.2673, 'name': 'Kochi'},
            'alappuzha': {'lat': 9.4981, 'lon': 76.3388, 'name': 'Alappuzha'},
            'kottayam': {'lat': 9.5916, 'lon': 76.5222, 'name': 'Kottayam'},
            'idukki': {'lat': 9.9189, 'lon': 76.9400, 'name': 'Idukki'},
            'malappuram': {'lat': 11.0732, 'lon': 76.0740, 'name': 'Malappuram'},
            'wayanad': {'lat': 11.6854, 'lon': 76.1320, 'name': 'Wayanad'}
        }

        # Handle multiple city name variations
        city_mappings = {
            'kochi': 'kochi',
            'cochin': 'kochi',
            'ernakulam': 'ernakulam',
            'thiruvananthapuram': 'thiruvananthapuram',
            'trivandrum': 'thiruvananthapuram',
            'kollam': 'kollam',
            'quilon': 'kollam',
            'thrissur': 'thrissur',
            'trichur': 'thrissur',
            'calicut': 'calicut',
            'kozhikode': 'calicut',
            'palakkad': 'palakkad',
            'kannur': 'kannur',
            'kasargod': 'kasargod',
            'alappuzha': 'alappuzha',
            'alleppey': 'alappuzha',
            'kottayam': 'kottayam',
            'idukki': 'idukki',
            'malappuram': 'malappuram',
            'wayanad': 'wayanad'
        }

        city_lower = city.lower().strip()
        mapped_city = city_mappings.get(city_lower, city_lower)

        if mapped_city in kerala_coordinates:
            coords = kerala_coordinates[mapped_city]
            print(f"Using improved fallback coordinates for {city} -> {mapped_city}: {coords['lat']}, {coords['lon']}")
            return {
                'latitude': coords['lat'],
                'longitude': coords['lon'],
                'formatted_address': f"{address}, {coords['name']}, Kerala, India",
                'confidence': 0.6,  # Slightly higher confidence for known cities
                'source': 'fallback'
            }
        else:
            # Try partial matching for unknown cities
            for known_city, data in kerala_coordinates.items():
                if known_city in city_lower or city_lower in known_city:
                    print(f"Partial match found: {city} -> {known_city}")
                    return {
                        'latitude': data['lat'],
                        'longitude': data['lon'],
                        'formatted_address': f"{address}, {data['name']}, Kerala, India",
                        'confidence': 0.4,
                        'source': 'partial_match'
                    }

            # Default to Kochi if city not found
            print(f"City '{city}' not found in Kerala coordinates, using default Kochi coordinates")
            return {
                'latitude': 9.9312,
                'longitude': 76.2673,
                'formatted_address': f"{address}, Kochi, Kerala, India",
                'confidence': 0.2,
                'source': 'default'
            }

    def validate_location_accuracy(self, lat: float, lon: float, expected_city: str, expected_state: str = "Kerala") -> Dict:
        """
        Validate if coordinates match expected city/state
        Returns validation result with suggestions
        """
        try:
            # Reverse geocode to get address details
            reverse_result = self.reverse_geocode(lat, lon)

            if not reverse_result:
                return {
                    'is_accurate': False,
                    'message': 'Could not verify location accuracy',
                    'suggestions': []
                }

            address_details = reverse_result.get('formatted_address', '')

            # Check if expected city/state are in the reverse geocoded address
            expected_city_lower = expected_city.lower()
            expected_state_lower = expected_state.lower()
            address_lower = address_details.lower()

            city_match = expected_city_lower in address_lower
            state_match = expected_state_lower in address_lower

            if city_match and state_match:
                return {
                    'is_accurate': True,
                    'message': f'Location appears accurate for {expected_city}, {expected_state}',
                    'confidence': 0.9
                }
            elif city_match:
                return {
                    'is_accurate': True,
                    'message': f'City matches but state verification uncertain',
                    'confidence': 0.7
                }
            else:
                # Try to find the actual city from reverse geocoding
                actual_city = self._extract_city_from_address(address_details)

                suggestions = []
                if actual_city and actual_city.lower() != expected_city_lower:
                    suggestions.append(f"Consider changing city to '{actual_city}'")

                return {
                    'is_accurate': False,
                    'message': f'Location may be in {actual_city or "different city"} instead of {expected_city}',
                    'suggestions': suggestions,
                    'confidence': 0.3
                }

        except Exception as e:
            print(f"Location validation error: {str(e)}")
            return {
                'is_accurate': False,
                'message': 'Could not validate location',
                'suggestions': ['Try entering a more specific address']
            }

    def _extract_city_from_address(self, address: str) -> Optional[str]:
        """Extract city name from formatted address"""
        try:
            # Common patterns for Indian addresses
            parts = address.split(',')
            for part in reversed(parts):
                part = part.strip()
                # Skip postal codes, country, state
                if len(part) < 3 or part.isdigit():
                    continue
                if 'india' in part.lower():
                    continue
                if 'kerala' in part.lower():
                    continue
                # Return the first substantial part (likely city)
                return part
        except:
            pass
        return None
    
    def reverse_geocode(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Convert coordinates to address using reverse geocoding
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Dict with formatted_address or None if not found
        """
        try:
            params = {
                'lat': lat,
                'lon': lon,
                'format': 'json',
                'addressdetails': 1
            }
            
            response = requests.get(
                "https://nominatim.openstreetmap.org/reverse",
                params=params,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if 'display_name' in data:
                    return {
                        'formatted_address': data['display_name'],
                        'confidence': data.get('importance', 0)
                    }
                else:
                    return None
            else:
                print(f"Reverse geocoding API error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Reverse geocoding error: {str(e)}")
            return None
    
    def get_nearby_places(self, lat: float, lon: float, radius: float = 1000, place_type: str = "amenity=gym") -> list:
        """
        Get nearby places using Overpass API
        
        Args:
            lat: Latitude
            lon: Longitude
            radius: Search radius in meters
            place_type: Type of place to search for
            
        Returns:
            List of nearby places
        """
        try:
            # Overpass API query
            query = f"""
            [out:json][timeout:25];
            (
              node["{place_type}"](around:{radius},{lat},{lon});
              way["{place_type}"](around:{radius},{lat},{lon});
              relation["{place_type}"](around:{radius},{lat},{lon});
            );
            out center;
            """
            
            response = requests.post(
                "https://overpass-api.de/api/interpreter",
                data=query,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                places = []
                
                for element in data.get('elements', []):
                    if 'tags' in element:
                        place = {
                            'name': element['tags'].get('name', 'Unknown'),
                            'latitude': element.get('lat', element.get('center', {}).get('lat')),
                            'longitude': element.get('lon', element.get('center', {}).get('lon')),
                            'type': element['tags'].get('amenity', 'unknown'),
                            'address': element['tags'].get('addr:full', ''),
                        }
                        places.append(place)
                
                return places
            else:
                print(f"Overpass API error: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Nearby places error: {str(e)}")
            return []

# Create singleton instance
geocoding_service = GeocodingService()
