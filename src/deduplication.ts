export type DeduplicationRecord = {
  code: string;
  title: string;
  description: string;
  isActive: boolean;
  newsLink: string;
  thumbnailImage: string;
  publisherName: string;
  publisherTagline: string;
  publisherLogo: string;
  sourceName: string;
  sourceLogo: string;
  publishedAt: string;
  cityCode: string;
};

const STOP_WORDS = new Set([
  "a", "an", "and", "as", "at", "by", "for", "from", "his", "in", "into",
  "is", "new", "of", "on", "rs", "s", "the", "their", "to", "with",
]);
const GENERIC_EVENT_WORDS = new Set([
  "build", "crore", "develop", "development", "housing", "invest", "investment",
  "launch", "luxury", "makes", "project", "projects", "properties", "property",
  "realty", "residential", "scheme", "worth",
]);
const GENERIC_AUTHORITY_WORDS = new Set([
  "authority", "court", "department", "government", "govt", "municipal", "news", "police", "rera",
]);

const SEMANTIC_CONCEPTS: ReadonlyArray<readonly [string, RegExp]> = [
  ["housing", /(?:housing|home|homes|house|flat|apartment|आवास|घर|मकान|फ्लैट|गृहनिर्माण|आवासीय|வீடு|குடியிருப்பு|ఇల్లు|గృహ|ಮನೆ|ವಸತಿ|ഭവന|വീട്|আবাসন|বাড়ি|આવાસ|મકાન)/iu],
  ["metro", /(?:metro|मेट्रो|மெட்ரோ|మెట్రో|ಮೆಟ್ರೋ|മെട്രോ|মেট্রো|મેટ્રો)/iu],
  ["road", /(?:road|highway|expressway|flyover|bridge|corridor|सड़क|मार्ग|राजमार्ग|एक्सप्रेसवे|पुल|गलियारा|சாலை|மேம்பாலம்|நெடுஞ்சாலை|రోడ్డు|రహదారి|వంతెన|ರಸ್ತೆ|ಹೆದ್ದಾರಿ|ಸೇತುವೆ|റോഡ്|പാലം|রাস্তা|সেতু|રોડ|હાઇવે|પુલ)/iu],
  ["land", /(?:land|plot|parcel|acre|जमीन|भूमि|भूखंड|एकड़|जमीन|जमीन|நிலம்|ஏக்கர்|భూమి|ఎకర|ಜಮೀನು|ಎಕರೆ|ഭൂമി|ഏക്കർ|জমি|একর|જમીન|એકર)/iu],
  ["property", /(?:property|real estate|realty|संपत्ति|प्रॉपर्टी|रियल एस्टेट|मालमत्ता|சொத்து|ரியல் எஸ்டேட்|ఆస్తి|రియల్ ఎస్టేట్|ಆಸ್ತಿ|ರಿಯಲ್ ಎಸ್ಟೇಟ್|വസ്തു|റിയൽ എസ്റ്റേറ്റ്|সম্পত্তি|রিয়েল এস্টেট|મિલકત|રિયલ એસ્ટેટ)/iu],
  ["construction", /(?:construction|build|building|निर्माण|बांधकाम|கட்டுமான|నిర్మాణ|ಕಟ್ಟಡ|ನಿರ್ಮಾಣ|നിർമ്മാണ|নির্মাণ|બાંધકામ)/iu],
  ["project", /(?:project|परियोजना|प्रोजेक्ट|योजना|प्रकल्प|திட்டம்|ప్రాజెక్టు|పథకం|ಯೋಜನೆ|പദ്ധതി|প্রকল্প|প্রকল্প|યોજના|પ્રોજેક્ટ)/iu],
  ["investment", /(?:invest|investment|funding|निवेश|निधि|गुंतवणूक|முதலீடு|పెట్టుబడి|ಹೂಡಿಕೆ|നിക്ഷേപം|বিনিয়োগ|રોકાણ)/iu],
  ["approval", /(?:approv|clearance|nod|मंजूर|मंजूरी|स्वीकृति|मान्यता|ஒப்புதல்|அனுமதி|ఆమోదం|అనుమతి|ಅನುಮೋದನೆ|ಅನುಮತಿ|അനുമതി|അംഗീകാരം|অনুমোদন|ছাড়পত্র|મંજૂરી|મંજૂર)/iu],
  ["launch", /(?:launch|unveil|announce|शुरू|आरंभ|लॉन्च|घोषणा|सुरू|தொடக்கம்|அறிவிப்பு|ప్రారంభం|ప్రకటన|ಆರಂಭ|ಘೋಷಣೆ|തുടക്കം|പ്രഖ്യാപനം|শুরু|ঘোষণা|શરૂ|જાહેરાત)/iu],
  ["acquisition", /(?:acquir|purchase|buy|deal|अधिग्रहण|खरीद|सौदा|खरेदी|கையகப்படுத்த|வாங்க|కొనుగోలు|ಸ್ವಾಧೀನ|ಖರೀದಿ|ഏറ്റെടുക്കൽ|വാങ്ങൽ|অধিগ্রহণ|ক্রয়|ખરીદી|સોદો)/iu],
  ["registration", /(?:registration|registry|stamp duty|पंजीकरण|रजिस्ट्रेशन|रजिस्ट्री|स्टांप शुल्क|नोंदणी|பதிவு|முத்திரை|రిజిస్ట్రేషన్|ನೋಂದಣಿ|രജിസ്ട്രേഷൻ|নিবন্ধন|রেজিস্ট্রি|નોંધણી)/iu],
  ["tax", /(?:property tax|tax|कर|टैक्स|मालमत्ता कर|வரி|పన్ను|ತೆರಿಗೆ|നികുതി|কর|વેરો|ટેક્સ)/iu],
  ["rera", /(?:rera|रेरा|ரேரா|రెరా|ರೆರಾ|റെറ|রেরা|રેરા)/iu],
  ["airport", /(?:airport|aerocity|हवाई अड्ड|एयरपोर्ट|विमानतळ|விமான நிலைய|విమానాశ్రయ|ವಿಮಾನ ನಿಲ್ದಾಣ|വിമാനത്താവളം|বিমানবন্দর|એરપોર્ટ|વિમાનમથક)/iu],
];

const NATIVE_SCRIPT = /[\u0900-\u097f\u0980-\u09ff\u0a00-\u0a7f\u0a80-\u0aff\u0b00-\u0b7f\u0b80-\u0bff\u0c00-\u0c7f\u0c80-\u0cff\u0d00-\u0d7f]/u;

function semanticConcepts(value: string): Set<string> {
  return new Set(SEMANTIC_CONCEPTS.filter(([, pattern]) => pattern.test(value)).map(([name]) => name));
}

function numericAnchors(value: string): Set<string> {
  const converted = value.replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)));
  return new Set(
    [...converted.matchAll(/\b\d[\d,]*(?:\.\d+)?\b/g)]
      .map(([number]) => number.replace(/,/g, ""))
      .filter((number) => {
        const numeric = Number(number);
        return numeric >= 10 && !(numeric >= 1900 && numeric <= 2100);
      }),
  );
}

function distinctiveLatinTokens(value: string, cityCode = ""): Set<string> {
  const cityTokens = new Set(cityCode.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  return new Set(
    value.toLocaleLowerCase("en-IN").match(/[a-z][a-z0-9-]{2,}/g)?.filter((token) =>
      !STOP_WORDS.has(token)
      && !GENERIC_EVENT_WORDS.has(token)
      && !GENERIC_AUTHORITY_WORDS.has(token)
      && !cityTokens.has(token)
      && ![
        "news", "india", "city", "real", "estate", "infra", "crore", "housing", "home", "homes",
        "house", "plot", "plots", "hotel", "hotels", "airport", "expressway", "highway", "road", "metro",
        "scheme", "registration", "property", "residential", "commercial", "construction",
      ].includes(token)
    ) ?? [],
  );
}

export function isCrossLanguageDuplicate(
  left: Pick<DeduplicationRecord, "title" | "description" | "cityCode" | "publishedAt">,
  right: Pick<DeduplicationRecord, "title" | "description" | "cityCode" | "publishedAt">,
): boolean {
  if (!left.cityCode || left.cityCode !== right.cityCode) return false;
  if (NATIVE_SCRIPT.test(left.title) === NATIVE_SCRIPT.test(right.title)) return false;
  const leftTime = timestamp(left.publishedAt);
  const rightTime = timestamp(right.publishedAt);
  if (leftTime && rightTime && Math.abs(leftTime - rightTime) > 4 * 24 * 60 * 60 * 1_000) return false;

  const leftText = `${left.title} ${left.description || ""}`;
  const rightText = `${right.title} ${right.description || ""}`;
  const leftConcepts = semanticConcepts(leftText);
  const rightConcepts = semanticConcepts(rightText);
  const sharedConcepts = [...leftConcepts].filter((concept) => rightConcepts.has(concept));
  if (sharedConcepts.length < 2) return false;

  const rightNumbers = numericAnchors(rightText);
  const sharedNumbers = [...numericAnchors(leftText)].filter((number) => rightNumbers.has(number));
  const rightEntities = distinctiveLatinTokens(rightText, right.cityCode);
  const sharedEntities = [...distinctiveLatinTokens(leftText, left.cityCode)].filter((token) => rightEntities.has(token));
  return (sharedNumbers.length > 0 && sharedConcepts.length >= 3)
    || (sharedNumbers.length > 0 && sharedConcepts.some((concept) =>
      ["registration", "rera", "metro", "airport", "acquisition", "investment", "tax", "road"].includes(concept)
    ))
    || (sharedNumbers.length > 0 && sharedEntities.length > 0)
    || sharedEntities.length >= 2;
}

function normalisedTitle(value: string): string {
  return value.toLocaleLowerCase("en-IN")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(value: string): Set<string> {
  return new Set(normalisedTitle(value).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token)));
}

function amountAnchors(value: string): Set<string> {
  const anchors = new Set<string>();
  for (const match of value.toLocaleLowerCase("en-IN").matchAll(
    /(\d[\d,]*(?:\.\d+)?)\s*(cr(?:ore)?s?|lakhs?|millions?|billions?|acres?|sq\.?\s*ft|square\s+feet|km|kilometres?)/g,
  )) {
    const rawUnit = match[2]!.replace(/[.\s]+/g, "");
    const unit = /^cr(?:ore)?s?$/.test(rawUnit)
      ? "crore"
      : /^lakhs?$/.test(rawUnit) ? "lakh" : rawUnit.replace(/s$/, "");
    anchors.add(`${match[1]!.replace(/,/g, "")}:${unit}`);
  }
  return anchors;
}

function entityPrefix(value: string): string {
  return [...titleTokens(value)].slice(0, 2).join(" ");
}

export function isNearDuplicateHeadline(left: string, right: string): boolean {
  const leftTokens = titleTokens(left);
  const rightTokens = titleTokens(right);
  if (leftTokens.size < 5 || rightTokens.size < 5) return false;
  const leftAmounts = amountAnchors(left);
  const rightAmounts = amountAnchors(right);
  const sharedAmounts = [...leftAmounts].filter((value) => rightAmounts.has(value));
  const shared = [...leftTokens].filter((token) => rightTokens.has(token));
  const union = new Set([...leftTokens, ...rightTokens]).size;
  if (shared.length >= 5 && shared.length / union >= 0.72) {
    return !(leftAmounts.size && rightAmounts.size && sharedAmounts.length === 0);
  }
  const leftEntity = entityPrefix(left);
  const entityIsAuthority = leftEntity.split(" ").some((token) => GENERIC_AUTHORITY_WORDS.has(token));
  const sameEntity = leftEntity.length >= 5 && !entityIsAuthority && leftEntity === entityPrefix(right);
  if (!sameEntity) return false;
  const entityWords = new Set(entityPrefix(left).split(" "));
  const sharedSpecific = shared.filter((token) =>
    !entityWords.has(token)
    && !GENERIC_EVENT_WORDS.has(token)
    && !/^\d+$/.test(token),
  );
  return sharedAmounts.length > 0 || sharedSpecific.length >= 2;
}

function canonicalUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().toLowerCase();
  } catch {
    return "";
  }
}

function timestamp(value: string): number {
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/);
  if (!match) return 0;
  return Date.UTC(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0),
  );
}

function isNearDuplicate(left: DeduplicationRecord, right: DeduplicationRecord): boolean {
  if (!left.cityCode || left.cityCode !== right.cityCode) return false;
  const leftTime = timestamp(left.publishedAt);
  const rightTime = timestamp(right.publishedAt);
  if (leftTime && rightTime && Math.abs(leftTime - rightTime) > 7 * 24 * 60 * 60 * 1_000) return false;
  return isNearDuplicateHeadline(left.title, right.title) || isCrossLanguageDuplicate(left, right);
}

function sameStory(left: DeduplicationRecord, right: DeduplicationRecord): boolean {
  const leftUrl = canonicalUrl(left.newsLink);
  const rightUrl = canonicalUrl(right.newsLink);
  if (leftUrl && leftUrl === rightUrl) return true;
  if (normalisedTitle(left.title) === normalisedTitle(right.title)) return true;
  return isNearDuplicate(left, right);
}

function qualityScore(item: DeduplicationRecord): number {
  const imageScore = /^https:\/\//i.test(item.thumbnailImage || "") ? 2_000 : 0;
  const linkScore = /^https:\/\//i.test(item.newsLink || "") ? 1_000 : 0;
  const descriptionScore = Math.min((item.description || "").length, 900);
  const activeScore = item.isActive ? 500 : 0;
  return imageScore + linkScore + descriptionScore + activeScore;
}

export function duplicateGroups(items: DeduplicationRecord[]): DeduplicationRecord[][] {
  const parent = items.map((_item, index) => index);
  const find = (value: number): number => {
    let current = value;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]!]!;
      current = parent[current]!;
    }
    return current;
  };
  const union = (left: number, right: number): void => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      if (sameStory(items[left]!, items[right]!)) union(left, right);
    }
  }
  const groups = new Map<number, DeduplicationRecord[]>();
  items.forEach((item, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), item]);
  });
  return [...groups.values()].filter((group) => group.length > 1);
}

export function duplicateLoserCodes(items: DeduplicationRecord[]): Set<string> {
  const losers = new Set<string>();
  for (const group of duplicateGroups(items)) {
    const keeper = [...group].sort((left, right) =>
      qualityScore(right) - qualityScore(left)
      || timestamp(left.publishedAt) - timestamp(right.publishedAt)
      || left.code.localeCompare(right.code),
    )[0]!;
    group.filter((item) => item.code !== keeper.code).forEach((item) => losers.add(item.code));
  }
  return losers;
}
