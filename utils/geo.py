"""Geolocation and mapping helper for destinations and cities across Tamil Nadu and South India."""

CITY_COORDINATES = {
    'ooty': {'lat': 11.4102, 'lng': 76.6950, 'name': 'Ooty (Udhagamandalam), Nilgiris'},
    'kodaikanal': {'lat': 10.2381, 'lng': 77.4892, 'name': 'Kodaikanal, Dindigul'},
    'yercaud': {'lat': 11.7753, 'lng': 78.2093, 'name': 'Yercaud, Shevaroys'},
    'madurai': {'lat': 9.9252, 'lng': 78.1198, 'name': 'Madurai, Cultural Capital'},
    'chennai': {'lat': 13.0827, 'lng': 80.2707, 'name': 'Chennai, Coastal Gateway'},
    'thanjavur': {'lat': 10.7870, 'lng': 79.1378, 'name': 'Thanjavur, Great Chola Temples'},
    'rameswaram': {'lat': 9.2876, 'lng': 79.3129, 'name': 'Rameswaram Island & Pamban'},
    'kanyakumari': {'lat': 8.0883, 'lng': 77.5385, 'name': 'Kanyakumari, Lands End'},
    'mahabalipuram': {'lat': 12.6269, 'lng': 80.1927, 'name': 'Mahabalipuram, UNESCO Shore Temples'},
    'coimbatore': {'lat': 11.0168, 'lng': 76.9558, 'name': 'Coimbatore Transit Hub'},
    'pondicherry': {'lat': 11.9416, 'lng': 79.8083, 'name': 'Puducherry French Quarter'}
}

def get_coordinates_for_location(location_name: str):
    """Return (latitude, longitude, formatted_title) for a given place or city."""
    if not location_name:
        return 11.4102, 76.6950, 'Tamil Nadu, India'
    
    loc_lower = location_name.lower()
    for key, data in CITY_COORDINATES.items():
        if key in loc_lower:
            return data['lat'], data['lng'], data['name']
            
    # Default state center
    return 11.1271, 78.6569, location_name
