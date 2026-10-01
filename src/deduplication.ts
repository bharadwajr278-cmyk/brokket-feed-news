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
  return isNearDuplicateHeadline(left.title, right.title);
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
