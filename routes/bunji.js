/**
 * bunji.js  —  All Bunji widget API routes
 *
 * Mounts on /api (registered in server.js as app.use('/api', bunjuRoutes))
 *
 * Endpoints:
 *   GET  /api/products/:category          → paginated products by category
 *   GET  /api/products/brand/:brand       → paginated products by brand
 *   GET  /api/products/vertical/:vertical → paginated products by vertical
 *   GET  /api/products/search             → search products by query (?q=)
 *
 * All product data is served from the in-memory CATEGORY_PRODUCTS map
 * (same source as the frontend bunji.js CATEGORY_PRODUCTS).
 * Products can be extended by adding to the map or fetching from a DB.
 */

const express = require('express');
const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CATALOGUE  (mirrors frontend bunji.js CATEGORY_PRODUCTS)
// Add or extend categories here.  Each item: { name, part, price, was, img,
//   brand, vertical, category }
// ─────────────────────────────────────────────────────────────────────────────
const CATALOGUE = [];   // filled below

// Helper — push all items from the frontend-style map into CATALOGUE
function ingest(categoryMap) {
  for (const [cat, items] of Object.entries(categoryMap)) {
    for (const item of items) {
      CATALOGUE.push({
        name: item.name,
        part: item.part || '',
        price: item.price || '$0.00',
        was: item.was || null,
        img: item.img || null,
        brand: item.brand || guessBrand(item.name),
        vertical: item.vertical || guessVertical(cat),
        category: cat
      });
    }
  }
}

// ── Simple brand guesser from product name ──────────────────────────────────
function guessBrand(name) {
  const known = [
    'Rheem', 'Carrier', 'Goodman', 'Trane', 'Lennox', 'Daikin', 'York', 'Mitsubishi',
    'Honeywell', 'Emerson', 'White-Rodgers', 'Copeland', 'Tecumseh', 'Heil',
    'American Standard', 'Ruud', 'Amana', 'Nordyne', 'Frigidaire', 'GE', 'LG',
    'Samsung', 'Whirlpool', 'Maytag', 'KitchenAid', 'Bosch', 'Electrolux',
    'Panasonic', 'Sharp', 'Philips', 'Dyson', 'iRobot', 'Shark', 'Bissell',
    'Hoover', 'Roomba', 'Nu Calgon', 'April', 'Trion', 'Aprilaire', 'GeneralAire',
    'White Mountain', 'Sunbelt', 'Air Oasis'
  ];
  for (const b of known) {
    if (name.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return 'Generic';
}

// ── Map category → vertical ─────────────────────────────────────────────────
const CATEGORY_VERTICAL_MAP = {
  'Accumulators & Receivers': 'HVAC',
  'Adhesives': 'HVAC',
  'Air Cleaners': 'HVAC',
  'Air Filters': 'HVAC',
  'Airflow Accessories': 'HVAC',
  'Blower Components': 'HVAC',
  'Capacitors': 'HVAC',
  'Coils': 'HVAC',
  'Compressor Parts': 'HVAC',
  'Compressors': 'HVAC',
  'Condensate Drain Supplies': 'HVAC',
  'Condensate Pumps': 'HVAC',
  'Condenser Fan Motors': 'HVAC',
  'Draft Inducer Motors': 'HVAC',
  'Ducting & Sheet Metal': 'HVAC',
  'Evaporator and Blower Motors': 'HVAC',
  'Fan Blades': 'HVAC',
  'Filter - Driers': 'HVAC',
  'Gas Heat Controls': 'HVAC',
  'Heat Pump Controls': 'HVAC',
  'HVAC Truck Stock': 'HVAC',
  'Refrigerant': 'HVAC',
  'Thermostats': 'HVAC',
  'Ultraviolet': 'HVAC',
  'Unit Heaters': 'HVAC',
  'Valves': 'HVAC',
  'Water Heaters': 'HVAC',
  'Grills & Outdoor Kitchen': 'Grills & Outdoor Kitchen',
  'Lawn & Garden': 'Lawn & Garden',
  'Pool & Spa': 'Pool & Spa',
  'Auto & Garage': 'Auto & Garage',
  'Consumer Electronics': 'Consumer Electronics',
  'Computer & Tablet': 'Computer & Tablet',
  'Mobile': 'Mobile',
  'Print & Imaging': 'Print & Imaging',
  'Commercial Appliance': 'Commercial Appliance',
  'Coffee & Small Appliance': 'Coffee & Small Appliance',
  'Vacuum': 'Vacuum',
  'Power Tools': 'Power Tool Parts',
  'Personal Care': 'Personal Care',
  'Plumbing': 'Plumbing',
  'Service Aids & Tools': 'Service Aids & Tools',
  'Health & Wellness': 'Health & Wellness',
  'Home Appliances': 'Home Appliances',
  'Fitness': 'Health & Wellness',
  'Accessories': 'Consumer Electronics',
  'Household Cleaners': 'Home Appliances',
  'Installation Supplies': 'HVAC',
  'Home Maintenance': 'Home Appliances',
};

function guessVertical(category) {
  return CATEGORY_VERTICAL_MAP[category] || 'Home Appliances';
}

// ── Seed the catalogue from hardcoded data ──────────────────────────────────
// (Matches the frontend bunji.js CATEGORY_PRODUCTS exactly)
ingest({
  "Accumulators & Receivers": [
    { name: "Rheem VPA-589-6SRD Accumulator", part: "VPA-589-6SRD", price: "$109.95", was: "$120.95", brand: "Rheem" },
    { name: "Rheem VPA-5811-7SRD Accumulator", part: "VPA-5811-7SRD", price: "$120.95", was: "$133.05", brand: "Rheem" },
    { name: "Rheem VA-35-6S Accumulator", part: "VA-35-6S", price: "$179.95", was: "$197.95", brand: "Rheem" },
    { name: "Rheem VA-35-5S Accumulator", part: "VA-35-5S", price: "$96.95", was: "$108.58", brand: "Rheem" },
    { name: "Rheem VA-31-5S Accumulator", part: "VA-31-5S", price: "$97.95", was: "$109.70", brand: "Rheem" },
  ],
  "Air Cleaners": [
    { name: "Merv 8 Replacement Filter", part: "PD540040", price: "$64.95", was: "$75.34" },
    { name: "Merv 8 Replacement Filter For Xhf-e21", part: "PD540042", price: "$69.95", was: "$81.14" },
    { name: "Merv 8 Replacement Filter For Xhf-e24", part: "PD540044", price: "$44.95", was: "$54.39" },
    { name: "Air Bear - 20X20", part: "84-25050-05", price: "$175.95", was: "$193.55" },
    { name: "Media Air Cleaner - 2000 Cfm", part: "84-25050-01", price: "$153.95", was: "$169.35" },
    { name: "Nu Iwave-r", part: "4900-20", price: "$635.95", was: "$699.55" },
    { name: "Sunbelt Ionizer", part: "D1.2-2", price: "$770.95", was: "$848.05" },
    { name: "Digital Dehumd Control", part: "76", price: "$259.95", was: "$285.95" },
    { name: "Air Oasis Air Sanitizor", part: "NIND9-24", price: "$788.95", was: "$867.85" },
    { name: "14-Inch Dust Free Carbon Air Purifier", part: "13052", price: "$736.95", was: "$810.65" },
  ],
  "Adhesives": [
    { name: "Versa-grip 102-25", part: "VG10225", price: "$8.95", was: "$11.55" },
    { name: "Duct Sealant #22 Wht 1 Gal", part: "AIRSEAL22-1", price: "$30.95", was: "$37.45" },
    { name: "Duct Sealant #33 1 Gal", part: "AIRSEAL33-1", price: "$27.95", was: "$33.82" },
    { name: "Duct Sealant Wht 1 Gal", part: "CADS1", price: "$20.95", was: "$25.98" },
    { name: "Duct Sealant Gray 1 Gal", part: "CADS1-GRAY", price: "$19.95", was: "$24.74" },
    { name: "Duct Sealant Wht 5 Gal", part: "CADS5", price: "$105.95", was: "$116.55" },
    { name: "Insulation Adhesive #40", part: "308602A", price: "$653.95", was: "$719.35" },
    { name: "Sure Stick Spray Adh 12 Oz", part: "31520", price: "$19.95", was: "$24.74" },
    { name: "Premium Spray Adhesive 19.6", part: "POLY44SA", price: "$12.95", was: "$16.71" },
  ],
  "Air Filters": [
    { name: "Trion Air Bear Merv 8 Media Filter", part: "252990-902", price: "$30.95", was: "$37.45" },
    { name: "H/w 16X25 Media Air Filter", part: "FC100A1029/U", price: "$52.95", was: "$61.42" },
    { name: "H/w 20X25 Media Air Filter", part: "FC100A1037/U", price: "$54.95", was: "$63.74" },
    { name: "Pleated Filter 16X20x1 Merv 8", part: "PLT-16201-M8", price: "$9.95", was: "$12.84" },
    { name: "Pleated Filter 20X25x1 Merv 8", part: "PLT-20251-M8", price: "$10.95", was: "$14.13" },
    { name: "Pleated Filter 16X25x1 Merv 11", part: "PLT-16251-M11", price: "$13.95", was: "$17.55" },
    { name: "HEPA Filter 16X25x4", part: "SPF-HEPA-1625", price: "$49.95", was: "$59.94" },
    { name: "Carbon Odor Filter 20X25x1", part: "SPF-CARB-2025", price: "$19.95", was: "$24.74" },
    { name: "Electrostatic Filter 16X20x1", part: "ESF-16201", price: "$24.95", was: "$29.99" },
    { name: "Electrostatic Filter 20X25x1", part: "ESF-20251", price: "$27.95", was: "$33.50" },
    { name: "Washable Filter 16X20x1", part: "SPF-WASH-1620", price: "$29.95", was: "$35.94" },
    { name: "Merv 11 20X25x6 Filter", part: "SGP20256M11", price: "$82.95", was: "$92.90" },
    { name: "20X20x3 Merv13 Media Filter", part: "FC313R2020/U", price: "$121.95", was: "$134.15" },
    { name: "16X20x1 Fbg Dbl Strut T/a", part: "GDS16201", price: "$7.95", was: "$10.26" },
    { name: "16X25x1 Fbg Dbl Strut Ta", part: "GDS16251", price: "$7.95", was: "$10.26" },
    { name: "20X20x1 Fbg Dbl Strut T/a", part: "GDS20201", price: "$7.95", was: "$10.26" },
    { name: "20X25x1 Fbg Dbl Strut T/a", part: "GDS20251", price: "$7.95", was: "$10.26" },
    { name: "16X20x2 Fbg Dbl Strut T/a", part: "GDS16202", price: "$8.95", was: "$11.55" },
    { name: "20X20x2 Fbg Dbl Strut T/a", part: "GDS20202", price: "$6.95", was: "$9.24" },
    { name: "20X25x4 Zl Pleated Filter", part: "ZLP20254", price: "$21.95", was: "$27.22" },
  ],
  "Thermostats": [
    { name: "Honeywell T6 Pro Programmable Thermostat", part: "TH6320U2008/U", price: "$89.95", was: "$99.99", brand: "Honeywell" },
    { name: "Honeywell Home T4 Pro Thermostat", part: "TH4110U2005/U", price: "$59.95", was: "$69.99", brand: "Honeywell" },
    { name: "Emerson Sensi Smart Thermostat", part: "ST55", price: "$129.95", was: "$149.99", brand: "Emerson" },
    { name: "White-Rodgers 1F86-0471 Thermostat", part: "1F86-0471", price: "$74.95", was: "$84.99", brand: "Emerson" },
    { name: "Carrier Non-Programmable Thermostat", part: "TP-PRH01-A", price: "$49.95", was: "$59.99", brand: "Carrier" },
    { name: "Goodman 2-Stage Heat Thermostat", part: "T603-2", price: "$64.95", was: "$74.99", brand: "Goodman" },
  ],
  "Compressors": [
    { name: "Copeland Scroll 1.5 Ton Compressor", part: "ZP18K5E-PFV-130", price: "$489.95", was: "$539.95", brand: "Copeland" },
    { name: "Copeland Scroll 2 Ton Compressor", part: "ZP24K5E-PFV-130", price: "$559.95", was: "$609.95", brand: "Copeland" },
    { name: "Copeland Scroll 3 Ton Compressor", part: "ZP34K5E-PFV-130", price: "$649.95", was: "$719.95", brand: "Copeland" },
    { name: "Tecumseh 1 Ton R22 Compressor", part: "AE4440Y-AA1A", price: "$329.95", was: "$379.95", brand: "Tecumseh" },
    { name: "Embraco 1/3 HP Refrigerator Compressor", part: "NEK2134GK", price: "$149.95", was: "$179.95", brand: "Embraco" },
  ],
  "Capacitors": [
    { name: "Dual Round Capacitor 35/5 MFD 440V", part: "CPT-CAP-354440R", price: "$18.95", was: "$23.99" },
    { name: "Dual Round Capacitor 45/5 MFD 440V", part: "CPT-CAP-454440R", price: "$19.95", was: "$24.99" },
    { name: "Dual Round Capacitor 55/5 MFD 440V", part: "CPT-CAP-554440R", price: "$21.95", was: "$26.99" },
    { name: "Run Capacitor 10 MFD 370V", part: "CPT-CAP-10370", price: "$8.95", was: "$11.99" },
    { name: "Run Capacitor 20 MFD 370V", part: "CPT-CAP-20370", price: "$9.95", was: "$12.99" },
    { name: "Start Capacitor 88-108 MFD 330V", part: "CPT-STA-88330", price: "$12.95", was: "$16.99" },
    { name: "Hard Start Kit 2-3 Ton", part: "CPT-HSK-23", price: "$24.95", was: "$29.99" },
  ],
  "Valves": [
    { name: "TXV Valve R-410A 2 Ton", part: "TXV-410A-2T", price: "$64.95", was: "$74.99" },
    { name: "TXV Valve R-410A 3 Ton", part: "TXV-410A-3T", price: "$74.95", was: "$84.99" },
    { name: "Reversing Valve R-410A", part: "REV-410A-1", price: "$89.95", was: "$99.99" },
    { name: "Schrader Valve Core Pack", part: "SCV-CORE-10PK", price: "$7.95", was: "$10.99" },
    { name: "Ball Valve 3/8 Sweat", part: "BV-375-SW", price: "$14.95", was: "$18.99" },
    { name: "Service Valve 1/4 Flare", part: "SV-025-FL", price: "$9.95", was: "$12.99" },
  ],
  "Condensate Pumps": [
    { name: "Little Giant VCMA-20UL Pump", part: "554425", price: "$64.95", was: "$74.99", brand: "Little Giant" },
    { name: "Hartell A3X-CL Pump", part: "A3X-CL", price: "$89.95", was: "$99.99", brand: "Hartell" },
    { name: "Diversitech CP-22 Pump", part: "CP-22", price: "$49.95", was: "$59.99", brand: "Diversitech" },
    { name: "Sauermann SI-1850 Pump", part: "SI-1850", price: "$94.95", was: "$109.99", brand: "Sauermann" },
  ],
  "Home Appliances": [
    { name: "Whirlpool Washer Door Latch", part: "W10130695", price: "$24.95", was: "$29.99", brand: "Whirlpool" },
    { name: "Whirlpool Dryer Thermal Fuse", part: "279816", price: "$12.95", was: "$16.99", brand: "Whirlpool" },
    { name: "GE Dishwasher Pump & Motor", part: "WD26X10013", price: "$89.95", was: "$99.99", brand: "GE" },
    { name: "Maytag Refrigerator Water Filter", part: "UKF8001", price: "$34.95", was: "$42.99", brand: "Maytag" },
    { name: "Samsung Refrigerator Ice Maker", part: "DA97-07365B", price: "$149.95", was: "$169.99", brand: "Samsung" },
    { name: "LG Washer Drain Pump", part: "5859EA1004D", price: "$44.95", was: "$54.99", brand: "LG" },
    { name: "Frigidaire Range Burner Element", part: "316442301", price: "$39.95", was: "$49.99", brand: "Frigidaire" },
    { name: "Bosch Dishwasher Door Gasket", part: "00263037", price: "$29.95", was: "$36.99", brand: "Bosch" },
    { name: "KitchenAid Mixer Carbon Brush Set", part: "9706529", price: "$19.95", was: "$24.99", brand: "KitchenAid" },
    { name: "Electrolux Range Igniter", part: "316489402", price: "$49.95", was: "$59.99", brand: "Electrolux" },
  ],
  "Consumer Electronics": [
    { name: "Samsung TV Main Board 50 inch", part: "BN94-15752A", price: "$89.95", was: "$109.99", brand: "Samsung" },
    { name: "LG TV Power Board 55 inch", part: "EBR73304204", price: "$79.95", was: "$95.99", brand: "LG" },
    { name: "Sony TV Backlight Strip Set", part: "XBR-65X900E", price: "$64.95", was: "$79.99", brand: "Sony" },
    { name: "Vizio Main Board 43 inch", part: "1P-012BJ00-4011", price: "$59.95", was: "$72.99", brand: "Vizio" },
    { name: "Universal TV Remote", part: "GE-33709", price: "$14.95", was: "$19.99", brand: "GE" },
    { name: "HDMI Board Replacement", part: "HDMI-BRD-UN1", price: "$34.95", was: "$44.99" },
  ],
  "Plumbing": [
    { name: "Delta Faucet Cartridge 1300/1400 Series", part: "RP25513", price: "$19.95", was: "$24.99", brand: "Delta" },
    { name: "Moen Cartridge 1222", part: "1222", price: "$24.95", was: "$29.99", brand: "Moen" },
    { name: "Kohler Faucet Seat Wrench", part: "GP82882", price: "$9.95", was: "$12.99", brand: "Kohler" },
    { name: "SharkBite 1/2 inch Push Connector", part: "U060LFA", price: "$5.95", was: "$7.99", brand: "SharkBite" },
    { name: "Toilet Flapper Universal", part: "FLAP-UNIV", price: "$6.95", was: "$8.99" },
    { name: "Water Heater Anode Rod 1 inch Hex", part: "WH-ANODE-1", price: "$14.95", was: "$18.99" },
    { name: "P-Trap 1-1/2 inch", part: "PTRAP-150", price: "$8.95", was: "$11.99" },
    { name: "Wax Ring with Flange", part: "WAXRING-FL", price: "$7.95", was: "$9.99" },
  ],
  "Pool & Spa": [
    { name: "Pentair Pool Pump Motor 1.5 HP", part: "355025S", price: "$189.95", was: "$219.99", brand: "Pentair" },
    { name: "Hayward Pool Filter Cartridge", part: "CX480XRE", price: "$49.95", was: "$59.99", brand: "Hayward" },
    { name: "Hayward Pool Impeller 1 HP", part: "SPX1500C6", price: "$34.95", was: "$42.99", brand: "Hayward" },
    { name: "Pool Heater Ignitor", part: "PHI-IGNITOR", price: "$29.95", was: "$36.99" },
    { name: "Spa Jet Body 2 inch", part: "SPA-JET-2", price: "$12.95", was: "$15.99" },
    { name: "Pool Light Bulb 500W", part: "POOL-LB-500", price: "$24.95", was: "$29.99" },
  ],
  "Power Tools": [
    { name: "DeWalt 20V Drill Chuck 1/2 inch", part: "DW2294", price: "$29.95", was: "$36.99", brand: "DeWalt" },
    { name: "Milwaukee M18 Battery 5Ah", part: "48-11-1850", price: "$129.95", was: "$149.99", brand: "Milwaukee" },
    { name: "Makita Circular Saw Blade 7-1/4", part: "A-90993", price: "$19.95", was: "$24.99", brand: "Makita" },
    { name: "Ryobi Drill Chuck Key", part: "670313001", price: "$9.95", was: "$12.99", brand: "Ryobi" },
    { name: "Bosch Jigsaw Blade Set T-Shank", part: "T5011K", price: "$24.95", was: "$29.99", brand: "Bosch" },
    { name: "Ridgid Belt Sander Belt 3x21", part: "AC9325", price: "$14.95", was: "$18.99", brand: "Ridgid" },
  ],
  "Vacuum": [
    { name: "Dyson V11 Battery Replacement", part: "970145-01", price: "$89.95", was: "$109.99", brand: "Dyson" },
    { name: "Shark Navigator Brush Roll", part: "XFF500", price: "$19.95", was: "$24.99", brand: "Shark" },
    { name: "Hoover WindTunnel Belt 2-Pack", part: "40201208", price: "$7.95", was: "$9.99", brand: "Hoover" },
    { name: "iRobot Roomba Side Brush 3-Pack", part: "4419889", price: "$14.95", was: "$18.99", brand: "iRobot" },
    { name: "Bissell ProHeat Filter Kit", part: "1601708", price: "$16.95", was: "$21.99", brand: "Bissell" },
    { name: "Eureka Vacuum Belt", part: "61120", price: "$5.95", was: "$7.99", brand: "Eureka" },
  ],
  "Personal Care": [
    { name: "Braun Series 7 Replacement Head", part: "70S", price: "$29.95", was: "$36.99", brand: "Braun" },
    { name: "Philips Norelco Shaver Head 3-Pack", part: "SH50/52", price: "$34.95", was: "$42.99", brand: "Philips" },
    { name: "Oral-B Brush Head 4-Pack", part: "3757", price: "$24.95", was: "$29.99", brand: "Oral-B" },
    { name: "Conair Hair Dryer Heating Element", part: "CNR-HE-01", price: "$19.95", was: "$24.99", brand: "Conair" },
    { name: "Remington Shaver Foil & Cutter", part: "SPF-300", price: "$22.95", was: "$27.99", brand: "Remington" },
  ],
  "Mobile": [
    { name: "iPhone 13 Screen Assembly", part: "MOBI-IPH13-SCR", price: "$89.95", was: "$109.99" },
    { name: "Samsung Galaxy S22 Battery", part: "EB-BS901ABY", price: "$49.95", was: "$59.99" },
    { name: "Universal Phone Charging Port", part: "MOBI-CHGPORT", price: "$14.95", was: "$18.99" },
    { name: "iPad Air 4 Charging Port Flex", part: "MOBI-IPAD-A4", price: "$24.95", was: "$29.99" },
  ],
  "Computer & Tablet": [
    { name: "Laptop Keyboard Replacement Universal", part: "COMP-KB-UNIV", price: "$39.95", was: "$49.99" },
    { name: "Laptop Fan 5V Replacement", part: "COMP-FAN-5V", price: "$24.95", was: "$29.99" },
    { name: "SSD 256GB 2.5 inch SATA", part: "SSD-256-25", price: "$49.95", was: "$62.99" },
    { name: "DDR4 8GB RAM Stick", part: "RAM-DDR4-8G", price: "$34.95", was: "$44.99" },
    { name: "Tablet Screen Digitizer 10 inch", part: "TAB-DIG-10", price: "$54.95", was: "$64.99" },
  ],
  "Grills & Outdoor Kitchen": [
    { name: "Weber Genesis Burner Tube Set", part: "62778", price: "$49.95", was: "$59.99", brand: "Weber" },
    { name: "Weber Spirit Cooking Grates", part: "7638", price: "$69.95", was: "$82.99", brand: "Weber" },
    { name: "Char-Broil Igniter Button", part: "G414-0006-W1", price: "$14.95", was: "$18.99", brand: "Char-Broil" },
    { name: "Napoleon Warming Rack", part: "S83002", price: "$44.95", was: "$54.99", brand: "Napoleon" },
    { name: "Universal Grill Burner Cover", part: "GRL-BURNCOVER", price: "$12.95", was: "$15.99" },
    { name: "Propane Regulator & Hose 5 ft", part: "GRL-REG-5FT", price: "$19.95", was: "$24.99" },
  ],
  "Lawn & Garden": [
    { name: "Honda Carburetor GCV160", part: "16100-Z0L-023", price: "$64.95", was: "$79.99", brand: "Honda" },
    { name: "Briggs & Stratton Air Filter", part: "491588S", price: "$8.95", was: "$11.99", brand: "Briggs & Stratton" },
    { name: "Husqvarna Chainsaw Chain 16", part: "531300439", price: "$24.95", was: "$29.99", brand: "Husqvarna" },
    { name: "Toro Lawn Mower Blade 21 in", part: "105-1817-03", price: "$19.95", was: "$24.99", brand: "Toro" },
    { name: "Cub Cadet Drive Belt 46 in", part: "954-04060B", price: "$34.95", was: "$42.99", brand: "Cub Cadet" },
    { name: "Echo Trimmer Line .095", part: "X547000000", price: "$14.95", was: "$18.99", brand: "Echo" },
    { name: "Ryobi Chainsaw Bar Oil", part: "AC80RL3", price: "$9.95", was: "$12.99", brand: "Ryobi" },
  ],
  "Health & Wellness": [
    { name: "Dyson Pure Air Purifier Filter", part: "969048-01", price: "$49.95", was: "$59.99", brand: "Dyson" },
    { name: "Honeywell HEPA Replacement", part: "HRF-R2", price: "$34.95", was: "$42.99", brand: "Honeywell" },
    { name: "Levoit Air Purifier Filter", part: "LV-H132-RF", price: "$19.95", was: "$24.99", brand: "Levoit" },
    { name: "Contec Blood Pressure Cuff", part: "08A", price: "$29.95", was: "$36.99" },
    { name: "Omron Blood Pressure Battery", part: "2CR5", price: "$9.95", was: "$12.99", brand: "Omron" },
  ],
  "Service Aids & Tools": [
    { name: "Refrigerant Manifold Gauge R-410A", part: "MG4-410A", price: "$89.95", was: "$109.99" },
    { name: "Leak Detector Pen UV", part: "LD-UV-PEN", price: "$19.95", was: "$24.99" },
    { name: "Refrigerant Scale Digital 220 lb", part: "RS-220-D", price: "$159.95", was: "$189.99" },
    { name: "Vacuum Pump 3 CFM", part: "VP-3CFM", price: "$129.95", was: "$154.99" },
    { name: "Flaring Tool Kit Copper", part: "FLT-CU-KIT", price: "$49.95", was: "$59.99" },
    { name: "Nitrogen Regulator", part: "NIT-REG-1", price: "$39.95", was: "$49.99" },
    { name: "Tubing Cutter 1/8-1-1/8", part: "TC-138", price: "$14.95", was: "$18.99" },
  ],
  "Water Heaters": [
    { name: "Rheem 40 Gal Gas Thermocouple", part: "AP12525S", price: "$14.95", was: "$18.99", brand: "Rheem" },
    { name: "Bradford White Gas Valve", part: "239-46768-00", price: "$89.95", was: "$109.99", brand: "Bradford White" },
    { name: "AO Smith Anode Rod 3/4 NPT", part: "9000393015", price: "$19.95", was: "$24.99", brand: "AO Smith" },
    { name: "Water Heater Dip Tube", part: "WH-DIPTUBE", price: "$9.95", was: "$12.99" },
    { name: "Water Heater Pressure Relief Valve", part: "WH-PRV-150", price: "$24.95", was: "$29.99" },
    { name: "Tankless Water Heater Flow Sensor", part: "TKL-FLOW-1", price: "$34.95", was: "$42.99" },
  ],

  // ── Airflow Accessories ─────────────────────────────────────────────────────
  "Airflow Accessories": [
    { name: "SW Return Box 14X25x12", part: "RABR8142512", price: "$109.95", was: "$120.95" },
    { name: "SW Return Box 16X25x12", part: "RABR8162512", price: "$179.95", was: "$197.95" },
    { name: "Mtl Zinc 20X25x36 R6 Plenum", part: "P202536-R6-1-0BX", price: "$105.95", was: "$116.55" },
    { name: "Mtl Zinc 16X36x20 R6 Plenum", part: "P162036-R6-1-0BX", price: "$69.95", was: "$81.14" },
    { name: "Mtl Zinc 20X36x20 R6 Plenum", part: "P202036-R6-1-0BX", price: "$77.95", was: "$87.30" },
    { name: "Mtl Zinc 20X48x20 R6 Plenum", part: "P202048-R6-1-0BX", price: "$149.95", was: "$164.95" },
    { name: "GPE 13.5 X 15.5 X 36 Plenum", part: "2801.134154360.26", price: "$88.95", was: "$99.62" },
    { name: "20 X 20.25 X 24 Plenum", part: "2801.200202240.26", price: "$65.95", was: "$76.50" },
    { name: "20 X 20.25 X 36 Plenum R8", part: "2801.200202360.28", price: "$135.95", was: "$149.55" },
    { name: "16 X 21 X 36 Plenum Cap", part: "2801.160210360.28", price: "$127.95", was: "$140.75" },
  ],

  // ── Blower Components ──────────────────────────────────────────────────────
  "Blower Components": [
    { name: "Carrier Blower Motor 1/3 HP 230V", part: "HC37GE232", price: "$189.95", was: "$219.99", brand: "Carrier" },
    { name: "Goodman Blower Wheel 10x8", part: "B1368013", price: "$59.95", was: "$72.99", brand: "Goodman" },
    { name: "Rheem Blower Motor 1/2 HP", part: "51-23055-11", price: "$229.95", was: "$259.99", brand: "Rheem" },
    { name: "Lennox Blower Motor 3/4 HP", part: "10L81", price: "$259.95", was: "$289.99", brand: "Lennox" },
    { name: "Blower Wheel 9x6 CW", part: "BW-9X6-CW", price: "$34.95", was: "$42.99" },
    { name: "Blower Wheel 10x10 CW", part: "BW-10X10-CW", price: "$44.95", was: "$54.99" },
    { name: "Blower Housing Replacement", part: "BH-UNIV-1", price: "$79.95", was: "$94.99" },
    { name: "Blower Motor Run Capacitor 5MFD", part: "CAP-5-370-OVAL", price: "$8.95", was: "$11.99" },
    { name: "Blower Motor Speed Control Module", part: "BMSPC-1", price: "$89.95", was: "$109.99" },
    { name: "ECM Blower Motor 1/2 HP", part: "ECM-050-05", price: "$349.95", was: "$399.99" },
  ],

  // ── Brazing & Soldering Supplies ───────────────────────────────────────────
  "Brazing & Soldering Supplies": [
    { name: "Harris Stay-Silv 15 Brazing Alloy 1/16 x 18", part: "15BF50TR", price: "$39.95", was: "$47.99", brand: "Harris" },
    { name: "Harris Dynaflow Silver Braze Rod 1 oz", part: "DYN1T", price: "$12.95", was: "$15.99", brand: "Harris" },
    { name: "Flux Paste 1 lb Can", part: "FLUX-1LB", price: "$14.95", was: "$18.99" },
    { name: "Silfos 15 Brazing Rod 1 lb", part: "SILFOS-1LB", price: "$89.95", was: "$104.99" },
    { name: "Acid-Free Silver Solder 50/50", part: "SS5050-1", price: "$24.95", was: "$29.99" },
    { name: "Phosphorous Copper Braze Alloy 5%", part: "PC5-12IN", price: "$19.95", was: "$24.99" },
    { name: "Bernzomatic Propane Cylinder 16.4 oz", part: "TX916", price: "$9.95", was: "$12.99", brand: "Bernzomatic" },
    { name: "MAPP Gas Cylinder 14.1 oz", part: "MAP-PRO-14", price: "$14.95", was: "$18.99" },
  ],

  // ── Brazing & Soldering Tools ──────────────────────────────────────────────
  "Brazing & Soldering Tools": [
    { name: "Bernzomatic TS8000 Trigger-Start Torch", part: "TS8000", price: "$59.95", was: "$72.99", brand: "Bernzomatic" },
    { name: "Bernzomatic TS4000 Self-Lighting Torch", part: "TS4000", price: "$34.95", was: "$42.99", brand: "Bernzomatic" },
    { name: "Solderpro 50 Butane Soldering Iron", part: "SP50K", price: "$29.95", was: "$36.99" },
    { name: "Soldering Iron 30W Electric", part: "SI-30W", price: "$12.95", was: "$15.99" },
    { name: "Pipe Cleaning Brush Set 1/4-1in", part: "PCB-SET-6", price: "$14.95", was: "$18.99" },
    { name: "Flux Brush Set 25 Pc", part: "FB-25PK", price: "$5.95", was: "$7.99" },
  ],

  // ── Caulking & Sealants ────────────────────────────────────────────────────
  "Caulking & Sealants": [
    { name: "ASC X-15 Silicone Sealant Clear 10oz", part: "X15-CLR-10", price: "$8.95", was: "$11.99" },
    { name: "RTV High-Temp Silicone Sealant 3oz", part: "RTV-HT-3", price: "$7.95", was: "$9.99" },
    { name: "Foam Sealant Spray Can 12oz", part: "FOAM-12OZ", price: "$6.95", was: "$8.99" },
    { name: "HVAC Metallic Tape 2in x 30ft", part: "MT-2X30", price: "$9.95", was: "$12.99" },
    { name: "Butyl Putty Tape 3/4in x 30ft", part: "BPT-34X30", price: "$8.95", was: "$11.99" },
    { name: "Duct Sealant White Tube 11oz", part: "DS-WHT-TUBE", price: "$5.95", was: "$7.99" },
    { name: "Fibered Elastic Flashing Cement", part: "FEC-1GAL", price: "$24.95", was: "$29.99" },
  ],

  // ── Cleaners & Chemicals ───────────────────────────────────────────────────
  "Cleaners & Chemicals": [
    { name: "Coil Cleaner Foaming 18oz", part: "NU-22-18", price: "$14.95", was: "$18.99", brand: "Nu Calgon" },
    { name: "Evap Foam No Rinse 18oz", part: "4171-75", price: "$12.95", was: "$15.99", brand: "Nu Calgon" },
    { name: "Coil King Alkaline Coil Cleaner 1gal", part: "4291-08", price: "$34.95", was: "$42.99", brand: "Nu Calgon" },
    { name: "Citrus Cleaner All-Purpose 1gal", part: "CC-CITR-1G", price: "$24.95", was: "$29.99" },
    { name: "Refrigerant Oil Charge 8oz", part: "REOIL-8OZ", price: "$19.95", was: "$24.99" },
    { name: "Pan Treatment Strips 12pk", part: "4287-16", price: "$16.95", was: "$21.99", brand: "Nu Calgon" },
    { name: "Biocide Kill Mold Spray 1gal", part: "BIOCIDE-1G", price: "$39.95", was: "$47.99" },
  ],

  // ── Coils ──────────────────────────────────────────────────────────────────
  "Coils": [
    { name: "A Coil R-410A 2 Ton Upflow", part: "AC2T-410A-UP", price: "$249.95", was: "$289.99" },
    { name: "A Coil R-410A 3 Ton Upflow", part: "AC3T-410A-UP", price: "$299.95", was: "$349.99" },
    { name: "A Coil R-410A 4 Ton Upflow", part: "AC4T-410A-UP", price: "$369.95", was: "$419.99" },
    { name: "Slab Coil R-410A 2.5 Ton", part: "SC25T-410A", price: "$219.95", was: "$259.99" },
    { name: "Carrier Evaporator Coil 2 Ton", part: "CNPVU2417ALA", price: "$279.95", was: "$319.99", brand: "Carrier" },
    { name: "Goodman Evaporator Coil 3 Ton", part: "CHPF3636B6", price: "$319.95", was: "$369.99", brand: "Goodman" },
  ],

  // ── Condensate Drain Supplies ──────────────────────────────────────────────
  "Condensate Drain Supplies": [
    { name: "Condensate Drain Line Float Switch", part: "CDFS-1", price: "$14.95", was: "$18.99" },
    { name: "Condensate Drain Pan Plastic 14x14", part: "CDP-14X14", price: "$19.95", was: "$24.99" },
    { name: "PVC Condensate Drain Fitting 3/4", part: "PCDF-34", price: "$4.95", was: "$6.99" },
    { name: "Condensate Drain Pan Sensor", part: "CDPS-1", price: "$24.95", was: "$29.99" },
    { name: "Drain Pan Treatment Tablets 24pk", part: "DPTT-24", price: "$9.95", was: "$12.99" },
    { name: "Condensate Drain Cleaning Brush", part: "CDCB-1", price: "$7.95", was: "$9.99" },
    { name: "Overflow Safety Switch 1/4 Flare", part: "OSS-14FL", price: "$19.95", was: "$24.99" },
  ],

  // ── Compressor Parts ───────────────────────────────────────────────────────
  "Compressor Parts": [
    { name: "Compressor Contactor 2 Pole 40A", part: "CONT2P40A", price: "$14.95", was: "$18.99" },
    { name: "Compressor Contactor 3 Pole 30A", part: "CONT3P30A", price: "$18.95", was: "$23.99" },
    { name: "Hard Start Kit 2-3 Ton SPP6E", part: "SPP6E", price: "$34.95", was: "$42.99", brand: "Supco" },
    { name: "Compressor Overload Protector", part: "COP-UNIV-1", price: "$12.95", was: "$15.99" },
    { name: "Discharge Line Muffler", part: "DLM-1", price: "$19.95", was: "$24.99" },
    { name: "Suction Line Accumulator Filter", part: "SLAF-1", price: "$24.95", was: "$29.99" },
    { name: "Compressor Oil POE 8oz", part: "POE-8OZ", price: "$12.95", was: "$15.99" },
    { name: "Compressor Mounting Grommet Set 4pk", part: "CMG-4PK", price: "$7.95", was: "$9.99" },
  ],

  // ── Ducting & Sheet Metal ──────────────────────────────────────────────────
  "Ducting & Sheet Metal": [
    { name: "Flex Duct R6 6in x 25ft", part: "FD-6X25-R6", price: "$49.95", was: "$59.99" },
    { name: "Flex Duct R6 8in x 25ft", part: "FD-8X25-R6", price: "$64.95", was: "$77.99" },
    { name: "Round Galvanized Duct 6in x 5ft", part: "RGD-6X5", price: "$14.95", was: "$18.99" },
    { name: "Round Galvanized Duct 8in x 5ft", part: "RGD-8X5", price: "$19.95", was: "$24.99" },
    { name: "Flexible Duct Connector 6in", part: "FDC-6", price: "$8.95", was: "$11.99" },
    { name: "Sheet Metal Elbow 6in 90 Degree", part: "SME-6-90", price: "$12.95", was: "$15.99" },
    { name: "Sheet Metal Elbow 8in 90 Degree", part: "SME-8-90", price: "$16.95", was: "$20.99" },
    { name: "End Cap 6in", part: "EC-6", price: "$5.95", was: "$7.99" },
    { name: "Spiral Pipe 6in x 10ft", part: "SP-6X10", price: "$29.95", was: "$36.99" },
    { name: "Duct Connector Boot 4x10x6", part: "DCB-4X10X6", price: "$9.95", was: "$12.99" },
  ],

  // ── Electrical ─────────────────────────────────────────────────────────────
  "Electrical": [
    { name: "HVAC Disconnect Box 60A 240V", part: "DB-60A-240", price: "$24.95", was: "$29.99" },
    { name: "HVAC Disconnect Non-Fused 30A", part: "DB-NF-30A", price: "$18.95", was: "$23.99" },
    { name: "Time Delay Relay DPDT 5 min", part: "TDR-DPDT-5", price: "$19.95", was: "$24.99" },
    { name: "Transformer 40VA 208/240 to 24V", part: "TR-40VA-24V", price: "$24.95", was: "$29.99" },
    { name: "Wire Connector Assortment 100pk", part: "WC-100PK", price: "$9.95", was: "$12.99" },
    { name: "Terminal Block 12 Position", part: "TB-12POS", price: "$12.95", was: "$15.99" },
    { name: "Fuse Holder Inline 1/4x1-1/4", part: "FH-IL-14", price: "$3.95", was: "$5.99" },
    { name: "Miniature Fuse 3A 250V 5pk", part: "FUSE-3A-5PK", price: "$4.95", was: "$6.99" },
    { name: "SPST Relay 24V Coil 5A", part: "REL-24V-5A", price: "$8.95", was: "$11.99" },
    { name: "Contactor Coil 24V Replacement", part: "CC-24V-REPL", price: "$12.95", was: "$15.99" },
  ],

  // ── Electrical Controls ────────────────────────────────────────────────────
  "Electrical Controls": [
    { name: "Honeywell Fan Center FC200E", part: "FC200E1011/U", price: "$59.95", was: "$72.99", brand: "Honeywell" },
    { name: "Carrier Control Board CESO110057", part: "CESO110057-03", price: "$129.95", was: "$149.99", brand: "Carrier" },
    { name: "Goodman Control Board PCBDM135S", part: "PCBDM135S", price: "$89.95", was: "$109.99", brand: "Goodman" },
    { name: "Defrost Control Board Universal", part: "DCB-UNIV-1", price: "$49.95", was: "$59.99" },
    { name: "Heat Sequencer 240V", part: "HS-240V-1", price: "$19.95", was: "$24.99" },
    { name: "Lennox Control Board 83M00", part: "83M00", price: "$149.95", was: "$174.99", brand: "Lennox" },
    { name: "York Control Board S1-32543423000", part: "S1-32543423000", price: "$169.95", was: "$194.99", brand: "York" },
    { name: "ICM Controls Universal Defrost Timer", part: "ICM303", price: "$59.95", was: "$72.99", brand: "ICM" },
  ],

  // ── Evaporator and Blower Motors ───────────────────────────────────────────
  "Evaporator and Blower Motors": [
    { name: "GE Genteq 1/3 HP 230V Blower Motor", part: "5KCP39DGS070S", price: "$189.95", was: "$219.99", brand: "GE" },
    { name: "Emerson 1/2 HP 230V Direct Drive Motor", part: "K55HXKKG-2068", price: "$229.95", was: "$259.99", brand: "Emerson" },
    { name: "AO Smith 3/4 HP Blower Motor 208/230V", part: "BL6412", price: "$269.95", was: "$309.99", brand: "AO Smith" },
    { name: "ECM X13 Motor 1 HP Replacement", part: "ECM-X13-1HP", price: "$449.95", was: "$499.99" },
    { name: "Rescue Non-Programmable 1/3 HP Motor", part: "5456", price: "$129.95", was: "$154.99", brand: "Rescue" },
    { name: "Furnace Blower Motor 1/5 HP 115V", part: "FBM-15-115V", price: "$99.95", was: "$119.99" },
  ],

  // ── Fan Blades ─────────────────────────────────────────────────────────────
  "Fan Blades": [
    { name: "Condenser Fan Blade 24in 3 Blade CW", part: "FB-24-3-CW", price: "$34.95", was: "$42.99" },
    { name: "Condenser Fan Blade 26in 3 Blade CW", part: "FB-26-3-CW", price: "$39.95", was: "$47.99" },
    { name: "Condenser Fan Blade 18in 4 Blade CW", part: "FB-18-4-CW", price: "$29.95", was: "$36.99" },
    { name: "Evaporator Fan Blade 6in 4 Blade", part: "EFB-6-4", price: "$14.95", was: "$18.99" },
    { name: "Fan Blade Hub / Bushing 5/16", part: "FBH-516", price: "$4.95", was: "$6.99" },
    { name: "Fan Blade Puller Tool", part: "FBP-TOOL", price: "$24.95", was: "$29.99" },
  ],

  // ── Fasteners ──────────────────────────────────────────────────────────────
  "Fasteners": [
    { name: "Sheet Metal Screws #8 x 1/2 100pk", part: "SMS-8X12-100", price: "$7.95", was: "$9.99" },
    { name: "Sheet Metal Screws #10 x 1 50pk", part: "SMS-10X1-50", price: "$7.95", was: "$9.99" },
    { name: "Hex Head Bolts 1/4-20 x 1 25pk", part: "HHB-14X1-25", price: "$6.95", was: "$8.99" },
    { name: "Self-Drilling Screws 8-18 x 1/2 100pk", part: "SDS-8X12-100", price: "$8.95", was: "$11.99" },
    { name: "Condenser Unit Mounting Bolts 4pk", part: "CUMB-4PK", price: "$5.95", was: "$7.99" },
    { name: "Pop Rivets 1/8 x 1/4 100pk", part: "PR-18X14-100", price: "$6.95", was: "$8.99" },
  ],

  // ── Filter - Driers ────────────────────────────────────────────────────────
  "Filter - Driers": [
    { name: "Catch-All Filter Drier 1/4 Flare 033", part: "032649", price: "$14.95", was: "$18.99", brand: "Sporlan" },
    { name: "Filter Drier 1/4 Sweat Biflow", part: "BD-053-S", price: "$19.95", was: "$24.99", brand: "Sporlan" },
    { name: "Filter Drier 3/8 Sweat Liquid Line", part: "FD-38-LL", price: "$12.95", was: "$15.99" },
    { name: "Suction Line Drier 7/8 Sweat", part: "SLD-78SW", price: "$24.95", was: "$29.99" },
    { name: "Filter Drier Core DISA 4-Pack", part: "CORE-DISA-4", price: "$29.95", was: "$36.99" },
    { name: "Drier Cartridge Replacement", part: "DCR-UNIV-1", price: "$9.95", was: "$12.99" },
  ],

  // ── Fittings ───────────────────────────────────────────────────────────────
  "Fittings": [
    { name: "Flare Nut 1/4in 5pk", part: "FN-14-5PK", price: "$4.95", was: "$6.99" },
    { name: "Flare Nut 3/8in 5pk", part: "FN-38-5PK", price: "$5.95", was: "$7.99" },
    { name: "Copper Sweat Coupling 3/8 5pk", part: "CSC-38-5PK", price: "$7.95", was: "$9.99" },
    { name: "Copper Sweat Elbow 90° 3/8 5pk", part: "CSE-38-5PK", price: "$8.95", was: "$11.99" },
    { name: "Reducer Fitting 3/8 to 1/4", part: "RF-38-14", price: "$3.95", was: "$5.99" },
    { name: "Service Valve Core 1/4 5pk", part: "SVC-14-5PK", price: "$4.95", was: "$6.99" },
    { name: "Access Port Valve 1/4 Flare", part: "APV-14FL", price: "$5.95", was: "$7.99" },
    { name: "Saddle Valve 1/4 Self-Piercing", part: "SV-14-SP", price: "$8.95", was: "$11.99" },
    { name: "Bulkhead Fitting 1/2 NPT", part: "BHF-12NPT", price: "$6.95", was: "$8.99" },
    { name: "Ball Valve 3/4 Sweat Full Port", part: "BV-34-FP", price: "$19.95", was: "$24.99" },
  ],

  // ── Gas Heat Controls ──────────────────────────────────────────────────────
  "Gas Heat Controls": [
    { name: "White-Rodgers Gas Valve 36E22", part: "36E22-214", price: "$129.95", was: "$149.99", brand: "Emerson" },
    { name: "Honeywell Gas Valve SV9501M", part: "SV9501M2528", price: "$219.95", was: "$259.99", brand: "Honeywell" },
    { name: "Carrier Draft Inducer Motor", part: "326628-762", price: "$199.95", was: "$229.99", brand: "Carrier" },
    { name: "HSI Ignitor Silicon Nitride Universal", part: "271N", price: "$19.95", was: "$24.99" },
    { name: "Flame Sensor Rod Universal 3-1/4in", part: "FSR-UNIV-1", price: "$9.95", was: "$12.99" },
    { name: "Pressure Switch Normally Open 0.20 WC", part: "PS-NO-020", price: "$24.95", was: "$29.99" },
    { name: "Rollout Limit Switch 250°F", part: "RLS-250F", price: "$14.95", was: "$18.99" },
    { name: "Furnace Limit Switch 170°F", part: "FLS-170F", price: "$12.95", was: "$15.99" },
  ],

  // ── Grilles, Registers & Diffusers ────────────────────────────────────────
  "Grilles": [
    { name: "Return Air Grille 14x25 White", part: "RAG-14X25-WH", price: "$14.95", was: "$18.99" },
    { name: "Return Air Grille 16x20 White", part: "RAG-16X20-WH", price: "$12.95", was: "$15.99" },
    { name: "Return Air Grille 20x25 White", part: "RAG-20X25-WH", price: "$16.95", was: "$20.99" },
    { name: "Supply Diffuser 4x10 White", part: "SD-4X10-WH", price: "$8.95", was: "$11.99" },
    { name: "Supply Register 4x12 White Adj", part: "SR-4X12-WH", price: "$9.95", was: "$12.99" },
    { name: "Floor Register 4x10 Chrome", part: "FR-4X10-CH", price: "$7.95", was: "$9.99" },
    { name: "Ceiling Diffuser 10x10 White", part: "CD-10X10-WH", price: "$18.95", was: "$23.99" },
    { name: "Linear Bar Grille 12x4", part: "LBG-12X4", price: "$14.95", was: "$18.99" },
  ],

  // ── Refrigerant ────────────────────────────────────────────────────────────
  "Refrigerant": [
    { name: "R-410A Refrigerant 25 lb Cylinder", part: "R410A-25LB", price: "$89.95", was: "$109.99" },
    { name: "R-22 Refrigerant 30 lb Cylinder", part: "R22-30LB", price: "$299.95", was: "$349.99" },
    { name: "R-404A Refrigerant 24 lb Cylinder", part: "R404A-24LB", price: "$149.95", was: "$174.99" },
    { name: "R-134A Refrigerant 30 lb Cylinder", part: "R134A-30LB", price: "$79.95", was: "$94.99" },
    { name: "R-32 Refrigerant 10 lb Cylinder", part: "R32-10LB", price: "$69.95", was: "$84.99" },
    { name: "R-454B Refrigerant 25 lb Cylinder", part: "R454B-25LB", price: "$109.95", was: "$129.99" },
  ],

  // ── Line Sets ──────────────────────────────────────────────────────────────
  "Line Sets": [
    { name: "Line Set 3/8 x 3/4 x 25ft Pre-Insulated", part: "LS-38X34X25", price: "$89.95", was: "$104.99" },
    { name: "Line Set 3/8 x 3/4 x 50ft Pre-Insulated", part: "LS-38X34X50", price: "$149.95", was: "$174.99" },
    { name: "Line Set 1/4 x 1/2 x 25ft Pre-Insulated", part: "LS-14X12X25", price: "$69.95", was: "$84.99" },
    { name: "Insulation Wrap Foam 3/8 ID x 6ft", part: "IWF-38X6", price: "$4.95", was: "$6.99" },
    { name: "Copper Tubing ACR 3/8 OD x 50ft", part: "CT-38X50", price: "$79.95", was: "$94.99" },
    { name: "Copper Tubing ACR 1/2 OD x 50ft", part: "CT-12X50", price: "$99.95", was: "$119.99" },
  ],

  // ── Mounting Supplies ──────────────────────────────────────────────────────
  "Mounting Supplies": [
    { name: "Condenser Pad 30x30x3 Composite", part: "CP-30X30X3", price: "$49.95", was: "$59.99" },
    { name: "Condenser Pad 24x24x3 Composite", part: "CP-24X24X3", price: "$39.95", was: "$47.99" },
    { name: "Adjustable Wall Bracket Mini Split", part: "WB-MS-ADJ", price: "$34.95", was: "$42.99" },
    { name: "Vibration Isolation Mount Set 4pk", part: "VIM-4PK", price: "$14.95", was: "$18.99" },
    { name: "Coil Guard Vinyl 24x24", part: "CG-24X24", price: "$19.95", was: "$24.99" },
    { name: "Equipment Riser Kit 6in", part: "ERK-6IN", price: "$24.95", was: "$29.99" },
  ],

  // ── Tape ───────────────────────────────────────────────────────────────────
  "Tape": [
    { name: "Foil HVAC Tape 2in x 50yd", part: "FT-2X50", price: "$9.95", was: "$12.99" },
    { name: "Foil HVAC Tape 3in x 50yd", part: "FT-3X50", price: "$12.95", was: "$15.99" },
    { name: "Flex Duct Tape Black 2in x 100ft", part: "FDT-2X100", price: "$7.95", was: "$9.99" },
    { name: "Cloth Duct Tape Silver 2in x 60yd", part: "CDT-2X60", price: "$8.95", was: "$11.99" },
    { name: "Butyl Rubber Tape 1in x 50ft", part: "BRT-1X50", price: "$14.95", was: "$18.99" },
    { name: "Mastic Tape Self-Sealing 4in", part: "MT-SEAL-4", price: "$19.95", was: "$24.99" },
  ],

  // ── UV Lighting (Ultraviolet) ──────────────────────────────────────────────
  "Ultraviolet": [
    { name: "UV Light Single Bulb 9W 110V", part: "UV-9W-110", price: "$69.95", was: "$84.99" },
    { name: "UV Light Dual Bulb 18W 24V", part: "UV-18W-24", price: "$129.95", was: "$154.99" },
    { name: "Replacement UV Lamp Bulb 9W", part: "UVB-9W-REPL", price: "$24.95", was: "$29.99" },
    { name: "UV Light Coil Purifier System", part: "UVPS-COIL", price: "$149.95", was: "$179.99" },
    { name: "Germicidal UV-C Lamp 16W", part: "UVC-16W", price: "$49.95", was: "$59.99" },
  ],

  // ── Safety Equipment ───────────────────────────────────────────────────────
  "Safety": [
    { name: "Refrigerant Safety Glasses ANSI", part: "RSG-ANSI", price: "$9.95", was: "$12.99" },
    { name: "Nitrile Gloves Box of 100", part: "NG-100BX", price: "$14.95", was: "$18.99" },
    { name: "FR Work Shirt Long Sleeve L", part: "FRWS-L", price: "$49.95", was: "$59.99" },
    { name: "Carbon Monoxide Detector Plug-In", part: "CMD-PI", price: "$24.95", was: "$29.99" },
    { name: "Respirator Half Face P100", part: "RES-HF-P100", price: "$34.95", was: "$42.99" },
    { name: "First Aid Kit OSHA 50 Person", part: "FAK-50P", price: "$44.95", was: "$54.99" },
  ],

  // ── Commercial Appliance ───────────────────────────────────────────────────
  "Commercial Appliance": [
    { name: "Manitowoc Ice Machine Harvest Control", part: "000000195", price: "$89.95", was: "$109.99", brand: "Manitowoc" },
    { name: "Hobart Dishwasher Door Switch", part: "343959-10", price: "$34.95", was: "$42.99", brand: "Hobart" },
    { name: "Vulcan Range Thermostat", part: "00-414500-0001", price: "$129.95", was: "$154.99", brand: "Vulcan" },
    { name: "Garland Gas Valve Replacement", part: "4522302", price: "$99.95", was: "$119.99", brand: "Garland" },
    { name: "Pitco Fryer Heating Element 3500W", part: "B2702603", price: "$69.95", was: "$84.99", brand: "Pitco" },
    { name: "Rational Control Knob Replacement", part: "20.00.836", price: "$24.95", was: "$29.99", brand: "Rational" },
    { name: "Scotsman Ice Bin Thermistor", part: "02-3676-21", price: "$49.95", was: "$59.99", brand: "Scotsman" },
  ],

  // ── Coffee & Small Appliance ───────────────────────────────────────────────
  "Coffee & Small Appliance": [
    { name: "Keurig Needle Cleaning Tool", part: "KEUR-NCT", price: "$9.95", was: "$12.99", brand: "Keurig" },
    { name: "Breville Espresso Portafilter Basket", part: "SP0001637", price: "$14.95", was: "$18.99", brand: "Breville" },
    { name: "Vitamix Drive Socket", part: "15861", price: "$24.95", was: "$29.99", brand: "Vitamix" },
    { name: "KitchenAid Stand Mixer Bowl Lift Arm", part: "W11162296", price: "$29.95", was: "$36.99", brand: "KitchenAid" },
    { name: "Ninja Blender Blade Assembly", part: "492KKU110", price: "$19.95", was: "$24.99", brand: "Ninja" },
    { name: "Hamilton Beach Motor Drive Coupling", part: "990005500", price: "$8.95", was: "$11.99", brand: "Hamilton Beach" },
    { name: "Cuisinart Food Processor Blade", part: "WB-1B", price: "$17.95", was: "$21.99", brand: "Cuisinart" },
  ],

  // ── Auto & Garage ──────────────────────────────────────────────────────────
  "Auto & Garage": [
    { name: "Garage Door Torsion Spring 0.225 x 2 x 90", part: "GDS-225X2X90", price: "$34.95", was: "$42.99" },
    { name: "Genie Garage Door Opener Belt", part: "36537R.S", price: "$24.95", was: "$29.99", brand: "Genie" },
    { name: "Chamberlain Wall Button", part: "41A5273-1", price: "$14.95", was: "$18.99", brand: "Chamberlain" },
    { name: "LiftMaster Safety Sensor 41A4373A", part: "41A4373A", price: "$29.95", was: "$36.99", brand: "LiftMaster" },
    { name: "Garage Door Weather Seal Bottom 9ft", part: "GDW-9FT", price: "$12.95", was: "$15.99" },
    { name: "Auto Battery Tender 12V 1.25A", part: "BT-12V-125", price: "$29.95", was: "$36.99" },
    { name: "Shop Vac Filter Cartridge Replacement", part: "SVF-CART", price: "$14.95", was: "$18.99" },
  ],

  // ── Print & Imaging ────────────────────────────────────────────────────────
  "Print & Imaging": [
    { name: "HP 65 Black Ink Cartridge", part: "T0A36AN", price: "$14.95", was: "$18.99", brand: "HP" },
    { name: "HP 65XL Color Ink Cartridge", part: "N9K03AN", price: "$24.95", was: "$29.99", brand: "HP" },
    { name: "Canon PG-245 Black Ink", part: "8279B001", price: "$12.95", was: "$15.99", brand: "Canon" },
    { name: "Epson 702 Black Ink Bottle", part: "T702120-S", price: "$14.95", was: "$18.99", brand: "Epson" },
    { name: "Brother TN-760 Toner Cartridge", part: "TN760", price: "$49.95", was: "$59.99", brand: "Brother" },
    { name: "Lexmark 300H Black Cartridge", part: "14N0820", price: "$19.95", was: "$24.99", brand: "Lexmark" },
    { name: "Printer Maintenance Kit", part: "PMK-UNIV-1", price: "$34.95", was: "$42.99" },
  ],

  // ── Home Maintenance ───────────────────────────────────────────────────────
  "Home Maintenance": [
    { name: "Caulk Gun 10oz Heavy Duty", part: "CG-10OZ-HD", price: "$12.95", was: "$15.99" },
    { name: "Drywall Patch Kit 6in", part: "DPK-6IN", price: "$8.95", was: "$11.99" },
    { name: "Spray Paint Flat Black 12oz", part: "SP-FB-12OZ", price: "$5.95", was: "$7.99" },
    { name: "Door Hinge Set 3pk Satin Nickel", part: "DHS-3PK-SN", price: "$9.95", was: "$12.99" },
    { name: "Weatherstrip Adhesive 5oz", part: "WSA-5OZ", price: "$7.95", was: "$9.99" },
    { name: "Lock Set Passage Knob", part: "LS-PAS-KN", price: "$19.95", was: "$24.99" },
    { name: "Screen Repair Kit Fiberglass", part: "SRK-FG", price: "$12.95", was: "$15.99" },
    { name: "Ceiling Fan Capacitor CBB61", part: "CFC-CBB61", price: "$9.95", was: "$12.99" },
  ],

  // ── Fitness ────────────────────────────────────────────────────────────────
  "Fitness": [
    { name: "NordicTrack Treadmill Belt", part: "NT-BELT-T6", price: "$89.95", was: "$109.99", brand: "NordicTrack" },
    { name: "Peloton Resistance Knob Cap", part: "PEL-RKC", price: "$12.95", was: "$15.99", brand: "Peloton" },
    { name: "ProForm Elliptical Foot Pedal Left", part: "PFM-FPL", price: "$49.95", was: "$59.99", brand: "ProForm" },
    { name: "Bowflex Cable Assembly Replacement", part: "BFX-CABLE", price: "$34.95", was: "$42.99", brand: "Bowflex" },
    { name: "Schwinn Bike Flywheel Belt", part: "SCH-FWB", price: "$24.95", was: "$29.99", brand: "Schwinn" },
    { name: "Rowing Machine Resistance Band", part: "RM-RESBAND", price: "$19.95", was: "$24.99" },
  ],

  // ── Household Cleaners ─────────────────────────────────────────────────────
  "Household Cleaners": [
    { name: "Drain Cleaner Enzymatic 32oz", part: "DCE-32OZ", price: "$9.95", was: "$12.99" },
    { name: "Descaler Solution Citric Acid 2lb", part: "DES-CA-2LB", price: "$12.95", was: "$15.99" },
    { name: "Washing Machine Cleaner Tablets 24pk", part: "WMC-24PK", price: "$14.95", was: "$18.99" },
    { name: "Dishwasher Cleaner Pouches 6pk", part: "DWC-6PK", price: "$7.95", was: "$9.99" },
    { name: "Dryer Vent Cleaning Kit", part: "DVCK-1", price: "$19.95", was: "$24.99" },
    { name: "Refrigerator Coil Brush 30in", part: "RCB-30IN", price: "$8.95", was: "$11.99" },
  ],

  // ── Installation Supplies ──────────────────────────────────────────────────
  "Installation Supplies": [
    { name: "Pipe Insulation 3/8 ID x 6ft", part: "PI-38X6", price: "$3.95", was: "$5.99" },
    { name: "Pipe Insulation 1/2 ID x 6ft", part: "PI-12X6", price: "$4.95", was: "$6.99" },
    { name: "Refrigerant Line Hanger 1in 10pk", part: "RLH-1IN-10", price: "$7.95", was: "$9.99" },
    { name: "Cable Tie Nylon 8in 100pk", part: "CT-8IN-100", price: "$5.95", was: "$7.99" },
    { name: "Foam Pipe Insulation Tape 1in x 15ft", part: "FPI-TAPE-1", price: "$6.95", was: "$8.99" },
    { name: "Armaflex Sheet 1/2 x 24 x 36", part: "ARM-SHEET-12", price: "$24.95", was: "$29.99" },
    { name: "Wire Loom Conduit 1/4 x 10ft", part: "WLC-14X10", price: "$4.95", was: "$6.99" },
    { name: "Hose Clamp Assortment 40pk", part: "HCA-40PK", price: "$9.95", was: "$12.99" },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION HELPER
// ─────────────────────────────────────────────────────────────────────────────
function paginate(items, page, limit) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.max(1, parseInt(limit) || 20);
  const total = items.length;
  const pages = Math.ceil(total / l) || 1;
  const start = (p - 1) * l;
  const slice = items.slice(start, start + l);
  return {
    products: slice,
    page: p,
    pages,
    total,
    hasMore: p < pages
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/categories
 * Returns all distinct categories with item counts
 */
router.get('/categories', (req, res) => {
  const map = {};
  CATALOGUE.forEach(p => {
    map[p.category] = (map[p.category] || 0) + 1;
  });
  const categories = Object.entries(map)
    .map(([name, count]) => ({ name, count, vertical: guessVertical(name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json({ total: CATALOGUE.length, categories });
});

/**
 * GET /api/products/search?q=keyword&page=1&limit=20
 * Full-text search across name, part, brand, category
 */
router.get('/products/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const page = req.query.page;
  const limit = req.query.limit;

  if (!q) return res.json(paginate([], page, limit));

  const results = CATALOGUE.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.part.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.vertical.toLowerCase().includes(q)
  );

  res.json(paginate(results, page, limit));
});

/**
 * GET /api/products/brand/:brand?page=1&limit=20
 * Products filtered by brand name (case-insensitive)
 */
router.get('/products/brand/:brand', (req, res) => {
  const brand = req.params.brand.toLowerCase();
  const items = CATALOGUE.filter(p => p.brand.toLowerCase() === brand);
  res.json(paginate(items, req.query.page, req.query.limit));
});

/**
 * GET /api/products/vertical/:vertical?page=1&limit=20
 * Products filtered by vertical (department)
 */
router.get('/products/vertical/:vertical', (req, res) => {
  const vertical = req.params.vertical.toLowerCase();
  const items = CATALOGUE.filter(p => p.vertical.toLowerCase() === vertical);
  res.json(paginate(items, req.query.page, req.query.limit));
});

/**
 * GET /api/products/:category?page=1&limit=20
 * Products filtered by category (exact, case-insensitive)
 * Must come AFTER the /brand/ and /vertical/ routes above
 */
router.get('/products/:category', (req, res) => {
  const cat = req.params.category.toLowerCase();
  const items = CATALOGUE.filter(p => p.category.toLowerCase() === cat);
  res.json(paginate(items, req.query.page, req.query.limit));
});

/**
 * GET /api/products
 * All products paginated (used by products.html if needed)
 */
router.get('/products', (req, res) => {
  res.json(paginate(CATALOGUE, req.query.page, req.query.limit));
});

module.exports = router;
