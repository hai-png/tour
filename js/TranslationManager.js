/**
 * Translation Manager - Multi-language support (English & Amharic only)
 * ============================================================
 */

export class TranslationManager {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = {
      en: {
        // UI Elements
        'virtualTour': 'Virtual Tour',
        'rooms': 'Rooms',
        'settings': 'Settings',
        'language': 'Language',
        'location': 'Location',
        'tourInfo': 'Tour Info',
        'guidedTour': 'Guided Tour',
        'gallery': 'Gallery',
        'contact': 'Contact',
        'share': 'Share',
        'fullscreen': 'Fullscreen',
        'resetView': 'Reset View',
        'overlays': 'Overlays',
        'sound': 'Sound',
        'capture': 'Capture',
        'zoomIn': 'Zoom +',
        'zoomOut': 'Zoom -',
        'floorPlan': 'Floor Plan',
        'projectGallery': 'Project Gallery',
        'photosVideos': 'Photos & Videos',
        'openGallery': 'Open Gallery',
        'previousRoom': 'Previous Room',
        'nextRoom': 'Next Room',
        'propertyInfo': 'Property Info',
        'startVirtualTour': 'Start Virtual Tour',
        'preparingExperience': 'Preparing your experience...',
        'loading': 'Loading...',
        'selectLanguage': 'Select your preferred language for the tour.',
        'darkMode': 'Dark Mode',
        'lightMode': 'Light Mode',

        // Navigation
        'previous': 'Previous',
        'next': 'Next',

        // Info Card
        'room': 'Room',
        'of': 'of',
        'hotspots': 'hotspots',

        // Settings
        'autoRotate': 'Auto-Rotate',
        'musicPlayer': 'Music Player',
        'ambientLounge': 'Ambient Lounge',
        'backgroundMusic': 'Background Music',
        'viewSettings': 'View Settings',
        'zoomLevel': 'Zoom Level (FOV)',
        'quality': 'Quality',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low',
        'vrMode': 'VR Mode',
        'controls': 'Controls',
        'motionSensitivity': 'Motion Sensitivity',
        'audio': 'Audio',
        'volume': 'Volume',
        'captureView': 'Capture View',
        'imageQuality': 'Image Quality',
        'standard': 'Standard',
        'high': 'High',
        'maximum': 'Maximum',
        'watermark': 'Watermark',
        'captureCurrentView': 'Capture Current View',
        'about': 'About',

        // Contact
        'contactUs': 'Contact Us',
        'getInTouch': 'Get in touch for more information about this property.',
        'yourName': 'Your Name',
        'yourEmail': 'Your Email',
        'yourMessage': 'Your Message',
        'sendMessage': 'Send Message',
        'messageSent': 'Message sent!',

        // Share
        'shareThisTour': 'Share This Tour',
        'shareWithFriends': 'Share this virtual tour with your friends and colleagues.',
        'shareOnSocial': 'Share on Social Media',
        'copyLink': 'Copy Link',
        'embedCode': 'Embed Code',
        'qrCode': 'QR Code',
        'scanToView': 'Scan to view tour',
        'linkCopied': 'Link copied to clipboard!',
        'embedCopied': 'Embed code copied!',
        'copy': 'Copy',
        'directLink': 'Direct Link',
        'facebook': 'Facebook',
        'whatsapp': 'WhatsApp',

        // Location
        'findUs': 'Find us at this prime location.',
        'property': 'Property',
        'getDirections': 'Get Directions',
        'copyAddress': 'Copy Address',
        'openInMaps': 'Open in Maps',
        'copied': 'Copied!',
        'address': 'Address',
        'phone': 'Phone',
        'email': 'Email',

        // Guided Tour
        'experienceTour': 'Experience an automated tour with narration.',
        'tourType': 'Tour Type',
        'audioNarration': 'Audio Narration',
        'textHighlights': 'Text Highlights',
        'audioAndText': 'Audio + Text',
        'startTour': 'Start Tour',
        'pause': 'Pause',
        'resume': 'Resume',
        'stop': 'Stop',

        // Gallery
        'photoGallery': 'Photo Gallery',
        'browsePhotos': 'Browse through our collection of professional photos.',

        // Tour Info
        'propertyInformation': 'Property Information',
        'bedrooms': 'Bedrooms',
        'bathrooms': 'Bathrooms',
        'sqFt': 'Sq. Ft.',
        'floors': 'Floors',
        'description': 'Description',
        'amenities': 'Amenities',
        'navigationControls': 'Navigation Controls',
        'dragToLook': 'Drag to look around',
        'scrollToZoom': 'Scroll to zoom in/out',
        'clickArrows': 'Click arrows to navigate rooms',
        'clickHotspots': 'Click hotspots to explore',
        'clickFloorPlan': 'Click floor plan markers for quick navigation',

        // Language names
        'english': 'English',
        'amharic': 'አማርኛ',

        // CTA
        'interestedInProperty': 'Interested in this property?',
        'contactUsButton': 'Contact Us',

        // Loading
        'loadingTour': 'Loading Virtual Tour...',
        'errorLoading': 'Error Loading Tour',
        'roomsCount': 'Rooms',
        'hotspotsCount': 'Hotspots',
        'floorsCount': 'Floors',
        'guidedTourCount': 'Guided Tour',

        // Property Info Modal
        'propertyInfoTitle': 'Property Information',
        'available': 'Available',
        'beds': 'Beds',
        'baths': 'Baths',
        'sqft': 'sqft',
        'overview': 'Overview',
        'features': 'Features',
        'location': 'Location',
        'contact': 'Contact',
        'propertyOverview': 'Property Overview',
        'propertyDescription': 'Experience luxury living in the heart of Port Moresby. This stunning multi-level property features modern architecture with spacious living areas, floor-to-ceiling windows, and premium finishes throughout.',
        'amenities': 'Amenities',
        'swimmingPool': 'Swimming Pool',
        'fitnessCenter': 'Fitness Center',
        'parking': 'Parking',
        'garden': 'Garden',
        'security24_7': '24/7 Security',
        'highSpeedWifi': 'High-Speed WiFi',
        'airConditioning': 'Air Conditioning',
        'smartHome': 'Smart Home',
        'occupancy': 'Occupancy',
        'propertyFeatures': 'Property Features',
        'modernArchitecture': 'Modern Architecture',
        'modernArchitectureDesc': 'Contemporary design with clean lines and premium materials',
        'multiFloorDesign': 'Multi-Floor Design',
        'multiFloorDesignDesc': 'Spacious layout across multiple levels for optimal living',
        'premiumFinishes': 'Premium Finishes',
        'premiumFinishesDesc': 'High-quality materials and fixtures throughout',
        'waterfrontLocation': 'Waterfront Location',
        'waterfrontLocationDesc': 'Prime location with stunning water views',
        'smartHomeTech': 'Smart Home Technology',
        'smartHomeTechDesc': 'Integrated automation for lighting, climate, and security',
        'energyEfficient': 'Energy Efficient',
        'energyEfficientDesc': 'Solar panels and energy-saving appliances',
        'spacesInclude': 'Spaces Include',
        'livingDiningAreas': 'Living & Dining Areas',
        'gourmetKitchen': 'Gourmet Kitchen',
        'masterBedrooms': 'Master Bedrooms',
        'luxuryBathrooms': 'Luxury Bathrooms',
        'familyRoom': 'Family Room',
        'gymTerrace': 'Gym & Terrace',
        'homeOffice': 'Home Office',
        'outdoorEntertainment': 'Outdoor Entertainment',
        'primeLocation': 'Prime Location',
        'locationDescription': 'Located in the heart of Port Moresby, this property offers easy access to shopping, dining, and business districts.',
        'address': 'Address',
        'coordinates': 'Coordinates',
        'distanceToCBD': 'Distance to CBD',
        'airport': 'Airport',
        'contactInquiries': 'Contact & Inquiries',
        'contactIntro': 'Interested in this property? Get in touch with our sales team for more information.',
        'phone': 'Phone',
        'email': 'Email',
        'officeHours': 'Office Hours',
        'website': 'Website',
        'call': 'Call',
        'visit': 'Visit',
        'sendInquiry': 'Send Inquiry',
        'yourName': 'Your Name',
        'yourEmail': 'Your Email',
        'yourPhone': 'Your Phone',
        'interestedIn': 'Interested in...',
        'buying': 'Buying',
        'renting': 'Renting',
        'viewing': 'Scheduling a Viewing',
        'info': 'More Information',
        'yourMessage': 'Your Message',
        'sendInquiryButton': 'Send Inquiry',

        // Room Types
        'livingRoom': 'Living Room',
        'diningKitchen': 'Dining & Kitchen',
        'familyRoom': 'Family Room',
        'corridor': 'Corridor',
        'bedroom': 'Bedroom',
        'hallway': 'Hallway',
        'masterBedroom': 'Master Bedroom',
        'masterBathroom': 'Master Bathroom',
        'dressingRoom': 'Dressing Room',
        'stairLanding': 'Stair Landing',
        'terrace': 'Terrace',
        'office': 'Office',
        'gym': 'Gym',
        'bathroom': 'Bathroom',
        'diningRoom': 'Dining Room',
        'kitchen': 'Kitchen',
        'garage': 'Garage',
        'balcony': 'Balcony',
        'laundryRoom': 'Laundry Room',
        'storage': 'Storage',
        'entrance': 'Entrance',
        'powderRoom': 'Powder Room',
        'studyRoom': 'Study Room',
        'playroom': 'Playroom',
        'mediaRoom': 'Media Room',
        'wineCellar': 'Wine Cellar',

        // Room Features
        'highCeilings': 'High ceilings',
        'largeWindows': 'Large windows',
        'naturalLight': 'Natural light',
        'openPlan': 'Open plan',
        'openKitchen': 'Open kitchen',
        'diningArea': 'Dining area',
        'modernAppliances': 'Modern appliances',
        'counterSpace': 'Counter space',
        'cozySpace': 'Cozy space',
        'familyArea': 'Family area',
        'relaxationZone': 'Relaxation zone',
        'firstFloor': 'First floor',
        'hallwayAccess': 'Hallway',
        'bedroomAccess': 'Bedroom access',
        'elegantFinishes': 'Elegant finishes',
        'transitionalSpace': 'Transitional space',
        'peacefulRetreat': 'Peaceful retreat',
        'comfortableSpace': 'Comfortable space',
        'private': 'Private',
        'qualityFinishes': 'Quality finishes',
        'connectionSpace': 'Connection space',
        'centralLanding': 'Central landing',
        'stairAccess': 'Stair access',
        'roomConnections': 'Room connections',
        'transitional': 'Transitional',
        'additionalLiving': 'Additional living',
        'versatileSpace': 'Versatile space',
        'upperLevel': 'Upper level',
        'privateRetreat': 'Private retreat',
        'spacious': 'Spacious',
        'kingSizeCapacity': 'King-size capacity',
        'sereneEnvironment': 'Serene environment',
        'masterSuite': 'Master suite',
        'designDetails': 'Design details',
        'bathroomAccess': 'Bathroom access',
        'dressingRoomAccess': 'Dressing room access',
        'modernFixtures': 'Modern fixtures',
        'vanityArea': 'Vanity area',
        'shower': 'Shower',
        'premiumFittings': 'Premium fittings',
        'walkInCloset': 'Walk-in closet',
        'builtInWardrobes': 'Built-in wardrobes',
        'organizedStorage': 'Organized storage',
        'upperLevels': 'Upper levels',
        'verticalCirculation': 'Vertical circulation',
        'architecturalFlow': 'Architectural flow',
        'connection': 'Connection',
        'outdoorLiving': 'Outdoor living',
        'freshAir': 'Fresh air',
        'openSky': 'Open sky',
        'entertainmentSpace': 'Entertainment space',
        'dedicatedWorkspace': 'Dedicated workspace',
        'quietEnvironment': 'Quiet environment',
        'homeOffice': 'Home office',
        'fitnessArea': 'Fitness area',
        'fullyEquipped': 'Fully equipped',
        'ventilation': 'Ventilation',
        'healthyLifestyle': 'Healthy lifestyle',

        // Scene Names (for room list)
        'scene_01_living': 'Living Room',
        'scene_02_dining': 'Dining & Open Kitchen',
        'scene_03_family_room': 'Family Room',
        'scene_04_corridor': 'Corridor',
        'scene_05_bedroom1': 'Bedroom 1',
        'scene_07_corridor2': 'Corridor',
        'scene_09_hallway': 'Hallway',
        'scene_10_family_room2': '2nd Floor Family Room',
        'scene_11_master_bedroom': 'Master Bedroom',
        'scene_12_master_bedroom2': 'Master Bedroom',
        'scene_13_master_bathroom': 'Master Bathroom',
        'scene_14_dressing_room': 'Dressing Room',
        'scene_15_stair_landing': 'Stair Landing',
        'scene_16_terrace': 'Terrace',
        'scene_17_office': 'Office',
        'scene_18_gym': 'Gym',

        // Room Areas
        'area_45_sqm': '~45 m²',
        'area_35_sqm': '~35 m²',
        'area_30_sqm': '~30 m²',
        'area_25_sqm': '~25 m²',
        'area_20_sqm': '~20 m²',
        'area_15_sqm': '~15 m²',
        'area_12_sqm': '~12 m²',
        'area_10_sqm': '~10 m²',
        'area_8_sqm': '~8 m²',
        'area_6_sqm': '~6 m²',
        'area_50_sqm': '~50 m²',
        'squareMeters': 'm²',

        // Gallery Image Titles
        'gallery_1': 'Entrance View',
        'gallery_2': 'GF - Dining Room 2',
        'gallery_3': 'GF - Living Room 2',
        'gallery_4': 'GF - Open Kitchen 1',
        'gallery_5': 'Mini Salon',
        'gallery_6': 'Mni Salon 2',
        'gallery_7': 'Scene 67',
        'gallery_8': 'Scene 68',
        'gallery_9': 'Scene 70',
        'gallery_10': 'Scene 71',
        'gallery_11': 'Scene 74',
        'gallery_12': 'Scene 77',
        'gallery_13': 'Scene 78',
        'gallery_14': 'Scene 80',
        'gallery_15': 'Scene 81',

        // Floor Names
        'groundFloor': 'Ground Floor',
        'firstFloor': 'First Floor',
        'secondFloor': 'Second Floor',
        'thirdFloor': 'Third Floor',

        // Loading Screen Settings
        'tourPreferences': 'Tour Preferences',
        'selectPreferences': 'Select your preferences before starting the tour',
        'autoRotateDesc': 'Enable smooth automatic camera rotation',
        'startWithGuidedTour': 'Start Guided Tour',
        'guidedTourDesc': 'Begin with an automated narrated tour'
      },
      am: {
        // UI Elements
        'virtualTour': 'የቨርቹዋል ጉብኝት',
        'rooms': 'ክፍሎች',
        'settings': 'ቅንብሮች',
        'language': 'ቋንቋ',
        'location': 'ቦታ',
        'tourInfo': 'የጉብኝት መረጃ',
        'guidedTour': 'የተመራ ጉብኝት',
        'gallery': 'ጋለሪ',
        'contact': 'አግኙን',
        'share': 'አጋራ',
        'fullscreen': 'ሙሉ ስክሪን',
        'resetView': 'እይታን ይመልሱ',
        'overlays': 'ኦቨርሌዎች',
        'sound': 'ድምፅ',
        'capture': 'ፎቶ ይውሰዱ',
        'zoomIn': 'አጉላ +',
        'zoomOut': 'አጥብ -',
        'floorPlan': 'የፎቅ እቅድ',
        'projectGallery': 'የፕሮጀክት ጋለሪ',
        'photosVideos': 'ፎቶዎች እና ቪዲዮዎች',
        'openGallery': 'ጋለሪውን ይክፈቱ',
        'previousRoom': 'ቀዳሚ ክፍል',
        'nextRoom': 'ቀጣይ ክፍል',
        'propertyInfo': 'የንብረት መረጃ',
        'startVirtualTour': 'የቨርቹዋል ጉብኝት ይጀምሩ',
        'preparingExperience': 'ልምድዎን እያዘጋጁ...',
        'loading': 'እየተጫነ...',
        'selectLanguage': 'ለጉብኝቱ የሚመችዎትን ቋንቋ ይምረጡ።',
        'darkMode': 'ጨለማ ሞድ',
        'lightMode': 'ብርሃን ሞድ',

        // Navigation
        'previous': 'ቀዳሚ',
        'next': 'ቀጣይ',

        // Info Card
        'room': 'ክፍል',
        'of': 'ከ',
        'hotspots': 'የትኩረት ነጥቦች',

        // Settings
        'autoRotate': 'ራስ-ማዞሪያ',
        'musicPlayer': 'የሙዚቃ ማጫወቻ',
        'ambientLounge': 'አምቢየንት ላውን',
        'backgroundMusic': 'የመደብ ሙዚቃ',
        'viewSettings': 'የእይታ ቅንብሮች',
        'zoomLevel': 'የማጉላት መጠን (FOV)',
        'quality': 'ጥራት',
        'high': 'ከፍተኛ',
        'medium': 'መካከለኛ',
        'low': 'ዝቅተኛ',
        'vrMode': 'VR ሞድ',
        'controls': 'መቆጣጠሪያዎች',
        'motionSensitivity': 'የእንቅስቃሴ ስሜታዊነት',
        'audio': 'ኦዲዮ',
        'volume': 'የድምፅ መጠን',
        'captureView': 'እይታን ይምረጡ',
        'imageQuality': 'የምስል ጥራት',
        'standard': 'መደበኛ',
        'high': 'ከፍተኛ',
        'maximum': 'ከፍተኛው',
        'watermark': 'ውሃ ምልክት',
        'captureCurrentView': 'አሁን ያለውን እይታ ይምረጡ',
        'about': 'ስለ',

        // Contact
        'contactUs': 'አግኙን',
        'getInTouch': 'ስለዚህ ንብረት ተጨማሪ መረጃ ለማግኘት ያግኙን።',
        'yourName': 'ስምዎ',
        'yourEmail': 'ኢሜይልዎ',
        'yourMessage': 'መልእክትዎ',
        'sendMessage': 'መልእክት ይላኩ',
        'messageSent': 'መልእክት ተልኳል!',

        // Share
        'shareThisTour': 'ይህን ጉብኝት አጋራ',
        'shareWithFriends': 'ይህን ቨርቹዋል ጉብኝት ከጓደኞችዎ እና ከሰራተኞችዎ ጋር ያጋሩ።',
        'shareOnSocial': 'በማህበራዊ ሚዲያ አጋራ',
        'copyLink': 'አገናኝ ቅዳ',
        'embedCode': 'የማካተቻ ኮድ',
        'qrCode': 'QR ኮድ',
        'scanToView': 'ለመመልከት ይስካን ያድርጉ',
        'linkCopied': 'አገናኝ ወደ ቅልጥፋ ሰሌዳ ተቀድቷል!',
        'embedCopied': 'የማካተቻ ኮድ ተቀድቷል!',
        'copy': 'ቅዳ',
        'directLink': 'ቀጥተኛ አገናኝ',
        'facebook': 'ፌስቡክ',
        'whatsapp': 'ዋትስአፕ',

        // Location
        'findUs': 'በዚህ ዋና ቦታ ግኙን',
        'property': 'ንብረት',
        'getDirections': 'አቅጣጫ ያግኙ',
        'copyAddress': 'አድራሻ ቅዳ',
        'openInMaps': 'በካርታ ይክፈቱ',
        'copied': 'ተቀድቷል!',
        'address': 'አድራሻ',
        'phone': 'ስልክ',
        'email': 'ኢሜይል',

        // Guided Tour
        'experienceTour': 'የተመራ ጉብኝት ከድምፅ አፈንጭ ጋር ይሞክሩ።',
        'tourType': 'የጉብኝት አይነት',
        'audioNarration': 'የድምፅ አፈንጭ',
        'textHighlights': 'የጽሁፍ ማሳያዎች',
        'audioAndText': 'ድምፅ + ጽሁፍ',
        'startTour': 'ጉብኝት ጀምር',
        'pause': 'ቆም አድርግ',
        'resume': 'ቀጥል',
        'stop': 'አቁም',

        // Gallery
        'photoGallery': 'የፎቶ ጋለሪ',
        'browsePhotos': 'በሙያተኛ ፎቶቻችን ስብስብ ውስጥ ያስሱ።',

        // Tour Info
        'propertyInformation': 'የንብረት መረጃ',
        'bedrooms': 'የመኝታ ክፍሎች',
        'bathrooms': 'የመታጠቢያ ክፍሎች',
        'sqFt': 'ካሬ ጫማ',
        'floors': 'ፎቆች',
        'description': 'መግለጫ',
        'amenities': 'አገልግሎቶች',
        'navigationControls': 'የአቅጣጫ መቆጣጠሪያዎች',
        'dragToLook': 'ለመመልከት ይጎትቱ',
        'scrollToZoom': 'ለማጉላት/ለማጥበብ ይሸራሸሩ',
        'clickArrows': 'ወደ ሌሎች ክፍሎች ለመሄድ ስሎቹን ይጫኑ',
        'clickHotspots': 'ለመፈተሽ የትኩረት ነጥቦችን ይጫኑ',
        'clickFloorPlan': 'ለፈጣን አቅጣጫ የፎቅ እቅድ ምልክቶችን ይጫኑ',

        // Language names
        'english': 'English',
        'amharic': 'አማርኛ',

        // CTA
        'interestedInProperty': 'በዚህ ብረት ተስብዎል?',
        'contactUsButton': 'አግኙን',

        // Loading
        'loadingTour': 'ጉብኝት እየተጫነ...',
        'errorLoading': 'ጉብኝትን በመጫን ላይ ስህተት',
        'roomsCount': 'ክፍሎች',
        'hotspotsCount': 'የትኩረት ነጥቦች',
        'floorsCount': 'ፎቆች',
        'guidedTourCount': 'የተመራ ጉብኝት',

        // Property Info Modal
        'propertyInfoTitle': 'የንብረት መረጃ',
        'available': 'ዝግጁ',
        'beds': 'አልጋዎች',
        'baths': 'መታጠቢያዎች',
        'sqft': 'ካሬ ጫማ',
        'overview': 'አጠቃላይ እይታ',
        'features': 'ባህሪያት',
        'location': 'ቦታ',
        'contact': 'አግኙን',
        'propertyOverview': 'የንብረት አጠቃላይ እይታ',
        'propertyDescription': 'በፖርት ሞርስቢ ልብ ውስጥ ያለውን ፍቅማዊ ኑሮ ይሞክሩ። ይህ አስደናቂ ባለ ብዙ ፎቅ ንብረት ዘመናዊ አርክቴክቸር፣ ሰፊ የመኖሪያ ቦታዎች፣ ከፍታ ያላቸው መስኮቶች እና ፕሪሚየም ፊኒሾች አሉት።',
        'amenities': 'አገልግሎቶች',
        'swimmingPool': 'የመዋኛ ገንዳ',
        'fitnessCenter': 'የፊትነስ ማዕከል',
        'parking': 'መኪና ማቆሚያ',
        'garden': 'ገነት',
        'security24_7': '24/7 ደህንነት',
        'highSpeedWifi': 'ከፍተኛ ፍጥነት ያለው WiFi',
        'airConditioning': 'ኤር ኮንዲሽነር',
        'smartHome': 'ስማርት ሆም',
        'occupancy': 'የመያዣ መጠን',
        'propertyFeatures': 'የንብረት ባህሪያት',
        'modernArchitecture': 'ዘመናዊ አርክቴክቸር',
        'modernArchitectureDesc': 'ከንጹህ መስመሮች እና ፕሪሚየም ቁሳቁሶች ጋር ያለ ወቅታዊ ዲዛይን',
        'multiFloorDesign': 'ባለ ብዙ ፎቅ ዲዛይን',
        'multiFloorDesignDesc': 'ለተሻለ ኑሮ በብዙ ደረጃዎች ላይ ያለ ሰፊ አቀማመጥ',
        'premiumFinishes': 'ፕሪሚየም ፊኒሾች',
        'premiumFinishesDesc': 'በሁሉም ቦታ ከፍተኛ ጥራት ያላቸው ቁሳቁሶች እና ቁሳቁሶች',
        'waterfrontLocation': 'የውሃ ጠርፍ ቦታ',
        'waterfrontLocationDesc': 'አስደናቂ የውሃ እይታዎች ያሉት ቁልፍ ቦታ',
        'smartHomeTech': 'ስማርት ሆም ቴክኖሎጂ',
        'smartHomeTechDesc': 'ለብርሃን፣ ክሊማ እና ደህንነት የተዋሃደ አውቶሜሽን',
        'energyEfficient': 'የኃይል ቁጠባ',
        'energyEfficientDesc': 'የፀሐይ ፓነሎች እና ኃይል ቁጣቢ መሳሪያዎች',
        'spacesInclude': 'ሚጨምሩ ቦታዎች',
        'livingDiningAreas': 'የመኖሪያ እና የመብላት ቦታዎች',
        'gourmetKitchen': 'ጉርሜ ምግብ ቤት',
        'masterBedrooms': 'ማስተር የመኝታ ክፍሎች',
        'luxuryBathrooms': 'ቅንጦት የመታጠቢያ ክፍሎች',
        'familyRoom': 'የቤተሰብ ክፍል',
        'gymTerrace': 'ጂም እና ቴራስ',
        'homeOffice': 'የቤት ጽህፈት ቤት',
        'outdoorEntertainment': 'የውጭዎች መዝናኛ',
        'primeLocation': 'ዋና ቦታ',
        'locationDescription': 'ይህ ንብረት በፖርት ሞርስቢ ልብ ውስጥ ሲገኝ፣ ወደ ግዢ፣ መብላት እና የንግድ ወረዳዎች ቀላል መድረስ ይሰጣል።',
        'address': 'አድራሻ',
        'coordinates': 'መጋጠሚያዎች',
        'distanceToCBD': 'ወደ CBD ርቀት',
        'airport': 'ኤርፖርት',
        'contactInquiries': 'እውቂያ እና ጥያቄዎች',
        'contactIntro': 'በዚህ ንብረት ተስብዎታል? ተጨማሪ መረጃ ለማግኘት ከሽያጭ ቡድናችን ጋር ያግኙ።',
        'phone': 'ስልክ',
        'email': 'ኢሜይል',
        'officeHours': 'የጽህፈት ቤት ሰዓታት',
        'website': 'ድረ-ገጽ',
        'call': 'ስልክ ይደውሉ',
        'visit': 'ይጎብኙ',
        'sendInquiry': 'ጥያቄ ይላኩ',
        'yourName': 'ስምዎ',
        'yourEmail': 'ኢሜይልዎ',
        'yourPhone': 'ስልክዎ',
        'interestedIn': 'በ... ተስብዎታል?',
        'buying': 'መግዛት',
        'renting': 'መከራየት',
        'viewing': 'እይታን ማስተካከል',
        'info': 'ተጨማሪ መረጃ',
        'yourMessage': 'መልእክትዎ',
        'sendInquiryButton': 'ጥያቄ ይላኩ',

        // Room Types
        'livingRoom': 'የመኖሪያ ክፍል',
        'diningKitchen': 'የመብላት ክፍል እና ምግብ ቤት',
        'familyRoom': 'የቤተሰብ ክፍል',
        'corridor': 'መተላለፊያ',
        'bedroom': 'የመኝታ ክፍል',
        'hallway': 'መተላለፊያ',
        'masterBedroom': 'ማስተር የመኝታ ክፍል',
        'masterBathroom': 'ማስተር የመታጠቢያ ክፍል',
        'dressingRoom': 'የልብስ ክፍል',
        'stairLanding': 'የደረጃ መድረክ',
        'terrace': 'ቴራስ',
        'office': 'ጽህፈት ቤት',
        'gym': 'ጂም',
        'bathroom': 'የመታጠቢያ ክፍል',
        'diningRoom': 'የመብላት ክፍል',
        'kitchen': 'ምግብ ቤት',
        'garage': 'ጋራዥ',
        'balcony': 'ባልኮኒ',
        'laundryRoom': 'የልብስ ማጠቢያ ክፍል',
        'storage': 'ማከማቻ',
        'entrance': 'መግቢያ',
        'powderRoom': 'የእንግዳ መታጠቢያ',
        'studyRoom': 'የጥናት ክፍል',
        'playroom': 'የጨዋታ ክፍል',
        'mediaRoom': 'የሚዲያ ክፍል',
        'wineCellar': 'የጠጅ ማከማቻ',

        // Room Features
        'highCeilings': 'ከፍተኛ ጣሪያዎች',
        'largeWindows': 'ትላልቅ መስኮቶች',
        'naturalLight': 'ተፈጥሯዊ ብርሃን',
        'openPlan': 'ክፍት ዕቅድ',
        'openKitchen': 'ክፍት ምግብ ቤት',
        'diningArea': 'የመብላት ቦታ',
        'modernAppliances': 'ዘመናዊ መሳሪያዎች',
        'counterSpace': 'የካውንተር ቦታ',
        'cozySpace': 'ማቅለጫ ቦታ',
        'familyArea': 'የቤተሰብ ቦታ',
        'relaxationZone': 'የእረፍት ዞን',
        'firstFloor': 'የመጀመሪያ ፎቅ',
        'hallwayAccess': 'መተላለፊያ',
        'bedroomAccess': 'የመኝታ ክፍል መዳረሻ',
        'elegantFinishes': 'ኤሌጋንት ፊኒሾች',
        'transitionalSpace': 'የሽግግር ቦታ',
        'peacefulRetreat': 'ሰላማዊ መጠለያ',
        'comfortableSpace': 'ምቾት ያለው ቦታ',
        'private': 'ግላዊ',
        'qualityFinishes': 'ጥራት ያላቸው ፊኒሾች',
        'connectionSpace': 'የግንኙነት ቦታ',
        'centralLanding': 'መሃል መድረክ',
        'stairAccess': 'የደረጃ መዳረሻ',
        'roomConnections': 'የክፍል ግንኙነቶች',
        'transitional': 'የሽግግር',
        'additionalLiving': 'ተጨማሪ መኖሪያ',
        'versatileSpace': 'ባለብዙ ቦታ',
        'upperLevel': 'የላይኛው ደረጃ',
        'privateRetreat': 'ግላዊ መጠለያ',
        'spacious': 'ሰፊ',
        'kingSizeCapacity': 'የንጉስ አልጋ አቅም',
        'sereneEnvironment': 'ሰላማዊ አካባቢ',
        'masterSuite': 'ማስተር ስዊት',
        'designDetails': 'የዲዛይን ዝርዝሮች',
        'bathroomAccess': 'የመታጠቢያ መዳረሻ',
        'dressingRoomAccess': 'የልብስ ክፍል መዳረሻ',
        'modernFixtures': 'ዘመናዊ ቁሳቁሶች',
        'vanityArea': 'የቫኒቲ ቦታ',
        'shower': 'ሻወር',
        'premiumFittings': 'ፕሪሚየም ቁሳቁሶች',
        'walkInCloset': 'ወደ ውስጥ የሚገባ ክሎዘት',
        'builtInWardrobes': 'የተገነቡ ጋርድሮቦች',
        'organizedStorage': 'የተደራጀ ማከማቻ',
        'upperLevels': 'የላይኛ ደረጃዎች',
        'verticalCirculation': 'ቋሊ ዝውውር',
        'architecturalFlow': 'የአርክቴክቸር ፍሰት',
        'connection': 'ግንኙነት',
        'outdoorLiving': 'የውጭ መኖሪያ',
        'freshAir': 'ንጹህ አየር',
        'openSky': 'ክፍት ሰማይ',
        'entertainmentSpace': 'የመዝናኛ ቦታ',
        'dedicatedWorkspace': 'ተለይቶ የተሰጠ የስራ ቦታ',
        'quietEnvironment': 'ፀጥ ያለ አካባቢ',
        'homeOffice': 'የቤት ጽህፈት ቤት',
        'fitnessArea': 'የፊትነስ ቦታ',
        'fullyEquipped': 'ሙሉ በሙሉ የታጠረ',
        'ventilation': 'አየር ማሽከርከር',
        'healthyLifestyle': 'ጤናማ የኑሮ ዘይቤ',

        // Scene Names (for room list)
        'scene_01_living': 'የመኖሪያ ክፍል',
        'scene_02_dining': 'የመብላት ክፍል እና ክፍት ምግብ ቤት',
        'scene_03_family_room': 'የቤተሰብ ክፍል',
        'scene_04_corridor': 'መተላለፊያ',
        'scene_05_bedroom1': 'መኝታ ክፍል 1',
        'scene_07_corridor2': 'መተላለፊያ',
        'scene_09_hallway': 'መተላለፊያ',
        'scene_10_family_room2': 'በ2ኛ ፎቅ የቤተሰብ ክፍል',
        'scene_11_master_bedroom': 'ማስተር የመኝታ ክፍል',
        'scene_12_master_bedroom2': 'ማስተር የመኝታ ክፍል',
        'scene_13_master_bathroom': 'ማስተር የመታጠቢያ ክፍል',
        'scene_14_dressing_room': 'የልብስ ክፍል',
        'scene_15_stair_landing': 'የደረጃ መድረክ',
        'scene_16_terrace': 'ቴራስ',
        'scene_17_office': 'ጽህፈት ቤት',
        'scene_18_gym': 'ጂም',

        // Room Areas
        'area_45_sqm': '~45 ካሬ ሜትር',
        'area_35_sqm': '~35 ካሬ ሜትር',
        'area_30_sqm': '~30 ካሬ ሜትር',
        'area_25_sqm': '~25 ካሬ ሜትር',
        'area_20_sqm': '~20 ካሬ ሜትር',
        'area_15_sqm': '~15 ካሬ ሜትር',
        'area_12_sqm': '~12 ካሬ ሜትር',
        'area_10_sqm': '~10 ካሬ ሜትር',
        'area_8_sqm': '~8 ካሬ ሜትር',
        'area_6_sqm': '~6 ካሬ ሜትር',
        'area_50_sqm': '~50 ካሬ ሜትር',
        'squareMeters': 'ካሬ ሜትር',

        // Gallery Image Titles
        'gallery_1': 'የመግቢያ እይታ',
        'gallery_2': 'GF - የመብላት ክፍል 2',
        'gallery_3': 'GF - የመኖሪያ ክፍል 2',
        'gallery_4': 'GF - ክፍት ምግብ ቤት 1',
        'gallery_5': 'ሚኒ ሳሎን',
        'gallery_6': 'ምኒ ሳሎን 2',
        'gallery_7': 'ስኬን 67',
        'gallery_8': 'ስኬን 68',
        'gallery_9': 'ስኬን 70',
        'gallery_10': 'ስኬን 71',
        'gallery_11': 'ስኬን 74',
        'gallery_12': 'ስኬን 77',
        'gallery_13': 'ስኬን 78',
        'gallery_14': 'ስኬን 80',
        'gallery_15': 'ስኬን 81',

        // Floor Names
        'groundFloor': 'ግራውንድ ፎቅ',
        'firstFloor': '1ኛ ፎቅ',
        'secondFloor': '2ኛ ፎቅ',
        'thirdFloor': '3ኛ ፎቅ',

        // Loading Screen Settings
        'tourPreferences': 'የጉብኝት ምርጫዎች',
        'selectPreferences': 'ጉብኝቱን ከመጀመርዎ በፊት ምርጫዎችዎን ይምረጡ',
        'autoRotateDesc': 'ለራስ-ሰር ካሜራ መዞር ያስችላል',
        'startWithGuidedTour': 'የተመራ ጉብኝት ይጀምሩ',
        'guidedTourDesc': 'በተመራ የተናገረ ጉብኝት ይጀምሩ'
      }
    };
  }

  /**
   * Get translation for a key
   */
  t(key, lang = null) {
    const language = lang || this.currentLanguage;
    return this.translations[language]?.[key] || this.translations.en[key] || key;
  }

  /**
   * Set current language
   */
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      this.applyTranslations();
      return true;
    }
    return false;
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages() {
    return Object.keys(this.translations).map(code => ({
      code,
      name: this.translations[code].english
    }));
  }

  /**
   * Apply translations to the DOM
   */
  applyTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translation = this.t(key);

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.placeholder) {
          el.placeholder = translation;
        }
      } else {
        el.textContent = translation;
      }
    });

    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = this.t(key);
    });

    // Update title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      el.title = this.t(key);
    });

    // Dispatch event for other components to update
    window.dispatchEvent(new CustomEvent('language-changed', {
      detail: { language: this.currentLanguage }
    }));
  }

  /**
   * Translate a specific element
   */
  translateElement(elementId, key) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = this.t(key);
    }
  }
}
