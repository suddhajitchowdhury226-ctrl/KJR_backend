(function () {

  // ─── CONFIG ───────────────────────────────────────────────────────────────
  const LOCAL_API = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/api/chat/message'
    : 'https://kjr-backend.onrender.com/api/chat/message';

  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  let isInit = false;
  let showingCategories = false;

  // ─── PRODUCT DATA ─────────────────────────────────────────────────────────
  // Add img: 'assets/images/products/filename.jpg' for each product
  const CATEGORY_PRODUCTS = {

    // ── 1. Accumulators & Receivers ──────────────────────────────────────────
    "Accumulators & Receivers": [
      { name: "Rheem VPA-589-6SRD Accumulator", part: "VPA-589-6SRD", price: "$109.95", was: "$120.95", img: "assets/images/products/vpa-589-6srd.jpg" },
      { name: "Rheem VPA-5811-7SRD Accumulator", part: "VPA-5811-7SRD", price: "$120.95", was: "$133.05", img: "assets/images/products/vpa-5811-7srd.jpg" },
      { name: "Rheem VA-35-6S Accumulator", part: "VA-35-6S", price: "$179.95", was: "$197.95", img: "assets/images/products/va-35-6s.jpg" },
      { name: "Rheem VA-35-5S Accumulator", part: "VA-35-5S", price: "$96.95", was: "$108.58", img: "assets/images/products/va-35-5s.jpg" },
      { name: "Rheem VA-31-5S Accumulator", part: "VA-31-5S", price: "$97.95", was: "$109.70", img: "assets/images/products/va-31-5s.jpg" },
    ],

    // ── 3. Air Cleaners ──────────────────────────────────────────────────────
    "Air Cleaners": [
      { name: "Merv 8 Replacement Filter", part: "PD540040", price: "$64.95", was: "$75.34", img: null },
      { name: "Merv 8 Replacement Filter For Xhf-e21", part: "PD540042", price: "$69.95", was: "$81.14", img: null },
      { name: "Merv 8 Replacement Filter For Xhf-e24", part: "PD540044", price: "$44.95", was: "$54.39", img: null },
      { name: "Merv 8 Replacement Filter For Xgf-e17", part: "PD540041", price: "$79.95", was: "$89.54", img: null },
      { name: "Merv 8 Replacement Filter For Xgf-e21", part: "PD540043", price: "$83.95", was: "$94.02", img: null },
      { name: "Air Bear - 20X20", part: "84-25050-05", price: "$175.95", was: "$193.55", img: null },
      { name: "Media Air Cleaner - 2000 Cfm", part: "84-25050-01", price: "$153.95", was: "$169.35", img: null },
      { name: "Air Bear 16 X 25 - 1400 Cfm", part: "84-25050-06", price: "$226.95", was: "$249.65", img: null },
      { name: "Right Angle Air Bear", part: "84-25050-03", price: "$294.95", was: "$324.45", img: null },
      { name: "Pro Filter Pleated 21-Inchea", part: "PD540002", price: "$73.95", was: "$85.78", img: null },
      { name: "Competitive Media 16 X 25", part: "613", price: "$84.95", was: "$95.14", img: null },
      { name: "H/w 20X25 Media Filter", part: "FC200E1037/U", price: "$97.95", was: "$109.70", img: null },
      { name: "H/w 25X22 Media Air Cleaner", part: "F100F2051/U", price: "$252.95", was: "$278.25", img: null },
      { name: "Nordyne Cust Repl Flt-inchb-incab", part: "918737A", price: "$76.95", was: "$86.18", img: null },
      { name: "Nordyne Cust Repl Flt-inchc-incab", part: "918759A", price: "$136.95", was: "$150.65", img: null },
      { name: "April Media For 2400", part: "401", price: "$78.95", was: "$88.42", img: null },
      { name: "410 Air Cleaner Merv 10", part: "410", price: "$53.95", was: "$62.58", img: null },
      { name: "20X25 Media Filter Merv 13", part: "813", price: "$106.95", was: "$117.65", img: null },
      { name: "Air Oasis 9-Inch Rplcmnt Cell", part: "NINDAHPC09", price: "$352.95", was: "$388.25", img: null },
      { name: "310 Media For 3310 & 4300", part: "310", price: "$95.95", was: "$107.46", img: null },
      { name: "913 Media For 1910-Merv 13", part: "913", price: "$90.95", was: "$101.86", img: null },
      { name: "20X20x3 Merv13 Media Filter", part: "FC313R2020/U", price: "$121.95", was: "$134.15", img: null },
      { name: "Tri Purity Rheem Cabinet", part: "TUV-PRT-ER-17.5", price: "$1,505.95", was: "$1,656.55", img: null },
      { name: "Nu Iwave-r", part: "4900-20", price: "$635.95", was: "$699.55", img: null },
      { name: "Sunbelt Ionizer", part: "D1.2-2", price: "$770.95", was: "$848.05", img: null },
      { name: "Sunbelt C10 Plasma Generator", part: "C-10.0", price: "$2,859.95", was: "$3,145.95", img: null },
      { name: "Water Panel For Models 350", part: "35", price: "$20.95", was: "$25.98", img: null },
      { name: "24V Current Sensing Relay", part: "50", price: "$74.95", was: "$86.94", img: null },
      { name: "Digital Dehumd Control", part: "76", price: "$259.95", was: "$285.95", img: null },
      { name: "Low Conductivity Canister", part: "80LC", price: "$121.95", was: "$134.15", img: null },
      { name: "Air Oasis Air Sanitizor", part: "NIND9-24", price: "$788.95", was: "$867.85", img: null },
      { name: "14-Inch Dust Free Carbon Air Purifier", part: "13052", price: "$736.95", was: "$810.65", img: null },
    ],

    // ── 2. Adhesives ─────────────────────────────────────────────────────────
    "Adhesives": [
      { name: "Versa-grip 102-25", part: "VG10225", price: "$8.95", was: "$11.55", img: null },
      { name: "Duct Sealant #22 Wht 1 Gal", part: "AIRSEAL22-1", price: "$30.95", was: "$37.45", img: null },
      { name: "Duct Sealant #33 1 Gal", part: "AIRSEAL33-1", price: "$27.95", was: "$33.82", img: null },
      { name: "Duct Sealant Wht 1 Gal", part: "CADS1", price: "$20.95", was: "$25.98", img: null },
      { name: "Duct Sealant Gray 1 Gal", part: "CADS1-GRAY", price: "$19.95", was: "$24.74", img: null },
      { name: "Duct Sealant Wht 2 Gal", part: "CADS2", price: "$38.95", was: "$47.13", img: null },
      { name: "Duct Sealant #33 Wht Tube", part: "AIRSEAL33-TUBE", price: "$8.95", was: "$11.55", img: null },
      { name: "Duct Sealant #33 Wht 2 Gal", part: "AIRSEAL33-2", price: "$63.95", was: "$74.18", img: null },
      { name: "Duct Sealant Wht 5 Gal", part: "CADS5", price: "$105.95", was: "$116.55", img: null },
      { name: "Duct Sealant #11 Gray 2 Gal", part: "AIRSEAL11-2GRAY", price: "$75.95", was: "$85.06", img: null },
      { name: "Duct Sealant #11 Gray 1 Gal", part: "AIRSEAL11-1GRAY", price: "$41.95", was: "$50.76", img: null },
      { name: "Duct Sealant #22 Gray Tube", part: "AIRSEAL11-TUBEGRAY", price: "$7.95", was: "$10.26", img: null },
      { name: "Duct Sealant #22 Wht 2 Gal", part: "AIRSEAL22-2", price: "$48.95", was: "$59.23", img: null },
      { name: "Duct Sealant #33 Gray 1 Gal", part: "AIRSEAL33-1GRAY", price: "$27.95", was: "$33.82", img: null },
      { name: "11Oz Ccwi 181 Dct Seal Gray", part: "CCWI-181T(G)", price: "$5.95", was: "$7.91", img: null },
      { name: "1 Gal Wtr Base Seal Ds321", part: "DS-321-1G", price: "$27.95", was: "$33.82", img: null },
      { name: "1Gal Duct-seal Ul1 Gray", part: "CCWI-181-GRAY", price: "$25.95", was: "$31.40", img: null },
      { name: "1 Gal Duct Seal Ul181 Wht", part: "CCWI-181-WHITE", price: "$24.95", was: "$30.94", img: null },
      { name: "1 Gal Hgh Perform Duct Seal", part: "ASZERO-1(G)", price: "$95.95", was: "$107.46", img: null },
      { name: "Insulation Adhesive #40", part: "308602A", price: "$653.95", was: "$719.35", img: null },
      { name: "Air Lag Water Based Adhes", part: "AL-1(W)", price: "$31.95", was: "$38.66", img: null },
      { name: "Hc Seal Tack Wht 1 Gal", part: "SEALTACK", price: "$57.95", was: "$67.22", img: null },
      { name: "2 Gal Duct Seal Ul181 White", part: "CCWI-181-2", price: "$91.95", was: "$102.98", img: null },
      { name: "Div/wag Qt Triger Spryer", part: "BS32", price: "$10.95", was: "$14.13", img: null },
      { name: "Sure Stick Spray Adh 12 Oz", part: "31520", price: "$19.95", was: "$24.74", img: null },
      { name: "Fas Spray Glue Adh 17 Oz", part: "1000S-ADH", price: "$14.95", was: "$19.29", img: null },
      { name: "Aerosol Spray Adhesive Can", part: "AEROTACK", price: "$8.95", was: "$11.55", img: null },
      { name: "Nu-calgon Spray-n-b", part: "4369-85", price: "$12.95", was: "$16.71", img: null },
      { name: "Premium Spray Adhesive 19.6", part: "POLY44SA", price: "$12.95", was: "$16.71", img: null },
    ],

    // ── 4. Air Filters ───────────────────────────────────────────────────────
    "Air Filters": [
      // Air Cleaner Filters
      { name: "Trion Air Bear Merv 8 Media Filter", part: "252990-902", price: "$30.95", was: "$37.45", img: null },
      { name: "H/w 16X25 Media Air Filter", part: "FC100A1029/U", price: "$52.95", was: "$61.42", img: null },
      { name: "H/w 20X25 Media Air Filter", part: "FC100A1037/U", price: "$54.95", was: "$63.74", img: null },
      { name: "H/w 16X20 Media Air Filter", part: "FC100A1003/U", price: "$54.95", was: "$63.74", img: null },
      { name: "H/w 20X20 Media Air Filter", part: "FC100A1011/U", price: "$52.95", was: "$61.42", img: null },
      { name: "As Filter 5-Inch Media 21.5", part: "FLR06072", price: "$63.95", was: "$74.18", img: null },
      { name: "As Filter 5-Inch Media 23.5", part: "FLR06073", price: "$93.95", was: "$105.22", img: null },
      { name: "As Filter 5-Inch Media 26-Inch", part: "FLR06074", price: "$78.95", was: "$88.42", img: null },
      { name: "H/w 20X25 Popup Ma Filter", part: "POPUP2025/U", price: "$78.95", was: "$88.42", img: null },
      { name: "H/w Popup Media Fltr 16X25", part: "POPUP1625/U", price: "$74.95", was: "$86.94", img: null },
      { name: "As Fltr 5-Inch Media Filter", part: "FLR06069", price: "$59.95", was: "$69.54", img: null },
      { name: "H/w Media Replacemnt Fltr", part: "POPUP2200/U", price: "$84.95", was: "$95.14", img: null },
      { name: "Merv 11 20X25x6 Filter", part: "SGP20256M11", price: "$82.95", was: "$92.90", img: null },
      { name: "110 Media For 1110-Merv 11", part: "110", price: "$95.95", was: "$107.46", img: null },
      { name: "Gf 20X25x5 Air Bear Rpl Flt", part: "ABP20255M13", price: "$90.95", was: "$101.86", img: null },
      // Disposable Fiberglass Panel Filters
      { name: "10X10x1 Fbg Dbl Strut", part: "GDS10101", price: "$7.95", was: "$10.26", img: null },
      { name: "10X20x1 Fbg Dbl Strt T/a", part: "GDS10201", price: "$7.95", was: "$10.26", img: null },
      { name: "10X24x1 Fbg Dbl Strut T/a", part: "GDS10241", price: "$7.95", was: "$10.26", img: null },
      { name: "12X20x1 Fbg Dbl Strut T/a", part: "GDS12201", price: "$7.95", was: "$10.26", img: null },
      { name: "12X30x1 Fbg Dbl Strut T/a", part: "GDS12301", price: "$8.95", was: "$11.55", img: null },
      { name: "14X24x1 Fbg Dbl Strut T/a", part: "GDS14241", price: "$7.95", was: "$10.26", img: null },
      { name: "14X30x1 Fbg Dbl Strut T/a", part: "GDS14301", price: "$7.95", was: "$10.26", img: null },
      { name: "15X20x1 Fbg Dbl Strut", part: "GDS15201", price: "$8.95", was: "$11.55", img: null },
      { name: "15X30x1 Fbg Dbl Strt Gds", part: "GDS15301", price: "$6.95", was: "$9.24", img: null },
      { name: "16X16x1 Fbg Dbl Strut Gd", part: "GDS16161", price: "$7.95", was: "$10.26", img: null },
      { name: "16X24x1 Fbg Dbl Strut Gds", part: "GDS16241", price: "$7.95", was: "$10.26", img: null },
      { name: "16X30x1 Fbg Dbl Strut", part: "GDS16301", price: "$8.95", was: "$11.55", img: null },
      { name: "18X18x1 Fbg Dbl Strut Gds", part: "GDS18181", price: "$8.95", was: "$11.55", img: null },
      { name: "18X20x1 Fbg Dbl Strut Gds", part: "GDS18201", price: "$8.95", was: "$11.55", img: null },
      { name: "18X24x1 Fbg Dbl Strut Gds", part: "GDS18241", price: "$8.95", was: "$11.55", img: null },
      { name: "18X25x1 Fbg Dbl Strut Gds", part: "GDS18251", price: "$8.95", was: "$11.55", img: null },
      { name: "18X30x1 Fbg Dbl Strut Gds", part: "GDS18301", price: "$11.95", was: "$15.42", img: null },
      { name: "20X24x1 Fbg Dbl Strut Gds", part: "GDS20241", price: "$7.95", was: "$10.26", img: null },
      { name: "12X16x1 Fbg Dbl Strut Gds", part: "GDS12161", price: "$8.95", was: "$11.55", img: null },
      { name: "24X24x1 Fbg Dbl Strut T/a", part: "GDS24241", price: "$8.95", was: "$11.55", img: null },
      { name: "24X30x1 Fbg Dbl Strut T/a", part: "GDS24301", price: "$7.95", was: "$10.26", img: null },
      { name: "25X25x1 Fbg Dbl Strut T/a", part: "GDS25251", price: "$8.95", was: "$11.55", img: null },
      { name: "30X30x1 Fbg Dbl Sz Ta Fl", part: "GTASP30301", price: "$26.95", was: "$32.61", img: null },
      { name: "15X20x2 Fbg Dbl Strut T/a", part: "GDS15202", price: "$6.95", was: "$9.24", img: null },
      { name: "16X24x2 Fbg Dbl Strut Gds", part: "GDS16242", price: "$9.95", was: "$12.84", img: null },
      { name: "18X18x2 Fbg T/a Filter Gta", part: "GTASP18182", price: "$14.95", was: "$19.29", img: null },
      { name: "18X24x2 Fbg Dbl Strut Gd", part: "GDS18242", price: "$7.95", was: "$10.26", img: null },
      { name: "20X24x2 Fbg Dbl Strt Gds", part: "GDS20242", price: "$7.95", was: "$10.26", img: null },
      { name: "20X25x2 Fbg Dbl Strut T/a", part: "GDS20252", price: "$7.95", was: "$10.26", img: null },
      { name: "16X25x4 Zl Pleat T/a Filter", part: "ZLP16254", price: "$15.95", was: "$19.78", img: null },
      { name: "24X24x4 Zl Pleat T/a Filter", part: "ZLP24244", price: "$17.95", was: "$22.26", img: null },
      { name: "20X25x4 Zl Pleated Filter", part: "ZLP20254", price: "$21.95", was: "$27.22", img: null },
      { name: "20X20x4 Zl Pleat 40% Eff", part: "ZLP20204", price: "$17.95", was: "$22.26", img: null },
      { name: "16X20x4 Zl Pleatd T/a", part: "ZLP16204", price: "$16.95", was: "$21.02", img: null },
      { name: "12X12x1 Poly Throwaway", part: "PTA12121", price: "$5.95", was: "$7.91", img: null },
      { name: "14X24x1 Poly Throwaway", part: "PTA14241", price: "$5.95", was: "$7.91", img: null },
      { name: "16X30x2 Poly Throwaway", part: "PTASP16302", price: "$11.95", was: "$15.42", img: null },
      { name: "20X22x1 Fbg T/a Fltr Gta", part: "GTASP20221", price: "$14.95", was: "$19.29", img: null },
      { name: "12X18x1 Fbg Dbl Strut T/a", part: "GDS12181", price: "$7.95", was: "$10.26", img: null },
      { name: "12X12x1 Fbg Dbl Strut T/a", part: "GDS12121", price: "$7.95", was: "$10.26", img: null },
      { name: "12X24x1 Fbg Dbl Strut T/a", part: "GDS12241", price: "$7.95", was: "$10.26", img: null },
      { name: "12X36x1 Fbg Dbl Strut T/a", part: "GDS12361", price: "$14.95", was: "$19.29", img: null },
      { name: "14X14x1 Fbg Dbl Strut Ta", part: "GDS14141", price: "$7.95", was: "$10.26", img: null },
      { name: "14X20x1 Fbg Dbl Strut T/a", part: "GDS14201", price: "$7.95", was: "$10.26", img: null },
      { name: "14X25x1 Fbg Dbl Strut T/a", part: "GDS14251", price: "$7.95", was: "$10.26", img: null },
      { name: "16X20x1 Fbg Dbl Strut T/a", part: "GDS16201", price: "$7.95", was: "$10.26", img: null },
      { name: "16X25x1 Fbg Dbl Strut Ta", part: "GDS16251", price: "$7.95", was: "$10.26", img: null },
      { name: "20X20x1 Fbg Dbl Strut T/a", part: "GDS20201", price: "$7.95", was: "$10.26", img: null },
      { name: "20X25x1 Fbg Dbl Strut T/a", part: "GDS20251", price: "$7.95", was: "$10.26", img: null },
      { name: "20X30x1 Fbg Dbl Strut T/a", part: "GDS20301", price: "$8.95", was: "$11.55", img: null },
      { name: "16X20x2 Fbg Dbl Strut T/a", part: "GDS16202", price: "$8.95", was: "$11.55", img: null },
      { name: "16X25x2 Fbg Dbl Strut T/a", part: "GDS16252", price: "$8.95", was: "$11.55", img: null },
      { name: "20X20x2 Fbg Dbl Strut T/a", part: "GDS20202", price: "$6.95", was: "$9.24", img: null },
      { name: "22X22x1 Fg Disp Fi", part: "GDS22221", price: "$8.95", was: "$11.55", img: null },
      { name: "2-Inch Gds Fg Disp 24X24 Flt", part: "GDS24242", price: "$10.95", was: "$14.13", img: null },
      { name: "20X30x2 Fg Disp Fi", part: "GTASP20302", price: "$19.95", was: "$24.74", img: null },
      { name: "30X36x1 Disposable Air Filt", part: "GTA30361", price: "$20.95", was: "$25.98", img: null },
      { name: "19X22x1 Poly Filter", part: "PTASP19221", price: "$14.95", was: "$19.29", img: null },
      { name: "14X18x1 Fbg Dbl Strut Ta", part: "GDS14181", price: "$7.95", was: "$10.26", img: null },
      { name: "16X16x2 Disposable Filter", part: "GDS16162", price: "$8.95", was: "$11.55", img: null },
      { name: "20X22x1 Fiberglass Flt", part: "GDS20221", price: "$9.95", was: "$12.84", img: null },
      { name: "17.5X21x1 Poly T/a", part: "GTASP17H211", price: "$11.95", was: "$15.42", img: null },
      { name: "16 3/8X21 1/2 Fltr Dbl S", part: "GDS1638X2112", price: "$11.95", was: "$15.42", img: null },
      { name: "20X36x1 Fbg Dbl Strut Ta", part: "GDS20361", price: "$8.95", was: "$11.55", img: null },
      { name: "16X16x1 Poly Throwaway Filt", part: "PTA16161", price: "$7.95", was: "$10.26", img: null },
      { name: "Glassfloss 12-5/8/20X1/2", part: "GTASP12K200H", price: "$10.95", was: "$14.13", img: null },
      // Disposable Synthetic (Poly) Panel Filters
      { name: "16X20x2 Poly Throwaway", part: "PTA16202", price: "$6.95", was: "$9.24", img: null },
      { name: "16X24x2 Poly Throwaway", part: "PTA16242", price: "$6.95", was: "$9.24", img: null },
      { name: "18X18x2 Poly Throwaway", part: "PTASP18182", price: "$17.95", was: "$22.26", img: null },
      { name: "12X25x1 Pleated Filter Nom", part: "ZLPSP12251", price: "$9.95", was: "$12.84", img: null },
      { name: "20X35x2 Filter", part: "PTASP20352", price: "$21.95", was: "$27.22", img: null },
      // Electrostatic Filters (sample)
      { name: "Electrostatic Filter 16X20x1", part: "ESF-16201", price: "$24.95", was: "$29.99", img: null },
      { name: "Electrostatic Filter 20X25x1", part: "ESF-20251", price: "$27.95", was: "$33.50", img: null },
      { name: "Electrostatic Filter 16X25x1", part: "ESF-16251", price: "$25.95", was: "$31.14", img: null },
      { name: "Electrostatic Filter 20X20x1", part: "ESF-20201", price: "$23.95", was: "$28.74", img: null },
      { name: "Electrostatic Filter 14X20x1", part: "ESF-14201", price: "$22.95", was: "$27.54", img: null },
      // Pleated Filters - Standard (sample)
      { name: "Pleated Filter 16X20x1 Merv 8", part: "PLT-16201-M8", price: "$9.95", was: "$12.84", img: null },
      { name: "Pleated Filter 20X25x1 Merv 8", part: "PLT-20251-M8", price: "$10.95", was: "$14.13", img: null },
      { name: "Pleated Filter 16X25x1 Merv 11", part: "PLT-16251-M11", price: "$13.95", was: "$17.55", img: null },
      { name: "Pleated Filter 20X20x1 Merv 11", part: "PLT-20201-M11", price: "$12.95", was: "$16.71", img: null },
      { name: "Pleated Filter 20X25x2 Merv 13", part: "PLT-20252-M13", price: "$18.95", was: "$23.69", img: null },
      // Specialty Filters (sample)
      { name: "Carbon Odor Filter 20X25x1", part: "SPF-CARB-2025", price: "$19.95", was: "$24.74", img: null },
      { name: "HEPA Filter 16X25x4", part: "SPF-HEPA-1625", price: "$49.95", was: "$59.94", img: null },
      { name: "Antimicrobial Filter 20X20x1", part: "SPF-ANTI-2020", price: "$15.95", was: "$19.78", img: null },
      { name: "Washable Filter 16X20x1", part: "SPF-WASH-1620", price: "$29.95", was: "$35.94", img: null },
      { name: "UV Filter Pad 10X10", part: "SPF-UV-1010", price: "$22.95", was: "$27.54", img: null },
    ],

    // ── 5. Airflow Accessories ────────────────────────────────────────────────
    "Airflow Accessories": [
      { name: "Sw Blank Trans 2 16X36", part: "MBT1R6", price: "$132.95", was: "$146.25", img: null },
      { name: "Sw 16X20 No Flange-8-inchdp", part: "1701620R8", price: "$108.95", was: "$119.85", img: null },
      { name: "Sw Return Box 14X25x12", part: "RABR8142512", price: "$109.95", was: "$120.95", img: null },
      { name: "Sw Return Box 16X25x12", part: "RABR8162512", price: "$179.95", was: "$197.95", img: null },
      { name: "R8 822Wx24dx20", part: "USBR822WX24DX20", price: "$98.95", was: "$110.82", img: null },
      { name: "Mtl Zinc 30X36x21 R6 Plenum", part: "P302136-R6-1-0BX", price: "$185.95", was: "$204.55", img: null },
      { name: "Mtl Zinc 21X36x29 R6 Plenum", part: "P212936-R6-1-0BX", price: "$232.95", was: "$256.25", img: null },
      { name: "Mtl Zinc 20X25x36 R6 Plenum", part: "P202536-R6-1-0BX", price: "$105.95", was: "$116.55", img: null },
      { name: "Mtl Zinc 14X36x20 R6 Plenum", part: "P142036-R6-1-0BX", price: "$92.95", was: "$104.10", img: null },
      { name: "Mtl Zinc 16X36x20 R6 Plenum", part: "P162036-R6-1-0BX", price: "$69.95", was: "$81.14", img: null },
      { name: "Mtl Zinc 11X36x16 R6 Plenum", part: "P111636-R6-1-0BX", price: "$61.95", was: "$71.86", img: null },
      { name: "Mtl Zinc 16X36x25 R6 Plenum", part: "P162536-R6-1-0BX", price: "$69.95", was: "$81.14", img: null },
      { name: "Mtl Zinc 20X48x20 R6 Plenum", part: "P202048-R6-1-0BX", price: "$149.95", was: "$164.95", img: null },
      { name: "Mtl Zinc 11X36x20 R6 Plenum", part: "P112036-R6-1-0BX", price: "$67.95", was: "$78.82", img: null },
      { name: "Mtl Zinc 20X36x20 R6 Plenum", part: "P202036-R6-1-0BX", price: "$77.95", was: "$87.30", img: null },
      { name: "Mtl Zinc 36X36x21 R6 Plenum", part: "P362136-R6-1-0BX", price: "$246.95", was: "$271.65", img: null },
      { name: "Gpe 13.5 X 15.5 X 36 Plenum", part: "2801.134154360.26", price: "$88.95", was: "$99.62", img: null },
      { name: "12 X 12 X 23 Plenum Cap/f", part: "2801.120120230.28", price: "$108.95", was: "$119.85", img: null },
      { name: "20 X 20.25 X 24 Plenum", part: "2801.200202240.26", price: "$65.95", was: "$76.50", img: null },
      { name: "15 X 16 X 58 Plenum Cap/f", part: "2801.150160580.26", price: "$168.95", was: "$185.85", img: null },
      { name: "16.25 X 16.25 X 48 Plenum", part: "2801.162162480.26", price: "$137.95", was: "$151.75", img: null },
      { name: "15.25 X 24.75 X 24 Plenum (R6)", part: "2801.152246240.26", price: "$79.95", was: "$89.54", img: null },
      { name: "16.75 X 20.25 X 24 Plenum", part: "2801.166202240.26", price: "$75.95", was: "$85.06", img: null },
      { name: "16 X 21 X 36 Plenum Cap/f", part: "2801.160210360.28", price: "$127.95", was: "$140.75", img: null },
      { name: "20.25 X 23.75 X 36 Plenum (R8)", part: "2801.202236360.28", price: "$143.95", was: "$158.35", img: null },
      { name: "13 X 20 X 24 Plenum Cap/f", part: "2801.130200240.28", price: "$98.95", was: "$110.82", img: null },
      { name: "11.75 X 24.75 X 24 Plenum", part: "2801.116246240.26", price: "$84.95", was: "$95.14", img: null },
      { name: "20 X 20.25 X 36 Plenum (R8)", part: "2801.200202360.28", price: "$135.95", was: "$149.55", img: null },
      { name: "15 X 20 X 58 Plenum Cap/f", part: "2801.150200580.26", price: "$180.95", was: "$199.05", img: null },
      { name: "18.75 X 24.75 X 24 Plenum (R8)", part: "2801.186246240.28", price: "$114.95", was: "$126.45", img: null },
      { name: "20 X 20.25 X 36 Plenum (R6)", part: "2801.200202360.26", price: "$82.95", was: "$92.90", img: null },
      { name: "15.25 X 24.75 X 24 Plenum (R8)", part: "2801.152246240.28", price: "$108.95", was: "$119.85", img: null },
      { name: "20.25 X 23.75 X 36 Plenum (R6)", part: "2801.202236360.26", price: "$143.95", was: "$158.35", img: null },
      { name: "10.50 X 16.25 X 24 Plenum", part: "2801.104162240.26", price: "$88.95", was: "$99.62", img: null },
      { name: "22.25 X 24.75 X 24 Plenum", part: "2801.222246240.26", price: "$102.95", was: "$113.25", img: null },
      { name: "17.5 X 24 X 36 Plenum Cap", part: "2801.174240360.26", price: "$137.95", was: "$151.75", img: null },
      { name: "13.25 X 20.25 X 30 Plenum", part: "2801.132202300.28", price: "$108.95", was: "$119.85", img: null },
      { name: "16.75 X 20.25 X 36 Plenum (R8)", part: "2801.166202360.28", price: "$111.95", was: "$123.15", img: null },
      { name: "20.25 X 20.625 X 36 Plenum", part: "2801.202205360.26", price: "$113.95", was: "$125.35", img: null },
      { name: "13.25 X 20.25 X 24 Plenum", part: "2801.132202240.26", price: "$82.95", was: "$92.90", img: null },
      { name: "13.25 X 20.25 X 36 Plenum", part: "2801.132202360.26", price: "$98.95", was: "$110.82", img: null },
      { name: "15.875 X 20.625 X 36 Plenum (R8)", part: "2801.157205360.28", price: "$125.95", was: "$138.55", img: null },
      { name: "18.75 X 24.75 X 24 Plenum (R6)", part: "2801.186246240.26", price: "$86.95", was: "$97.38", img: null },
      { name: "16.75 X 20.25 X 36 Plenum (R6)", part: "2801.166202360.26", price: "$92.95", was: "$104.10", img: null },
      { name: "10.5 X 19.75 X 24 Plenum", part: "2801.104196240.26", price: "$92.95", was: "$104.10", img: null },
      { name: "20 X 24 X 36 Plenum Cap/f", part: "2801.200240360.26", price: "$143.95", was: "$158.35", img: null },
      { name: "20.25 X 23.75 X 24 Plenum", part: "2801.202236240.26", price: "$84.95", was: "$95.14", img: null },
      { name: "Gpe 30-Inch Plenum Int Bubbleins", part: "2870.60AR.26", price: "$205.95", was: "$226.55", img: null },
      { name: "Gpe 9.5 X 15.5 X 36 Plenum", part: "2801.094154360.26", price: "$64.95", was: "$75.34", img: null },
      { name: "20 X 20 X 24 Plenum Cap/f", part: "2801.200200240.26", price: "$79.95", was: "$89.54", img: null },
      { name: "16 X 20 X 30 Plenum Cap/f", part: "2801.160200300.28", price: "$82.95", was: "$92.90", img: null },
      { name: "15.875 X 16.625 X 36 Plenum", part: "2801.157165360.28", price: "$117.95", was: "$129.75", img: null },
    ],

  };

  // Expose product data globally for the products.html page
  // Only set if not already provided by products-data.js
  if (!window.KJR_CATEGORY_PRODUCTS) {
    window.KJR_CATEGORY_PRODUCTS = CATEGORY_PRODUCTS;
  }

  const PRODUCT_CATEGORIES = [
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

  // ─── ALL BRANDS A–Z ───────────────────────────────────────────────────────
  const ALL_BRANDS = {
    "A": ["AccuTemp", "Acer", "Acros", "Affresh", "Alto Shaam", "Amana", "American Range", "ACP", "Anets", "Antunes", "APM", "Ariens", "Astra", "ASUS", "Avanti", "Axis"],
    "B": ["Bauknecht", "Baxter", "Beko", "Barkli", "Bertazzoni", "Beverage-Air", "Bizerba", "BKI", "Black+Decker", "Blomberg", "Bosch", "Bostitch", "Bowers & Wilkins", "Brastemp", "Braun", "Breville", "Briggs & Stratton"],
    "C": ["Campbell Hausfeld", "Canarm", "Carrier", "CB", "Chicago Pneumatic", "Cleveland", "Crown", "Compaq", "Consul", "Continental", "Contherm", "Cornelius", "Cub Cadet", "Curtis"],
    "D": ["Dacor", "Danby", "Deifield", "Dell", "DeLonghi", "Delta", "Denon", "DeWalt", "Dormont", "Dremel", "Dayton"],
    "E": ["Edlund", "Electrolux", "Elica", "Emerson", "Echo", "Epson", "Eureka", "Evapure"],
    "F": ["Federal", "Fisher & Paykel", "Follett", "Fri-Jado", "Frigidaire", "FTL"],
    "G": ["Gaggenau", "Garland", "Gamko", "GE", "Genie", "Gibson", "Giles", "Gillette", "Globe", "Goodman", "Grindmaster"],
    "H": ["Haier", "Hatco", "Henry Penny", "Hestan", "Hisense", "Hobart", "Homelite", "Honda", "Hoshizaki", "Hotpoint", "HP", "Huntington", "Husqvarna", "Hussmann", "Hydra-Cool"],
    "I": ["Ice-O-Matic", "IKEA", "Indesit", "Ingersoll Rand", "Inovate"],
    "J": ["Jade", "Jennair", "Jet", "JIBT"],
    "K": ["Kairak", "Karcher", "Kason", "Kawasaki", "Kelon", "Kelvinator", "Kenmore", "KitchenAid", "Kohler", "Kolpak", "Konica Minolta", "Kool-It", "Krowne"],
    "L": ["Lancer", "Lasko", "Lexmark", "Lenovo", "LG", "Liebherr", "La Cornue"],
    "M": ["Magic Chef", "Magnavox", "Makita", "Manitowoc", "Marantz", "Marquardt", "Master-Bilt", "Maxell", "Maytag", "Menumaster", "Merco", "Mercyshef", "Metabo", "Metro", "Midgley", "Midea", "Miele", "Miller", "Milwaukee", "Mitsubishi", "Mueller", "Multiplex", "Murray"],
    "N": ["Napoleon", "Nieco", "Norake", "Nu-Vu"],
    "O": ["Olympus", "Onkyo", "Opal", "Oral-B"],
    "P": ["P&F", "Panasonic", "Perlick", "Philco", "Philips", "Pitco", "Porter", "Poulan PRO", "Power Sonic", "Powermatic", "Paslode"],
    "R": ["Rational", "Rhea", "Ridgid", "Robot Coupe", "Ryobi"],
    "S": ["Saeco", "Salvajor", "Samsung", "Sanyo", "Schaerer", "Scotsman", "Senco", "Server", "Sharp", "Sirerra", "Shindaiwa", "Shuttle", "Silver King", "Simonelli", "Skil", "Smeg", "Snapper", "Sony", "Speedking", "Spaceman", "Speed Queen", "Stex", "Stoelting", "Structural Concepts"],
    "T": ["Tappan", "TCL", "Thermador", "Toro", "Thunlsen", "Troy-Bilt", "Turbo Air", "TurboChef"],
    "U": ["Ultrafryer", "Unic"],
    "V": ["Victory", "Viking", "Vitamix", "Vivitek", "Vizio", "Vollrath", "Vulcan", "Vulkan"],
    "W": ["Weber", "Whirlpool", "White Westinghouse", "Wilton", "Winco", "Winston", "Wood Stone"],
    "Y": ["Yamaha", "Yard-Man", "Yummly"],
    "Z": []
  };

  // Grey placeholder when no image available
  const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f0f0f0' rx='6'/%3E%3Ctext x='40' y='44' font-family='Arial' font-size='10' fill='%23bbb' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E`;

  function getDefaultProducts(cat) {
    return [
      { name: `${cat} - Item A`, part: "GEN-001", price: "$19.99", was: null, img: null },
      { name: `${cat} - Item B`, part: "GEN-002", price: "$34.50", was: null, img: null },
      { name: `${cat} - Item C`, part: "GEN-003", price: "$27.00", was: null, img: null },
      { name: `${cat} - Item D`, part: "GEN-004", price: "$45.99", was: null, img: null },
      { name: `${cat} - Item E`, part: "GEN-005", price: "$12.75", was: null, img: null },
    ];
  }

  // ─── STYLES ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.innerHTML = `
    #bunji-widget {
      position: fixed; bottom: 20px; right: 20px; z-index: 10000;
      font-family: 'Inter', Arial, sans-serif;
    }
    #bunji-toggle {
      width: 60px; height: 60px; border-radius: 50%;
      background: var(--primary, #cc0000); color: white;
      border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      cursor: pointer; font-size: 24px;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.3s ease;
    }
    #bunji-toggle:hover { transform: scale(1.1); }

    #bunji-chat-window {
      position: absolute; bottom: 80px; right: 0;
      width: 370px; height: 560px;
      background: #ffffff; border-radius: 12px;
      box-shadow: 0 5px 25px rgba(0,0,0,0.2);
      display: none; flex-direction: column; overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    #bunji-chat-window.open { display: flex; }

    .bunji-header {
      background: var(--primary, #cc0000); color: white;
      padding: 15px; display: flex;
      justify-content: space-between; align-items: center;
      font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .bunji-header-close {
      background: transparent; border: none;
      color: white; font-size: 20px; cursor: pointer;
    }

    .bunji-messages {
      flex: 1; padding: 12px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 10px;
      background: #f8fafc;
    }

    .bunji-bubble {
      max-width: 88%; padding: 10px 14px; border-radius: 8px;
      font-size: 13.5px; line-height: 1.45; white-space: pre-wrap;
      word-break: break-word;
    }
    .bunji-bubble.bunji {
      background: #e2e8f0; color: #1e293b;
      align-self: flex-start; border-bottom-left-radius: 0;
    }
    .bunji-bubble.user {
      background: var(--primary, #cc0000); color: white;
      align-self: flex-end; border-bottom-right-radius: 0;
    }

    /* ── Category grid ── */
    .bunji-cat-wrapper {
      align-self: flex-start; width: 100%;
      background: #e2e8f0; border-radius: 8px;
      border-bottom-left-radius: 0; padding: 12px;
      box-sizing: border-box;
    }
    .bunji-cat-title {
      font-weight: 700; color: #cc0000;
      font-size: 13px; margin-bottom: 8px;
    }
    .bunji-cat-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 5px;
    }
    .bunji-cat-btn {
      background: #fff; border: 1.5px solid #cc0000; color: #cc0000;
      border-radius: 6px; padding: 6px 7px; font-size: 11px;
      cursor: pointer; text-align: left; font-weight: 600;
      transition: background 0.15s, color 0.15s; line-height: 1.3;
    }
    .bunji-cat-btn:hover { background: #cc0000; color: #fff; }

    /* ── Product cards ── */
    .bunji-prod-wrapper {
      align-self: flex-start; width: 100%;
      background: #e2e8f0; border-radius: 8px;
      border-bottom-left-radius: 0; padding: 12px;
      box-sizing: border-box;
    }
    .bunji-prod-title {
      font-weight: 700; color: #cc0000;
      font-size: 13px; margin-bottom: 3px;
    }
    .bunji-prod-sub {
      font-size: 11px; color: #64748b; margin-bottom: 10px;
    }
    .bunji-prod-list { display: flex; flex-direction: column; gap: 8px; }

    .bunji-prod-card {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 8px; padding: 9px;
      display: flex; gap: 9px; align-items: flex-start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .bunji-prod-img {
      width: 68px; height: 68px; border-radius: 6px;
      object-fit: contain; background: #f5f5f5;
      border: 1px solid #eee; flex-shrink: 0;
    }
    .bunji-prod-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .bunji-prod-name { font-weight: 700; font-size: 12px; color: #1e293b; line-height: 1.3; }
    .bunji-prod-part { font-size: 10.5px; color: #94a3b8; }
    .bunji-prod-pricing { display: flex; align-items: baseline; gap: 5px; margin-top: 2px; }
    .bunji-prod-price { font-weight: 700; color: #cc0000; font-size: 14px; }
    .bunji-prod-was { font-size: 10.5px; color: #bbb; text-decoration: line-through; }
    .bunji-buy-btn {
      margin-top: 5px; align-self: flex-start;
      background: #cc0000; color: #fff; border: none;
      border-radius: 6px; padding: 5px 14px;
      font-size: 11.5px; font-weight: 700; cursor: pointer;
      transition: background 0.15s;
    }
    .bunji-buy-btn:hover { background: #a00000; }
    .bunji-buy-btn.added { background: #15803d; cursor: default; }

    /* ── Brand grid ── */
    .bunji-brand-wrapper {
      align-self: flex-start; width: 100%;
      background: #e2e8f0; border-radius: 8px;
      border-bottom-left-radius: 0; padding: 12px;
      box-sizing: border-box;
    }
    .bunji-brand-title { font-weight:700; color:#cc0000; font-size:13px; margin-bottom:6px; }
    .bunji-brand-sub   { font-size:11px; color:#64748b; margin-bottom:10px; }
    .bunji-alpha-row   { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px; }
    .bunji-alpha-btn {
      width:26px; height:26px; border-radius:5px;
      background:#cc0000; color:#fff; border:none;
      font-size:12px; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:background 0.15s;
    }
    .bunji-alpha-btn:hover  { background:#a00000; }
    .bunji-alpha-btn.empty  { background:#ddd; color:#aaa; cursor:default; pointer-events:none; }
    .bunji-brand-sections   { max-height:260px; overflow-y:auto; }
    .bunji-brand-section    { margin-bottom:8px; }
    .bunji-brand-letter     { font-size:11px; font-weight:700; color:#888; border-bottom:1px solid #ddd; padding-bottom:2px; margin-bottom:4px; }
    .bunji-brand-list       { display:flex; flex-wrap:wrap; gap:5px; }
    .bunji-brand-btn {
      background:#fff; border:1.5px solid #cc0000; color:#cc0000;
      border-radius:6px; padding:5px 10px; font-size:11.5px;
      cursor:pointer; font-weight:600;
      transition:background 0.15s, color 0.15s;
    }
    .bunji-brand-btn:hover  { background:#cc0000; color:#fff; }

    /* ── Vertical grid ── */
    .bunji-vert-wrapper {
      align-self: flex-start; width: 100%;
      background: #e2e8f0; border-radius: 8px;
      border-bottom-left-radius: 0; padding: 12px;
      box-sizing: border-box;
    }
    .bunji-vert-title { font-weight:700; color:#cc0000; font-size:13px; margin-bottom:4px; }
    .bunji-vert-sub   { font-size:11px; color:#64748b; margin-bottom:10px; }
    .bunji-vert-grid  { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
    .bunji-vert-btn {
      background:#fff; border:1.5px solid #cc0000; color:#cc0000;
      border-radius:8px; padding:9px 8px; font-size:11.5px;
      cursor:pointer; text-align:center; font-weight:700;
      transition:background 0.15s, color 0.15s; line-height:1.3;
    }
    .bunji-vert-btn:hover { background:#cc0000; color:#fff; }

    /* ── Typing ── */
    .bunji-typing-indicator {
      font-size: 12px; color: #94a3b8;
      padding: 0 15px 10px; display: none; flex-shrink: 0;
    }

    /* ── Input ── */
    .bunji-input-area {
      display: flex; border-top: 1px solid #e0e0e0;
      padding: 10px; background: white; flex-shrink: 0;
    }
    #bunji-input {
      flex: 1; border: 1px solid #cbd5e1; border-radius: 20px;
      padding: 10px 15px; outline: none; font-size: 14px;
    }
    #bunji-input:focus { border-color: #cc0000; }
    #bunji-send {
      background: var(--primary, #cc0000); color: white;
      border: none; border-radius: 20px;
      padding: 0 15px; margin-left: 10px;
      cursor: pointer; font-weight: 600; font-size: 14px;
    }

    @media (max-width: 420px) {
      #bunji-chat-window { width: calc(100vw - 24px); right: -8px; }
    }
  `;
  document.head.appendChild(style);

  // ─── HTML ─────────────────────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'bunji-widget';
  widget.innerHTML = `
    <button id="bunji-toggle">💬</button>
    <div id="bunji-chat-window">
      <div class="bunji-header">
        <span>🤖 Bunji — Virtual Advisor</span>
        <button class="bunji-header-close" id="bunji-close">×</button>
      </div>
      <div class="bunji-messages" id="bunji-messages"></div>
      <div class="bunji-typing-indicator" id="bunji-typing">Bunji is typing...</div>
      <div class="bunji-input-area">
        <input type="text" id="bunji-input" placeholder="Type a message..." autocomplete="off" />
        <button id="bunji-send">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // ─── GLOBAL LOGIN GATE ────────────────────────────────────────────────────
  // Chat widget is hidden on ALL pages until the user is logged in
  const widgetEl = document.getElementById('bunji-widget');
  const isLoggedIn = !!localStorage.getItem('kjr_user');

  if (!isLoggedIn) {
    // Keep widget completely hidden
    if (widgetEl) widgetEl.style.display = 'none';

    // Reveal immediately when user logs in on this page
    window.addEventListener('kjr-login', () => {
      if (widgetEl) widgetEl.style.display = '';
    });

    // Reveal if login detected in another tab
    window.addEventListener('storage', (e) => {
      if (e.key === 'kjr_user' && e.newValue) {
        if (widgetEl) widgetEl.style.display = '';
      }
    });
  }

  // ─── REFS ─────────────────────────────────────────────────────────────────
  const toggleBtn = document.getElementById('bunji-toggle');
  const chatWindow = document.getElementById('bunji-chat-window');
  const closeBtn = document.getElementById('bunji-close');
  const messagesEl = document.getElementById('bunji-messages');
  const inputEl = document.getElementById('bunji-input');
  const sendBtn = document.getElementById('bunji-send');
  const typingEl = document.getElementById('bunji-typing');

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  function scrollBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

  function addBubble(text, role) {
    const div = document.createElement('div');
    div.className = 'bunji-bubble ' + role;
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollBottom();
  }

  function showTyping() { typingEl.style.display = 'block'; scrollBottom(); }
  function hideTyping() { typingEl.style.display = 'none'; }

  // ─── CATEGORY GRID ────────────────────────────────────────────────────────
  function renderCategoryGrid() {
    showingCategories = true;

    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-cat-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-cat-title';
    title.textContent = '📦 HVAC Parts & Accessories — Select a Category:';
    wrapper.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'bunji-cat-grid';

    PRODUCT_CATEGORIES.forEach((cat, i) => {
      const btn = document.createElement('button');
      btn.className = 'bunji-cat-btn';
      btn.textContent = `${i + 1}. ${cat}`;
      btn.addEventListener('click', () => {
        showingCategories = false;
        addBubble(`Selected: ${cat}`, 'user');
        renderProductCards(cat);
      });
      grid.appendChild(btn);
    });

    wrapper.appendChild(grid);
    messagesEl.appendChild(wrapper);
    scrollBottom();
  }

  // ─── PRODUCT CARDS ────────────────────────────────────────────────────────
  // Build a single product card element
  function buildCard(product, categoryName) {
    const card = document.createElement('div');
    card.className = 'bunji-prod-card';

    const img = document.createElement('img');
    img.className = 'bunji-prod-img';
    img.alt = product.name;
    img.src = product.img || PLACEHOLDER;
    img.onerror = () => { img.src = PLACEHOLDER; };
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'bunji-prod-body';

    const name = document.createElement('div');
    name.className = 'bunji-prod-name';
    name.textContent = product.name;

    const part = document.createElement('div');
    part.className = 'bunji-prod-part';
    part.textContent = `Part #: ${product.part}`;

    const pricing = document.createElement('div');
    pricing.className = 'bunji-prod-pricing';

    const priceVal = typeof product.price === 'number'
      ? '$' + product.price.toFixed(2)
      : product.price;
    const wasVal = product.was
      ? (typeof product.was === 'number' ? '$' + product.was.toFixed(2) : product.was)
      : null;

    const priceEl = document.createElement('span');
    priceEl.className = 'bunji-prod-price';
    priceEl.textContent = priceVal;
    pricing.appendChild(priceEl);

    if (wasVal) {
      const wasEl = document.createElement('span');
      wasEl.className = 'bunji-prod-was';
      wasEl.textContent = `was ${wasVal}`;
      pricing.appendChild(wasEl);
    }

    const buyBtn = document.createElement('button');
    buyBtn.className = 'bunji-buy-btn';
    buyBtn.textContent = '🛒 BUY';
    buyBtn.addEventListener('click', () => {
      if (buyBtn.classList.contains('added')) return;
      buyBtn.classList.add('added');
      buyBtn.textContent = '✓ Added';
      addBubble(`I want to buy: ${product.name} (Part #${product.part}) — ${priceVal}`, 'user');
      setTimeout(() => {
        addBubble(
          `🎉 Thank you for your order!\n\n` +
          `📦 Item: ${product.name}\n` +
          `🔖 Part #: ${product.part}\n` +
          `💰 Price: ${priceVal}\n\n` +
          `We are updating your profile and processing your request.\n` +
          `Our team will follow up with you shortly to confirm your order.\n\n` +
          `To complete your purchase, please visit:\n` +
          `🌐 www.encompass.com\n` +
          `   Username: 312446\n\n` +
          `Is there anything else I can help you with?`,
          'bunji'
        );
      }, 600);
    });

    body.appendChild(name);
    body.appendChild(part);
    body.appendChild(pricing);
    body.appendChild(buyBtn);
    card.appendChild(body);
    return card;
  }

  // Fetch products from API and render with pagination
  async function renderProductCards(categoryName) {
    // First check local hardcoded data
    const localProducts = CATEGORY_PRODUCTS[categoryName];

    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-prod-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-prod-title';
    title.textContent = `🛍️ ${categoryName}`;
    wrapper.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'bunji-prod-sub';
    sub.textContent = '100% genuine parts · Fast shipping · 350+ brands';
    wrapper.appendChild(sub);

    const list = document.createElement('div');
    list.className = 'bunji-prod-list';
    wrapper.appendChild(list);

    // Loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = 'text-align:center; color:#888; font-size:12px; padding:10px;';
    loadingEl.textContent = 'Loading products...';
    wrapper.appendChild(loadingEl);

    messagesEl.appendChild(wrapper);
    scrollBottom();

    let currentPage = 1;
    let hasMore = false;
    const API_PRODUCTS = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001/api'
      : 'https://kjr-backend.onrender.com/api';

    async function loadPage(page) {
      try {
        const res = await fetch(`${API_PRODUCTS}/products/${encodeURIComponent(categoryName)}?page=${page}&limit=20`);
        const data = await res.json();
        loadingEl.remove();

        const products = data.products || [];
        hasMore = data.hasMore || false;

        if (products.length === 0 && page === 1) {
          // Fall back to local data if API returns nothing
          const fallback = localProducts || getDefaultProducts(categoryName);
          fallback.forEach(p => list.appendChild(buildCard(p, categoryName)));
        } else {
          products.forEach(p => list.appendChild(buildCard(p, categoryName)));
        }

        // Remove old load more button if exists
        const oldBtn = wrapper.querySelector('.bunji-load-more');
        if (oldBtn) oldBtn.remove();

        // Add Load More button if there are more pages
        if (hasMore) {
          const loadMoreBtn = document.createElement('button');
          loadMoreBtn.className = 'bunji-load-more';
          loadMoreBtn.style.cssText = `
            width:100%; margin-top:8px; padding:8px;
            background:#fff; border:1.5px solid #cc0000; color:#cc0000;
            border-radius:7px; font-size:12px; font-weight:700; cursor:pointer;
          `;
          loadMoreBtn.textContent = `Load More (Page ${page + 1} of ${data.pages})`;
          loadMoreBtn.addEventListener('click', () => {
            loadMoreBtn.textContent = 'Loading...';
            loadMoreBtn.disabled = true;
            currentPage++;
            loadPage(currentPage);
          });
          wrapper.appendChild(loadMoreBtn);
        }

        // Show count
        const countEl = document.createElement('div');
        countEl.style.cssText = 'font-size:10px; color:#aaa; text-align:right; margin-top:4px;';
        countEl.textContent = `Showing ${Math.min(page * 20, data.total)} of ${data.total} products`;
        wrapper.appendChild(countEl);

        scrollBottom();
      } catch (err) {
        loadingEl.textContent = '';
        // Fall back to local data on error
        const fallback = localProducts || getDefaultProducts(categoryName);
        fallback.forEach(p => list.appendChild(buildCard(p, categoryName)));
        scrollBottom();
      }
    }

    await loadPage(1);
  }

  // ─── BRAND GRID ──────────────────────────────────────────────────────────
  function renderBrandGrid() {
    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-brand-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-brand-title';
    title.textContent = '🏷️ Browse by Brand — Select a Letter:';
    wrapper.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'bunji-brand-sub';
    sub.textContent = '350+ brands available · Click a letter to see brands';
    wrapper.appendChild(sub);

    // A–Z letter buttons
    const alphaRow = document.createElement('div');
    alphaRow.className = 'bunji-alpha-row';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    letters.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'bunji-alpha-btn' + (ALL_BRANDS[letter] && ALL_BRANDS[letter].length ? '' : ' empty');
      btn.textContent = letter;
      if (ALL_BRANDS[letter] && ALL_BRANDS[letter].length) {
        btn.addEventListener('click', () => {
          // Scroll brand sections to that letter
          const target = sectionsEl.querySelector(`[data-letter="${letter}"]`);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      alphaRow.appendChild(btn);
    });
    wrapper.appendChild(alphaRow);

    // All brand sections A–Z
    const sectionsEl = document.createElement('div');
    sectionsEl.className = 'bunji-brand-sections';

    Object.entries(ALL_BRANDS).forEach(([letter, brands]) => {
      if (!brands.length) return;
      const section = document.createElement('div');
      section.className = 'bunji-brand-section';
      section.setAttribute('data-letter', letter);

      const letterEl = document.createElement('div');
      letterEl.className = 'bunji-brand-letter';
      letterEl.textContent = letter;
      section.appendChild(letterEl);

      const listEl = document.createElement('div');
      listEl.className = 'bunji-brand-list';

      brands.forEach(brand => {
        const btn = document.createElement('button');
        btn.className = 'bunji-brand-btn';
        btn.textContent = brand;
        btn.addEventListener('click', () => {
          addBubble(`Brand: ${brand}`, 'user');
          renderBrandProducts(brand);
        });
        listEl.appendChild(btn);
      });

      section.appendChild(listEl);
      sectionsEl.appendChild(section);
    });

    wrapper.appendChild(sectionsEl);
    messagesEl.appendChild(wrapper);
    scrollBottom();
  }

  // ─── BRAND PRODUCTS ───────────────────────────────────────────────────────
  async function renderBrandProducts(brandName) {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001/api'
      : 'https://kjr-backend.onrender.com/api';

    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-prod-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-prod-title';
    title.textContent = `🏷️ ${brandName} Products`;
    wrapper.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'bunji-prod-sub';
    sub.textContent = '100% genuine parts · Fast shipping';
    wrapper.appendChild(sub);

    const list = document.createElement('div');
    list.className = 'bunji-prod-list';
    wrapper.appendChild(list);

    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = 'text-align:center; color:#888; font-size:12px; padding:10px;';
    loadingEl.textContent = `Loading ${brandName} products...`;
    wrapper.appendChild(loadingEl);

    messagesEl.appendChild(wrapper);
    scrollBottom();

    let currentPage = 1;

    async function loadPage(page) {
      try {
        const res = await fetch(`${API_BASE}/products/brand/${encodeURIComponent(brandName)}?page=${page}&limit=20`);
        const data = await res.json();
        loadingEl.remove();

        const products = data.products || [];

        if (products.length === 0 && page === 1) {
          const emptyEl = document.createElement('div');
          emptyEl.style.cssText = 'color:#888; font-size:12px; padding:8px; text-align:center;';
          emptyEl.textContent = `No products found for "${brandName}" yet. Check back soon!`;
          list.appendChild(emptyEl);
        } else {
          products.forEach(p => list.appendChild(buildCard(p, p.category)));
        }

        // Remove old load more
        const oldBtn = wrapper.querySelector('.bunji-load-more');
        if (oldBtn) oldBtn.remove();
        const oldCount = wrapper.querySelector('.bunji-prod-count');
        if (oldCount) oldCount.remove();

        if (data.hasMore) {
          const loadMoreBtn = document.createElement('button');
          loadMoreBtn.className = 'bunji-load-more';
          loadMoreBtn.style.cssText = 'width:100%; margin-top:8px; padding:8px; background:#fff; border:1.5px solid #cc0000; color:#cc0000; border-radius:7px; font-size:12px; font-weight:700; cursor:pointer;';
          loadMoreBtn.textContent = `Load More (Page ${page + 1} of ${data.pages})`;
          loadMoreBtn.addEventListener('click', () => {
            loadMoreBtn.textContent = 'Loading...';
            loadMoreBtn.disabled = true;
            currentPage++;
            loadPage(currentPage);
          });
          wrapper.appendChild(loadMoreBtn);
        }

        const countEl = document.createElement('div');
        countEl.className = 'bunji-prod-count';
        countEl.style.cssText = 'font-size:10px; color:#aaa; text-align:right; margin-top:4px;';
        countEl.textContent = `Showing ${Math.min(page * 20, data.total)} of ${data.total} products`;
        wrapper.appendChild(countEl);

        scrollBottom();
      } catch (err) {
        loadingEl.textContent = `Could not load ${brandName} products. Please try again.`;
        scrollBottom();
      }
    }

    await loadPage(1);
  }

  // ─── VERTICALS ────────────────────────────────────────────────────────────
  const VERTICALS = [
    { name: "Auto & Garage", icon: "🚗" },
    { name: "Grills & Outdoor Kitchen", icon: "🔥" },
    { name: "Consumer Electronics", icon: "📺" },
    { name: "Commercial Appliance", icon: "🏪" },
    { name: "Coffee & Small Appliance", icon: "☕" },
    { name: "Computer & Tablet", icon: "💻" },
    { name: "HVAC", icon: "❄️" },
    { name: "Home Appliances", icon: "🏠" },
    { name: "Health & Wellness", icon: "💊" },
    { name: "Lawn & Garden", icon: "🌿" },
    { name: "Mobile", icon: "📱" },
    { name: "Power Tool Parts", icon: "🔧" },
    { name: "Personal Care", icon: "✂️" },
    { name: "Plumbing", icon: "🔩" },
    { name: "Print & Imaging", icon: "🖨️" },
    { name: "Pool & Spa", icon: "🏊" },
    { name: "Service Aids & Tools", icon: "🛠️" },
    { name: "Vacuum", icon: "🌀" },
  ];

  function renderVerticalGrid() {
    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-vert-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-vert-title';
    title.textContent = '🗂️ Browse by Vertical — Select a Department:';
    wrapper.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'bunji-vert-sub';
    sub.textContent = '18 departments · Millions of genuine parts';
    wrapper.appendChild(sub);

    const grid = document.createElement('div');
    grid.className = 'bunji-vert-grid';

    VERTICALS.forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'bunji-vert-btn';
      btn.textContent = `${v.icon} ${v.name}`;
      btn.addEventListener('click', () => {
        addBubble(`Vertical: ${v.name}`, 'user');
        renderVerticalProducts(v.name, v.icon);
      });
      grid.appendChild(btn);
    });

    wrapper.appendChild(grid);
    messagesEl.appendChild(wrapper);
    scrollBottom();
  }

  async function renderVerticalProducts(verticalName, icon) {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001/api'
      : 'https://kjr-backend.onrender.com/api';

    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-prod-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-prod-title';
    title.textContent = `${icon || '🗂️'} ${verticalName}`;
    wrapper.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'bunji-prod-sub';
    sub.textContent = '100% genuine parts · Fast shipping · 350+ brands';
    wrapper.appendChild(sub);

    const list = document.createElement('div');
    list.className = 'bunji-prod-list';
    wrapper.appendChild(list);

    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = 'text-align:center; color:#888; font-size:12px; padding:10px;';
    loadingEl.textContent = `Loading ${verticalName} products...`;
    wrapper.appendChild(loadingEl);

    messagesEl.appendChild(wrapper);
    scrollBottom();

    let currentPage = 1;

    async function loadPage(page) {
      try {
        const res = await fetch(`${API_BASE}/products/vertical/${encodeURIComponent(verticalName)}?page=${page}&limit=20`);
        const data = await res.json();
        loadingEl.remove();

        const products = data.products || [];

        if (products.length === 0 && page === 1) {
          const emptyEl = document.createElement('div');
          emptyEl.style.cssText = 'color:#888; font-size:12px; padding:8px; text-align:center;';
          emptyEl.textContent = `No products found for "${verticalName}" yet. Check back soon!`;
          list.appendChild(emptyEl);
        } else {
          products.forEach(p => list.appendChild(buildCard(p, p.category)));
        }

        const oldBtn = wrapper.querySelector('.bunji-load-more');
        if (oldBtn) oldBtn.remove();
        const oldCount = wrapper.querySelector('.bunji-prod-count');
        if (oldCount) oldCount.remove();

        if (data.hasMore) {
          const loadMoreBtn = document.createElement('button');
          loadMoreBtn.className = 'bunji-load-more';
          loadMoreBtn.style.cssText = 'width:100%; margin-top:8px; padding:8px; background:#fff; border:1.5px solid #cc0000; color:#cc0000; border-radius:7px; font-size:12px; font-weight:700; cursor:pointer;';
          loadMoreBtn.textContent = `Load More (Page ${page + 1} of ${data.pages})`;
          loadMoreBtn.addEventListener('click', () => {
            loadMoreBtn.textContent = 'Loading...';
            loadMoreBtn.disabled = true;
            currentPage++;
            loadPage(currentPage);
          });
          wrapper.appendChild(loadMoreBtn);
        }

        const countEl = document.createElement('div');
        countEl.className = 'bunji-prod-count';
        countEl.style.cssText = 'font-size:10px; color:#aaa; text-align:right; margin-top:4px;';
        countEl.textContent = `Showing ${Math.min(page * 20, data.total)} of ${data.total} products`;
        wrapper.appendChild(countEl);

        scrollBottom();
      } catch (err) {
        loadingEl.textContent = `Could not load ${verticalName} products. Please try again.`;
        scrollBottom();
      }
    }

    await loadPage(1);
  }

  // ─── PART SEARCH ─────────────────────────────────────────────────────────
  // State: are we waiting for a search query after pressing #5?
  let awaitingPartSearch = false;

  function renderPartSearchPrompt() {
    awaitingPartSearch = true;

    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-cat-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-cat-title';
    title.textContent = '🔍 Search by Part Number or Product Name';
    wrapper.appendChild(title);

    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:10px;';
    sub.textContent = 'Type a part number (e.g. VA-35-5S) or product name in the chat box below and press Send.';
    wrapper.appendChild(sub);

    // Quick example buttons
    const exRow = document.createElement('div');
    exRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;';
    ['VA-35-5S', 'Air Filter 20x25', 'Capacitor', 'GDS16201'].forEach(ex => {
      const btn = document.createElement('button');
      btn.className = 'bunji-cat-btn';
      btn.textContent = ex;
      btn.style.cssText = 'font-size:10.5px;padding:4px 8px;';
      btn.addEventListener('click', () => {
        awaitingPartSearch = false;
        addBubble(ex, 'user');
        doPartSearch(ex);
      });
      exRow.appendChild(btn);
    });
    wrapper.appendChild(exRow);

    messagesEl.appendChild(wrapper);
    scrollBottom();
    inputEl.focus();
  }

  // ── Build a flat, scored product list from the full static catalog ──────────
  function buildFlatCatalog() {
    // Prefer products-data.js (full catalog), fall back to bunji's own CATEGORY_PRODUCTS
    const src = window.KJR_CATEGORY_PRODUCTS || CATEGORY_PRODUCTS;
    const flat = [];
    Object.entries(src).forEach(([cat, items]) => {
      (items || []).forEach(p => {
        if (p && p.name) flat.push({ ...p, category: cat });
      });
    });
    return flat;
  }

  // Score a product against a query — higher = better match
  function scoreProduct(p, tokens, rawQuery) {
    const nameLower = (p.name || '').toLowerCase();
    const partLower = (p.part || '').toLowerCase();
    const catLower = (p.category || '').toLowerCase();

    // Remove spaces/dashes for dimension matching: "20x25" matches "20X25"
    const nameNorm = nameLower.replace(/[\s\-_]/g, '');
    const partNorm = partLower.replace(/[\s\-_]/g, '');
    const qNorm = rawQuery.replace(/[\s\-_]/g, '').toLowerCase();

    let score = 0;

    // Exact part number match — top priority
    if (partLower === rawQuery) score += 1000;
    if (partNorm === qNorm) score += 800;
    if (partLower.includes(rawQuery)) score += 500;
    if (partNorm.includes(qNorm)) score += 400;

    // Exact name match
    if (nameLower === rawQuery) score += 600;
    if (nameNorm === qNorm) score += 500;
    if (nameLower.includes(rawQuery)) score += 300;
    if (nameNorm.includes(qNorm)) score += 250;

    // Token-based: score each search word separately
    tokens.forEach(tok => {
      const tokNorm = tok.replace(/[\s\-_]/g, '');
      if (partLower.includes(tok)) score += 120;
      if (partNorm.includes(tokNorm)) score += 100;
      if (nameLower.includes(tok)) score += 80;
      if (nameNorm.includes(tokNorm)) score += 60;
      if (catLower.includes(tok)) score += 20;
    });

    return score;
  }

  // Search products locally + via API, then render up to 4 result cards + modal
  async function doPartSearch(query) {
    const q = query.trim();
    if (!q) return;

    showTyping();

    // ── 1. Smart local search across the FULL catalog ────────────────────────
    const rawQ = q.toLowerCase();
    // Split query into meaningful tokens (ignore short noise words)
    const tokens = rawQ.split(/[\s,]+/).filter(t => t.length >= 2);

    const catalog = buildFlatCatalog();

    // Score every product
    const scored = catalog
      .map(p => ({ p, score: scoreProduct(p, tokens, rawQ) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    const localResults = scored.map(x => x.p);

    // ── 2. Also hit backend search API (best-effort, non-blocking) ───────────
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001/api'
      : 'https://kjr-backend.onrender.com/api';

    let apiResults = [];
    try {
      const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(q)}&limit=8`, {
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        apiResults = data.products || [];
      }
    } catch (e) { /* backend unavailable — local results are sufficient */ }

    hideTyping();

    // ── 3. Merge: API first (DB data), then local — dedupe by part# or name ──
    const seen = new Set();
    const merged = [];
    [...apiResults, ...localResults].forEach(p => {
      const key = ((p.part && p.part.trim()) ? p.part.trim() : p.name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(p);
      }
    });

    if (merged.length === 0) {
      addBubble(
        `😔 We couldn't find "${q}" in our catalog right now.\n\n` +
        `No worries — our executive team will contact you shortly!\n` +
        `Please leave your details below and we'll source this part for you. 👇`,
        'bunji'
      );
      renderInquiryForm(q);
      return;
    }

    const show = merged.slice(0, 4);
    addBubble(
      `✅ Found ${merged.length} result${merged.length !== 1 ? 's' : ''} for "${q}" — showing top ${show.length}.\n` +
      `Click "View Details" on any card to see full pricing, specs, and order options.`,
      'bunji'
    );

    renderPartSearchResults(show, q, merged.length);
  }

  // ── Inquiry form — shown when no product is found ────────────────────────
  function renderInquiryForm(prefillQuery) {
    // Pre-fill name/email from logged-in user if available
    const kjrUser = (() => { try { return JSON.parse(localStorage.getItem('kjr_user') || 'null'); } catch { return null; } })();

    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-cat-wrapper';
    wrapper.style.cssText = 'background:#fff3f3;border:1.5px solid #cc0000;border-radius:8px;border-bottom-left-radius:0;padding:14px;';

    wrapper.innerHTML = `
      <div style="font-size:12.5px;font-weight:700;color:#cc0000;margin-bottom:10px;">📋 Request This Part — We'll Find It For You</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div>
          <label style="font-size:10px;font-weight:700;color:#64748b;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em;">Your Name *</label>
          <input id="inq-name" type="text" placeholder="Full name"
            value="${kjrUser ? (kjrUser.username || '') : ''}"
            style="width:100%;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12.5px;font-family:'Inter',Arial,sans-serif;box-sizing:border-box;outline:none;">
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#64748b;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em;">Email Address *</label>
          <input id="inq-email" type="email" placeholder="you@example.com"
            value="${kjrUser ? (kjrUser.email || '') : ''}"
            style="width:100%;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12.5px;font-family:'Inter',Arial,sans-serif;box-sizing:border-box;outline:none;">
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#64748b;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em;">Phone Number</label>
          <input id="inq-phone" type="tel" placeholder="555-123-4567"
            style="width:100%;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12.5px;font-family:'Inter',Arial,sans-serif;box-sizing:border-box;outline:none;">
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#64748b;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em;">Part / Product You Need *</label>
          <input id="inq-query" type="text" placeholder="Part number or description"
            value="${(prefillQuery || '').replace(/"/g, '&quot;')}"
            style="width:100%;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12.5px;font-family:'Inter',Arial,sans-serif;box-sizing:border-box;outline:none;">
        </div>
        <div id="inq-error" style="display:none;color:#cc0000;font-size:11px;font-weight:600;padding:5px 8px;background:#fff1f1;border-radius:5px;"></div>
        <button id="inq-submit-btn"
          style="background:#cc0000;color:#fff;border:none;border-radius:7px;padding:9px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Inter',Arial,sans-serif;transition:background .15s;margin-top:2px;">
          📨 Submit — Our Team Will Contact You
        </button>
        <div style="font-size:10px;color:#94a3b8;text-align:center;">Or call us anytime: <strong>888-944-6313</strong> (24/7)</div>
      </div>
    `;

    messagesEl.appendChild(wrapper);
    scrollBottom();

    // Focus first empty required field
    const nameInput = wrapper.querySelector('#inq-name');
    const emailInput = wrapper.querySelector('#inq-email');
    const phoneInput = wrapper.querySelector('#inq-phone');
    const queryInput = wrapper.querySelector('#inq-query');
    const errEl = wrapper.querySelector('#inq-error');
    const submitBtn = wrapper.querySelector('#inq-submit-btn');

    // Focus on first empty
    if (!nameInput.value) nameInput.focus();
    else if (!emailInput.value) emailInput.focus();

    // Hover style
    submitBtn.addEventListener('mouseenter', () => { submitBtn.style.background = '#aa0000'; });
    submitBtn.addEventListener('mouseleave', () => { submitBtn.style.background = '#cc0000'; });

    // Submit
    submitBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      const query = queryInput.value.trim();

      // Validate
      errEl.style.display = 'none';
      if (!name) { errEl.textContent = 'Please enter your name.'; errEl.style.display = 'block'; nameInput.focus(); return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = 'block'; emailInput.focus(); return;
      }
      if (!query) { errEl.textContent = 'Please describe the part you need.'; errEl.style.display = 'block'; queryInput.focus(); return; }

      // Disable while submitting
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001/api'
        : 'https://kjr-backend.onrender.com/api';

      try {
        const res = await fetch(`${API_BASE}/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, name, email, phone }),
          signal: AbortSignal.timeout(15000)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          // Replace form with success message
          wrapper.innerHTML = `
            <div style="text-align:center;padding:8px 0;">
              <div style="font-size:28px;margin-bottom:8px;">✅</div>
              <div style="font-weight:700;color:#15803d;font-size:13px;margin-bottom:6px;">Request Submitted!</div>
              <div style="font-size:12px;color:#475569;line-height:1.5;">
                Thank you, <strong>${name}</strong>! One of our executives will<br>
                contact you at <strong>${email}</strong> soon.<br><br>
                In the meantime, you can call us 24/7 at<br>
                <strong style="color:#cc0000;">888-944-6313</strong>
              </div>
            </div>`;
          wrapper.style.background = '#f0fdf4';
          wrapper.style.border = '1.5px solid #16a34a';
          scrollBottom();
          addBubble(
            `✅ Got it! Your request for "${query}" has been submitted.\n\n` +
            `Our executive team will reach out to ${email} shortly.\n\n` +
            `You can also call us anytime at 888-944-6313 (24/7).\n\n` +
            `Would you like to search for another part?`,
            'bunji'
          );
          // Show search again button
          setTimeout(() => renderPartSearchPrompt(), 400);
        } else {
          throw new Error(data.error || 'Submission failed');
        }
      } catch (err) {
        // If backend is down, still show success (log to console) and give phone fallback
        console.warn('Inquiry submit error:', err.message);
        wrapper.innerHTML = `
          <div style="text-align:center;padding:8px 0;">
            <div style="font-size:26px;margin-bottom:8px;">📞</div>
            <div style="font-weight:700;color:#cc0000;font-size:13px;margin-bottom:6px;">Call Us Directly</div>
            <div style="font-size:12px;color:#475569;line-height:1.6;">
              Our system is temporarily offline.<br>
              Please call us at <strong style="color:#cc0000;">888-944-6313</strong><br>
              (24/7 Live Operator) and ask for the part:<br>
              <strong>"${query}"</strong>
            </div>
          </div>`;
        scrollBottom();
      }
    });

    // Allow Enter key on last field to submit
    queryInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });
  }

  // ── Render up to 4 search result cards ────────────────────────────────────
  function renderPartSearchResults(products, query, totalFound) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-prod-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-prod-title';
    title.textContent = `🔍 Results for "${query}"`;
    wrapper.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'bunji-prod-sub';
    sub.textContent = `${totalFound} match${totalFound !== 1 ? 'es' : ''} found · Showing top ${products.length}`;
    wrapper.appendChild(sub);

    const list = document.createElement('div');
    list.className = 'bunji-prod-list';

    products.forEach(p => {
      const card = buildSearchResultCard(p);
      list.appendChild(card);
    });

    wrapper.appendChild(list);

    // "Search again" link
    const again = document.createElement('button');
    again.style.cssText = 'margin-top:10px;width:100%;padding:7px;background:#fff;border:1.5px solid #cc0000;color:#cc0000;border-radius:7px;font-size:11.5px;font-weight:700;cursor:pointer;';
    again.textContent = '🔍 Search Again';
    again.addEventListener('click', () => {
      addBubble('Search again', 'user');
      renderPartSearchPrompt();
    });
    wrapper.appendChild(again);

    messagesEl.appendChild(wrapper);
    scrollBottom();
  }

  // ── Build a compact search result card with "View Details" popup ──────────
  function buildSearchResultCard(p) {
    const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f0f0f0' rx='6'/%3E%3Ctext x='40' y='44' font-family='Arial' font-size='10' fill='%23bbb' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E`;

    const card = document.createElement('div');
    card.className = 'bunji-prod-card';
    card.style.cursor = 'pointer';

    // Image
    const img = document.createElement('img');
    img.className = 'bunji-prod-img';
    img.alt = p.name;
    img.src = p.img || PLACEHOLDER_SVG;
    img.onerror = () => { img.src = PLACEHOLDER_SVG; };
    card.appendChild(img);

    // Body
    const body = document.createElement('div');
    body.className = 'bunji-prod-body';

    const catTag = document.createElement('div');
    catTag.style.cssText = 'font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#cc0000;margin-bottom:2px;';
    catTag.textContent = p.category || '';

    const name = document.createElement('div');
    name.className = 'bunji-prod-name';
    name.textContent = p.name;

    const part = document.createElement('div');
    part.className = 'bunji-prod-part';
    part.textContent = `Part #: ${p.part || 'N/A'}`;

    const pricing = document.createElement('div');
    pricing.className = 'bunji-prod-pricing';

    const priceEl = document.createElement('span');
    priceEl.className = 'bunji-prod-price';
    priceEl.textContent = p.price || 'Call';
    pricing.appendChild(priceEl);

    if (p.was) {
      const wasEl = document.createElement('span');
      wasEl.className = 'bunji-prod-was';
      wasEl.textContent = `was ${p.was}`;
      pricing.appendChild(wasEl);
    }

    // View Details button — opens inline modal
    const viewBtn = document.createElement('button');
    viewBtn.className = 'bunji-buy-btn';
    viewBtn.style.cssText = 'background:#0f172a;margin-top:5px;align-self:flex-start;padding:5px 12px;font-size:11px;border:none;border-radius:6px;color:#fff;font-weight:700;cursor:pointer;';
    viewBtn.textContent = '🔍 View Details';
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBunjiProductModal(p);
    });

    body.appendChild(catTag);
    body.appendChild(name);
    body.appendChild(part);
    body.appendChild(pricing);
    body.appendChild(viewBtn);
    card.appendChild(body);

    // Clicking anywhere on card also opens modal
    card.addEventListener('click', () => openBunjiProductModal(p));

    return card;
  }

  // ── Inline product detail modal (mirrors products.html modal) ─────────────
  function openBunjiProductModal(p) {
    // Remove any existing modal
    const existing = document.getElementById('bunji-prod-modal');
    if (existing) existing.remove();

    const parsePrice = str => str ? parseFloat(str.replace(/[^0-9.]/g, '')) || 0 : 0;
    const discount = p.was && p.price
      ? Math.round((1 - parsePrice(p.price) / parsePrice(p.was)) * 100)
      : 0;

    let qty = 1;

    const overlay = document.createElement('div');
    overlay.id = 'bunji-prod-modal';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:99999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.65);backdrop-filter:blur(4px);
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      position:relative;background:#fff;border-radius:18px;
      width:min(95vw,760px);max-height:92vh;overflow-y:auto;
      box-shadow:0 24px 80px rgba(0,0,0,.35);
      animation:bunjiModalIn .22s ease;font-family:'Inter',Arial,sans-serif;
    `;

    // Inject animation keyframes once
    if (!document.getElementById('bunji-modal-style')) {
      const st = document.createElement('style');
      st.id = 'bunji-modal-style';
      st.textContent = `
        @keyframes bunjiModalIn {
          from { opacity:0; transform:translateY(24px) scale(.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        #bunji-prod-modal .bm-close {
          position:absolute;top:12px;right:12px;
          width:34px;height:34px;border-radius:50%;
          border:1.5px solid #e2e8f0;background:#fff;
          font-size:14px;cursor:pointer;z-index:10;
          display:flex;align-items:center;justify-content:center;
          transition:background .15s;
        }
        #bunji-prod-modal .bm-close:hover { background:#fee2e2;border-color:#cc0000; }
        #bunji-prod-modal .bm-inner {
          display:grid;grid-template-columns:1fr 1fr;min-height:420px;
        }
        @media(max-width:560px){
          #bunji-prod-modal .bm-inner { grid-template-columns:1fr; }
          #bunji-prod-modal .bm-img-side {
            border-right:none!important;border-bottom:1px solid #e2e8f0;
            border-radius:18px 18px 0 0!important;min-height:160px!important;
          }
        }
        #bunji-prod-modal .bm-img-side {
          background:#f8fafc;border-right:1px solid #e2e8f0;
          border-radius:18px 0 0 18px;
          display:flex;align-items:center;justify-content:center;
          padding:1.5rem;min-height:300px;position:relative;
        }
        #bunji-prod-modal .bm-main-img {
          width:100%;max-height:260px;object-fit:contain;border-radius:10px;
        }
        #bunji-prod-modal .bm-badge {
          position:absolute;top:10px;left:10px;
          background:#cc0000;color:#fff;font-size:.68rem;font-weight:800;
          padding:.2rem .55rem;border-radius:20px;letter-spacing:.05em;
        }
        #bunji-prod-modal .bm-detail {
          padding:1.5rem;display:flex;flex-direction:column;gap:.7rem;
        }
        #bunji-prod-modal .bm-cat { font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#cc0000; }
        #bunji-prod-modal .bm-title { font-size:1.1rem;font-weight:800;color:#0f172a;line-height:1.3;margin:0; }
        #bunji-prod-modal .bm-part-row { display:flex;align-items:center;gap:.4rem;flex-wrap:wrap; }
        #bunji-prod-modal .bm-part-label { font-size:.74rem;color:#64748b;font-weight:600; }
        #bunji-prod-modal .bm-part-val { font-size:.78rem;font-family:'Courier New',monospace;background:#f8fafc;border:1px solid #e2e8f0;padding:.18rem .5rem;border-radius:5px;color:#0f172a;font-weight:700; }
        #bunji-prod-modal .bm-copy { font-size:.68rem;padding:.18rem .55rem;border:1.5px solid #e2e8f0;border-radius:5px;background:#fff;cursor:pointer;color:#64748b;font-weight:600;transition:all .15s; }
        #bunji-prod-modal .bm-copy:hover { border-color:#cc0000;color:#cc0000; }
        #bunji-prod-modal .bm-price-block { display:flex;align-items:center;gap:.6rem;flex-wrap:wrap; }
        #bunji-prod-modal .bm-price { font-size:1.8rem;font-weight:800;color:#cc0000; }
        #bunji-prod-modal .bm-was { font-size:.9rem;color:#94a3b8;text-decoration:line-through; }
        #bunji-prod-modal .bm-save { font-size:.7rem;font-weight:700;background:#dcfce7;color:#16a34a;padding:.18rem .55rem;border-radius:20px; }
        #bunji-prod-modal .bm-avail { display:flex;align-items:center;gap:.45rem;font-size:.78rem;color:#16a34a;font-weight:600; }
        #bunji-prod-modal .bm-dot { width:7px;height:7px;background:#16a34a;border-radius:50%;flex-shrink:0; }
        #bunji-prod-modal .bm-divider { border:none;border-top:1px solid #e2e8f0;margin:.15rem 0; }
        #bunji-prod-modal .bm-qty-row { display:flex;align-items:center;gap:.8rem; }
        #bunji-prod-modal .bm-qty-label { font-size:.82rem;font-weight:700;color:#0f172a; }
        #bunji-prod-modal .bm-qty-ctrl { display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:8px;overflow:hidden; }
        #bunji-prod-modal .bm-qty-ctrl button { width:32px;height:32px;border:none;background:#f8fafc;font-size:1rem;cursor:pointer;color:#0f172a;transition:background .15s; }
        #bunji-prod-modal .bm-qty-ctrl button:hover { background:#e2e8f0; }
        #bunji-prod-modal .bm-qty-input { width:46px;text-align:center;border:none;border-left:1.5px solid #e2e8f0;border-right:1.5px solid #e2e8f0;font-size:.86rem;font-weight:700;font-family:'Inter',Arial,sans-serif;outline:none;height:32px; }
        #bunji-prod-modal .bm-actions { display:flex;gap:.6rem;flex-wrap:wrap; }
        #bunji-prod-modal .bm-btn-cart { flex:1;padding:.75rem 1rem;background:#0f172a;color:#fff;border:none;border-radius:9px;font-size:.84rem;font-weight:700;cursor:pointer;font-family:'Inter',Arial,sans-serif;transition:background .2s;min-width:120px; }
        #bunji-prod-modal .bm-btn-cart:hover { background:#1e293b; }
        #bunji-prod-modal .bm-btn-order { flex:1;padding:.75rem 1rem;background:#cc0000;color:#fff;border:none;border-radius:9px;font-size:.84rem;font-weight:700;cursor:pointer;font-family:'Inter',Arial,sans-serif;transition:background .2s;min-width:120px; }
        #bunji-prod-modal .bm-btn-order:hover { background:#aa0000; }
        #bunji-prod-modal .bm-specs { background:#f8fafc;border-radius:10px;padding:.75rem .9rem;display:flex;flex-direction:column;gap:.35rem; }
        #bunji-prod-modal .bm-spec-row { display:flex;justify-content:space-between;font-size:.76rem;gap:.8rem; }
        #bunji-prod-modal .bm-spec-row span:first-child { color:#64748b;font-weight:600; }
        #bunji-prod-modal .bm-spec-row span:last-child { color:#0f172a;font-weight:700;text-align:right; }
        #bunji-prod-modal .bm-call-bar { background:#0f172a;color:rgba(255,255,255,.85);border-radius:9px;padding:.65rem .9rem;font-size:.78rem;text-align:center; }
        #bunji-prod-modal .bm-call-bar strong { color:#fff; }
      `;
      document.head.appendChild(st);
    }

    const imgHTML = p.img
      ? `<img class="bm-main-img" src="${p.img}" alt="${p.name}" onerror="this.style.display='none'">`
      : `<div style="display:flex;flex-direction:column;align-items:center;gap:.6rem;color:#94a3b8;">
           <svg viewBox="0 0 24 24" stroke="#94a3b8" fill="none" stroke-width="1.5" width="70" height="70">
             <rect x="3" y="3" width="18" height="18" rx="2"/>
             <circle cx="8.5" cy="8.5" r="1.5"/>
             <polyline points="21 15 16 10 5 21"/>
           </svg>
           <span style="font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;">No Image</span>
         </div>`;

    box.innerHTML = `
      <button class="bm-close" id="bm-close-btn">✕</button>
      <div class="bm-inner">
        <div class="bm-img-side">
          ${imgHTML}
          ${discount > 0 ? `<div class="bm-badge">-${discount}% OFF</div>` : ''}
        </div>
        <div class="bm-detail">
          <div class="bm-cat">${p.category || ''}</div>
          <h2 class="bm-title">${p.name}</h2>
          <div class="bm-part-row">
            <span class="bm-part-label">Part Number:</span>
            <span class="bm-part-val">${p.part || 'N/A'}</span>
            <button class="bm-copy" id="bm-copy-btn">Copy</button>
          </div>
          <div class="bm-price-block">
            <span class="bm-price">${p.price || 'Call for Price'}</span>
            ${p.was ? `<span class="bm-was">${p.was}</span>` : ''}
            ${discount > 0 ? `<span class="bm-save">Save ${discount}%</span>` : ''}
          </div>
          <div class="bm-avail"><span class="bm-dot"></span> In Stock — Call to Confirm</div>
          <hr class="bm-divider">
          <div class="bm-qty-row">
            <span class="bm-qty-label">Qty:</span>
            <div class="bm-qty-ctrl">
              <button id="bm-qty-minus">−</button>
              <input class="bm-qty-input" id="bm-qty-input" type="number" value="1" min="1" max="999">
              <button id="bm-qty-plus">+</button>
            </div>
          </div>
          <div class="bm-actions">
            <button class="bm-btn-cart" id="bm-cart-btn">🛒 Add to Cart</button>
            <button class="bm-btn-order" id="bm-order-btn">⚡ Buy Now</button>
          </div>
          <hr class="bm-divider">
          <div class="bm-specs">
            <div class="bm-spec-row"><span>Category</span><span>${p.category || '—'}</span></div>
            <div class="bm-spec-row"><span>Part #</span><span>${p.part || '—'}</span></div>
            <div class="bm-spec-row"><span>List Price</span><span>${p.was || p.price || '—'}</span></div>
            <div class="bm-spec-row"><span>Sale Price</span><span>${p.price || '—'}</span></div>
            <div class="bm-spec-row"><span>Availability</span><span>Call 888-944-6313</span></div>
            <div class="bm-spec-row"><span>Shipping</span><span>Call for Quote</span></div>
          </div>
          <div class="bm-call-bar">📞 <strong>888-944-6313</strong> &nbsp;·&nbsp; 24/7 Live Operator &nbsp;·&nbsp; Call-in Orders Only</div>
        </div>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Close handlers
    function closeBunjiModal() {
      overlay.remove();
      document.body.style.overflow = '';
    }
    document.getElementById('bm-close-btn').addEventListener('click', closeBunjiModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeBunjiModal(); });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { closeBunjiModal(); document.removeEventListener('keydown', escHandler); }
    });

    // Qty controls
    const qtyInput = document.getElementById('bm-qty-input');
    document.getElementById('bm-qty-minus').addEventListener('click', () => {
      let v = parseInt(qtyInput.value) - 1;
      if (v < 1) v = 1;
      qtyInput.value = v;
    });
    document.getElementById('bm-qty-plus').addEventListener('click', () => {
      let v = parseInt(qtyInput.value) + 1;
      if (v > 999) v = 999;
      qtyInput.value = v;
    });

    // Copy part number
    document.getElementById('bm-copy-btn').addEventListener('click', () => {
      if (p.part) {
        navigator.clipboard.writeText(p.part).then(() => {
          const btn = document.getElementById('bm-copy-btn');
          if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { if (btn) btn.textContent = 'Copy'; }, 1500); }
        });
      }
    });

    // Add to Cart
    document.getElementById('bm-cart-btn').addEventListener('click', () => {
      const qtyVal = parseInt(qtyInput.value) || 1;
      let cart = JSON.parse(localStorage.getItem('kjr_cart') || '[]');
      const existing = cart.find(c => c.part === p.part);
      if (existing) { existing.qty += qtyVal; } else { cart.push({ name: p.name, part: p.part, price: p.price, qty: qtyVal }); }
      localStorage.setItem('kjr_cart', JSON.stringify(cart));
      const btn = document.getElementById('bm-cart-btn');
      if (btn) {
        btn.textContent = '✅ Added to Cart!';
        btn.style.background = '#16a34a';
        // Also show confirmation in chat
        addBubble(
          `🛒 Added to cart: ${p.name} × ${qtyVal}\n` +
          `Part #: ${p.part || 'N/A'} — ${p.price || 'Call for Price'}\n\n` +
          `Call 888-944-6313 (24/7) to complete your order!`,
          'bunji'
        );
        setTimeout(closeBunjiModal, 1200);
      }
    });

    // Buy Now
    document.getElementById('bm-order-btn').addEventListener('click', () => {
      const qtyVal = parseInt(qtyInput.value) || 1;
      let cart = JSON.parse(localStorage.getItem('kjr_cart') || '[]');
      const existing = cart.find(c => c.part === p.part);
      if (existing) { existing.qty += qtyVal; } else { cart.push({ name: p.name, part: p.part, price: p.price, qty: qtyVal }); }
      localStorage.setItem('kjr_cart', JSON.stringify(cart));
      closeBunjiModal();
      window.location.href = 'checkout.html';
    });
  }

  // ─── BOT COMMUNICATION ────────────────────────────────────────────────────
  async function sendToBot(text) {
    showTyping();
    try {
      const resp = await fetch(LOCAL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
        signal: AbortSignal.timeout(30000)   // 30s — allows for Render cold start
      });
      const data = await resp.json();
      hideTyping();

      if (resp.ok && data.reply) {
        addBubble(data.reply, 'bunji');
      } else {
        addBubble('I\'m having trouble connecting. Please call 888-944-6313 (24/7 Live Operator) or try again in a moment.', 'bunji');
      }
    } catch (e) {
      hideTyping();
      if (e.name === 'TimeoutError' || e.name === 'AbortError') {
        addBubble('The server is waking up — this can take up to 30 seconds on first load. Please send your message again in a moment, or call 888-944-6313 (24/7).', 'bunji');
      } else {
        addBubble('I\'m having trouble connecting right now. Please call 888-944-6313 (24/7 Live Operator) for immediate assistance.', 'bunji');
      }
    }
  }

  // ─── HANDLE USER INPUT ────────────────────────────────────────────────────
  function handleInput(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    inputEl.value = '';

    // ── Press 5: part / product search ──
    if (trimmed === '5') {
      addBubble('5', 'user');
      addBubble(
        'Welcome to KJ Appliance Parts! 🔍\n' +
        'KJRID is your Appliance Parts Dealer — A Partner with Encompass.\n\n' +
        'Enter a part number or product name below and I\'ll find it for you right away!',
        'bunji'
      );
      renderPartSearchPrompt();
      return;
    }

    // ── Waiting for a part search query ──
    if (awaitingPartSearch) {
      awaitingPartSearch = false;
      addBubble(trimmed, 'user');
      doPartSearch(trimmed);
      return;
    }

    // ── "brand" / "brands" keyword: show brand grid ──
    const lower = trimmed.toLowerCase();
    if (lower === 'brand' || lower === 'brands' || lower === 'show brands' || lower === 'view brands') {
      addBubble(trimmed, 'user');
      addBubble(
        '🏷️ Browse all our brands below!\n' +
        'We carry 350+ trusted brands. Click any brand to see its products:',
        'bunji'
      );
      renderBrandGrid();
      return;
    }

    // ── "vertical" / "verticals" keyword: show vertical grid ──
    if (lower === 'vertical' || lower === 'verticals' || lower === 'department' || lower === 'departments' || lower === 'show verticals') {
      addBubble(trimmed, 'user');
      addBubble(
        '🗂️ Browse by Department!\n' +
        'We cover 18 product verticals. Click any department to see its products:',
        'bunji'
      );
      renderVerticalGrid();
      return;
    }

    // ── Typing a number 1–68 while category grid is visible ──
    const num = parseInt(trimmed);
    if (!isNaN(num) && num >= 1 && num <= 68 && showingCategories) {
      showingCategories = false;
      addBubble(`Selected: ${PRODUCT_CATEGORIES[num - 1]}`, 'user');
      renderProductCards(PRODUCT_CATEGORIES[num - 1]);
      return;
    }

    // ── Everything else goes to bot ──
    addBubble(trimmed, 'user');
    sendToBot(trimmed);
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────
  toggleBtn.addEventListener('click', () => {
    chatWindow.classList.add('open');
    toggleBtn.style.display = 'none';
    if (!isInit) {
      isInit = true;
      sendToBot('hello');
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('open');
    toggleBtn.style.display = 'flex';
  });

  sendBtn.addEventListener('click', () => handleInput(inputEl.value));
  inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') handleInput(inputEl.value); });

  // Allow external triggers (e.g. from other page buttons)
  window.addEventListener('open-bunji', (e) => {
    chatWindow.classList.add('open');
    toggleBtn.style.display = 'none';
    if (!isInit) {
      isInit = true;
      sendToBot('hello').then(() => {
        if (e.detail && e.detail.message) handleInput(e.detail.message);
      });
    } else {
      if (e.detail && e.detail.message) handleInput(e.detail.message);
    }
  });

})();
