export type NewsLanguage = "en" | "hi" | "mr" | "ta" | "te" | "gu" | "bn" | "kn" | "ml" | "or" | "pa" | "as";

export type LanguageProfile = {
  code: NewsLanguage;
  name: string;
  googleLocale: string;
  queryTerms: readonly string[];
};

const PROFILES: Record<NewsLanguage, LanguageProfile> = {
  en: {
    code: "en", name: "English", googleLocale: "en-IN",
    queryTerms: ["real estate", "property", "housing", "construction", "infrastructure", "metro", "expressway", "RERA", "land acquisition"],
  },
  hi: {
    code: "hi", name: "Hindi", googleLocale: "hi",
    queryTerms: ["रियल एस्टेट", "संपत्ति", "आवास", "निर्माण", "बुनियादी ढांचा", "मेट्रो", "एक्सप्रेसवे", "रेरा", "भूमि अधिग्रहण", "शहरी विकास"],
  },
  mr: {
    code: "mr", name: "Marathi", googleLocale: "mr",
    queryTerms: ["रिअल इस्टेट", "मालमत्ता", "गृहनिर्माण", "बांधकाम", "पायाभूत सुविधा", "मेट्रो", "महामार्ग", "रेरा", "भूसंपादन", "शहरी विकास"],
  },
  ta: {
    code: "ta", name: "Tamil", googleLocale: "ta",
    queryTerms: ["ரியல் எஸ்டேட்", "சொத்து", "வீட்டுவசதி", "கட்டுமானம்", "உள்கட்டமைப்பு", "மெட்ரோ", "விரைவுச்சாலை", "ரேரா", "நிலம் கையகப்படுத்துதல்", "நகர்ப்புற வளர்ச்சி"],
  },
  te: {
    code: "te", name: "Telugu", googleLocale: "te",
    queryTerms: ["రియల్ ఎస్టేట్", "ఆస్తి", "గృహ నిర్మాణం", "నిర్మాణం", "మౌలిక సదుపాయాలు", "మెట్రో", "ఎక్స్‌ప్రెస్‌వే", "రెరా", "భూసేకరణ", "పట్టణ అభివృద్ధి"],
  },
  gu: {
    code: "gu", name: "Gujarati", googleLocale: "gu",
    queryTerms: ["રિયલ એસ્ટેટ", "મિલકત", "આવાસ", "બાંધકામ", "ઈન્ફ્રાસ્ટ્રક્ચર", "મેટ્રો", "એક્સપ્રેસવે", "રેરા", "જમીન સંપાદન", "શહેરી વિકાસ"],
  },
  bn: {
    code: "bn", name: "Bengali", googleLocale: "bn",
    queryTerms: ["রিয়েল এস্টেট", "সম্পত্তি", "আবাসন", "নির্মাণ", "পরিকাঠামো", "মেট্রো", "এক্সপ্রেসওয়ে", "রেরা", "জমি অধিগ্রহণ", "নগর উন্নয়ন"],
  },
  kn: {
    code: "kn", name: "Kannada", googleLocale: "kn",
    queryTerms: ["ರಿಯಲ್ ಎಸ್ಟೇಟ್", "ಆಸ್ತಿ", "ವಸತಿ", "ನಿರ್ಮಾಣ", "ಮೂಲಸೌಕರ್ಯ", "ಮೆಟ್ರೋ", "ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇ", "ರೇರಾ", "ಭೂಸ್ವಾಧೀನ", "ನಗರಾಭಿವೃದ್ಧಿ"],
  },
  ml: {
    code: "ml", name: "Malayalam", googleLocale: "ml",
    queryTerms: ["റിയൽ എസ്റ്റേറ്റ്", "വസ്തു", "ഭവന നിർമ്മാണം", "നിർമ്മാണം", "അടിസ്ഥാന സൗകര്യം", "മെട്രോ", "എക്സ്പ്രസ് വേ", "റെറ", "ഭൂമി ഏറ്റെടുക്കൽ", "നഗര വികസനം"],
  },
  or: {
    code: "or", name: "Odia", googleLocale: "or",
    queryTerms: ["ରିଅଲ୍ ଇଷ୍ଟେଟ୍", "ସମ୍ପତ୍ତି", "ଗୃହ ନିର୍ମାଣ", "ନିର୍ମାଣ", "ଭିତ୍ତିଭୂମି", "ମେଟ୍ରୋ", "ଏକ୍ସପ୍ରେସୱେ", "ରେରା", "ଜମି ଅଧିଗ୍ରହଣ", "ସହରୀ ବିକାଶ"],
  },
  pa: {
    code: "pa", name: "Punjabi", googleLocale: "pa",
    queryTerms: ["ਰੀਅਲ ਅਸਟੇਟ", "ਜਾਇਦਾਦ", "ਰਿਹਾਇਸ਼", "ਉਸਾਰੀ", "ਬੁਨਿਆਦੀ ਢਾਂਚਾ", "ਮੈਟਰੋ", "ਐਕਸਪ੍ਰੈਸਵੇ", "ਰੇਰਾ", "ਜ਼ਮੀਨ ਪ੍ਰਾਪਤੀ", "ਸ਼ਹਿਰੀ ਵਿਕਾਸ"],
  },
  as: {
    code: "as", name: "Assamese", googleLocale: "as",
    queryTerms: ["ৰিয়েল এষ্টেট", "সম্পত্তি", "গৃহ নিৰ্মাণ", "নিৰ্মাণ", "আন্তঃগাঁথনি", "মেট্ৰো", "এক্সপ্ৰেছৱে", "ৰেৰা", "ভূমি অধিগ্ৰহণ", "নগৰ উন্নয়ন"],
  },
};

const CITY_LANGUAGE_GROUPS: ReadonlyArray<{ language: NewsLanguage; cities: readonly string[] }> = [
  { language: "hi", cities: [
    "greater-noida", "noida", "kota-chhattisgarh", "sri-ganganagar", "kurukshetra", "yamunanagar", "rajnandgaon",
    "hanumangarh", "chhindwara", "jamshedpur", "faridabad", "panchkula", "burhanpur", "delhi-ncr", "new-delhi",
    "delhi", "rishikesh", "prayagraj", "barabanki", "firozabad", "ghaziabad", "gorakhpur", "moradabad", "vrindavan",
    "gurugram", "jabalpur", "khargone", "mandsaur", "bilaspur", "dehradun", "haridwar", "rudrapur", "bhilwara",
    "jhalawar", "neemrana", "bareilly", "varanasi", "panipat", "sonipat", "gwalior", "khandwa", "neemuch",
    "dhanbad", "roorkee", "bhiwadi", "bikaner", "jodhpur", "udaipur", "aligarh", "lucknow", "mathura", "ambala",
    "karnal", "palwal", "rewari", "rohtak", "bhopal", "indore", "ratlam", "sehore", "ujjain", "bhilai", "raipur",
    "ranchi", "shimla", "barmer", "jaipur", "nagaur", "sirohi", "jhansi", "kanpur", "meerut", "betul", "damoh",
    "dewas", "sagar", "satna", "seoni", "korba", "solan", "ajmer", "alwar", "sikar", "hapur", "rewa", "durg",
    "kota", "pali", "tonk", "agra",
  ] },
  { language: "mr", cities: [
    "aurangabad", "ahmednagar", "ahmadnagar", "navi-mumbai", "chandrapur", "sindhudurg", "osmanabad", "ratnagiri", "amravati",
    "kolhapur", "yavatmal", "jalgaon", "palghar", "solapur", "mumbai", "nagpur", "nanded", "nashik", "raigad",
    "sangli", "wardha", "akola", "dhule", "jalna", "latur", "beed", "pune",
  ] },
  { language: "ml", cities: ["thiruvananthapuram", "calicut", "kozhikode", "ernakulam", "palakkad", "thrissur", "kochi"] },
  { language: "ta", cities: [
    "tiruchirappalli", "tiruvannamalai", "pudukkottai", "thoothukudi", "tirunelveli", "coimbatore", "cuddalore",
    "thanjavur", "dindigul", "namakkal", "tambaram", "tiruppur", "chennai", "madurai", "vellore", "avadi", "erode",
    "hosur", "karur", "salem", "pondicherry", "puducherry",
  ] },
  { language: "te", cities: [
    "visakhapatnam", "west-godavari", "vizianagaram", "rajahmundry", "bhimavaram", "srikakulam", "vijayawada",
    "anantapur", "chittoor", "kakinada", "tirupati", "krishna", "kurnool", "nellore", "kadapa", "eluru",
    "mahabubnagar", "karimnagar", "mancherial", "hyderabad", "nizamabad", "nalgonda", "suryapet", "warangal", "khammam",
  ] },
  { language: "gu", cities: [
    "daman-and-diu", "silvassa", "surendranagar", "vadodara", "banaskantha", "gandhinagar", "sabarkantha", "ahmedabad",
    "bhavnagar", "junagadh", "bardoli", "bharuch", "dholera", "gujarat", "navsari", "rajkot", "valsad", "anand",
    "kalol", "kheda", "kutch", "patan", "surat", "vapi",
  ] },
  { language: "bn", cities: ["durgapur", "kolkata", "siliguri", "asansol", "howrah", "agartala"] },
  { language: "kn", cities: ["bangalore", "bengaluru", "mangalore", "mangaluru", "belgaum", "belagavi", "mysore", "mysuru", "hubli", "udupi"] },
  { language: "or", cities: ["bhubaneswar", "berhampur", "sambalpur", "balasore", "rourkela", "cuttack", "puri"] },
  { language: "pa", cities: ["chandigarh", "hoshiarpur", "jalandhar", "amritsar", "bhatinda", "bathinda", "ludhiana", "patiala", "sangrur", "mohali"] },
  { language: "as", cities: ["dibrugarh", "golaghat", "guwahati", "marigaon", "tinsukia", "nalbari", "silchar", "jorhat", "kamrup", "nagaon", "tezpur"] },
  // Konkani coverage in Google News is limited; Goa's major local-language
  // digital publishers commonly use Marathi, so it is the regional fallback.
  { language: "mr", cities: ["goa"] },
];

const REGIONAL_LANGUAGE_BY_CITY = new Map<string, NewsLanguage>(
  CITY_LANGUAGE_GROUPS.flatMap(({ language, cities }) => cities.map((city) => [city, language] as const)),
);

export const REGIONAL_PROPERTY_TERMS = [
  "रियल एस्टेट", "संपत्ति", "आवास", "गृहनिर्माण", "मालमत्ता", "रिअल इस्टेट", "ரியல் எஸ்டேட்", "சொத்து", "வீட்டுவசதி",
  "రియల్ ఎస్టేట్", "ఆస్తి", "గృహ నిర్మాణం", "રિયલ એસ્ટેટ", "મિલકત", "આવાસ", "রিয়েল এস্টেট", "সম্পত্তি", "আবাসন",
  "ರಿಯಲ್ ಎಸ್ಟೇಟ್", "ಆಸ್ತಿ", "ವಸತಿ", "റിയൽ എസ്റ്റേറ്റ്", "വസ്തു", "ഭവന നിർമ്മാണം", "ରିଅଲ୍ ଇଷ୍ଟେଟ୍", "ସମ୍ପତ୍ତି",
  "ଗୃହ ନିର୍ମାଣ", "ਰੀਅਲ ਅਸਟੇਟ", "ਜਾਇਦਾਦ", "ਰਿਹਾਇਸ਼", "ৰিয়েল এষ্টেট", "সম্পত্তি", "গৃহ নিৰ্মাণ",
] as const;

export const REGIONAL_INFRASTRUCTURE_TERMS = [
  "बुनियादी ढांचा", "मेट्रो", "एक्सप्रेसवे", "पायाभूत सुविधा", "महामार्ग", "உள்கட்டமைப்பு", "மெட்ரோ", "விரைவுச்சாலை",
  "మౌలిక సదుపాయాలు", "మెట్రో", "ఎక్స్‌ప్రెస్‌వే", "ઈન્ફ્રાસ્ટ્રક્ચર", "મેટ્રો", "એક્સપ્રેસવે", "পরিকাঠামো", "মেট্রো",
  "এক্সপ্রেসওয়ে", "ಮೂಲಸೌಕರ್ಯ", "ಮೆಟ್ರೋ", "ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇ", "അടിസ്ഥാന സൗകര്യം", "മെട്രോ", "എക്സ്പ്രസ് വേ",
  "ଭିତ୍ତିଭୂମି", "ମେଟ୍ରୋ", "ଏକ୍ସପ୍ରେସୱେ", "ਬੁਨਿਆਦੀ ਢਾਂਚਾ", "ਮੈਟਰੋ", "ਐਕਸਪ੍ਰੈਸਵੇ", "আন্তঃগাঁথনি", "মেট্ৰো", "এক্সপ্ৰেছৱে",
] as const;

export const REGIONAL_DEVELOPMENT_ACTION_TERMS = [
  "निर्माण", "विकास", "परियोजना", "मंजूरी", "भूमि अधिग्रहण", "बांधकाम", "विकास", "प्रकल्प", "भूसंपादन",
  "கட்டுமானம்", "வளர்ச்சி", "திட்டம்", "நிலம் கையகப்படுத்துதல்", "నిర్మాణం", "అభివృద్ధి", "ప్రాజెక్టు", "భూసేకరణ",
  "બાંધકામ", "વિકાસ", "પ્રોજેક્ટ", "જમીન સંપાદન", "নির্মাণ", "উন্নয়ন", "প্রকল্প", "জমি অধিগ্রহণ",
  "ನಿರ್ಮಾಣ", "ಅಭಿವೃದ್ಧಿ", "ಯೋಜನೆ", "ಭೂಸ್ವಾಧೀನ", "നിർമ്മാണം", "വികസനം", "പദ്ധതി", "ഭൂമി ഏറ്റെടുക്കൽ",
  "ନିର୍ମାଣ", "ବିକାଶ", "ପ୍ରକଳ୍ପ", "ଜମି ଅଧିଗ୍ରହଣ", "ਉਸਾਰੀ", "ਵਿਕਾਸ", "ਪ੍ਰੋਜੈਕਟ", "ਜ਼ਮੀਨ ਪ੍ਰਾਪਤੀ",
  "নিৰ্মাণ", "উন্নয়ন", "প্ৰকল্প", "ভূমি অধিগ্ৰহণ",
] as const;

export const REGIONAL_EXCLUDED_TERMS = [
  "हत्या", "चोरी", "डकैती", "लूट", "हमला", "बलात्कार", "अपराध", "गिरफ्तार", "मौत", "दुर्घटना",
  "खून", "अपहरण", "गोलीबारी", "हताहत", "आत्महत्या", "अपघात", "दरोडा", "हल्ला", "गुन्हा", "अटक",
  "கொலை", "திருட்டு", "கொள்ளை", "தாக்குதல்", "பாலியல் வன்கொடுமை", "குற்றம்", "கைது", "மரணம்", "விபத்து",
  "హత్య", "దొంగతనం", "దోపిడీ", "దాడి", "అత్యాచారం", "నేరం", "అరెస్ట్", "మరణం", "ప్రమాదం",
  "હત્યા", "ચોરી", "લૂંટ", "હુમલો", "બળાત્કાર", "ગુનો", "ધરપકડ", "મૃત્યુ", "અકસમાત",
  "খুন", "হত্যা", "চুরি", "ডাকাতি", "হামলা", "ধর্ষণ", "অপরাধ", "গ্রেফতার", "মৃত্যু", "দুর্ঘটনা",
  "ಕೊಲೆ", "ಕಳ್ಳತನ", "ದರೋಡೆ", "ದಾಳಿ", "ಅತ್ಯಾಚಾರ", "ಅಪರಾಧ", "ಬಂಧನ", "ಸಾವು", "ಅಪಘಾತ",
  "കൊലപാതകം", "മോഷണം", "കവർച്ച", "ആക്രമണം", "ബലാത്സംഗം", "കുറ്റകൃത്യം", "അറസ്റ്റ്", "മരണം", "അപകടം",
  "ହତ୍ୟା", "ଚୋରି", "ଡକାୟତି", "ଆକ୍ରମଣ", "ଦୁଷ୍କର୍ମ", "ଅପରାଧ", "ଗିରଫ", "ମୃତ୍ୟୁ", "ଦୁର୍ଘଟଣା",
  "ਕਤਲ", "ਚੋਰੀ", "ਡਕੈਤੀ", "ਹਮਲਾ", "ਬਲਾਤਕਾਰ", "ਅਪਰਾਧ", "ਗ੍ਰਿਫਤਾਰ", "ਮੌਤ", "ਹਾਦਸਾ",
  "হত্যা", "চুৰি", "ডকাইতি", "আক্ৰমণ", "ধৰ্ষণ", "অপৰাধ", "গ্ৰেপ্তাৰ", "মৃত্যু", "দুৰ্ঘটনা",
] as const;

export function languageProfile(code: NewsLanguage): LanguageProfile {
  return PROFILES[code];
}

export function languagesForCity(cityCode: string): LanguageProfile[] {
  const local = REGIONAL_LANGUAGE_BY_CITY.get(cityCode) ?? "hi";
  return [...new Set<NewsLanguage>(["en", "hi", local])].map(languageProfile);
}

export function hasConfiguredRegionalLanguage(cityCode: string): boolean {
  return REGIONAL_LANGUAGE_BY_CITY.has(cityCode);
}

export function googleNewsLocale(profile: LanguageProfile): string {
  return `hl=${encodeURIComponent(profile.googleLocale)}&gl=IN&ceid=${encodeURIComponent(`IN:${profile.code}`)}`;
}

export function languageQuery(profile: LanguageProfile): string {
  return profile.queryTerms.map((term) => term.includes(" ") ? `"${term}"` : term).join(" OR ");
}
