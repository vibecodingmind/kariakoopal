// Chimbo Direct Platform - Map Data
// Approximate polygon coordinates for Kariakoo market zones, vendor stalls, and landmarks
// All coordinates are based on the real Kariakoo market area in Dar es Salaam, Tanzania
// Center: -6.8264, 39.2695

// ── Zone Polygon Coordinates ──
// Each zone has approximate lat/lng polygon coordinates representing the market sections

export interface ZonePolygon {
  id: string;
  name: string;
  nameSw: string;
  color: string;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  center: { lat: number; lng: number };
  paths: Array<{ lat: number; lng: number }>;
}

export const KARIAKOO_CENTER = { lat: -6.8264, lng: 39.2695 };

export const ZONE_POLYGONS: ZonePolygon[] = [
  {
    id: 'zone_vyombo',
    name: 'Vyombo',
    nameSw: 'Vyombo',
    color: '#f97316',
    fillColor: '#f97316',
    fillOpacity: 0.2,
    strokeColor: '#f97316',
    strokeOpacity: 0.8,
    strokeWidth: 2,
    center: { lat: -6.8250, lng: 39.2685 },
    paths: [
      { lat: -6.8240, lng: 39.2675 },
      { lat: -6.8240, lng: 39.2695 },
      { lat: -6.8245, lng: 39.2698 },
      { lat: -6.8260, lng: 39.2698 },
      { lat: -6.8262, lng: 39.2693 },
      { lat: -6.8260, lng: 39.2672 },
      { lat: -6.8250, lng: 39.2670 },
    ],
  },
  {
    id: 'zone_electronics',
    name: 'Electronics',
    nameSw: 'Elektroniki',
    color: '#0ea5e9',
    fillColor: '#0ea5e9',
    fillOpacity: 0.2,
    strokeColor: '#0ea5e9',
    strokeOpacity: 0.8,
    strokeWidth: 2,
    center: { lat: -6.8270, lng: 39.2700 },
    paths: [
      { lat: -6.8260, lng: 39.2693 },
      { lat: -6.8262, lng: 39.2698 },
      { lat: -6.8260, lng: 39.2705 },
      { lat: -6.8262, lng: 39.2710 },
      { lat: -6.8278, lng: 39.2710 },
      { lat: -6.8280, lng: 39.2705 },
      { lat: -6.8278, lng: 39.2695 },
      { lat: -6.8275, lng: 39.2690 },
    ],
  },
  {
    id: 'zone_fabric',
    name: 'Fabric',
    nameSw: 'Vitambaa',
    color: '#ec4899',
    fillColor: '#ec4899',
    fillOpacity: 0.2,
    strokeColor: '#ec4899',
    strokeOpacity: 0.8,
    strokeWidth: 2,
    center: { lat: -6.8280, lng: 39.2690 },
    paths: [
      { lat: -6.8275, lng: 39.2690 },
      { lat: -6.8278, lng: 39.2695 },
      { lat: -6.8280, lng: 39.2705 },
      { lat: -6.8278, lng: 39.2710 },
      { lat: -6.8290, lng: 39.2710 },
      { lat: -6.8295, lng: 39.2700 },
      { lat: -6.8295, lng: 39.2688 },
      { lat: -6.8290, lng: 39.2685 },
      { lat: -6.8285, lng: 39.2688 },
    ],
  },
  {
    id: 'zone_spices',
    name: 'Spices',
    nameSw: 'Viungo',
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.2,
    strokeColor: '#ef4444',
    strokeOpacity: 0.8,
    strokeWidth: 2,
    center: { lat: -6.8250, lng: 39.2700 },
    paths: [
      { lat: -6.8245, lng: 39.2698 },
      { lat: -6.8260, lng: 39.2698 },
      { lat: -6.8260, lng: 39.2705 },
      { lat: -6.8262, lng: 39.2710 },
      { lat: -6.8250, lng: 39.2715 },
      { lat: -6.8240, lng: 39.2712 },
      { lat: -6.8238, lng: 39.2705 },
      { lat: -6.8240, lng: 39.2698 },
    ],
  },
  {
    id: 'zone_wholesale',
    name: 'Wholesale',
    nameSw: 'Jumla',
    color: '#14b8a6',
    fillColor: '#14b8a6',
    fillOpacity: 0.2,
    strokeColor: '#14b8a6',
    strokeOpacity: 0.8,
    strokeWidth: 2,
    center: { lat: -6.8270, lng: 39.2715 },
    paths: [
      { lat: -6.8262, lng: 39.2710 },
      { lat: -6.8278, lng: 39.2710 },
      { lat: -6.8278, lng: 39.2710 },
      { lat: -6.8290, lng: 39.2710 },
      { lat: -6.8295, lng: 39.2715 },
      { lat: -6.8298, lng: 39.2720 },
      { lat: -6.8290, lng: 39.2725 },
      { lat: -6.8275, lng: 39.2725 },
      { lat: -6.8265, lng: 39.2720 },
      { lat: -6.8258, lng: 39.2715 },
    ],
  },
];

// ── Vendor Stall Locations ──
// Approximate lat/lng for common vendor stalls in each zone

export interface VendorStall {
  id: string;
  name: string;
  zoneId: string;
  category: string;
  lat: number;
  lng: number;
}

export const VENDOR_STALLS: VendorStall[] = [
  // Vyombo zone (utensils/cookware)
  { id: 'stall_v1', name: 'Mzee Juma Cookware', zoneId: 'zone_vyombo', category: 'utensils', lat: -6.8248, lng: 39.2680 },
  { id: 'stall_v2', name: 'Bi Fatma Pots', zoneId: 'zone_vyombo', category: 'utensils', lat: -6.8253, lng: 39.2690 },
  { id: 'stall_v3', name: 'Karume Kitchen', zoneId: 'zone_vyombo', category: 'kitchenware', lat: -6.8255, lng: 39.2678 },
  { id: 'stall_v4', name: 'Dar Utensils', zoneId: 'zone_vyombo', category: 'utensils', lat: -6.8245, lng: 39.2688 },

  // Electronics zone
  { id: 'stall_e1', name: 'Hassan Tech', zoneId: 'zone_electronics', category: 'phones', lat: -6.8268, lng: 39.2698 },
  { id: 'stall_e2', name: 'Dar Electronics', zoneId: 'zone_electronics', category: 'electronics', lat: -6.8273, lng: 39.2702 },
  { id: 'stall_e3', name: 'Simu World', zoneId: 'zone_electronics', category: 'phones', lat: -6.8270, lng: 39.2708 },
  { id: 'stall_e4', name: 'Tech Hub Kariakoo', zoneId: 'zone_electronics', category: 'electronics', lat: -6.8265, lng: 39.2705 },

  // Fabric zone (kitenge/vitambaa)
  { id: 'stall_f1', name: 'Mama Kitenge', zoneId: 'zone_fabric', category: 'kitenge', lat: -6.8282, lng: 39.2692 },
  { id: 'stall_f2', name: 'Vitambaa Vogue', zoneId: 'zone_fabric', category: 'fabric', lat: -6.8288, lng: 39.2695 },
  { id: 'stall_f3', name: 'Kanga Palace', zoneId: 'zone_fabric', category: 'kanga', lat: -6.8285, lng: 39.2700 },
  { id: 'stall_f4', name: 'African Prints', zoneId: 'zone_fabric', category: 'fabric', lat: -6.8290, lng: 39.2688 },

  // Spices zone (viungo)
  { id: 'stall_s1', name: 'Spice World', zoneId: 'zone_spices', category: 'spices', lat: -6.8250, lng: 39.2702 },
  { id: 'stall_s2', name: 'Viungo Vikuu', zoneId: 'zone_spices', category: 'spices', lat: -6.8245, lng: 39.2708 },
  { id: 'stall_s3', name: 'Zanzibar Spices', zoneId: 'zone_spices', category: 'spices', lat: -6.8255, lng: 39.2705 },
  { id: 'stall_s4', name: 'Mchanganyiko Store', zoneId: 'zone_spices', category: 'mixed', lat: -6.8248, lng: 39.2710 },

  // Wholesale zone (jumla)
  { id: 'stall_w1', name: 'Wholesale Hub', zoneId: 'zone_wholesale', category: 'wholesale', lat: -6.8272, lng: 39.2715 },
  { id: 'stall_w2', name: 'Jumla Center', zoneId: 'zone_wholesale', category: 'wholesale', lat: -6.8280, lng: 39.2718 },
  { id: 'stall_w3', name: 'Bulk Buy Kariakoo', zoneId: 'zone_wholesale', category: 'wholesale', lat: -6.8285, lng: 39.2720 },
  { id: 'stall_w4', name: 'Import Direct', zoneId: 'zone_wholesale', category: 'wholesale', lat: -6.8275, lng: 39.2722 },
];

// ── Key Landmarks ──

export interface Landmark {
  id: string;
  name: string;
  nameSw: string;
  type: 'entrance' | 'bus_stand' | 'mosque' | 'parking' | 'market_hall' | 'atm';
  lat: number;
  lng: number;
  icon: string; // Material icon name for Google Maps
}

export const LANDMARKS: Landmark[] = [
  {
    id: 'landmark_main_entrance',
    name: 'Kariakoo Market Main Entrance',
    nameSw: 'Mlango Mkuu wa Soko la Kariakoo',
    type: 'entrance',
    lat: -6.8264,
    lng: 39.2685,
    icon: 'store',
  },
  {
    id: 'landmark_bus_stand',
    name: 'Kariakoo Bus Stand',
    nameSw: 'Kituo cha Mabasi Kariakoo',
    type: 'bus_stand',
    lat: -6.8235,
    lng: 39.2705,
    icon: 'directions_bus',
  },
  {
    id: 'landmark_mosque',
    name: 'Kariakoo Mosque',
    nameSw: 'Msikiti wa Kariakoo',
    type: 'mosque',
    lat: -6.8280,
    lng: 39.2675,
    icon: 'mosque',
  },
  {
    id: 'landmark_parking',
    name: 'Market Parking Area',
    nameSw: 'Eneo la Maegesho',
    type: 'parking',
    lat: -6.8300,
    lng: 39.2710,
    icon: 'local_parking',
  },
  {
    id: 'landmark_market_hall',
    name: 'Kariakoo Market Hall',
    nameSw: 'Jukwaa la Soko Kuu',
    type: 'market_hall',
    lat: -6.8268,
    lng: 39.2695,
    icon: 'storefront',
  },
  {
    id: 'landmark_atm',
    name: 'CRDB ATM Kariakoo',
    nameSw: 'ATM ya CRDB Kariakoo',
    type: 'atm',
    lat: -6.8255,
    lng: 39.2712,
    icon: 'atm',
  },
];

// ── Map Styles ──
// Custom map style to match the SVG map's aesthetic

export const KARIAKOO_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'administrative',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }, { lightness: 30 }],
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [{ saturation: -20 }, { lightness: 10 }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'road',
    elementType: 'all',
    stylers: [{ saturation: -30 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [{ saturation: -10 }, { lightness: 20 }],
  },
];

// ── Default Map Options ──

export const DEFAULT_MAP_OPTIONS = {
  center: KARIAKOO_CENTER,
  zoom: 16,
  minZoom: 14,
  maxZoom: 20,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: true,
  gestureHandling: 'greedy' as const,
  styles: KARIAKOO_MAP_STYLES,
};

// ── Libraries to load ──

export const MAP_LIBRARIES: ('places' | 'drawing' | 'geometry')[] = ['places', 'geometry'];
