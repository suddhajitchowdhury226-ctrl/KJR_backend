require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const CATEGORIES = [
  "Accumulators & Receivers", "Adhesives", "Air Cleaners", "Air Filters",
  "Airflow Accessories", "Blower Components", "Brazing & Soldering Supplies",
  "Brazing & Soldering Tools", "Capacitors", "Caulking & Sealants",
  "Cleaners & Chemicals", "Coils", "Compressor Parts", "Compressors",
  "Condensate Drain Supplies", "Condensate Pumps", "Condenser Fan Motors",
  "Connected Home", "Construction Supplies", "Diffusers", "Double Shaft Motors",
  "Draft Inducer Motors", "Ducting & Sheet Metal", "Electrical",
  "Electrical Controls", "Evaporator and Blower Motors", "Exhaust & Supply Fans",
  "Fan Blades", "Fasteners", "Filter - Driers", "Fittings", "Gas Heat Controls",
  "Grilles", "Hand Tools", "Heat & Energy Recovery Ventilation",
  "Heat Pump Controls", "Inspection Tools", "Line Sets",
  "Miscellaneous Components", "Moisture Control & Zoning", "Motor Accessories",
  "Mounting Supplies", "Non-HVAC Items", "Oil Heat Controls",
  "Other Miscellaneous Installation Supplies", "Other Specialty Tools", "Pipe",
  "Power Tools", "Registers", "Refrigerant", "Residential Air Handlers",
  "Residential Coils", "Residential Equipment", "Residential Equipment Accessories",
  "Residential Mini Split Accessories", "Safety", "Service Tools",
  "Super Accessories", "Tape", "Test Tools",
  "Thermostat Guards & Thermostat Accessories", "Thermostats", "Tool Storage",
  "Ultraviolet", "Unit Heaters", "Valves", "Ventilators & Accessories",
  "Water Heaters"
];

const CATEGORY_VERTICAL = {
  "Accumulators & Receivers": "HVAC", "Adhesives": "HVAC", "Air Cleaners": "HVAC",
  "Air Filters": "HVAC", "Airflow Accessories": "HVAC", "Blower Components": "HVAC",
  "Brazing & Soldering Supplies": "HVAC", "Brazing & Soldering Tools": "Service Aids & Tools",
  "Capacitors": "HVAC", "Caulking & Sealants": "HVAC", "Cleaners & Chemicals": "HVAC",
  "Coils": "HVAC", "Compressor Parts": "HVAC", "Compressors": "HVAC",
  "Condensate Drain Supplies": "HVAC", "Condensate Pumps": "HVAC", "Condenser Fan Motors": "HVAC",
  "Connected Home": "Consumer Electronics", "Construction Supplies": "HVAC",
  "Diffusers": "HVAC", "Double Shaft Motors": "HVAC", "Draft Inducer Motors": "HVAC",
  "Ducting & Sheet Metal": "HVAC", "Electrical": "HVAC", "Electrical Controls": "HVAC",
  "Evaporator and Blower Motors": "HVAC", "Exhaust & Supply Fans": "HVAC",
  "Fan Blades": "HVAC", "Fasteners": "HVAC", "Filter - Driers": "HVAC",
  "Fittings": "Plumbing", "Gas Heat Controls": "HVAC", "Grilles": "HVAC",
  "Hand Tools": "Service Aids & Tools", "Heat & Energy Recovery Ventilation": "HVAC",
  "Heat Pump Controls": "HVAC", "Inspection Tools": "Service Aids & Tools",
  "Line Sets": "HVAC", "Miscellaneous Components": "HVAC", "Moisture Control & Zoning": "HVAC",
  "Motor Accessories": "HVAC", "Mounting Supplies": "HVAC", "Non-HVAC Items": "Home Appliances",
  "Oil Heat Controls": "HVAC", "Other Miscellaneous Installation Supplies": "HVAC",
  "Other Specialty Tools": "Service Aids & Tools", "Pipe": "Plumbing",
  "Power Tools": "Power Tool Parts", "Registers": "HVAC", "Refrigerant": "HVAC",
  "Residential Air Handlers": "HVAC", "Residential Coils": "HVAC",
  "Residential Equipment": "HVAC", "Residential Equipment Accessories": "HVAC",
  "Residential Mini Split Accessories": "HVAC", "Safety": "Service Aids & Tools",
  "Service Tools": "Service Aids & Tools", "Super Accessories": "HVAC", "Tape": "HVAC",
  "Test Tools": "Service Aids & Tools", "Thermostat Guards & Thermostat Accessories": "HVAC",
  "Thermostats": "HVAC", "Tool Storage": "Service Aids & Tools", "Ultraviolet": "HVAC",
  "Unit Heaters": "HVAC", "Valves": "Plumbing", "Ventilators & Accessories": "HVAC",
  "Water Heaters": "Plumbing"
};

const BRANDS = [
  'Rheem', 'Gemaire', 'Tradepro', 'Carrier', 'Trane', 'Lennox', 'York', 'Goodman',
  'Daikin', 'Mitsubishi', 'Honeywell', 'Emerson', 'Copeland', 'Danfoss', 'Parker',
  'Sporlan', 'Supco', 'Mars', 'Fasco', 'A.O. Smith', 'Bradford White', 'Weil-McLain',
  'Beckett', 'Riello', 'White-Rodgers', 'Robertshaw', 'ICM', 'Regal Beloit', 'GE',
  'Century', 'Baldor', 'Leeson', 'Nidec', 'Ametek', 'Packard', 'Rotom'
];

const TEMPLATES = {
  "Accumulators & Receivers": { prefixes: ["Accumulator", "Receiver", "Suction Accumulator", "Bi-Flow Accumulator", "Vertical Receiver"], suffixes: ["1/2in", "3/8in", "5/8in", "7/8in", "1-1/8in"], priceRange: [25, 250] },
  "Adhesives": { prefixes: ["Duct Sealant", "Spray Adhesive", "Insulation Adhesive", "Seal Tack", "Air Lag Adhesive"], suffixes: ["1 Gal", "2 Gal", "5 Gal", "Tube", "12 Oz Can"], priceRange: [8, 120] },
  "Air Cleaners": { prefixes: ["Media Air Cleaner", "Electronic Air Cleaner", "HEPA Air Cleaner", "UV Air Cleaner", "Plasma Air Cleaner"], suffixes: ["16x25", "20x25", "20x20", "25x25", "16x20"], priceRange: [50, 1600] },
  "Air Filters": { prefixes: ["Pleated Filter", "Fiberglass Filter", "Poly Filter", "Electrostatic Filter", "MERV Filter"], suffixes: ["16x20x1", "20x25x1", "16x25x1", "20x20x1", "14x20x1", "20x25x4", "16x25x4"], priceRange: [5, 100] },
  "Airflow Accessories": { prefixes: ["Plenum", "Return Box", "Mixing Box", "Discharge Plenum", "Transition Box"], suffixes: ["R6", "R8", "16x20", "20x25", "14x24", "24x24"], priceRange: [60, 260] },
  "Blower Components": { prefixes: ["Blower Housing", "Blower Wheel", "Blower Assembly", "Double Inlet Wheel", "Single Inlet Wheel"], suffixes: ["10x8", "12x9", "11x10", "9x7", "14x11"], priceRange: [20, 180] },
  "Brazing & Soldering Supplies": { prefixes: ["Silver Alloy", "Brazing Rod", "Flux Paste", "Solder Wire", "Stay-Silv Alloy"], suffixes: ["1 Lb", "5 Lb", "1/2 Lb", "Tube", "Kit"], priceRange: [10, 150] },
  "Brazing & Soldering Tools": { prefixes: ["Torch Kit", "Oxy-Acetylene Set", "Regulator", "Tip Cleaner", "Striker"], suffixes: ["Standard", "Heavy Duty", "Mini", "Pro", "Deluxe"], priceRange: [15, 300] },
  "Capacitors": { prefixes: ["Run Capacitor", "Start Capacitor", "Dual Run Capacitor", "Round Capacitor", "Oval Capacitor"], suffixes: ["5 MFD 370V", "10 MFD 440V", "35/5 MFD", "45/5 MFD", "55+5 MFD", "88-108 MFD"], priceRange: [10, 60] },
  "Caulking & Sealants": { prefixes: ["Silicone Caulk", "PVC Cement", "PVC Primer", "Foam Sealant", "Weatherstrip Sealant"], suffixes: ["10 Oz", "1 Qt", "1 Gal", "Tube", "Can"], priceRange: [5, 50] },
  "Cleaners & Chemicals": { prefixes: ["Coil Cleaner", "Condenser Cleaner", "Evaporator Cleaner", "Drain Pan Cleaner", "Refrigerant Oil"], suffixes: ["1 Gal", "Qt", "18 Oz Spray", "5 Gal", "Aerosol"], priceRange: [8, 120] },
  "Coils": { prefixes: ["Condenser Coil", "Evaporator Coil", "A-Coil", "Slab Coil", "Cased Coil"], suffixes: ["1.5 Ton", "2 Ton", "2.5 Ton", "3 Ton", "3.5 Ton", "4 Ton", "5 Ton"], priceRange: [150, 900] },
  "Compressor Parts": { prefixes: ["Crankcase Heater", "Rotalock Valve", "Start Relay", "Terminal Lead", "Wiring Harness"], suffixes: ["120V", "240V", "Universal", "OEM", "Kit"], priceRange: [10, 120] },
  "Compressors": { prefixes: ["Scroll Compressor", "Reciprocating Compressor", "Rotary Compressor", "Inverter Compressor", "Remanufactured Scroll"], suffixes: ["1.5 Ton R-410A", "2 Ton R-410A", "2.5 Ton R-410A", "3 Ton R-410A", "4 Ton R-410A"], priceRange: [200, 1200] },
  "Condensate Drain Supplies": { prefixes: ["Drain Pan", "Condensate Pan", "Drain Line", "P-Trap", "Float Switch"], suffixes: ["14x14", "16x16", "20x20", "24x24", "Universal"], priceRange: [8, 80] },
  "Condensate Pumps": { prefixes: ["Mini Split Pump", "Standard Condensate Pump", "Inline Pump", "Safety Switch Pump", "Reservoir Pump"], suffixes: ["115V", "230V", "Universal", "1/30 HP", "1/50 HP"], priceRange: [30, 180] },
  "Condenser Fan Motors": { prefixes: ["Condenser Motor", "OEM Condenser Motor", "Aftermarket Motor", "Multi-HP Motor", "Replacement Motor"], suffixes: ["1/4 HP 208-230V", "1/3 HP 208-230V", "1/2 HP 208-230V", "1/6 HP 208-230V", "3/4 HP 460V"], priceRange: [40, 280] },
  "Connected Home": { prefixes: ["Leak Detector", "Smart Sensor", "WiFi Monitor", "Water Sensor", "Flood Alert"], suffixes: ["Battery", "Wired", "Wireless", "Smart Home", "Z-Wave"], priceRange: [25, 150] },
  "Construction Supplies": { prefixes: ["Attic Insulation", "Wall Insulation", "Downspout", "Flashing", "Vapor Barrier"], suffixes: ["R-13", "R-19", "R-30", "10 Ft", "Roll"], priceRange: [10, 120] },
  "Diffusers": { prefixes: ["Aluminum Diffuser", "Plastic Diffuser", "Steel Floor Diffuser", "Ceiling Diffuser", "Sidewall Diffuser"], suffixes: ["4x10", "6x10", "8x8", "10x10", "12x12", "4x12"], priceRange: [8, 60] },
  "Double Shaft Motors": { prefixes: ["OEM Double Shaft Motor", "Replacement Double Shaft", "Belt Drive Motor", "Direct Drive Motor", "Double Shaft Assembly"], suffixes: ["1/4 HP", "1/3 HP", "1/2 HP", "3/4 HP", "1 HP"], priceRange: [60, 350] },
  "Draft Inducer Motors": { prefixes: ["OEM Draft Inducer", "Replacement Inducer Motor", "Furnace Inducer", "Combustion Inducer", "Venter Motor"], suffixes: ["115V 60Hz", "208-230V", "3000 RPM", "3300 RPM", "Universal"], priceRange: [80, 400] },
  "Ducting & Sheet Metal": { prefixes: ["Flex Duct", "Round Pipe", "Sheet Metal", "Spiral Duct", "Duct Board", "Access Door", "Start Collar"], suffixes: ["4 In", "6 In", "8 In", "10 In", "12 In", "R-6", "R-8"], priceRange: [5, 200] },
  "Electrical": { prefixes: ["Circuit Breaker", "Wire", "Conduit", "Fuse", "Outlet Box", "Receptacle", "Extension Cord"], suffixes: ["15A", "20A", "30A", "50A", "100 Ft", "250V", "120V"], priceRange: [3, 80] },
  "Electrical Controls": { prefixes: ["Contactor", "Transformer", "Relay", "Sequencer", "Blower Control", "Pressure Control", "Time Delay"], suffixes: ["24V", "120V", "208-240V", "2-Pole", "3-Pole", "Universal"], priceRange: [10, 150] },
  "Evaporator and Blower Motors": { prefixes: ["ECM Motor", "X-13 Motor", "OEM Blower Motor", "Aftermarket Blower Motor", "Variable Speed Module"], suffixes: ["1/3 HP", "1/2 HP", "3/4 HP", "1 HP", "1/4 HP", "208-230V"], priceRange: [50, 450] },
  "Exhaust & Supply Fans": { prefixes: ["Bathroom Fan", "Roof Ventilator", "Gable Fan", "Duct Fan", "Draft Inducer Fan"], suffixes: ["50 CFM", "80 CFM", "110 CFM", "150 CFM", "1000 CFM"], priceRange: [20, 300] },
  "Fan Blades": { prefixes: ["Condenser Fan Blade", "OEM Fan Blade", "Replacement Blade", "Propeller Blade", "Axial Fan Blade"], suffixes: ["18 In", "20 In", "22 In", "24 In", "26 In", "3-Blade", "4-Blade"], priceRange: [15, 120] },
  "Fasteners": { prefixes: ["Sheet Metal Screw", "Anchor Kit", "Clamp", "Tie Wrap", "Washer", "Specialty Fastener"], suffixes: ["#8x1/2", "#10x3/4", "1/4-20", "3/8 In", "100 Pack", "50 Pack"], priceRange: [3, 40] },
  "Filter - Driers": { prefixes: ["Liquid Line Drier", "Suction Line Drier", "Bi-Flow Drier", "Catch-All Drier", "Replaceable Core Drier"], suffixes: ["3/8 In", "1/2 In", "5/8 In", "7/8 In", "1-1/8 In"], priceRange: [8, 80] },
  "Fittings": { prefixes: ["Copper Fitting", "Brass Fitting", "Flare Fitting", "PVC Fitting", "Malleable Fitting", "Access Fitting"], suffixes: ["1/4 In", "3/8 In", "1/2 In", "5/8 In", "3/4 In", "1 In"], priceRange: [2, 40] },
  "Gas Heat Controls": { prefixes: ["Gas Valve", "Ignitor", "Limit Control", "Pressure Switch", "Gas Regulator", "Pilot Burner"], suffixes: ["24V", "120V", "Universal", "OEM", "Replacement"], priceRange: [15, 200] },
  "Grilles": { prefixes: ["Return Air Grille", "Filter Grille", "Floor Grille", "Aluminum Grille", "Steel Grille"], suffixes: ["10x10", "12x12", "14x14", "16x16", "20x20", "24x24", "16x25"], priceRange: [8, 60] },
  "Hand Tools": { prefixes: ["Wrench", "Pliers", "Screwdriver", "Snips", "Torch", "Crimping Tool", "Fin Comb"], suffixes: ["Set", "6 In", "8 In", "10 In", "Heavy Duty", "Pro Grade"], priceRange: [8, 120] },
  "Heat & Energy Recovery Ventilation": { prefixes: ["HRV Unit", "ERV Unit", "HRV Control", "Core Filter", "Ventilation Control"], suffixes: ["100 CFM", "150 CFM", "200 CFM", "Residential", "Commercial"], priceRange: [50, 800] },
  "Heat Pump Controls": { prefixes: ["Defrost Control", "Reversing Valve", "Outdoor Thermostat", "Heat Pump Relay", "Defrost Timer"], suffixes: ["24V", "208-240V", "Universal", "OEM", "Replacement"], priceRange: [15, 180] },
  "Inspection Tools": { prefixes: ["Inspection Camera", "Inspection Mirror", "Borescope", "Flexible Camera", "LED Mirror"], suffixes: ["9mm", "5.5mm", "3 Ft", "6 Ft", "Wireless"], priceRange: [20, 300] },
  "Line Sets": { prefixes: ["Mini Split Line Set", "Standard Line Set", "Line Set Cover", "Pre-Charged Line Set", "Insulated Line Set"], suffixes: ["15 Ft", "25 Ft", "50 Ft", "1/4-1/2 In", "3/8-3/4 In"], priceRange: [30, 250] },
  "Miscellaneous Components": { prefixes: ["Circuit Board", "Flame Sensor", "Manifold", "Flowcheck Assembly", "Piston Kit"], suffixes: ["Universal", "OEM", "Replacement", "Kit", "Assembly"], priceRange: [10, 200] },
  "Moisture Control & Zoning": { prefixes: ["Dehumidifier", "Humidifier", "Zone Damper", "Zone Control", "Bypass Damper"], suffixes: ["70 Pint", "50 Pint", "Whole House", "6 In", "8 In", "10 In"], priceRange: [30, 600] },
  "Motor Accessories": { prefixes: ["Belly Band", "Motor Mount", "Belt", "Pulley", "Motor Capacitor", "Mounting Bracket"], suffixes: ["3.5 In", "4 In", "4.5 In", "A-Belt", "B-Belt", "Universal"], priceRange: [5, 60] },
  "Mounting Supplies": { prefixes: ["Vibration Isolator", "Strut Channel", "Heat Pump Riser", "Nail Plate", "Notch Plate"], suffixes: ["1/4 In", "3/8 In", "10 Ft", "Universal", "Heavy Duty"], priceRange: [5, 80] },
  "Non-HVAC Items": { prefixes: ["Smart Thermostat", "Smart Plug", "WiFi Switch", "Smart Sensor", "Connected Device"], suffixes: ["120V", "240V", "Z-Wave", "Zigbee", "WiFi"], priceRange: [20, 150] },
  "Oil Heat Controls": { prefixes: ["Oil Burner", "Nozzle", "Oil Filter", "Fuel Pump", "Ignition Transformer"], suffixes: ["0.65 GPH", "0.75 GPH", "0.85 GPH", "1.0 GPH", "Universal"], priceRange: [10, 200] },
  "Other Miscellaneous Installation Supplies": { prefixes: ["Pipe Insulation", "Hose Clamp", "Gasketing", "Threaded Rod", "Vent Cap"], suffixes: ["1/2 In", "3/4 In", "1 In", "10 Ft", "Universal"], priceRange: [3, 60] },
  "Other Specialty Tools": { prefixes: ["Valve Core Tool", "Core Remover", "Valve Core", "Specialty Wrench", "Core Installer"], suffixes: ["Standard", "Heavy Duty", "Kit", "Universal", "Pro"], priceRange: [5, 80] },
  "Pipe": { prefixes: ["Copper Pipe", "PVC Pipe", "Black Pipe", "Aluminum Tubing", "Flexible Gas Line"], suffixes: ["1/2 In x 10 Ft", "3/4 In x 10 Ft", "1 In x 10 Ft", "1/4 In", "3/8 In"], priceRange: [5, 120] },
  "Power Tools": { prefixes: ["Cordless Drill", "Reciprocating Saw", "Impact Driver", "Drill Bit Set", "Saw Blade"], suffixes: ["18V", "20V", "12V", "Kit", "Replacement"], priceRange: [20, 250] },
  "Registers": { prefixes: ["Aluminum Register", "Steel Floor Register", "Sidewall Register", "Ceiling Register", "Adjustable Register"], suffixes: ["4x10", "6x10", "8x8", "10x10", "12x12", "4x12", "6x12"], priceRange: [5, 50] },
  "Refrigerant": { prefixes: ["R-410A Refrigerant", "R-22 Refrigerant", "R-134A Refrigerant", "R-32 Refrigerant", "R-407C Refrigerant"], suffixes: ["25 Lb Jug", "30 Lb Cylinder", "11 Lb", "50 Lb", "10 Lb"], priceRange: [50, 300] },
  "Residential Air Handlers": { prefixes: ["Air Handler", "Hydronic Air Handler", "Fan Coil Unit", "Residential AHU", "Variable Speed AHU"], suffixes: ["1.5 Ton", "2 Ton", "2.5 Ton", "3 Ton", "4 Ton", "5 Ton"], priceRange: [400, 1800] },
  "Residential Coils": { prefixes: ["Cased Coil", "Uncased Coil", "Upflow Coil", "Downflow Coil", "Horizontal Coil"], suffixes: ["1.5 Ton", "2 Ton", "2.5 Ton", "3 Ton", "3.5 Ton", "4 Ton"], priceRange: [200, 900] },
  "Residential Equipment": { prefixes: ["Heat Pump", "Air Conditioner", "Electric Heater", "Package Unit", "Split System"], suffixes: ["1.5 Ton 14 SEER", "2 Ton 16 SEER", "3 Ton 18 SEER", "4 Ton 14 SEER", "5 Ton 16 SEER"], priceRange: [600, 3500] },
  "Residential Equipment Accessories": { prefixes: ["Air Handler Stand", "Condenser Pad", "Slab", "Corrosion Guard", "Weather Cover"], suffixes: ["Small", "Medium", "Large", "Universal", "OEM"], priceRange: [15, 200] },
  "Residential Mini Split Accessories": { prefixes: ["Mini Split Bracket", "Line Set Cover", "Drain Kit", "WiFi Kit", "Mini Split Stand"], suffixes: ["9000 BTU", "12000 BTU", "18000 BTU", "24000 BTU", "36000 BTU"], priceRange: [20, 300] },
  "Safety": { prefixes: ["Dust Mask", "Safety Gloves", "Rope", "Tie Down", "Safety Glasses"], suffixes: ["N95", "Leather", "10 Ft", "25 Ft", "Pack of 10"], priceRange: [3, 50] },
  "Service Tools": { prefixes: ["Charging Hose", "Vacuum Pump", "Refrigerant Scale", "Recovery Unit", "Manifold Gauge"], suffixes: ["60 In", "72 In", "2-Stage", "4 CFM", "6 CFM", "Digital"], priceRange: [20, 600] },
  "Super Accessories": { prefixes: ["Float Switch", "Overflow Switch", "Safety Switch", "Condensate Switch", "Mini Float"], suffixes: ["115V", "230V", "Universal", "Adjustable", "Inline"], priceRange: [8, 60] },
  "Tape": { prefixes: ["Duct Tape", "Foil Tape", "Electrical Tape", "Mastic Tape", "Butyl Tape"], suffixes: ["2 In x 60 Yd", "3 In x 50 Yd", "3/4 In x 66 Ft", "2 In x 100 Ft", "Roll"], priceRange: [4, 40] },
  "Test Tools": { prefixes: ["Multimeter", "Clamp Meter", "CO Detector", "Thermometer", "Manometer", "Anemometer"], suffixes: ["Digital", "Auto-Ranging", "True RMS", "Wireless", "Pro"], priceRange: [20, 400] },
  "Thermostat Guards & Thermostat Accessories": { prefixes: ["Thermostat Guard", "Locking Cover", "Thermostat Base", "Subbase", "Guard Cover"], suffixes: ["Clear", "Metal", "Universal", "Locking", "Standard"], priceRange: [8, 60] },
  "Thermostats": { prefixes: ["WiFi Thermostat", "Programmable Thermostat", "Digital Thermostat", "Communicating Thermostat", "Dehumidistat"], suffixes: ["7-Day", "5-2 Day", "Non-Programmable", "2H/2C", "Heat Pump"], priceRange: [20, 200] },
  "Tool Storage": { prefixes: ["Tool Bag", "Tool Pouch", "Tool Backpack", "Parts Organizer", "Tool Roll"], suffixes: ["Small", "Medium", "Large", "18 In", "22 In"], priceRange: [15, 100] },
  "Ultraviolet": { prefixes: ["UV Light", "UV Bulb", "UV Replacement Lamp", "UV Air Purifier", "UV Coil Sterilizer"], suffixes: ["120V", "24V", "9W", "16W", "36W", "Dual Lamp"], priceRange: [30, 400] },
  "Unit Heaters": { prefixes: ["Electric Unit Heater", "Gas Unit Heater", "Infrared Heater", "Cabinet Heater", "Ceiling Heater"], suffixes: ["5 KW", "10 KW", "15 KW", "20 KW", "240V"], priceRange: [80, 600] },
  "Valves": { prefixes: ["TXV Valve", "Ball Valve", "Service Valve", "Solenoid Valve", "Reversing Valve", "Access Valve"], suffixes: ["1/4 In", "3/8 In", "1/2 In", "5/8 In", "R-410A", "24V"], priceRange: [8, 150] },
  "Ventilators & Accessories": { prefixes: ["Ventilator", "Damper", "Ventilation Grille", "Backdraft Damper", "Motorized Damper"], suffixes: ["6 In", "8 In", "10 In", "12 In", "Motorized", "Spring"], priceRange: [15, 200] },
  "Water Heaters": { prefixes: ["Water Heater Element", "Thermostat", "Anode Rod", "Pressure Relief Valve", "Dip Tube"], suffixes: ["240V", "4500W", "5500W", "3/4 In", "Universal"], priceRange: [8, 150] },
};

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function roundPrice(n) { return Math.round(n * 100) / 100; }
function generatePartNumber(category, index) {
  const prefix = category.replace(/[^A-Z]/gi, '').substring(0, 3).toUpperCase();
  const num = String(index).padStart(4, '0');
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${num}-${suffix}`;
}

function generateProduct(category, index) {
  const tmpl = TEMPLATES[category] || { prefixes: [category + ' Part'], suffixes: ['Standard', 'OEM', 'Universal'], priceRange: [10, 200] };
  const prefix = pick(tmpl.prefixes);
  const suffix = pick(tmpl.suffixes);
  const brand = pick(BRANDS);
  const price = roundPrice(rand(tmpl.priceRange[0], tmpl.priceRange[1]));
  const was = roundPrice(price * rand(1.08, 1.25));
  return {
    category,
    vertical: CATEGORY_VERTICAL[category] || 'HVAC',
    name: `${brand} ${prefix} ${suffix}`,
    part: generatePartNumber(category, index),
    price, was, brand,
    img: null,
    inStock: Math.random() > 0.15,
  };
}

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (uri && !uri.includes('YOUR_USER')) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      console.log('Connected to MongoDB Atlas');
    } else {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mem = await MongoMemoryServer.create();
      await mongoose.connect(mem.getUri());
      console.log('Connected to in-memory MongoDB');
    }

    await Product.deleteMany({});
    console.log('Cleared existing products');

    const TARGET = 10000;
    const perCategory = Math.ceil(TARGET / CATEGORIES.length);
    const products = [];
    CATEGORIES.forEach(cat => {
      for (let i = 0; i < perCategory; i++) products.push(generateProduct(cat, i + 1));
    });
    const final = products.slice(0, TARGET);

    const BATCH = 500;
    for (let i = 0; i < final.length; i += BATCH) {
      await Product.insertMany(final.slice(i, i + BATCH));
      process.stdout.write(`\rInserted ${Math.min(i + BATCH, final.length)} / ${final.length}`);
    }
    console.log(`\n✅ Seeded ${final.length} products across ${CATEGORIES.length} categories`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
