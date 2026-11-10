/**
 * South African Provinces, Regional Hubs & Curated Romantic Date Destinations
 * Expands DateFund recommendations across all 9 provinces with GPS proximity awareness.
 */

export interface SAProvince {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  center: { lat: number; lng: number };
  sampleTowns: string[];
}

export const SA_PROVINCES: SAProvince[] = [
  {
    id: 'wc',
    name: 'Western Cape',
    shortName: 'Cape & Winelands',
    tagline: 'Atlantic sunsets, valley vineyards & coastal hideaways',
    center: { lat: -33.9249, lng: 18.4241 }, // Cape Town
    sampleTowns: ['Cape Town', 'Franschhoek', 'Stellenbosch', 'Hermanus', 'Knysna', 'Plettenberg Bay']
  },
  {
    id: 'gp',
    name: 'Gauteng',
    shortName: 'Joburg, Pretoria & Ekurhuleni',
    tagline: 'Skyline rooftops, Ekurhuleni lakeside hideaways & cozy garden cafés',
    center: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
    sampleTowns: ['Benoni', 'Boksburg', 'Brakpan', 'Springs', 'Bedfordview', 'Johannesburg', 'Pretoria', 'Rosebank']
  },
  {
    id: 'ekurhuleni',
    name: 'Ekurhuleni (East Rand)',
    shortName: 'Benoni · Boksburg · Brakpan · Springs',
    tagline: 'Lakeside picnics, cozy garden cafés, bird sanctuaries & vibrant date nights',
    center: { lat: -26.2050, lng: 28.3350 }, // Central Ekurhuleni (between Benoni/Boksburg/Brakpan/Springs)
    sampleTowns: ['Benoni', 'Boksburg', 'Brakpan', 'Springs', 'Bedfordview', 'Edenvale', 'Kempton Park']
  },
  {
    id: 'kzn',
    name: 'KwaZulu-Natal',
    shortName: 'Durban & Coast',
    tagline: 'Warm ocean breezes, Midlands meanders & dolphin coast walks',
    center: { lat: -29.8587, lng: 31.0218 }, // Durban
    sampleTowns: ['Durban', 'Umhlanga', 'Ballito', 'Midlands Meander', 'St Lucia', 'Drakensberg']
  },
  {
    id: 'mp',
    name: 'Mpumalanga',
    shortName: 'Panorama & Kruger',
    tagline: 'Misty mountain passes, roaring fireplaces & safari sunsets',
    center: { lat: -25.4753, lng: 30.9694 }, // Mbombela / Dullstroom
    sampleTowns: ['Dullstroom', 'Graskop', 'Hazyview', 'White River', 'Sabie', 'Blyde River']
  },
  {
    id: 'ec',
    name: 'Eastern Cape',
    shortName: 'Garden Route & Wild Coast',
    tagline: 'Rugged wild coastlines, fairy forests & pristine tidal beaches',
    center: { lat: -33.9608, lng: 25.6022 }, // Gqeberha
    sampleTowns: ['Gqeberha (PE)', 'Jeffreys Bay', 'St Francis Bay', 'Hogsback', 'Tsitsikamma', 'Chintsa']
  },
  {
    id: 'nw',
    name: 'North West',
    shortName: 'Harties & Pilanesberg',
    tagline: 'Lake cableways, hot air balloons & volcanic crater safaris',
    center: { lat: -25.7277, lng: 27.8863 }, // Hartbeespoort
    sampleTowns: ['Hartbeespoort', 'Magaliesberg', 'Pilanesberg', 'Rustenburg', 'Sun City']
  },
  {
    id: 'fs',
    name: 'Free State',
    shortName: 'Clarens & Golden Gate',
    tagline: 'Sandstone artist village, craft cider & Maluti mountain sunsets',
    center: { lat: -28.5152, lng: 28.4194 }, // Clarens
    sampleTowns: ['Clarens', 'Golden Gate', 'Parys (Vaal River)', 'Bloemfontein']
  },
  {
    id: 'lp',
    name: 'Limpopo',
    shortName: 'Magoebaskloof & Safari',
    tagline: 'Enchanted cloud forests, tea plantations & hot mineral springs',
    center: { lat: -23.9045, lng: 29.4688 }, // Polokwane / Haenertsburg
    sampleTowns: ['Haenertsburg', 'Magoebaskloof', 'Bela-Bela', 'Waterberg', 'Hoedspruit']
  },
  {
    id: 'nc',
    name: 'Northern Cape',
    shortName: 'Stargazing & Desert',
    tagline: 'Dark sky telescope observatories, silence & dramatic waterfalls',
    center: { lat: -32.3939, lng: 20.6622 }, // Sutherland
    sampleTowns: ['Sutherland', 'Augrabies Falls', 'Kimberley', 'Colesberg']
  }
];

export interface EkurhuleniSubRegion {
  id: string;
  name: string;
  tagline: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
  defaultPlacesQueries: string[];
}

export const EKURHULENI_SUBREGIONS: EkurhuleniSubRegion[] = [
  {
    id: 'all-ekurhuleni',
    name: 'All Ekurhuleni',
    tagline: 'Benoni, Boksburg, Brakpan, Springs & Bedfordview',
    center: { lat: -26.2050, lng: 28.3350 },
    radiusMeters: 22000,
    defaultPlacesQueries: [
      'romantic restaurant cozy cafe Benoni Boksburg Ekurhuleni',
      'date night restaurant garden cafe Brakpan Springs Ekurhuleni'
    ]
  },
  {
    id: 'benoni',
    name: 'Benoni',
    tagline: 'Farrarmere cafés, Rynfield country markets, Korsman Bird Sanctuary & Homestead Dam',
    center: { lat: -26.1885, lng: 28.3208 },
    radiusMeters: 10000,
    defaultPlacesQueries: [
      'romantic restaurant cozy cafe Rynfield Farrarmere Benoni',
      'best date restaurants coffee shops parks Benoni'
    ]
  },
  {
    id: 'boksburg',
    name: 'Boksburg',
    tagline: 'Bokkie Park tea garden, Bartlett steakhouses, Woodlands spa & Sunward Park bistros',
    center: { lat: -26.2125, lng: 28.2526 },
    radiusMeters: 10000,
    defaultPlacesQueries: [
      'romantic restaurant cozy cafe Bartlett Sunward Park Boksburg',
      'couples spa park tea garden restaurant Boksburg'
    ]
  },
  {
    id: 'brakpan',
    name: 'Brakpan',
    tagline: 'Carnival City date nights, bowling, Dalpark bird sanctuary & cozy grill lounges',
    center: { lat: -26.2366, lng: 28.3694 },
    radiusMeters: 10000,
    defaultPlacesQueries: [
      'Carnival City restaurants date activities Brakpan',
      'cozy cafe restaurant bistro Dalpark Brakpan'
    ]
  },
  {
    id: 'springs',
    name: 'Springs',
    tagline: 'Marievale Bird Sanctuary wetlands, Petersfield garden cafés & country club sunsets',
    center: { lat: -26.2547, lng: 28.4428 },
    radiusMeters: 12000,
    defaultPlacesQueries: [
      'cozy cafe restaurant Petersfield Selection Park Springs',
      'Marievale Bird Sanctuary nature date restaurant Springs'
    ]
  },
  {
    id: 'bedfordview-edenvale',
    name: 'Bedfordview & Edenvale',
    tagline: "Gillooly's Farm lakeside walks, Village View fine dining & Glendower terraces",
    center: { lat: -26.1764, lng: 28.1464 },
    radiusMeters: 9000,
    defaultPlacesQueries: [
      'romantic restaurant cozy cafe Village View Bedfordview Edenvale',
      'Gilloolys Farm lakeside restaurant picnic Bedfordview'
    ]
  }
];

export interface CuratedDateSpot {
  id: string;
  provinceId: string;
  subRegionId?: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  userRatingCount: number;
  priceLevel: string;
  category: string;
  mood: 'Romantic' | 'Adventurous' | 'Cozy' | 'Playful' | 'Luxurious' | 'Relaxed';
  summary: string;
  estimatedBudgetZar: number;
  isAiGenerated?: boolean;
}

export const ALL_PROVINCES_DATE_SPOTS: CuratedDateSpot[] = [
  // EKURHULENI — BENONI
  {
    id: 'ek-benoni-1',
    provinceId: 'ekurhuleni',
    subRegionId: 'benoni',
    name: 'Korsman Bird Sanctuary & Farrarmere Coffee Walk',
    address: 'The Drive, Westdene, Benoni, Ekurhuleni',
    location: { lat: -26.1839, lng: 28.3036 },
    rating: 4.7,
    userRatingCount: 1120,
    priceLevel: 'R',
    category: 'Cozy & Nature',
    mood: 'Cozy',
    summary: 'Stroll hand-in-hand around Benoni’s tranquil flamingo and waterfowl pan at golden hour, followed by artisanal pastries and cappuccinos in leafy Farrarmere.',
    estimatedBudgetZar: 260,
  },
  {
    id: 'ek-benoni-2',
    provinceId: 'ekurhuleni',
    subRegionId: 'benoni',
    name: 'Homestead Dam Sunset Picnic & Kayaking',
    address: 'Main Rd, Farrarmere, Benoni, Ekurhuleni',
    location: { lat: -26.1682, lng: 28.3069 },
    rating: 4.6,
    userRatingCount: 1640,
    priceLevel: 'R',
    category: 'Lakeside Picnic',
    mood: 'Relaxed',
    summary: 'Spread a woven blanket on the grassy banks of Homestead Dam in Benoni with a gourmet picnic basket, sunset reflections, and calm afternoon paddling.',
    estimatedBudgetZar: 340,
  },
  {
    id: 'ek-benoni-3',
    provinceId: 'ekurhuleni',
    subRegionId: 'benoni',
    name: 'Ebotse Links Waterfront Dining & Sundowners',
    address: 'Sarel Cilliers St, Rynfield, Benoni, Ekurhuleni',
    location: { lat: -26.1538, lng: 28.3489 },
    rating: 4.7,
    userRatingCount: 980,
    priceLevel: 'RRR',
    category: 'Romantic Dining',
    mood: 'Romantic',
    summary: 'Intimate waterfront terrace overlooking Rynfield Dam in Benoni, serving wood-fired dishes, craft cocktails, and sweeping East Rand sunset views.',
    estimatedBudgetZar: 820,
  },
  {
    id: 'ek-benoni-4',
    provinceId: 'ekurhuleni',
    subRegionId: 'benoni',
    name: 'The Sheds @ Country Lane Market & Live Acoustic Date',
    address: '139 Pretoria Rd, Rynfield, Benoni, Ekurhuleni',
    location: { lat: -26.1419, lng: 28.3612 },
    rating: 4.7,
    userRatingCount: 1450,
    priceLevel: 'RR',
    category: 'Cozy Market & Craft',
    mood: 'Cozy',
    summary: 'Rustic country courtyard in Rynfield with fairy lights, artisanal wood-fired pizzas, craft gin bars, and acoustic live music under old eucalyptus trees.',
    estimatedBudgetZar: 480,
  },
  {
    id: 'ek-benoni-5',
    provinceId: 'ekurhuleni',
    subRegionId: 'benoni',
    name: 'Benoni Bunny Park & Shaded Oak Picnic',
    address: 'Pretoria Rd, Rynfield, Benoni, Ekurhuleni',
    location: { lat: -26.1604, lng: 28.3371 },
    rating: 4.5,
    userRatingCount: 2300,
    priceLevel: 'R',
    category: 'Playful & Cozy',
    mood: 'Playful',
    summary: 'Wholesome, nostalgic daytime date feeding friendly rabbits and farm animals beneath towering oak trees, paired with warm pancakes and coffee.',
    estimatedBudgetZar: 220,
  },
  {
    id: 'ek-benoni-6',
    provinceId: 'ekurhuleni',
    subRegionId: 'benoni',
    name: 'Farrarmere Boutique Café & Pottery Painting Date',
    address: 'Sheridan Rd, Farrarmere, Benoni, Ekurhuleni',
    location: { lat: -26.1645, lng: 28.3125 },
    rating: 4.8,
    userRatingCount: 740,
    priceLevel: 'RR',
    category: 'Cozy Café & Creative',
    mood: 'Cozy',
    summary: 'Cozy suburban garden café in Benoni where couples paint custom ceramics together over red cappuccinos, baked cheesecake, and artisanal brunch.',
    estimatedBudgetZar: 460,
  },

  // EKURHULENI — BOKSBURG
  {
    id: 'ek-boksburg-1',
    provinceId: 'ekurhuleni',
    subRegionId: 'boksburg',
    name: 'Bokkie Park Tea Garden & Couples Picnic',
    address: 'Southvale Rd, Parkdene, Boksburg, Ekurhuleni',
    location: { lat: -26.2289, lng: 28.2533 },
    rating: 4.6,
    userRatingCount: 2890,
    priceLevel: 'R',
    category: 'Cozy Tea Garden',
    mood: 'Cozy',
    summary: 'Beloved Boksburg green sanctuary featuring a charming outdoor tea garden, homemade scones with clotted cream, and peaceful shaded lawns.',
    estimatedBudgetZar: 280,
  },
  {
    id: 'ek-boksburg-2',
    provinceId: 'ekurhuleni',
    subRegionId: 'boksburg',
    name: 'Birchwood Sanctuary Gardens & Steakhouse Dinner',
    address: '14 View Point Rd, Bartlett, Boksburg, Ekurhuleni',
    location: { lat: -26.1695, lng: 28.2484 },
    rating: 4.6,
    userRatingCount: 3400,
    priceLevel: 'RRR',
    category: 'Romantic Dining & Spa',
    mood: 'Romantic',
    summary: 'Lush water-feature gardens in Bartlett, Boksburg offering couples hydro-spa treatments followed by candlelit steak and wine pairings.',
    estimatedBudgetZar: 950,
  },
  {
    id: 'ek-boksburg-3',
    provinceId: 'ekurhuleni',
    subRegionId: 'boksburg',
    name: 'Sunward Park Mediterranean Courtyard Bistro',
    address: 'Kingfisher Ave, Sunward Park, Boksburg, Ekurhuleni',
    location: { lat: -26.2562, lng: 28.2798 },
    rating: 4.7,
    userRatingCount: 1180,
    priceLevel: 'RR',
    category: 'Cozy Fireplace Bistro',
    mood: 'Cozy',
    summary: 'Warm neighborhood bistro in Sunward Park with crackling winter fireplaces, wood-fired tapas, seafood platters, and intimate booth seating.',
    estimatedBudgetZar: 620,
  },
  {
    id: 'ek-boksburg-4',
    provinceId: 'ekurhuleni',
    subRegionId: 'boksburg',
    name: 'ERPM 1903 Heritage Clubhouse Sundowners',
    address: 'Jhomo Kenyatta Dr, Boksburg West, Boksburg',
    location: { lat: -26.2078, lng: 28.2291 },
    rating: 4.6,
    userRatingCount: 820,
    priceLevel: 'RR',
    category: 'Scenic & Sunset',
    mood: 'Relaxed',
    summary: 'Historic tree-lined fairways in Boksburg with a wrap-around veranda perfect for quiet golden-hour drinks and shared gourmet platters.',
    estimatedBudgetZar: 450,
  },

  // EKURHULENI — BRAKPAN
  {
    id: 'ek-brakpan-1',
    provinceId: 'ekurhuleni',
    subRegionId: 'brakpan',
    name: 'Carnival City Ten-Pin Bowling, Arcade & Dinner Night',
    address: 'Century Rd, Elsburg Rd, Brakpan, Ekurhuleni',
    location: { lat: -26.2591, lng: 28.3188 },
    rating: 4.6,
    userRatingCount: 5400,
    priceLevel: 'RR',
    category: 'Fun & Playful Date',
    mood: 'Playful',
    summary: 'High-energy East Rand date night in Brakpan with competitive ten-pin bowling, laser tag, carnival sweets, and dinner at signature restaurants.',
    estimatedBudgetZar: 680,
  },
  {
    id: 'ek-brakpan-2',
    provinceId: 'ekurhuleni',
    subRegionId: 'brakpan',
    name: 'Dalpark Bird Sanctuary & Lakeside Sunset Walk',
    address: 'Dalpark Ext 1, Brakpan, Ekurhuleni',
    location: { lat: -26.2542, lng: 28.3315 },
    rating: 4.5,
    userRatingCount: 610,
    priceLevel: 'R',
    category: 'Scenic Nature Walk',
    mood: 'Relaxed',
    summary: 'Peaceful natural wetland and dam reserve in Dalpark, Brakpan where couples enjoy quiet late-afternoon walks and lakeside birdwatching.',
    estimatedBudgetZar: 200,
  },
  {
    id: 'ek-brakpan-3',
    provinceId: 'ekurhuleni',
    subRegionId: 'brakpan',
    name: 'Brakpan Cozy Steak & Craft Lounge Date',
    address: 'Voortrekker Rd / Mall@Carnival, Brakpan, Ekurhuleni',
    location: { lat: -26.2465, lng: 28.3482 },
    rating: 4.5,
    userRatingCount: 940,
    priceLevel: 'RR',
    category: 'Cozy Grill & Cocktails',
    mood: 'Cozy',
    summary: 'Relaxed fireside grill and cocktail lounge in Brakpan serving flame-grilled ribs, gourmet milkshakes, and warm chocolate lava cake for two.',
    estimatedBudgetZar: 540,
  },

  // EKURHULENI — SPRINGS
  {
    id: 'ek-springs-1',
    provinceId: 'ekurhuleni',
    subRegionId: 'springs',
    name: 'Marievale Bird Sanctuary Wetland Hide & Flask Picnic',
    address: 'R42 Delmas-Nigel Rd, Marievale, Springs, Ekurhuleni',
    location: { lat: -26.3614, lng: 28.5139 },
    rating: 4.8,
    userRatingCount: 1520,
    priceLevel: 'R',
    category: 'Cozy Nature Sanctuary',
    mood: 'Cozy',
    summary: 'Bring a thermos of hot chocolate and fresh croissants to secluded wooden hides overlooking pristine Blesbokspruit wetlands just outside Springs.',
    estimatedBudgetZar: 240,
  },
  {
    id: 'ek-springs-2',
    provinceId: 'ekurhuleni',
    subRegionId: 'springs',
    name: 'Petersfield Secret Garden Café & Artisanal Bakery',
    address: '1st Ave, Petersfield, Springs, Ekurhuleni',
    location: { lat: -26.2318, lng: 28.4512 },
    rating: 4.7,
    userRatingCount: 870,
    priceLevel: 'RR',
    category: 'Cozy Garden Café',
    mood: 'Cozy',
    summary: 'Leafy courtyard café in Petersfield, Springs famous for velvet lattes, warm Belgian waffles, and intimate morning brunch dates under pergola vines.',
    estimatedBudgetZar: 380,
  },
  {
    id: 'ek-springs-3',
    provinceId: 'ekurhuleni',
    subRegionId: 'springs',
    name: 'Springs Country Club Fairway Sunset & Grill',
    address: '44A 8th St, Selection Park, Springs, Ekurhuleni',
    location: { lat: -26.2658, lng: 28.4195 },
    rating: 4.6,
    userRatingCount: 790,
    priceLevel: 'RR',
    category: 'Romantic Sunset Dining',
    mood: 'Romantic',
    summary: 'Unwind on the Selection Park terrace in Springs watching golden hour settle over manicured greens with chilled wine and classic steakhouse dining.',
    estimatedBudgetZar: 580,
  },
  {
    id: 'ek-springs-4',
    provinceId: 'ekurhuleni',
    subRegionId: 'springs',
    name: 'Pollak Park Country Estate Sunday Lunch & Stroll',
    address: '80C South Main Reef Rd, Pollak Park, Springs',
    location: { lat: -26.2784, lng: 28.4261 },
    rating: 4.5,
    userRatingCount: 640,
    priceLevel: 'RR',
    category: 'Relaxed Country Date',
    mood: 'Relaxed',
    summary: 'Tranquil mature trees and heritage clubhouse hospitality in Pollak Park, Springs for a slow-paced couple lunch and afternoon walk.',
    estimatedBudgetZar: 490,
  },

  // EKURHULENI — BEDFORDVIEW & EDENVALE
  {
    id: 'ek-bedford-1',
    provinceId: 'ekurhuleni',
    subRegionId: 'bedfordview-edenvale',
    name: "Gillooly's Farm Lakeside Walk & Waterfront Bistro",
    address: '47 Boeing Rd West, Bedfordview, Ekurhuleni',
    location: { lat: -26.1684, lng: 28.1337 },
    rating: 4.6,
    userRatingCount: 3850,
    priceLevel: 'RR',
    category: 'Lakeside Picnic & Café',
    mood: 'Cozy',
    summary: 'Weeping willows and shimmering water views at Gillooly’s Farm in Bedfordview—ideal for a lakeside stroll followed by wood-fired lunch on the deck.',
    estimatedBudgetZar: 520,
  },
  {
    id: 'ek-bedford-2',
    provinceId: 'ekurhuleni',
    subRegionId: 'bedfordview-edenvale',
    name: 'Village View Candlelit Seafood & Jazz Night',
    address: 'Van Buuren Rd, Bedfordview, Ekurhuleni',
    location: { lat: -26.1852, lng: 28.1496 },
    rating: 4.8,
    userRatingCount: 2650,
    priceLevel: 'RRRR',
    category: 'Fine Dining',
    mood: 'Luxurious',
    summary: 'Sophisticated white-tablecloth dining in Bedfordview with fresh Langoustines, fine Cape vintages, and intimate candlelit romance.',
    estimatedBudgetZar: 1350,
  },

  // WESTERN CAPE
  {
    id: 'wc-1',
    provinceId: 'wc',
    name: 'Kloof Street House',
    address: '30 Kloof St, Gardens, Cape Town',
    location: { lat: -33.9304, lng: 18.4116 },
    rating: 4.7,
    userRatingCount: 3890,
    priceLevel: '$$$',
    category: 'Fine Dining',
    mood: 'Romantic',
    summary: 'Fairy-lit Victorian courtyard with lush greenery, candlelit velvet booths, and craft cocktails.',
    estimatedBudgetZar: 950,
  },
  {
    id: 'wc-2',
    provinceId: 'wc',
    name: 'Franschhoek Wine Tram & Cellar Pairing',
    address: '32 Huguenot Rd, Franschhoek',
    location: { lat: -33.9142, lng: 19.1243 },
    rating: 4.8,
    userRatingCount: 4200,
    priceLevel: '$$$$',
    category: 'Travel & Wine',
    mood: 'Luxurious',
    summary: 'Hop-on hop-off open-air wooden tram touring Franschhoek Valley wine estates with gourmet pairings.',
    estimatedBudgetZar: 1800,
  },
  {
    id: 'wc-3',
    provinceId: 'wc',
    name: "Lion's Head Full Moon Sunset Walk",
    address: 'Signal Hill Rd, Cape Town',
    location: { lat: -33.9351, lng: 18.3892 },
    rating: 4.8,
    userRatingCount: 5600,
    priceLevel: '$',
    category: 'Scenic & Sunset',
    mood: 'Adventurous',
    summary: 'Golden hour hike overlooking Camps Bay and the Twelve Apostles, followed by twilight city views.',
    estimatedBudgetZar: 250,
  },
  {
    id: 'wc-4',
    provinceId: 'wc',
    name: 'Delaire Graff Estate Terraces',
    address: 'Helshoogte Rd, Stellenbosch',
    location: { lat: -33.9189, lng: 18.9228 },
    rating: 4.9,
    userRatingCount: 2900,
    priceLevel: '$$$$',
    category: 'Fine Dining',
    mood: 'Luxurious',
    summary: 'Perched on the crest of Helshoogte Pass with world-class sculptures, fine wines, and dramatic valley views.',
    estimatedBudgetZar: 2200,
  },
  {
    id: 'wc-5',
    provinceId: 'wc',
    name: 'Boulders Beach Sunset Boardwalk',
    address: 'Kleintuin Rd, Simon’s Town, Cape Town',
    location: { lat: -34.1973, lng: 18.4513 },
    rating: 4.7,
    userRatingCount: 6800,
    priceLevel: '$$',
    category: 'Relaxed & Nature',
    mood: 'Relaxed',
    summary: 'Stroll along sheltered white sand coves among wild African penguin colonies as the sun sinks over False Bay.',
    estimatedBudgetZar: 380,
  },

  // GAUTENG
  {
    id: 'gp-1',
    provinceId: 'gp',
    name: 'Marble Restaurant',
    address: '19 Keyes Ave, Rosebank, Johannesburg',
    location: { lat: -26.1472, lng: 28.0375 },
    rating: 4.6,
    userRatingCount: 3120,
    priceLevel: '$$$$',
    category: 'Fine Dining',
    mood: 'Luxurious',
    summary: 'Grand theatrical open-fire cooking and breathtaking skyline views over Johannesburg’s lush urban forest.',
    estimatedBudgetZar: 1400,
  },
  {
    id: 'gp-2',
    provinceId: 'gp',
    name: 'Four Seasons The Westcliff Rooftop',
    address: '67 Jan Smuts Ave, Westcliff, Johannesburg',
    location: { lat: -26.1762, lng: 28.0325 },
    rating: 4.7,
    userRatingCount: 2450,
    priceLevel: '$$$$',
    category: 'Scenic & Sunset',
    mood: 'Romantic',
    summary: 'Iconic terraced cliffside views over the city canopy with champagne cocktails and sunset sharing plates.',
    estimatedBudgetZar: 1600,
  },
  {
    id: 'gp-3',
    provinceId: 'gp',
    name: 'Rosemary Hill Farm & Sunset Picnics',
    address: '257 Graham Rd, Pretoria East',
    location: { lat: -25.7946, lng: 28.4328 },
    rating: 4.7,
    userRatingCount: 3300,
    priceLevel: '$$',
    category: 'Cozy & Nature',
    mood: 'Cozy',
    summary: 'Organic farm with horse riding trails, artisanal bakery, greenhouse coffee shop, and secluded pine forest picnics.',
    estimatedBudgetZar: 550,
  },
  {
    id: 'gp-4',
    provinceId: 'gp',
    name: 'Walter Sisulu National Botanical Garden',
    address: 'Malcolm Rd, Poortview, Roodepoort',
    location: { lat: -26.0867, lng: 27.8428 },
    rating: 4.8,
    userRatingCount: 5200,
    priceLevel: '$',
    category: 'Scenic & Sunset',
    mood: 'Relaxed',
    summary: 'Cascading Witpoortjie Waterfall, breeding Verreaux’s black eagles, and tranquil couple picnic lawns.',
    estimatedBudgetZar: 320,
  },

  // KWAZULU-NATAL
  {
    id: 'kzn-1',
    provinceId: 'kzn',
    name: 'The Oyster Box - The Grill Room',
    address: '2 Lighthouse Rd, Umhlanga Rocks, Durban',
    location: { lat: -29.7285, lng: 31.0877 },
    rating: 4.8,
    userRatingCount: 4600,
    priceLevel: '$$$$',
    category: 'Fine Dining',
    mood: 'Luxurious',
    summary: 'Legendary colonial romance with red-and-white lighthouse ocean views, fresh oysters, and classic piano serenades.',
    estimatedBudgetZar: 1750,
  },
  {
    id: 'kzn-2',
    provinceId: 'kzn',
    name: 'Midlands Meander Wine & Chocolate Trail',
    address: 'R103, Nottingham Road, KZN Midlands',
    location: { lat: -29.3582, lng: 29.9984 },
    rating: 4.7,
    userRatingCount: 2100,
    priceLevel: '$$$',
    category: 'Cozy & Country',
    mood: 'Cozy',
    summary: 'Rolling emerald hills, artisanal cheese tasting, Belgian chocolate makers, and cozy hearthside craft beer.',
    estimatedBudgetZar: 700,
  },
  {
    id: 'kzn-3',
    provinceId: 'kzn',
    name: 'Durban Point Waterfront Canal Gondolas',
    address: 'Durban Point Waterfront, Durban',
    location: { lat: -29.8708, lng: 31.0475 },
    rating: 4.6,
    userRatingCount: 1450,
    priceLevel: '$$',
    category: 'Romantic Cruise',
    mood: 'Romantic',
    summary: 'Venetian-style moonlight canal boat ride with sweet romantic music and sparkling water lanterns.',
    estimatedBudgetZar: 480,
  },

  // MPUMALANGA
  {
    id: 'mp-1',
    provinceId: 'mp',
    name: 'Dullstroom Fireplace & Trout Retreat',
    address: 'Naledi Dr, Dullstroom',
    location: { lat: -25.4191, lng: 30.1042 },
    rating: 4.8,
    userRatingCount: 1850,
    priceLevel: '$$$',
    category: 'Cozy Getaway',
    mood: 'Cozy',
    summary: 'South Africa’s highest village: roaring log fires, artisanal whisky tastings, and mist-cloaked fly-fishing dams.',
    estimatedBudgetZar: 1100,
  },
  {
    id: 'mp-2',
    provinceId: 'mp',
    name: 'Graskop Gorge Glass Lift & Forest Boardwalk',
    address: 'R533, Graskop',
    location: { lat: -24.9351, lng: 30.8443 },
    rating: 4.8,
    userRatingCount: 3900,
    priceLevel: '$$',
    category: 'Adventure & Nature',
    mood: 'Adventurous',
    summary: 'Glass elevator descending 51 meters into an indigenous rainforest canyon with hanging bridges and waterfalls.',
    estimatedBudgetZar: 650,
  },
  {
    id: 'mp-3',
    provinceId: 'mp',
    name: "God's Window & Wonder View",
    address: 'R534, Panorama Route, Graskop',
    location: { lat: -24.8741, lng: 30.8876 },
    rating: 4.7,
    userRatingCount: 4700,
    priceLevel: '$',
    category: 'Scenic Viewpoint',
    mood: 'Romantic',
    summary: 'Standing at the 700m drop of the Drakensberg escarpment overlooking the vast Kruger Lowveld plain.',
    estimatedBudgetZar: 180,
  },

  // EASTERN CAPE
  {
    id: 'ec-1',
    provinceId: 'ec',
    name: 'Tsitsikamma Storms River Suspension Bridge',
    address: 'Garden Route National Park, Storms River',
    location: { lat: -34.0223, lng: 23.9016 },
    rating: 4.9,
    userRatingCount: 5100,
    priceLevel: '$$',
    category: 'Adventure',
    mood: 'Adventurous',
    summary: 'Suspension bridge swaying over dark ocean gorge waters surrounded by ancient yellowwood forests.',
    estimatedBudgetZar: 420,
  },
  {
    id: 'ec-2',
    provinceId: 'ec',
    name: 'Hogsback Fairy Meander & Labyrinth',
    address: 'Main Rd, Hogsback, Amathole',
    location: { lat: -32.5936, lng: 26.9388 },
    rating: 4.7,
    userRatingCount: 1600,
    priceLevel: '$$',
    category: 'Cozy & Mystery',
    mood: 'Cozy',
    summary: 'Mystical mountain village of morning mist, 39-step forest labyrinth, and secret waterfalls said to inspire Tolkien.',
    estimatedBudgetZar: 550,
  },
  {
    id: 'ec-3',
    provinceId: 'ec',
    name: 'Richmond Hill Food & Wine District',
    address: 'Stanley St, Richmond Hill, Gqeberha',
    location: { lat: -33.9621, lng: 25.6112 },
    rating: 4.6,
    userRatingCount: 2200,
    priceLevel: '$$$',
    category: 'Fine Dining & Wine',
    mood: 'Romantic',
    summary: 'Bustling historical street of restored Edwardian homes converted into vibrant couple tapas bistros and wine cellars.',
    estimatedBudgetZar: 850,
  },

  // NORTH WEST
  {
    id: 'nw-1',
    provinceId: 'nw',
    name: 'Harties Aerial Cableway & Starlight Cocktails',
    address: 'Plot 3, Melodie, Hartbeespoort',
    location: { lat: -25.7277, lng: 27.8863 },
    rating: 4.6,
    userRatingCount: 4800,
    priceLevel: '$$$',
    category: 'Scenic & Sunset',
    mood: 'Romantic',
    summary: 'Glide above the Magaliesberg mountains to a 360-degree viewpoint bar overlooking the dam at sunset.',
    estimatedBudgetZar: 850,
  },
  {
    id: 'nw-2',
    provinceId: 'nw',
    name: 'Bill Harrop’s Original Balloon Safaris',
    address: 'Skeerpoort, Magalies River Valley',
    location: { lat: -25.8242, lng: 27.7681 },
    rating: 4.9,
    userRatingCount: 1980,
    priceLevel: '$$$$',
    category: 'Adventure',
    mood: 'Adventurous',
    summary: 'Sunrise hot air balloon flight over the Cradle of Humankind followed by champagne breakfast on the clubhouse lawns.',
    estimatedBudgetZar: 3600,
  },

  // FREE STATE
  {
    id: 'fs-1',
    provinceId: 'fs',
    name: 'Clarens Square Artisanal Tasting & Galleries',
    address: 'President Square, Clarens',
    location: { lat: -28.5152, lng: 28.4194 },
    rating: 4.8,
    userRatingCount: 3100,
    priceLevel: '$$',
    category: 'Cozy & Cultural',
    mood: 'Cozy',
    summary: 'Charming jewel of the Free State with craft cherry cideries, local art studios, and mountain view bistros.',
    estimatedBudgetZar: 650,
  },
  {
    id: 'fs-2',
    provinceId: 'fs',
    name: 'Golden Gate Highlands Sunset Drive',
    address: 'R712, Golden Gate Highlands National Park',
    location: { lat: -28.5034, lng: 28.6253 },
    rating: 4.8,
    userRatingCount: 3400,
    priceLevel: '$',
    category: 'Scenic Viewpoint',
    mood: 'Romantic',
    summary: 'Ochre sandstone cliffs that glow blazing gold in the setting sun, with mountain zebra and vulture hides.',
    estimatedBudgetZar: 220,
  },

  // LIMPOPO
  {
    id: 'lp-1',
    provinceId: 'lp',
    name: 'Haenertsburg Village & Magoebaskloof Tea Room',
    address: 'R71, Haenertsburg',
    location: { lat: -23.9431, lng: 29.9432 },
    rating: 4.7,
    userRatingCount: 1720,
    priceLevel: '$$',
    category: 'Cozy & Nature',
    mood: 'Cozy',
    summary: 'Quaint village in the clouds known for spring cherry blossoms, craft gin tasting, and misty hiking trails.',
    estimatedBudgetZar: 500,
  },
  {
    id: 'lp-2',
    provinceId: 'lp',
    name: 'Magoebaskloof Canopy Tours',
    address: 'George’s Valley Rd, R528, Tzaneen',
    location: { lat: -23.9045, lng: 30.0121 },
    rating: 4.8,
    userRatingCount: 2200,
    priceLevel: '$$$',
    category: 'Adventure',
    mood: 'Adventurous',
    summary: 'Zip-line across 13 tandem slides above the Groot Letaba River gorge and cascading waterfalls.',
    estimatedBudgetZar: 950,
  },

  // NORTHERN CAPE
  {
    id: 'nc-1',
    provinceId: 'nc',
    name: 'SALT Sutherland Midnight Stargazing Tour',
    address: 'Sutherland Observatory, Sutherland',
    location: { lat: -32.3939, lng: 20.6622 },
    rating: 4.9,
    userRatingCount: 1350,
    priceLevel: '$$',
    category: 'Stargazing',
    mood: 'Romantic',
    summary: 'The clearest night skies in the Southern Hemisphere, gazing at galaxies and nebulas under warm wool blankets.',
    estimatedBudgetZar: 450,
  }
];

/**
 * Calculate distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Detect the nearest South African province based on user's GPS position
 */
export function getNearestProvince(userLat: number, userLng: number): SAProvince {
  let closest = SA_PROVINCES[0];
  let minDistance = Infinity;

  for (const prov of SA_PROVINCES) {
    const dist = calculateDistanceKm(userLat, userLng, prov.center.lat, prov.center.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = prov;
    }
  }

  return closest;
}
