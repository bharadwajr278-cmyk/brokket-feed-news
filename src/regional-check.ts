import assert from "node:assert/strict";
import { isRelevant } from "./index";
import { CITY_PATTERNS } from "./cities";
import { hasConfiguredRegionalLanguage, languagesForCity } from "./regional";
import { REGIONAL_CITY_SOURCES } from "./sources";

const codes = (city: string): string[] => languagesForCity(city).map(({ code }) => code);

assert.deepEqual(codes("chennai"), ["en", "hi", "ta"]);
assert.deepEqual(codes("mumbai"), ["en", "hi", "mr"]);
assert.deepEqual(codes("kolkata"), ["en", "hi", "bn"]);
assert.deepEqual(codes("noida"), ["en", "hi"]);
assert.deepEqual(codes("guwahati"), ["en", "hi", "as"]);
assert.deepEqual(
  CITY_PATTERNS.filter((city) => !hasConfiguredRegionalLanguage(city.code)).map((city) => city.code),
  [],
  "Every configured city must have an explicit state/regional language mapping",
);

const configuredCityCodes = new Set(CITY_PATTERNS.map((city) => city.code));
assert.deepEqual(
  REGIONAL_CITY_SOURCES.filter((entry) => !entry.cityCode || !configuredCityCodes.has(entry.cityCode)).map((entry) => entry.name),
  [],
  "Every geography-scoped source must reference a configured city code",
);
assert.equal(
  new Set(REGIONAL_CITY_SOURCES.map((entry) => entry.url.replace(/\/+$/, "").toLowerCase())).size,
  REGIONAL_CITY_SOURCES.length,
  "Geography-scoped source URLs must be unique",
);

assert.equal(isRelevant("लखनऊ में नया आवास और मेट्रो निर्माण परियोजना मंजूर"), true);
assert.equal(isRelevant("चेन्नई में रियल एस्टेट திட்டம் और கட்டுமானம் शुरू"), true);
assert.equal(isRelevant("హైదరాబాద్ మెట్రో నిర్మాణం ప్రాజెక్టుకు ఆమోదం"), true);
assert.equal(isRelevant("ಮೈಸೂರು ಮೂಲಸೌಕರ್ಯ ನಿರ್ಮಾಣ ಯೋಜನೆಗೆ ಅನುಮೋದನೆ"), true);
assert.equal(isRelevant("കൊച്ചിയിൽ മെട്രോ നിർമ്മാണം പദ്ധതി വികസനം"), true);

assert.equal(isRelevant("प्रॉपर्टी डीलर के घर चोरी और लूट, आरोपी गिरफ्तार"), false);
assert.equal(isRelevant("नशे के कारोबार की कमाई पर पुलिस का शिकंजा, 40 लाख की संपत्ति जब्त"), false);
assert.equal(isRelevant("पत्नी के पिता के पैसों से खरीदी संपत्ति पर हाईकोर्ट का फैसला"), false);
assert.equal(isRelevant("भू-माफिया का अवैध कब्जा, करोड़ों की संपत्ति जब्त"), false);
assert.equal(isRelevant("கட்டிடத்தில் கொலை மற்றும் கொள்ளை தொடர்பாக கைது"), false);
assert.equal(isRelevant("ఆస్తి వివాదంలో హత్య కేసు అరెస్ట్"), false);
assert.equal(isRelevant("ಜಮೀನು ವಿವಾದದಲ್ಲಿ ಕೊಲೆ ಮತ್ತು ಬಂಧನ"), false);
assert.equal(isRelevant("വസ്തു തർക്കത്തിൽ കൊലപാതകം, അറസ്റ്റ്"), false);

console.log("Regional-language configuration and relevance checks passed.");
