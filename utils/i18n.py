"""Internationalization (i18n) dictionary and helper for English and Tamil localization."""

TRANSLATIONS = {
    'en': {
        'packages': 'Packages',
        'hotels': 'Hotels',
        'transports': 'Transports',
        'trip_builder': 'Trip Builder',
        'compare': 'Compare',
        'wallet': 'Wallet',
        'messages': 'Messages',
        'dashboard': 'Dashboard',
        'login': 'Login',
        'signup': 'Sign Up',
        'logout': 'Logout',
        'search': 'Search',
        'explore_packages': 'Explore Packages',
        'book_now': 'Book Now',
        'view_details': 'View Details',
        'total_payable': 'Total Payable',
        'custom_trip_builder': 'Custom Multi-Day Trip Planner',
        'verified_traveler': 'Verified Traveler',
        'confirmed': 'Confirmed',
        'upcoming': 'Upcoming',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    },
    'ta': {
        'packages': 'சுற்றுலா தொகுப்புகள்',
        'hotels': 'விடுதிகள் & தங்கும் இடங்கள்',
        'transports': 'போக்குவரத்து & வாடகை கார்கள்',
        'trip_builder': 'பயண திட்டமிடுபவர்',
        'compare': 'ஒப்பீடு',
        'wallet': 'பணப்பை (Wallet)',
        'messages': 'செய்திகள்',
        'dashboard': 'முகப்பு பலகை',
        'login': 'உள்நுழைக',
        'signup': 'பதிவு செய்க',
        'logout': 'வெளியேறுக',
        'search': 'தேடுக',
        'explore_packages': 'சுற்றுலா தொகுப்புகளை காண்க',
        'book_now': 'முன்பதிவு செய்க',
        'view_details': 'விவரங்களை காண்க',
        'total_payable': 'மொத்த கட்டணம்',
        'custom_trip_builder': 'தனிப்பயன் சுற்றுலா திட்டமிடுபவர்',
        'verified_traveler': 'உறுதிப்படுத்தப்பட்ட பயணி',
        'confirmed': 'உறுதி செய்யப்பட்டது',
        'upcoming': 'வரவிருக்கும் பயணம்',
        'completed': 'முடிவுற்றது',
        'cancelled': 'ரத்து செய்யப்பட்டது'
    }
}

def translate(key: str, lang: str = 'en') -> str:
    """Retrieve translation for key in selected language."""
    return TRANSLATIONS.get(lang, TRANSLATIONS['en']).get(key, key)
